import { prepareData, startPod, waitForPod, POD_ORIGIN } from './helpers/pod';

/**
 * Runs once before the whole suite (before the Vite webServer): provision a
 * throwaway copy of the seed on the e2e Pod's port and wait until it answers.
 */
export default async function globalSetup(): Promise<void> {
  prepareData();
  startPod();
  await waitForPod();
  // eslint-disable-next-line no-console
  console.log(`[e2e] Pod ready at ${POD_ORIGIN}`);
}
