import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ListOrdered, 
  Clock, 
  Search,
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  X,
  CheckCircle2,
  Sparkles,
  Phone,
  QrCode,
  Tv,
  HeartHandshake,
  AlertTriangle,
  Check,
  ShieldCheck,
  UserCheck,
  CalendarCheck,
  Zap,
  BookOpen,
  Ticket,
  Printer,
  Star,
  Activity,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Participant, ServiceQueueEntry, Sector, VisitorLog, CleaningChecklist, PublicAttendanceCount } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Core Data States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [queueItems, setQueueItems] = useState<ServiceQueueEntry[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Recepção e Limpeza (Firestore)
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorPurpose, setNewVisitorPurpose] = useState('');

  const [cleaningChecklists, setCleaningChecklists] = useState<CleaningChecklist[]>([]);
  const [newChecklistRoomName, setNewChecklistRoomName] = useState('');
  const [newChecklistStatus, setNewChecklistStatus] = useState<'LIMPO' | 'ATENCAO' | 'PENDENTE'>('LIMPO');
  const [newChecklistResponsibleName, setNewChecklistResponsibleName] = useState('');
  const [newChecklistObservations, setNewChecklistObservations] = useState('');

  // Instant Search & Direct Queue Entry
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipantForQueue, setSelectedParticipantForQueue] = useState<Participant | null>(null);
  const [queueSectorId, setQueueSectorId] = useState('');
  const [isPreferential, setIsPreferential] = useState(false);
  const [queueNotes, setQueueNotes] = useState('');
  const [isSubmittingQueue, setIsSubmittingQueue] = useState(false);
  const [queueSuccessMsg, setQueueSuccessMsg] = useState('');

  // Frequentadores Avulsos / Check-in Expresso (Sem cadastro prévio)
  const [publicAttendance, setPublicAttendance] = useState<PublicAttendanceCount | null>(null);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressName, setExpressName] = useState('');
  const [expressSectorType, setExpressSectorType] = useState<'PASSE' | 'DOUTRINARIA' | 'FRATERNO'>('PASSE');
  const [expressPriority, setExpressPriority] = useState(false);
  const [expressNotes, setExpressNotes] = useState('');
  const [isSubmittingExpress, setIsSubmittingExpress] = useState(false);
  const [lastIssuedTicket, setLastIssuedTicket] = useState<{ ticketNumber: string; name: string; sector: string } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'ATENDIMENTOS' | 'LIMPEZA'>('ATENDIMENTOS');

  useEffect(() => {
    // Setup real-time listeners
    const unsubQueue = dataService.subscribeToQueue((q) => {
      setQueueItems(q || []);
      setLoading(false);
    });

    const unsubParticipants = dataService.subscribeToParticipants((p) => {
      setParticipants(p || []);
    });

    const unsubSectors = dataService.subscribeToSectors((s) => {
      setSectors(s || []);
      if (s && s.length > 0 && !queueSectorId) {
        setQueueSectorId(s[0].id);
      }
    });

    const unsubVisitors = dataService.subscribeVisitorLogs((logs) => {
      setVisitorLogs(logs || []);
    });

    const unsubCleaning = dataService.subscribeCleaningChecklists((lists) => {
      setCleaningChecklists(lists || []);
    });

    const unsubPublicAttendance = dataService.subscribePublicAttendanceToday((stats) => {
      setPublicAttendance(stats);
    });

    return () => {
      unsubQueue();
      unsubParticipants();
      unsubSectors();
      unsubVisitors();
      unsubCleaning();
      unsubPublicAttendance();
    };
  }, []);

  // Filter participants for instant search
  const filteredParticipants = searchQuery.trim().length >= 2 
    ? participants.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.cpf && p.cpf.includes(searchQuery)) ||
        (p.phone && p.phone.includes(searchQuery))
      ).slice(0, 5)
    : [];

  const handleOpenQueueModal = (participant: Participant) => {
    setSelectedParticipantForQueue(participant);
    setIsPreferential(false);
    setQueueNotes('');
    if (sectors.length > 0) {
      setQueueSectorId(sectors[0].id);
    }
  };

  const handleConfirmAddToQueue = async () => {
    if (!selectedParticipantForQueue || !queueSectorId) return;

    setIsSubmittingQueue(true);
    try {
      await dataService.addToQueue({
        participantId: selectedParticipantForQueue.id,
        sectorId: queueSectorId,
        priority: isPreferential,
        notes: queueNotes.trim()
      });

      const participantName = selectedParticipantForQueue.name;
      setQueueSuccessMsg(`✓ ${participantName} inserido na fila com sucesso!`);
      setSelectedParticipantForQueue(null);
      setSearchQuery('');
      setTimeout(() => setQueueSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error adding to queue:", err);
      alert("Erro ao adicionar à fila de espera.");
    } finally {
      setIsSubmittingQueue(false);
    }
  };

  // Quick Action Handlers for Anonymous & Express Frequenters
  const handleQuickPasse = async (priority = false) => {
    setIsSubmittingExpress(true);
    try {
      const entry = await dataService.addExpressQueueEntry({
        sectorType: 'PASSE',
        priority: priority,
        visitorType: 'PASSE_EXPRESSO'
      });
      if (entry) {
        setLastIssuedTicket({
          ticketNumber: entry.ticketNumber || (priority ? '#PREF-001' : '#P-001'),
          name: entry.participantName || (priority ? 'Frequentador (Passe Preferencial)' : 'Frequentador (Passe Geral)'),
          sector: priority ? 'Passe e Fluidos (Preferencial)' : 'Passe e Fluidoterapia'
        });
        setQueueSuccessMsg(`✓ Senha ${entry.ticketNumber || 'Passe'} emitida com sucesso!`);
        setTimeout(() => setQueueSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error("Error issuing quick passe:", err);
      alert("Erro ao emitir senha de passe rápido.");
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  const handleQuickDoutrinaria = async (count = 1) => {
    setIsSubmittingExpress(true);
    try {
      await dataService.recordPublicAttendance('PALESTRA_PUBLICA', count);
      setQueueSuccessMsg(`✓ +${count} presença(s) na Palestra Doutrinária contabilizada(s)!`);
      setTimeout(() => setQueueSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error registering public attendance:", err);
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  const handleQuickFraterno = async (priority = false) => {
    setIsSubmittingExpress(true);
    try {
      const entry = await dataService.addExpressQueueEntry({
        sectorType: 'FRATERNO',
        priority: priority,
        visitorType: 'AVULSO'
      });
      if (entry) {
        setLastIssuedTicket({
          ticketNumber: entry.ticketNumber || (priority ? '#PREF-001' : '#F-001'),
          name: entry.participantName || 'Frequentador Avulso',
          sector: priority ? 'Atendimento Fraterno (Preferencial)' : 'Atendimento Fraterno Avulso'
        });
        setQueueSuccessMsg(`✓ Senha ${entry.ticketNumber} emitida para Triagem Fraterna!`);
        setTimeout(() => setQueueSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error("Error issuing quick fraterno:", err);
      alert("Erro ao emitir senha de atendimento fraterno.");
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  const handleExpressSubmit = async () => {
    setIsSubmittingExpress(true);
    try {
      const entry = await dataService.addExpressQueueEntry({
        name: expressName.trim() || undefined,
        sectorType: expressSectorType,
        priority: expressPriority,
        notes: expressNotes.trim() || undefined
      });
      if (entry) {
        setLastIssuedTicket({
          ticketNumber: entry.ticketNumber || '#001',
          name: entry.participantName || (expressName.trim() || 'Frequentador Avulso'),
          sector: expressSectorType === 'PASSE' 
            ? (expressPriority ? 'Passe / Fluidos (Preferencial)' : 'Passe / Fluidoterapia')
            : expressSectorType === 'DOUTRINARIA' 
              ? 'Palestra Doutrinária' 
              : 'Atendimento Fraterno'
        });
        setShowExpressModal(false);
        setExpressName('');
        setExpressNotes('');
        setExpressPriority(false);
        setQueueSuccessMsg(`✓ Senha ${entry.ticketNumber} emitida para ${entry.participantName}!`);
        setTimeout(() => setQueueSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error("Error in express submit:", err);
      alert("Erro ao emitir entrada expressa.");
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  const handlePrintQuickTicket = (ticket: { ticketNumber: string; name: string; sector: string }) => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>SENHA DE ATENDIMENTO - MIRANTE DE LUZ</title>
          <style>
            body { font-family: monospace, sans-serif; text-align: center; padding: 20px; color: #000; width: 260px; margin: 0 auto; }
            .header { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .sub { font-size: 10px; color: #444; margin-bottom: 12px; }
            .ticket-num { font-size: 36px; font-weight: 900; margin: 10px 0; border: 2px dashed #000; padding: 10px; }
            .info { font-size: 11px; text-align: left; margin-top: 10px; line-height: 1.5; }
            .footer { margin-top: 18px; font-size: 9px; border-top: 1px solid #ccc; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">MIRANTE DE LUZ</div>
          <div class="sub">Centro Espírita • Fila de Atendimento</div>
          <div class="ticket-num">${ticket.ticketNumber}</div>
          <div class="info">
            <strong>IDENTIFICAÇÃO:</strong> ${ticket.name}<br/>
            <strong>SETOR:</strong> ${ticket.sector}<br/>
            <strong>HORA:</strong> ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br/>
          </div>
          <div class="footer">Aguarde a chamada no painel luminoso. Fraternidade e Paz.</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleRegisterVisitor = async () => {
    if (!newVisitorName.trim()) return;
    const newV: VisitorLog = {
      id: 'v_' + Date.now().toString(36),
      name: newVisitorName.trim(),
      phone: newVisitorPhone.trim() || '(11) 90000-0000',
      purpose: newVisitorPurpose.trim() || 'Atendimento Fraterno',
      checkInTime: Date.now()
    };
    await dataService.addVisitorLog(newV);
    setNewVisitorName('');
    setNewVisitorPhone('');
    setNewVisitorPurpose('');
  };

  const handleCheckOutVisitor = async (id: string) => {
    await dataService.checkOutVisitorLog(id);
  };

  const handleUpdateChecklistStatus = async (id: string, newStatus: 'LIMPO' | 'ATENCAO' | 'PENDENTE', obs?: string) => {
    const existing = cleaningChecklists.find(cl => cl.id === id);
    if (!existing) return;

    const updated: CleaningChecklist = {
      ...existing,
      status: newStatus,
      responsibleName: currentUser?.name || 'Voluntário da Casa',
      lastCleanedAt: Date.now(),
      observations: obs !== undefined ? obs : existing.observations
    };
    await dataService.saveCleaningChecklist(updated);
  };

  const handleAddChecklistActivity = async () => {
    if (!newChecklistRoomName.trim()) {
      alert("Por favor, informe o nome do ambiente ou a tarefa de conservação.");
      return;
    }
    const newItem: CleaningChecklist = {
      id: "cl_" + Date.now().toString(36),
      roomName: newChecklistRoomName.trim(),
      status: newChecklistStatus,
      responsibleName: newChecklistResponsibleName.trim() || currentUser?.name || 'Voluntário da Casa',
      lastCleanedAt: Date.now(),
      observations: newChecklistObservations.trim()
    };

    await dataService.saveCleaningChecklist(newItem);

    // Cleanup state
    setNewChecklistRoomName('');
    setNewChecklistStatus('LIMPO');
    setNewChecklistResponsibleName('');
    setNewChecklistObservations('');
  };

  const handleDeleteChecklistActivity = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este ambiente/atividade do checklist?")) {
      await dataService.deleteCleaningChecklistActivity(id);
    }
  };

  const waitingQueue = queueItems.filter(i => i.status === 'WAITING');
  const todayServices = queueItems.filter(i => {
    const today = new Date().setHours(0,0,0,0);
    return i.arrivalDate >= today;
  });

  const totalPublicToday = (publicAttendance?.doutrinariaCount || 0) + (publicAttendance?.passeAvulsoCount || 0) + (publicAttendance?.fraternoAvulsoCount || 0);

  const enrichedRecentQueue = queueItems
    .filter(item => item.status === 'WAITING' || item.status === 'IN_PROGRESS')
    .slice(0, 6)
    .map(item => {
      const p = participants.find(p => p.id === item.participantId);
      const participantName = item.participantName || p?.name || (item.isAnonymous ? 'Frequentador Avulso' : 'Frequentador');
      const s = sectors.find(sec => sec.id === item.sectorId);
      const sectorName = s?.name || (item.sectorType === 'PASSE' ? 'Passe e Fluidoterapia' : item.sectorType === 'DOUTRINARIA' ? 'Doutrinária' : 'Atendimento Fraterno');
      return {
        ...item,
        participantName,
        sectorName
      };
    });

  const menuActions = [
    {
      title: 'Cadastrar Atendido',
      desc: 'Novo participante ou família no sistema',
      icon: UserPlus,
      color: 'bg-indigo-600',
      action: () => navigate('/atendidos?action=new')
    },
    {
      title: 'Check-in por QR Code',
      desc: 'Leitura rápida de crachá na chegada',
      icon: QrCode,
      color: 'bg-purple-600',
      action: () => navigate('/atendidos?scan=true')
    },
    {
      title: 'Lista de Atendidos',
      desc: 'Buscar e gerenciar prontuários existentes',
      icon: Users,
      color: 'bg-emerald-600',
      action: () => navigate('/atendidos')
    },
    {
      title: 'Fila de Espera',
      desc: 'Painel operacional de chamada de senhas',
      icon: ListOrdered,
      color: 'bg-amber-500',
      action: () => navigate('/fila')
    },
    {
      title: 'Painel de Senhas / TV',
      desc: 'Projeção pública da fila e avisos',
      icon: Tv,
      color: 'bg-cyan-600',
      action: () => navigate('/mascote')
    },
    {
      title: 'Triagem Fraterna',
      desc: 'Atendimento e escuta fraterna inicial',
      icon: HeartHandshake,
      color: 'bg-rose-500',
      action: () => navigate('/atendimentos')
    }
  ];

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Header with Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer shrink-0"
            title="Voltar ao Início"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.25em] mb-1">
              <LayoutDashboard size={14} />
              <span>Recepção e Acolhimento</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Área da Recepção</h1>
            <p className="text-gray-500 font-medium text-sm">Controle de acolhimento, entrada na fila de espera, visitantes e zelo da casa.</p>
          </div>
        </div>

        {/* Prominent Quick Registration & Check-in Actions at the Top */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/atendidos?action=new')}
            className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            id="reception-btn-register-top"
          >
            <UserPlus size={18} />
            <span>+ Cadastrar Nova Pessoa</span>
          </button>

          <button
            onClick={() => navigate('/atendidos?scan=true')}
            className="h-11 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
            id="reception-btn-qrcode-top"
          >
            <QrCode size={17} className="text-purple-600" />
            <span>Check-in QR Code</span>
          </button>

          <button
            onClick={() => navigate('/atendidos')}
            className="h-11 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
            id="reception-btn-participants-top"
          >
            <Users size={17} className="text-gray-500" />
            <span>Ver Cadastrados ({participants.length})</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="flex border-b border-gray-100 gap-6">
        <button
          onClick={() => setActiveSubTab('ATENDIMENTOS')}
          className={cn(
            "pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer font-sans flex items-center gap-2",
            activeSubTab === 'ATENDIMENTOS'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <ListOrdered size={16} />
          <span>Filas & Acolhimento Instantâneo</span>
        </button>
        <button
          onClick={() => setActiveSubTab('LIMPEZA')}
          className={cn(
            "pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer font-sans flex items-center gap-2",
            activeSubTab === 'LIMPEZA'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <CheckCircle2 size={16} />
          <span>Visitantes & Zelo de Ambientes</span>
        </button>
      </div>

      {activeSubTab === 'ATENDIMENTOS' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              label="Total Cadastrados" 
              value={participants.length} 
              icon={Users} 
              trend="Ativos no sistema"
              color="indigo" 
            />
            <StatCard 
              label="Aguardando na Fila" 
              value={waitingQueue.length} 
              icon={Clock} 
              trend="Aguardando chamada"
              color="amber" 
              highlight={waitingQueue.length > 0}
            />
            <StatCard 
              label="Atendidos Hoje" 
              value={todayServices.length} 
              icon={ClipboardCheck} 
              trend="Fluxo acumulado"
              color="emerald" 
            />
            <StatCard 
              label="Presenças Avulsas" 
              value={totalPublicToday} 
              icon={Zap} 
              trend="Doutrinária & Passe"
              color="purple" 
            />
          </div>

          {/* Barra de Acolhimento e Busca Rápida na Recepção */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-7 md:p-8 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-2">
                  <Search size={14} />
                  Acolhimento Rápido / Entrada na Fila
                </span>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight mt-0.5">Buscar Assistido por Nome ou CPF</h2>
                <p className="text-xs text-indigo-200/90 font-medium mt-0.5">Localize o cadastro do assistido que acabou de chegar e insira-o na fila em 1 clique.</p>
              </div>

              {queueSuccessMsg && (
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/80 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>{queueSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome, CPF ou telefone do assistido..."
                  className="w-full pl-11 pr-10 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-white cursor-pointer p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={() => navigate('/atendidos?action=new')}
                className="h-12 px-5 bg-white hover:bg-indigo-50 text-indigo-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <UserPlus size={16} className="text-indigo-600" />
                <span>+ Novo Cadastro</span>
              </button>
            </div>

            {/* Matching Results List */}
            {filteredParticipants.length > 0 && (
              <div className="bg-white rounded-2xl p-3 shadow-2xl text-gray-900 space-y-2 animate-in fade-in duration-200 border border-indigo-100 max-h-[280px] overflow-y-auto">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2">Assistidos Encontrados ({filteredParticipants.length}):</p>
                {filteredParticipants.map(p => (
                  <div 
                    key={p.id}
                    className="p-3 bg-gray-50 hover:bg-indigo-50/60 rounded-xl flex items-center justify-between gap-3 transition-all border border-gray-100"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{p.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        CPF: {p.cpf || 'Não informado'} • Tel: {p.phone || 'Não informado'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenQueueModal(p)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Informa Chegada / Fila</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && filteredParticipants.length === 0 && (
              <div className="bg-white/10 rounded-2xl p-4 text-center text-indigo-100 text-xs font-medium border border-white/10 flex items-center justify-between">
                <span>Nenhum assistido encontrado com "{searchQuery}".</span>
                <button
                  onClick={() => navigate('/atendidos?action=new')}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  + Cadastrar Novo
                </button>
              </div>
            )}
          </div>

          {/* Ticket Issued Callout Banner */}
          {lastIssuedTicket && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-950/20 border border-emerald-400/40 relative overflow-hidden space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  {/* Ticket number badge - with whitespace-nowrap and flexible padding so it never wraps text/numbers */}
                  <div className="min-w-[84px] px-3.5 h-14 sm:h-16 rounded-2xl bg-white text-emerald-950 font-mono font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shrink-0 tracking-tight whitespace-nowrap border-2 border-emerald-200">
                    {lastIssuedTicket.ticketNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-emerald-900/60 rounded-md text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-emerald-500/40 whitespace-nowrap">
                        Senha Emitida
                      </span>
                      <span className="text-xs text-emerald-100 font-bold truncate">
                        {lastIssuedTicket.sector}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white mt-1 leading-snug truncate" title={lastIssuedTicket.name}>
                      {lastIssuedTicket.name}
                    </h3>
                    <p className="text-xs text-emerald-100/90 font-medium line-clamp-1">Entrada registrada na fila com sucesso. Chame no painel eletrônico.</p>
                  </div>
                </div>

                <button
                  onClick={() => setLastIssuedTicket(null)}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800/60 transition-all cursor-pointer shrink-0"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 pt-1 border-t border-emerald-500/30">
                <button
                  onClick={() => handlePrintQuickTicket(lastIssuedTicket)}
                  className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Printer size={16} className="text-emerald-700" />
                  <span>Imprimir Senha</span>
                </button>
                <button
                  onClick={() => navigate('/fila')}
                  className="flex-1 sm:flex-none h-10 px-4 bg-emerald-900/70 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <ListOrdered size={16} />
                  <span>Ver Fila</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Frequentadores Sem Cadastro & Entrada Expressa (Passe e Doutrinária) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                  <Sparkles size={16} />
                  <span>Acolhimento Rápido / Sem Cadastro Prévio</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight mt-0.5">
                  Frequentadores Avulsos (Doutrinária e Passe)
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Emita senhas de Passe ou contabilize presenças na Doutrinária sem obrigar o frequentador a realizar cadastro completo.
                </p>
              </div>

              {/* Counters Pill Summary */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 flex items-center gap-1.5 text-xs font-bold">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>Doutrinária:</span>
                  <span className="font-black text-indigo-700">{publicAttendance?.doutrinariaCount || 0}</span>
                </div>
                <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 flex items-center gap-1.5 text-xs font-bold">
                  <Zap size={14} className="text-amber-600" />
                  <span>Passes:</span>
                  <span className="font-black text-amber-700">{publicAttendance?.passeAvulsoCount || 0}</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 flex items-center gap-1.5 text-xs font-bold">
                  <Users size={14} className="text-emerald-600" />
                  <span>Total Presentes:</span>
                  <span className="font-black text-emerald-700">{totalPublicToday}</span>
                </div>
              </div>
            </div>

            {/* Direct Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Action 1: Passe Geral 1-Click */}
              <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/40 border border-indigo-100 flex flex-col justify-between min-h-[200px] shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Zap size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Passe Geral (1-Clique)</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Gera senha sequencial <span className="font-mono font-bold text-indigo-600">P-xxx</span> e coloca na fila do Passe.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickPasse(false)}
                  disabled={isSubmittingExpress}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-4 active:scale-95"
                >
                  <Ticket size={14} />
                  <span>Emitir Senha Passe</span>
                </button>
              </motion.div>

              {/* Action 2: Passe Preferencial 1-Click */}
              <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/40 border border-amber-200/80 flex flex-col justify-between min-h-[200px] shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Star size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Passe Preferencial</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Idosos, gestantes e PcD. Gera senha prioritária na chamada.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickPasse(true)}
                  disabled={isSubmittingExpress}
                  className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-4 active:scale-95"
                >
                  <Star size={14} />
                  <span>Senha Preferencial</span>
                </button>
              </motion.div>

              {/* Action 3: Doutrinária Presença */}
              <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-100 flex flex-col justify-between min-h-[200px] shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <BookOpen size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Palestra Doutrinária</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Contabiliza frequentadores presentes no auditório para a palestra.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <button
                    onClick={() => handleQuickDoutrinaria(1)}
                    disabled={isSubmittingExpress}
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>+1 Presença</span>
                  </button>
                  <button
                    onClick={() => handleQuickDoutrinaria(5)}
                    disabled={isSubmittingExpress}
                    className="h-10 px-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Adicionar 5 presenças de uma vez"
                  >
                    +5
                  </button>
                </div>
              </motion.div>

              {/* Action 4: Entrada Expressa por Nome */}
              <motion.div
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-fuchsia-50/40 border border-purple-100 flex flex-col justify-between min-h-[200px] shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Entrada Rápida</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Apenas primeiro nome ou apelido para chamada humanizada no painel.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExpressName('');
                    setExpressNotes('');
                    setExpressSectorType('PASSE');
                    setExpressPriority(false);
                    setShowExpressModal(true);
                  }}
                  className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-1.5 cursor-pointer mt-4 active:scale-95"
                >
                  <UserPlus size={14} />
                  <span>Check-in Expresso</span>
                </button>
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Actions */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
                <LayoutDashboard size={20} className="text-indigo-600" />
                Painel de Operações Rápidas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {menuActions.map((item, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -3 }}
                    onClick={item.action}
                    className="flex flex-col justify-between min-h-[145px] p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`p-3 ${item.color} rounded-2xl text-white shadow-md`}>
                        <item.icon size={20} />
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-xs">{item.title}</h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-snug line-clamp-2">{item.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recent Queue Activity */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
                <Clock size={20} className="text-amber-600" />
                Fila Recente
              </h2>
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
                {enrichedRecentQueue.length > 0 ? (
                  <div className="space-y-2.5">
                    {enrichedRecentQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 hover:bg-indigo-50/50 transition-colors border border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 border",
                            item.status === 'IN_PROGRESS' 
                              ? "bg-indigo-600 text-white border-indigo-700"
                              : "bg-white text-indigo-600 border-indigo-200"
                          )}>
                            {item.ticketNumber ? item.ticketNumber.slice(0, 4) : `#${item.id.slice(0, 2)}`}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 leading-tight truncate">{item.participantName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{item.sectorName}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shrink-0",
                          item.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800',
                          item.priority && "ring-1 ring-amber-400 bg-amber-200/60"
                        )}>
                          {item.priority ? '★ Preferencial' : item.status === 'IN_PROGRESS' ? 'Em Curso' : 'Espera'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-medium">Nenhum atendimento ativo no momento.</p>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/fila')}
                  className="w-full py-3 text-xs font-black text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer uppercase tracking-wider border border-indigo-100 flex items-center justify-center gap-2"
                >
                  <ListOrdered size={14} />
                  <span>Ver Fila Completa ({waitingQueue.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Stats - Recepção e Limpeza */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              label="Visitas Ativas Hoje" 
              value={visitorLogs.filter(v => !v.checkOutTime).length} 
              icon={Users} 
              trend="Irmãos em trânsito"
              color="indigo" 
            />
            <StatCard 
              label="Ambientes Conservados" 
              value={cleaningChecklists.filter(cl => cl.status === 'LIMPO').length} 
              icon={CheckCircle2} 
              trend="Em perfeitas condições"
              color="emerald" 
            />
            <StatCard 
              label="Alertas / Pendentes" 
              value={cleaningChecklists.filter(cl => cl.status !== 'LIMPO').length} 
              icon={AlertTriangle} 
              trend="Necessitam atenção"
              color="amber" 
              highlight={cleaningChecklists.some(cl => cl.status !== 'LIMPO')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Visitor Registry */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-50 pb-6 text-left">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Users className="text-indigo-600" size={22} />
                    Controle de Visitantes e Acolhimento
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 font-sans">Registro de Acolhimento e Acesso ao Prédio</p>
                </div>

                {/* Registry Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-sans">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Irmão / Visitante</label>
                    <input
                      value={newVisitorName}
                      onChange={(e) => setNewVisitorName(e.target.value)}
                      placeholder="Ex: Amanda Ferreira Silva"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Telefone</label>
                    <input
                      value={newVisitorPhone}
                      onChange={(e) => setNewVisitorPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Finalidade do Acesso / Encaminhamento</label>
                    <input
                      value={newVisitorPurpose}
                      onChange={(e) => setNewVisitorPurpose(e.target.value)}
                      placeholder="Ex: Assistência Sopa / Atendimento Fraterno"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRegisterVisitor}
                    className="sm:col-span-3 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer h-11 shadow-sm active:scale-[0.99]"
                  >
                    Registrar Entrada de Visitante
                  </button>
                </div>

                {/* Visitors list */}
                <div className="space-y-3 pt-4 border-t border-gray-50 text-left font-sans">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Fluxo de Visitantes Sincronizado ao Vivo</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {visitorLogs.map((vl) => (
                      <div key={vl.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                        <div className="flex-1">
                          <h5 className="font-extrabold text-sm text-gray-950 leading-none">{vl.name}</h5>
                          <span className="inline-block text-[9px] text-[#78716c] font-black uppercase tracking-wider mt-1">{vl.purpose} • {vl.phone}</span>
                          <p className="text-[9px] text-gray-400 mt-1">
                            Chegada: {new Date(vl.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {vl.checkOutTime && ` • Saída: ${new Date(vl.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>

                        {!vl.checkOutTime ? (
                          <button
                            onClick={() => handleCheckOutVisitor(vl.id)}
                            className="p-2 sm:p-2.5 bg-gray-950 hover:bg-rose-600 hover:scale-105 transition-all text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer w-full sm:w-auto text-center whitespace-nowrap shadow-sm"
                          >
                            Registrar Saída (Check-out)
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest w-full sm:w-auto text-center">
                            Saída Concluída
                          </span>
                        )}
                      </div>
                    ))}
                    {visitorLogs.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">Nenhum visitante registrado hoje.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Checklists */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-50 pb-6 text-left">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={22} />
                    Zelo de Ambientes (Limpeza e Conservação)
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 font-sans">Checklists e Ocorrências Prediais</p>
                </div>

                {/* Form to Launch New Cleaning Checklist or Area */}
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 text-left space-y-4 font-sans">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic flex items-center gap-1.5 select-none text-[11px]">
                    <Plus size={14} className="text-indigo-600" />
                    Lançar Nova Atividade ou Ambiente
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Ambiente ou Tarefa</label>
                      <input
                        value={newChecklistRoomName}
                        onChange={(e) => setNewChecklistRoomName(e.target.value)}
                        placeholder="Ex: Refeitório Administrativo, Recepção, Banheiros"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Status de Conservação</label>
                      <select
                        value={newChecklistStatus}
                        onChange={(e) => setNewChecklistStatus(e.target.value as any)}
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-1.5 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="LIMPO">🟢 LIMPO / CONSERVADO</option>
                        <option value="ATENCAO">🟡 ATENÇÃO / MENOR</option>
                        <option value="PENDENTE">🔴 URGENTE / PENDENTE</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Responsável Executor</label>
                      <input
                        value={newChecklistResponsibleName}
                        onChange={(e) => setNewChecklistResponsibleName(e.target.value)}
                        placeholder="Ex: Maria José (Voluntária)"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Observações e Detalhes</label>
                      <input
                        value={newChecklistObservations}
                        onChange={(e) => setNewChecklistObservations(e.target.value)}
                        placeholder="Ex: Sem observações relevantes"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddChecklistActivity}
                      className="sm:col-span-6 w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      Registrar Nova Atividade / Ambiente
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-left font-sans">
                  {cleaningChecklists.map((cl) => (
                    <div key={cl.id} className="p-5 bg-gray-50 border border-gray-150 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            cl.status === 'LIMPO' ? "bg-emerald-500" : cl.status === 'ATENCAO' ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"
                          )} />
                          <h4 className="font-extrabold text-sm text-gray-950 leading-none">{cl.roomName}</h4>
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                            cl.status === 'LIMPO' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            cl.status === 'ATENCAO' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-red-50 text-red-700 border border-red-200"
                          )}>
                            {cl.status}
                          </span>
                        </div>
                        {cl.observations && (
                          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-150 px-3 py-1.5 rounded-xl font-medium mt-2 leading-relaxed font-sans">
                            ⚠️ Observação: {cl.observations}
                          </p>
                        )}
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider !mt-2">
                          Última Inspeção: <strong>{cl.responsibleName}</strong> • {new Date(cl.lastCleanedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
                        {cl.status !== 'LIMPO' ? (
                          <button
                            onClick={() => handleUpdateChecklistStatus(cl.id, 'LIMPO', '')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Marcar como Limpo
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const obs = prompt("Informe a ocorrência ou falta de materiais observada na sala:");
                              if (obs !== null) {
                                handleUpdateChecklistStatus(cl.id, 'ATENCAO', obs);
                              }
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer font-sans"
                          >
                            Sinalizar Alerta
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteChecklistActivity(cl.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-500 rounded-xl transition-all cursor-pointer"
                          title="Excluir Atividade / Ambiente"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cleaningChecklists.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum ambiente no checklist de zelo.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog de Inclusão Direta na Fila */}
      {selectedParticipantForQueue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Confirmação de Acolhimento</span>
                <h3 className="text-xl font-black text-gray-900 mt-0.5">{selectedParticipantForQueue.name}</h3>
                <p className="text-xs text-gray-500 font-medium">CPF: {selectedParticipantForQueue.cpf || 'Não informado'}</p>
              </div>
              <button 
                onClick={() => setSelectedParticipantForQueue(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 block mb-1.5">Encaminhar para qual Setor?</label>
                <select
                  value={queueSectorId}
                  onChange={(e) => setQueueSectorId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type || 'ATENDIMENTO'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <input 
                  type="checkbox"
                  id="prefCheck"
                  checked={isPreferential}
                  onChange={(e) => setIsPreferential(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="prefCheck" className="text-xs font-bold text-amber-900 cursor-pointer select-none">
                  Atendimento Preferencial (Idosos, Gestantes, PWD, Colo)
                </label>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-600 block mb-1.5">Observação na Fila (Opcional)</label>
                <input
                  type="text"
                  value={queueNotes}
                  onChange={(e) => setQueueNotes(e.target.value)}
                  placeholder="Ex: Acompanhado pelo neto, primeira consulta"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedParticipantForQueue(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingQueue}
                onClick={handleConfirmAddToQueue}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingQueue ? 'Inserindo...' : 'Confirmar Fila'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Express / Anonymous Check-in Modal */}
      {showExpressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-gray-100"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Entrada Rápida / Frequentador Avulso</h3>
                  <p className="text-xs text-gray-500 font-medium">Sem necessidade de cadastro prévio</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpressModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1.5">
                  Destino do Atendimento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpressSectorType('PASSE')}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer",
                      expressSectorType === 'PASSE'
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Zap size={18} className={expressSectorType === 'PASSE' ? "text-indigo-600" : "text-gray-400"} />
                    <span className="text-xs font-bold">Passe / Fluidos</span>
                    <span className="text-[9px] text-gray-400 font-medium">Senha P-xxx</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpressSectorType('DOUTRINARIA')}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer",
                      expressSectorType === 'DOUTRINARIA'
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <BookOpen size={18} className={expressSectorType === 'DOUTRINARIA' ? "text-indigo-600" : "text-gray-400"} />
                    <span className="text-xs font-bold">Doutrinária</span>
                    <span className="text-[9px] text-gray-400 font-medium">Auditório</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpressSectorType('FRATERNO')}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer",
                      expressSectorType === 'FRATERNO'
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Heart size={18} className={expressSectorType === 'FRATERNO' ? "text-indigo-600" : "text-gray-400"} />
                    <span className="text-xs font-bold">Fraterno</span>
                    <span className="text-[9px] text-gray-400 font-medium">Acolhimento</span>
                  </button>
                </div>
              </div>

              {/* Name (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Primeiro Nome ou Apelido (Opcional)
                  </label>
                  <span className="text-[10px] text-gray-400">Em branco = Visitante Anônimo</span>
                </div>
                <input
                  type="text"
                  value={expressName}
                  onChange={(e) => setExpressName(e.target.value)}
                  placeholder="Ex: Maria, João ou deixe vazio"
                  className="w-full p-3.5 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs font-semibold outline-none transition-all"
                />
              </div>

              {/* Preferential checkbox */}
              <label className="flex items-center gap-2.5 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expressPriority}
                  onChange={(e) => setExpressPriority(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Star size={14} className="fill-amber-400 text-amber-600" />
                  Atendimento Preferencial (Idosos, Gestantes, PcD)
                </span>
              </label>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={expressNotes}
                  onChange={(e) => setExpressNotes(e.target.value)}
                  placeholder="Ex: Apenas fluidoterapia hoje"
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExpressModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExpressSubmit}
                disabled={isSubmittingExpress}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{isSubmittingExpress ? 'Emitindo...' : 'Emitir Senha / Entrar na Fila'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color, highlight }: any) {
  const colorMap: Record<string, { iconBg: string }> = {
    indigo: { iconBg: 'bg-indigo-600 text-white' },
    amber: { iconBg: 'bg-amber-500 text-white' },
    emerald: { iconBg: 'bg-emerald-600 text-white' },
    purple: { iconBg: 'bg-purple-600 text-white' },
  };
  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group font-sans transition-all flex flex-col justify-between min-h-[125px]",
        highlight && "ring-2 ring-amber-400 border-amber-200 shadow-amber-100/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", currentTheme.iconBg)}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 truncate max-w-[130px]">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">{value}</h3>
      </div>
    </motion.div>
  );
}
