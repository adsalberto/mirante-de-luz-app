import React, { useEffect, useState } from "react";
import { motion, Reorder, AnimatePresence } from "motion/react";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  User,
  ArrowRight,
  Filter,
  MoreVertical,
  Activity,
  Zap,
  ClipboardList,
  Printer,
  ExternalLink,
  Phone,
  MapPin,
  Heart,
  Sparkles,
  Search,
  ArrowLeft,
} from "lucide-react";
import { dataService } from "../services/dataService";
import {
  ServiceQueueEntry,
  Participant,
  Sector,
  Worker,
  formatSectorName,
} from "../types";
import { cn } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState<ServiceQueueEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveSectorId] = useState<string>("all");

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling simulation
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [q, p, s] = await Promise.all([
      dataService.getQueue(),
      dataService.getParticipants(),
      dataService.getSectors(),
    ]);

    const excludedNorms = [
      "material e patrimonio",
      "arte espirita",
      "mocidade e juventude",
      "obra e reforma",
      "recepcao e limpeza",
      "mediunica",
      "comunicacao",
      "tecnologia e informatica",
      "evangelizacao infantil",
      "acao social",
      "administrativo"
    ];

    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    const filteredSectorsList = (s || []).filter((item) => {
      if (!item.name) return true;
      const normalized = normalizeString(item.name);
      return !excludedNorms.some(
        (ex) => normalized.includes(ex) || ex.includes(normalized)
      );
    });

    const uniqueS: Sector[] = [];
    const seenNames = new Set<string>();
    filteredSectorsList.forEach((item) => {
      const normName = formatSectorName(item.name);
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        uniqueS.push({ ...item, name: normName });
      }
    });

    setSectors(uniqueS);
    setParticipants(p);

    const allowedSectorIds = uniqueS.map((x) => x.id);
    setQueue(
      q.filter(
        (x) =>
          x.status !== "FINISHED" &&
          x.status !== "CANCELLED" &&
          allowedSectorIds.includes(x.sectorId)
      )
    );
  };

  const getParticipant = (id: string) => participants.find((p) => p.id === id);
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

  const handleStartService = async (id: string) => {
    if (!canManageQueue) {
      alert("Acesso Negado: Você não tem permissão para gerenciar a fila.");
      return;
    }
    try {
      await dataService.updateQueueStatus(id, "IN_PROGRESS", currentUser!.id);
      await loadData();
    } catch (err: any) {
      console.error("Erro ao iniciar atendimento:", err);
      alert("Erro ao iniciar atendimento.");
    }
  };

  let filteredQueue =
    activeTab === "all"
      ? queue
      : queue.filter((item) => item.sectorId === activeTab);

  if (activeTab === "all") {
    // Sort so IN_PROGRESS takes priority over WAITING, then by oldest arrivalDate to maintain true chronological priority
    const sortedQueue = [...filteredQueue].sort((a, b) => {
      if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
      if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;
      const timeA = new Date(a.arrivalDate || 0).getTime();
      const timeB = new Date(b.arrivalDate || 0).getTime();
      return timeA - timeB;
    });

    const seenParticipants = new Set<string>();
    filteredQueue = sortedQueue.filter((item) => {
      if (seenParticipants.has(item.participantId)) {
        return false;
      }
      seenParticipants.add(item.participantId);
      return true;
    });
  }

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer animate-in fade-in"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Fila Digital
              </h1>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">
                AO VIVO
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-medium italic">
              Gerencie o fluxo em tempo real.
            </p>
          </div>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex overflow-x-auto no-scrollbar max-w-full touch-pan-x">
          <button
            onClick={() => setActiveSectorId("all")}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "text-gray-400 hover:bg-gray-50",
            )}
          >
            Todos
          </button>
          {sectors.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSectorId(s.id)}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                activeTab === s.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 sm:pr-4">
        {filteredQueue.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredQueue.map((item) => {
                const p = getParticipant(item.participantId);
                const s = getSector(item.sectorId);
                if (!p) return null;

                // Find all active queue entries for this participant to show their referred sectors under "Todos"
                const participantOtherEntries = queue.filter(
                  (x) => x.participantId === item.participantId,
                );
                const participantSectors = participantOtherEntries
                  .map((entry) => getSector(entry.sectorId))
                  .filter((sec): sec is Sector => !!sec);

                // Find relative queue position for this specific sector (only amongst WAITING status items)
                const targetSectorWaitingEntries = queue.filter(
                  (x) => x.sectorId === item.sectorId && x.status === "WAITING",
                );
                // Sort by priority first (true), and then by arrival date/time to find accurate position
                const sortedSectorWaiting = [
                  ...targetSectorWaitingEntries,
                ].sort((a, b) => {
                  if (a.priority && !b.priority) return -1;
                  if (!a.priority && b.priority) return 1;
                  const timeA = new Date(a.arrivalDate || 0).getTime();
                  const timeB = new Date(b.arrivalDate || 0).getTime();
                  return timeA - timeB;
                });
                const sectorQueuePosition =
                  item.status === "WAITING"
                    ? sortedSectorWaiting.findIndex((x) => x.id === item.id) + 1
                    : null;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className={cn(
                      "bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 transition-all flex flex-col gap-3.5",
                      item.status === "IN_PROGRESS"
                        ? "shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-500/20"
                        : "shadow shadow-gray-100/40 hover:shadow-lg hover:shadow-indigo-100/20",
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar Section */}
                      <div className="relative group/avatar shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shadow-indigo-200 border border-white transition-transform duration-300 group-hover/avatar:scale-105">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              className="w-full h-full object-cover rounded-[inherit]"
                              alt={p.name}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            (p.name || "?").charAt(0)
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-md shadow border border-indigo-50">
                          <Sparkles
                            size={10}
                            className="text-indigo-600 animate-pulse"
                          />
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base sm:text-lg font-bold text-indigo-950 leading-tight tracking-tight truncate mb-1"
                          title={p.name}
                        >
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {p.birthDate && (
                            <span className="flex items-center gap-1 bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold text-[9px] border border-indigo-100/30">
                              <Clock size={10} className="opacity-70" />
                              <span>
                                {Math.floor(
                                  (new Date().getTime() -
                                    new Date(p.birthDate).getTime()) /
                                    31536000000,
                                )}{" "}
                                anos
                              </span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-indigo-50/50 text-indigo-600 px-1.5 py-0.5 rounded-md font-bold text-[9px] border border-indigo-100/30">
                            <User size={10} className="opacity-70" />
                            <span>
                              {p.gender === "Feminino" ? "Feminino" : "Masculino"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-wider shadow-sm shadow-indigo-100">
                            #{item.id.slice(0, 5).toUpperCase()}
                          </span>
                        </div>

                        {/* Render referred sectors badges */}
                        {participantSectors.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {participantSectors.map((sec) => (
                              <span
                                key={sec.id}
                                className="flex items-center gap-0.5 bg-slate-50 text-indigo-800 px-1.5 py-0.5 rounded-md text-[8px] uppercase font-bold tracking-wider border border-slate-100"
                              >
                                <MapPin
                                  size={8}
                                  className="text-indigo-500 shrink-0"
                                />
                                <span className="truncate max-w-[120px]">{sec.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar & Buttons (Compact Row) */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-2">
                      <div className="flex items-center gap-1.5">
                        {item.status === "WAITING" ? (
                          <button
                            onClick={() => handleStartService(item.id)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            <Sparkles size={11} className="fill-white/20" />
                            <span>INICIAR</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-indigo-200 shadow-inner shrink-0">
                            <Activity size={11} className="animate-pulse" />
                            EM CURSO
                          </div>
                        )}
                        {sectorQueuePosition && activeTab !== "all" && (
                          <span className="flex items-center gap-1 bg-amber-500 text-white px-2 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider shadow shadow-amber-100 shrink-0 leading-none">
                            <ClipboardList size={11} />
                            <span>{sectorQueuePosition}º</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button className="flex items-center justify-center w-7 h-7 bg-white text-indigo-600 border border-indigo-100 rounded-lg hover:border-indigo-200 active:scale-90 transition-all cursor-pointer">
                          <Printer size={12} />
                        </button>
                        <button className="flex items-center justify-center w-7 h-7 bg-white text-indigo-600 border border-indigo-100 rounded-lg hover:border-indigo-200 active:scale-90 transition-all cursor-pointer">
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Info Grid - Space-Optimized and balanced */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5 border-t border-indigo-50/40">
                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50/50 rounded-xl border border-transparent">
                        <Phone size={11} className="text-indigo-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[7.5px] font-bold uppercase text-gray-400 tracking-wider">Contato</p>
                          <p className="text-[10px] font-semibold text-indigo-950 truncate">{p.phone || "Não Inf."}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50/50 rounded-xl border border-transparent">
                        <MapPin size={11} className="text-indigo-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[7.5px] font-bold uppercase text-gray-400 tracking-wider">Endereço</p>
                          <p className="text-[10px] font-semibold text-indigo-950 truncate" title={p.address}>{p.address || "Não Inf."}</p>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-2 px-2 py-1 rounded-xl border transition-all",
                        item.status === "IN_PROGRESS"
                          ? "bg-amber-50/50 border-amber-100/40 text-amber-900"
                          : "bg-emerald-50/50 border-emerald-100/40 text-emerald-900",
                      )}>
                        <div className="min-w-0 flex-1">
                          <p className="text-[7.5px] font-bold uppercase opacity-60 tracking-wider">Status</p>
                          <p className="text-[10px] font-bold truncate leading-tight">
                            {item.status === "IN_PROGRESS"
                              ? "Em Atendimento"
                              : sectorQueuePosition && activeTab !== "all"
                                ? `${sectorQueuePosition}º na Fila`
                                : "Aguardando"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-50 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center border-2 border-indigo-50 shadow-xl">
                <CheckCircle2 className="text-emerald-500" size={48} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">
                Fila Vazia!
              </h3>
              <p className="text-gray-400 font-medium mt-2 max-w-xs mx-auto">
                No momento, todos os irmãos já estão em tratamento ou
                encaminhados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
