import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Agenda from './pages/Agenda';
import Orcamentos from './pages/Orcamentos';
import Settings from './pages/Settings';

import AppLayout from './layouts/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página inicial redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas públicas */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Rotas protegidas (privadas) */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Rotas inválidas caem no login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
