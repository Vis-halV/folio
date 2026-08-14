import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <Link className="navbar__brand" to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}>
        PORTFOLIO<span>/</span>BUILDER
      </Link>
      <div className="navbar__links">
        {user?.role === 'ADMIN' ? (
          <NavLink className="navbar__link" to="/admin">
            ADMIN
          </NavLink>
        ) : (
          <NavLink className="navbar__link" to="/dashboard">
            DASHBOARD
          </NavLink>
        )}
        {user ? <span className="navbar__link">{user.student_id || user.email}</span> : null}
        <button type="button" className="navbar__link" onClick={handleLogout}>
          LOGOUT
        </button>
      </div>
    </nav>
  );
}
