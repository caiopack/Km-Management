import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  // Se não estiver logado, volta para login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
