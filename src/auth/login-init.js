// login-init.js
import { ready } from '../utils/firebase-client.js'; // ✅ correct
import {
  getAuth,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const { app } = await ready(); // ✅ Safe access to app
    const auth = getAuth(app);

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const toggleIcon = document.getElementById('toggle-login-password');
    const errorDisplay = document.getElementById('login-error');

    toggleIcon?.addEventListener('click', () => {
      const isVisible = passwordInput.type === 'text';
      passwordInput.type = isVisible ? 'password' : 'text';
      toggleIcon.textContent = isVisible ? '👁️' : '🙈';
    });

    loginBtn?.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      errorDisplay.textContent = '';
      errorDisplay.style.display = 'none';

      if (!email.includes('@')) {
        errorDisplay.textContent = 'Please enter a valid email address.';
        errorDisplay.style.display = 'block';
        return;
      }

      if (password.length < 6) {
        errorDisplay.textContent = 'Password must be at least 6 characters.';
        errorDisplay.style.display = 'block';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = '/index.html';
      } catch (err) {
        errorDisplay.textContent = `Login failed: ${err.message}`;
        errorDisplay.style.display = 'block';
        console.error('Login error:', err);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      }
    });
  } catch (err) {
    console.error('[login-init] Firebase did not initialize in time:', err);
    alert('⚠️ Unable to connect to Firebase. Please try again shortly.');
  }
});
