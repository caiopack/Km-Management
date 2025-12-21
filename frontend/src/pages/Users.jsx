import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Button, Table, Card, Modal, Form, Badge
} from 'react-bootstrap';
import api from '../services/api';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TipToast from '../components/TipToast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [current, setCurrent] = useState(null);
  
  // Form para edição
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEdit = (user) => {
    setCurrent(user);
    setFormData({ name: user.name, email: user.email, password: '' }); // Senha vazia
    setShowEdit(true);
  };

  const handleDelete = (user) => {
    setCurrent(user);
    setShowDelete(true);
  };

  const confirmEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${current.id}`, formData);
      setShowEdit(false);
      loadUsers();
      alert('Usuário atualizado!');
    } catch (err) {
      alert(err.response?.data || 'Erro ao editar');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${current.id}`);
      setShowDelete(false);
      loadUsers();
    } catch (err) {
      alert(err.response?.data || 'Erro ao excluir');
    }
  };

  return (
    <Container fluid className="py-3 d-flex flex-column" style={{ height: '100vh' }}>
      <h3 className="text-white mb-3">Gerenciar Usuários</h3>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isMobile ? (
          <Row xs={1} className="g-3">
            {users.map(u => (
              <Col key={u.id}>
                <Card className="bg-dark text-white border-secondary">
                  <Card.Body>
                    <Card.Title>{u.name}</Card.Title>
                    <Card.Subtitle className="text-muted mb-2">{u.email}</Card.Subtitle>
                    <div className="d-flex justify-content-between align-items-center">
                        <Badge bg={u.role === 'ADMIN' ? 'danger' : 'primary'}>{u.role}</Badge>
                        {u.role !== 'ADMIN' && (
                           <div>
                             <Button variant="outline-light" size="sm" onClick={() => handleEdit(u)} className="me-2"><i className="bi bi-pencil"/></Button>
                             <Button variant="outline-danger" size="sm" onClick={() => handleDelete(u)}><i className="bi bi-trash"/></Button>
                           </div>
                        )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table hover className="table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><Badge bg={u.role === 'ADMIN' ? 'danger' : 'primary'}>{u.role}</Badge></td>
                  <td className="text-end">
                    {/* Só mostra botões se NÃO for Admin */}
                    {u.role !== 'ADMIN' ? (
                      <>
                        <Button variant="outline-light" size="sm" onClick={() => handleEdit(u)} className="me-2"><i className="bi bi-pencil"/></Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(u)}><i className="bi bi-trash"/></Button>
                      </>
                    ) : <span className="text-muted small fst-italic me-2">Protegido</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* MODAL EDITAR */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Editar Usuário</Modal.Title></Modal.Header>
        <Form onSubmit={confirmEdit}>
          <Modal.Body className="bg-dark text-white">
            <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="bg-secondary text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="bg-secondary text-white border-secondary" />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Nova Senha (deixe em branco para manter)</Form.Label>
                <Form.Control type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-secondary text-white border-secondary" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
             <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
             <Button variant="success" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL EXCLUIR */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Excluir Usuário</Modal.Title></Modal.Header>
        <Modal.Body className="bg-dark text-white">
            Tem certeza que deseja remover <strong>{current?.name}</strong>? Essa ação não pode ser desfeita.
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
             <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancelar</Button>
             <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
        </Modal.Footer>
      </Modal>

      <TipToast message="Somente usuários comuns podem ser gerenciados aqui." />
    </Container>
  );
}