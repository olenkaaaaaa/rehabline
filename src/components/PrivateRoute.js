import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getDefaultRouteByRole = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'registrar') return '/registrar';
  if (role === 'specialist') return '/specialist';

  return '/client';
};

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="loader-card">
          <h2>RehabLine</h2>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  const userRole = profile?.role || 'client';

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultRouteByRole(userRole)} replace />;
  }

  return children;
};

export default PrivateRoute;