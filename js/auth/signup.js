import { auth } from '../utils/firebase-client.js';
import {
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const toggleIcon = document.getElementById('toggle-password');
const signupBtn = document.getElementById('signup-btn');
const errorDisplay = document.getElementById('signup-error');

// Toggle password visibility
toggleIcon.addEventListener('click', () => {
  const visible = passwordInput.type === 'text';
  passwordInput.type = visible ? 'password' : 'text';
  toggleIcon.textContent = visible ? '👁️' : '🙈';
});

// Handle sign-up
signupBtn.addEventListener('click', async () => {
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

  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating...';

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('✅ Account created!');
    window.location.href = '/index.html';
  } catch (err) {
    errorDisplay.textContent = 'Signup failed: ' + err.message;
    console.error(err);
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
});
