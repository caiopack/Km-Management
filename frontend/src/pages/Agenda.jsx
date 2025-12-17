import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Container,
  InputGroup,
  Badge
} from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addMinutes from 'date-fns/addMinutes';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../index.css';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const STATUS_LIST = [
  { value: 'EM_ABERTO', label: 'Em Aberto' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'FINALIZADO', label: 'Finalizado' }
];

const PRIORIDADE_COLORS = {
  1: '#DC3545', 
  2: '#FFC107', 
  3: '#198754'  
};

const DURACAO_PADRAO_MINUTOS = 30;

// --- COMPONENTE CUSTOMIZADO PARA O EVENTO ---
// Exibe todos os detalhes dentro do bloco do calendário
const CustomEvent = ({ event }) => {
  const { resource } = event;
  return (
    <div style={{ fontSize: '0.75rem', lineHeight: '1.2', overflow: 'hidden', height: '100%' }} title={resource.descricao || ''}>
      <div className="fw-bold text-truncate">{resource.titulo}</div>
      
      <div className="text-truncate">
        <i className="bi bi-person-fill me-1"/>
        {resource.clienteNome || 'Cliente ñ ident.'}
      </div>

      {resource.clienteEndereco && (
        <div className="text-truncate">
           <i className="bi bi-geo-alt-fill me-1"/>
           {resource.clienteEndereco}
        </div>
      )}
      
      <div className="d-flex align-items-center justify-content-between mt-1">
         <span style={{ fontSize: '0.7em', textTransform: 'uppercase', opacity: 0.9 }}>
           {resource.status?.replace('_', ' ')}
         </span>
         {resource.prioridade === 1 && <Badge bg="danger" style={{fontSize: '0.6em'}}>!</Badge>}
      </div>

      {resource.descricao && (
        <div className="text-truncate fst-italic opacity-75 border-top border-white border-opacity-25 mt-1 pt-1">
          {resource.descricao}
        </div>
      )}
    </div>
  );
};

