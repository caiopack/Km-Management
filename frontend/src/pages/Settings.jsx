import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Toast,
} from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * Configurações minimalista – Perfil + único toggle “Mostrar dicas rápidas”.
 * • Identidade visual: Kart Mônaco (Vermelho).
 */
export default function Settings() {
  /* ---------- extrai email / nome ---------- */
  const claims = (() => {
    try {
      const t = localStorage.getItem('token');
      if (!t) return {};
      return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return {}; }
  })();
  const email = claims.sub || '—';
  const userName = claims.name || (email !== '—'
    ? email.split('@')[0].replace(/\./g, ' ').replace(/(^|\s)\w/g, c => c.toUpperCase())
    : 'Usuário');
  const initials = userName.split(' ').map(c => c[0]).join('').slice(0, 2).toUpperCase();
  const isMobile = window.innerWidth < 768;

  /* ---------- preferência showTips ---------- */
  const [showTips, setShowTips] = useState(() => {
    try { return JSON.parse(localStorage.getItem('show_tips')) ?? true; } catch { return true; }
  });
  useEffect(() => localStorage.setItem('show_tips', JSON.stringify(showTips)), [showTips]);

  const [previewTip, setPreviewTip] = useState(false);
  const toggleTips = () => {
    const next = !showTips;
    setShowTips(next);
    if (next) setPreviewTip(true);
  };

  /* ---------- render ---------- */
  return (
    <Container
      fluid
      className="py-4"
      style={{ minHeight: '100vh', maxWidth: 760 }}
    >
      {/* Força o estilo do Switch para Vermelho quando marcado */}
      <style>{`
        .form-check-input:checked {
          background-color: #DC3545 !important;
          border-color: #DC3545 !important;
        }
      `}</style>

      <Row className="mb-4">
        <Col>
          <h2
            className="fw-bold text-white"
            style={{ fontSize: isMobile ? 22 : 30 }}
          >
            Configurações
          </h2>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Perfil */}
        <Col xs={12} md={6}>
          <Card className="bg-dark text-white shadow-sm border-0 rounded-4">
            <Card.Body className="text-center">
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: '50%',
                  /* MUDANÇA: Gradiente Vermelho para combinar */
                  background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#fff',
                  margin: '0 auto 16px',
                  boxShadow: '0 3px 12px #0005',
                }}
              >
                {initials}
              </div>
              <h4 className="fw-bold mb-1" style={{ fontSize: isMobile ? 18 : 22 }}>
                {userName}
              </h4>
              <span className="text-white-50" style={{ wordBreak: 'break-all' }}>
                {email}
              </span>
            </Card.Body>
          </Card>
        </Col>

        {/* Toggle dicas */}
        <Col xs={12} md={6}>
          <Card className="bg-dark text-white shadow-sm border-0 rounded-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">
                {/* MUDANÇA: Cor do ícone da lâmpada para Vermelho */}
                <i className="bi bi-lightbulb me-2" style={{ color: '#DC3545' }} /> 
                Preferência
              </h5>
              <Form>
                <Form.Check
                  type="switch"
                  id="toggle-show-tips"
                  label="Mostrar dicas rápidas em todas as páginas"
                  checked={showTips}
                  onChange={toggleTips}
                  /* A cor do switch ativo é controlada pelo style block acima */
                />
                <small className="text-secondary d-block mt-3">
                  Salvo automaticamente
                </small>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* preview toast */}
      <Toast
        show={previewTip}
        onClose={() => setPreviewTip(false)}
        autohide
        delay={4500}
        bg="dark"
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1080, minWidth: 260, borderRadius: 12 }}
      >
        <Toast.Header
          closeButton={false}
          className="text-white"
          /* MUDANÇA: Cabeçalho do Toast em Vermelho */
          style={{ background: '#DC3545', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingRight: 8 }}
        >
          <strong className="me-auto">Dicas ativas!</strong>
          <button
            aria-label="Fechar"
            onClick={() => setPreviewTip(false)}
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
        <Toast.Body className="text-white fw-semibold">
          As próximas páginas exibirão dicas rápidas.
        </Toast.Body>
      </Toast>
    </Container>
  );
}