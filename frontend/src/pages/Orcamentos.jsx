import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  InputGroup,
  Card,
  ListGroup
} from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'bootstrap-icons/font/bootstrap-icons.css';
import TipToast from '../components/TipToast';

export default function Orcamentos() {
  const [clientes, setClientes] = useState([]);
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteSelecionado, setClienteSel] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [tarefasSelecionadas, setTarefasSel] = useState([]);
  const [valoresTarefas, setValoresTarefas] = useState({});
  const [equipamentos, setEquipamentos] = useState([]);
  const [outrosTexto, setOutrosTexto] = useState('');
  const [outrosValor, setOutrosValor] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar mudança de largura da tela
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Buscar clientes e tarefas ao montar
  useEffect(() => {
    (async () => {
      try {
        const [resClientes, resTarefas] = await Promise.all([
          api.get('/clientes'),
          api.get('/tarefas')
        ]);
        setClientes(resClientes.data);
        // filtrar tarefas que não estejam finalizadas
        const somenteAtivas = resTarefas.data.filter(t => t.status !== 'FINALIZADO');
        setTarefas(somenteAtivas);
        setClientesFiltrados(resClientes.data);
      } catch (err) {
        console.error('Erro ao carregar dados', err);
      }
    })();
  }, []);

  // Filtrar clientes conforme entrada de texto
  useEffect(() => {
    const term = clienteBusca.toLowerCase();
    const filtrados = clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term)
    );
    setClientesFiltrados(filtrados);

    const match = clientes.find(
      (c) => `${c.nome} - ${c.telefone}`.toLowerCase() === term
    );
    setClienteSel(match ? String(match.id) : '');
  }, [clienteBusca, clientes]);

  const toggleTarefa = (id) => {
    setTarefasSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const atualizarValorTarefa = (id, valor) => {
    setValoresTarefas((prev) => ({ ...prev, [id]: valor }));
  };

  const adicionarEquipamento = () => {
    setEquipamentos((prev) => [...prev, { nome: '', valor: '' }]);
  };

  const atualizarEquipamento = (idx, campo, valor) => {
    setEquipamentos((prev) => {
      const copia = [...prev];
      copia[idx][campo] = valor;
      return copia;
    });
  };

  const removerEquipamento = (idx) => {
    setEquipamentos((prev) => prev.filter((_, i) => i !== idx));
  };

  const exibirErro = (msg) => {
    setMensagemErro(msg);
    setTimeout(() => setMensagemErro(''), 4000);
  };

  const clienteObj =
    clienteSelecionado && clientes.find((c) => String(c.id) === clienteSelecionado);
  const totalEquipamentos = equipamentos.reduce(
    (acc, eq) => acc + (parseFloat(eq.valor) || 0),
    0
  );
  const totalServicos =
    tarefasSelecionadas.reduce((acc, id) => acc + (parseFloat(valoresTarefas[id]) || 0), 0) +
    (tarefasSelecionadas.includes('outros') ? parseFloat(outrosValor || 0) : 0);
  const totalGeral = parseFloat(totalServicos) + parseFloat(totalEquipamentos);

  const handleGerarPDF = () => {
    if (!clienteSelecionado)
      return exibirErro('Selecione um cliente antes de gerar o PDF.');
    if (tarefasSelecionadas.length === 0)
      return exibirErro('Selecione pelo menos um serviço.');

    for (const id of tarefasSelecionadas) {
      if (
        id !== 'outros' &&
        (valoresTarefas[id] === '' || isNaN(parseFloat(valoresTarefas[id])))
      ) {
        return exibirErro('Informe o valor de todas as tarefas selecionadas.');
      }
    }

    if (tarefasSelecionadas.includes('outros')) {
      if (!outrosTexto.trim())
        return exibirErro('Descreva o problema em "Outros".');
      if (outrosValor === '' || isNaN(parseFloat(outrosValor))) {
        return exibirErro('Informe um valor válido para "Outros".');
      }
    }

    for (let i = 0; i < equipamentos.length; i++) {
      const eq = equipamentos[i];
      if (eq.valor === '' || isNaN(parseFloat(eq.valor))) {
        return exibirErro(
          `Informe um valor válido para o equipamento: ${eq.nome || 'sem nome'}`
        );
      }
    }

    const pdf = new jsPDF();
    const logo = new Image();
    logo.src = '/logo-cse.png';
    logo.onload = () => {
      const dataHoje = new Date().toLocaleDateString('pt-BR');
      let y = 20;

      pdf.addImage(logo, 'PNG', 10, y, 45, 45);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('CSE & REFRIGERAÇÃO', 60, y + 5);
      pdf.setFont(undefined, 'normal');
      pdf.text('CNPJ: 21.935.339/0001-50', 60, y + 12);
      pdf.text('Rua São Jerônimo, 465', 60, y + 19);
      pdf.text('Novo Maranguape II, Maranguape-CE', 60, y + 26);
      pdf.text('CEP 61944-620', 60, y + 33);
      pdf.text('cserefrigeracaowy@gmail.com – (85) 98717-5445', 60, y + 40);
      y += 60;

      pdf.setFillColor(230);
      pdf.rect(10, y, 190, 10, 'F');
      pdf.setFontSize(14);
      pdf.text(`Orçamento ${Math.floor(100 + Math.random() * 900)}-2025`, 15, y + 7);
      y += 20;

      pdf.setFontSize(12);
      pdf.text(`Cliente: ${clienteObj?.nome || ''}`, 15, y);
      y += 7;
      pdf.text(`Telefone: ${clienteObj?.telefone || ''}`, 15, y);
      y += 12;

      pdf.setFontSize(13);
      pdf.setFont(undefined, 'bold');
      pdf.text('Serviços', 15, y);
      y += 7;
      pdf.setFont(undefined, 'normal');

      const colDesc = 20;
      const colVal = 180;

      tarefas
        .filter((t) => t.titulo !== 'AA')
        .filter((t) => tarefasSelecionadas.includes(t.id))
        .forEach((t) => {
          const valor = parseFloat(valoresTarefas[t.id]) || 0;
          pdf.text(`- ${t.titulo}`, colDesc, y);
          pdf.text(`R$ ${valor.toFixed(2)}`, colVal, y, { align: 'right' });
          y += 6;
        });

      if (tarefasSelecionadas.includes('outros') && outrosTexto) {
        const valorOutros = parseFloat(outrosValor || 0);
        pdf.text(`- ${outrosTexto}`, colDesc, y);
        pdf.text(`R$ ${valorOutros.toFixed(2)}`, colVal, y, { align: 'right' });
        y += 6;
      }

      y += 4;
      pdf.setFont(undefined, 'bold');
      pdf.text('Total Serviços:', colDesc, y);
      pdf.text(`R$ ${totalServicos.toFixed(2)}`, colVal, y, { align: 'right' });
      y += 12;

      if (equipamentos.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.text('Equipamentos', 15, y);
        y += 7;
        pdf.setFont(undefined, 'normal');

        equipamentos.forEach((e) => {
          const valEq = parseFloat(e.valor || 0);
          pdf.text(`- ${e.nome}`, colDesc, y);
          pdf.text(`R$ ${valEq.toFixed(2)}`, colVal, y, { align: 'right' });
          y += 6;
        });

        y += 4;
        pdf.setFont(undefined, 'bold');
        pdf.text('Total Equipamentos:', colDesc, y);
        pdf.text(`R$ ${totalEquipamentos.toFixed(2)}`, colVal, y, { align: 'right' });
        y += 12;
      }

      pdf.setFont(undefined, 'bold');
      pdf.text('Total Geral:', colDesc, y);
      pdf.text(`R$ ${totalGeral.toFixed(2)}`, colVal, y, { align: 'right' });
      y += 15;

      pdf.text('Pagamento', 15, y);
      y += 7;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(11);
      pdf.text(
        'Meios de pagamento: Boleto, transferência bancária, dinheiro, cheque, cartão ou pix.',
        15,
        y
      );
      y += 15;
      pdf.text(`Maranguape, ${dataHoje}`, 15, y);
      y += 15;
      pdf.text('_____________________________________', 15, y);
      pdf.setFont(undefined, 'bold');
      pdf.text('CSE & REFRIGERAÇÃO', 15, y + 6);
      pdf.text('Weyne Arruda', 15, y + 12);
      pdf.save(`Orçamento ${clienteObj?.nome}.pdf`);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Conteúdo principal com scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
        <Container fluid>
          <Row>
            <Col xs={12}>
              <h3 className="text-white fw-bold mb-1">Gerar Orçamento</h3>
              <p className="text-secondary mb-4">
                Selecione um cliente e adicione os serviços e equipamentos.
              </p>
              {mensagemErro && (
                <div
                  className="mb-3 p-2 rounded"
                  style={{ backgroundColor: '#c14646', color: '#fff' }}
                >
                  {mensagemErro}
                </div>
              )}
            </Col>
          </Row>

          {/* Busca de Cliente (no estilo solicitado) */}
          <Row className="mb-4">
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label className="text-white">Cliente</Form.Label>
                <InputGroup style={{ maxWidth: 1000 }}>
                  <InputGroup.Text
                    style={{ background: '#fff', border: '1px solid #ccc' }}
                  >
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clienteBusca}
                    onChange={(e) => {
                      setClienteBusca(e.target.value);
                      if (
                        !e.target.value
                          .toLowerCase()
                          .includes(
                            (clientes.find((c) => String(c.id) === clienteSelecionado)
                              ?.nome || ''
                            ).toLowerCase()
                          )
                      ) {
                        setClienteSel('');
                      }
                    }}
                    style={{ background: '#fff', border: '1px solid #ccc' }}
                    autoComplete="off"
                  />
                </InputGroup>

                {/* Dropdown com os resultados filtrados */}
                {clienteBusca.length > 0 && !clienteSelecionado && (
                  <Card
                    className="bg-black border-secondary mt-1"
                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                  >
                    <ListGroup variant="flush">
                      {clientesFiltrados.length > 0 ? (
                        clientesFiltrados.map((c) => (
                          <ListGroup.Item
                            key={c.id}
                            className="bg-black text-white"
                            action
                            onClick={() => {
                              setClienteBusca(`${c.nome} - ${c.telefone}`);
                              setClienteSel(String(c.id));
                            }}
                          >
                            {c.nome} – {c.telefone}
                          </ListGroup.Item>
                        ))
                      ) : (
                        <ListGroup.Item className="bg-black text-secondary">
                          Nenhum cliente encontrado.
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card>
                )}

                {/* Se um cliente estiver selecionado, exibir os dados */}
                {clienteSelecionado && clienteObj && (
                  <Card className="bg-black border-secondary rounded-3 text-white mt-2">
                    <Card.Body className="p-3 small">
                      <div>
                        <strong>Nome:</strong> {clienteObj.nome}
                      </div>
                      <div>
                        <strong>Telefone:</strong> {clienteObj.telefone}
                      </div>
                      <div>
                        <strong>Endereço:</strong> {clienteObj.endereco}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Form.Group>
            </Col>
          </Row>

          <hr className="border-secondary" />

          {/* Serviços (Tarefas) – layout responsivo */}
          <Row className="my-4">
            <Col xs={12}>
              <Form.Label className="text-white">Serviços (Tarefas)</Form.Label>
              <div
                style={{
                  columnCount: isMobile ? 1 : 2,
                  columnGap: '2rem'
                }}
              >
                {tarefas
                  .filter((t) => t.titulo !== 'AA')
                  .map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="mb-2"
                      style={{ breakInside: 'avoid' }}
                    >
                      <Form.Check
                        type="checkbox"
                        label={tarefa.titulo}
                        className="text-white"
                        checked={tarefasSelecionadas.includes(tarefa.id)}
                        onChange={() => toggleTarefa(tarefa.id)}
                      />
                      {tarefasSelecionadas.includes(tarefa.id) && (
                        <Form.Control
                          type="number"
                          placeholder="Valor da tarefa (R$)"
                          className="bg-dark text-white border-secondary mt-1"
                          value={valoresTarefas[tarefa.id] || ''}
                          onChange={(e) =>
                            atualizarValorTarefa(tarefa.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}

                <div className="mb-2" style={{ breakInside: 'avoid' }}>
                  <Form.Check
                    type="checkbox"
                    label="Outros (descrever problema)"
                    className="text-white"
                    checked={tarefasSelecionadas.includes('outros')}
                    onChange={() =>
                      setTarefasSel((prev) =>
                        prev.includes('outros')
                          ? prev.filter((x) => x !== 'outros')
                          : [...prev, 'outros']
                      )
                    }
                  />
                  {tarefasSelecionadas.includes('outros') && (
                    <div className="mt-2">
                      <Row className="g-2">
                        <Col xs={12} md={8}>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Descreva o problema ou serviço"
                            className="bg-dark text-white border-secondary"
                            value={outrosTexto}
                            onChange={(e) => setOutrosTexto(e.target.value)}
                          />
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Control
                            type="number"
                            placeholder="Valor (R$)"
                            className="bg-dark text-white border-secondary"
                            value={outrosValor}
                            onChange={(e) => setOutrosValor(e.target.value)}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <hr className="border-secondary" />

          {/* Equipamentos */}
          <Row className="my-4">
            <Col xs={12}>
              <Form.Label className="text-white">Equipamentos</Form.Label>
              {equipamentos.map((equip, idx) => (
                <Row key={idx} className="g-2 mb-2 align-items-center">
                  <Col xs={12} md={5}>
                    <Form.Control
                      type="text"
                      placeholder="Nome do equipamento"
                      value={equip.nome}
                      onChange={(e) =>
                        atualizarEquipamento(idx, 'nome', e.target.value)
                      }
                      className="bg-dark text-white border-secondary"
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Control
                      type="number"
                      placeholder="Custo (R$)"
                      value={equip.valor}
                      onChange={(e) =>
                        atualizarEquipamento(idx, 'valor', e.target.value)
                      }
                      className="bg-dark text-white border-secondary"
                    />
                  </Col>
                  <Col xs={12} md={3} className="text-end">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removerEquipamento(idx)}
                    >
                      Remover
                    </Button>
                  </Col>
                </Row>
              ))}

              <div className="d-flex justify-content-between mt-3 flex-wrap gap-2">
                <Button variant="outline-light" onClick={adicionarEquipamento}>
                  + Adicionar Equipamento
                </Button>
                {equipamentos.length > 0 && (
                  <span className="text-white">
                    <strong>Total Equipamentos:</strong> R$
                    {totalEquipamentos.toFixed(2)}
                  </span>
                )}
              </div>
            </Col>
          </Row>

          <hr className="border-secondary" />

          {/* Totais e botão Gerar PDF */}
          <Row className="align-items-center mb-5">
            <Col xs={12} md={8}>
              <Card className="bg-black border-secondary rounded-3 text-white">
                <Card.Body className="p-3">
                  <div>
                    <strong>Total Serviços:</strong> R$ {totalServicos.toFixed(2)}
                  </div>
                  <div>
                    <strong>Total Equipamentos:</strong> R${' '}
                    {totalEquipamentos.toFixed(2)}
                  </div>
                  <hr className="my-2" />
                  <div className="fs-6">
                    <strong>Total Geral:</strong>
                  </div>
                  <div className="fs-5 text-success">
                    R$ {totalGeral.toFixed(2)}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
              <Button variant="success" size="lg" onClick={handleGerarPDF}>
                <i className="bi bi-file-earmark-pdf me-2" />
                Gerar PDF
              </Button>
            </Col>
          </Row>
    <TipToast message="Selecione serviços e equipamentos; depois gere o PDF do orçamento com um só clique." />
        </Container>
      </div>
    </div>
  );
}