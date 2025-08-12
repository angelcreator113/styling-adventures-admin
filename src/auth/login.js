import { auth } from '../utils/firebase-client.js';
import {
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const toggleIcon = document.getElementById('toggle-login-password');
const loginBtn = document.getElementById('login-btn');
const errorDisplay = document.getElementById('login-error');

// Toggle password visibility
toggleIcon.addEventListener('click', () => {
  const visible = passwordInput.type === 'text';
  passwordInput.type = visible ? 'password' : 'text';
  toggleIcon.textContent = visible ? '👁️' : '🙈';
});

// Handle login
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  errorDisplay.textContent = '';

  if (!email.includes('@')) {
    errorDisplay.textContent = 'Please enter a valid email.';
    emailInput.classList.add('invalid');
    return;
  }

  if (password.length < 6) {
    errorDisplay.textContent = 'Password must be at least 6 characters.';
    passwordInput.classList.add('invalid');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/index.html';
  } catch (err) {
    errorDisplay.textContent = 'Login failed: ' + err.message;
    console.error(err);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log In';
  }
});
