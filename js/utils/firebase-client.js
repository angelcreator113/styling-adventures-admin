// js/utils/firebase-client.js
export function ready() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firebaseRefs?.app) {
        resolve({ app: window.firebaseRefs.app });
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}
