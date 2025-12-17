import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      await axios.post('/auth/register', { name, email, password, secretKey });
      navigate('/login');
    } catch {
      setError('Erro ao criar conta');
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    height: '100vh',
    margin: 0,
  };
  const headerStyle = {
    backgroundColor: '#0066FF',
    color: '#FFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '1rem' : '2rem',
    flex: isMobile ? '0 0 25vh' : '0 0 45%',
    maxWidth: isMobile ? '100%' : '45%',
  };
  const formStyle = {
    backgroundColor: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flex: isMobile ? '1 1 auto' : '0 0 55%',
    maxWidth: isMobile ? '100%' : '55%',
  };
  const wrapperStyle = (field) => ({
    display: 'flex',
    alignItems: 'center',
    background: '#2a2a2a',
    border: `2px solid ${focusField === field ? '#0066FF' : '#3a3a3a'}`,
    borderRadius: 8,
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
    height: '3.5rem',
  });
  const iconStyle = (field) => ({
    fontSize: 20,
    color: focusField === field ? '#0066FF' : '#FFF',
    marginRight: 16,
    cursor: field === 'password' || field === 'confirmPassword' || field === 'secretKey' ? 'pointer' : undefined,
  });
  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#FFF',
    fontSize: isMobile ? 16 : 18,
    outline: 'none',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      {/* Blue Header */}
      <div style={{ ...headerStyle, order: isMobile ? 0 : 1 }}>
        <h1 style={{ fontSize: isMobile ? '2rem' : '4rem', fontWeight: 700, margin: 0 }}>
          CSE Manager
        </h1>
        <p
          style={{
            fontSize: isMobile ? '1rem' : '1.5rem',
            marginTop: '0.5rem',
            textAlign: 'center',
          }}
        >
          Crie sua conta e gerencie sua empresa de refrigeração
        </p>
      </div>

      {/* Form Section */}
      <div style={{ ...formStyle, order: isMobile ? 1 : 0 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2
            style={{
              fontSize: isMobile ? '1.75rem' : '2.5rem',
              fontWeight: 700,
              color: '#FFF',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            Criar Conta
          </h2>
          <p
            style={{
              color: '#a0a0a0',
              fontSize: isMobile ? '1rem' : '1.125rem',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            Preencha seus dados para começar
          </p>
          {error && (
            <div style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</div>
          )}
          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
            {/* Nome */}
            <div style={wrapperStyle('name')}>
              <i className="bi bi-person-fill" style={iconStyle('name')} />
              <input
                type="text"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                style={inputStyle}
                required
              />
            </div>
            {/* Email */}
            <div style={wrapperStyle('email')}>
              <i className="bi bi-envelope-fill" style={iconStyle('email')} />
              <input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField(null)}
                style={inputStyle}
                required
              />
            </div>
            {/* Senha */}
            <div style={wrapperStyle('password')}>
              <i className="bi bi-lock-fill" style={iconStyle('password')} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                style={inputStyle}
                required
              />
              <i
                className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}
                style={{ fontSize: 20, color: focusField === 'password' ? '#0066FF' : '#FFF', marginLeft: 12, cursor: 'pointer' }}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </div>
            {/* Confirmar Senha */}
            <div style={wrapperStyle('confirmPassword')}>
              <i className="bi bi-shield-lock-fill" style={iconStyle('confirmPassword')} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusField('confirmPassword')}
                onBlur={() => setFocusField(null)}
                style={inputStyle}
                required
              />
              <i
                className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}
                style={{ fontSize: 20, color: focusField === 'confirmPassword' ? '#0066FF' : '#FFF', marginLeft: 12, cursor: 'pointer' }}
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </div>
            {/* Chave Secreta */}
            <div style={wrapperStyle('secretKey')}>
              <i className="bi bi-key-fill" style={iconStyle('secretKey')} />
              <input
                type="password"
                placeholder="Digite a chave secreta"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                onFocus={() => setFocusField('secretKey')}
                onBlur={() => setFocusField(null)}
                style={inputStyle}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#0066FF',
                border: 'none',
                borderRadius: 8,
                color: '#FFF',
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              Criar Conta
            </button>
          </form>
          <div
            style={{
              textAlign: 'center',
              color: '#a0a0a0',
              fontSize: isMobile ? 14 : 16,
            }}
          >
            Já tem uma conta?{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#0066FF',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/login')}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}