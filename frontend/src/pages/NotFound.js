import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page page--narrow stack">
      <h1>404 / NOT FOUND</h1>
      <p className="muted mono">
        NO PUBLISHED PORTFOLIO MATCHES THIS ADDRESS. THE OWNER MAY HAVE UNPUBLISHED IT.
      </p>
      <Link className="btn" to="/login">
        GO TO LOGIN
      </Link>
    </div>
  );
}
