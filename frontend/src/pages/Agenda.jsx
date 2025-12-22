import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import {
  Button,
  Modal,
  Form,
  Row,
  Col,
  Container,
  InputGroup,
  Spinner
} from 'react-bootstrap';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import addMinutes from 'date-fns/addMinutes';
import addDays from 'date-fns/addDays';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../index.css';
import TipToast from '../components/TipToast';

// Bibliotecas para PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const locales = { 'pt-BR': ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), 
  getDay,
  locales,
});

const STATUS_LIST = [
  { value: 'A_PAGAR', label: 'A Pagar' },
  { value: 'PAGO', label: 'Pago' }
];

const FREQUENCIA_COLORS = {
  1: '#0D6EFD', // Primeira Vez -> Azul
  2: '#198754'  // Recorrente -> Verde
};

const HORARIOS_PERMITIDOS = [
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00', '21:30'
];

const DURACAO_PADRAO_MINUTOS = 20;

// --- CARD DO EVENTO ---
const CustomEvent = ({ event }) => {
  const { resource } = event;
  const start = event.start;

  const nomeExibicao = resource.clienteNome 
    ? resource.clienteNome.split(' ')[0] 
    : (resource.titulo || 'Agendamento');
  
  const desc = resource.descricao || 'S/ Obs';
  const descCurta = desc.length > 25 ? desc.substring(0, 25) + '...' : desc;
  
  const tel = resource.clienteTelefone || 'S/ Tel';
  const responsavel = resource.criadoPor || 'Admin';

  const valorPagoFmt = resource.valorPago 
    ? parseFloat(resource.valorPago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
    
  const isPago = resource.status === 'PAGO';
  const statusLabel = isPago ? 'Pago' : 'A Pagar';
  const statusColor = isPago ? '#198754' : '#DC3545'; 

  const frequenciaVal = resource.prioridade || 2; 
  const frequenciaLabel = frequenciaVal === 1 ? '1ª Vez' : 'Recorrente';
  const frequenciaColor = FREQUENCIA_COLORS[frequenciaVal];

  return (
    <div className="d-flex flex-column h-100 p-1" style={{ fontSize: '0.7rem', lineHeight: '1.1', overflow: 'hidden' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-bold text-truncate" title={nomeExibicao} style={{ maxWidth: '65%' }}>
           <i className={`bi ${resource.clienteNome ? 'bi-person-fill' : 'bi-calendar-event'} me-1`}></i>
           {nomeExibicao}
        </span>
        <span className="bg-black bg-opacity-25 px-1 rounded small fw-bold" style={{ fontSize: '0.65rem' }}>
          {format(start, 'HH:mm')}
        </span>
      </div>

      <div className="mb-auto">
         <div className="text-white-50 text-wrap text-truncate" style={{ maxHeight: '1.2em' }}>
           {descCurta}
         </div>
         
         <div className="d-flex flex-wrap gap-2 mt-1" style={{ fontSize: '0.65rem' }}>
            {resource.quantidadePessoas && (
                <span className="text-warning"><i className="bi bi-people-fill me-1"/>{resource.quantidadePessoas}</span>
            )}
            
            <div className="d-flex flex-column">
                <span className="fw-bold" style={{ color: frequenciaColor }}>
                    {frequenciaLabel}
                </span>
                
                {valorPagoFmt && (
                    <span className="fw-bold" style={{ color: statusColor }}>
                        {statusLabel}: {valorPagoFmt}
                    </span>
                )}
            </div>
         </div>
      </div>

      <div className="border-top border-white-50 pt-1 mt-1">
          <div className="d-flex align-items-center text-white-50" style={{ marginBottom: '2px' }}>
            <i className="bi bi-whatsapp me-1 text-success"></i>
            <span className="text-truncate">{tel}</span>
          </div>

          <div className="d-flex justify-content-between align-items-center">
             <div className="text-white-50 fst-italic text-truncate" style={{ fontSize: '0.6rem', maxWidth: '70%' }}>
               {responsavel}
             </div>
             <span className="badge bg-light text-dark border px-1" style={{ fontSize: '0.6rem' }}>
                {resource.duracao}m
             </span>
          </div>
      </div>
    </div>
  );
};

export default function Agenda() {
  const calendarRef = useRef(null);

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
  const [isExporting, setIsExporting] = useState(false);

  const [horariosOpcoes, setHorariosOpcoes] = useState(HORARIOS_PERMITIDOS);

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
        const nomeCliente = cliente ? cliente.nome : (t.clienteNome || null);
        const enderecoCliente = cliente ? cliente.endereco : '';
        const telefoneCliente = cliente ? (cliente.telefone || cliente.celular) : '';

        return {
          id: t.id,
          title: nomeCliente || t.titulo, 
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
            valorPago: t.valorPago,
            valorTotal: t.valorTotal,
            quantidadePessoas: t.quantidadePessoas,
            status: t.status,
            prioridade: t.prioridade
          }
        };
      });
    setEventos(novosEventos);
  }, [tarefas, clientes]);

  useEffect(() => {
    if (modalData?.datePart) {
        const [ano, mes, dia] = modalData.datePart.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, dia);
        const dayOfWeek = getDay(dataObj); 

        if (dayOfWeek === 0) {
            setHorariosOpcoes(HORARIOS_PERMITIDOS.filter(h => h <= '19:30'));
        } else {
            setHorariosOpcoes(HORARIOS_PERMITIDOS);
        }
    }
  }, [modalData?.datePart]);

  async function fetchTarefas() {
    try { const r = await api.get('/tarefas'); setTarefas(r.data); } catch (e) { console.error(e); }
  }
  async function fetchClientes() {
    try { const r = await api.get('/clientes'); setClientes(r.data); } catch (e) { console.error(e); }
  }

  // --- EXPORTAR PDF VISUAL (BLINDADO CONTRA CORTES) ---
  const exportToPDF = async () => {
    if (!calendarRef.current) return;
    setIsExporting(true);

    const originalHeight = calendarRef.current.style.height;
    const originalOverflow = calendarRef.current.style.overflow;
    const originalWindowScroll = window.scrollY; // Salva a posição do scroll do usuário

    try {
      // 1. Rola a página inteira para o topo (Corrige corte superior)
      window.scrollTo(0, 0);

      // 2. Expande o calendário para um tamanho GIGANTE (Corrige corte inferior)
      // 2500px é mais que suficiente para desenhar de 15h até 21:30h com folga.
      calendarRef.current.style.height = '2500px'; 
      calendarRef.current.style.overflow = 'visible';

      // 3. Garante que qualquer scroll interno do componente também esteja zerado
      const internalScroll = calendarRef.current.querySelector('.rbc-time-content');
      if (internalScroll) internalScroll.scrollTop = 0;

      // Aguarda um tempo para o navegador renderizar o layout novo
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Captura
      // height: calendarRef.current.scrollHeight -> Garante que pega TUDO que foi renderizado
      // scrollY: 0 -> Força o eixo Y do print a começar do topo
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#212529',
        scrollY: 0, 
        x: 0,
        height: calendarRef.current.scrollHeight, // Pega a altura total expandida
        windowHeight: calendarRef.current.scrollHeight,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      // 5. Gera PDF no tamanho exato da imagem capturada
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height] 
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`agenda_${format(date, 'yyyy-MM-dd')}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Erro ao gerar PDF");
    } finally {
      // 6. Restaura tudo como estava
      calendarRef.current.style.height = originalHeight;
      calendarRef.current.style.overflow = originalOverflow;
      window.scrollTo(0, originalWindowScroll); // Devolve o usuário pro lugar dele
      setIsExporting(false);
    }
  };

  function handleSelectEvent(event) { openModal(event.resource); }

  function handleSelectSlot({ start }) { 
      const day = getDay(start);
      if (day === 1) { 
          alert("O Kart está fechado nas segundas-feiras. Selecione outro dia.");
          return;
      }
      if (day === 0) {
          const hour = start.getHours();
          const minutes = start.getMinutes();
          const timeVal = hour * 100 + minutes;
          if (timeVal > 1930) {
              alert("No domingo, o Kart funciona somente até as 19:30.");
              return;
          }
      }
      openModal(null, start); 
  }

  function handleDateChange(e) {
    if(e.target.value){
      const [ano, mes, dia] = e.target.value.split('-').map(Number);
      setDate(new Date(ano, mes - 1, dia));
    }
  }

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
      const dataObj = new Date(tarefa.dataServico);
      const dataStr = format(dataObj, 'yyyy-MM-dd');
      const horaStr = format(dataObj, 'HH:mm');

      setModalData({
        ...tarefa,
        clienteId: tarefa.clienteId || '', 
        datePart: dataStr,
        timePart: horaStr,
        criadoPor: tarefa.criadoPor || usuarioPadrao,
        valorPago: tarefa.valorPago || '',
        valorTotal: tarefa.valorTotal || '',
        quantidadePessoas: tarefa.quantidadePessoas || ''
      });
    } else {
      let baseDate = dataPreSelecionada || new Date();
      if (getDay(baseDate) === 1) {
          baseDate = addDays(baseDate, 1);
      }

      let initialDate = format(baseDate, 'yyyy-MM-dd');
      let initialTime = '15:00'; 

      if (dataPreSelecionada) {
        const slotTime = format(dataPreSelecionada, 'HH:mm');
        if (HORARIOS_PERMITIDOS.includes(slotTime)) {
            initialTime = slotTime;
        }
      }

      setModalData({
        titulo: '', descricao: '', 
        status: 'A_PAGAR',
        prioridade: 2, 
        clienteId: '',
        datePart: initialDate,
        timePart: initialTime,
        criadoPor: usuarioPadrao, valorPago: '', valorTotal: '', quantidadePessoas: ''
      });
    }
    setClienteFiltro(''); setValidated(false); setShowModal(true);
  }

  function closeModal() {
    setShowModal(false); setModalData(null); setValidated(false); setClienteFiltro('');
  }

  const handleCalcChange = (field, value) => {
      setModalData(prev => {
          const newData = { ...prev, [field]: value };
          const qtd = parseFloat(newData.quantidadePessoas);
          const unit = parseFloat(newData.valorPago);
          if (!isNaN(qtd) && !isNaN(unit)) {
              newData.valorTotal = (qtd * unit).toFixed(2);
          }
          return newData;
      });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setValidated(true);
    if (!modalData?.titulo || !modalData?.datePart || !modalData?.timePart) return;
    
    const [ano, mes, dia] = modalData.datePart.split('-').map(Number);
    const checkDate = new Date(ano, mes - 1, dia);
    const day = getDay(checkDate);

    if (day === 1) {
        alert("Não é possível agendar nas segundas-feiras (Fechado). Por favor, mude a data.");
        return;
    }
    if (day === 0 && modalData.timePart > '19:30') {
        alert("Domingo o funcionamento é até 19:30.");
        return;
    }

    const finalDataServico = `${modalData.datePart} ${modalData.timePart}`;

    const payload = { 
        ...modalData,
        dataServico: finalDataServico,
        valorPago: modalData.valorPago ? parseFloat(modalData.valorPago) : null,
        valorTotal: modalData.valorTotal ? parseFloat(modalData.valorTotal) : null,
        quantidadePessoas: modalData.quantidadePessoas ? parseInt(modalData.quantidadePessoas) : null,
        clienteId: modalData.clienteId ? modalData.clienteId : null 
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
    const backgroundColor = FREQUENCIA_COLORS[event.resource.prioridade] || '#DC3545';
    // Se estiver pago, fica cinza
    const finalColor = event.resource.status === 'PAGO' ? '#495057' : backgroundColor;

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

  const slotPropGetter = (date) => {
    const day = getDay(date);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const timeVal = hour * 100 + minutes;

    const isMonday = day === 1;
    const isSundayClosed = day === 0 && timeVal > 1930;

    if (isMonday || isSundayClosed) { 
        return {
            style: {
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
                cursor: 'not-allowed',
            }
        };
    }

    if (!modalData?.datePart || !modalData?.timePart) return {};

    const slotIso = format(date, 'yyyy-MM-dd HH:mm');
    const selectedIso = `${modalData.datePart} ${modalData.timePart}`;

    if (slotIso === selectedIso) {
      return {
        style: {
          backgroundColor: 'rgba(220, 53, 69, 0.2)', 
          border: '2px solid #DC3545', 
        },
      };
    }
    return {};
  };

  return (
    <Container fluid className="py-3 d-flex flex-column" style={{ minHeight: '100vh', padding: '20px 32px' }}>
      
      <style>{`
        .rbc-calendar { color: #e0e0e0; font-family: 'Segoe UI', sans-serif; }
        .rbc-event-label { display: none !important; }
        .rbc-timeslot-group { min-height: 150px !important; }

        ::-webkit-calendar-picker-indicator {
            filter: invert(27%) sepia(91%) saturate(2352%) hue-rotate(339deg) brightness(93%) contrast(89%);
            cursor: pointer;
        }

        .rbc-toolbar button { color: #fff; border: 1px solid #495057; background: transparent; }
        .rbc-toolbar button:hover { background-color: #343a40; }
        .rbc-toolbar button.rbc-active { background-color: #DC3545; border-color: #DC3545; }
        
        .rbc-off-range-bg { background-color: #2c3034 !important; }
        .rbc-today { background-color: transparent !important; } 
        .rbc-header.rbc-today { background-color: #313b4b !important; }

        .rbc-time-view, .rbc-header, .rbc-time-content, .rbc-timeslot-group { border-color: #495057; }
        .rbc-day-slot .rbc-time-slot { border-top: 1px solid #3a3f45; }
        .rbc-event { padding: 0 !important; background: transparent !important; outline: none; box-shadow: none; }
      `}</style>

      <Row className="mb-3 align-items-center g-3">
        <Col md><h2 className="text-white m-0 fw-bold">Agenda</h2></Col>
        <Col md="auto" className="d-flex align-items-center gap-2">
            <Form.Label className="text-white-50 m-0 fw-bold">
                <i className="bi bi-calendar-week me-1" style={{ color: '#DC3545', fontSize: '1.2rem' }}/> 
                Ir para:
            </Form.Label>
            <Form.Control type="date" className="bg-dark text-white border-secondary" value={format(date, 'yyyy-MM-dd')} onChange={handleDateChange} style={{ width: 'auto' }} />
        </Col>
        <Col md="auto" className="d-flex gap-2">
          {/* BOTÃO EXPORTAR PDF VISUAL (Tamanho Real) */}
          <Button variant="outline-light" onClick={exportToPDF} disabled={isExporting}>
            {isExporting ? <Spinner size="sm" animation="border" /> : <i className="bi bi-file-earmark-pdf-fill me-1" />}
            PDF
          </Button>
          <Button variant="danger" onClick={() => openModal()}><i className="bi bi-plus-lg me-1" /> Novo</Button>
        </Col>
      </Row>

      {/* DIV DO CALENDÁRIO COM REF */}
      <div 
        ref={calendarRef} 
        style={{ height: 'calc(100vh - 140px)', background: '#212529', padding: 15, borderRadius: 12, overflowY: 'hidden' }}
      >
        <Calendar
          localizer={localizer}
          events={eventos}
          views={['week', 'month', 'day']} 
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          step={30}
          timeslots={1}
          min={new Date(0, 0, 0, 15, 0, 0)} 
          max={new Date(0, 0, 0, 21, 30, 0)} 
          slotPropGetter={slotPropGetter}
          components={{ event: CustomEvent }}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture='pt-BR'
          messages={{ next: ">", previous: "<", today: "Hoje", week: "Semana", date: "Data", time: "Hora", event: "Serviço", month: "Mês", day: "Dia" }}
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
              <Form.Label>Título (Se sem cliente)*</Form.Label>
              <Form.Control type="text" value={modalData?.titulo || ''} onChange={e => setModalData(d => ({ ...d, titulo: e.target.value }))} required className="bg-dark text-white border-secondary" />
            </Form.Group>
            
            <Row>
              <Col xs={12} md={6}>
                 <Form.Group className="mb-3">
                    <Form.Label>Data*</Form.Label>
                    <Form.Control type="date" value={modalData?.datePart || ''} onChange={e => setModalData(d => ({ ...d, datePart: e.target.value }))} required className="bg-dark text-white border-secondary" />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Horário*</Form.Label>
                    <Form.Select value={modalData?.timePart || ''} onChange={e => setModalData(d => ({ ...d, timePart: e.target.value }))} required className="bg-dark text-white border-secondary">
                        {horariosOpcoes.map(hora => (<option key={hora} value={hora}>{hora}</option>))}
                    </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Cliente (Opcional)</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-secondary border-secondary text-white"><i className="bi bi-search" /></InputGroup.Text>
                            <Form.Control placeholder="Buscar..." value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)} className="bg-dark text-white border-secondary" />
                        </InputGroup>
                        <Form.Select className="mt-2 bg-dark text-white border-secondary" value={modalData?.clienteId || ''} onChange={e => setModalData(d => ({ ...d, clienteId: e.target.value }))}>
                            <option value="">-- Sem cliente --</option>
                            {clientesFiltrados.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                     <Form.Group className="mb-3">
                        <Form.Label>Criado Por</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={modalData?.criadoPor || ''} 
                            readOnly 
                            className="bg-secondary text-white border-secondary" 
                        />
                        <Form.Text className="text-white-50" style={{fontSize: '0.7rem'}}>
                            Preenchimento automático
                        </Form.Text>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col xs={4}>
                    <Form.Group className="mb-3"><Form.Label>Qtd. Pessoas</Form.Label>
                        <Form.Control 
                            type="number" 
                            placeholder="0" 
                            value={modalData?.quantidadePessoas || ''} 
                            onChange={e => handleCalcChange('quantidadePessoas', e.target.value)} 
                            className="bg-dark text-white border-secondary" 
                        />
                    </Form.Group>
                </Col>
                <Col xs={4}>
                    <Form.Group className="mb-3"><Form.Label>Valor/Pessoa</Form.Label>
                        <Form.Control 
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            value={modalData?.valorPago || ''} 
                            onChange={e => handleCalcChange('valorPago', e.target.value)} 
                            className="bg-dark text-white border-secondary" 
                        />
                    </Form.Group>
                </Col>
                <Col xs={4}>
                    <Form.Group className="mb-3"><Form.Label>Total (Est.)</Form.Label>
                        <Form.Control 
                            type="number" 
                            step="0.01"
                            placeholder="0,00" 
                            value={modalData?.valorTotal || ''} 
                            readOnly 
                            className="bg-secondary text-white border-secondary" 
                        />
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3"><Form.Label>Status</Form.Label>
                        <Form.Select value={modalData?.status || 'A_PAGAR'} onChange={e => setModalData(d => ({ ...d, status: e.target.value }))} className="bg-dark text-white border-secondary">
                            {STATUS_LIST.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                    <Form.Group className="mb-3"><Form.Label>Frequência</Form.Label>
                        <Form.Select value={modalData?.prioridade || 2} onChange={e => setModalData(d => ({ ...d, prioridade: parseInt(e.target.value) }))} className="bg-dark text-white border-secondary">
                            <option value={1}>Primeira Vez</option>
                            <option value={2}>Recorrente</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mb-3"><Form.Label>Descrição / Obs</Form.Label>
                <Form.Control type="text" placeholder="Observações do serviço" value={modalData?.descricao || ''} onChange={e => setModalData(d => ({ ...d, descricao: e.target.value }))} className="bg-dark text-white border-secondary" />
            </Form.Group>

          </Modal.Body>
          <Modal.Footer className="bg-dark border-secondary">
             {modalData?.id && (<Button variant="outline-danger" onClick={() => { setShowConfirm(true); setTarefaParaExcluir(modalData.id); }} className="me-auto"><i className="bi bi-trash-fill me-1"/> Excluir</Button>)}
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="success" type="submit">Salvar</Button>
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

      <TipToast message="Clique na grade para agendar ou em um evento para editar." />
    </Container>
  );
}