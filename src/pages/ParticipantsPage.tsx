import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  X,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  History,
  AlertCircle,
  Lock,
  ClipboardCheck,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { dataService } from "../services/dataService";
import {
  Participant,
  Worker,
  Sector,
  Evolution,
  formatSectorName,
} from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ParticipantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeQueues, setActiveQueues] = useState<any[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "participants" | "workers" | "referrals"
  >("participants");
  const [sectorsLoaded, setSectorsLoaded] = useState(false);

  const isCoordenadorMediunico =
    currentUser?.role === "COORDENADOR" &&
    sectors.some(
      (s) => s.id === currentUser.sectorId && s.type === "MEDIUNICO",
    );
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ADM";
  const canAccessWorkers = isAdmin || isCoordenadorMediunico;

  useEffect(() => {
    if (sectorsLoaded && activeTab === "workers" && !canAccessWorkers) {
      setActiveTab("participants");
    }
  }, [activeTab, canAccessWorkers, sectorsLoaded]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [encaminhamentoFilter, setEncaminhamentoFilter] = useState("all");
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinParticipant, setCheckinParticipant] =
    useState<Participant | null>(null);
  const [selectedCheckinSectors, setSelectedCheckinSectors] = useState<
    string[]
  >([]);
  const [isCheckinPriority, setIsCheckinPriority] = useState(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);

  const [immediateSectorIds, setImmediateSectorIds] = useState<string[]>([]);
  const [immediatePriority, setImmediatePriority] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setIsModalOpen(true);
    }
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    gender: "Masculino",
    address: "",
    lgpdConsent: false,
  });

  useEffect(() => {
    loadParticipants();
    loadSectors();
    if (activeTab === "referrals") {
      loadEvolutions();
    }
  }, [activeTab]);

  const loadEvolutions = async () => {
    const evos = await dataService.getAllEvolutions();
    setEvolutions(evos || []);
  };

  const loadSectors = async () => {
    const s = await dataService.getSectors();
    const uniqueS: Sector[] = [];
    const seenNames = new Set<string>();
    s?.forEach((item) => {
      const normName = formatSectorName(item.name);
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        uniqueS.push({ ...item, name: normName });
      }
    });
    setSectors(uniqueS);
    setSectorsLoaded(true);
  };

  const loadParticipants = async () => {
    const [p, q] = await Promise.all([
      dataService.getParticipants(),
      dataService.getQueue(),
    ]);
    setParticipants(p);
    setActiveQueues(
      q.filter(
        (entry) => entry.status !== "FINISHED" && entry.status !== "CANCELLED",
      ),
    );
  };

  const handleEdit = (p: Participant) => {
    if (
      ["RECEPCIONISTA", "ATENDENTE", "VOLUNTARIO"].includes(
        currentUser?.role || "",
      )
    ) {
      alert(
        "Ação não permitida: Seu perfil atual não possui privilégios para esta operação.",
      );
      return;
    }
    setEditingParticipant(p);
    setFormData({
      name: p.name || "",
      phone: p.phone || "",
      birthDate: p.birthDate || "",
      gender: p.gender || "Masculino",
      address: p.address || "",
      lgpdConsent: !!p.lgpdConsent,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      ["RECEPCIONISTA", "ATENDENTE", "VOLUNTARIO"].includes(
        currentUser?.role || "",
      )
    ) {
      alert(
        "Ação não permitida: Seu perfil atual não possui privilégios para esta operação.",
      );
      return;
    }
    if (deletingId === id) {
      try {
        await dataService.deleteParticipant(id);
        setDeletingId(null);
        loadParticipants();
        alert("Cadastro excluído com sucesso!");
      } catch (err: any) {
        console.error("Erro ao excluir participante:", err);
        alert("Erro ao excluir cadastro. Por favor, verifique suas permissões.");
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lgpdConsent) {
      alert("É necessário aceitar os termos da LGPD para continuar.");
      return;
    }

    try {
      if (editingParticipant) {
        await dataService.updateParticipant({
          ...editingParticipant,
          ...formData,
          isWorker: editingParticipant.isWorker,
        });
        alert(
          editingParticipant.isWorker
            ? "Dados do trabalhador atualizados com sucesso!"
            : "Dados do atendido atualizados com sucesso!",
        );
      } else {
        const created = await dataService.addParticipant({
          ...formData,
          isWorker: activeTab === "workers",
          lgpdDate: Date.now(),
        });

        if (created && !created.isWorker && immediateSectorIds.length > 0) {
          await Promise.all(
            immediateSectorIds.map((sectorId) =>
              dataService.addToQueue({
                participantId: created.id,
                sectorId: sectorId,
                priority: immediatePriority,
              }),
            ),
          );
          alert(
            `Novo atendido cadastrado e incluído em ${immediateSectorIds.length} fila(s) de espera com sucesso!`,
          );
        } else {
          alert(
            activeTab === "workers"
              ? "Trabalhador cadastrado no setor mediúnico com sucesso!"
              : "Novo atendido cadastrado com sucesso!",
          );
        }
      }

      setFormData({
        name: "",
        phone: "",
        birthDate: "",
        gender: "Masculino",
        address: "",
        lgpdConsent: false,
      });
      setImmediateSectorIds([]);
      setImmediatePriority(false);
      setEditingParticipant(null);
      setIsModalOpen(false);
      await loadParticipants();
    } catch (err: any) {
      console.error("Erro ao salvar atendido:", err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || "Sem permissão"}`);
      } catch {
        alert("Ocorreu um erro ao salvar os dados.");
      }
    }
  };

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (activeTab === "workers") {
      return p.isWorker === true;
    } else if (activeTab === "participants") {
      return !p.isWorker;
    }
    return true; // referrals shows all or does something else
  });

  return (
    <div className="p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {activeTab === "workers" && (
            <button
              onClick={() => setActiveTab("participants")}
              className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-2"
            >
              <ArrowLeft size={16} /> Voltar para Atendidos
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === "participants"
              ? "Atendidos"
              : activeTab === "workers"
                ? "Trabalhadores"
                : "Visão de Encaminhamentos"}
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            {activeTab === "participants"
              ? "Gerenciamento de irmãos e irmãs assistidos."
              : activeTab === "workers"
                ? "Gerenciamento de trabalhadores em atendimento do setor mediúnico."
                : "Lista consolidada de todas as recomendações e destinos."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab("participants")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                activeTab === "participants"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              Atendidos
            </button>
            {canAccessWorkers && (
              <button
                onClick={() => setActiveTab("workers")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                  activeTab === "workers"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Trabalhadores
              </button>
            )}
            {(currentUser?.role === "ADMIN" ||
              currentUser?.role === "ADM" ||
              (currentUser?.position &&
                [
                  "Presidente(s)",
                  "Vice-presidente(s)",
                  "1º Secretário(a)",
                  "Secretário(a) de Planejamento",
                ].includes(currentUser.position))) && (
              <button
                onClick={() => setActiveTab("referrals")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                  activeTab === "referrals"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Encaminhamentos
              </button>
            )}
          </div>
          {(currentUser?.role === "ADMIN" ||
            currentUser?.role === "ADM" ||
            currentUser?.role === "COORDENADOR" ||
            currentUser?.role === "RECEPCIONISTA" ||
            currentUser?.role === "SECRETARIO") &&
            (activeTab === "participants" ||
              (activeTab === "workers" && canAccessWorkers)) && (
              <button
                id="open-register-modal"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <UserPlus size={20} />
                <span>Novo Cadastro</span>
              </button>
            )}
        </div>
      </header>

      {activeTab === "participants" || activeTab === "workers" ? (
        <>
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
              size={20}
            />
            <input
              id="participant-search"
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100">
                        {(p.name || "?").charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                              p.currentStatus === "IDLE"
                                ? "bg-gray-50 text-gray-400 border-gray-100"
                                : p.currentStatus === "WAITING"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : p.currentStatus === "IN_SERVICE"
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                    : p.currentStatus === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      : "bg-blue-50 text-blue-600 border-blue-100",
                            )}
                          >
                            {p.currentStatus === "IDLE"
                              ? "Livre"
                              : p.currentStatus === "WAITING"
                                ? "Em Espera"
                                : p.currentStatus === "IN_SERVICE"
                                  ? "Em Atendimento"
                                  : p.currentStatus === "COMPLETED"
                                    ? "Concluído"
                                    : p.currentStatus === "REFERRERED"
                                      ? "Encaminhado"
                                      : p.currentStatus}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                              p.gender === "Masculino" || p.gender === "M"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : p.gender === "Feminino" || p.gender === "F"
                                  ? "bg-pink-50 text-pink-600 border-pink-100"
                                  : "bg-gray-50 text-gray-400 border-gray-100",
                            )}
                          >
                            {p.gender === "Masculino" || p.gender === "M"
                              ? "Masc"
                              : p.gender === "Feminino" || p.gender === "F"
                                ? "Fem"
                                : p.gender || "N/I"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentUser?.role !== "RECEPCIONISTA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/atendimentos?participantId=${p.id}`);
                          }}
                          title="Abrir Prontuário"
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <History size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckinParticipant(p);
                          setIsCheckinModalOpen(true);
                          setSelectedCheckinSectors([]);
                        }}
                        title="Entrar na Fila"
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      {currentUser?.role !== "RECEPCIONISTA" &&
                        currentUser?.role !== "ATENDENTE" &&
                        currentUser?.role !== "VOLUNTARIO" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(p);
                              }}
                              className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className={cn(
                                "p-2 transition-all rounded-lg flex items-center gap-1",
                                deletingId === p.id
                                  ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1"
                                  : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100",
                              )}
                            >
                              {deletingId === p.id ? (
                                "Confirma?"
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-300" />
                      <span>{p.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-300" />
                      <span>Nascimento: {p.birthDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-300" />
                      <span className="truncate">{p.address}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-[10px]">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-emerald-600 font-bold uppercase tracking-tight">
                        LGPD: Aceito em {format(p.lgpdDate, "dd/MM/yyyy")}
                      </span>
                    </div>

                    {/* Active Service Notification Area */}
                    {activeQueues.filter((q) => q.participantId === p.id)
                      .length > 0 && (
                      <div className="pt-2">
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-tighter">
                          <AlertCircle size={12} />
                          Atendimento Ativo:{" "}
                          {activeQueues
                            .filter((aq) => aq.participantId === p.id)
                            .map(
                              (aq) =>
                                sectors.find((s) => s.id === aq.sectorId)?.name,
                            )
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentUser?.role !== "RECEPCIONISTA" && (
                    <button
                      onClick={() =>
                        navigate(`/atendimentos?participantId=${p.id}`)
                      }
                      className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 font-bold rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                    >
                      <span>Ver Prontuário</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Search className="text-gray-300" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-400">
                    Nenhum resultado
                  </h3>
                  <p className="text-gray-400">
                    Tente buscar por outro termo ou cadastre um novo atendido.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEncaminhamentoFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  encaminhamentoFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-100",
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setEncaminhamentoFilter("Doutrinária")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  encaminhamentoFilter === "Doutrinária"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-100",
                )}
              >
                Doutrinária
              </button>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Total:{" "}
              {
                evolutions.filter(
                  (e) =>
                    encaminhamentoFilter === "all" ||
                    e.encaminhamento === encaminhamentoFilter,
                ).length
              }{" "}
              registros
            </div>
          </div>

             {/* Mobile View: Custom Card List (shows on small screens only) */}
          <div className="md:hidden space-y-4">
            {evolutions
              .filter(
                (e) =>
                  encaminhamentoFilter === "all" ||
                  e.encaminhamento === encaminhamentoFilter,
              )
              .map((evo) => {
                const participant = participants.find(
                  (p) => p.id === evo.participantId,
                );
                const sector = sectors.find((s) => s.id === evo.sectorId);
                return (
                  <div
                    key={evo.id}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 leading-tight">
                          {participant?.name || "Não identificado"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">
                          ID: {evo.participantId.substring(0, 8)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-gray-700">
                          {format(evo.date, "dd/MM/yyyy")}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {format(evo.date, "HH:mm")}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-16">Origem:</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                          {sector?.name || "Outro"}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-16 pt-0.5">Destino:</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {currentUser?.role !== "RECEPCIONISTA" &&
                            evo.encaminhamento && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                                {evo.encaminhamento}
                              </span>
                            )}
                          {(evo.nextStepSectorIds || []).map((sid) => {
                            const targetSector = sectors.find(
                              (s) => s.id === sid,
                            );
                            return (
                              <span
                                key={sid}
                                className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100"
                              >
                                {targetSector?.name || "Setor"}
                              </span>
                            );
                          })}
                          {currentUser?.role === "RECEPCIONISTA" &&
                            (!evo.nextStepSectorIds ||
                              evo.nextStepSectorIds.length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">
                                Dispensado
                              </span>
                            )}
                          {currentUser?.role !== "RECEPCIONISTA" &&
                            !evo.encaminhamento &&
                            (!evo.nextStepSectorIds ||
                              evo.nextStepSectorIds.length === 0) && (
                              <span className="text-[10px] text-gray-400 italic font-medium">
                                Nenhum
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {currentUser?.role !== "RECEPCIONISTA" && (
                      <div className="pt-2 border-t border-gray-50 flex justify-end">
                        <button
                          onClick={() =>
                            navigate(
                              `/atendimentos?participantId=${evo.participantId}`,
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                        >
                          <History size={14} />
                          <span>Ver Prontuário</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Desktop View: Responsive Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Atendido</th>
                    <th className="px-6 py-4">Origem</th>
                    <th className="px-6 py-4">Encaminhamento</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {evolutions
                    .filter(
                      (e) =>
                        encaminhamentoFilter === "all" ||
                        e.encaminhamento === encaminhamentoFilter,
                    )
                    .map((evo) => {
                      const participant = participants.find(
                        (p) => p.id === evo.participantId,
                      );
                      const sector = sectors.find((s) => s.id === evo.sectorId);
                      return (
                        <tr
                          key={evo.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-gray-700">
                              {format(evo.date, "dd/MM/yyyy")}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {format(evo.date, "HH:mm")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {participant?.name || "Não identificado"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                              ID: {evo.participantId.substring(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                              {sector?.name || "Outro"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {currentUser?.role !== "RECEPCIONISTA" &&
                                evo.encaminhamento && (
                                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                                    {evo.encaminhamento}
                                  </span>
                                )}
                              {(evo.nextStepSectorIds || []).map((sid) => {
                                const targetSector = sectors.find(
                                  (s) => s.id === sid,
                                );
                                return (
                                  <span
                                    key={sid}
                                    className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100"
                                  >
                                    {targetSector?.name || "Setor"}
                                  </span>
                                );
                              })}
                              {currentUser?.role === "RECEPCIONISTA" &&
                                (!evo.nextStepSectorIds ||
                                  evo.nextStepSectorIds.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Dispensado
                                  </span>
                                )}
                              {currentUser?.role !== "RECEPCIONISTA" &&
                                !evo.encaminhamento &&
                                (!evo.nextStepSectorIds ||
                                  evo.nextStepSectorIds.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Nenhum
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {currentUser?.role !== "RECEPCIONISTA" && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/atendimentos?participantId=${evo.participantId}`,
                                  )
                                }
                                className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                              >
                                <History size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {evolutions.filter(
            (e) =>
              encaminhamentoFilter === "all" ||
              e.encaminhamento === encaminhamentoFilter,
          ).length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-50 p-20 text-center text-gray-400 font-medium italic shadow-sm w-full">
              Nenhum encaminhamento encontrado no período.
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {isCheckinModalOpen && checkinParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckinModalOpen(false)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">
                    Check-in na Fila
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    Encaminhar {checkinParticipant.name} para atendimento.
                  </p>
                </div>
                <button
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (selectedCheckinSectors.length === 0) {
                    alert(
                      "Por favor, selecione pelo menos um setor de destino.",
                    );
                    return;
                  }
                  setIsCheckinLoading(true);
                  try {
                    await Promise.all(
                      selectedCheckinSectors.map((sectorId) =>
                        dataService.addToQueue({
                          participantId: checkinParticipant.id,
                          sectorId: sectorId,
                          priority: isCheckinPriority,
                        }),
                      ),
                    );
                    alert(
                      `Encaminhado para as filas (${selectedCheckinSectors.length} setores) com sucesso!`,
                    );
                    setIsCheckinModalOpen(false);
                    loadParticipants();
                  } catch (err) {
                    console.error("Erro ao fazer check-in:", err);
                    alert("Erro ao encaminhar para as filas.");
                  } finally {
                    setIsCheckinLoading(false);
                  }
                }}
                className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-indigo-600 tracking-wider ml-1">
                    Selecionar Setores de Destino (Marque um ou mais)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    {sectors
                      .filter((s) => s.type !== "ADMINISTRATIVO")
                      .map((s) => {
                        const isChecked = selectedCheckinSectors.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedCheckinSectors(
                                  selectedCheckinSectors.filter(
                                    (id) => id !== s.id,
                                  ),
                                );
                              } else {
                                setSelectedCheckinSectors([
                                  ...selectedCheckinSectors,
                                  s.id,
                                ]);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer bg-white active:scale-95 select-none",
                              isChecked
                                ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                                : "border-gray-200 hover:border-indigo-150",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                isChecked
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-gray-300",
                              )}
                            >
                              {isChecked && <ClipboardCheck size={12} />}
                            </div>
                            <span className="text-xs font-bold text-gray-800 leading-tight">
                              {s.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div
                  className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 group cursor-pointer"
                  onClick={() => setIsCheckinPriority(!isCheckinPriority)}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      isCheckinPriority
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-amber-200",
                    )}
                  >
                    {isCheckinPriority && <ClipboardCheck size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">
                      Atendimento Prioritário
                    </p>
                    <p className="text-[10px] text-amber-700/70 font-medium">
                      Idosos, gestantes, pessoas com deficiência ou crianças.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCheckinModalOpen(false)}
                    className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckinLoading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckinLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Confirmar</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden shadow-indigo-900/20 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingParticipant ? "Editar Cadastro" : "Novo Cadastro"}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Preencha os dados com fraternidade e atenção.
                  </p>
                </div>
                <button
                  id="close-modal-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingParticipant(null);
                  }}
                  className="p-2 hover:bg-white rounded-full transition-colors active:scale-90"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Nome Completo
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Alan Kardec de Moraes"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="(71) 90000-0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Data de Nascimento
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Sexo
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Endereço de Residência
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
                      placeholder="Rua, Número, Bairro e CEP"
                    />
                  </div>
                </div>

                {!editingParticipant && activeTab === "participants" && (
                  <div className="space-y-4 p-6 bg-gray-50 rounded-[28px] border border-gray-100/50">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        className="text-indigo-600 animate-pulse"
                      />
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                        Direcionamento de Chegada (Opcional)
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                      Direcione a pessoa que chegou à casa imediatamente para
                      assistir palestra doutrinária, tomar passe, ou atendimento
                      fraterno.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                          Setores de Destino (Marque um ou mais)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-gray-200">
                          {sectors
                            .filter((s) => s.type !== "ADMINISTRATIVO")
                            .map((s) => {
                              const isChecked = immediateSectorIds.includes(
                                s.id,
                              );
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setImmediateSectorIds(
                                        immediateSectorIds.filter(
                                          (id) => id !== s.id,
                                        ),
                                      );
                                    } else {
                                      setImmediateSectorIds([
                                        ...immediateSectorIds,
                                        s.id,
                                      ]);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer bg-white active:scale-98 select-none",
                                    isChecked
                                      ? "border-indigo-600 bg-indigo-50/10 text-indigo-900"
                                      : "border-gray-150 hover:border-indigo-100 text-gray-700",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                                      isChecked
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-gray-300",
                                    )}
                                  >
                                    {isChecked && <ClipboardCheck size={10} />}
                                  </div>
                                  <span className="text-[11px] font-bold leading-none">
                                    {s.name}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {immediateSectorIds.length > 0 && (
                        <div
                          className="flex items-center gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-100 group cursor-pointer col-span-1 md:col-span-2"
                          onClick={() =>
                            setImmediatePriority(!immediatePriority)
                          }
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                              immediatePriority
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-amber-200",
                            )}
                          >
                            {immediatePriority && <ClipboardCheck size={12} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-amber-900 leading-none">
                              Atendimento Prioritário
                            </p>
                            <p className="text-[9px] text-amber-700/70 font-medium mt-1 leading-none">
                              Idosos, gestantes, etc.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      id="lgpd-consent"
                      type="checkbox"
                      checked={formData.lgpdConsent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lgpdConsent: e.target.checked,
                        })
                      }
                      className="w-6 h-6 rounded-lg border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 checked:bg-indigo-600 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lgpd-consent"
                      className="text-sm font-bold text-indigo-900 cursor-pointer"
                    >
                      Termo de Consentimento (LGPD)
                    </label>
                    <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
                      Eu autorizo o Centro Espírita Mirante de Luz a tratar meus
                      dados pessoais e sensíveis (especialmente anotações de
                      cunho espiritual) para fins de tratamento e acompanhamento
                      fraterno, em conformidade com a Lei Geral de Proteção de
                      Dados.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    id="cancel-register"
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingParticipant(null);
                    }}
                    className="w-full py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all active:scale-95"
                  >
                    Descartar
                  </button>
                  <button
                    id="save-participant"
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>
                      {editingParticipant
                        ? "Salvar Alterações"
                        : "Salvar Cadastro"}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
