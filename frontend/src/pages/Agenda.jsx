import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Container,
  InputGroup
} from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addMinutes from 'date-fns/addMinutes';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../index.css';

// --- CONFIGURAÇÃO DATE-FNS ---
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
  1: '#DC3545', // Alta
  2: '#FFC107', // Média
  3: '#198754'  // Baixa
};

const DURACAO_PADRAO_MINUTOS = 30;

// --- COMPONENTE DO EVENTO (CARD) ---
const CustomEvent = ({ event }) => {
  const { resource } = event;
  const start = event.start;

  // Tratamento de segurança para strings
  const nome = resource.clienteNome ? resource.clienteNome.split(' ')[0] : 'Cliente';
  const desc = resource.descricao || 'S/ Obs';
  // Corta descrição para não quebrar o layout (máx 25 chars)
  const descCurta = desc.length > 25 ? desc.substring(0, 25) + '...' : desc;
  const tel = resource.clienteTelefone || '';

  return (
    <div className="d-flex flex-column h-100 p-1" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
      
      {/* CABEÇALHO: Nome e Hora (Alinhados topo) */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-bold text-truncate" title={resource.clienteNome}>
           <i className="bi bi-person-fill me-1"></i>{nome}
        </span>
        <span className="bg-black bg-opacity-25 px-1 rounded small fw-bold" style={{ fontSize: '0.7rem' }}>
          {format(start, 'HH:mm')}
        </span>
      </div>

      {/* CORPO: Descrição (Texto cinza claro) */}
      <div className="text-white-50 text-wrap mb-1" style={{ fontSize: '0.7rem', lineHeight: '1.0' }}>
        {descCurta}
      </div>

      {/* RODAPÉ: Telefone e Duração (Empurrado para baixo com mt-auto) */}
      <div className="mt-auto d-flex justify-content-between align-items-center border-top border-white-50 pt-1">
         <div className="text-white-50" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-whatsapp me-1"></i>
            {tel.slice(-4) || '--'}
         </div>
         <span className="badge bg-light text-dark border px-1" style={{ fontSize: '0.65rem' }}>
            {resource.duracao}m
         </span>
      </div>

    </div>
  );
};

export default function Agenda() {
  const [tarefas, setTarefas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [view, setView] = useState('week'); 
  const [date, setDate] = useState(new Date());

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

  useEffect(() => {
    const novosEventos = tarefas
      .filter(t => t.dataServico)
      .map(t => {
        const [dataPart, horaPart] = t.dataServico.split(' ');
        const [ano, mes, dia] = dataPart.split('-').map(Number);
        const [hora, minuto] = horaPart.split(':').map(Number);
        
        const dataInicio = new Date(ano, mes - 1, dia, hora, minuto);
        const dataFim = addMinutes(dataInicio, DURACAO_PADRAO_MINUTOS); 
        
        const duracaoMin = differenceInMinutes(dataFim, dataInicio);

        const cliente = clientes.find(c => c.id === t.clienteId || c.id === t.cliente_id);
        const nomeCliente = cliente ? cliente.nome : (t.clienteNome || '?');
        const enderecoCliente = cliente ? cliente.endereco : '';
        const telefoneCliente = cliente ? (cliente.telefone || cliente.celular) : '';

        return {
          id: t.id,
          title: nomeCliente, 
          start: dataInicio,
          end: dataFim,
          allDay: false, 
          resource: {
            ...t,
            clienteNome: nomeCliente,
            clienteEndereco: enderecoCliente,
            clienteTelefone: telefoneCliente,
            duracao: duracaoMin,
            criadoPor: t.criadoPor || 'Admin' 
          }
        };
      });
    setEventos(novosEventos);
  }, [tarefas, clientes]);

  async function fetchTarefas() {
    try {
      const resp = await api.get('/tarefas');
      setTarefas(resp.data);
    } catch (error) { console.error(error); }
  }

  async function fetchClientes() {
    try {
      const resp = await api.get('/clientes');
      setClientes(resp.data);
    } catch (error) { console.error(error); }
  }

  function handleSelectEvent(event) { openModal(event.resource); }
  function handleSelectSlot({ start }) { openModal(null, start); }
  function handleDateChange(e) {
    if(e.target.value){
      const [ano, mes, dia] = e.target.value.split('-').map(Number);
      setDate(new Date(ano, mes - 1, dia));
    }
  }

  function openModal(tarefa = null, dataPreSelecionada = null) {
    if (tarefa) {
      setModalData({
        ...tarefa,
        clienteId: tarefa.clienteId || tarefa.cliente_id,
        dataServico: tarefa.dataServico.replace(' ', 'T')
      });
    } else {
      let dataStr = '';
      if (dataPreSelecionada) {
        const offset = dataPreSelecionada.getTimezoneOffset() * 60000;
        dataStr = new Date(dataPreSelecionada.getTime() - offset).toISOString().slice(0, 16);
      }
      setModalData({
        titulo: '', descricao: '', status: 'EM_ABERTO', prioridade: 2, clienteId: '', dataServico: dataStr
      });
    }
    setClienteFiltro(''); setValidated(false); setShowModal(true);
  }

  function closeModal() {
    setShowModal(false); setModalData(null); setValidated(false); setClienteFiltro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setValidated(true);
    if (!modalData?.titulo || !modalData?.clienteId || !modalData?.dataServico) return;
    
    const payload = { ...modalData, dataServico: modalData.dataServico.replace('T', ' ') };

    try {
      if (modalData.id) await api.put(`/tarefas/${modalData.id}`, payload);
      else await api.post('/tarefas', payload);
      fetchTarefas(); closeModal();
    } catch (err) { alert('Erro ao salvar.'); }
  }

  async function handleConfirmDelete() {
    if (tarefaParaExcluir) {
      await api.delete(`/tarefas/${tarefaParaExcluir}`);
      fetchTarefas(); setShowConfirm(false); closeModal();
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
    c.endereco.toLowerCase().includes(clienteFiltro.toLowerCase())
  );

  const eventStyleGetter = (event) => {
    const backgroundColor = PRIORIDADE_COLORS[event.resource.prioridade] || '#0066FF';
    const finalColor = event.resource.status === 'FINALIZADO' ? '#495057' : backgroundColor;

    return {
      style: {
        backgroundColor: finalColor,
        borderRadius: '6px',
        opacity: 1,
        color: 'white',
        border: '0px',
        display: 'block',
        margin: '1px',
        height: 'calc(100% - 2px)', 
        overflow: 'hidden'
      }
    };
  };

  return (
    <Container fluid className="py-3 d-flex flex-column" style={{ minHeight: '100vh', padding: '20px 32px' }}>
      
      {/* --- ESTILOS CSS CRÍTICOS --- */}
      <style>{`
        /* Cor base do texto e fontes */
        .rbc-calendar { color: #e0e0e0; font-family: 'Segoe UI', sans-serif; }
        
        /* 1. REMOVE O LABEL PADRÃO DE HORA (LIBERA ESPAÇO NO TOPO) */
        .rbc-event-label { display: none !important; }
        
        /* 2. FORÇA A ALTURA DA LINHA PARA 100PX (PARA CABER TUDO) */
        .rbc-timeslot-group { min-height: 100px !important; }

        /* Estilização da Toolbar */
        .rbc-toolbar button { color: #fff; border: 1px solid #495057; background: transparent; }
        .rbc-toolbar button:hover { background-color: #343a40; }
        .rbc-toolbar button.rbc-active { background-color: #0d6efd; border-color: #0d6efd; }
        
        /* Cores das células e linhas */
        .rbc-off-range-bg { background-color: #2c3034 !important; }
        .rbc-today { background-color: #313b4b !important; }
        .rbc-time-view, .rbc-header, .rbc-time-content, .rbc-timeslot-group { border-color: #495057; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #3a3f45; }
        
        /* Remove padding padrão do evento da biblioteca */
        .rbc-event { padding: 0 !important; background: transparent !important; outline: none; box-shadow: none; }
      `}</style>

      <Row className="mb-3 align-items-center g-3">
        <Col md><h2 className="text-white m-0 fw-bold">Agenda</h2></Col>
        <Col md="auto" className="d-flex align-items-center gap-2">
            <Form.Label className="text-white-50 m-0 fw-bold"><i className="bi bi-calendar-week me-1"/> Ir para:</Form.Label>
            <Form.Control type="date" className="bg-dark text-white border-secondary" value={format(date, 'yyyy-MM-dd')} onChange={handleDateChange} style={{ width: 'auto' }} />
        </Col>
        <Col md="auto">
          <Button variant="primary" onClick={() => openModal()}><i className="bi bi-plus-lg me-1" /> Novo</Button>
        </Col>
      </Row>

      <div style={{ height: 'calc(100vh - 140px)', background: '#212529', padding: 15, borderRadius: 12, overflowY: 'hidden' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          
          views={['week']}
          view={view}
          onView={setView}
          
          date={date}
          onNavigate={setDate}
          step={30}
          timeslots={1}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          components={{ event: CustomEvent }}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture='pt-BR'
          messages={{ next: ">", previous: "<", today: "Hoje", week: "Semana", date: "Data", time: "Hora", event: "Serviço" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
        />
      </div>

      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>{modalData?.id ? 'Editar' : 'Novo'} Agendamento</Modal.Title></Modal.Header>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Body className="bg-dark text-white">
            <Form.Group className="mb-3">
              <Form.Label>Título*</Form.Label>
              <Form.Control type="text" value={modalData?.titulo || ''} onChange={e => setModalData(d => ({ ...d, titulo: e.target.value }))} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                 <Form.Group className="mb-3"><Form.Label>Data e Hora*</Form.Label>
                  <Form.Control type="datetime-local" step={1800} value={modalData?.dataServico || ''} onChange={e => setModalData(d => ({ ...d, dataServico: e.target.value }))} required className="bg-dark text-white border-secondary" />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3"><Form.Label>Prioridade</Form.Label>
                  <Form.Select value={modalData?.prioridade || 2} onChange={e => setModalData(d => ({ ...d, prioridade: parseInt(e.target.value) }))} className="bg-dark text-white border-secondary">
                    <option value={1}>Alta</option><option value={2}>Média</option><option value={3}>Baixa</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Cliente*</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-secondary border-secondary text-white"><i className="bi bi-search" /></InputGroup.Text>
                <Form.Control placeholder="Buscar..." value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)} className="bg-dark text-white border-secondary" />
              </InputGroup>
              <Form.Select className="mt-2 bg-dark text-white border-secondary" value={modalData?.clienteId || ''} onChange={e => setModalData(d => ({ ...d, clienteId: e.target.value }))} required>
                <option value="">Selecione...</option>
                {clientesFiltrados.map(c => (<option key={c.id} value={c.id}>{c.nome} {c.endereco ? `- ${c.endereco}` : ''}</option>))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Status</Form.Label>
              <Form.Select value={modalData?.status || 'EM_ABERTO'} onChange={e => setModalData(d => ({ ...d, status: e.target.value }))} className="bg-dark text-white border-secondary">
                {STATUS_LIST.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Descrição (Qtd Pessoas)</Form.Label>
              <Form.Control type="text" placeholder="Ex: 10 pessoas" value={modalData?.descricao || ''} onChange={e => setModalData(d => ({ ...d, descricao: e.target.value }))} className="bg-dark text-white border-secondary" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
             {modalData?.id && (<Button variant="outline-danger" onClick={() => { setShowConfirm(true); setTarefaParaExcluir(modalData.id); }} className="me-auto"><i className="bi bi-trash-fill me-1"/> Excluir</Button>)}
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton className="bg-dark text-white border-secondary"><Modal.Title>Excluir?</Modal.Title></Modal.Header>
        <Modal.Body className="bg-dark text-white">Confirma?</Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Não</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Sim</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}