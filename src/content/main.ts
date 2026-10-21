// Instagram is a SPA: the script loads on any page and acts only inside a DM thread.
const THREAD_PATH = /^\/direct\/t\/\d+\//;

console.log('[reel-queue] content script loaded', {
  path: location.pathname,
  inThread: THREAD_PATH.test(location.pathname),
});
