// src/utils/waitForFirebase.js
export function waitForFirebase(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    // ✅ 1) If already ready, resolve immediately
    if (window.firebaseRefs?.db) {
      return resolve();
    }

    let resolved = false;
    const onReady = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    const onTimeout = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error(`[waitForFirebase] Firebase did not initialize within ${timeoutMs}ms`));
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("firebase-ready", onReady);
    };

    // ✅ 2) Listen for the event
    window.addEventListener("firebase-ready", onReady, { once: true });

    // ✅ 3) Also poll in case event never fires
    const poll = setInterval(() => {
      if (window.firebaseRefs?.db) {
        onReady();
      }
    }, 100);
    const timer = setTimeout(() => {
      clearInterval(poll);
      onTimeout();
    }, timeoutMs);
  });
}
