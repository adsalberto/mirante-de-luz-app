import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Activity,
  Zap,
  ClipboardList,
  Printer,
  ExternalLink,
  Phone,
  MapPin,
  Sparkles,
  Search,
  ArrowLeft,
  Tv,
  Volume2,
  VolumeX,
  AlertTriangle,
  Maximize2,
  Minimize2,
  UserX,
  Send,
  Star,
  Building,
  Radio,
  ArrowUpRight,
  Plus,
  Heart
} from "lucide-react";
import { dataService } from "../services/dataService";
import {
  ServiceQueueEntry,
  Participant,
  Sector,
  formatSectorName,
} from "../types";
import { cn } from "../lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSectorTheme } from "../constants/sectorThemes";

export const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [queue, setQueue] = useState<ServiceQueueEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveSectorId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WAITING" | "IN_PROGRESS" | "PRIORITY">("ALL");
  
  // Audio & TV Mode State
  const [isTvMode, setIsTvMode] = useState<boolean>(false);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [lastCalled, setLastCalled] = useState<{
    entry: ServiceQueueEntry;
    participant: Participant;
    sector: Sector;
    time: number;
  } | null>(null);

  // Referral Modal State
  const [referralTarget, setReferralTarget] = useState<{
    entry: ServiceQueueEntry;
    participant: Participant;
  } | null>(null);
  const [selectedReferralSectorId, setSelectedReferralSectorId] = useState<string>("");
  const [referralNotes, setReferralNotes] = useState<string>("");

  // Live Time for TV mode
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Full Screen / TV Mode Handlers
  const handleEnterTvMode = () => {
    setIsTvMode(true);
    try {
      if (document.documentElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn("Fullscreen request not allowed in this context", e);
    }
  };

  const handleExitTvMode = () => {
    setIsTvMode(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn("Exit fullscreen error", e);
    }
  };

  // Keyboard & Native Fullscreen synchronization
  useEffect(() => {
    if (!isTvMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        handleExitTvMode();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTvMode) {
        setIsTvMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isTvMode]);

  // Express Ticket Modal State
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressName, setExpressName] = useState('');
  const [expressSectorType, setExpressSectorType] = useState<'PASSE' | 'DOUTRINARIA' | 'FRATERNO'>('PASSE');
  const [expressPriority, setExpressPriority] = useState(false);
  const [expressNotes, setExpressNotes] = useState('');
  const [isSubmittingExpress, setIsSubmittingExpress] = useState(false);

  useEffect(() => {
    // Live clock interval for TV mode
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    // Load initial participants and sectors
    loadBaseData();

    // Subscribe to Firestore Queue Realtime Stream
    const unsubscribe = dataService.subscribeToQueue((updatedQueue) => {
      setQueue(updatedQueue || []);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadBaseData = async () => {
    try {
      const [p, s] = await Promise.all([
        dataService.getParticipants(),
        dataService.getSectors(),
      ]);

      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
      };

      const uniqueS: Sector[] = [];
      const seenNames = new Set<string>();
      (s || []).forEach((item) => {
        if (!item.name) return;
        const normName = formatSectorName(item.name);
        if (!seenNames.has(normName)) {
          seenNames.add(normName);
          uniqueS.push({ ...item, name: normName });
        }
      });

      setSectors(uniqueS);
      setParticipants(p || []);
    } catch (err) {
      console.error("Erro ao carregar dados base da fila:", err);
    }
  };

  const getParticipant = (id: string, entryItem?: ServiceQueueEntry): Participant | undefined => {
    const found = participants.find((p) => p.id === id);
    if (found) return found;
    
    // Check if it's an anonymous/express visitor entry in the queue
    const queueEntry = entryItem || queue.find(q => q.participantId === id || q.id === id);
    if (queueEntry || id?.startsWith('anon_')) {
      const displayName = queueEntry?.participantName || 
                          (queueEntry?.ticketNumber ? `Senha ${queueEntry.ticketNumber}` : '') ||
                          queueEntry?.notes || 
                          'Visitante Avulso';
      return {
        id: id || queueEntry?.id || 'anon_visitor',
        name: displayName,
        birthDate: '',
        phone: '',
        address: '',
        lgpdConsent: true,
        lgpdDate: queueEntry?.arrivalDate || Date.now(),
        registrationDate: queueEntry?.arrivalDate || Date.now(),
        currentStatus: queueEntry?.status === 'IN_PROGRESS' ? 'IN_SERVICE' : queueEntry?.status === 'FINISHED' ? 'COMPLETED' : 'WAITING'
      };
    }
    return undefined;
  };
  const getSector = (id: string) => sectors.find((s) => s.id === id);

  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ADM" ||
    (currentUser?.position &&
      [
        "Presidente(s)",
        "Vice-presidente(s)",
        "1º Secretário(a)",
        "Secretário(a) de Planejamento",
      ].includes(currentUser.position));

  const canManageQueue =
    isAdmin ||
    ["COORDENADOR", "ATENDENTE", "SECRETARIO", "RECEPCIONISTA"].includes(
      currentUser?.role || "",
    );

  // Text-To-Speech Call Announcement
  const announceCall = (participantName: string, sectorName: string) => {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const text = `Atenção: ${participantName}, favor dirigir-se ao ${sectorName}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  const handleCallParticipant = (item: ServiceQueueEntry) => {
    const p = getParticipant(item.participantId, item);
    const s = getSector(item.sectorId);
    if (!p || !s) return;

    setLastCalled({
      entry: item,
      participant: p,
      sector: s,
      time: Date.now(),
    });

    const callText = item.ticketNumber ? `Senha ${item.ticketNumber}, ${p.name}` : p.name;
    announceCall(callText, s.name);
  };

  const handleStartService = async (id: string) => {
    if (!canManageQueue) {
      alert("Acesso Negado: Você não tem permissão para gerenciar a fila.");
      return;
    }
    try {
      const targetEntry = queue.find((q) => q.id === id);
      if (targetEntry) {
        handleCallParticipant(targetEntry);
      }
      await dataService.updateQueueStatus(id, "IN_PROGRESS", currentUser!.id);
    } catch (err: any) {
      console.error("Erro ao iniciar atendimento:", err);
      alert("Erro ao iniciar atendimento.");
    }
  };

  const handleFinishService = async (id: string) => {
    if (!canManageQueue) {
      alert("Acesso Negado: Permissão insuficiente.");
      return;
    }
    try {
      await dataService.updateQueueStatus(id, "FINISHED", currentUser!.id);
    } catch (err: any) {
      console.error("Erro ao finalizar atendimento:", err);
      alert("Erro ao finalizar atendimento.");
    }
  };

  const handleCancelService = async (id: string) => {
    if (!canManageQueue) {
      alert("Acesso Negado: Permissão insuficiente.");
      return;
    }
    if (!confirm("Deseja marcar este atendido como Ausente / Cancelar chamada?")) return;
    try {
      await dataService.updateQueueStatus(id, "CANCELLED", currentUser!.id);
    } catch (err: any) {
      console.error("Erro ao cancelar entrada na fila:", err);
      alert("Erro ao cancelar chamado.");
    }
  };

  const handleExecuteReferral = async () => {
    if (!referralTarget || !selectedReferralSectorId) return;
    try {
      await dataService.addToQueue({
        participantId: referralTarget.participant.id,
        sectorId: selectedReferralSectorId,
        priority: referralTarget.entry.priority || false,
        notes: referralNotes ? `Reencaminhado: ${referralNotes}` : "Reencaminhamento entre setores",
      });
      // Optionally finish current queue entry
      await dataService.updateQueueStatus(referralTarget.entry.id, "FINISHED", currentUser?.id);
      
      setReferralTarget(null);
      setSelectedReferralSectorId("");
      setReferralNotes("");
      alert("Atendido reencaminhado com sucesso para o novo setor!");
    } catch (err) {
      console.error("Erro ao reencaminhar atendido:", err);
      alert("Erro ao reencaminhar atendido.");
    }
  };

  const handleCreateExpressTicket = async () => {
    setIsSubmittingExpress(true);
    try {
      await dataService.addExpressQueueEntry({
        name: expressName.trim() || undefined,
        sectorType: expressSectorType,
        priority: expressPriority,
        notes: expressNotes.trim() || undefined
      });
      setShowExpressModal(false);
      setExpressName('');
      setExpressNotes('');
      setExpressPriority(false);
    } catch (err) {
      console.error("Erro ao emitir senha expressa:", err);
      alert("Erro ao emitir senha expressa.");
    } finally {
      setIsSubmittingExpress(false);
    }
  };

  const handlePrintTicket = (item: ServiceQueueEntry) => {
    const p = getParticipant(item.participantId, item);
    const s = getSector(item.sectorId);
    if (!p || !s) return;

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const ticketCode = item.ticketNumber || `#${item.id.slice(0, 5).toUpperCase()}`;

    printWin.document.write(`
      <html>
        <head>
          <title>SENHA DE ATENDIMENTO - CEMIL</title>
          <style>
            body { font-family: monospace, sans-serif; text-align: center; padding: 20px; color: #000; width: 280px; margin: 0 auto; }
            .header { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .sub { font-size: 10px; color: #444; margin-bottom: 12px; }
            .ticket-num { font-size: 32px; font-weight: 900; margin: 10px 0; border: 2px dashed #000; padding: 10px; }
            .info { font-size: 11px; text-align: left; margin-top: 10px; line-height: 1.5; }
            .badge { font-weight: bold; background: #000; color: #fff; padding: 2px 6px; font-size: 10px; display: inline-block; margin-top: 5px; }
            .footer { margin-top: 20px; font-size: 9px; border-top: 1px solid #ccc; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">MIRANTE DE LUZ</div>
          <div class="sub">Centro Espírita - Fila de Atendimento</div>
          
          <div class="ticket-num">${ticketCode}</div>
          ${item.priority ? '<div class="badge">ATENDIMENTO PREFERENCIAL</div>' : ''}

          <div class="info">
            <strong>NOME:</strong> ${p.name}<br/>
            <strong>SETOR:</strong> ${s.name}<br/>
            <strong>CHEGADA:</strong> ${format(item.arrivalDate || Date.now(), "dd/MM/yyyy HH:mm")}<br/>
          </div>

          <div class="footer">
            Fraternidade e Paz • Aguarde a chamada do seu nome ou código no painel.
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Filter Active Queue (Excluding Finished/Cancelled)
  const activeQueueList = queue.filter(
    (x) => x.status === "WAITING" || x.status === "IN_PROGRESS"
  );

  // Apply Sector Filter
  let filteredQueue = activeTab === "all"
    ? activeQueueList
    : activeQueueList.filter((item) => item.sectorId === activeTab);

  // Apply Status / Priority Filter
  if (statusFilter === "WAITING") {
    filteredQueue = filteredQueue.filter((x) => x.status === "WAITING");
  } else if (statusFilter === "IN_PROGRESS") {
    filteredQueue = filteredQueue.filter((x) => x.status === "IN_PROGRESS");
  } else if (statusFilter === "PRIORITY") {
    filteredQueue = filteredQueue.filter((x) => x.priority === true);
  }

  // Apply Search Term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filteredQueue = filteredQueue.filter((item) => {
      const p = getParticipant(item.participantId, item);
      const code = `#${item.id.slice(0, 5).toLowerCase()}`;
      const ticket = (item.ticketNumber || '').toLowerCase();
      return (
        p?.name?.toLowerCase().includes(term) ||
        p?.cpf?.includes(term) ||
        code.includes(term) ||
        ticket.includes(term)
      );
    });
  }

  // Sort Queue: Priority first, IN_PROGRESS first, then by oldest arrival time
  filteredQueue.sort((a, b) => {
    if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
    if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return (a.arrivalDate || 0) - (b.arrivalDate || 0);
  });

  // Calculate Metrics
  const waitingCount = activeQueueList.filter((x) => x.status === "WAITING").length;
  const inProgressCount = activeQueueList.filter((x) => x.status === "IN_PROGRESS").length;
  const finishedTodayCount = queue.filter((x) => x.status === "FINISHED").length;
  const priorityCount = activeQueueList.filter((x) => x.priority).length;

  // Average wait time in minutes
  const totalWaitMinutes = activeQueueList
    .filter((x) => x.status === "WAITING" && x.arrivalDate)
    .reduce((acc, curr) => acc + (Date.now() - curr.arrivalDate) / 60000, 0);
  const avgWaitMinutes = waitingCount > 0 ? Math.round(totalWaitMinutes / waitingCount) : 0;

  // TV Mode Component Render
  if (isTvMode) {
    const callingNowList = activeQueueList.filter((x) => x.status === "IN_PROGRESS");
    const waitingList = activeQueueList.filter((x) => x.status === "WAITING");

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden flex flex-col p-4 sm:p-6 font-sans">
        {/* Floating Top-Right Exit Button - Always visible regardless of viewport/scrolling */}
        <button
          onClick={handleExitTvMode}
          className="fixed top-4 right-4 z-[70] px-3.5 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-2xl shadow-red-950/80 border border-red-400/80 flex items-center gap-2 cursor-pointer backdrop-blur-md"
          title="Sair da tela cheia / Voltar para a gestão (ESC)"
        >
          <Minimize2 size={16} />
          <span className="font-black">Sair da Tela Cheia</span>
          <span className="text-[10px] bg-red-900/80 px-1.5 py-0.5 rounded font-mono hidden md:inline">ESC</span>
        </button>

        {/* TV Header */}
        <header className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4 shrink-0 pr-36 sm:pr-48">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Building size={22} />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-white">
                CENTRO ESPÍRITA MIRANTE DE LUZ
              </h1>
              <p className="text-[10px] sm:text-xs text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <Radio size={14} className="text-emerald-400 animate-pulse shrink-0" /> PAINEL DA SALA DE ESPERA — FILA AO VIVO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {format(currentTime, "HH:mm:ss")}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold block uppercase">
                {format(currentTime, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={cn(
                "p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer",
                speechEnabled ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
              )}
              title={speechEnabled ? "Áudio da Chamada Ativo" : "Áudio Mudo"}
            >
              {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </header>

        {/* TV Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 min-h-0 overflow-hidden">
          {/* Main Calling Spotlight Column */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Last Called Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 rounded-[32px] border-2 border-amber-400/50 shadow-2xl shadow-indigo-950/80 flex flex-col justify-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-2">
                <Sparkles className="animate-spin" size={16} /> ÚLTIMA CHAMADA
              </div>

              {lastCalled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black font-mono text-amber-400 bg-amber-400/20 px-4 py-2 rounded-2xl border border-amber-400/30">
                      #{lastCalled.entry.id.slice(0, 5).toUpperCase()}
                    </div>
                    {lastCalled.entry.priority && (
                      <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-full tracking-wider flex items-center gap-1">
                        <Star size={12} className="fill-slate-950" /> Preferencial
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black text-white leading-none tracking-tight">
                    {lastCalled.participant.name}
                  </h2>
                  {(() => {
                    const lTheme = getSectorTheme(lastCalled.sector.type, lastCalled.sector.name);
                    const LIcon = lTheme.icon;
                    return (
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className={cn("p-2 rounded-xl text-white bg-white/10 border border-white/20 shadow-sm")}>
                          <LIcon size={20} className="text-amber-400" />
                        </div>
                        <p className="text-2xl font-black text-white uppercase tracking-wide">
                          {lastCalled.sector.name}
                        </p>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => announceCall(lastCalled.participant.name, lastCalled.sector.name)}
                    className="self-start px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg mt-2"
                  >
                    <Volume2 size={16} /> Chamar Novamente por Voz
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Radio size={48} className="mx-auto text-indigo-500 animate-pulse" />
                  <p className="text-lg font-bold">Aguardando chamada de novos atendidos...</p>
                </div>
              )}
            </div>

            {/* In Progress List */}
            <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-[32px] p-6 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                <Activity size={18} className="animate-pulse" /> Em Atendimento Agora ({callingNowList.length})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {callingNowList.map((item) => {
                  const p = getParticipant(item.participantId, item);
                  const s = getSector(item.sectorId);
                  if (!p) return null;
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-800/80 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-black flex items-center justify-center border border-emerald-500/30">
                          {item.ticketNumber || `#${item.id.slice(0, 4).toUpperCase()}`}
                        </div>
                        <div>
                          <p className="font-bold text-base text-white">{p.name}</p>
                          <p className="text-xs text-emerald-300 font-medium">{s?.name}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase rounded-lg border border-emerald-500/30">
                        EM CURSO
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Waiting Column */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-[32px] p-6 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock size={18} /> Próximos na Fila ({waitingList.length})
              </span>
              <span className="text-xs font-mono text-slate-400">Tempo Médio: {avgWaitMinutes} min</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {waitingList.map((item, idx) => {
                const p = getParticipant(item.participantId, item);
                const s = getSector(item.sectorId);
                if (!p) return null;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between transition-all",
                      item.priority
                        ? "bg-amber-400/10 border-amber-400/40 text-amber-200"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 font-mono font-black flex items-center justify-center text-sm text-white shrink-0">
                        {idx + 1}º
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">{p.name}</p>
                          {item.ticketNumber && (
                            <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded font-mono text-[10px] font-black border border-indigo-400/30">
                              {item.ticketNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{s?.name}</p>
                      </div>
                    </div>
                    {item.priority && (
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded text-[9px] font-black uppercase">
                        PREFERENCIAL
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Management UI Render
  return (
    <div className="p-4 sm:p-8 space-y-6 h-full flex flex-col bg-gray-50/50">
      {/* Top Main Navigation Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[28px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-3 bg-gray-50 rounded-2xl hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-all active:scale-95 border border-gray-200/60 cursor-pointer"
            title="Voltar ao Painel Principal"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Fila Digital de Atendimento
              </h1>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse tracking-wider">
                TEMPO REAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Gestão inteligente do fluxo de atendidos por setor no Centro Espírita Mirante de Luz.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowExpressModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>+ Entrada Expressa / Passe Avulso</span>
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={cn(
              "px-3.5 py-2.5 rounded-2xl border font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm",
              speechEnabled
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
            )}
            title={speechEnabled ? "Sintetizador de Voz Ativo" : "Ativar Sintetizador de Voz"}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{speechEnabled ? "Voz Ativa" : "Voz Muda"}</span>
          </button>

          <button
            onClick={handleEnterTvMode}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-slate-300 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Tv size={16} className="text-amber-400" />
            <span>Modo TV (Sala de Espera)</span>
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Aguardando Fila</span>
            <p className="text-2xl font-black text-gray-900">{waitingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Em Atendimento</span>
            <p className="text-2xl font-black text-indigo-900">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Atendidos Hoje</span>
            <p className="text-2xl font-black text-emerald-900">{finishedTodayCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Zap size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Média de Espera</span>
            <p className="text-2xl font-black text-purple-900">{avgWaitMinutes} min</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, CPF ou #Senha..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs font-semibold outline-none transition-all"
            />
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto custom-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                statusFilter === "ALL" ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Todos ({activeQueueList.length})
            </button>
            <button
              onClick={() => setStatusFilter("WAITING")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                statusFilter === "WAITING" ? "bg-amber-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Aguardando ({waitingCount})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                statusFilter === "IN_PROGRESS" ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Em Atendimento ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter("PRIORITY")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1",
                statusFilter === "PRIORITY" ? "bg-amber-400 text-indigo-950 shadow-sm" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              )}
            >
              <Star size={12} className="fill-current" /> Preferencial ({priorityCount})
            </button>
          </div>
        </div>

        {/* Sector Tabs Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-2 border-t border-gray-100">
          <button
            onClick={() => setActiveSectorId("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer whitespace-nowrap active:scale-95",
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 bg-gray-50/70"
            )}
          >
            Todos os Setores
          </button>
          {sectors.map((s) => {
            const count = activeQueueList.filter((x) => x.sectorId === s.id).length;
            const theme = getSectorTheme(s.type, s.name);
            const SectorIcon = theme.icon;
            const isActive = activeTab === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setActiveSectorId(s.id)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-2 active:scale-95 border",
                  isActive
                    ? `${theme.bgActive} ${theme.border} shadow-md`
                    : `${theme.bgLight} ${theme.text} ${theme.border} hover:opacity-90`
                )}
              >
                <SectorIcon size={14} className={isActive ? "text-white" : theme.text} />
                <span>{s.name}</span>
                {count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.2 text-[10px] rounded-full font-black",
                    isActive ? "bg-white/20 text-white" : theme.badgeBg
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Queue Cards View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredQueue.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredQueue.map((item, index) => {
                const p = getParticipant(item.participantId, item);
                const s = getSector(item.sectorId);
                if (!p) return null;

                const waitMinutes = item.arrivalDate
                  ? Math.floor((Date.now() - item.arrivalDate) / 60000)
                  : 0;

                const ticketLabel = item.ticketNumber || `#${item.id.slice(0, 5).toUpperCase()}`;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4",
                      item.status === "IN_PROGRESS"
                        ? "border-indigo-300 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-100/50"
                        : item.priority
                        ? "border-amber-300 bg-amber-50/20 shadow-sm"
                        : "border-gray-150 shadow-sm hover:shadow-md"
                    )}
                  >
                    {/* Header: Name, Ticket & Priority */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md",
                            item.isAnonymous ? "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-purple-100" : "bg-indigo-600 shadow-indigo-100"
                          )}>
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover rounded-[inherit]" />
                            ) : item.ticketNumber ? (
                              item.ticketNumber.slice(0, 2)
                            ) : (
                              (p.name || "?").charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {ticketLabel}
                              </span>
                              {item.isAnonymous && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[9px] uppercase rounded-full">
                                  Avulso
                                </span>
                              )}
                              {item.priority && (
                                <span className="px-2 py-0.5 bg-amber-400 text-indigo-950 font-black text-[9px] uppercase rounded-full flex items-center gap-1">
                                  <Star size={10} className="fill-indigo-950" /> Preferencial
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug mt-1 line-clamp-1" title={p.name}>
                              {p.name}
                            </h3>
                          </div>
                        </div>

                        {/* Top Action Icons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePrintTicket(item)}
                            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer"
                            title="Imprimir Senha"
                          >
                            <Printer size={16} />
                          </button>
                          {!item.isAnonymous && (
                            <button
                              onClick={() => navigate(`/atendimentos?participantId=${p.id}`)}
                              className="p-2 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer"
                              title="Ver Prontuário"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info Chips */}
                      {(() => {
                        const sTheme = getSectorTheme(s?.type, s?.name);
                        const SIcon = sTheme.icon;
                        return (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={cn(
                              "px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border shadow-2xs",
                              sTheme.badgeBg
                            )}>
                              <SIcon size={13} />
                              <span>{s?.name || sTheme.name}</span>
                            </span>
                            <span className={cn(
                              "px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 border",
                              waitMinutes > 30 ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200/60"
                            )}>
                              <Clock size={12} /> Espera: {waitMinutes} min
                            </span>
                            {p.phone && (
                              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1 border border-gray-200/60">
                                <Phone size={12} /> {p.phone}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {item.notes && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {item.status === "WAITING" ? (
                          <>
                            <button
                              onClick={() => handleStartService(item.id)}
                              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Sparkles size={14} /> Iniciar
                            </button>
                            <button
                              onClick={() => handleCallParticipant(item)}
                              className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                              title="Chamar por Voz"
                            >
                              <Volume2 size={14} /> Chamar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFinishService(item.id)}
                              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 size={14} /> Concluir
                            </button>
                            <button
                              onClick={() => setReferralTarget({ entry: item, participant: p })}
                              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Reencaminhar Atendido"
                            >
                              <Send size={14} /> Encaminhar
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleCancelService(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Marcar Ausente / Cancelar"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-80 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center p-8 space-y-3 shadow-sm">
            <CheckCircle2 className="text-emerald-500" size={48} />
            <h3 className="text-xl font-bold text-gray-900">Fila Vazia neste filtro</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Não há atendidos aguardando para o setor ou critérios selecionados no momento.
            </p>
          </div>
        )}
      </div>

      {/* Modal Reencaminhamento */}
      {referralTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            onClick={() => setReferralTarget(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Send size={18} className="text-indigo-600" /> Reencaminhar Atendido
              </h3>
              <button
                onClick={() => setReferralTarget(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Atendido</span>
                <p className="font-bold text-gray-900 text-sm">{referralTarget.participant.name}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Selecione o Destino / Novo Setor
                </label>
                <select
                  value={selectedReferralSectorId}
                  onChange={(e) => setSelectedReferralSectorId(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs font-bold outline-none"
                >
                  <option value="">-- Escolha o Setor --</option>
                  {sectors
                    .filter((s) => s.id !== referralTarget.entry.sectorId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Observações de Encaminhamento
                </label>
                <textarea
                  rows={2}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Ex: Encaminhado após atendimento fraterno para Passe..."
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReferralTarget(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteReferral}
                disabled={!selectedReferralSectorId}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200"
              >
                Confirmar Transferência
              </button>
            </div>
          </motion.div>
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
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Entrada Expressa / Avulsa</h3>
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
                  Tipo de Atendimento
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
                    <Activity size={18} className={expressSectorType === 'DOUTRINARIA' ? "text-indigo-600" : "text-gray-400"} />
                    <span className="text-xs font-bold">Doutrinária</span>
                    <span className="text-[9px] text-gray-400 font-medium">Palestra</span>
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
                  placeholder="Ex: Primeira vez no centro, apenas passe"
                  className="w-full p-3 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowExpressModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateExpressTicket}
                disabled={isSubmittingExpress}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                {isSubmittingExpress ? 'Emitindo...' : 'Emitir Senha / Entrar na Fila'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
