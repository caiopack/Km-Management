import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Agenda from './pages/Agenda';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Users from './pages/Users'; 
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './layouts/AppLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Rota de Admin */}
          <Route path="/usuarios" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}