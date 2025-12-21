import React, { useState, useEffect } from 'react';
import api from '../services/api'; // MUDANÇA: Usa api configurada
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import logoImg from '../assets/kartLogo.png'; 

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  const primaryRed = '#FF0000'; 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // MUDANÇA: Envia 'token' em vez de 'secretKey'
      const { data } = await api.post('/auth/register', { 
        name: name, 
        email: email, 
        password: password, 
        token: registrationKey 
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ 
          nome: data.name, 
          role: data.role, 
          id: data.id 
      }));

      navigate('/home');
    } catch (err) {
      setError(err.response?.data || 'Erro ao realizar cadastro');
    }
  };

  // --- (ABAIXO ESTÁ EXATAMENTE O SEU ESTILO ORIGINAL) ---
  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column-reverse' : 'row',
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
    padding: '2rem',
    overflowY: 'auto'
  };

  const wrapper = (field) => ({
    display: 'flex',
    alignItems: 'center',
    background: '#2a2a2a',
    border: `2px solid ${focusField === field ? primaryRed : '#3a3a3a'}`,
    borderRadius: 8,
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
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
      <div style={formStyle}>
        <div style={{ width: '100%', maxWidth: 450 }}>
          <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 700, color: '#FFF', textAlign: 'center', marginBottom: '0.5rem' }}>
            Crie sua conta
          </h2>
          <p style={{ fontSize: isMobile ? '1rem' : '1.125rem', color: '#a0a0a0', textAlign: 'center', marginBottom: '1.5rem' }}>
            Preencha os dados abaixo para acessar o sistema
          </p>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#dc3545', color: '#fff', borderRadius: 4 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={wrapper('name')} onFocus={() => setFocusField('name')} onBlur={() => setFocusField(null)}>
              <i className="bi bi-person-fill" style={iconStyle('name')} />
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div style={wrapper('email')} onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)}>
              <i className="bi bi-envelope-fill" style={iconStyle('email')} />
              <input
                type="email"
                placeholder="Seu melhor email"
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
                placeholder="Crie uma senha"
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

            <div style={wrapper('key')} onFocus={() => setFocusField('key')} onBlur={() => setFocusField(null)}>
              <i className="bi bi-key-fill" style={iconStyle('key')} />
              <input
                type="text"
                placeholder="Token de Acesso (Ex: KART2025)"
                value={registrationKey}
                onChange={e => setRegistrationKey(e.target.value)}
                style={inputStyle}
                required
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
              marginTop: '1rem',
              marginBottom: '1rem' 
            }}>
              Cadastrar
            </button>

            <div style={{ textAlign: 'center', color: '#a0a0a0' }}>
              Já tem uma conta?{' '}
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: primaryRed, cursor: 'pointer', fontWeight: 'bold' }} 
                onClick={() => navigate('/login')}
              >
                Faça Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={headerStyle}>
        <img 
          src={logoImg} 
          alt="Logo Kart Mônaco" 
          style={{ 
            width: isMobile ? '250px' : '450px', 
            height: 'auto',
            filter: 'drop-shadow(0px 10px 10px rgba(0, 0, 0, 0.3))' 
          }} 
        />
      </div>
    </div>
  );
}