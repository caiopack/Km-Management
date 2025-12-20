import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import logoImg from '../assets/kartLogo.png';

export default function Sidebar({ mobileClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const claims = (() => {
    try {
      const t = localStorage.getItem('token');
      return t ? JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
    } catch { return {}; }
  })();
  
  const email = claims.sub || '';
  const name =
    claims.name ||
    (email ? email.split('@')[0].replace(/\./g, ' ').replace(/(^|\s)\w/g, s => s.toUpperCase()) : 'Usuário');
    
  const initials = name
    .split(' ')
    .map(c => c[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const links = [
    ['Dashboard', '/home', 'bar-chart-line'],
    ['Agenda', '/agenda', 'calendar-event'],
    ['Clientes', '/clientes', 'people'],
    ['Orçamentos', '/orcamentos', 'file-earmark-text'],
    ['Configurações', '/settings', 'gear'],
  ];

  const navTo = (e, to) => {
    e.preventDefault();
    navigate(to);
  };

  const logout = e => {
    e.preventDefault();
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex flex-column h-100 p-3 bg-sidebar text-white shadow">
      {!mobileClose && (
        <div className="text-center mb-4">
          <img 
            src={logoImg} 
            alt="Kart Mônaco" 
            style={{ width: '100%', maxWidth: '180px', height: 'auto' }} 
          />
        </div>
      )}

      {/* MUDANÇA CRÍTICA AQUI: 
         Troquei "nav nav-pills" por apenas "nav".
         Isso remove o estilo padrão do Bootstrap que forçava o AZUL no active.
      */}
      <ul className="nav flex-column mb-auto">
        {links.map(([label, to, icon]) => {
          const isActive = pathname === to;
          
          return (
            <li key={to} className="nav-item mb-2">
              <a
                href={to}
                onClick={e => navTo(e, to)}
                /* Removemos a classe 'active' do Bootstrap para ele não interferir na cor */
                className="nav-link d-flex align-items-center transition-all text-white"
                style={{
                  /* Agora nós controlamos 100% da cor */
                  backgroundColor: isActive ? '#DC3545' : 'transparent', 
                  color: '#fff',
                  cursor: 'pointer',
                  borderRadius: '0.375rem', // Mantém a borda arredondada bonita
                  fontWeight: isActive ? '600' : '400'
                }}
                {...(mobileClose && { 'data-bs-dismiss': 'offcanvas' })}
              >
                <i className={`bi bi-${icon} me-2`} />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-3 border-top border-secondary">
        <div className="d-flex align-items-center mb-3">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: '#fff',
              marginRight: 10,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          >
            {initials}
          </div>
          <div className="d-flex flex-column overflow-hidden">
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
              }}
            >
              {name}
            </span>
          </div>
        </div>

        <button
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
          onClick={logout}
          style={{ transition: '0.3s' }}
          {...(mobileClose && { 'data-bs-dismiss': 'offcanvas' })}
        >
          <i className="bi bi-box-arrow-right me-2" /> 
          Sair
        </button>
      </div>
    </div>
  );
}