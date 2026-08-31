import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const helpersDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(helpersDir, '..', '..');

/** Port the self-started e2e Pod listens on (distinct from a dev Pod on 3000). */
export const POD_PORT = Number(process.env.E2E_POD_PORT ?? 3001);
/** Origin of the e2e Pod. Overridable, but defaults to the 3001 instance. */
export const POD_ORIGIN = (process.env.E2E_POD_ORIGIN ?? `http://localhost:${POD_PORT}`).replace(/\/$/, '');

const CONTAINER = 'css-e2e';
const IMAGE = 'solidproject/community-server:7.2.0';

const dataSrc = join(repoRoot, 'community-solid-server', '.volumes', 'data');
const configDir = join(repoRoot, 'community-solid-server', 'config');
const podData = join(repoRoot, 'e2e', '.pod-data');

// The committed seed is served on localhost:3000; we rewrite a copy to POD_ORIGIN's host:port.
const SRC_HOSTPORT = 'localhost:3000';
const targetHostPort = POD_ORIGIN.replace(/^https?:\/\//, '');
const encode = (hp: string) => hp.replace(':', '%3A');

/** Recursively list every file (not directory) under `dir`. */
function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

/**
 * Build a gitignored throwaway copy of the seed with its localhost:3000
 * identifiers (resource content and URL-encoded internal index filenames)
 * rewritten to the e2e Pod's host:port, so WebID / OIDC issuer / resource URIs
 * are internally consistent. The committed seed is never touched.
 */
// Transient CSS runtime state (gitignored) that a fresh Pod regenerates: OIDC
// adapter tokens/sessions/clients, login cookies, resource locks. Excluding it
// keeps the copy stable even while a dev Pod is actively churning these, and
// gives each run clean sessions. The account data (accounts/) and signing keys
// (idp/keys) — which login needs — are kept.
const EXCLUDE_FRAGMENTS = ['/.internal/idp/adapter', '/.internal/accounts/cookies', '/.internal/locks'];

export function prepareData(): void {
  rmSync(podData, { recursive: true, force: true });
  cpSync(dataSrc, podData, {
    recursive: true,
    filter: (src) => {
      const rel = src.slice(dataSrc.length);
      return !EXCLUDE_FRAGMENTS.some((frag) => rel.includes(frag));
    },
  });

  // 1. Rewrite file contents (both plain and URL-encoded host:port forms).
  for (const file of walkFiles(podData)) {
    const original = readFileSync(file, 'utf8');
    const rewritten = original
      .split(SRC_HOSTPORT).join(targetHostPort)
      .split(encode(SRC_HOSTPORT)).join(encode(targetHostPort));
    if (rewritten !== original) writeFileSync(file, rewritten);
  }

  // 2. Rename files whose names encode the source host:port (the pod-baseUrl and
  //    webIdLink/webId account indexes, e.g. ...localhost%3A3000%2F...$.json).
  for (const file of walkFiles(podData)) {
    const name = basename(file);
    if (name.includes(encode(SRC_HOSTPORT))) {
      const renamed = join(dirname(file), name.split(encode(SRC_HOSTPORT)).join(encode(targetHostPort)));
      renameSync(file, renamed);
    }
  }

  // 3. Fail loudly if any source reference survived — a missed one silently
  //    breaks login or the cellar→bottle links.
  const leftovers = walkFiles(podData).filter((file) => {
    if (basename(file).includes(encode(SRC_HOSTPORT))) return true;
    const content = readFileSync(file, 'utf8');
    return content.includes(SRC_HOSTPORT) || content.includes(encode(SRC_HOSTPORT));
  });
  if (leftovers.length > 0) {
    throw new Error(
      `prepareData: ${leftovers.length} file(s) still reference ${SRC_HOSTPORT} after rewrite, e.g. ${leftovers[0]}`,
    );
  }
}

function docker(args: string[], opts: { ignoreErrors?: boolean } = {}): void {
  try {
    execFileSync('docker', args, { stdio: 'pipe' });
  } catch (err) {
    if (!opts.ignoreErrors) throw err;
  }
}

/** Start a fresh CSS container on POD_PORT serving the rewritten copy. */
export function startPod(): void {
  docker(['rm', '-f', CONTAINER], { ignoreErrors: true });
  docker([
    'run', '-d', '--name', CONTAINER,
    '-p', `${POD_PORT}:${POD_PORT}`,
    '-v', `${podData}:/data`,
    '-v', `${configDir}:/config`,
    IMAGE,
    '-c', '/config/kellermeister.json',
    '-b', `${POD_ORIGIN}/`,
    '-p', String(POD_PORT),
    '-f', '/data',
  ]);
}

/** Poll the seeded WebID document until the Pod answers 200 (or time out). */
export async function waitForPod(timeoutMs = 60_000): Promise<void> {
  const url = `${POD_ORIGIN}/edwin/profile/card`;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`waitForPod: ${url} not ready within ${timeoutMs}ms (last: ${String(lastError)})`);
}

/** Stop the container and delete the throwaway copy. Best-effort. */
export function stopPod(): void {
  docker(['rm', '-f', CONTAINER], { ignoreErrors: true });
  rmSync(podData, { recursive: true, force: true });
}
