import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth';
import { Notice, Panel, TextField } from '../components/ui';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const account = await login(email, password);
      navigate(account.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <span className="navbar__brand">
          PORTFOLIO<span>/</span>BUILDER
        </span>
        <div className="navbar__links">
          <span className="navbar__link">AUTHORISED ACCESS ONLY</span>
        </div>
      </nav>
      <div className="page page--narrow stack">
        <Panel plate="SIGN IN" meta="REG. STUDENTS + ADMIN">
          <form className="stack" onSubmit={submit}>
            <Notice variant="error">{error}</Notice>
            <div className="fieldset fieldset--single">
              <TextField
                label="Institutional email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? 'VERIFYING…' : 'LOG IN'}
            </button>
          </form>
        </Panel>
        <div className="notice notice--accent">
          NO SELF-REGISTRATION. ACCOUNTS ARE ISSUED AND APPROVED BY THE ADMINISTRATOR. CONTACT YOUR
          DEPARTMENT IF YOUR ACCESS IS PENDING.
        </div>
      </div>
    </div>
  );
}
