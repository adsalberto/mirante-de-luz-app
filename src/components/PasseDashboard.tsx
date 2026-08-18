import React, { useState, useEffect } from 'react';
import { 
  PasseAtendimento, 
  PassePassista, 
  PasseSala, 
  PasseEscala, 
  PasseFluidoterapia 
} from '../types';
import { dataService } from '../services/dataService';
import { 
  Sparkles, 
  Droplets, 
  Users, 
  DoorOpen, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  Tv, 
  FileText, 
  Search, 
  ShieldCheck, 
  HeartHandshake, 
  AlertCircle, 
  Trash2, 
  UserCheck, 
  Send, 
  X,
  User,
  Activity,
  Heart,
  ChevronRight
} from 'lucide-react';

interface PasseDashboardProps {
  userRole?: string;
  userName?: string;
}

export const PasseDashboard: React.FC<PasseDashboardProps> = ({ userRole, userName }) => {
  const [activeTab, setActiveTab] = useState<'atendimentos' | 'passistas' | 'fluidoterapia' | 'salas' | 'escalas'>('atendimentos');
  
  // Data states from Firestore
  const [atendimentos, setAtendimentos] = useState<PasseAtendimento[]>([]);
  const [passistas, setPassistas] = useState<PassePassista[]>([]);
  const [salas, setSalas] = useState<PasseSala[]>([]);
  const [escalas, setEscalas] = useState<PasseEscala[]>([]);
  const [fluidoterapias, setFluidoterapias] = useState<PasseFluidoterapia[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showNewAtendimentoModal, setShowNewAtendimentoModal] = useState<boolean>(false);
  const [showNewPassistaModal, setShowNewPassistaModal] = useState<boolean>(false);
  const [showNewSalaModal, setShowNewSalaModal] = useState<boolean>(false);
  const [showNewFluidoterapiaModal, setShowNewFluidoterapiaModal] = useState<boolean>(false);
  const [showNewEscalaModal, setShowNewEscalaModal] = useState<boolean>(false);
  const [showTvPanel, setShowTvPanel] = useState<boolean>(false);

  // Called item for TV panel
  const [currentCalled, setCurrentCalled] = useState<PasseAtendimento | null>(null);

  // Form states
  const [formAtendimento, setFormAtendimento] = useState<Partial<PasseAtendimento>>({
    patientName: '',
    typePasse: 'Passe Geral',
    hasFraternalReferral: false,
    referralNotes: '',
    roomName: 'Sala de Passe Coletivo 1',
    observations: ''
  });

  const [formPassista, setFormPassista] = useState<Partial<PassePassista>>({
    name: '',
    email: '',
    phone: '',
    status: 'Ativo',
    shift: 'Quarta 19h30',
    coursesCompleted: ['Passe e Fluidoterapia (FEB)'],
    harmonizationDoneToday: true
  });

  const [formSala, setFormSala] = useState<Partial<PasseSala>>({
    name: 'Sala de Passe Coletivo 1',
    type: 'Sala de Passe Coletivo',
    capacity: 6,
    leaderName: '',
    activeStatus: 'Disponível',
    locationRoom: 'Térreo - Bloco A'
  });

  const [formFluidoterapia, setFormFluidoterapia] = useState<Partial<PasseFluidoterapia>>({
    patientName: '',
    bottleVolumeLiters: 1.0,
    prescriptionDays: 7,
    posologyNotes: 'Tomar 1 cálice (50ml) ao acordar e ao deitar, antecedido por prece e elevação de pensamento.',
    status: 'Aguardando Fluidificação',
    responsiblePassista: ''
  });

  const [formEscala, setFormEscala] = useState<Partial<PasseEscala>>({
    date: new Date().toISOString().split('T')[0],
    timeShift: 'Quarta-feira - 19h30',
    teamName: 'Equipe de Passe Emmanuel',
    coordinatorName: '',
    passistasList: [],
    notes: ''
  });

  // Load Firestore data subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubAtend = dataService.subscribePasseAtendimentos((data) => {
      setAtendimentos(data);
    });

    const unsubPassistas = dataService.subscribePassePassistas((data) => {
      setPassistas(data);
    });

    const unsubSalas = dataService.subscribePasseSalas((data) => {
      setSalas(data);
    });

    const unsubEscalas = dataService.subscribePasseEscalas((data) => {
      setEscalas(data);
    });

    const unsubFluido = dataService.subscribePasseFluidoterapia((data) => {
      setFluidoterapias(data);
      setLoading(false);
    });

    return () => {
      unsubAtend();
      unsubPassistas();
      unsubSalas();
      unsubEscalas();
      unsubFluido();
    };
  }, []);

  // Seed default rooms or passistas if completely empty
  useEffect(() => {
    if (!loading && salas.length === 0) {
      const defaultSalas: PasseSala[] = [
        { id: 'sala-1', name: 'Sala de Passe Coletivo 1', type: 'Sala de Passe Coletivo', capacity: 8, leaderName: 'Irmão Bezerra', activeStatus: 'Disponível', locationRoom: 'Térreo - Ala Leste' },
        { id: 'sala-2', name: 'Cabine de Passe Magnético 2', type: 'Cabine de Passe Individual', capacity: 2, leaderName: 'Eurípedes Barsanulfo', activeStatus: 'Disponível', locationRoom: 'Térreo - Ala Oeste' },
        { id: 'sala-3', name: 'Câmara Fluídica Especial', type: 'Câmara Fluídica', capacity: 4, leaderName: 'Dr. André Luiz', activeStatus: 'Disponível', locationRoom: '1º Andar - Sala 102' }
      ];
      defaultSalas.forEach(s => dataService.savePasseSala(s));
    }

    if (!loading && passistas.length === 0) {
      const defaultPassistas: PassePassista[] = [
        { id: 'pass-1', name: 'Ana Maria Souza', email: 'ana@espiritismo.org', phone: '(11) 98765-4321', status: 'Ativo', roomAssigned: 'Sala de Passe Coletivo 1', shift: 'Quarta 19h30', coursesCompleted: ['Passe e Fluidoterapia (FEB)', 'Atendimento Fraterno'], harmonizationDoneToday: true },
        { id: 'pass-2', name: 'Carlos Eduardo Lima', email: 'carlos@espiritismo.org', phone: '(11) 91234-5678', status: 'Ativo', roomAssigned: 'Cabine de Passe Magnético 2', shift: 'Sábado 16h00', coursesCompleted: ['Passe e Fluidoterapia (FEB)', 'Estudo das Obra Básicas'], harmonizationDoneToday: true },
        { id: 'pass-3', name: 'Mariana Oliveira', email: 'mariana@espiritismo.org', phone: '(11) 99887-6655', status: 'Em Descanso', roomAssigned: 'Sala de Passe Coletivo 1', shift: 'Domingo 09h00', coursesCompleted: ['Passe e Fluidoterapia (FEB)'], harmonizationDoneToday: false }
      ];
      defaultPassistas.forEach(p => dataService.savePassePassista(p));
    }
  }, [loading, salas.length, passistas.length]);

  // Handlers for Atendimento
  const handleCreateAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAtendimento.patientName?.trim()) return;

    const ticketNumber = `P-${Math.floor(100 + Math.random() * 900)}`;
    const newAtendimento: PasseAtendimento = {
      id: `atend-${Date.now()}`,
      patientName: formAtendimento.patientName.trim(),
      codeOrTicket: ticketNumber,
      typePasse: (formAtendimento.typePasse as any) || 'Passe Geral',
      status: 'Aguardando',
      roomId: formAtendimento.roomId || 'sala-1',
      roomName: formAtendimento.roomName || 'Sala de Passe Coletivo 1',
      referralNotes: formAtendimento.referralNotes || '',
      hasFraternalReferral: !!formAtendimento.hasFraternalReferral,
      createdAt: Date.now(),
      observations: formAtendimento.observations || ''
    };

    await dataService.savePasseAtendimento(newAtendimento);
    setShowNewAtendimentoModal(false);
    setFormAtendimento({
      patientName: '',
      typePasse: 'Passe Geral',
      hasFraternalReferral: false,
      referralNotes: '',
      roomName: 'Sala de Passe Coletivo 1',
      observations: ''
    });
  };

  const handleUpdateStatus = async (item: PasseAtendimento, newStatus: PasseAtendimento['status']) => {
    const updated: PasseAtendimento = {
      ...item,
      status: newStatus,
      attendedAt: newStatus === 'Concluído' ? Date.now() : item.attendedAt
    };
    await dataService.savePasseAtendimento(updated);
  };

  const handleCallOnTv = (item: PasseAtendimento) => {
    setCurrentCalled(item);
    setShowTvPanel(true);
    handleUpdateStatus(item, 'Em Atendimento');

    // Voice announcement using Web Speech API
    if ('speechSynthesis' in window) {
      try {
        const text = `Atenção. Senha ${item.codeOrTicket || item.patientName}, dirigir-se para a ${item.roomName || 'Sala de Passe'}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis fail', e);
      }
    }
  };

  const handleDeleteAtendimento = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro da fila?')) {
      await dataService.deletePasseAtendimento(id);
    }
  };

  // Handlers for Passista
  const handleCreatePassista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPassista.name?.trim()) return;

    const newPassista: PassePassista = {
      id: `pass-${Date.now()}`,
      name: formPassista.name.trim(),
      email: formPassista.email || '',
      phone: formPassista.phone || '',
      status: (formPassista.status as any) || 'Ativo',
      roomAssigned: formPassista.roomAssigned || 'Sala de Passe Coletivo 1',
      shift: formPassista.shift || 'Quarta 19h30',
      coursesCompleted: formPassista.coursesCompleted || ['Passe e Fluidoterapia (FEB)'],
      harmonizationDoneToday: !!formPassista.harmonizationDoneToday,
      notes: formPassista.notes || ''
    };

    await dataService.savePassePassista(newPassista);
    setShowNewPassistaModal(false);
    setFormPassista({
      name: '',
      email: '',
      phone: '',
      status: 'Ativo',
      shift: 'Quarta 19h30',
      coursesCompleted: ['Passe e Fluidoterapia (FEB)'],
      harmonizationDoneToday: true
    });
  };

  const toggleHarmonization = async (p: PassePassista) => {
    const updated: PassePassista = {
      ...p,
      harmonizationDoneToday: !p.harmonizationDoneToday
    };
    await dataService.savePassePassista(updated);
  };

  // Handlers for Fluidoterapia
  const handleCreateFluidoterapia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFluidoterapia.patientName?.trim()) return;

    const newFluido: PasseFluidoterapia = {
      id: `fluido-${Date.now()}`,
      patientName: formFluidoterapia.patientName.trim(),
      bottleVolumeLiters: Number(formFluidoterapia.bottleVolumeLiters) || 1.0,
      prescriptionDays: Number(formFluidoterapia.prescriptionDays) || 7,
      posologyNotes: formFluidoterapia.posologyNotes || 'Tomar 1 cálice ao acordar e ao deitar.',
      status: (formFluidoterapia.status as any) || 'Aguardando Fluidificação',
      responsiblePassista: formFluidoterapia.responsiblePassista || '',
      createdAt: Date.now()
    };

    await dataService.savePasseFluidoterapia(newFluido);
    setShowNewFluidoterapiaModal(false);
    setFormFluidoterapia({
      patientName: '',
      bottleVolumeLiters: 1.0,
      prescriptionDays: 7,
      posologyNotes: 'Tomar 1 cálice (50ml) ao acordar e ao deitar, antecedido por prece e elevação de pensamento.',
      status: 'Aguardando Fluidificação',
      responsiblePassista: ''
    });
  };

  const handleUpdateFluidoStatus = async (item: PasseFluidoterapia, status: PasseFluidoterapia['status']) => {
    const updated: PasseFluidoterapia = {
      ...item,
      status,
      preparedAt: status === 'Fluidificada & Pronta' ? Date.now() : item.preparedAt
    };
    await dataService.savePasseFluidoterapia(updated);
  };

  // Handlers for Sala
  const handleCreateSala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSala.name?.trim()) return;

    const newSala: PasseSala = {
      id: `sala-${Date.now()}`,
      name: formSala.name.trim(),
      type: (formSala.type as any) || 'Sala de Passe Coletivo',
      capacity: Number(formSala.capacity) || 6,
      leaderName: formSala.leaderName || 'Coordenador',
      activeStatus: (formSala.activeStatus as any) || 'Disponível',
      locationRoom: formSala.locationRoom || 'Térreo'
    };

    await dataService.savePasseSala(newSala);
    setShowNewSalaModal(false);
  };

  // Handlers for Escalas
  const handleCreateEscala = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEscala.teamName?.trim()) return;

    const newEscala: PasseEscala = {
      id: `escala-${Date.now()}`,
      date: formEscala.date || new Date().toISOString().split('T')[0],
      timeShift: formEscala.timeShift || 'Quarta 19h30',
      teamName: formEscala.teamName.trim(),
      coordinatorName: formEscala.coordinatorName || '',
      passistasList: formEscala.passistasList || [],
      notes: formEscala.notes || ''
    };

    await dataService.savePasseEscala(newEscala);
    setShowNewEscalaModal(false);
  };

  // Stats Counters
  const waitingCount = atendimentos.filter(a => a.status === 'Aguardando').length;
  const inServiceCount = atendimentos.filter(a => a.status === 'Em Atendimento').length;
  const completedTodayCount = atendimentos.filter(a => a.status === 'Concluído').length;
  const activePassistasCount = passistas.filter(p => p.status === 'Ativo').length;
  const fluidosProntosCount = fluidoterapias.filter(f => f.status === 'Fluidificada & Pronta').length;

  // Filtered atendimentos
  const filteredAtendimentos = atendimentos.filter(a => 
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.codeOrTicket && a.codeOrTicket.toLowerCase().includes(searchQuery.toLowerCase())) ||
    a.typePasse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 bg-emerald-500/20 backdrop-blur-md rounded-xl text-emerald-200 border border-emerald-400/30">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-serif">
                  Passe & Fluidoterapia Espiritual
                </h1>
                <p className="text-emerald-100 text-sm">
                  Transmissão de energias salutares e magnetização de água segundo os princípios espíritas (FEB).
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTvPanel(true)}
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              <Tv className="w-5 h-5" />
              <span>Painel TV de Chamada</span>
            </button>

            <button
              onClick={() => setShowNewAtendimentoModal(true)}
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Atendimento</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-700/50">
          <div className="bg-emerald-950/40 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 text-xs font-medium">Aguardando Passe</span>
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{waitingCount}</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">{inServiceCount} em atendimento</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 text-xs font-medium">Concluídos Hoje</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{completedTodayCount}</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">Assistidos nutridos</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 text-xs font-medium">Passistas Ativos</span>
              <Users className="w-4 h-4 text-cyan-300" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{activePassistasCount}</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">Equipe em vibração</p>
          </div>

          <div className="bg-emerald-950/40 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 text-xs font-medium">Água Fluidificada</span>
              <Droplets className="w-4 h-4 text-teal-300" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{fluidosProntosCount}</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">Garrafas prontas</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('atendimentos')}
          className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'atendimentos'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🎟️ Fila de Atendimento</span>
          {waitingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full font-bold">
              {waitingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('passistas')}
          className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'passistas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>🕊️ Equipe de Passistas</span>
        </button>

        <button
          onClick={() => setActiveTab('fluidoterapia')}
          className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'fluidoterapia'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>💧 Fluidoterapia (Água Magnetizada)</span>
        </button>

        <button
          onClick={() => setActiveTab('salas')}
          className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'salas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>🏫 Salas de Passe & Câmaras</span>
        </button>

        <button
          onClick={() => setActiveTab('escalas')}
          className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'escalas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>📅 Escalas & Turnos</span>
        </button>
      </div>

      {/* TAB 1: ATENDIMENTOS & FILA */}
      {activeTab === 'atendimentos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou senha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacidade LGPD: Dados de triagem fraterna resguardados por sigilo.</span>
            </div>
          </div>

          {filteredAtendimentos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">Nenhum atendimento na fila no momento</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Clique no botão "Novo Atendimento" para registrar os assistidos encaminhados para o passe.
              </p>
              <button
                onClick={() => setShowNewAtendimentoModal(true)}
                className="mt-4 inline-flex items-center space-x-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Assistido</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAtendimentos.map((item) => {
                const isWaiting = item.status === 'Aguardando';
                const isInProgress = item.status === 'Em Atendimento';
                const isDone = item.status === 'Concluído';

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border transition-all ${
                      isInProgress 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : isDone 
                        ? 'border-slate-200 dark:border-slate-800 opacity-75' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          SENHA {item.codeOrTicket || 'P-00'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                          {item.patientName}
                        </h4>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          isWaiting
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : isInProgress
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-500">Tipo de Passe:</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">{item.typePasse}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-500">Sala:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.roomName}</span>
                      </div>

                      {item.hasFraternalReferral && (
                        <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg text-purple-800 dark:text-purple-300 text-[11px] flex items-start space-x-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Encaminhamento Fraterno:</span>{' '}
                            {item.referralNotes || 'Sim - Atendimento Fraterno prévio.'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {isWaiting && (
                        <button
                          onClick={() => handleCallOnTv(item)}
                          className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <Tv className="w-3.5 h-3.5" />
                          <span>Chamar no Painel</span>
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          onClick={() => handleUpdateStatus(item, 'Concluído')}
                          className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir Passe</span>
                        </button>
                      )}

                      {isDone && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Atendido com sucesso</span>
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteAtendimento(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remover da fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PASSISTAS & HARMONIZAÇÃO */}
      {activeTab === 'passistas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Equipe de Passistas & Harmonização Espiritual</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhamento da preparação fluídica e qualificações dos voluntários do Passe.
              </p>
            </div>

            <button
              onClick={() => setShowNewPassistaModal(true)}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Passista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {passistas.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                      <p className="text-xs text-slate-500">{p.shift || 'Turno Geral'}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      p.status === 'Ativo'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sala Atribuída:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{p.roomAssigned || 'Sala Geral'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Cursos & Capacitação:</span>
                    <div className="flex flex-wrap gap-1">
                      {p.coursesCompleted.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">Harmonização Hoje:</span>
                    <button
                      onClick={() => toggleHarmonization(p)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        p.harmonizationDoneToday
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{p.harmonizationDoneToday ? 'Harmonizado' : 'Pendente'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FLUIDOTERAPIA */}
      {activeTab === 'fluidoterapia' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fluidoterapia Espiritual (Água Magnetizada)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prescrição fraterna e controle das garrafas de água fluidificada para assistidos.
              </p>
            </div>

            <button
              onClick={() => setShowNewFluidoterapiaModal(true)}
              className="inline-flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Prescrição de Água</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fluidoterapias.map((f) => {
              const isWaiting = f.status === 'Aguardando Fluidificação';
              const isReady = f.status === 'Fluidificada & Pronta';

              return (
                <div
                  key={f.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border transition-all ${
                    isReady 
                      ? 'border-teal-400 bg-teal-50/20 dark:bg-teal-950/20' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 text-teal-600 dark:text-teal-400">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs font-bold">{f.bottleVolumeLiters} Litro(s)</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {f.patientName}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isWaiting
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : isReady
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold text-slate-700 dark:text-slate-300">Tratamento:</span> {f.prescriptionDays} dias</p>
                    <p className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded text-[11px] italic">
                      "{f.posologyNotes}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {isWaiting && (
                      <button
                        onClick={() => handleUpdateFluidoStatus(f, 'Fluidificada & Pronta')}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                      >
                        Marcar Fluidificada
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateFluidoStatus(f, 'Entregue')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                      >
                        Marcar Entregue
                      </button>
                    )}

                    <button
                      onClick={() => dataService.deletePasseFluidoterapia(f.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SALAS DE PASSE */}
      {activeTab === 'salas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Salas de Passe & Câmaras Fluídicas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instalações destinadas à transmissão fluídica e recolhimento espiritual.
              </p>
            </div>

            <button
              onClick={() => setShowNewSalaModal(true)}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Sala</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salas.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg">
                    <DoorOpen className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {s.activeStatus}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{s.name}</h4>
                  <p className="text-xs text-slate-500">{s.type}</p>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p><span className="font-semibold">Capacidade Coletiva:</span> {s.capacity} pessoas</p>
                  <p><span className="font-semibold">Dirigente da Sala:</span> {s.leaderName || 'A definir'}</p>
                  <p><span className="font-semibold">Localização:</span> {s.locationRoom || 'Térreo'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ESCALAS DE TURNOS */}
      {activeTab === 'escalas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Escalas de Turnos & Reuniões Públicas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organização das equipes de passistas por dia e horário das sessões.
              </p>
            </div>

            <button
              onClick={() => setShowNewEscalaModal(true)}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Escala</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escalas.map((e) => (
              <div key={e.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                    {e.timeShift}
                  </span>
                  <span className="text-xs text-slate-500">{e.date}</span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white">{e.teamName}</h4>
                <p className="text-xs text-slate-500">Coordenador: {e.coordinatorName || 'Não especificado'}</p>

                {e.notes && <p className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600">{e.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVO ATENDIMENTO */}
      {showNewAtendimentoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Novo Atendimento de Passe</span>
              </h3>
              <button onClick={() => setShowNewAtendimentoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAtendimento} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Assistido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={formAtendimento.patientName}
                  onChange={(e) => setFormAtendimento({ ...formAtendimento, patientName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Passe Doutrinário
                </label>
                <select
                  value={formAtendimento.typePasse}
                  onChange={(e) => setFormAtendimento({ ...formAtendimento, typePasse: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Passe Geral">Passe Geral (Público de Reunião Doutrinária)</option>
                  <option value="Passe Magnético / Específico">Passe Magnético / Específico (Tratamento)</option>
                  <option value="Passe de Infância">Passe de Infância (Crianças e Jovens)</option>
                  <option value="Passe Domiciliar / Enfermo">Passe Domiciliar / Enfermos</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sala Destino
                </label>
                <select
                  value={formAtendimento.roomName}
                  onChange={(e) => setFormAtendimento({ ...formAtendimento, roomName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {salas.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="referralCheck"
                  checked={formAtendimento.hasFraternalReferral}
                  onChange={(e) => setFormAtendimento({ ...formAtendimento, hasFraternalReferral: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="referralCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Possui encaminhamento prévio do Atendimento Fraterno?
                </label>
              </div>

              {formAtendimento.hasFraternalReferral && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Observações de Encaminhamento (Sigiloso)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Orientação recomendada pelo Atendented Fraterno..."
                    value={formAtendimento.referralNotes}
                    onChange={(e) => setFormAtendimento({ ...formAtendimento, referralNotes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewAtendimentoModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-md"
                >
                  Gerar Senha e Incluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PASSISTA */}
      {showNewPassistaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cadastrar Passista Voluntário</h3>
              <button onClick={() => setShowNewPassistaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePassista} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do trabalhador"
                  value={formPassista.name}
                  onChange={(e) => setFormPassista({ ...formPassista, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail ou Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={formPassista.phone}
                  onChange={(e) => setFormPassista({ ...formPassista, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno Habitual</label>
                <input
                  type="text"
                  placeholder="Ex: Quarta 19h30 ou Sábado 16h"
                  value={formPassista.shift}
                  onChange={(e) => setFormPassista({ ...formPassista, shift: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPassistaModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Salvar Passista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA FLUIDOTERAPIA */}
      {showNewFluidoterapiaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-teal-600" />
                <span>Nova Prescrição de Água Fluidificada</span>
              </h3>
              <button onClick={() => setShowNewFluidoterapiaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFluidoterapia} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Assistido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Aparecida"
                  value={formFluidoterapia.patientName}
                  onChange={(e) => setFormFluidoterapia({ ...formFluidoterapia, patientName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Volume (Litros)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formFluidoterapia.bottleVolumeLiters}
                    onChange={(e) => setFormFluidoterapia({ ...formFluidoterapia, bottleVolumeLiters: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tratamento (Dias)</label>
                  <select
                    value={formFluidoterapia.prescriptionDays}
                    onChange={(e) => setFormFluidoterapia({ ...formFluidoterapia, prescriptionDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value={7}>7 dias</option>
                    <option value={14}>14 dias</option>
                    <option value={21}>21 dias</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Posologia & Orientação</label>
                <textarea
                  rows={2}
                  value={formFluidoterapia.posologyNotes}
                  onChange={(e) => setFormFluidoterapia({ ...formFluidoterapia, posologyNotes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewFluidoterapiaModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  Salvar Prescrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAINEL TV DE CHAMADA */}
      {showTvPanel && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 md:p-12 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-4">
              <Sparkles className="w-10 h-10 text-emerald-400 animate-spin-slow" />
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide font-serif text-emerald-300">
                  CENTRO ESPÍRITA — SALÃO DE PASSES
                </h2>
                <p className="text-sm text-slate-400">Chamada Pública de Atendimento Fluídico</p>
              </div>
            </div>

            <button
              onClick={() => setShowTvPanel(false)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Fechar Painel TV
            </button>
          </div>

          {/* Main Called Display */}
          <div className="my-auto text-center space-y-6">
            {currentCalled ? (
              <div className="space-y-4 animate-bounce-subtle">
                <span className="inline-block px-6 py-2 bg-amber-500 text-slate-950 text-xl font-black rounded-2xl tracking-widest uppercase shadow-2xl">
                  SENHA CHAMADA
                </span>
                <h1 className="text-7xl md:text-9xl font-black tracking-tight text-white font-mono drop-shadow-lg">
                  {currentCalled.codeOrTicket || 'P-00'}
                </h1>
                <p className="text-3xl md:text-5xl font-bold text-emerald-300">
                  {currentCalled.patientName}
                </p>
                <div className="inline-flex items-center space-x-3 bg-emerald-900/60 border-2 border-emerald-400/50 px-8 py-4 rounded-2xl text-2xl md:text-3xl font-bold text-white mt-4">
                  <DoorOpen className="w-8 h-8 text-emerald-300" />
                  <span>{currentCalled.roomName || 'Sala de Passe 1'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-4xl text-slate-500 font-serif">Aguardando chamada de assistidos...</p>
                <p className="text-sm text-slate-600">Mantenha a mente em oração e harmonização.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Aviso Sonoro Ativo • Síntese de Voz Língua Portuguesa</span>
            <span>{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
