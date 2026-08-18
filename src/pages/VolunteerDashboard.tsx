import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  Search,
  ClipboardList,
  History,
  LayoutDashboard,
  Zap,
  ArrowRight,
  Volume2,
  Play,
  CheckCircle2,
  Share2,
  HeartHandshake,
  Filter,
  Calendar,
  Megaphone,
  UserPlus,
  X,
  Tv,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Sector, Participant } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Core Data States
  const [queueItems, setQueueItems] = useState<ServiceQueueEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // Volunteer's Selected Working Room / Sector
  const [selectedSectorId, setSelectedSectorId] = useState<string>('ALL');

  // Active Call / Forwarding Modal State
  const [forwardingItem, setForwardingItem] = useState<(ServiceQueueEntry & { participantName?: string }) | null>(null);
  const [forwardSectorId, setForwardSectorId] = useState<string>('');
  const [forwardPriority, setForwardPriority] = useState<boolean>(false);
  const [forwardNotes, setForwardNotes] = useState<string>('');
  const [isSubmittingForward, setIsSubmittingForward] = useState<boolean>(false);

  // Announcement Toast
  const [announcementMsg, setAnnouncementMsg] = useState<string>('');

  useEffect(() => {
    // Setup real-time listeners for live queue, participants and sectors
    const unsubQueue = dataService.subscribeToQueue((q) => {
      setQueueItems(q || []);
      setLoading(false);
    });

    const unsubParticipants = dataService.subscribeToParticipants((p) => {
      setParticipants(p || []);
    });

    const unsubSectors = dataService.subscribeToSectors((s) => {
      setSectors(s || []);
      if (s && s.length > 0 && !forwardSectorId) {
        setForwardSectorId(s[0].id);
      }
    });

    return () => {
      unsubQueue();
      unsubParticipants();
      unsubSectors();
    };
  }, []);

  // Filter queue items by selected sector
  const filteredQueue = queueItems.filter(item => {
    if (item.status !== 'WAITING') return false;
    if (selectedSectorId === 'ALL') return true;
    return item.sectorId === selectedSectorId;
  }).sort((a, b) => {
    // Priority first, then oldest arrival date
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return a.arrivalDate - b.arrivalDate;
  });

  // Current active service assigned to this worker or in progress
  const activeService = queueItems.find(item => 
    item.status === 'IN_PROGRESS' && 
    (item.assignedWorkerId === currentUser?.id || selectedSectorId === 'ALL' || item.sectorId === selectedSectorId)
  );

  const activeParticipant = activeService 
    ? participants.find(p => p.id === activeService.participantId)
    : null;

  const activeSector = activeService 
    ? sectors.find(s => s.id === activeService.sectorId)
    : null;

  // Finished services today by this worker or overall
  const finishedToday = queueItems.filter(item => {
    const today = new Date().setHours(0,0,0,0);
    return item.status === 'FINISHED' && item.arrivalDate >= today &&
      (item.assignedWorkerId === currentUser?.id || selectedSectorId === 'ALL' || item.sectorId === selectedSectorId);
  });

  const handleStartService = async (id: string, participantName?: string, sectorName?: string) => {
    if (!currentUser) return;
    try {
      await dataService.updateQueueStatus(id, 'IN_PROGRESS', currentUser.id);
      
      const pName = participantName || 'Assistido';
      const sName = sectorName || 'Atendimento';
      
      // Trigger announcement toast and log on Mascot
      setAnnouncementMsg(`📢 ${pName} foi chamado(a) para ${sName}!`);
      setTimeout(() => setAnnouncementMsg(''), 5000);
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
      alert('Erro ao iniciar atendimento.');
    }
  };

  const handleCallNextSmart = () => {
    if (filteredQueue.length === 0) {
      alert('Nenhum assistido aguardando na fila selecionada.');
      return;
    }
    const nextItem = filteredQueue[0];
    const pName = participants.find(p => p.id === nextItem.participantId)?.name || 'Assistido';
    const sName = sectors.find(s => s.id === nextItem.sectorId)?.name || 'Setor';
    
    handleStartService(nextItem.id, pName, sName);
  };

  const handleAnnounceOnTV = (pName: string, sName: string) => {
    setAnnouncementMsg(`📺 Projeção enviada ao Painel: "Chamando ${pName} - ${sName}"`);
    setTimeout(() => setAnnouncementMsg(''), 5000);
  };

  const handleFinishService = async (id: string) => {
    try {
      await dataService.updateQueueStatus(id, 'FINISHED', currentUser?.id);
      setAnnouncementMsg('✓ Atendimento concluído e registrado no prontuário!');
      setTimeout(() => setAnnouncementMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao finalizar atendimento:', err);
      alert('Erro ao concluir atendimento.');
    }
  };

  const handleConfirmForward = async () => {
    if (!forwardingItem || !forwardSectorId) return;

    setIsSubmittingForward(true);
    try {
      // Add new entry to the target sector queue
      await dataService.addToQueue({
        participantId: forwardingItem.participantId,
        sectorId: forwardSectorId,
        priority: forwardPriority,
        notes: forwardNotes.trim() || `Reencaminhado por ${currentUser?.name || 'Voluntário'}`
      });

      // Finish current queue item if in progress
      await dataService.updateQueueStatus(forwardingItem.id, 'FINISHED', currentUser?.id);

      const targetSectorName = sectors.find(s => s.id === forwardSectorId)?.name || 'Setor';
      setAnnouncementMsg(`✓ ${forwardingItem.participantName || 'Assistido'} reencaminhado(a) para ${targetSectorName}!`);
      setForwardingItem(null);
      setForwardNotes('');
      setTimeout(() => setAnnouncementMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao reencaminhar assistido:', err);
      alert('Erro ao reencaminhar para outro setor.');
    } finally {
      setIsSubmittingForward(false);
    }
  };

  const quickActions = [
    {
      title: 'Prontuários & Evoluções',
      desc: 'Lançar e consultar histórico fraterno/mediúnico',
      icon: ClipboardList,
      color: 'bg-indigo-600',
      path: '/atendimentos'
    },
    {
      title: 'Fila Completa de Espera',
      desc: 'Visão geral da ordem de chamadas de todos os setores',
      icon: Clock,
      color: 'bg-amber-500',
      path: '/fila'
    },
    {
      title: 'Lista de Atendidos',
      desc: 'Pesquisar e visualizar cadastros da casa',
      icon: Users,
      color: 'bg-emerald-600',
      path: '/atendidos'
    },
    {
      title: 'Escalas do Plantão',
      desc: 'Verifique sua equipe e turnos de trabalho',
      icon: Calendar,
      color: 'bg-purple-600',
      path: '/escalas'
    },
    {
      title: 'Mural & Avisos Oficiais',
      desc: 'Comunicados e orientações da diretoria',
      icon: Megaphone,
      color: 'bg-rose-500',
      path: '/avisos'
    },
    {
      title: 'Novo Cadastro de Assistido',
      desc: 'Inserir novo assistido na base do centro',
      icon: UserPlus,
      color: 'bg-cyan-600',
      path: '/atendidos?action=new'
    }
  ];

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
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
              <HeartHandshake size={14} />
              <span>Painel do Voluntário & Atendimento Assistencial</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">
              Olá, {currentUser?.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Gestão das chamadas de fila, acolhimento e evoluções de atendimento.</p>
          </div>
        </div>

        {announcementMsg && (
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold animate-bounce flex items-center gap-2 shadow-sm">
            <Volume2 size={16} className="text-emerald-600 shrink-0" />
            <span>{announcementMsg}</span>
          </div>
        )}
      </div>

      {/* Bar: Seletor do Setor/Sala de Trabalho Hoje */}
      <div className="bg-white rounded-[28px] p-5 border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <Filter size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Sua Sala / Setor de Plantão Hoje:</span>
            <span className="text-sm font-extrabold text-gray-900">
              {selectedSectorId === 'ALL' ? 'Visão Geral (Todos os Setores)' : sectors.find(s => s.id === selectedSectorId)?.name || 'Setor Selecionado'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedSectorId('ALL')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              selectedSectorId === 'ALL' 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Todos os Setores
          </button>

          {sectors.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectorId(sec.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                selectedSectorId === sec.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {sec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-[32px] text-white shadow-lg shadow-amber-200 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-15 group-hover:scale-110 transition-transform">
            <Users size={100} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100 mb-1">Aguardando Nesta Sala</p>
            <h3 className="text-4xl font-black">{filteredQueue.length}</h3>
            <p className="text-[11px] text-amber-100 font-medium mt-1">
              {filteredQueue.filter(i => i.priority).length} preferenciais
            </p>
          </div>
          <button 
            onClick={handleCallNextSmart}
            disabled={filteredQueue.length === 0}
            className="p-3 bg-white text-amber-700 font-black rounded-2xl hover:bg-amber-50 transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1 text-xs shrink-0"
            title="Chamar próximo da fila com prioridade"
          >
            <Play size={16} fill="currentColor" />
            <span>Chamar</span>
          </button>
        </div>

        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Atendimento Ativo</p>
            <h3 className="text-2xl font-black text-gray-900 italic">
              {activeParticipant ? activeParticipant.name.split(' ')[0] : 'Nenhum'}
            </h3>
            <p className="text-xs font-bold text-indigo-600 mt-1">
              {activeService ? 'Em andamento na sala' : 'Pronto para chamar'}
            </p>
          </div>
          <div className={cn("p-4 rounded-2xl", activeService ? "bg-indigo-50 text-indigo-600 animate-pulse" : "bg-gray-100 text-gray-400")}>
            <Clock size={28} />
          </div>
        </div>

        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Concluídos Hoje</p>
            <h3 className="text-4xl font-black text-gray-900 italic">{finishedToday.length}</h3>
            <p className="text-xs font-bold text-emerald-600 mt-1">Fichas registradas</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={28} />
          </div>
        </div>
      </div>

      {/* Banner de Atendimento em Andamento (Ativo) */}
      {activeService && activeParticipant && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-[36px] p-6 md:p-8 text-white shadow-2xl space-y-6 relative overflow-hidden border border-indigo-700 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-700/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 block">Atendimento em Andamento Agora</span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">{activeParticipant.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-xs font-bold text-indigo-200">
                {activeSector?.name || 'Setor de Atendimento'}
              </span>
              {activeService.priority && (
                <span className="px-3 py-1 bg-amber-500/30 border border-amber-400/40 rounded-full text-xs font-bold text-amber-200">
                  ★ Preferencial
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-indigo-200">
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Telefone / Contato:</span>
              <span className="text-white font-bold">{activeParticipant.phone || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Observações da Fila:</span>
              <span className="text-white font-bold">{activeService.notes || 'Sem observações especiais'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Hora de Chegada:</span>
              <span className="text-white font-bold">{new Date(activeService.arrivalDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/atendimentos?participantId=${activeParticipant.id}`)}
              className="px-5 py-3 bg-white text-indigo-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <ClipboardList size={16} />
              <span>Abrir Prontuário & Lançar Evolução</span>
            </button>

            <button
              onClick={() => setForwardingItem({ ...activeService, participantName: activeParticipant.name })}
              className="px-5 py-3 bg-indigo-700/80 hover:bg-indigo-600 text-white border border-indigo-500 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Share2 size={16} />
              <span>Encaminhar para Outro Setor</span>
            </button>

            <button
              onClick={() => handleFinishService(activeService.id)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer ml-auto"
            >
              <CheckCircle2 size={16} />
              <span>Concluir Atendimento</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Waiting List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Fila de Espera em Tempo Real ({filteredQueue.length})
            </h2>
            
            {filteredQueue.length > 0 && (
              <button 
                onClick={handleCallNextSmart}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Play size={14} fill="currentColor" />
                <span>Chamar Próximo</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            {filteredQueue.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredQueue.map((item) => {
                  const p = participants.find(part => part.id === item.participantId);
                  const pName = p?.name || 'Assistido';
                  const secName = sectors.find(s => s.id === item.sectorId)?.name || 'Setor';

                  return (
                    <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-all group">
                      <div className="flex items-start gap-3.5 flex-1 cursor-pointer" onClick={() => navigate(`/atendimentos?participantId=${item.participantId}`)}>
                        <div className={cn("p-3 rounded-2xl shrink-0 mt-0.5", item.priority ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
                          <Users size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{pName}</h4>
                            {item.priority && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-200">
                                ★ Preferencial
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-indigo-600">{secName}</span>
                            <span>•</span>
                            <span>Chegada: {new Date(item.arrivalDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {item.notes && (
                              <>
                                <span>•</span>
                                <span className="italic text-gray-400">{item.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAnnounceOnTV(pName, secName)}
                          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer"
                          title="Anunciar no Painel / Mascote"
                        >
                          <Tv size={16} />
                        </button>

                        <button
                          onClick={() => handleStartService(item.id, pName, secName)}
                          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>Atender</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <LayoutDashboard size={40} className="mx-auto text-gray-300" />
                <p className="font-semibold text-sm">Nenhum atendimento aguardando nesta sala no momento.</p>
                <p className="text-xs text-gray-400">Alterne o filtro de setor no topo ou aguarde novas chegadas da recepção.</p>
              </div>
            )}
          </div>

          {/* Histórico Recente do Plantão de Hoje */}
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Atendidos por Você Hoje ({finishedToday.length})
            </h3>

            {finishedToday.length > 0 ? (
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 space-y-2 max-h-[220px] overflow-y-auto">
                {finishedToday.map(ft => {
                  const pName = participants.find(p => p.id === ft.participantId)?.name || 'Assistido';
                  return (
                    <div key={ft.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="font-bold text-gray-900">{pName}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/atendimentos?participantId=${ft.participantId}`)}
                        className="text-indigo-600 hover:underline font-bold text-[11px]"
                      >
                        Ver Prontuário
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-[24px] border border-gray-100 text-center text-xs text-gray-400">
                Seus atendimentos finalizados hoje aparecerão listados aqui.
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            Ferramentas do Voluntário
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {quickActions.map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ x: 6 }}
                onClick={() => navigate(action.path)}
                className="w-full p-5 bg-white rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4 text-left hover:shadow-lg hover:border-indigo-100 transition-all group cursor-pointer"
              >
                <div className={`p-3.5 ${action.color} rounded-2xl text-white shadow-md shrink-0`}>
                  <action.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight text-xs uppercase">{action.title}</h3>
                  <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Reencaminhamento para Outro Setor */}
      {forwardingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Reencaminhar Assistido</span>
                <h3 className="text-xl font-black text-gray-900 mt-0.5">{forwardingItem.participantName || 'Assistido'}</h3>
                <p className="text-xs text-gray-500 font-medium">Adicionar o assistido à fila de outro setor da casa.</p>
              </div>
              <button 
                onClick={() => setForwardingItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-600 block mb-1.5">Setor de Destino</label>
                <select
                  value={forwardSectorId}
                  onChange={(e) => setForwardSectorId(e.target.value)}
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
                  id="forwardPrefCheck"
                  checked={forwardPriority}
                  onChange={(e) => setForwardPriority(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="forwardPrefCheck" className="text-xs font-bold text-amber-900 cursor-pointer select-none">
                  Marcar como Fila Preferencial
                </label>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-600 block mb-1.5">Orientação Doutrinária / Nota ao Próximo Setor</label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Encaminhado pelo Atendimento Fraterno para 3 sessões de Passe Fluídico."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForwardingItem(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingForward}
                onClick={handleConfirmForward}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingForward ? 'Encaminhando...' : 'Confirmar Envio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
