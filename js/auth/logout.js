import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Wait for refs to initialize
import { ready } from "../utils/firebase-client.js";

// Toast fallback
let showToast = (msg, type) => alert(msg);
try {
  const mod = await import("../utils/firebase-helpers.js");
  if (typeof mod.showToast === "function") showToast = mod.showToast;
} catch {}

// Modal DOM elements
const modal = document.getElementById("logout-modal");
const logoutBtn = document.getElementById("logout-btn");
const confirm = document.getElementById("confirm-logout");
const cancel = document.getElementById("cancel-logout");

if (logoutBtn && modal && confirm && cancel) {
  logoutBtn.addEventListener("click", () => {
    modal.classList.add("active");
  });

  cancel.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  confirm.addEventListener("click", async () => {
    try {
      const { app } = await ready(); // wait for firebaseRefs to be ready
      const auth = getAuth(app);
      await signOut(auth);
      showToast("Logged out", "success");
      window.location.href = "login.html";
    } catch (err) {
      showToast("Logout failed", "error");
      console.error(err);
    }
  });

  // Optional redirect if not authenticated
  ready().then(({ app }) => {
    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "login.html";
      }
    });
  });
} else {
  console.warn("[logout] Modal or buttons not found.");
}