export default function Agenda() {
  const [tarefas, setTarefas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [view, setView] = useState('week'); 
  const [date, setDate] = useState(new Date()); // Estado que controla a data atual do calendário

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [validated, setValidated] = useState(false);
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState(null);

  useEffect(() => {
    fetchTarefas();
    fetchClientes();
  }, []);

  // Atualiza eventos sempre que tarefas ou clientes mudarem (para pegar o endereço atualizado)
  useEffect(() => {
    const novosEventos = tarefas
      .filter(t => t.dataServico)
      .map(t => {
        const [dataPart, horaPart] = t.dataServico.split(' ');
        const [ano, mes, dia] = dataPart.split('-').map(Number);
        const [hora, minuto] = horaPart.split(':').map(Number);
        
        const dataInicio = new Date(ano, mes - 1, dia, hora, minuto);
        const dataFim = addMinutes(dataInicio, DURACAO_PADRAO_MINUTOS); 

        // Encontra dados completos do cliente
        const cliente = clientes.find(c => c.id === t.clienteId || c.id === t.cliente_id);
        const nomeCliente = cliente ? cliente.nome : (t.clienteNome || '?');
        const enderecoCliente = cliente ? cliente.endereco : '';

        return {
          id: t.id,
          // Título simples para views mensais que não usam o componente customizado
          title: `${t.titulo} - ${nomeCliente}`, 
          start: dataInicio,
          end: dataFim,
          allDay: false, 
          resource: {
            ...t,
            clienteNome: nomeCliente,
            clienteEndereco: enderecoCliente
          }
        };
      });
    setEventos(novosEventos);
  }, [tarefas, clientes]);

  async function fetchTarefas() {
    try {
      const resp = await api.get('/tarefas');
      setTarefas(resp.data);
    } catch (error) {
      console.error("Erro ao buscar tarefas", error);
    }
  }

  async function fetchClientes() {
    try {
      const resp = await api.get('/clientes');
      setClientes(resp.data);
    } catch (error) {
      console.error("Erro ao buscar clientes", error);
    }
  }

  function handleSelectEvent(event) {
    openModal(event.resource);
  }

  function handleSelectSlot({ start }) {
    openModal(null, start);
  }

  // --- CONTROLE DO MINI CALENDÁRIO ---
  function handleDateChange(e) {
    if(e.target.value){
      // Parse da string 'yyyy-mm-dd' para Date, mantendo o fuso local
      const [ano, mes, dia] = e.target.value.split('-').map(Number);
      setDate(new Date(ano, mes - 1, dia));
    }
  }

  function openModal(tarefa = null, dataPreSelecionada = null) {
    if (tarefa) {
      const dataFormatadaInput = tarefa.dataServico.replace(' ', 'T');
      setModalData({
        ...tarefa,
        clienteId: tarefa.clienteId || tarefa.cliente_id,
        dataServico: dataFormatadaInput
      });
    } else {
      let dataStr = '';
      if (dataPreSelecionada) {
        const offset = dataPreSelecionada.getTimezoneOffset() * 60000;
        const localDate = new Date(dataPreSelecionada.getTime() - offset);
        dataStr = localDate.toISOString().slice(0, 16);
      }
      
      setModalData({
        titulo: '',
        descricao: '',
        status: 'EM_ABERTO',
        prioridade: 2,
        clienteId: '',
        dataServico: dataStr
      });
    }
    setClienteFiltro('');
    setValidated(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setModalData(null);
    setValidated(false);
    setClienteFiltro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidated(true);
    if (!modalData?.titulo || !modalData?.clienteId || !modalData?.dataServico) return;
    
    const payload = {
      ...modalData,
      dataServico: modalData.dataServico.replace('T', ' ')
    };

    try {
      if (modalData.id) {
        await api.put(`/tarefas/${modalData.id}`, payload);
      } else {
        await api.post('/tarefas', payload);
      }
      fetchTarefas();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar.');
    }
  }

  async function handleConfirmDelete() {
    if (tarefaParaExcluir) {
      await api.delete(`/tarefas/${tarefaParaExcluir}`);
      fetchTarefas();
      setShowConfirm(false);
      setTarefaParaExcluir(null);
      closeModal();
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
    c.endereco.toLowerCase().includes(clienteFiltro.toLowerCase())
  );

  const eventStyleGetter = (event) => {
    const backgroundColor = PRIORIDADE_COLORS[event.resource.prioridade] || '#0066FF';
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.95,
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        fontSize: '0.8rem',
        padding: '2px'
      }
    };
  };

  return (
    <Container fluid className="py-3 d-flex flex-column" style={{ minHeight: '100vh', padding: '20px 32px' }}>
      <style>{`
        .rbc-calendar { color: #e0e0e0; font-family: 'Segoe UI', sans-serif; }
        .rbc-toolbar button { color: #fff; border: 1px solid #495057; }
        .rbc-toolbar button:hover { background-color: #343a40; }
        .rbc-toolbar button.rbc-active { background-color: #0d6efd; border-color: #0d6efd; }
        
        .rbc-off-range-bg { background-color: #2c3034 !important; }
        .rbc-today { background-color: #313b4b !important; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view, .rbc-header, .rbc-month-row, .rbc-day-bg + .rbc-day-bg {
          border-color: #495057;
        }
        
        .rbc-timeslot-group { border-bottom: 1px solid #495057; }
        .rbc-time-content { border-top: 1px solid #495057; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #3a3f45; }
        .rbc-label { color: #adb5bd; }
        .rbc-event { min-height: 100% !important; } /* Força o evento a ocupar altura */
      `}</style>

      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-white m-0 fw-bold">Agenda de Serviços</h2>
        </Col>
        
        {/* MINI CALENDÁRIO / DATE PICKER */}
        <Col md="auto" className="d-flex align-items-center gap-2">
            <Form.Label className="text-white-50 m-0 fw-bold" style={{whiteSpace: 'nowrap'}}>
              <i className="bi bi-calendar-week me-1"/> Ir para:
            </Form.Label>
            <Form.Control 
              type="date" 
              className="bg-dark text-white border-secondary"
              value={format(date, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              style={{ width: 'auto' }}
            />
        </Col>

        <Col md="auto">
          <Button variant="primary" onClick={() => openModal()}>
            <i className="bi bi-plus-lg me-1" /> Novo Agendamento
          </Button>
        </Col>
      </Row>

      <div style={{ height: 'calc(100vh - 120px)', background: '#212529', padding: 20, borderRadius: 16 }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          view={view}
          onView={setView}
          date={date}           // Vínculo com o estado 'date'
          onNavigate={setDate}  // Atualiza o estado ao navegar
          
          step={30}
          timeslots={1}
          min={new Date(0, 0, 0, 15, 0, 0)}
          max={new Date(0, 0, 0, 21, 30, 0)}
          
          components={{
            event: CustomEvent // <--- Aqui injetamos o visualizador detalhado
          }}

          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture='pt-BR'
          messages={{
            next: "Próximo", previous: "Anterior", today: "Hoje",
            month: "Mês", week: "Semana", day: "Dia", agenda: "Lista",
            date: "Data", time: "Hora", event: "Serviço", noEventsInRange: "Sem agendamentos."
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
        />
      </div>

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title>{modalData?.id ? 'Editar Agendamento' : 'Novo Agendamento'}</Modal.Title>
        </Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-white">
            
            <Form.Group className="mb-3">
              <Form.Label>Título do Serviço*</Form.Label>
              <Form.Control
                type="text"
                value={modalData?.titulo || ''}
                onChange={e => setModalData(d => ({ ...d, titulo: e.target.value }))}
                required
                autoFocus
                placeholder="Ex: Manutenção Preventiva"
              />
            </Form.Group>

            <Row>
              <Col xs={12} md={6}>
                 <Form.Group className="mb-3">
                  <Form.Label>Data e Hora*</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    step={1800} 
                    value={modalData?.dataServico || ''}
                    onChange={e => setModalData(d => ({ ...d, dataServico: e.target.value }))}
                    required
                  />
                  <Form.Text className="text-muted">Horário: 15:00 às 21:30</Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prioridade</Form.Label>
                  <Form.Select
                    value={modalData?.prioridade || 2}
                    onChange={e => setModalData(d => ({ ...d, prioridade: parseInt(e.target.value) }))}
                  >
                    <option value={1}>Alta (Urgente)</option>
                    <option value={2}>Média (Normal)</option>
                    <option value={3}>Baixa (Rotina)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Cliente*</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-secondary text-white">
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar cliente..."
                  value={clienteFiltro}
                  onChange={e => setClienteFiltro(e.target.value)}
                />
              </InputGroup>
              <Form.Select
                className="mt-2"
                value={modalData?.clienteId || ''}
                onChange={e => setModalData(d => ({ ...d, clienteId: e.target.value }))}
                required
              >
                <option value="">Selecione o Cliente...</option>
                {clientesFiltrados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} - {c.endereco}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={modalData?.status || 'EM_ABERTO'}
                onChange={e => setModalData(d => ({ ...d, status: e.target.value }))}
              >
                {STATUS_LIST.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descrição / Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={modalData?.descricao || ''}
                onChange={e => setModalData(d => ({ ...d, descricao: e.target.value }))}
              />
            </Form.Group>

          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
             {modalData?.id && (
              <Button 
                variant="outline-danger" 
                onClick={() => { setShowConfirm(true); setTarefaParaExcluir(modalData.id); }}
                className="me-auto border-0"
              >
                <i className="bi bi-trash-fill me-1"/> Excluir
              </Button>
            )}
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="success" type="submit">Salvar Agendamento</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-0">
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          Deseja realmente excluir este agendamento?
        </Modal.Body>
        <Modal.Footer className="bg-dark border-0">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Não</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Sim, Excluir</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}