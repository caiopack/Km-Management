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

// Lista estrita de horários permitidos
const HORARIOS_PERMITIDOS = [
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00', '21:30'
];

const DURACAO_PADRAO_MINUTOS = 30;

// --- CARD DO EVENTO ---
const CustomEvent = ({ event }) => {
  const { resource } = event;
  const start = event.start;

  const nome = resource.clienteNome ? resource.clienteNome.split(' ')[0] : 'Cliente';
  
  const desc = resource.descricao || 'S/ Obs';
  const descCurta = desc.length > 25 ? desc.substring(0, 25) + '...' : desc;
  
  const tel = resource.clienteTelefone || 'S/ Tel';
  const responsavel = resource.criadoPor || 'Admin';

  const valorFormatado = resource.valorPago 
    ? parseFloat(resource.valorPago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <div className="d-flex flex-column h-100 p-1" style={{ fontSize: '0.75rem', lineHeight: '1.2', overflow: 'hidden' }}>
      
      {/* 1. Nome e Hora */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-bold text-truncate" title={resource.clienteNome} style={{ maxWidth: '65%' }}>
           <i className="bi bi-person-fill me-1"></i>{nome}
        </span>
        <span className="bg-black bg-opacity-25 px-1 rounded small fw-bold" style={{ fontSize: '0.7rem' }}>
          {format(start, 'HH:mm')}
        </span>
      </div>

      {/* 2. Descrição e Valor */}
      <div className="mb-auto">
         <div className="text-white-50 text-wrap" style={{ fontSize: '0.7rem', lineHeight: '1.1' }}>
           {descCurta}
         </div>
         {valorFormatado && (
           <div className="text-success fw-bold mt-1" style={{ fontSize: '0.7rem' }}>
             {valorFormatado}
           </div>
         )}
      </div>

      {/* 3. Rodapé */}
      <div className="border-top border-white-50 pt-1 mt-1">
          <div className="d-flex align-items-center text-white-50 mb-1" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-whatsapp me-1 text-success"></i>
            <span className="text-truncate">{tel}</span>
          </div>

          <div className="d-flex justify-content-between align-items-center">
             <div className="text-white-50 fst-italic text-truncate" style={{ fontSize: '0.65rem', maxWidth: '70%' }}>
               <i className="bi bi-calendar-check me-1"></i>{responsavel}
             </div>
             <span className="badge bg-light text-dark border px-1" style={{ fontSize: '0.65rem' }}>
                {resource.duracao}m
             </span>
          </div>
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
        const dataInicio = new Date(t.dataServico);
        const dataFim = addMinutes(dataInicio, DURACAO_PADRAO_MINUTOS); 
        const duracaoMin = differenceInMinutes(dataFim, dataInicio);

        const cliente = clientes.find(c => c.id === t.clienteId);
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
            criadoPor: t.criadoPor || 'Admin',
            valorPago: t.valorPago 
          }
        };
      });
    setEventos(novosEventos);
  }, [tarefas, clientes]);

  async function fetchTarefas() {
    try { const r = await api.get('/tarefas'); setTarefas(r.data); } catch (e) { console.error(e); }
  }
  async function fetchClientes() {
    try { const r = await api.get('/clientes'); setClientes(r.data); } catch (e) { console.error(e); }
  }

  function handleSelectEvent(event) { openModal(event.resource); }
  function handleSelectSlot({ start }) { openModal(null, start); }
  function handleDateChange(e) {
    if(e.target.value){
      const [ano, mes, dia] = e.target.value.split('-').map(Number);
      setDate(new Date(ano, mes - 1, dia));
    }
  }

  // --- ABRIR MODAL COM SEPARAÇÃO DATA / HORA ---
  function openModal(tarefa = null, dataPreSelecionada = null) {
    let usuarioPadrao = 'Admin';
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if (userObj.nome) usuarioPadrao = userObj.nome;
        } catch(e) {}
    }

    if (tarefa) {
      // Backend manda "yyyy-MM-ddTHH:mm:ss" ou similar
      // Vamos quebrar em Data e Hora para os campos separados
      const dataObj = new Date(tarefa.dataServico);
      const dataStr = format(dataObj, 'yyyy-MM-dd');
      const horaStr = format(dataObj, 'HH:mm');

      setModalData({
        ...tarefa,
        clienteId: tarefa.clienteId, 
        datePart: dataStr,
        timePart: horaStr,
        criadoPor: tarefa.criadoPor || usuarioPadrao,
        valorPago: tarefa.valorPago || '' 
      });
    } else {
      let initialDate = format(new Date(), 'yyyy-MM-dd');
      let initialTime = '15:00'; // Default

      if (dataPreSelecionada) {
        initialDate = format(dataPreSelecionada, 'yyyy-MM-dd');
        // Tenta pegar a hora do slot clicado, se for válida
        const slotTime = format(dataPreSelecionada, 'HH:mm');
        if (HORARIOS_PERMITIDOS.includes(slotTime)) {
            initialTime = slotTime;
        }
      }

      setModalData({
        titulo: '', descricao: '', status: 'EM_ABERTO', prioridade: 2, clienteId: '',
        datePart: initialDate,
        timePart: initialTime,
        criadoPor: usuarioPadrao, valorPago: ''
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
    if (!modalData?.titulo || !modalData?.clienteId || !modalData?.datePart || !modalData?.timePart) return;
    
    // Constrói a data completa para o backend: "yyyy-MM-dd HH:mm"
    const finalDataServico = `${modalData.datePart} ${modalData.timePart}`;

    const payload = { 
        ...modalData,
        dataServico: finalDataServico,
        valorPago: modalData.valorPago ? parseFloat(modalData.valorPago) : null
    };

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
      
      <style>{`
        .rbc-calendar { color: #e0e0e0; font-family: 'Segoe UI', sans-serif; }
        .rbc-event-label { display: none !important; }
        .rbc-timeslot-group { min-height: 120px !important; }
        .rbc-toolbar button { color: #fff; border: 1px solid #495057; background: transparent; }
        .rbc-toolbar button:hover { background-color: #343a40; }
        .rbc-toolbar button.rbc-active { background-color: #0d6efd; border-color: #0d6efd; }
        .rbc-off-range-bg { background-color: #2c3034 !important; }
        .rbc-today { background-color: #313b4b !important; }
        .rbc-time-view, .rbc-header, .rbc-time-content, .rbc-timeslot-group { border-color: #495057; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #3a3f45; }
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
          min={new Date(0, 0, 0, 15, 0, 0)} // Exibição: 15:00
          max={new Date(0, 0, 0, 21, 30, 0)} // Exibição: 21:30
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
            
            {/* --- MUDANÇA: CAMPOS SEPARADOS DE DATA E HORA --- */}
            <Row>
              <Col xs={12} md={6}>
                 <Form.Group className="mb-3">
                    <Form.Label>Data*</Form.Label>
                    <Form.Control 
                        type="date" 
                        value={modalData?.datePart || ''} 
                        onChange={e => setModalData(d => ({ ...d, datePart: e.target.value }))} 
                        required 
                        className="bg-dark text-white border-secondary" 
                    />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Horário* (15:00 - 21:30)</Form.Label>
                    <Form.Select 
                        value={modalData?.timePart || ''} 
                        onChange={e => setModalData(d => ({ ...d, timePart: e.target.value }))} 
                        required 
                        className="bg-dark text-white border-secondary"
                    >
                        {HORARIOS_PERMITIDOS.map(hora => (
                            <option key={hora} value={hora}>{hora}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Cliente*</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-secondary border-secondary text-white"><i className="bi bi-search" /></InputGroup.Text>
                            <Form.Control placeholder="Buscar..." value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)} className="bg-dark text-white border-secondary" />
                        </InputGroup>
                        <Form.Select className="mt-2 bg-dark text-white border-secondary" value={modalData?.clienteId || ''} onChange={e => setModalData(d => ({ ...d, clienteId: e.target.value }))} required>
                            <option value="">Selecione...</option>
                            {clientesFiltrados.map(c => (<option key={c.id} value={c.id}>{c.nome} {c.endereco ? `- ${c.endereco}` : ''}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                     <Form.Group className="mb-3">
                        <Form.Label>Agendado Por</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Nome do responsável"
                            value={modalData?.criadoPor || ''} 
                            onChange={e => setModalData(d => ({ ...d, criadoPor: e.target.value }))} 
                            className="bg-dark text-white border-secondary" 
                        />
                        <Form.Text className="text-white-50" style={{fontSize: '0.7rem'}}>
                            (Padrão: Usuário Logado)
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3"><Form.Label>Status</Form.Label>
                        <Form.Select value={modalData?.status || 'EM_ABERTO'} onChange={e => setModalData(d => ({ ...d, status: e.target.value }))} className="bg-dark text-white border-secondary">
                            {STATUS_LIST.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </Form.Select>
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

            <Row>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3"><Form.Label>Valor Pago (R$)</Form.Label>
                        <Form.Control 
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            value={modalData?.valorPago || ''} 
                            onChange={e => setModalData(d => ({ ...d, valorPago: e.target.value }))} 
                            className="bg-dark text-white border-secondary" 
                        />
                    </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3"><Form.Label>Descrição / Obs</Form.Label>
                        <Form.Control type="text" placeholder="Observações do serviço" value={modalData?.descricao || ''} onChange={e => setModalData(d => ({ ...d, descricao: e.target.value }))} className="bg-dark text-white border-secondary" />
                    </Form.Group>
                </Col>
            </Row>
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