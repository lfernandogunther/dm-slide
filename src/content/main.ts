import { createThreadAdapter } from '../instagram/adapter';
import { THREAD_PATH } from '../instagram/selectors';

// Instagram is a SPA: the script loads on any page and acts only inside a DM thread.

const adapter = createThreadAdapter();

// Debug handle, reachable from the console's "Reel Queue" context: __rq.listReels(), __rq.health().
(globalThis as unknown as { __rq: typeof adapter }).__rq = adapter;

console.log('[reel-queue] content script loaded', {
  path: location.pathname,
  inThread: THREAD_PATH.test(location.pathname),
});
