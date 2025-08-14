// src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/utils/init-firebase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // use the imported `auth` directly

  const handleSignup = async () => {
    setError('');
    if (!email.includes('@')) return setError('Invalid email.');
    if (password.length < 6) return setError('Password too short.');
    

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/upload/closet');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h1>Create Your Account</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="password-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span
          className="toggle-icon"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? '🙈' : '👁️'}
        </span>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button onClick={handleSignup}>Sign Up</button>

      <div className="auth-footer">
        Already registered? <a href="/login">Sign in here</a>
      </div>
    </div>
  );
}

