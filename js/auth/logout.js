// js/auth/logout.js
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "../utils/firebase-client.js";
import { showToast } from "../utils/firebase-helpers.js";

const auth = getAuth(app);
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showToast("Logged out successfully", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    } catch (error) {
      console.error("Logout error:", error.message);
      showToast("Logout failed", "error");
    }
  });
}
