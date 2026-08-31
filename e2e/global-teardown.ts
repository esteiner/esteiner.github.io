import { stopPod } from './helpers/pod';

/** Runs once after the whole suite: stop the Pod container and delete the copy. */
export default async function globalTeardown(): Promise<void> {
  stopPod();
}
