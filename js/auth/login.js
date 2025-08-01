// login.js 🔐
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "../utils/firebase-client.js";

const auth = getAuth(app);

// 🔍 DOM Elements
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const togglePassword = document.getElementById("toggle-password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

// 🧠 Guard clause for missing elements
if (!emailInput || !passwordInput || !loginBtn) {
  throw new Error("⛔ Missing essential login DOM elements. Aborting login.js.");
}

// ✨ Redirect if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "pages/home.html"; // ✅ Redirect to your admin panel
  } else {
    document.documentElement.classList.replace("loading", "loaded");
    document.body.classList.replace("loading", "loaded");
  }
});

// 👁️ Toggle password visibility
togglePassword?.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.textContent = isHidden ? "🙈" : "👁️";
});

// ✅ Input validation
function validateEmail() {
  const value = emailInput.value.trim();
  const isValid = value && value.includes("@");
  emailInput.classList.toggle("invalid", !isValid);
  if (emailError) emailError.textContent = isValid ? "" : "Please enter a valid email.";
  return isValid;
}

function validatePassword() {
  const value = passwordInput.value.trim();
  const isValid = value.length >= 6;
  passwordInput.classList.toggle("invalid", !isValid);
  if (passwordError) passwordError.textContent = isValid
    ? ""
    : "Password must be at least 6 characters.";
  return isValid;
}

// 🧠 Real-time input validation
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);

// ⌨️ Enter key support
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// 🚀 Login flow
loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const emailValid = validateEmail();
  const passwordValid = validatePassword();

  if (!emailValid || !passwordValid) {
    showToast("❌ Please fix your input.", true);
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value.trim()
    );
    showToast("✅ Welcome back!");
    setTimeout(() => {
  window.location.href = "pages/home.html";
}, 1000);
  } catch (err) {
    showToast("❌ Login failed: " + err.message, true);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }
});

// 🔔 Toast
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add("fade-out"), 3000);
  setTimeout(() => toast.remove(), 4000);
}
