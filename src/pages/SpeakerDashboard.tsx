import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Mic2, 
  BookOpen,
  CalendarCheck,
  Star,
  CheckCircle2,
  Clock,
  User,
  Building2,
  MessageCircle,
  Pencil,
  Send,
  X,
  FileText,
  Award,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  AlertTriangle,
  Tv,
  Radio,
  Sparkles,
  Shuffle,
  ChevronRight,
  Filter,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { AgendaEvent, Speaker, AGENDA_EVENT_TYPE_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Sample Gospel Excerpts for Initial/Final Prayer
const GOSPEL_EXCERPTS = [
  {
    chapter: "Capítulo I - Não Vim Destruir a Lei",
    title: "A Aliança da Ciência e da Religião",
    text: "A Ciência e a Religião são as duas alavancas da inteligência humana; uma revela as leis do mundo material e a outra as do mundo moral. Ambas, porém, tendo o mesmo princípio, que é Deus, não podem contradizer-se."
  },
  {
    chapter: "Capítulo V - Bem-Aventurados os Aflitos",
    title: "Motivos de Resignação",
    text: "Pelas palavras: 'Bem-aventurados os aflitos, porque serão consolados', Jesus indica a compensação que espera os que suportam com resignação as provas da vida terrena."
  },
  {
    chapter: "Capítulo IX - Bem-Aventurados os que São Brandos e Pacíficos",
    title: "A Afabilidade e a Doçura",
    text: "A afabilidade e a doçura são o meio de ser útil a todos. O homem de bem é afável e doce para com todos, sem distinção de posição ou de fortuna."
  },
  {
    chapter: "Capítulo X - Bem-Aventurados os que São Misericordiosos",
    title: "Perdoar para que Deus nos Perdoe",
    text: "Misericórdia é o complemento da brandura, porquanto aquele que não for misericordioso não poderá ser brando nem pacífico. Ela consiste no esquecimento e no perdão das ofensas."
  },
  {
    chapter: "Capítulo XVII - Sede Perfeitos",
    title: "O Homem de Bem",
    text: "O verdadeiro homem de bem é aquele que pratica a lei de justiça, de amor e de caridade na sua maior pureza. Se ele interroga a sua consciência sobre os seus próprios atos, pergunta a si mesmo se não violou essa lei."
  }
];

export default function SpeakerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  
  // Selected Speaker Simulation State
  const [simulatedSpeakerId, setSimulatedSpeakerId] = useState<string>('AUTO');

  // Topic Edit Modal State
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<AgendaEvent | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Emergency Substitution Modal State
  const [substituteEvent, setSubstituteEvent] = useState<AgendaEvent | null>(null);
  const [substituteReason, setSubstituteReason] = useState('');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // Presenter / Púlpito Mode State
  const [activePulpitEvent, setActivePulpitEvent] = useState<AgendaEvent | null>(null);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number>(45);
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeGospel, setActiveGospel] = useState(GOSPEL_EXCERPTS[0]);

  // Media / Sonoplastia Request Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Realtime Subscriptions
  useEffect(() => {
    const unsubEvents = dataService.subscribeToAgendaEvents((evs) => {
      setEvents(evs || []);
      setLoading(false);
    });

    const unsubSpeakers = dataService.subscribeToSpeakers((sps) => {
      setSpeakers(sps || []);
    });

    return () => {
      unsubEvents();
      unsubSpeakers();
    };
  }, []);

  // Timer Effect for Púlpito Mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft]);

  // Identify Logged Speaker
  const autoSpeakerProfile = useMemo(() => {
    if (!currentUser) return null;
    return speakers.find(s => 
      (s.email && s.email.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()) ||
      (s.name && s.name.toLowerCase().trim() === currentUser.name?.toLowerCase().trim())
    ) || null;
  }, [currentUser, speakers]);

  // Active Selected Speaker Profile (Auto or Explicitly Chosen)
  const activeSpeakerProfile = useMemo(() => {
    if (simulatedSpeakerId === 'AUTO') return autoSpeakerProfile;
    return speakers.find(s => s.id === simulatedSpeakerId) || null;
  }, [simulatedSpeakerId, autoSpeakerProfile, speakers]);

  // Speaker Specific Events vs House Events
  const { myUpcomingEvents, myPastEvents, houseUpcomingEvents } = useMemo(() => {
    const now = Date.now();
    
    const myEvents = events.filter(e => {
      if (activeSpeakerProfile) {
        const matchId = e.speakerId === activeSpeakerProfile.id;
        const matchName = e.speakerName && e.speakerName.toLowerCase().trim() === activeSpeakerProfile.name.toLowerCase().trim();
        return matchId || matchName;
      }
      if (!currentUser) return false;
      return e.speakerName && e.speakerName.toLowerCase().trim() === currentUser.name?.toLowerCase().trim();
    });

    const myUpcoming = myEvents
      .filter(e => e.date >= now || (new Date(e.date).toDateString() === new Date().toDateString()))
      .sort((a, b) => a.date - b.date);

    const myPast = myEvents
      .filter(e => e.date < now && (new Date(e.date).toDateString() !== new Date().toDateString()))
      .sort((a, b) => b.date - a.date);

    const houseUpcoming = events
      .filter(e => e.date >= now || (new Date(e.date).toDateString() === new Date().toDateString()))
      .sort((a, b) => a.date - b.date)
      .slice(0, 9);

    return {
      myUpcomingEvents: myUpcoming,
      myPastEvents: myPast,
      houseUpcomingEvents: houseUpcoming
    };
  }, [events, currentUser, activeSpeakerProfile]);

  // Handle Confirm Presence
  const handleConfirmAttendance = async (event: AgendaEvent) => {
    try {
      const isConfirmed = event.description.includes('✅ Presença Confirmada');
      const updatedNotes = isConfirmed
        ? event.description
        : `${event.description}\n\n✅ Presença Confirmada pelo orador em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;

      await dataService.updateAgendaEvent({
        ...event,
        description: updatedNotes
      });
      
      await dataService.createLog(
        'Confirmação de Escala de Palestra',
        `Orador: ${event.speakerName || activeSpeakerProfile?.name || 'Expositor'}, Evento: ${event.title}`
      );

      setToastMessage('Presença confirmada com sucesso na agenda da casa!');
    } catch (err) {
      console.error('Erro ao confirmar presença:', err);
    }
  };

  // Save Topic Edits
  const handleSaveTopicEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventToEdit) return;

    try {
      await dataService.updateAgendaEvent({
        ...selectedEventToEdit,
        title: editedTitle,
        description: editedDescription
      });
      setSelectedEventToEdit(null);
      setToastMessage('Tema e referências da palestra atualizados!');
    } catch (err) {
      console.error('Erro ao atualizar palestra:', err);
    }
  };

  // Submit Emergency Substitution
  const handleConfirmEmergencySubstitution = async () => {
    if (!substituteEvent || !substituteReason.trim()) return;

    setIsSubmittingSub(true);
    try {
      const updatedNotes = `${substituteEvent.description}\n\n⚠️ SOLICITAÇÃO DE SUBSTITUIÇÃO EMERGENCIAIS (${format(new Date(), 'dd/MM HH:mm')}): ${substituteReason.trim()}`;

      await dataService.updateAgendaEvent({
        ...substituteEvent,
        description: updatedNotes
      });

      await dataService.createLog(
        'Solicitação de Substituição de Palestrante',
        `Evento: ${substituteEvent.title}, Motivo: ${substituteReason.trim()}`
      );

      setToastMessage('Solicitação de substituição registrada! A Secretaria Doutrinária foi notificada.');
      setSubstituteEvent(null);
      setSubstituteReason('');
    } catch (err) {
      console.error('Erro ao solicitar substituição:', err);
      alert('Erro ao registrar solicitação de substituição.');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Media Request Trigger
  const handleTriggerMediaRequest = (type: string) => {
    setToastMessage(`🔊 Solicitação enviada à Sonoplastia/Mídia: ${type}`);
    dataService.createLog('Solicitação Mídia/Púlpito', `Tipo: ${type} na palestra`);
  };

  // WhatsApp Secretary Contact
  const handleContactSecretary = () => {
    const speakerName = activeSpeakerProfile?.name || currentUser?.name || 'Expositor';
    const msg = `Paz e bem! Sou o orador(a) ${speakerName}. Gostaria de solicitar apoio na minha escala doutrinária da casa.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Open Púlpito Mode
  const handleOpenPulpitMode = (event: AgendaEvent) => {
    setActivePulpitEvent(event);
    setTimerDurationMinutes(45);
    setSecondsLeft(45 * 60);
    setIsTimerRunning(false);
  };

  // Pick Random Gospel
  const handlePickRandomGospel = () => {
    const randomIndex = Math.floor(Math.random() * GOSPEL_EXCERPTS.length);
    setActiveGospel(GOSPEL_EXCERPTS[randomIndex]);
  };

  // Format Timer SS:MM
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-300">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-indigo-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm shadow-indigo-300 border border-indigo-700"
          >
            <CheckCircle2 size={20} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-indigo-800/40">
        <div className="absolute right-0 top-0 opacity-10 translate-x-16 -translate-y-16 pointer-events-none">
          <Mic2 size={360} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/30 rounded-full text-xs font-black uppercase tracking-[0.25em] text-indigo-200 border border-indigo-400/20">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>Área do Orador & Tribuna Doutrinária</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black italic tracking-tight leading-tight">
            A Palavra que <span className="text-indigo-400">Ilumina</span> e Consola
          </h1>

          <p className="text-sm md:text-base text-indigo-100 font-medium leading-relaxed">
            {activeSpeakerProfile ? (
              <>Simulando o painel do expositor(a) <strong>{activeSpeakerProfile.name}</strong>. Gestão de temas, confirmação de presença e modo púlpito para apresentação.</>
            ) : (
              <>Acompanhe as palestras doutrinárias agendadas, confirme sua presença e utilize as ferramentas do orador para suas apresentações.</>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button 
              onClick={() => navigate('/')}
              className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl font-black transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 border border-white/20 shadow-md active:scale-95 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Início</span>
            </button>
            <button 
              onClick={() => navigate('/agenda')}
              className="px-5 py-3 bg-white text-indigo-900 rounded-2xl font-black hover:bg-indigo-50 transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Agenda Geral do Centro
            </button>
            <button 
              onClick={() => navigate('/palestrantes')}
              className="px-5 py-3 bg-indigo-800/80 text-white border border-indigo-700/50 rounded-2xl font-black hover:bg-indigo-700 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              Cadastro de Exposores
            </button>
            <button 
              onClick={handleContactSecretary}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 shadow-md"
            >
              <MessageCircle size={16} />
              <span>Secretaria Doutrinária</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bar: Speaker Profile Selector */}
      <div className="bg-white rounded-[28px] p-5 border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <User size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Perfil de Orador em Exibição:</span>
            <span className="text-sm font-extrabold text-gray-900">
              {activeSpeakerProfile ? activeSpeakerProfile.name : 'Nenhum Expositor Específico'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase shrink-0">Selecionar Expositor:</label>
          <select
            value={simulatedSpeakerId}
            onChange={(e) => setSimulatedSpeakerId(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="AUTO">Automático (Usuário Logado)</option>
            {speakers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.spiritistCenter || 'Sem centro'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Speaker Stats Row */}
      {activeSpeakerProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CalendarCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Escalas Agendadas</span>
              <p className="text-xl font-black text-gray-900">{myUpcomingEvents.length} Palestra(s)</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Histórico no Centro</span>
              <p className="text-xl font-black text-gray-900">{myPastEvents.length} Realizadas</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Casa Espírita / Origem</span>
              <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{activeSpeakerProfile.spiritistCenter || 'Centro Mirante de Luz'}</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Personal Upcoming Events for Logged/Selected Speaker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
            <Mic2 size={24} className="text-indigo-600" />
            Suas Palestras Agendadas ({myUpcomingEvents.length})
          </h2>
        </div>

        {myUpcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myUpcomingEvents.map((event, idx) => {
              const isConfirmed = event.description.includes('✅ Presença Confirmada');
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white p-7 rounded-[32px] border-2 border-indigo-100 shadow-md hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Sua Escala
                      </span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {format(event.date, "EEEE, dd/MM/yyyy", { locale: ptBR })} {event.time ? `às ${event.time}` : ''}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-2 leading-snug italic">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl mb-4">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Actions for the speaker */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 size={16} /> Presença Confirmada
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirmAttendance(event)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={16} />
                          Confirmar Presença
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedEventToEdit(event);
                          setEditedTitle(event.title);
                          setEditedDescription(event.description || '');
                        }}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Pencil size={14} />
                        Ajustar Tema
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenPulpitMode(event)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Maximize2 size={15} />
                        <span>Modo Púlpito / Apresentador</span>
                      </button>

                      <button
                        onClick={() => setSubstituteEvent(event)}
                        className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Solicitar substituição por imprevisto"
                      >
                        <AlertTriangle size={15} />
                        <span>Substituição</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 text-center space-y-3">
            <BookOpen size={36} className="mx-auto text-indigo-400" />
            <p className="font-bold text-indigo-900 text-sm">
              Nenhuma palestra agendada para {activeSpeakerProfile ? activeSpeakerProfile.name : 'este perfil'} no momento.
            </p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Selecione outro expositor no filtro do topo ou entre em contato com a Secretaria Doutrinária para inclusão na agenda.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: General House Upcoming Lectures */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
            <CalendarCheck size={24} className="text-indigo-600" />
            Escala Geral de Palestras Doutrinárias da Casa ({houseUpcomingEvents.length})
          </h2>
          <button
            onClick={() => navigate('/agenda')}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Ver Agenda Completa →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {houseUpcomingEvents.length > 0 ? (
            houseUpcomingEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {AGENDA_EVENT_TYPE_LABELS[event.type] || event.type}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {format(event.date, "dd/MM (EEEE)", { locale: ptBR })}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 mb-2 leading-snug italic">
                    {event.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Mic2 size={14} className="text-indigo-500" />
                    <span className="font-bold text-gray-800 truncate max-w-[150px]">
                      {event.speakerName || 'A definir'}
                    </span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
                      <Clock size={12} />
                      <span>{event.time}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
              <p className="font-bold text-gray-500 text-xs">Nenhum evento agendado para os próximos dias.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Topic Modal */}
      <AnimatePresence>
        {selectedEventToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
              onClick={() => setSelectedEventToEdit(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 italic">Atualizar Tema / Livro Base</h3>
                  <p className="text-xs text-gray-400 font-medium">Informe o título e a literatura básica de estudo</p>
                </div>
                <button
                  onClick={() => setSelectedEventToEdit(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveTopicEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Tema Oficial da Palestra
                  </label>
                  <input
                    required
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-bold text-gray-800 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Referências Doutrinárias & Observações
                  </label>
                  <textarea
                    rows={4}
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none font-medium text-gray-700 text-xs resize-none"
                    placeholder="Ex: Baseado em O Evangelho Segundo o Espiritismo, Cap. V - Bem-aventurados os aflitos."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEventToEdit(null)}
                    className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all text-xs cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Substitution Modal */}
      <AnimatePresence>
        {substituteEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-rose-950/40 backdrop-blur-sm"
              onClick={() => setSubstituteEvent(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-rose-900 italic">Solicitar Substituição Emergencial</h3>
                  <p className="text-xs text-gray-500 font-medium">{substituteEvent.title}</p>
                </div>
                <button
                  onClick={() => setSubstituteEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-600 font-medium">
                  Informe o motivo do imprevisto para que a Secretaria Doutrinária escale um expositor substituto na agenda da casa.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Motivo da Ausência / Justificativa
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={substituteReason}
                    onChange={(e) => setSubstituteReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-rose-50 focus:border-rose-600 outline-none font-medium text-gray-700 text-xs resize-none"
                    placeholder="Ex: Sintomas gripais fortes / Compromisso profissional imprevisível de última hora."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubstituteEvent(null)}
                    className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingSub || !substituteReason.trim()}
                    onClick={handleConfirmEmergencySubstitution}
                    className="flex-[1.5] py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingSub ? 'Enviando...' : 'Confirmar Solicitação'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Presenter / Púlpito Mode (Full-screen Overlay) */}
      <AnimatePresence>
        {activePulpitEvent && (
          <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto p-4 md:p-8 animate-in fade-in duration-200 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                  <Mic2 size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 block">Modo Púlpito & Tribuna Doutrinária</span>
                  <h2 className="text-xl md:text-2xl font-black italic">{activePulpitEvent.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Media Alerts Toggles */}
                <button
                  onClick={() => handleTriggerMediaRequest('Testar Microfone')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  title="Aviso para a Sonoplastia"
                >
                  <Radio size={14} className="text-amber-400" />
                  <span className="hidden sm:inline">Testar Som</span>
                </button>

                <button
                  onClick={() => handleTriggerMediaRequest('Slides no Projetor')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  title="Liberação de Mídia no Projetor"
                >
                  <Tv size={14} className="text-cyan-400" />
                  <span className="hidden sm:inline">Mídia TV</span>
                </button>

                <button
                  onClick={() => setActivePulpitEvent(null)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-2xl transition-colors cursor-pointer ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Presenter Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 flex-1">
              {/* Left Column: Timer & Controls */}
              <div className="lg:col-span-5 bg-slate-900/90 rounded-[36px] p-6 border border-slate-800 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Cronômetro Regressivo de Apresentação</span>
                  
                  {/* Huge Display */}
                  <div className="text-center py-6 bg-slate-950 rounded-[28px] border border-slate-800 shadow-inner">
                    <span className="text-6xl md:text-7xl font-mono font-black tracking-wider text-indigo-400">
                      {formatTimer(secondsLeft)}
                    </span>
                  </div>

                  {/* Preset & Control Buttons */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => {
                        setIsTimerRunning(!isTimerRunning);
                      }}
                      className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                        isTimerRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                      <span>{isTimerRunning ? 'Pausar' : 'Iniciar Tempo'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsTimerRunning(false);
                        setSecondsLeft(timerDurationMinutes * 60);
                      }}
                      className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer"
                      title="Reiniciar Cronômetro"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>

                  {/* Presets Selector */}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Duração:</span>
                    {[30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => {
                          setTimerDurationMinutes(mins);
                          setSecondsLeft(mins * 60);
                          setIsTimerRunning(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          timerDurationMinutes === mins ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speaker Notes */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Detalhes & Roteiro Cadastrado</span>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 font-medium leading-relaxed max-h-[160px] overflow-y-auto">
                    {activePulpitEvent.description || 'Nenhuma nota ou literatura específica inserida para esta apresentação.'}
                  </div>
                </div>
              </div>

              {/* Right Column: Gospel Excerpt for Initial/Final Prayer */}
              <div className="lg:col-span-7 bg-slate-900/90 rounded-[36px] p-6 border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} className="text-amber-400" />
                      <h3 className="text-lg font-black italic">Leitura do Evangelho (Prece Inicial/Final)</h3>
                    </div>

                    <button
                      onClick={handlePickRandomGospel}
                      className="px-3.5 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Shuffle size={14} />
                      <span>Sorteiar Outro Trecho</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-[28px] border border-slate-800 space-y-3">
                    <span className="text-xs font-black text-amber-400 block uppercase tracking-wider">{activeGospel.chapter}</span>
                    <h4 className="text-xl font-black italic text-white">{activeGospel.title}</h4>
                    <p className="text-sm text-slate-300 font-serif leading-relaxed italic border-l-2 border-amber-500 pl-4 py-1">
                      "{activeGospel.text}"
                    </p>
                  </div>
                </div>

                {/* Quick Doutrinario Guidance */}
                <div className="p-4 bg-indigo-950/60 rounded-2xl border border-indigo-800/60 text-xs text-indigo-200 flex items-center justify-between">
                  <span>Deseja consultar livros ou audiobooks da biblioteca durante a palestra?</span>
                  <button
                    onClick={() => {
                      setActivePulpitEvent(null);
                      navigate('/biblioteca');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-all shrink-0 ml-2"
                  >
                    Abrir Acervo
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-900">
              Paz e bem na condução dos trabalhos doutrinários. Centro Espírita Mirante de Luz.
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

