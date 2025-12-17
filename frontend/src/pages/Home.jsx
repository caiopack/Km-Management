import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Row, Col, Card, Badge, Button, Container
} from 'react-bootstrap';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList
} from 'recharts';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TipToast from '../components/TipToast';

const STATUS_LABELS = {
  EM_ABERTO: 'Em Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  FINALIZADO: 'Finalizado',
};
const PRIORIDADE_LABELS = { 1: 'Alta', 2: 'Média', 3: 'Baixa' };
const COLORS = ['#0066FF', '#FFC107', '#198754'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendentesHoje: 0,
    andamento: 0,
    finalizadaSemana: 0,
    atrasadas: 0,
    proximo: [],
    porStatus: [],
    porPrioridade: [],
  });
  const [authed, setAuthed] = useState(undefined);

  // Responsividade
  const [windowW, setWindowW] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowW(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = windowW < 700;

  // Protege rota (array de dependência FIXO!)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthed(false);
      navigate('/login', { replace: true });
    } else {
      setAuthed(true);
    }
    // eslint-disable-next-line
  }, []);

  // Carrega dados
  useEffect(() => {
    if (authed !== true) return;
    (async () => {
      try {
        const tfs = (await api.get('/tarefas')).data || [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const pendentesHoje = tfs.filter(
          (t) =>
            ['EM_ABERTO', 'EM_ANDAMENTO'].includes(t.status) &&
            t.dataServico &&
            new Date(t.dataServico).toDateString() === hoje.toDateString()
        ).length;
        const andamento = tfs.filter((t) => t.status === 'EM_ANDAMENTO').length;
        function isThisWeek(dateStr) {
          const d = new Date(dateStr);
          const now = new Date();
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return d >= weekStart && d <= weekEnd;
        }
        const finalizadaSemana = tfs.filter(
          (t) => t.status === 'FINALIZADO' && t.dataServico && isThisWeek(t.dataServico)
        ).length;
        const atrasadas = tfs.filter(
          (t) =>
            ['EM_ABERTO', 'EM_ANDAMENTO'].includes(t.status) &&
            t.dataServico &&
            new Date(t.dataServico) < hoje
        ).length;
        const proximo = [...tfs]
          .filter((t) => t.dataServico && new Date(t.dataServico) >= hoje)
          .sort((a, b) => new Date(a.dataServico) - new Date(b.dataServico));

        const porStatus = [
          { name: 'Em Aberto', value: tfs.filter((t) => t.status === 'EM_ABERTO').length },
          { name: 'Em Andamento', value: tfs.filter((t) => t.status === 'EM_ANDAMENTO').length },
          { name: 'Finalizado', value: tfs.filter((t) => t.status === 'FINALIZADO').length },
        ];
        const porPrioridade = [1, 2, 3].map((prio) => ({
          name: PRIORIDADE_LABELS[prio],
          value: tfs.filter((t) => t.prioridade === prio).length,
        }));

        setStats({
          pendentesHoje,
          andamento,
          finalizadaSemana,
          atrasadas,
          proximo,
          porStatus,
          porPrioridade,
        });
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    })();
  }, [authed, navigate, windowW]);

  if (authed === false) return null;

  // Label externa do gráfico pizza
  function PieExternalLabel({ cx, cy, midAngle, outerRadius, fill, value, index }) {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius + (isMobile ? 12 : 22);
    const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
    const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? 11 : 14}
        fontWeight={600}
        style={{ textShadow: '0 2px 6px #181a1b' }}
      >
        {`${stats.porStatus[index]?.name}: ${value}`}
      </text>
    );
  }

  // CustomTooltip ajustado para ler payload[0].payload.name e payload[0].payload.value
  function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      return (
        <div style={{
          background: '#23272b',
          border: '1.5px solid #222',
          color: '#fff',
          borderRadius: 8,
          padding: 10,
          fontWeight: 500,
          boxShadow: '0 2px 14px #0002',
        }}>
          <span>{name}</span>
          <span style={{ float: 'right', marginLeft: 12, fontWeight: 700 }}>{value}</span>
        </div>
      );
    }
    return null;
  }

  // Tarefas para mostrar
  const tarefasParaMostrar = isMobile ? stats.proximo : stats.proximo.slice(0, 4);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      paddingBottom: isMobile ? 40 : 24,
      overflow: 'auto',
    }}>
      <Container
        fluid
        className="px-0"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          paddingLeft: isMobile ? 8 : 32,
          paddingRight: isMobile ? 8 : 32,
          paddingTop: isMobile ? 10 : 30,
          paddingBottom: isMobile ? 28 : 20, // Mais espaço no fim!
        }}
      >
        {/* HEADER */}
        <Row className="mb-2 mx-0 align-items-center">
          <Col xs={12} md={8}>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: isMobile ? 20 : 32, marginLeft: isMobile ? 5 : 0 }}>
              Dashboard
            </h2>
            <div className="text-secondary fs-6 mb-2" style={{ maxWidth: 480, marginLeft: isMobile ? 5 : 0 }}>
              Visão geral de tarefas e clientes da <b>CSE & Refrigeração</b>
            </div>
          </Col>
          <Col xs={12} md={4} className={`d-flex ${isMobile ? "justify-content-start" : "justify-content-md-end"} align-items-center mb-2 gap-2`}>
            <Button
              variant="primary"
              className="fw-bold"
              size={isMobile ? "sm" : "md"}
              onClick={() => navigate('/agenda')}
            >
              <i className="bi bi-kanban-fill me-2" /> Ver Agenda
            </Button>
            <Button
              variant="outline-light"
              className="fw-bold"
              size={isMobile ? "sm" : "md"}
              onClick={() => navigate('/clientes')}
            >
              <i className="bi bi-person-plus-fill me-2" /> Clientes
            </Button>
          </Col>
        </Row>

        {/* CARDS */}
        <Row className="g-2 mb-2 mx-0">
          {[
            {
              icon: "calendar-event",
              color: "text-primary",
              label: "Pendentes Hoje",
              value: stats.pendentesHoje,
              valueColor: "#fff",
            },
            {
              icon: "play-fill",
              color: "text-warning",
              label: "Em Andamento",
              value: stats.andamento,
              valueColor: "#FFC107",
            },
            {
              icon: "check-circle-fill",
              color: "text-success",
              label: "Finalizadas na Semana",
              value: stats.finalizadaSemana,
              valueColor: "#198754",
            },
            {
              icon: "exclamation-circle",
              color: "text-danger",
              label: "Tarefas Atrasadas",
              value: stats.atrasadas,
              valueColor: "#dc3545",
            },
          ].map((card, idx) => (
            <Col
              xs={6}
              sm={isMobile ? 6 : 3}
              md={3}
              key={card.label}
              className="d-flex"
              style={isMobile ? { paddingRight: 4, paddingLeft: 4, marginBottom: 6 } : {}}
            >
              <Card className="bg-dark text-white shadow-sm h-100 rounded-4 border-0 w-100 d-flex flex-row align-items-center justify-content-center"
                style={{
                  minHeight: isMobile ? 56 : 64,
                  padding: isMobile ? '3px' : '8px',
                  textAlign: 'center',
                  maxWidth: isMobile ? 320 : 330,
                  margin: '0 auto',
                }}>
                <Card.Body className="p-1 d-flex flex-column align-items-center justify-content-center">
                  <i className={`bi bi-${card.icon} fs-2 ${card.color} mb-2`} style={{ minWidth: 22 }} />
                  <div className="fs-6 text-secondary" style={{ fontSize: isMobile ? 13 : 15 }}>{card.label}</div>
                  <div className="fw-bold" style={{ fontSize: isMobile ? 16 : 28, color: card.valueColor }}>
                    {card.value}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* GRÁFICOS */}
        <Row className="g-2 mb-2 mx-0">
          <Col xs={12} md={6} style={{ marginBottom: isMobile ? 10 : 0 }}>
            <Card className="bg-dark text-white shadow-sm h-100 rounded-4 border-0" style={{ minHeight: isMobile ? 130 : 230 }}>
              <Card.Body>
                <div className="fw-bold mb-2" style={{ fontSize: isMobile ? 14 : 17, letterSpacing: -0.5 }}>
                  <i className="bi bi-pie-chart me-2 text-primary" /> Distribuição de Tarefas por Status
                </div>
                <div style={{
                  width: '100%',
                  height: isMobile ? 80 : 170,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.porStatus}
                        cx="50%"
                        cy="50%"
                        label={PieExternalLabel}
                        labelLine={false}
                        outerRadius={isMobile ? 26 : 60}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={false}
                        stroke="#23272b"
                        strokeWidth={1}
                      >
                        {stats.porStatus.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
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
                  <i className="bi bi-bar-chart-steps me-2 text-primary" /> Tarefas por Prioridade
                </div>
                <div style={{
                  width: '100%',
                  height: isMobile ? 110 : 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.porPrioridade}
                      layout="vertical"
                      barCategoryGap={isMobile ? '18%' : '14%'}
                      margin={{ left: isMobile ? 32 : 52, right: 16, top: 8, bottom: 8 }}
                    >
                      <XAxis type="number" allowDecimals={false} stroke="#fff" tick={{ fontSize: isMobile ? 10 : 15 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#fff"
                        width={isMobile ? 48 : 64}
                        tick={{ fontSize: isMobile ? 11 : 15, fill: "#fff" }}
                        interval={0}
                      />
                      <Bar dataKey="value" barSize={isMobile ? 14 : 32} radius={[10, 10, 10, 10]}>
                        {stats.porPrioridade.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList dataKey="value" position="right" fill="#fff" fontSize={isMobile ? 10 : 16} fontWeight={600} />
                      </Bar>
                      <Tooltip content={<CustomTooltip />} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* PRÓXIMAS TAREFAS */}
        <Row className="g-2 mx-0 mb-4">
          <Col xs={12}>
            <Card className="bg-dark text-white shadow-sm rounded-4 border-0">
              <Card.Body style={{
                paddingBottom: 8,
                minHeight: isMobile ? 70 : 100,
                maxHeight: isMobile ? 380 : undefined,
                overflowY: isMobile ? 'auto' : 'unset'
              }}>
                <span className="fw-bold d-block mb-2">Próximas Tarefas Agendadas</span>
                {tarefasParaMostrar.length === 0 && (
                  <div className="text-secondary">Nenhuma tarefa agendada para os próximos dias.</div>
                )}
                <ul className="mb-0 ps-2" style={{
                  maxHeight: isMobile ? 250 : undefined,
                  overflowY: isMobile ? 'auto' : 'unset',
                  paddingRight: 4,
                  listStyle: 'none',
                  margin: 0,
                  paddingBottom: isMobile ? 18 : 8 // Padding extra para garantir que nunca corte!
                }}>
                  {tarefasParaMostrar.map((t) => (
                    <li
                      key={t.id}
                      className="mb-2 d-flex align-items-center flex-wrap"
                      style={{
                        fontSize: isMobile ? 12 : 15,
                        minHeight: 22,
                        gap: 6
                      }}
                    >
                      <Badge
                        bg={t.status === 'FINALIZADO' ? 'success' : (t.status === 'EM_ANDAMENTO' ? 'warning' : 'primary')}
                        className="me-2 mb-1"
                        style={{ minWidth: 52, fontSize: isMobile ? 9 : 13 }}
                      >
                        {STATUS_LABELS[t.status]}
                      </Badge>
                      <span className="fw-bold text-white mb-1"
                        style={{
                          minWidth: 50,
                          maxWidth: isMobile ? 130 : 'unset', // No desktop não corta!
                          overflow: isMobile ? 'hidden' : 'unset',
                          textOverflow: isMobile ? 'ellipsis' : 'unset',
                          whiteSpace: isMobile ? 'nowrap' : 'unset'
                        }}>
                        {t.titulo}
                      </span>
                      <span className="ms-2 text-info mb-1"
                        style={{
                          fontSize: isMobile ? 10 : 15,
                          minWidth: 40,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                        <i className="bi bi-calendar-event me-1" />
                        {new Date(t.dataServico).toLocaleDateString('pt-BR')}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <TipToast message="Acompanhe pendências, progresso e próximos serviços em tempo real neste painel." />
      </Container>
    </div>
  );
}