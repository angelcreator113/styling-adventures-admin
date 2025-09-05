// src/auth/login.js
import { auth } from '@/utils/init-firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getRoleInfo, roleLabel } from '@/utils/roles';

function announce(role) {
  // swap for your toast system if you have one
  console.log(`[auth] Signed in as ${roleLabel(role)}`);
  try { /* optional UX */
    // window.alert(`Signed in as ${roleLabel(role)}`);
  } catch {}
}

export function attachLoginHandlers() {
  const btn = document.getElementById('google-login');
  if (btn) {
    btn.addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      // Force token refresh once after login so we read latest claims
      const idToken = await getIdToken(cred.user, true);

      // Announce role
      const { primary } = await getRoleInfo({ force: true });
      announce(primary);

      // send ID token to server to mint cookie (only if you actually have these endpoints)
      try {
        const res = await fetch('/sessionLogin', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) console.warn('sessionLogin failed (dev env?)');
      } catch (e) {
        // ok in emulator/local dev
        console.warn('sessionLogin call skipped/failed', e?.message);
      }

      window.location.reload();
    });
  }

  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', async () => {
      try { await fetch('/sessionLogout', { method: 'POST', credentials: 'include' }); } catch {}
      await signOut(auth);
      console.log('[auth] Signed out');
      window.location.reload();
    });
  }
}

// optional: reflect auth in UI
export function onAuth(callback) {
  onAuthStateChanged(auth, (user) => callback(user));
}
