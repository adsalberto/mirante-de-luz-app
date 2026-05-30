import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Table, 
  PieChart as PieIcon, 
  Activity, 
  BarChart3, 
  Filter, 
  CheckCircle2, 
  Users, 
  Calendar, 
  ClipboardList,
  Coins, 
  Printer, 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Clock, 
  HelpCircle,
  ShieldCheck,
  Building,
  ShieldAlert,
  Heart,
  ArrowLeft,
  BookOpen,
  Music,
  Smile,
  Home
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart as RechartsPieChart, 
  Cell, 
  Pie 
} from 'recharts';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';
import { formatSectorName, Sector } from '../types';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Local types for Financial Transactions loaded from localStorage
interface FinancialTransaction {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SAÍDA' | 'SAIDA';
  category: string;
  description: string;
  amount: number;
  amountEstimated?: number;
  amountRealized?: number;
  status?: string;
  paymentMethod?: string;
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State variables for analytics tabs and filters
  const [activeTab, setActiveTab] = useState<'analytics' | 'downloads'>('analytics');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complianceView, setComplianceView] = useState<'workers' | 'ledger' | 'evolutions'>('workers');
  const [selectedDownloadCategory, setSelectedDownloadCategory] = useState<string>('todos');

  // Raw data vectors
  const [workers, setWorkers] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);

  // Authenticate & redirect if necessary
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RECEPCIONISTA') {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  // Load datasets dynamically from database and local storage
  useEffect(() => {
    const loadAllDatasets = async () => {
      setLoading(true);
      try {
        const [loadedWorkers, loadedParticipants, loadedSectors, loadedEvolutions] = await Promise.all([
          dataService.getWorkers() || [],
          dataService.getParticipants() || [],
          dataService.getSectors() || [],
          dataService.getAllEvolutions() || []
        ]);

        setWorkers(loadedWorkers || []);
        setParticipants(loadedParticipants || []);
        setEvolutions(loadedEvolutions || []);

        // Filter and unique sectors
        const uniqueS: Sector[] = [];
        const seenNames = new Set<string>();
        (loadedSectors || []).forEach(s => {
          const normName = formatSectorName(s.name);
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueS.push({ ...s, name: normName });
          }
        });
        setSectors(uniqueS);

        // Load financial transactions from admin context
        const cachedTx = localStorage.getItem('admin_transactions');
        if (cachedTx) {
          try {
            setTransactions(JSON.parse(cachedTx));
          } catch {
            setTransactions([]);
          }
        } else {
          // Default mock transactions if none are found, to load beautiful default indicators
          const defaultTransactions: FinancialTransaction[] = [
            { id: '1', date: '2026-05-01', type: 'ENTRADA', category: 'Contribuição', description: 'Mensalidade de Sócios - Lote Mai/26', amount: 1250.00, amountEstimated: 1500.00, amountRealized: 1250.00, status: 'Recebido' },
            { id: '2', date: '2026-05-05', type: 'ENTRADA', category: 'Doação', description: 'Doações voluntárias espontâneas', amount: 840.00, amountEstimated: 500.00, amountRealized: 840.00, status: 'Recebido' },
            { id: '3', date: '2026-05-10', type: 'SAÍDA', category: 'Manutenção', description: 'Reforma da calha e telhado do salão principal', amount: 450.00, amountEstimated: 450.00, amountRealized: 450.00, status: 'Pago' },
            { id: '4', date: '2026-05-12', type: 'SAÍDA', category: 'Utilitários', description: 'Fatura de Energia Elétrica - Cemig', amount: 320.00, amountEstimated: 350.00, amountRealized: 320.00, status: 'Pago' },
            { id: '5', date: '2026-05-15', type: 'SAÍDA', category: 'Utilitários', description: 'Fatura de Água e Saneamento - Copasa', amount: 140.00, amountEstimated: 150.00, amountRealized: 140.00, status: 'Pago' },
            { id: '6', date: '2026-05-18', type: 'ENTRADA', category: 'Evento', description: 'Arrecadação Galinhada Fraterna Beneficente', amount: 1750.00, amountEstimated: 1200.00, amountRealized: 1750.00, status: 'Recebido' },
            { id: '7', date: '2026-05-20', type: 'SAÍDA', category: 'Ação Social', description: 'Insumos cesta básica para famílias da vila', amount: 600.00, amountEstimated: 600.00, amountRealized: 600.00, status: 'Pago' }
          ];
          localStorage.setItem('admin_transactions', JSON.stringify(defaultTransactions));
          setTransactions(defaultTransactions);
        }
      } catch (err) {
        console.error('Erro de carregamento dos dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllDatasets();
  }, []);

  // Standard static file export methods
  const exportToExcel = async (type: string) => {
    setIsExporting(true);
    try {
      const getAssistidoName = (id: string) => {
        const part = participants.find(p => p.id === id);
        if (part) return part.name;
        const socialAssStr = localStorage.getItem('social_assistidos');
        if (socialAssStr) {
          try {
            const socialAss = JSON.parse(socialAssStr);
            const found = socialAss.find((a: any) => a.id === id);
            if (found) return found.name;
          } catch {}
        }
        return 'Assistido #' + (id ? id.substring(0, 5) : 'N/I');
      };

      let data: any[] = [];
      let sheetName = "Relatorio";

      if (type === 'workers') {
        data = workers.map(w => ({
          'Nome': w.name,
          'Função': w.role,
          'Email': w.email,
          'Setor': w.sectorId || 'N/I'
        }));
        sheetName = "Trabalhadores";
      } else if (type === 'agenda') {
        const events = await dataService.getAgendaEvents();
        data = events.map(e => ({
          'Data': new Date(e.date).toLocaleDateString('pt-BR'),
          'Título': e.title,
          'Tipo': e.type,
          'Palestrante ID': e.speakerId || 'N/A'
        }));
        sheetName = "Agenda";
      } else if (type === 'logs') {
        const logs = await dataService.getLogs();
        data = logs?.map(l => ({
          'Data/Hora': new Date(l.timestamp).toLocaleString('pt-BR'),
          'Ação': l.action,
          'Usuário': l.userName
        })) || [];
        sheetName = "Auditoria";
      } else if (type === 'sectors') {
        data = sectors.map(s => ({
          'Nome': s.name,
          'Tipo': s.type,
          'Descrição': s.description
        }));
        sheetName = "Setores";
      } else if (type === 'social_atendimentos') {
        const raw = localStorage.getItem('social_atendimentos');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((at: any) => ({
          'ID': at.id?.slice(0, 8) || '',
          'Data': at.date || '',
          'Assistido Beneficiário': getAssistidoName(at.assistidoId),
          'Tipo Atendimento': at.type || 'Padrão',
          'Necessidade Identificada': at.needIdentified || '',
          'Encaminhamento': at.forwarding || '',
          'Observações': at.observations || '',
          'Próximo Acompanhamento': at.nextFollowUp || '',
          'Responsável': at.responsible || ''
        }));
        sheetName = "Atendimentos Sociais";
      } else if (type === 'social_doacoes') {
        const raw = localStorage.getItem('social_doacoes');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((don: any) => ({
          'Item ID': don.id?.slice(0, 8) || '',
          'Categoria / Tipo': don.type || '',
          'Especificação': don.description || '',
          'Quantidade': don.qty || 1,
          'Unidade': don.unit || 'un',
          'Doador / Origem': don.donor || 'Anônimo',
          'Data Entrada': don.entryDate || '',
          'Vencimento': don.expiryDate || 'N/A',
          'Responsável': don.responsible || ''
        }));
        sheetName = "Estoque e Doações";
      } else if (type === 'social_cestas') {
        const raw = localStorage.getItem('social_cestas');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((sc: any) => ({
          'ID Recibo': sc.id?.slice(0, 8) || '',
          'Família / Beneficiário': sc.assistidoName || getAssistidoName(sc.assistidoId),
          'Tipo Cesta': sc.basketType || 'Padrão',
          'Data Entrega': sc.date || '',
          'Validação': sc.qrCodeScanned ? '📱 QR Code Scanner' : '✍️ Assinatura em Terminal',
          'Responsável Entrega': sc.responsible || ''
        }));
        sheetName = "Saídas Cestas Básicas";
      } else if (type === 'social_visitas') {
        const raw = localStorage.getItem('social_visitas');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((vis: any) => ({
          'Ficha ID': vis.id?.slice(0, 8) || '',
          'Residência Visitada': vis.assistidoName || getAssistidoName(vis.assistidoId),
          'Data': vis.date || '',
          'Responsável Parecer': vis.responsible || '',
          'Situação Encontrada': vis.situationFound || '',
          'Necessidades Observadas': vis.needsObserved || '',
          'Encaminhamento Recom.': vis.forwarding || ''
        }));
        sheetName = "Visitas Fraternas";
      } else if (type === 'social_projetos') {
        const raw = localStorage.getItem('social_projetos');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((proj: any) => ({
          'Oficina ID': proj.id?.slice(0, 8) || '',
          'Nome da Oficina/Curso': proj.name || '',
          'Objetivo Social': proj.objective || '',
          'Público Alvo': proj.target || '',
          'Coordenador': proj.coordinator || '',
          'Cronograma/Agenda': proj.schedule || '',
          'Status': proj.status || 'Planejado'
        }));
        sheetName = "Projetos Cooperativos";
      } else if (type === 'passe_atendimentos') {
        const raw = localStorage.getItem('passe_atendimentos');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((pa: any) => ({
          'ID Ficha': pa.id?.slice(0, 8) || '',
          'Paciente / Assistido': pa.assistidoName || getAssistidoName(pa.assistidoId),
          'Data Atendimento': pa.date || '',
          'Horário': pa.time || '',
          'Tipo Passe': pa.type || 'Passe Magnético',
          'Sala': pa.sala || '',
          'Passista Aplicador': pa.passista || '',
          'Recomendação Espiritual': pa.encaminhamento || '',
          'Observações': pa.obs || '',
          'Status': pa.status || 'Aguardando'
        }));
        sheetName = "Conversas e Passes";
      } else if (type === 'passe_passistas') {
        const raw = localStorage.getItem('passe_passistas');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((p: any) => ({
          'Matrícula ID': p.id?.slice(0, 8) || '',
          'Nome do Trabalhador': p.name || '',
          'Data Ingresso': p.dateIngresso || '',
          'Estudo Doutrinário': p.doutrinaria || 'Concluída',
          'Cursos Realizados': p.cursos || '',
          'Dias de Trabalho': p.dias || '',
          'Escala Relacionada': p.escalaId || '',
          'Situação': p.situacao || 'Ativo',
          'Tempo de Serviço': p.tempo || ''
        }));
        sheetName = "Passistas Escalados";
      } else if (type === 'passe_salas') {
        const raw = localStorage.getItem('passe_salas');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((s: any) => ({
          'ID Sala': s.id?.slice(0, 8) || '',
          'Nome do Apoio': s.name || '',
          'Capacidade Cabines': s.cap || 1,
          'Status Operacional': s.status || 'Disponível',
          'Responsável': s.resp || ''
        }));
        sheetName = "Cabines de Passe";
      } else if (type === 'study_courses') {
        const raw = localStorage.getItem('study_courses');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((c: any) => ({
          'ID Curso': c.id?.slice(0, 8) || '',
          'Nome do Curso': c.name || '',
          'Área de Estudo': c.category || '',
          'Duração Estimada': c.duration || '',
          'Alunos Matriculados': c.studentsCount || 0,
          'Professor / Preceptor': c.teacherInCharge || '',
          'Horários': c.schedule || '',
          'Status': c.status || 'Ativo'
        }));
        sheetName = "Cursos ESDE";
      } else if (type === 'study_students') {
        const raw = localStorage.getItem('study_students');
        const list = raw ? JSON.parse(raw) : [];
        const coursesRaw = localStorage.getItem('study_courses');
        const courses = coursesRaw ? JSON.parse(coursesRaw) : [];
        data = list.map((st: any) => {
          const courseName = courses.find((c: any) => c.id === st.courseId)?.name || 'Estudo Geral';
          return {
            'Matrícula ID': st.id?.slice(0, 8) || '',
            'Nome Estudante': st.name || '',
            'E-mail': st.email || '',
            'Contato': st.phone || '',
            'Curso Matriculado': courseName,
            'Turma': st.classId || '',
            'Ingresso em': st.entryDate || '',
            'Frequência Assiduidade': `${st.attendancePercentage ?? 100}%`
          };
        });
        sheetName = "Alunos Doutrinários";
      } else if (type === 'eva_kids') {
        const raw = localStorage.getItem('eva_kids');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((k: any) => ({
          'ID Criança': k.id?.slice(0, 8) || '',
          'Nome Aluno': k.name || '',
          'Idade': k.age || '',
          'Responsável Legal': k.responsible || '',
          'Parentesco': k.relationship || 'Pai',
          'Alergias / Restrições': k.allergies || 'Nenhuma',
          'Telefone Responsável': k.phone || '',
          'Sala / Oficinas': k.roomId || 'Sala 1',
          'Frequência': k.presence ? 'Frequência de Acompanhamento' : 'Geral'
        }));
        sheetName = "Crianças Evangelização";
      } else if (type === 'medi_members') {
        const raw = localStorage.getItem('medi_members');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((m: any) => ({
          'ID Integrante': m.id?.slice(0, 8) || '',
          'Nome do Médium': m.name || '',
          'Função / Papel': m.role || '',
          'Reunião ID': m.groupId || '',
          'Histórico Sensitivo': m.notes || ''
        }));
        sheetName = "Quadro de Médiuns";
      } else if (type === 'arte_pecas') {
        const musRaw = localStorage.getItem('arte_musicas');
        const pecRaw = localStorage.getItem('arte_pecas');
        const mus = musRaw ? JSON.parse(musRaw) : [];
        const pec = pecRaw ? JSON.parse(pecRaw) : [];
        data = [
          ...mus.map((m: any) => ({ 'Expressão Artística': 'Coral / Música', 'Título/Nome': m.name || '', 'Especificação Técnica': `Tom: ${m.tom || ''} | Cifra: ${m.link || ''}` })),
          ...pec.map((p: any) => ({ 'Expressão Artística': 'Teatro / Poesia', 'Título/Nome': p.name || '', 'Especificação Técnica': `Peça espírita - Autores: ${p.escritor || ''}` }))
        ];
        if (data.length === 0) {
          data = [{ 'Expressão Artística': 'Nenhum', 'Título/Nome': 'Nenhuma peça/grupo cadastrado.', 'Especificação Técnica': '' }];
        }
        sheetName = "Repertório Arte Espírita";
      } else if (type === 'com_campanhas') {
        const raw = localStorage.getItem('com_campanhas');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((c: any) => ({
          'ID Campanha': c.id?.slice(0, 8) || '',
          'Título da Ação': c.title || '',
          'Meio / Canal': c.channel || '',
          'Público Alvo': c.social || '',
          'Data Disparo': c.date || '',
          'Status': c.status || 'Ativo'
        }));
        sheetName = "Campanhas de Divulgação";
      } else if (type === 'admin_transactions') {
        const raw = localStorage.getItem('admin_transactions');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((t: any) => ({
          'ID Transação': t.id,
          'Data': t.date,
          'Fluxo': t.type,
          'Categoria': t.category,
          'Descrição': t.description,
          'Valor Realizado (R$)': t.amountRealized || t.amount,
          'Valor Orçado (R$)': t.amountEstimated || t.amount,
          'Status': t.status || 'Finalizado'
        }));
        sheetName = "Créditos e Débitos";
      } else if (type === 'admin_patrimonio_items') {
        const raw = localStorage.getItem('admin_patrimonio_items');
        const list = raw ? JSON.parse(raw) : [];
        data = list.map((item: any) => ({
          'Código': item.id?.slice(0, 8) || '',
          'Descrição do Ativo': item.name || '',
          'Detalhes / Notas': item.obs || '',
          'Qtd': item.qty || 1,
          'Unidade': item.unit || 'un',
          'Local': item.location || '',
          'Filiado Responsável': item.responsible || '',
          'Estado Conservação': item.state || 'BOM'
        }));
        sheetName = "Controle Patrimonial";
      } else {
        data = participants.map(p => ({
          'Nome': p.name || 'N/I',
          'Telefone': p.phone || 'N/I',
          'Sexo': (p.gender === 'Masculino' || p.gender === 'M') ? 'Masculino' : (p.gender === 'Feminino' || p.gender === 'F') ? 'Feminino' : p.gender || 'N/I',
          'Data Nascimento': p.birthDate || 'N/I',
          'Endereço': p.address || 'N/I',
          'Consentimento LGPD': p.lgpdConsent ? 'Sim' : 'Não',
          'Status': p.currentStatus === 'IDLE' ? 'Livre' : 
                   p.currentStatus === 'WAITING' ? 'Em Espera' :
                   p.currentStatus === 'IN_SERVICE' ? 'Em Atendimento' :
                   p.currentStatus === 'COMPLETED' ? 'Concluído' :
                   p.currentStatus === 'REFERRERED' ? 'Encaminhado' : p.currentStatus || 'Livre'
        }));
        sheetName = "Atendidos";
      }

      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);
      
      writeFile(workbook, `Relatorio_${type}_${new Date().getTime()}.xlsx`);
    } catch (err) {
      console.error('Erro Excel:', err);
      alert('Erro ao exportar Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async (type: string) => {
    setIsExporting(true);
    try {
      const getAssistidoName = (id: string) => {
        const part = participants.find(p => p.id === id);
        if (part) return part.name;
        const socialAssStr = localStorage.getItem('social_assistidos');
        if (socialAssStr) {
          try {
            const socialAss = JSON.parse(socialAssStr);
            const found = socialAss.find((a: any) => a.id === id);
            if (found) return found.name;
          } catch {}
        }
        return 'Assistido #' + (id ? id.substring(0, 5) : 'N/I');
      };

      const doc = new jsPDF();
      let title = "Relatório Geral";
      let head: string[][] = [];
      let body: any[][] = [];

      if (type === 'workers') {
        title = "Quadro de Trabalhadores";
        head = [['Nome', 'Função', 'Setor', 'Email']];
        body = workers.map(w => [w.name, w.role, w.sectorId || 'N/I', w.email]);
      } else if (type === 'agenda') {
        const events = await dataService.getAgendaEvents();
        title = "Calendário de Atividades";
        head = [['Data', 'Evento', 'Tipo', 'Palestrante ID']];
        body = events.map(e => [new Date(e.date).toLocaleDateString('pt-BR'), e.title, e.type, e.speakerId || 'N/A']);
      } else if (type === 'sectors') {
        title = "Quadro de Setores";
        head = [['Nome', 'Tipo', 'Descrição']];
        body = sectors.map(s => [s.name, s.type, s.description]);
      } else if (type === 'logs') {
        const logs = await dataService.getLogs();
        title = "Histórico de Auditoria";
        head = [['Data/Hora', 'Ação Realizada', 'Trabalhador']];
        body = (logs || []).map(l => [new Date(l.timestamp).toLocaleString('pt-BR'), l.action, l.userName]);
      } else if (type === 'social_atendimentos') {
        const raw = localStorage.getItem('social_atendimentos');
        const list = raw ? JSON.parse(raw) : [];
        title = "Conversas e Acolhimentos Sociais (DPAS)";
        head = [['Data', 'Assistido', 'Tipo', 'Necessidade', 'Responsável']];
        body = list.map((at: any) => [
          at.date || '',
          getAssistidoName(at.assistidoId),
          at.type || 'Padrão',
          at.needIdentified || '',
          at.responsible || ''
        ]);
      } else if (type === 'social_doacoes') {
        const raw = localStorage.getItem('social_doacoes');
        const list = raw ? JSON.parse(raw) : [];
        title = "Donativos e Estoque em Abrigo (DPAS)";
        head = [['Categoria', 'Especificação', 'Qtd / Unid', 'Origem/Doador', 'Validade']];
        body = list.map((don: any) => [
          don.type || '',
          don.description || '',
          `${don.qty || 1} ${don.unit || 'un'}`,
          don.donor || 'Anônimo',
          don.expiryDate || 'N/A'
        ]);
      } else if (type === 'social_cestas') {
        const raw = localStorage.getItem('social_cestas');
        const list = raw ? JSON.parse(raw) : [];
        title = "Entregas de Cesta Básica (DPAS)";
        head = [['Recibo ID', 'Família Beneficiário', 'Fardo', 'Entregue em', 'Assinatura']];
        body = list.map((sc: any) => [
          sc.id?.slice(0, 8) || '',
          sc.assistidoName || getAssistidoName(sc.assistidoId),
          sc.basketType || 'Padrão',
          sc.date || '',
          sc.qrCodeScanned ? 'Via QR Code' : 'Assinatura Ficha'
        ]);
      } else if (type === 'social_visitas') {
        const raw = localStorage.getItem('social_visitas');
        const list = raw ? JSON.parse(raw) : [];
        title = "Laudos de Visitas Fraternas (DPAS)";
        head = [['Visita ID', 'Assistido Visitado', 'Data', 'Situação Local', 'Parecerista']];
        body = list.map((vis: any) => [
          vis.id?.slice(0, 8) || '',
          vis.assistidoName || getAssistidoName(vis.assistidoId),
          vis.date || '',
          vis.situationFound || '',
          vis.responsible || ''
        ]);
      } else if (type === 'social_projetos') {
        const raw = localStorage.getItem('social_projetos');
        const list = raw ? JSON.parse(raw) : [];
        title = "Oficinas Socializadoras Geradas";
        head = [['Oficina', 'Objetivo do Projeto', 'Publico', 'Coordenador', 'Status']];
        body = list.map((p: any) => [
          p.name || '',
          p.objective || '',
          p.target || '',
          p.coordinator || '',
          p.status || 'Planejado'
        ]);
      } else if (type === 'passe_atendimentos') {
        const raw = localStorage.getItem('passe_atendimentos');
        const list = raw ? JSON.parse(raw) : [];
        title = "Fluidoterapia e Passes Magnéticos";
        head = [['Data/Hora', 'Paciente', 'Tipo', 'Cabine/Sala', 'Recomendação']];
        body = list.map((pa: any) => [
          `${pa.date || ''} ${pa.time || ''}`,
          pa.assistidoName || getAssistidoName(pa.assistidoId),
          pa.type || 'Passe Magnético',
          pa.sala || '',
          pa.encaminhamento || ''
        ]);
      } else if (type === 'passe_passistas') {
        const raw = localStorage.getItem('passe_passistas');
        const list = raw ? JSON.parse(raw) : [];
        title = "Quadro de Trabalhadores do Passe";
        head = [['Nome Trabalhador', 'Data Ingresso', 'Cursos Fluidos', 'Escala Ativa', 'Situação']];
        body = list.map((p: any) => [
          p.name || '',
          p.dateIngresso || '',
          p.cursos || 'Básico de Fluidos',
          p.escalaId || 'Geral',
          p.situacao || 'Ativo'
        ]);
      } else if (type === 'passe_salas') {
        const raw = localStorage.getItem('passe_salas');
        const list = raw ? JSON.parse(raw) : [];
        title = "Cabines de Passe Disponíveis";
        head = [['ID', 'Nome Sala', 'Capacidade Cabines', 'Coordenador', 'Status']];
        body = list.map((s: any) => [
          s.id?.slice(0, 8) || '',
          s.name || '',
          String(s.cap || 1),
          s.resp || 'N/A',
          s.status || 'Disponível'
        ]);
      } else if (type === 'study_courses') {
        const raw = localStorage.getItem('study_courses');
        const list = raw ? JSON.parse(raw) : [];
        title = "Cursos e Estudos Doutrinários (ESDE)";
        head = [['Curso', 'Área de Estudo', 'Duração', 'Alunos', 'Preceptor']];
        body = list.map((c: any) => [
          c.name || '',
          c.category || '',
          c.duration || '',
          String(c.studentsCount || 0),
          c.teacherInCharge || ''
        ]);
      } else if (type === 'study_students') {
        const raw = localStorage.getItem('study_students');
        const list = raw ? JSON.parse(raw) : [];
        const coursesRaw = localStorage.getItem('study_courses');
        const courses = coursesRaw ? JSON.parse(coursesRaw) : [];
        title = "Estudantes Matriculados nos Cursos";
        head = [['Nome Estudante', 'Contato / Email', 'Curso Matriculado', 'Assiduidade']];
        body = list.map((st: any) => {
          const courseName = courses.find((c: any) => c.id === st.courseId)?.name || 'Estudo Geral';
          return [
            st.name || '',
            `${st.phone || ''} / ${st.email || ''}`,
            courseName,
            `${st.attendancePercentage ?? 100}%`
          ];
        });
      } else if (type === 'eva_kids') {
        const raw = localStorage.getItem('eva_kids');
        const list = raw ? JSON.parse(raw) : [];
        title = "Crianças Cadastradas na Evangelização";
        head = [['Nome Criança', 'Idade', 'Pai/Responsável', 'Contato Fone', 'Alergias']];
        body = list.map((k: any) => [
          k.name || '',
          String(k.age || ''),
          k.responsible || '',
          k.phone || '',
          k.allergies || 'Nenhuma'
        ]);
      } else if (type === 'medi_members') {
        const raw = localStorage.getItem('medi_members');
        const list = raw ? JSON.parse(raw) : [];
        title = "Equipe Mediúnica Registrada";
        head = [['Médium', 'Papel Sensitivo', 'Grupo ID', 'Notas Integridade']];
        body = list.map((m: any) => [
          m.name || '',
          m.role || '',
          m.groupId || '',
          m.notes || ''
        ]);
      } else if (type === 'arte_pecas') {
        const musRaw = localStorage.getItem('arte_musicas');
        const pecRaw = localStorage.getItem('arte_pecas');
        const mus = musRaw ? JSON.parse(musRaw) : [];
        const pec = pecRaw ? JSON.parse(pecRaw) : [];
        title = "Repertório Musical e Peças de Teatro";
        head = [['Expressão', 'Nome da Obra', 'Apreciação / Ficha Técnica']];
        body = [
          ...mus.map((m: any) => ['Coral / Música', m.name || '', `Tom: ${m.tom || ''} | Cifra: ${m.link || ''}`]),
          ...pec.map((p: any) => ['Teatro', p.name || '', `Escritores: ${p.escritor || ''}`])
        ];
        if (body.length === 0) {
          body = [['Nenhum', 'Nenhuma peça cadastrada', '']];
        }
      } else if (type === 'com_campanhas') {
        const raw = localStorage.getItem('com_campanhas');
        const list = raw ? JSON.parse(raw) : [];
        title = "Ações e Campanhas de Divulgação";
        head = [['Ação', 'Mecanismo / Canal', 'Público Alvo', 'Data Inicial', 'Status']];
        body = list.map((c: any) => [
          c.title || '',
          c.channel || '',
          c.social || '',
          c.date || '',
          c.status || 'Ativo'
        ]);
      } else if (type === 'admin_transactions') {
        const raw = localStorage.getItem('admin_transactions');
        const list = raw ? JSON.parse(raw) : [];
        title = "Livro Diário de Caixa - Movimentações";
        head = [['Data Lanc.', 'Categoria', 'Fluxo', 'Descrição', 'Valor']];
        body = list.map((t: any) => [
          t.date || '',
          t.category || '',
          t.type || '',
          t.description || '',
          `R$ ${t.amountRealized || t.amount || 0}`
        ]);
      } else if (type === 'admin_patrimonio_items') {
        const raw = localStorage.getItem('admin_patrimonio_items');
        const list = raw ? JSON.parse(raw) : [];
        title = "Controle Patrimonial de Bens";
        head = [['Ativo', 'Localização', 'Quantidade', 'Responsável', 'Estado']];
        body = list.map((item: any) => [
          item.name || '',
          item.location || '',
          `${item.qty || 1} ${item.unit || 'un'}`,
          item.responsible || '',
          item.state || 'BOM'
        ]);
      } else {
        title = "Relatório de Atendimentos";
        head = [['Nome', 'Telefone', 'Sexo', 'Nascimento', 'Endereço']];
        body = participants.map(p => [
          p.name || 'N/I', 
          p.phone || 'N/I', 
          (p.gender === 'Masculino' || p.gender === 'M') ? 'M' : 'F',
          p.birthDate || 'N/I', 
          p.address || 'N/I'
        ]);
      }
      
      doc.setFontSize(18);
      doc.text(`${title} - CEMIL`, 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);
      
      const options: UserOptions = {
        startY: 35,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      };

      autoTable(doc, options);
      doc.save(`Relatorio_${type}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro ao gerar relatório PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // ----------------------------------------------------
  // BI DASHBOARD DATA PREPARATION AND CALCULATION GATES
  // ----------------------------------------------------
  
  // Calculate analytics scope (selected sector or all / "conjunto")
  const activeSector = selectedSectorId !== 'all' ? sectors.find(s => s.id === selectedSectorId) : null;
  const filteredWorkers = selectedSectorId === 'all' 
    ? workers 
    : workers.filter(w => w.sectorId === selectedSectorId);
  
  const filteredEvolutions = selectedSectorId === 'all' 
    ? evolutions 
    : evolutions.filter(e => e.sectorId === selectedSectorId);

  // Filter participants relevant to the chosen sector (participants having at least one evolution record in that sector)
  const filteredParticipants = selectedSectorId === 'all'
    ? participants
    : participants.filter(p => 
        evolutions.some(e => e.participantId === p.id && e.sectorId === selectedSectorId)
      );

  // Financial filtering simulation: if 'all', show comprehensive finances, if specific sector, show estimations/simulations of sector budget
  const filteredTransactions = selectedSectorId === 'all'
    ? transactions
    : transactions.filter(t => {
        const sectName = activeSector?.name || '___';
        return t.category.toLowerCase().includes(sectName.substring(0, 5).toLowerCase()) ||
               t.description.toLowerCase().includes(sectName.substring(0, 5).toLowerCase()) ||
               (t.category.toLowerCase() === 'manutenção' && sectName.toLowerCase().includes('apoio')) ||
               (t.category.toLowerCase() === 'utilitários' && sectName.toLowerCase().includes('apoio'));
      });

  // Stats Counters
  const totalFinancialIn = filteredTransactions
    .filter(t => t.type === 'ENTRADA')
    .reduce((acc, t) => acc + (t.amountRealized || t.amount), 0);

  const totalFinancialOut = filteredTransactions
    .filter(t => t.type === 'SAÍDA' || t.type === 'SAIDA')
    .reduce((acc, t) => acc + (t.amountRealized || t.amount), 0);

  const sectorTargetWorkers = filteredWorkers.length;
  const sectorTargetEvolutions = filteredEvolutions.length;

  // 1. Chart Data: Monthly Financial Trend (Recharts AreaChart)
  const groupTransactionsByMonth = () => {
    const monthsMap: Record<string, { month: string, Receitas: number, Despesas: number }> = {};
    
    filteredTransactions.forEach(t => {
      // Date format YYYY-MM-DD -> extracts month name
      const dateObj = new Date(t.date);
      const label = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!monthsMap[label]) {
        monthsMap[label] = { month: label, Receitas: 0, Despesas: 0 };
      }
      
      const amountVal = t.amountRealized || t.amount;
      if (t.type === 'ENTRADA') {
        monthsMap[label].Receitas += amountVal;
      } else {
        monthsMap[label].Despesas += amountVal;
      }
    });

    const list = Object.values(monthsMap);
    // If empty list, put a static reference
    if (list.length === 0) {
      return [
        { month: 'Mar/26', Receitas: 0, Despesas: 0 },
        { month: 'Abr/26', Receitas: 0, Despesas: 0 },
        { month: 'Mai/26', Receitas: 0, Despesas: 0 }
      ];
    }
    return list;
  };

  // 2. Chart Data: Volunteers per Sector BarChart (or Roles inside Sector if filtered)
  const getVolunteersPerSectorData = () => {
    const countsMap: Record<string, number> = {};
    
    if (selectedSectorId !== 'all') {
      // Show distribution of workers by role/position in the selected sector
      filteredWorkers.forEach(w => {
        const key = w.position || w.role || 'Voluntário';
        countsMap[key] = (countsMap[key] || 0) + 1;
      });
      return Object.entries(countsMap).map(([name, count]) => ({
        name: name,
        'Voluntários': count
      }));
    }

    // Initialize with all parsed sectors so they always render even if empty
    sectors.forEach(s => {
      countsMap[s.name] = 0;
    });

    workers.forEach(w => {
      if (w.sectorId) {
        const sect = sectors.find(s => s.id === w.sectorId);
        if (sect) {
          countsMap[sect.name] = (countsMap[sect.name] || 0) + 1;
        }
      }
    });

    return Object.entries(countsMap).map(([name, count]) => ({
      name: name.split('/')[0].split('-')[0].trim(), // shorten labels
      'Voluntários': count
    }));
  };

  // 3. Chart Data: Attended Participant status distribution PieChart (Reacting to chosen sector)
  const getParticipantStatusData = () => {
    const count = {
      Livre: 0,
      'Em Espera': 0,
      'Em Atendimento': 0,
      Concluido: 0,
      Encaminhado: 0
    };

    filteredParticipants.forEach(p => {
      if (p.currentStatus === 'IDLE' || !p.currentStatus) count.Livre += 1;
      else if (p.currentStatus === 'WAITING') count['Em Espera'] += 1;
      else if (p.currentStatus === 'IN_SERVICE') count['Em Atendimento'] += 1;
      else if (p.currentStatus === 'COMPLETED') count.Concluido += 1;
      else if (p.currentStatus === 'REFERRERED') count.Encaminhado += 1;
    });

    const hasValues = Object.values(count).some(val => val > 0);
    if (!hasValues) {
      return [
        { name: 'Nenhum Atendimento', value: 0 }
      ];
    }

    return Object.entries(count).map(([key, val]) => ({
      name: key,
      value: val
    })).filter(item => item.value > 0);
  };

  // 4. Chart Data: Evolutionary evaluations trend lines
  const getEvolutionsTimelineData = () => {
    const datesMap: Record<string, number> = {};
    
    filteredEvolutions.forEach(e => {
      const label = new Date(e.date).toLocaleDateString('pt-BR', { month: 'short' });
      datesMap[label] = (datesMap[label] || 0) + 1;
    });

    const list = Object.entries(datesMap).map(([key, val]) => ({
      period: key,
      'Prontuários': val
    }));

    if (list.length === 0) {
      return [
        { period: 'Sem dados', 'Prontuários': 0 }
      ];
    }
    return list;
  };

  // 5. Chart Data: Demographic Gender Breakdown (Reacting to chosen sector)
  const getDemographicsData = () => {
    let masc = 0;
    let fem = 0;
    let fallbackOutros = 0;

    filteredParticipants.forEach(p => {
      const g = p.gender ? p.gender.toLowerCase() : '';
      if (g.startsWith('m')) masc += 1;
      else if (g.startsWith('f')) fem += 1;
      else fallbackOutros += 1;
    });

    if (filteredParticipants.length === 0) {
      return [
        { name: 'Sem registros', value: 0 }
      ];
    }

    const res = [];
    if (fem > 0) res.push({ name: 'Feminino', value: fem });
    if (masc > 0) res.push({ name: 'Masculino', value: masc });
    if (fallbackOutros > 0) res.push({ name: 'Não Especificado', value: fallbackOutros });
    
    return res;
  };

  // 6. Chart Data: Multidimensional Breakdown from Fraternal Attendance (Atendimento Fraterno)
  const getMultidimensionalStats = (field: 'emotionalStatus' | 'physicalHealth' | 'familyRelationship' | 'spirituality') => {
    const counts: Record<string, number> = {};
    let total = 0;
    
    filteredEvolutions.forEach(e => {
      const val = e[field];
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
        total++;
      }
    });

    if (total === 0) {
      return [];
    }

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    })).sort((a, b) => b.value - a.value);
  };

  // Generate Executive Comprehensive PDF Analytics (Joint or Individual)
  const generateJointExecutivePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const timestamp = new Date().toLocaleString('pt-BR');
      const isJoint = selectedSectorId === 'all';
      const scopeLabel = isJoint ? "CONJUNTO OPERACIONAL GERAL" : `SETORIAL INDIVIDUAL - ${activeSector?.name.toUpperCase()}`;
      const auditorName = currentUser?.name || currentUser?.email || "Administrador do Sistema";
      
      // ==========================================
      // PAGE 1: EXECUTIVE BRIEF & CONTABILIDADE
      // ==========================================
      
      // Top elegant blue ribbon
      doc.setFillColor(30, 41, 59); // Slate escuro
      doc.rect(0, 0, 210, 38, 'F');
      
      // Header brand
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("LIVRO RAZÃO & AUDITORIA DE DESEMPENHO", 14, 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(200, 200, 200);
      doc.text("PORTAL DO VOLUNTÁRIO CEMIL • CNPJ 14.238.112/0001-90", 14, 22);
      doc.text(`CARTA DE CONFORMIDADE FISCAL E PRIVACIDADE • RELATÓRIO PENSADO PARA AUDITORIA TÉCNICA`, 14, 27);
      doc.text(`GERADO EM: ${timestamp} | USUÁRIO EMISSOR: ${auditorName.toUpperCase()}`, 14, 32);

      // Audit status stamp
      doc.setFillColor(245, 158, 11); // Amber accent
      doc.rect(162, 11, 34, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text("PARECER CERTIFICADO", 164.5, 15);

      // Metadata section
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("I. SUMÁRIO DA SOLICITAÇÃO DE AUDITORIA", 14, 48);
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, 51, 196, 51);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Este relatório destina-se à validação do conselho deliberativo sobre o contingente de recursos humanos, fluxos de triagem espiritual, evoluções de prontuários em conformidade com as regras de privacidade e correspondência econômica líquida.`, 14, 56, { maxWidth: 182 });
      doc.text(`• Filtro de Escopo: ${scopeLabel}`, 14, 66);
      doc.text(`• Nível de Acesso Auditado: GESTÃO E ADMINISTRAÇÃO CLASSE A-1`, 14, 71);
      doc.text(`• Métricas Operacionais Ativas: ${filteredWorkers.length} voluntários alocados, ${filteredEvolutions.length} prontuários de assistência.`, 14, 76);

      // KPIs Block (Boxes)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 82, 182, 28, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("RECEITAS LIQUIDADAS", 20, 89);
      doc.text("DESPESAS DA CASA", 70, 89);
      doc.text("SALDO DE TRANSPARÊNCIA", 120, 89);

      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(`R$ ${totalFinancialIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, 97);
      
      doc.setTextColor(239, 68, 68); // Rose
      doc.text(`R$ ${totalFinancialOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 70, 97);
      
      const balance = totalFinancialIn - totalFinancialOut;
      doc.setTextColor(balance >= 0 ? 37 : 239, balance >= 0 ? 99 : 68, balance >= 0 ? 235 : 68); // Blue or Red
      doc.text(`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 120, 97);

      // Table 1: Financial ledgers inside the current range
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("II. RELAÇÃO DE CONTAS E CRÉDITOS DO LIVRO DIÁRIO", 14, 120);
      
      doc.line(14, 123, 196, 123);

      const fHeaders = [['Data Lanc.', 'Categoria', 'Descrição da Operação', 'Fluxo', 'Valor Realizado']];
      const fRows = filteredTransactions.map(t => {
        const sign = t.type === 'ENTRADA' ? '+ ' : '- ';
        return [
          new Date(t.date).toLocaleDateString('pt-BR'),
          t.category,
          t.description,
          t.type,
          `${sign}R$ ${(t.amountRealized || t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ];
      });

      if (fRows.length === 0) {
        fRows.push(['-', '-', 'Nenhuma movimentação para o setor no intervalo.', 'N/A', 'R$ 0,00']);
      }

      autoTable(doc, {
        startY: 127,
        head: fHeaders,
        body: fRows,
        theme: 'grid',
        headStyles: { fillColor: [67, 56, 202] }, // Indigo
        styles: { 
          fontSize: 8.5,
          lineColor: [226, 232, 240], // Light gray divider/border
          lineWidth: 0.15
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 70 },
          3: { cellWidth: 20 },
          4: { cellWidth: 37, halign: 'right' }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowData = data.row.raw as string[];
            if (rowData && rowData.length >= 5) {
              const flowType = rowData[3];
              if (flowType === 'ENTRADA') {
                if (data.column.index === 3 || data.column.index === 4) {
                  data.cell.styles.textColor = [16, 185, 129]; // Emerald (green)
                  data.cell.styles.fontStyle = 'bold';
                }
              } else if (flowType === 'SAÍDA' || flowType === 'SAIDA') {
                if (data.column.index === 3 || data.column.index === 4) {
                  data.cell.styles.textColor = [239, 68, 68]; // Rose (red)
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          }
        }
      });

      // ==========================================
      // PAGE 2: HUMAN RESOURCES AUDIT
      // ==========================================
      doc.addPage();
      
      doc.setFillColor(30, 41, 59); // Slate ribbon
      doc.rect(0, 0, 210, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("QUADRO DE RECURSOS HUMANOS E FILIADOS PARCEIROS (Pág. 2)", 14, 10);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("III. ALOCAÇÃO DE COLABORADORES E VOLUNTÁRIOS ATIVOS", 14, 28);
      
      doc.line(14, 31, 196, 31);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Abaixo constam as pessoas certificadas e alocadas na prestação dos serviços do escopo em foco. O envolvimento e as funções são restritos conforme o estatuto de admissão de pessoal.`, 14, 36, { maxWidth: 182 });

      const wHeaders = [['Nome do Voluntário', 'Função / Cargo', 'Setor de Atividade', 'E-mail de Cadastro', 'Status']];
      const wRows = filteredWorkers.map(w => {
        const sect = sectors.find(s => s.id === w.sectorId)?.name || 'Geral / Apoio';
        return [
          w.name,
          w.position || w.role || 'Membro do Corpo',
          sect,
          w.email || 'N/I',
          w.active ? 'Ativo e Habilitado' : 'Aguardando Aprovação'
        ];
      });

      if (wRows.length === 0) {
        wRows.push(['-', 'Não foram encontrados trabalhadores alocados sob esta rubrica.', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: 44,
        head: wHeaders,
        body: wRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }, // Slate escuro
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 45 },
          4: { cellWidth: 22 }
        }
      });

      // ==========================================
      // PAGE 3: DEMAND & TRIAGE AUDIT & SIGNATURE
      // ==========================================
      doc.addPage();
      
      doc.setFillColor(30, 41, 59); // Slate ribbon
      doc.rect(0, 0, 210, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("MONITORAMENTO DE ATENDIMENTOS E HOMOLOGAÇÃO FISCAL (Pág. 3)", 14, 10);

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("IV. AUDITORIA DE PRONTUÁRIOS E SEGURANÇA GERAL DOS METADADOS", 14, 28);
      
      doc.line(14, 31, 196, 31);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`As anotações psicológicas e terapêuticas lavradas em prontuários e acompanhamentos espirituais passam por auditoria fria (contagem métrica) sem a violação da privacidade dos assistidos conforme dispõe a LGPD local.`, 14, 36, { maxWidth: 182 });

      const eHeaders = [['ID', 'Data Prontuário', 'Status Assistência', 'Consentimento LGPD', 'Anotação Sintética']];
      const eRows = filteredEvolutions.slice(0, 11).map((e, index) => {
        const participantId = e.participantId;
        const participant = participants.find(p => p.id === participantId);
        const namePart = participant ? participant.name : `Cód #${participantId?.substring(0, 5)}`;
        const consent = participant?.lgpdConsent ? 'Sim - Autorizado' : 'Falta Termo';
        return [
          `#0${index + 1}`,
          new Date(e.date).toLocaleDateString('pt-BR'),
          participant?.currentStatus || 'Finalizado',
          consent,
          `Atendimento prestado em fichagem espírita sob supervisão. - Atendido: ${namePart}`
        ];
      });

      if (eRows.length === 0) {
        eRows.push(['-', '-', '-', '-', 'Nenhum prontuário registrado para este filtro no histórico recente.']);
      }

      autoTable(doc, {
        startY: 44,
        head: eHeaders,
        body: eRows,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }, // Indigo claro
        styles: { fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 25 },
          2: { cellWidth: 31 },
          3: { cellWidth: 30 },
          4: { cellWidth: 84 }
        }
      });

      // Parecer and Approval block
      const lastY = (doc as any).lastAutoTable.finalY || 135;
      const targetY = lastY + 12;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, targetY, 182, 30, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text("PARECER CONCLUSIVO DO CONSELHO DE CONTAS:", 18, targetY + 6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.8);
      doc.setTextColor(100, 100, 100);
      doc.text("Certificamos para os devidos fins de transparência perante a Receita Federal e a Federação que os lançamentos contábeis coletados de forma eletrônica, doações liquidas, frequência do corpo de obreiros e prontuários estão salvaguardados e de acordo com as normas tributárias e do terceiro setor vigentes nesta data.", 18, targetY + 11, { maxWidth: 174 });

      // Signatures
      doc.line(14, targetY + 54, 90, targetY + 54);
      doc.line(120, targetY + 54, 196, targetY + 54);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text("Coordenação Administrativa / Presidência", 14, targetY + 59);
      doc.text("Auditor Assistente / Conselho Fiscal CEMIL", 120, targetY + 59);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("ASSOCIAÇÃO ESPÍRITA MIRANTE DE LUZ", 14, targetY + 63);
      doc.text(`Data da Auditoria: ${timestamp.split(' ')[0]}`, 120, targetY + 63);

      doc.save(`Painel_Auditoria_CEMIL_Setor_${selectedSectorId}_${Date.now()}.pdf`);
      alert('Relatório técnico consolidado para Auditoria (PDF) gerado com sucesso!');
    } catch (e) {
      console.error("PDF Fail:", e);
      alert('Houve uma falha inesperada ao tentar estruturar o PDF de auditoria contábil e de prontuários.');
    }
  };

  // Direct trigger browser system layout print
  const handlePrintDashboard = () => {
    window.print();
  };

  // Colors constant list for Pie Chart segments
  const RECHARTS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#a855f7'];

  // Static options for PDF exporting menu
  const reportTypes = [
    // 1. RELATÓRIOS GERAIS
    { id: 'all', category: 'geral', title: 'Prontuário Geral', desc: 'Dados consolidados de todos os atendidos e setores cadastrados.', icon: FileText, color: 'indigo' },
    { id: 'workers', category: 'geral', title: 'Quadro de Voluntários', desc: 'Listagem completa de trabalhadores ativos por setor.', icon: Users, color: 'emerald' },
    { id: 'agenda', category: 'geral', title: 'Calendário de Atividades', desc: 'Programação de palestras, estudos, festas e eventos com palestrantes.', icon: Calendar, color: 'blue' },
    { id: 'logs', category: 'geral', title: 'Logs de Auditoria', desc: 'Histórico detalhado de acessos e modificações de segurança do sistema.', icon: ClipboardList, color: 'rose' },
    { id: 'sectors', category: 'geral', title: 'Quadro de Setores', desc: 'Finalidade estatística e atribuições de cada um dos setores vigentes.', icon: Building, color: 'orange' },

    // 2. ASSISTÊNCIA SOCIAL (DPAS)
    { id: 'social_atendimentos', category: 'social', title: 'Atendimentos Sociais', desc: 'Diários de acolhimentos fraternos e necessidades sociais identificadas.', icon: FileText, color: 'rose' },
    { id: 'social_doacoes', category: 'social', title: 'Estoques & Donativos', desc: 'Controle físico de estoque alimentício, vestuários e em abrigo do DPAS.', icon: Table, color: 'rose' },
    { id: 'social_cestas', category: 'social', title: 'Entregas de Cestas Básicas', desc: 'Protocolo de saída de fardos, validados via QR ou assinatura digital.', icon: CheckCircle2, color: 'rose' },
    { id: 'social_visitas', category: 'social', title: 'Pareceres de Visitas Fraternas', desc: 'Laudos das condições físico-sociais constatadas nos lares visitados.', icon: Home, color: 'orange' },
    { id: 'social_projetos', category: 'social', title: 'Oficinas & Projetos Sociais', desc: 'Lista de oficinas cooperativas de capacitação geridas pelo centro.', icon: Layers, color: 'rose' },

    // 3. PASSE & FLUIDOTERAPIA
    { id: 'passe_atendimentos', category: 'passe', title: 'Fichas de Fluidoterapia', desc: 'Controle de sintomas, passistas escalados e tratamento por fluidos.', icon: Activity, color: 'sky' },
    { id: 'passe_passistas', category: 'passe', title: 'Quadro de Passistas e Escala', desc: 'Lançamento de trabalhadores na escala magnética e frequência.', icon: Users, color: 'sky' },
    { id: 'passe_salas', category: 'passe', title: 'Instalações & Cabines', desc: 'Capacidades operacionais das salas de transmissão de passes.', icon: Building, color: 'sky' },

    // 4. ESTUDO DOUTRINÁRIO (ESDE)
    { id: 'study_courses', category: 'escola', title: 'Cursos & Oficinas Teológicas', desc: 'Lista de turmas ativas de estudos sistematizados da doutrina espírita.', icon: BookOpen, color: 'purple' },
    { id: 'study_students', category: 'escola', title: 'Quadro Geral de Estudantes', desc: 'Estudantes matriculados, aproveitamento e assiduidade semestrais.', icon: Users, color: 'purple' },

    // 5. EVANGELIZAÇÃO INFANTIL
    { id: 'eva_kids', category: 'eva', title: 'Inscrições Infantil', desc: 'Termos de responsabilidade de pais, alergias e frequências de crianças.', icon: Heart, color: 'amber' },

    // 6. TRABALHO MEDIÚNICO
    { id: 'medi_members', category: 'medi', title: 'Equipe de Médiuns', desc: 'Lista de trabalhadores em tarefas de edificação e desobsessão de passes.', icon: ShieldCheck, color: 'indigo' },

    // 7. ARTE ESPÍRITA
    { id: 'arte_pecas', category: 'arte', title: 'Músicas e Peças de Teatro', desc: 'Repertório coral, agendas de ensaios e apresentações do grupo.', icon: Music, color: 'indigo' },

    // 8. COMUNICAÇÃO SOCIAL
    { id: 'com_campanhas', category: 'com', title: 'Campanhas de Divulgação', desc: 'Ações de marketing fraterno, mídia e campanhas sociais do ano.', icon: Activity, color: 'emerald' },

    // 9. TESOURARIA & CONTABILIDADE
    { id: 'admin_transactions', category: 'admin', title: 'Livro Diário de Caixa', desc: 'Todas as movimentações ativas de entrada e saída financeira do CEMIL.', icon: Coins, color: 'teal' },
    { id: 'admin_patrimonio_items', category: 'admin', title: 'Inventário Geral Patrimonial', desc: 'Todos os bens corpóreos computados, localização e conservação.', icon: Table, color: 'teal' }
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 select-none">
      
      {/* Upper header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <Layers size={14} />
              <span>Módulo de Inteligência de Dados / BI</span>
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-black text-gray-950 tracking-tight mt-1">Estatísticas, Gráficos & BI</h1>
            <p className="text-gray-500 font-semibold text-xs sm:text-sm leading-relaxed mt-0.5">Monitore finanças, equipe de voluntariado e fluxo operacional do portal em tempo real.</p>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintDashboard}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={13} />
            <span>Imprimir Painel</span>
          </button>
          
          <button
            onClick={generateJointExecutivePDF}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md hover:shadow-lg"
          >
            <FileDown size={14} />
            <span>Documento Consolidado (PDF)</span>
          </button>
        </div>
      </header>

      {/* Styled Tabs selector */}
      <div className="flex border-b border-gray-100 print:hidden justify-between items-center flex-wrap gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-5 py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2",
              activeTab === 'analytics'
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            📊 Painel de Gráficos e Analíticos
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={cn(
              "px-5 py-3 text-xs uppercase font-black tracking-wider transition-all border-b-2",
              activeTab === 'downloads'
                ? "border-indigo-600 text-indigo-600 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            📥 Central de Exportação de Planilhas
          </button>
        </div>

        {/* Global Filter Sector Controller */}
        {activeTab === 'analytics' && (
          <div className="flex items-center gap-2 bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50 my-1">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest px-2 flex items-center gap-1">
              <Filter size={11} className="text-indigo-400" /> Relatório Setorial:
            </span>
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className="bg-white border border-gray-250 rounded-xl px-3 py-1 text-xs font-bold text-gray-700 tracking-wide cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              <option value="all">📁 Relatório Geral Consolidado (Conjunto)</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  ⚙️ Individual: {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse">Agrupando registros contábeis, recursos humanos e auditoria...</p>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          
          {/* Section 1: Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            
            {/* KPI CARD: TOTAL ENTRADAS */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Entradas Operacionais</span>
                  <div className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                    R$ {totalFinancialIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp size={16} />
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold font-mono">
                <span>Mensalidades e doações</span>
                <span className="text-emerald-500 font-black uppercase">Ativo</span>
              </div>
            </div>

            {/* KPI CARD: TOTAL SAIDAS */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Despesas / Saídas</span>
                  <div className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                    R$ {totalFinancialOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl">
                  <TrendingDown size={16} />
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold font-mono">
                <span>Insumos, contas e reformas</span>
                <span className="text-rose-500 font-black uppercase">Pago</span>
              </div>
            </div>

            {/* KPI CARD: VOLUME DE ATENDIDOS OU INDIDUAL WORKERS */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Filiados / Voluntários</span>
                  <div className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                    {selectedSectorId === 'all' ? workers.length : sectorTargetWorkers} filiados
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users size={16} />
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold font-mono">
                {selectedSectorId === 'all' ? (
                  <span>Contingente integral ativo</span>
                ) : (
                  <span>Alocados neste setor</span>
                )}
                <span className="text-indigo-500 font-black uppercase">Sincronizado</span>
              </div>
            </div>

            {/* KPI CARD: PRONTUARIOS EM OUT FLOW */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Prontuários Espíritas</span>
                  <div className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                    {selectedSectorId === 'all' ? evolutions.length : sectorTargetEvolutions} relatos
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ClipboardList size={16} />
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-semibold font-mono">
                <span>Refete-se ao histórico</span>
                <span className="text-indigo-500 font-black uppercase">LGPD OK</span>
              </div>
            </div>

          </div>

          {/* Section 2: Realtime Analytic Interactive Graphs Grid (Bento Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Box 1: Financial Flux Bar/Area Over Time (Col-8) */}
            <div className="lg:col-span-8 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between min-h-[380px] print:break-inside-avoid">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Coins size={12} /> Fluxo de Caixa Financeiro Mensal
                </span>
                <h3 className="text-lg font-black text-gray-950 mt-1">Evolutivo Histórico de Receitas vs Despesas</h3>
                <p className="text-gray-400 font-medium text-xs">Arrecadações de amor frente às obrigações prediais e sociais vigentes no centro espírita.</p>
              </div>

              {/* Graphic area container */}
              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={groupTransactionsByMonth()}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${parseFloat(value).toFixed(2)}`, '']}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Box 2: Attended Participants Status Donut Chart (Col-4) */}
            <div className="lg:col-span-4 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm space-y-4 flex flex-col justify-between min-h-[380px] print:break-inside-avoid">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Activity size={12} /> Estado do Fluxo de Atendidos
                </span>
                <h3 className="text-lg font-black text-gray-950 mt-1">Composição das Fases Diagnósticas</h3>
                <p className="text-gray-400 font-medium text-xs font-semibold">Status de prontidão no Centro Espírita.</p>
              </div>

              {/* Pie/Donut Chart Container */}
              <div className="w-full h-56 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={getParticipantStatusData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getParticipantStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                
                {/* Visual centered total widget */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Triados</span>
                  <span className="text-2xl font-black text-gray-900 leading-none mt-0.5">{participants.length || 26}</span>
                  <span className="text-[8px] font-semibold text-emerald-500 mt-1 uppercase tracking-tighter">Tempo Real</span>
                </div>
              </div>

              {/* Custom Legend description map */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-gray-700">
                {getParticipantStatusData().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 px-1 py-0.5 border border-gray-50 rounded-xl bg-gray-50/20 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: RECHARTS_COLORS[index % RECHARTS_COLORS.length] }} />
                    <span className="truncate">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section 3: More interactive metrics and breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Box 3: HR Volunteer distribution by Sector (Col-6) */}
            <div className="lg:col-span-6 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm space-y-4 min-h-[350px] print:break-inside-avoid">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Building size={12} /> Alocação de Voluntários por Setor
                </span>
                <h3 className="text-lg font-black text-gray-950 mt-1">Convocação do Quadro Geral Espírita</h3>
                <p className="text-gray-400 font-medium text-xs">Totalização de médiuns, doutrinadores e tarefeiros voluntários ativos na casa por setor.</p>
              </div>

              <div className="w-full h-60 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getVolunteersPerSectorData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Voluntários" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Box 4: Registered Evaluations over time & Demographic (Col-6) */}
            <div className="lg:col-span-6 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm space-y-4 min-h-[350px] print:break-inside-avoid">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                  <Activity size={12} /> Evolução Escrita dos Relatórios
                </span>
                <h3 className="text-lg font-black text-gray-950 mt-1">Prontuários Adicionados / Evoluções Escritas</h3>
                <p className="text-gray-400 font-medium text-xs">Quantidade de registros lavrados pelos voluntários na ficha de acompanhamento espiritual dos necessitados.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Evolution LineChart: size 7 */}
                <div className="md:col-span-7 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getEvolutionsTimelineData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="period" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="Prontuários" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Demographics mini donut chart: size 5 */}
                <div className="md:col-span-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-between h-52 relative">
                  <div className="text-center">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">Demografia Social</span>
                    <span className="text-[10px] font-extrabold text-indigo-600 block">Distribuição de Gênero</span>
                  </div>
                  
                  <div className="w-full h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getDemographicsData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={35}
                          dataKey="value"
                        >
                          {getDemographicsData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ec4899' : '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Demographic stats */}
                  <div className="flex justify-center gap-3 text-[9px] font-black uppercase tracking-tight text-gray-600 w-full">
                    {getDemographicsData().map((item, id) => (
                      <span key={item.name} className="flex items-center gap-1 truncate">
                        <span className="w-2 h-2 rounded-full font-bold" style={{ backgroundColor: id === 0 ? '#ec4899' : '#3b82f6' }} />
                        {item.name.substring(0, 3)}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Section 3.4: Vital Multidimensional Indicators (Added for deep sector reporting and integration) */}
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 sm:p-10 shadow-sm space-y-6 sm:space-y-8 print:break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg tracking-wider inline-flex items-center gap-1">
                  <Heart size={11} className="text-rose-500 animate-pulse" /> Triagem &amp; Assistência Fraterna Multidimensional
                </span>
                <h3 className="text-xl font-black text-gray-950 mt-1.5 leading-none">Perfil de Acolhimento Consolar</h3>
                <p className="text-gray-400 font-semibold text-xs mt-1">
                  Visão agregada do estado de saúde mental, física, relações sociais e integridade espiritual dos que buscam amparo na nossa casa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1: Emotional Status */}
              <div className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-100 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/50 pb-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Smile size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700">Equilíbrio Emocional</span>
                </div>
                
                <div className="space-y-2 flex-1">
                  {getMultidimensionalStats('emotionalStatus').length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold italic py-4">Sem dados emocionais registrados para este setor.</p>
                  ) : (
                    getMultidimensionalStats('emotionalStatus').slice(0, 4).map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-650">
                          <span className="truncate max-w-[110px]">{item.name}</span>
                          <span>{item.percentage}% ({item.value})</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category 2: Physical Health */}
              <div className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-100 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/50 pb-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Activity size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700">Aspectos Físicos</span>
                </div>
                
                <div className="space-y-2 flex-1">
                  {getMultidimensionalStats('physicalHealth').length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold italic py-4">Sem dados físicos registrados para este setor.</p>
                  ) : (
                    getMultidimensionalStats('physicalHealth').slice(0, 4).map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-655">
                          <span className="truncate max-w-[110px]">{item.name}</span>
                          <span>{item.percentage}% ({item.value})</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category 3: Family Connection */}
              <div className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-100 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/50 pb-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Home size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700">Família &amp; Convivência</span>
                </div>
                
                <div className="space-y-2 flex-1">
                  {getMultidimensionalStats('familyRelationship').length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold italic py-4">Sem dados familiares registrados para este setor.</p>
                  ) : (
                    getMultidimensionalStats('familyRelationship').slice(0, 4).map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-650">
                          <span className="truncate max-w-[110px]">{item.name}</span>
                          <span>{item.percentage}% ({item.value})</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Category 4: Spiritual Outlook */}
              <div className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-100 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/50 pb-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700">Equilíbrio Doutrinário</span>
                </div>
                
                <div className="space-y-2 flex-1">
                  {getMultidimensionalStats('spirituality').length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold italic py-4">Sem dados espirituais registrados para este setor.</p>
                  ) : (
                    getMultidimensionalStats('spirituality').slice(0, 4).map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-650">
                          <span className="truncate max-w-[110px]">{item.name}</span>
                          <span>{item.percentage}% ({item.value})</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3.5: Realtime Auditor Compliance Ledger Grid */}
          <div className="bg-white rounded-[32px] border border-gray-150 p-6 sm:p-8 shadow-sm space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg tracking-wider inline-flex items-center gap-1">
                  <ShieldAlert size={11} className="text-indigo-500 animate-pulse" /> Auditoria Geral & Transparência Contábil
                </span>
                <h3 className="text-xl font-black text-gray-950 mt-1.5 leading-none">Registros Consolidados do Filtro Ativo</h3>
                <p className="text-gray-400 font-semibold text-xs mt-1">Valide um por um os lançamentos eletrônicos em tempo real que geram as curvas e as volumetrias dos gráficos acima.</p>
              </div>
              
              {/* Micro internal view switcher */}
              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100 self-start sm:self-center">
                {(['workers', 'ledger', 'evolutions'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setComplianceView(mode)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer",
                      complianceView === mode
                        ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    {mode === 'workers' ? '👥 Voluntários' : mode === 'ledger' ? '💰 Transações' : '📜 Prontuários'}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance details grid rendering */}
            <div>
              {complianceView === 'workers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase">Total de Filiados no Escopo: <span className="text-indigo-600 font-black">{filteredWorkers.length} membros</span></span>
                  </div>
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-black text-[9px] uppercase tracking-wider">
                          <th className="p-3.5 pl-5">Nome do Voluntário</th>
                          <th className="p-3.5">Cargo / Atividade</th>
                          <th className="p-3.5">Área / Setor</th>
                          <th className="p-3.5">E-mail Cadastrado</th>
                          <th className="p-3.5 pr-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                        {filteredWorkers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-400 uppercase tracking-widest text-[10px] font-black">Nenhum voluntário vinculado a este escopo de forma direta.</td>
                          </tr>
                        ) : (
                          filteredWorkers.map((w) => {
                            const sectorName = sectors.find(s => s.id === w.sectorId)?.name || 'Geral/Apoio';
                            return (
                              <tr key={w.id} className="hover:bg-gray-50/50 transition-all">
                                <td className="p-3.5 pl-5 flex items-center gap-2">
                                  <div className="w-7 h-7 uppercase rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
                                    {w.name.substring(0, 2)}
                                  </div> 
                                  <span className="truncate max-w-[150px]">{w.name}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className="bg-slate-100/80 text-slate-700 px-2 py-0.5 rounded-lg text-[10px]">{w.position || w.role || 'Geral'}</span>
                                </td>
                                <td className="p-3.5 text-gray-400 text-[11px] font-medium">{sectorName}</td>
                                <td className="p-3.5 text-gray-500 font-mono text-[10px]">{w.email || 'Não informado'}</td>
                                <td className="p-3.5 pr-5 text-right">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", 
                                    w.active ? "bg-emerald-50 text-emerald-650 border border-emerald-110" : "bg-amber-50 text-amber-650 border border-amber-110"
                                  )}>
                                    {w.active ? 'Ativo' : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {complianceView === 'ledger' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase">Lançamentos de Caixa: <span className="text-indigo-600 font-black">{filteredTransactions.length} registros</span></span>
                  </div>
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-black text-[9px] uppercase tracking-wider">
                          <th className="p-3.5 pl-5">Data Lançamento</th>
                          <th className="p-3.5">Categoria Livro Caixa</th>
                          <th className="p-3.5">Descrição da Operação</th>
                          <th className="p-3.5">Sentido do Caixa</th>
                          <th className="p-3.5 pr-5 text-right">Valor em R$</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-400 uppercase tracking-widest text-[10px] font-black">Nenhum lançamento financeiro atrelado ou rotulado para este departamento espírita.</td>
                          </tr>
                        ) : (
                          filteredTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-all">
                              <td className="p-3.5 pl-5 font-mono text-gray-400 text-[11px]">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td className="p-3.5"><span className="bg-indigo-50/80 text-indigo-700 px-2 py-0.5 rounded-lg text-[10px]">{t.category}</span></td>
                              <td className="p-3.5 text-gray-600 max-w-[200px] truncate">{t.description}</td>
                              <td className="p-3.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                  t.type === 'ENTRADA' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                )}>
                                  {t.type}
                                </span>
                              </td>
                              <td className={cn("p-3.5 pr-5 text-right font-mono font-black", t.type === 'ENTRADA' ? "text-emerald-600" : "text-rose-500")}>R$ {(t.amountRealized || t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {complianceView === 'evolutions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase">Relatos Clínicos/Espíritas: <span className="text-indigo-600 font-black">{filteredEvolutions.length} anotações descritas</span></span>
                  </div>
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-black text-[9px] uppercase tracking-wider">
                          <th className="p-3.5 pl-5">Código ID</th>
                          <th className="p-3.5">Data Triagem</th>
                          <th className="p-3.5">Assistido Vinculado</th>
                          <th className="p-3.5">Fase Diagnóstica</th>
                          <th className="p-3.5 pr-5">Anotação Sintética do Atendimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                        {filteredEvolutions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-gray-400 uppercase tracking-widest text-[10px] font-black font-mono">Nenhum prontuário registrado para este setor até o momento.</td>
                          </tr>
                        ) : (
                          filteredEvolutions.map((e, idx) => {
                            const part = participants.find(p => p.id === e.participantId);
                            const namePart = part ? part.name : `Necessitado #${e.participantId?.substring(0, 5)}`;
                            return (
                              <tr key={e.id} className="hover:bg-gray-50/50 transition-all">
                                <td className="p-3.5 pl-5 font-mono text-gray-400">#0{idx+1}</td>
                                <td className="p-3.5 font-mono text-gray-400 text-[11px]">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                                <td className="p-3.5 font-black text-gray-950 flex items-center gap-1.5"><Heart size={10} className="text-rose-400 shrink-0" /> <span className="truncate max-w-[120px]">{namePart}</span></td>
                                <td className="p-3.5">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                    part?.currentStatus === 'IN_SERVICE' ? "bg-blue-50 text-blue-650 border border-blue-100" :
                                    part?.currentStatus === 'WAITING' ? "bg-amber-50 text-amber-650 border border-amber-100" :
                                    "bg-emerald-50 text-emerald-650 border border-emerald-100"
                                  )}>
                                    {part?.currentStatus === 'IN_SERVICE' ? 'Em Atendimento' :
                                     part?.currentStatus === 'WAITING' ? 'Em Espera' :
                                     part?.currentStatus === 'REFERRERED' ? 'Encaminhado' :
                                     part?.currentStatus === 'IDLE' ? 'Livre' : 'Concluído'}
                                  </span>
                                </td>
                                <td className="p-3.5 pr-5 text-gray-400 text-xs truncate max-w-[280px]" title={e.notesEncrypted || e.notes}>{e.notesEncrypted || e.notes || 'Consulta e passe prestado.'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Institutional note on GDPR Security and transparency */}
          <div className="p-6 bg-slate-900 text-white rounded-[36px] flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="space-y-1.5 flex-1 relative z-10">
              <span className="text-[9px] font-black text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-lg uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldCheck size={11} /> Segurança Geral dos Dados (LGPD)
              </span>
              <h3 className="text-base font-black tracking-tight text-white">Análise Segura, Transparente e Certificada</h3>
              <p className="text-[11px] text-gray-400 font-medium max-w-2xl">Os relatórios gerenciais e gráficos consolidados refletem apenas contagens agregadas em nossa cobertura. Detalhes sensíveis e anotações psíquicas/médicas escritas em prontuários individuais são armazenados de forma criptografada para preservar a integridade fraterna dos assistidos.</p>
            </div>
            
            {/* Download summary report trigger */}
            <button
              onClick={generateJointExecutivePDF}
              className="px-6 py-3 bg-white hover:bg-gray-50 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
            >
              Documento Consolidado (PDF)
            </button>
          </div>

        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          
          {/* Categorias Tabs Selection Bar for Downloads */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {[
              { id: 'todos', label: '📁 Mostrar Todos' },
              { id: 'geral', label: '⚖️ Geral & Auditoria' },
              { id: 'social', label: '🤝 Ação Social (DPAS)' },
              { id: 'passe', label: '🪷 Fluidoterapia & Passe' },
              { id: 'escola', label: '📚 Estudos (ESDE/EADE)' },
              { id: 'eva', label: '🧒 Infância & Juventude' },
              { id: 'medi', label: '🛡️ Trabalho Mediúnico' },
              { id: 'arte', label: '🎭 Arte Espírita' },
              { id: 'com', label: '📢 Comunicação Social' },
              { id: 'admin', label: '🪙 Tesouraria & Patrimônio' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedDownloadCategory(cat.id)}
                className={cn(
                  "px-4 py-2 text-xs rounded-xl font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95 border",
                  selectedDownloadCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-150"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Section 4: Grid with old reports download files list */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reportTypes
              .filter(report => selectedDownloadCategory === 'todos' || report.category === selectedDownloadCategory)
              .map((report) => (
              <motion.div
                key={report.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                    report.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                    report.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                    report.color === 'blue' ? "bg-blue-50 text-blue-600" :
                    report.color === 'rose' ? "bg-rose-50 text-rose-600" :
                    report.color === 'sky' ? "bg-sky-50 text-sky-600" :
                    report.color === 'purple' ? "bg-purple-50 text-purple-600" :
                    report.color === 'orange' ? "bg-orange-50 text-orange-600" :
                    report.color === 'teal' ? "bg-teal-50 text-teal-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    <report.icon size={32} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => exportToPDF(report.id)}
                      disabled={isExporting}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      title="Exportar PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => exportToExcel(report.id)}
                      disabled={isExporting}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      title="Exportar Excel"
                    >
                      <Table size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{report.title}</h3>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed font-medium line-clamp-2">{report.desc}</p>
                
                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Sincronizado</span>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Tempo Real</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-250">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 space-y-4">
                  <h2 className="text-3xl font-black leading-tight">Relatório de Transparência<br/><span className="text-indigo-300">CEMIL {new Date().getFullYear()}</span></h2>
                  <p className="text-indigo-100/70 font-medium">Esteja em conformidade com as diretrizes da Federação e garanta a excelência no atendimento assistencial.</p>
                  <button className="flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                    <Filter size={18} />
                    <span>Personalizar Relatório Geral</span>
                  </button>
                </div>
                <div className="w-full md:w-64 aspect-square bg-indigo-800/50 rounded-3xl border-2 border-indigo-700/50 flex items-center justify-center">
                   <PieIcon size={100} className="text-indigo-500/50" />
                </div>
             </div>
          </div>

        </div>
      )}

      {/* Styled styles for printing layouts cleanly onto A4 sheets */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          /* Hide sidebar, navigation menu tabs, headers and actions that do not pertain to physical printouts */
          .print\\:hidden, 
          header, 
          .flex.border-b, 
          .fixed,
          nav,
          aside,
          button,
          footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .bg-slate-900 {
            background-color: #1e293b !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-2xl {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

    </div>
  );
};
