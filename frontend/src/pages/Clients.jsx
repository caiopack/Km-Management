import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Card,
  InputGroup,
  Form,
  Modal
} from 'react-bootstrap';
import api from '../services/api';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../index.css';
import TipToast from '../components/TipToast';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showView, setShowView] = useState(false);
  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', endereco: '', email: '', notas: '' });
  const [validated, setValidated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const loadClients = async () => {
    try {
      const resp = await api.get('/clientes');
      setClients(resp.data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  useEffect(() => {
    loadClients();
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const filtered = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      c.telefone.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.endereco?.toLowerCase().includes(term)
    );
  });

  const handleSearch = e => setSearch(e.target.value);

  const onView = client => { setCurrent(client); setShowView(true); };
  const onEdit = client => {
    setCurrent(client);
    setForm({
      nome: client.nome,
      telefone: client.telefone,
      endereco: client.endereco,
      email: client.email,
      notas: client.notas
    });
    setFieldErrors({});
    setValidated(false);
    setShowCreateEdit(true);
  };
  const onNew = () => {
    setCurrent(null);
    setForm({ nome: '', telefone: '', endereco: '', email: '', notas: '' });
    setFieldErrors({});
    setValidated(false);
    setShowCreateEdit(true);
  };
  const onDelete = client => { setCurrent(client); setShowConfirmDelete(true); };

  const handleSubmit = async e => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      setValidated(true);
      return;
    }
    try {
      if (current) await api.put(`/clientes/${current.id}`, form);
      else await api.post('/clientes', form);
      setShowCreateEdit(false);
      loadClients();
    } catch (err) {
      if (err.response?.status === 400) {
        setFieldErrors(err.response.data);
        setValidated(true);
      } else console.error('Erro ao salvar:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clientes/${current.id}`);
      setShowConfirmDelete(false);
      loadClients();
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  return (
    <Container fluid className="py-3 clients-container d-flex flex-column" style={{ height: '100vh' }}>
      <Row className="mb-3">
        <Col xs={12}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h3 className="text-white mb-2 mb-sm-0">Clientes</h3>
            <div className="d-flex flex-fill flex-sm-grow-0 gap-2 align-items-center justify-content-end">
              <InputGroup style={{ maxWidth: 300 }}>
                <InputGroup.Text style={{ background: '#fff', border: '1px solid #ccc' }}>
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={handleSearch}
                  style={{ background: '#fff', border: '1px solid #ccc' }}
                />
              </InputGroup>
              <Button
                variant="primary"
                onClick={onNew}
                className="d-flex align-items-center"
                style={{ height: '2.2rem', fontSize: '0.9rem' }}
              >
                <i className="bi bi-plus-lg me-1" /> Novo
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {isMobile ? (
          <Row xs={1} className="g-3">
            {filtered.map(c => (
              <Col key={c.id}>
                <Card className="bg-dark text-white shadow-sm border-0">
                  <Card.Body>
                    <Card.Title className="mb-1">{c.nome}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{c.telefone}</Card.Subtitle>
                    <Card.Text className="mb-1">
                      <i className="bi bi-geo-alt me-1 text-primary" />{c.endereco}
                    </Card.Text>
                    <Card.Text className="mb-3">
                      <i className="bi bi-envelope me-1 text-primary" />{c.email || '—'}
                    </Card.Text>
                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => onView(c)}>
                        <i className="bi bi-eye-fill" />
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => onEdit(c)}>
                        <i className="bi bi-pencil-fill" />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => onDelete(c)}>
                        <i className="bi bi-trash-fill" />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table responsive hover className="table-dark table-striped align-middle">
            <thead className="bg-sidebar">
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Email</th>
                <th className="text-center" style={{ width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="text-white">{c.nome}</td>
                  <td className="text-white">{c.telefone}</td>
                  <td className="text-white">{c.endereco}</td>
                  <td className="text-white">{c.email || '—'}</td>
                  <td className="text-center">
                    <Button variant="outline-primary" size="sm" onClick={() => onView(c)} className="me-1">
                      <i className="bi bi-eye-fill" />
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => onEdit(c)} className="me-1">
                      <i className="bi bi-pencil-fill" />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => onDelete(c)}>
                      <i className="bi bi-trash-fill" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* View Modal */}
      <Modal show={showView} onHide={() => setShowView(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Detalhes do Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <p><strong>Nome:</strong> {current?.nome}</p>
          <p><strong>Telefone:</strong> {current?.telefone}</p>
          <p><strong>Endereço:</strong> {current?.endereco}</p>
          <p><strong>Email:</strong> {current?.email || '—'}</p>
          <p><strong>Notas:</strong><br />{current?.notas || '—'}</p>
        </Modal.Body>
        <Modal.Footer className="bg-dark">
          <Button variant="secondary" onClick={() => setShowView(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit/Create Modal */}
      <Modal show={showCreateEdit} onHide={() => setShowCreateEdit(false)} backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>{current ? 'Editar Cliente' : 'Novo Cliente'}</Modal.Title>
        </Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-white">
            <Form.Group controlId="formNome" className="mb-3">
              <Form.Label>Nome*</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                required
                isInvalid={!!fieldErrors.nome}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.nome || 'O nome é obrigatório'}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formTelefone" className="mb-3">
              <Form.Label>Telefone*</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                required
                isInvalid={!!fieldErrors.telefone}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.telefone || 'O telefone é obrigatório'}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formEndereco" className="mb-3">
              <Form.Label>Endereço*</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                value={form.endereco}
                onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                required
                isInvalid={!!fieldErrors.endereco}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.endereco || 'O endereço é obrigatório'}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                size="sm"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                isInvalid={!!fieldErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="formNotas" className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                size="sm"
                as="textarea"
                rows={3}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                isInvalid={!!fieldErrors.notas}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.notas}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-dark">
            <Button variant="secondary" onClick={() => setShowCreateEdit(false)}>Cancelar</Button>
            <Button variant="success" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Excluir Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          Deseja realmente excluir <strong>{current?.nome}</strong>?
        </Modal.Body>
        <Modal.Footer className="bg-dark">
          <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </Modal.Footer>
      </Modal>
    <TipToast message="Clique nos ícones para visualizar, editar ou excluir um cliente rapidamente." />
    </Container>
  );
}
