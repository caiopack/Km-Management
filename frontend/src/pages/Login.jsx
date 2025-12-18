import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Importação da nova logo
import logoImg from '../assets/kartLogo.png'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Definição do Vermelho Vivo
  const primaryRed = '#FF0000'; 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      // Endpoint de login
      const { data } = await axios.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/home');
    } catch {
      setError('Email ou senha inválidos');
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    height: '100vh',
    margin: 0
  };

  const headerStyle = {
    flex: isMobile ? '0 0 40vh' : '0 0 55%',
    maxWidth: isMobile ? '100%' : '55%',
    backgroundColor: primaryRed, 
    color: '#FFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem'
  };

  const formStyle = {
    flex: isMobile ? '1 1 auto' : '0 0 45%',
    maxWidth: isMobile ? '100%' : '45%',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem'
  };

  const wrapper = (field) => ({
    display: 'flex',
    alignItems: 'center',
    background: '#2a2a2a',
    border: `2px solid ${focusField === field ? primaryRed : '#3a3a3a'}`,
    borderRadius: 8,
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  });

  const iconStyle = (field) => ({
    fontSize: 24,
    color: focusField === field ? primaryRed : '#FFFFFF',
    marginRight: 12,
  });

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    fontSize: isMobile ? 16 : 18,
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Seção da Esquerda: Apenas a Logo em destaque */}
      <div style={headerStyle}>
        <img 
          src={logoImg} 
          alt="Logo Kart Mônaco" 
          style={{ 
            width: isMobile ? '250px' : '450px', // Logo bem grande como solicitado
            height: 'auto',
            filter: 'drop-shadow(0px 10px 10px rgba(0, 0, 0, 0.3))' 
          }} 
        />
        {/* Subtítulo removido conforme solicitado */}
      </div>

      {/* Lado Direito: Formulário de Login */}
      <div style={formStyle}>
        <div style={{ width: '100%', maxWidth: 450 }}>
          <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 700, color: '#FFF', textAlign: 'center', marginBottom: '0.5rem' }}>
            Bem-vindo de volta!
          </h2>
          <p style={{ fontSize: isMobile ? '1rem' : '1.125rem', color: '#a0a0a0', textAlign: 'center', marginBottom: '1.5rem' }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#dc3545', color: '#fff', borderRadius: 4 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={wrapper('email')} onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)}>
              <i className="bi bi-envelope-fill" style={iconStyle('email')} />
              <input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={wrapper('password')} onFocus={() => setFocusField('password')} onBlur={() => setFocusField(null)}>
              <i className="bi bi-lock-fill" style={iconStyle('password')} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
              <i
                className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}
                style={{ fontSize: 24, color: focusField === 'password' ? primaryRed : '#FFFFFF', marginLeft: 12, cursor: 'pointer' }}
                onClick={() => setShowPassword(prev => !prev)}
              />
            </div>

            <button type="submit" style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: primaryRed, 
              border: 'none', 
              borderRadius: 8, 
              color: '#FFF', 
              fontSize: 18, 
              fontWeight: 600, 
              cursor: 'pointer', 
              marginBottom: '1rem' 
            }}>
              Entrar
            </button>

            <div style={{ textAlign: 'center', color: '#a0a0a0' }}>
              Não tem uma conta?{' '}
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: primaryRed, cursor: 'pointer', fontWeight: 'bold' }} 
                onClick={() => navigate('/register')}
              >
                Cadastre-se
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}