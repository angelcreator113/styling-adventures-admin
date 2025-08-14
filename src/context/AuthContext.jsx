// src/context/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/utils/init-firebase';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function BootScreen() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100dvh',
        background: 'var(--lavender, #fdf9ff)'
      }}
    >
      <div role="status" aria-live="polite" style={{ opacity: 0.7 }}>
        Loading…
      </div>
    </div>
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve exactly once
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? <BootScreen /> : children}
    </AuthContext.Provider>
  );
};
