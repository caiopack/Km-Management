import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Row, Col, Card, Button, Container, ButtonGroup, Form
} from 'react-bootstrap';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList
} from 'recharts';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TipToast from '../components/TipToast';

// Cores: Verde (Já Pago), Vermelho (Falta), Azul Escuro (Total Esperado)
const COLORS_PAGAMENTO = ['#198754', '#DC3545', '#0D6EFD'];
const COLORS_FREQUENCIA = ['#0D6EFD', '#6f42c1']; 

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState({
    totalAgendamentos: 0,
    clientesNovos: 0,
    clientesRecorrentes: 0,
    valorEsperado: 0
  });

  const [period, setPeriod] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [graficoPagamentos, setGraficoPagamentos] = useState([]);
  const [graficoFrequencia, setGraficoFrequencia] = useState([]);

  const [authed, setAuthed] = useState(undefined);
  const [windowW, setWindowW] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowW < 700;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthed(false);
      navigate('/login', { replace: true });
    } else {
      setAuthed(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (authed !== true) return;
    
    const loadData = async () => {
      try {
        const { data: stats } = await api.get('/tarefas/dashboard', {
            params: { period, date: selectedDate }
        });

        setDashboardData({
            totalAgendamentos: stats.totalAgendamentos,
            valorEsperado: stats.valorEsperado,
            clientesNovos: stats.clientesNovos,
            clientesRecorrentes: stats.clientesRecorrentes
        });

        setGraficoPagamentos([
          { name: 'Já Pago', value: stats.valorRecebido || 0 },
          { name: 'Falta Pagar', value: stats.valorAPagar || 0 },
          { name: 'Total Esperado', value: stats.valorEsperado || 0 }
        ]);

        setGraficoFrequencia([
          { name: '1ª Vez', value: stats.clientesNovos },
          { name: 'Recorrente', value: stats.clientesRecorrentes }
        ]);

      } catch (err) {
        console.error("Erro ao carregar dashboard", err);
      }
    };

    loadData();
  }, [authed, period, selectedDate]);

  function PieExternalLabel({ cx, cy, midAngle, outerRadius, fill, value, index }) {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius + (isMobile ? 12 : 22);
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
    
    const entry = graficoPagamentos[index];
    if (!entry) return null;

    const formattedVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

    return (
      <text
        x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
        fontSize={isMobile ? 11 : 12} fontWeight={600} style={{ textShadow: '0 2px 6px #181a1b' }}
      >
        {`${entry.name}: ${formattedVal}`}
      </text>
    );
  }

  function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const displayValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      return (
        <div style={{
          background: '#23272b', border: '1.5px solid #222', color: '#fff',
          borderRadius: 8, padding: 10, fontWeight: 500, boxShadow: '0 2px 14px #0002',
        }}>
          <span>{name}</span>
          <span style={{ float: 'right', marginLeft: 12, fontWeight: 700 }}>{displayValue}</span>
        </div>
      );
    }
    return null;
  }

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div style={{ minHeight: '100vh', width: '100%', boxSizing: 'border-box', paddingBottom: isMobile ? 40 : 24, overflow: 'auto' }}>
      <Container fluid className="px-0" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', paddingLeft: isMobile ? 8 : 32, paddingRight: isMobile ? 8 : 32, paddingTop: isMobile ? 10 : 30, paddingBottom: isMobile ? 28 : 20 }}>
        
        <Row className="mb-2 mx-0 align-items-center">
          <Col xs={12} md={6}>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: isMobile ? 20 : 32, marginLeft: isMobile ? 5 : 0 }}>
              Dashboard
            </h2>
            <div className="text-secondary fs-6 mb-2" style={{ maxWidth: 480, marginLeft: isMobile ? 5 : 0 }}>
              Visão geral de tarefas e clientes do <b>Kart Mônaco</b>
            </div>
          </Col>

          <Col xs={12} md={6} className={`d-flex ${isMobile ? "justify-content-start flex-wrap" : "justify-content-md-end"} align-items-center mb-2 gap-2`}>
             <Form.Control 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-dark text-white border-secondary"
               style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
             />

             <ButtonGroup size="sm">
                <Button variant={period === 'day' ? 'danger' : 'outline-secondary'} onClick={() => setPeriod('day')}>Dia</Button>
                <Button variant={period === 'week' ? 'danger' : 'outline-secondary'} onClick={() => setPeriod('week')}>Semana</Button>
                <Button variant={period === 'month' ? 'danger' : 'outline-secondary'} onClick={() => setPeriod('month')}>Mês</Button>
             </ButtonGroup>
             
             <Button variant="outline-light" size="sm" onClick={() => navigate('/clientes')}>
               <i className="bi bi-person-plus-fill me-2" /> Clientes
             </Button>
          </Col>
        </Row>

        <Row className="g-2 mb-2 mx-0">
          {[
            { icon: "calendar-check", bgIconColor: "#0D6EFD", label: "Agendamentos", value: dashboardData.totalAgendamentos, valueColor: "#fff" },
            { icon: "cash-stack", bgIconColor: "#198754", label: "Total Esperado", value: formatMoney(dashboardData.valorEsperado), valueColor: "#198754" },
            { icon: "person-plus-fill", bgIconColor: "#0DCAF0", label: "Novos (1ª vez)", value: dashboardData.clientesNovos, valueColor: "#0DCAF0" },
            { icon: "arrow-repeat", bgIconColor: "#FFC107", label: "Recorrentes", value: dashboardData.clientesRecorrentes, valueColor: "#FFC107" },
          ].map((card) => (
            <Col xs={6} sm={isMobile ? 6 : 3} md={3} key={card.label} className="d-flex" style={isMobile ? { paddingRight: 4, paddingLeft: 4, marginBottom: 6 } : {}}>
              <Card className="bg-dark text-white shadow-sm h-100 rounded-4 border-0 w-100 d-flex flex-row align-items-center justify-content-center" style={{ minHeight: isMobile ? 80 : 100, padding: isMobile ? '5px' : '12px', textAlign: 'center', maxWidth: isMobile ? 320 : 330, margin: '0 auto' }}>
                <Card.Body className="p-1 d-flex flex-column align-items-center justify-content-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, backgroundColor: card.bgIconColor, color: "#fff" }}>
                    <i className={`bi bi-${card.icon} fs-4`} />
                  </div>
                  <div className="text-secondary" style={{ fontSize: isMobile ? 11 : 13 }}>{card.label}</div>
                  <div className="fw-bold" style={{ fontSize: isMobile ? 16 : 22, color: card.valueColor }}>{card.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-2 mb-4 mx-0">
          <Col xs={12} md={6} style={{ marginBottom: isMobile ? 10 : 0 }}>
            <Card className="bg-dark text-white shadow-sm h-100 rounded-4 border-0" style={{ minHeight: isMobile ? 130 : 230 }}>
              <Card.Body>
                <div className="fw-bold mb-2" style={{ fontSize: isMobile ? 14 : 17, letterSpacing: -0.5 }}>
                  <i className="bi bi-wallet2 me-2" style={{ color: '#DC3545' }} /> Receita (Já Pago / Falta / Total)
                </div>
                <div style={{ width: '100%', height: isMobile ? 180 : 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, bottom: 20 }}>
                      <Pie
                        data={graficoPagamentos}
                        cx="50%"
                        cy="50%"
                        outerRadius={isMobile ? 45 : 70}
                        dataKey="value"
                        stroke="#23272b"
                        strokeWidth={2}
                        label={PieExternalLabel}
                        labelLine={false}
                      >
                        {graficoPagamentos.map((entry, index) => (
                          <Cell key={index} fill={COLORS_PAGAMENTO[index % COLORS_PAGAMENTO.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={6}>
            <Card className="bg-dark text-white shadow-sm h-100 rounded-4 border-0" style={{ minHeight: isMobile ? 140 : 230 }}>
              <Card.Body>
                <div className="fw-bold mb-2" style={{ fontSize: isMobile ? 14 : 17, letterSpacing: -0.5 }}>
                  <i className="bi bi-repeat me-2" style={{ color: '#DC3545' }} /> Frequência de Clientes
                </div>
                <div style={{ width: '100%', height: isMobile ? 110 : 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graficoFrequencia} layout="vertical" barCategoryGap={isMobile ? '18%' : '14%'} margin={{ left: isMobile ? 32 : 52, right: 16, top: 8, bottom: 8 }}>
                      <XAxis type="number" allowDecimals={false} stroke="#fff" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis dataKey="name" type="category" stroke="#fff" width={isMobile ? 65 : 85} tick={{ fontSize: isMobile ? 11 : 13, fill: "#fff" }} interval={0} />
                      <Bar dataKey="value" barSize={isMobile ? 14 : 32} radius={[0, 10, 10, 0]}>
                        {graficoFrequencia.map((entry, index) => (
                          <Cell key={index} fill={COLORS_FREQUENCIA[index % COLORS_FREQUENCIA.length]} />
                        ))}
                        <LabelList dataKey="value" position="right" fill="#fff" fontSize={isMobile ? 10 : 12} fontWeight={600} />
                      </Bar>
                      <Tooltip content={<CustomTooltip />} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <TipToast message="Selecione 'Hoje', 'Semana' ou 'Mês' para atualizar os números." />
      </Container>
    </div>
  );
}