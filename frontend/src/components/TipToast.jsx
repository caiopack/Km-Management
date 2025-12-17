import React, { useEffect, useState } from 'react';
import { Toast } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function TipToast({ message }) {
  const [show, setShow] = useState(false);

  /* Mostra somente se o usuário manteve a preferência ligada */
  useEffect(() => {
    const enabled = JSON.parse(localStorage.getItem('show_tips') ?? 'true');
    if (enabled) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <Toast
      show={show}
      onClose={() => setShow(false)}
      autohide
      delay={7000}
      bg="dark"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1080,
        minWidth: 280,
        boxShadow: '0 4px 14px #0006',
        borderRadius: 12,
      }}
    >
      {/* Cabeçalho azul + botão “X” usando a mesma paleta */}
      <Toast.Header
        closeButton={false}
        className="text-white"
        style={{
          background: '#0066FF',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          paddingRight: 8,
        }}
      >
        <strong className="me-auto">Dica</strong>

        <button
          aria-label="Fechar"
          onClick={() => setShow(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </Toast.Header>

      <Toast.Body className="text-white fw-semibold">{message}</Toast.Body>
    </Toast>
  );
}
