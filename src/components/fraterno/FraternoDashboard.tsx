import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, 
  Users, 
  Clock, 
  ClipboardList, 
  ShieldCheck, 
  Volume2, 
  Play, 
  Pause, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Lock, 
  Eye, 
  EyeOff, 
  Calendar, 
  BookOpen, 
  Smile, 
  Heart, 
  AlertCircle, 
  Activity, 
  ChevronRight, 
  UserCheck, 
  Send, 
  Printer, 
  History, 
  Zap, 
  Compass, 
  Radio, 
  Tv, 
  X,
  ExternalLink,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../../services/dataService';
import { 
  Participant, 
  ServiceQueueEntry, 
  Evolution, 
  Sector, 
  Worker 
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

// Motivos Comuns de Procura no Atendimento Fraterno (Diretrizes FEB)
const REASONS_LIST = [
  { id: 'EMOCIONAL', label: 'Angústia, Ansiedade ou Depressão', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { id: 'FAMILIAR', label: 'Conflitos Familiares ou Conjugais', icon: Users, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'LUTO', label: 'Luto / Perda de Ente Querido', icon: HeartHandshake, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { id: 'SAUDE', label: 'Enfermidade Física / Dor Crônica', icon: Activity, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { id: 'ESPIRITUAL', label: 'Sensibilidade Mediúnica / Perturbação Espiritual', icon: Sparkles, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { id: 'ORIENTACAO', label: 'Dúvidas Doutrinárias / Busca de Esclarecimento', icon: BookOpen, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
  { id: 'MATERIAL', label: 'Dificuldade Material / Vulnerabilidade Social', icon: HelpCircle, color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

// Obras Recomendadas para Leitura Fraterna
const RECOMMENDED_READINGS = [
  { title: 'O Evangelho Segundo o Espiritismo', author: 'Allan Kardec', chapters: 'Cap. V (Bem-aventurados os aflitos), Cap. IX (Bem-aventurados os brandos e pacíficos), Cap. XVII (Sede perfeitos)' },
  { title: 'O Livro dos Espíritos', author: 'Allan Kardec', chapters: 'Questões sobre Leis Morais, Provas e Expiações, Prece e Ação dos Espíritos' },
  { title: 'Fonte Viva / Vinha de Luz', author: 'Emmanuel (Chico Xavier)', chapters: 'Páginas diárias de reconforto e disciplina do pensamento' },
  { title: 'Jesus no Lar', author: 'Neio Lúcio (Chico Xavier)', chapters: 'Incentivo à implantação do Culto do Evangelho no Lar' },
];

export const FraternoDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Active navigation tab within Fraterno
  const [activeTab, setActiveTab] = useState<'MESA' | 'FILA' | 'PRONTUARIOS' | 'EQUIPE' | 'DIRETRIZES' | 'METRICAS'>('MESA');

  // Core Data
  const [queue, setQueue] = useState<ServiceQueueEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Service Desk State
  const [activeService, setActiveService] = useState<ServiceQueueEntry | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [searchParticipantText, setSearchParticipantText] = useState('');
  const [isSearchingParticipants, setIsSearchingParticipants] = useState(false);

  // Desk Timer
  const [serviceTimerSeconds, setServiceTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Form: Novo Atendimento / Registro de Escuta Fraterna
  const [selectedReason, setSelectedReason] = useState<string>('EMOCIONAL');
  const [emotionalState, setEmotionalState] = useState<string>('');
  const [familyContext, setFamilyContext] = useState<string>('');
  const [physicalContext, setPhysicalContext] = useState<string>('');
  const [spiritualContext, setSpiritualContext] = useState<string>('');
  const [notesConfidential, setNotesConfidential] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [referrals, setReferrals] = useState<string[]>([]);
  const [referralNotes, setReferralNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Confidentiality Toggle for historical records
  const [showConfidentialNotes, setShowConfidentialNotes] = useState<Record<string, boolean>>({});

  // Search & Filter for History
  const [historySearchText, setHistorySearchText] = useState('');
  const [selectedHistoryParticipantId, setSelectedHistoryParticipantId] = useState<string>('ALL');

  // Direct Audio Calling Announcement
  const [calledTicketMsg, setCalledTicketMsg] = useState<string | null>(null);

  // Fetch real-time data
  useEffect(() => {
    const unsubQueue = dataService.subscribeToQueue((q) => {
      setQueue(q || []);
      setLoading(false);
    });

    const unsubParticipants = dataService.subscribeToParticipants((p) => {
      setParticipants(p || []);
    });

    const unsubEvolutions = dataService.subscribeToAllEvolutions((e) => {
      setEvolutions(e || []);
    });

    const unsubSectors = dataService.subscribeToSectors((s) => {
      setSectors(s || []);
    });

    const unsubWorkers = dataService.subscribeToWorkers((w) => {
      setWorkers(w || []);
    });

    return () => {
      unsubQueue();
      unsubParticipants();
      unsubEvolutions();
      unsubSectors();
      unsubWorkers();
    };
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setServiceTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fraterno Sector ID lookup
  const fraternoSector = sectors.find(s => s.type === 'FRATERNO' || s.name.toLowerCase().includes('fraterno'));
  const fraternoSectorId = fraternoSector?.id || '';

  // Waiting Queue for Atendimento Fraterno
  const fraternoQueueWaiting = queue.filter(item => {
    const isFraternoSector = item.sectorId === fraternoSectorId || item.sectorType === 'FRATERNO';
    return isFraternoSector && item.status === 'WAITING';
  }).sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return a.arrivalDate - b.arrivalDate;
  });

  // Call Next Person in Queue
  const handleCallNextInQueue = async () => {
    if (fraternoQueueWaiting.length === 0) {
      alert('Não há pessoas aguardando na fila de Atendimento Fraterno.');
      return;
    }

    const nextEntry = fraternoQueueWaiting[0];
    const participant = participants.find(p => p.id === nextEntry.participantId);

    // Call Ticket using Web Speech TTS with Logos Voice Settings
    const participantNameOrTicket = participant?.name || nextEntry.participantName || nextEntry.ticketNumber || 'Irmão(ã)';
    const ticketText = nextEntry.ticketNumber ? `Senha ${nextEntry.ticketNumber}` : '';
    const speechMessage = `Atenção: ${ticketText}, ${participantNameOrTicket}, favor dirigir-se à Sala de Atendimento Fraterno.`;

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechMessage);
        utterance.lang = 'pt-BR';
        utterance.pitch = 1.25;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }

    // Set Active Service State
    setActiveService(nextEntry);
    setSelectedParticipant(participant || null);
    setServiceTimerSeconds(0);
    setIsTimerRunning(true);
    setCalledTicketMsg(`Chamando: ${nextEntry.ticketNumber || ''} - ${participantNameOrTicket}`);
    setTimeout(() => setCalledTicketMsg(null), 8000);

    // Update status in Firestore to IN_PROGRESS
    try {
      await dataService.updateQueueStatus(nextEntry.id, 'IN_PROGRESS', currentUser?.id);
    } catch (err) {
      console.error('Error updating queue status:', err);
    }
  };

  // Select Participant manually from search
  const handleSelectParticipantManually = (p: Participant) => {
    setSelectedParticipant(p);
    setIsSearchingParticipants(false);
    setSearchParticipantText('');
  };

  // Toggle referral badge
  const toggleReferral = (refType: string) => {
    if (referrals.includes(refType)) {
      setReferrals(referrals.filter(r => r !== refType));
    } else {
      setReferrals([...referrals, refType]);
    }
  };

  // Finalize & Save Atendimento Fraterno Record
  const handleFinalizeService = async () => {
    if (!selectedParticipant && !activeService?.participantName) {
      alert('Selecione ou identifique o assistido para concluir o atendimento fraterno.');
      return;
    }

    if (!notesConfidential && !recommendations && !selectedReason) {
      alert('Por favor, preencha as anotações do diálogo fraterno ou recomendações.');
      return;
    }

    setIsSaving(true);

    try {
      const participantId = selectedParticipant?.id || activeService?.participantId || 'ANONIMO';
      const workerId = currentUser?.id || 'VOLUNTARIO_FRATERNO';

      const evolutionData: Omit<Evolution, 'id'> = {
        participantId,
        workerId,
        sectorId: fraternoSectorId,
        date: Date.now(),
        notesEncrypted: notesConfidential,
        recommendations: recommendations,
        emotionalStatus: emotionalState,
        familyRelationship: familyContext,
        physicalHealth: physicalContext,
        spirituality: spiritualContext,
        encaminhamento: referrals.join(', ') + (referralNotes ? ` (${referralNotes})` : ''),
        observations: `Motivo Principal: ${selectedReason}. Duração do acolhimento: ${formatTime(serviceTimerSeconds)}.`,
        aspectsReports: {
          emotionalStatus: emotionalState,
          physicalHealth: physicalContext,
          familyRelationship: familyContext,
          spirituality: spiritualContext
        }
      };

      await dataService.addEvolution(evolutionData);

      // Finish queue entry if active
      if (activeService) {
        await dataService.updateQueueStatus(activeService.id, 'FINISHED', currentUser?.id);
      }

      // If user had selected referrals to Passe or Estudo, auto-register in next queues
      if (referrals.includes('PASSE')) {
        const passeSector = sectors.find(s => s.type === 'PASSE' || s.name.toLowerCase().includes('passe'));
        if (passeSector && participantId !== 'ANONIMO') {
          await dataService.addToQueue({
            participantId,
            sectorId: passeSector.id,
            priority: false,
            notes: 'Encaminhado pelo Atendimento Fraterno'
          });
        }
      }

      // Reset form
      setActiveService(null);
      setSelectedParticipant(null);
      setIsTimerRunning(false);
      setServiceTimerSeconds(0);
      setEmotionalState('');
      setFamilyContext('');
      setPhysicalContext('');
      setSpiritualContext('');
      setNotesConfidential('');
      setRecommendations('');
      setReferrals([]);
      setReferralNotes('');
      setSaveSuccessMsg('Atendimento Fraterno concluído com sucesso e prontuário salvo sob sigilo.');
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Erro ao salvar atendimento:', err);
      alert('Erro ao salvar o atendimento fraterno. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Participants for manual search
  const filteredSearchParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchParticipantText.toLowerCase()) ||
    (p.cpf && p.cpf.includes(searchParticipantText)) ||
    (p.phone && p.phone.includes(searchParticipantText))
  ).slice(0, 8);

  // Filtered Evolutions for History tab
  const filteredEvolutions = evolutions.filter(ev => {
    if (selectedHistoryParticipantId !== 'ALL' && ev.participantId !== selectedHistoryParticipantId) {
      return false;
    }
    if (!historySearchText) return true;
    const participant = participants.find(p => p.id === ev.participantId);
    const worker = workers.find(w => w.id === ev.workerId);
    const pName = participant?.name?.toLowerCase() || '';
    const wName = worker?.name?.toLowerCase() || '';
    const notes = ev.notesEncrypted?.toLowerCase() || '';
    const recs = ev.recommendations?.toLowerCase() || '';
    const search = historySearchText.toLowerCase();
    return pName.includes(search) || wName.includes(search) || notes.includes(search) || recs.includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification of Call */}
      <AnimatePresence>
        {calledTicketMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-cyan-300 px-6 py-4 rounded-2xl shadow-2xl border-2 border-cyan-400/80 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 animate-pulse">
              <Volume2 size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Chamada em Telão & Áudio</p>
              <p className="text-sm font-black text-white font-mono">{calledTicketMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header do Setor de Atendimento Fraterno */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-[32px] p-6 lg:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                <HeartHandshake size={12} /> Setor de Atendimento Fraterno
              </span>
              <span className="text-xs text-indigo-200/80 font-medium">
                • Acolhimento, Consolo & Esclarecimento Espírita
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Mesa de Acolhimento & Diálogo Fraterno
            </h1>
            <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
              "Vinde a mim, todos vós que estais aflitos e sobrecarregados, e eu vos aliviarei." — Mateus 11:28.
              Escuta afetuosa e confidencial à luz dos princípios da Doutrina Espírita.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/fila')}
              className="px-4 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-500/40 cursor-pointer"
            >
              <Tv size={15} className="text-cyan-300" />
              <span>Abrir Telão da Fila</span>
            </button>
            <button
              onClick={handleCallNextInQueue}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 cursor-pointer"
            >
              <Volume2 size={16} />
              <span>Chamar Próximo da Fila</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-700/60">
          <div className="bg-indigo-950/40 border border-indigo-600/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Aguardando na Fila</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-cyan-300">{fraternoQueueWaiting.length}</span>
              <Clock size={16} className="text-cyan-400" />
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-600/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Atendimentos no Mês</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-emerald-300">
                {evolutions.filter(e => {
                  const d = new Date(e.date);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </span>
              <ClipboardList size={16} className="text-emerald-400" />
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-600/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Atendentes Escalados</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-amber-300">
                {workers.filter(w => w.sectorId === fraternoSectorId || w.role === 'ATENDENTE').length || 4}
              </span>
              <Users size={16} className="text-amber-400" />
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-600/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Sigilo & Ética</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-rose-300">100% Protegido</span>
              <ShieldCheck size={16} className="text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('MESA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'MESA'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
          }`}
        >
          <HeartHandshake size={15} className={activeTab === 'MESA' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Mesa de Acolhimento</span>
          {activeService && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('FILA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'FILA'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
          }`}
        >
          <Clock size={15} className={activeTab === 'FILA' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Fila de Espera</span>
          {fraternoQueueWaiting.length > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] rounded-full font-black">
              {fraternoQueueWaiting.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PRONTUARIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'PRONTUARIOS'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
          }`}
        >
          <ClipboardList size={15} className={activeTab === 'PRONTUARIOS' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Histórico & Prontuários</span>
        </button>

        <button
          onClick={() => setActiveTab('EQUIPE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'EQUIPE'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
          }`}
        >
          <Users size={15} className={activeTab === 'EQUIPE' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Equipe & Escala</span>
        </button>

        <button
          onClick={() => setActiveTab('DIRETRIZES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'DIRETRIZES'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/60'
          }`}
        >
          <BookOpen size={15} className={activeTab === 'DIRETRIZES' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Diretrizes FEB & Roteiro</span>
        </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: MESA DE ACOLHIMENTO */}
      {activeTab === 'MESA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Assistido Atual & Cronômetro */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <HeartHandshake size={16} className="text-indigo-600" />
                  Sala de Atendimento
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeService 
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {activeService ? 'Em Acolhimento' : 'Sala Disponível'}
                </span>
              </div>

              {/* Cronômetro */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo de Escuta</span>
                  <p className="text-2xl font-black font-mono text-cyan-300">{formatTime(serviceTimerSeconds)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition-all cursor-pointer"
                    title={isTimerRunning ? 'Pausar' : 'Iniciar'}
                  >
                    {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTimerSeconds(0)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer text-xs"
                    title="Zerar Cronômetro"
                  >
                    Zerar
                  </button>
                </div>
              </div>

              {/* Informações do Assistido */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assistido Selecionado</span>
                
                {selectedParticipant ? (
                  <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-indigo-950">{selectedParticipant.name}</h4>
                        <p className="text-[11px] text-slate-600">{selectedParticipant.phone || 'Sem telefone'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedParticipant(null)}
                        className="text-slate-400 hover:text-rose-600 p-1 text-xs cursor-pointer"
                        title="Desmarcar"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {selectedParticipant.birthDate && (
                      <p className="text-[11px] text-slate-500">
                        Nascimento: <span className="font-semibold text-slate-700">{selectedParticipant.birthDate}</span>
                      </p>
                    )}

                    {/* Histórico Prévio do Assistido */}
                    <div className="pt-2 border-t border-indigo-200/60">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase">
                        Acolhimentos Anteriores: {evolutions.filter(e => e.participantId === selectedParticipant.id).length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar assistido por nome ou CPF..."
                        value={searchParticipantText}
                        onChange={(e) => {
                          setSearchParticipantText(e.target.value);
                          setIsSearchingParticipants(true);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>

                    {isSearchingParticipants && searchParticipantText && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-48 overflow-y-auto space-y-1">
                        {filteredSearchParticipants.map(p => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectParticipantManually(p)}
                            className="p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center text-xs transition-colors"
                          >
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.phone || ''}</span>
                          </div>
                        ))}
                        {filteredSearchParticipants.length === 0 && (
                          <p className="text-[11px] text-slate-400 p-2 text-center">Nenhum assistido encontrado.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão de Chamar Próximo */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCallNextInQueue}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Volume2 size={16} />
                  <span>Chamar Próximo da Fila</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Dispara a chamada na TV da recepção e sintetiza a fala do Mascote.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Ficha de Escuta & Orientações */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList size={18} className="text-indigo-600" />
                  Registro de Diálogo & Acolhimento Fraterno
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha as impressões do diálogo com foco na consolação, esclarecimento evangélico e sigilo irrestrito.
                </p>
              </div>

              {/* Motivo Principal da Procura */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  1. Motivo Principal da Procura
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REASONS_LIST.map(reason => {
                    const Icon = reason.icon;
                    const isSelected = selectedReason === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-500 shadow-sm'
                            : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border ${reason.color}`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-700'}`}>
                          {reason.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avaliação Multidimensional (Emocional, Familiar, Físico, Espiritual) */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  2. Impressões Multidimensionais do Diálogo
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Heart size={12} className="text-rose-500" /> Estado Emocional / Psíquico
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Angústia recente, serenidade aparente, choro..."
                      value={emotionalState}
                      onChange={(e) => setEmotionalState(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Users size={12} className="text-amber-500" /> Convivência Familiar
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Apoio dos familiares, conflito com cônjuge..."
                      value={familyContext}
                      onChange={(e) => setFamilyContext(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Activity size={12} className="text-emerald-500" /> Saúde Física & Tratamentos
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Faz acompanhamento médico, insônia..."
                      value={physicalContext}
                      onChange={(e) => setPhysicalContext(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Sparkles size={12} className="text-purple-500" /> Vivência Espiritual / Práticas
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Faz Evangelho no Lar, primeira vez na casa espírita..."
                      value={spiritualContext}
                      onChange={(e) => setSpiritualContext(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Relato Confidencial da Escuta */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={13} className="text-rose-500" />
                    3. Relato Livre do Diálogo (Sigilo Ético & Doutrinário)
                  </label>
                  <span className="text-[10px] text-rose-600 bg-rose-50 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    Acesso Restrito aos Atendentes
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Descreva de forma concisa e respeitosa os principais pontos abordados na conversa fraterna..."
                  value={notesConfidential}
                  onChange={(e) => setNotesConfidential(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Orientações & Mensagem Doutrinária */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-600" />
                  4. Orientações Fraternas & Sugestões de Leitura
                </label>
                <textarea
                  rows={2}
                  placeholder="Indicações do Evangelho no Lar, capítulos de O Evangelho Segundo o Espiritismo, prece, etc."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Encaminhamentos Intersetoriais com 1 Clique */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  5. Encaminhamentos Imediatos para Outros Setores da Casa
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReferral('PASSE')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                      referrals.includes('PASSE')
                        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Sparkles size={16} className="text-sky-600" />
                    <span>Passes / Fluidos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReferral('MEDIUNICO')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                      referrals.includes('MEDIUNICO')
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Radio size={16} className="text-purple-600" />
                    <span>Reunião Mediúnica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReferral('ESTUDO')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                      referrals.includes('ESTUDO')
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <BookOpen size={16} className="text-amber-600" />
                    <span>Estudos / ESDE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReferral('SOCIAL')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                      referrals.includes('SOCIAL')
                        ? 'bg-pink-50 border-pink-500 text-pink-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <HeartHandshake size={16} className="text-pink-600" />
                    <span>Promoção Social</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Observações complementares sobre o encaminhamento (opcional)..."
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-2 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Ações de Conclusão */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja limpar os dados deste atendimento?')) {
                      setNotesConfidential('');
                      setRecommendations('');
                      setEmotionalState('');
                      setFamilyContext('');
                      setPhysicalContext('');
                      setSpiritualContext('');
                      setReferrals([]);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-3 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpar Campos
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleFinalizeService}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSaving ? 'Salvando Prontuário...' : 'Concluir Atendimento & Salvar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILA DE ESPERA */}
      {activeTab === 'FILA' && (
        <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                Fila de Espera em Tempo Real (Atendimento Fraterno)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {fraternoQueueWaiting.length} pessoa(s) aguardando atendimento fraterno neste momento.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCallNextInQueue}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Volume2 size={15} />
                <span>Chamar Próximo</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {fraternoQueueWaiting.map((item, index) => {
              const participant = participants.find(p => p.id === item.participantId);
              const displayName = participant?.name || item.participantName || 'Irmão(ã) em Acolhimento';
              const arrivalTime = new Date(item.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    index === 0
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-sm ${
                      item.priority
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {item.ticketNumber || `#${index + 1}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{displayName}</h4>
                        {item.priority && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-black rounded-full uppercase">
                            Prioridade
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase">
                            Próximo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chegada às {arrivalTime} • {item.notes || 'Acolhimento regular'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveService(item);
                        setSelectedParticipant(participant || null);
                        setActiveTab('MESA');
                        setIsTimerRunning(true);
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <HeartHandshake size={14} />
                      <span>Iniciar Atendimento</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {fraternoQueueWaiting.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-xs font-bold text-slate-700 uppercase">Fila Vazia</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Nenhum assistido aguardando no momento. Novos check-ins na recepção aparecerão aqui em tempo real.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HISTÓRICO & PRONTUÁRIOS */}
      {activeTab === 'PRONTUARIOS' && (
        <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" />
                Prontuários & Histórico de Atendimentos Fraternos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultas sigilosas dos acolhimentos já realizados na casa.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por assistido, atendente..."
                  value={historySearchText}
                  onChange={(e) => setHistorySearchText(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="space-y-4">
            {filteredEvolutions.map((ev) => {
              const participant = participants.find(p => p.id === ev.participantId);
              const worker = workers.find(w => w.id === ev.workerId);
              const dateStr = new Date(ev.date).toLocaleDateString('pt-BR');
              const isUnlocked = showConfidentialNotes[ev.id];

              return (
                <div key={ev.id} className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{participant?.name || 'Assistido'}</span>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 font-bold px-2 py-0.5 rounded-full">
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Atendente: <span className="font-semibold text-slate-700">{worker?.name || 'Voluntário Fraterno'}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowConfidentialNotes(prev => ({ ...prev, [ev.id]: !prev[ev.id] }))}
                      className="px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start"
                    >
                      {isUnlocked ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{isUnlocked ? 'Ocultar Relato' : 'Ver Relato Sigiloso'}</span>
                    </button>
                  </div>

                  {ev.observations && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-medium">
                      {ev.observations}
                    </p>
                  )}

                  {isUnlocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-800 uppercase">
                        <Lock size={12} /> Relato da Escuta Fraterna:
                      </div>
                      <p className="text-xs text-rose-950 whitespace-pre-wrap leading-relaxed">
                        {ev.notesEncrypted || 'Sem anotações textuais registradas.'}
                      </p>
                    </motion.div>
                  )}

                  {ev.recommendations && (
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase block">Orientações & Recomendações:</span>
                      <p className="text-xs text-slate-700 mt-1">{ev.recommendations}</p>
                    </div>
                  )}

                  {ev.encaminhamento && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-700">Encaminhamentos:</span>
                      <span className="bg-slate-200/70 px-2 py-0.5 rounded-lg text-slate-800 font-semibold">{ev.encaminhamento}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEvolutions.length === 0 && (
              <p className="text-xs text-slate-400 p-8 text-center bg-slate-50 rounded-2xl">
                Nenhum prontuário de atendimento encontrado com os filtros atuais.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: EQUIPE & ESCALA */}
      {activeTab === 'EQUIPE' && (
        <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Equipe de Atendentes Fraternos & Plantão
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trabalhadores capacitados para a escuta fraterna e acolhimento dos corações aflitos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.filter(w => w.sectorId === fraternoSectorId || w.role === 'ATENDENTE').map(worker => (
              <div key={worker.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{worker.name}</h4>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase">{worker.role}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{worker.email}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Plantão: Terças e Quintas</span>
                  <span className="text-emerald-600 font-bold">Ativo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DIRETRIZES FEB & ROTEIRO */}
      {activeTab === 'DIRETRIZES' && (
        <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              Diretrizes Oficiais de Atendimento Fraterno (FEB)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Princípios doutrinários, éticos e procedimentais fundamentados na Codificação de Allan Kardec.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                O que É o Atendimento Fraterno:
              </h4>
              <ul className="text-xs text-emerald-900 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                <li>Acolhimento afetivo e escuta atenta sem julgamentos morais.</li>
                <li>Consolo e esclarecimento com base nos ensinamentos do Evangelho de Jesus e da Doutrina Espírita.</li>
                <li>Incentivo ao Culto do Evangelho no Lar e à renovação de hábitos mentais.</li>
                <li>Encaminhamento consciente para as atividades da casa (Passes, Palestras, Estudos).</li>
                <li>Preservação absoluta do sigilo das confidências do assistido.</li>
              </ul>
            </div>

            <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600" />
                O que NÃO É o Atendimento Fraterno:
              </h4>
              <ul className="text-xs text-rose-900 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                <li>Não é consulta médica ou prescrição de qualquer remédio ou dieta.</li>
                <li>Não é sessão de psicoterapia ou aconselhamento legal/jurídico.</li>
                <li>Não é revelação de vidas passadas nem sessão de adivinhação.</li>
                <li>Não é diagnóstico de obsessão espiritual superficial.</li>
                <li>Não é imposição doutrinária a pessoas de outras crenças religiosas.</li>
              </ul>
            </div>
          </div>

          {/* Obras Recomendadas */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Leituras Doutrinárias de Apoio:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RECOMMENDED_READINGS.map((book, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <h5 className="text-xs font-bold text-slate-900">{book.title}</h5>
                  <p className="text-[10px] text-indigo-700 font-bold">{book.author}</p>
                  <p className="text-[11px] text-slate-600 font-sans">{book.chapters}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
