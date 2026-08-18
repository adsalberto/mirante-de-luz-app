import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  X,
  ChevronRight,
  Mic2,
  Trash2,
  CalendarDays,
  Pencil,
  Check,
  ArrowLeft,
  Search,
  Filter,
  Printer,
  Share2,
  Tv,
  ExternalLink,
  Users,
  AlertTriangle,
  Copy,
  Sparkles,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { dataService } from "../services/dataService";
import {
  AgendaEvent,
  Speaker,
  AGENDA_EVENT_TYPE_LABELS,
} from "../types";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"events" | "speakers">("events");

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingSpeakerId, setDeletingSpeakerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "DOUTRINARIA" as AgendaEvent["type"],
    speakerId: "",
    location: "Auditório Principal",
    responsible: "",
    streamUrl: "",
  });

  const [speakerFormData, setSpeakerFormData] = useState({
    name: "",
    phone: "",
    email: "",
    spiritistCenter: "",
    observations: "",
  });

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

  useEffect(() => {
    if (currentUser && currentUser.role === "RECEPCIONISTA") {
      navigate("/");
      return;
    }

    setIsLoading(true);

    // Real-time listeners
    const unsubEvents = dataService.subscribeToAgendaEvents((evs) => {
      const sorted = [...(evs || [])].sort((a, b) => a.date - b.date);
      setEvents(sorted);
      setIsLoading(false);
    });

    const unsubSpeakers = dataService.subscribeToSpeakers((spks) => {
      setSpeakers(spks || []);
      setIsLoading(false);
    });

    return () => {
      unsubEvents();
      unsubSpeakers();
    };
  }, [currentUser, navigate]);

  // Safe local date conversion from string YYYY-MM-DD
  const parseLocalDateToTimestamp = (dateStr: string): number => {
    if (!dateStr) return Date.now();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0).getTime();
    }
    return new Date(dateStr).getTime();
  };

  // Safe local timestamp conversion to YYYY-MM-DD string for <input type="date">
  const timestampToLocalDateString = (ts: number): string => {
    if (!ts) return "";
    const d = new Date(ts);
    if (!isValid(d)) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getEventStatus = (eventDate: number, eventTime: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const eventMidnight = new Date(eventDate);
    const eventMidnightTime = new Date(
      eventMidnight.getFullYear(),
      eventMidnight.getMonth(),
      eventMidnight.getDate()
    ).getTime();

    if (eventMidnightTime < today) {
      return "FINALIZADO";
    } else if (eventMidnightTime === today) {
      if (eventTime) {
        try {
          const [hours, minutes] = eventTime.split(":").map(Number);
          const eventFullDate = new Date(
            eventMidnight.getFullYear(),
            eventMidnight.getMonth(),
            eventMidnight.getDate(),
            hours,
            minutes
          );
          const bufferTime = eventFullDate.getTime() + 2 * 60 * 60 * 1000;
          if (now.getTime() > bufferTime) {
            return "FINALIZADO";
          }
        } catch {
          // Fallback
        }
      }
      return "HOJE";
    } else {
      const threeDaysFromNow = today + 3 * 24 * 60 * 60 * 1000;
      if (eventMidnightTime <= threeDaysFromNow) {
        return "EM_BREVE";
      }
      return "AGENDADO";
    }
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: timestampToLocalDateString(event.date),
      time: event.time || "",
      type: event.type || "DOUTRINARIA",
      speakerId: event.speakerId || "",
      location: event.location || "Auditório Principal",
      responsible: event.responsible || "",
      streamUrl: event.streamUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleEditSpeaker = (s: Speaker) => {
    setEditingSpeaker(s);
    setSpeakerFormData({
      name: s.name || "",
      phone: s.phone || "",
      email: s.email || "",
      spiritistCenter: s.spiritistCenter || "",
      observations: s.observations || "",
    });
    setIsSpeakerModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetSpeaker = speakers.find((s) => s.id === formData.speakerId);
      const eventData = {
        ...formData,
        date: parseLocalDateToTimestamp(formData.date),
        speakerName: targetSpeaker ? targetSpeaker.name : "",
      };

      if (editingEvent) {
        await dataService.updateAgendaEvent({ ...editingEvent, ...eventData });
        alert("Atividade atualizada com sucesso!");
      } else {
        await dataService.addAgendaEvent(eventData);
        alert("Atividade agendada com sucesso!");
      }

      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        type: "DOUTRINARIA",
        speakerId: "",
        location: "Auditório Principal",
        responsible: "",
        streamUrl: "",
      });
      setEditingEvent(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar atividade:", err);
      alert("Ocorreu um erro ao salvar a atividade.");
    }
  };

  const handleSpeakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpeaker) {
        await dataService.updateSpeaker({
          ...editingSpeaker,
          ...speakerFormData,
        });
        alert("Palestrante atualizado com sucesso!");
      } else {
        await dataService.addSpeaker(speakerFormData);
        alert("Palestrante cadastrado com sucesso!");
      }

      setSpeakerFormData({
        name: "",
        phone: "",
        email: "",
        spiritistCenter: "",
        observations: "",
      });
      setEditingSpeaker(null);
      setIsSpeakerModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar palestrante:", err);
      alert("Ocorreu um erro ao salvar os dados do palestrante.");
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      try {
        await dataService.deleteAgendaEvent(id);
        setDeletingId(null);
        alert("Evento excluído com sucesso!");
      } catch (err: any) {
        console.error("Erro ao excluir evento:", err);
        alert("Erro ao excluir evento.");
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleDeleteSpeaker = async (id: string) => {
    // Check if speaker has upcoming events
    const now = Date.now();
    const upcomingTalks = events.filter(
      (e) => e.speakerId === id && e.date >= now - 24 * 60 * 60 * 1000
    );

    if (deletingSpeakerId === id) {
      try {
        await dataService.deleteSpeaker(id);
        setDeletingSpeakerId(null);
        alert("Palestrante excluído com sucesso!");
      } catch (err: any) {
        console.error("Erro ao excluir palestrante:", err);
        alert("Erro ao excluir palestrante.");
      }
    } else {
      if (upcomingTalks.length > 0) {
        alert(
          `Atenção: Este palestrante possui ${upcomingTalks.length} atividade(s) futura(s) agendada(s). Clique novamente em excluir para confirmar.`
        );
      }
      setDeletingSpeakerId(id);
      setTimeout(() => setDeletingSpeakerId(null), 4000);
    }
  };

  const getSpeaker = (id?: string) => speakers.find((s) => s.id === id);

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const spk = getSpeaker(ev.speakerId);
      const spkName = spk ? spk.name.toLowerCase() : (ev.speakerName || "").toLowerCase();
      const matchTitle = ev.title ? ev.title.toLowerCase().includes(term) : false;
      const matchDesc = ev.description ? ev.description.toLowerCase().includes(term) : false;
      const matchLocation = ev.location ? ev.location.toLowerCase().includes(term) : false;
      const matchSpeaker = spkName.includes(term);

      if (!matchTitle && !matchDesc && !matchLocation && !matchSpeaker) return false;
    }

    // Type filter
    if (typeFilter !== "ALL" && ev.type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== "ALL") {
      const st = getEventStatus(ev.date, ev.time);
      if (statusFilter === "UPCOMING" && st === "FINALIZADO") return false;
      if (statusFilter === "HOJE" && st !== "HOJE") return false;
      if (statusFilter === "FINALIZADO" && st !== "FINALIZADO") return false;
    }

    return true;
  });

  // Filtered Speakers
  const filteredSpeakers = speakers.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.spiritistCenter && s.spiritistCenter.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term))
    );
  });

  // Export PDF Bulletin
  const exportBulletinPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text("CENTRO ESPÍRITA MIRANTE DE LUZ", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.setFont("helvetica", "bold");
      doc.text("BOLETIM DE PROGRAMAÇÃO E ATIVIDADES", 105, 27, { align: "center" });

      doc.setDrawColor(220);
      doc.line(14, 32, 196, 32);

      const tableData = filteredEvents.map((ev) => {
        const spk = getSpeaker(ev.speakerId);
        const speakerTxt = spk
          ? `${spk.name} (${spk.spiritistCenter || "CEMIL"})`
          : ev.speakerName || "Equipe da Casa";
        const dateTxt = format(ev.date, "dd/MM/yyyy (EEE)", { locale: ptBR });
        const typeTxt = AGENDA_EVENT_TYPE_LABELS[ev.type] || ev.type;

        return [
          `${dateTxt}\n${ev.time || "H:N"}`,
          typeTxt,
          `${ev.title}\n${ev.description ? `"${ev.description}"` : ""}`,
          speakerTxt,
          ev.location || "Auditório",
        ];
      });

      if (tableData.length > 0) {
        autoTable(doc, {
          startY: 38,
          head: [["Data/Hora", "Tipo", "Atividade & Tema", "Palestrante / Resp.", "Local"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 26 },
            2: { cellWidth: 62 },
            3: { cellWidth: 42 },
            4: { cellWidth: 22 },
          },
        });
      } else {
        doc.setFontSize(10);
        doc.text("Nenhuma atividade encontrada para os filtros selecionados.", 20, 45);
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
          105,
          285,
          { align: "center" }
        );
      }

      doc.save(`Programacao_CEMIL_${format(new Date(), "MM_yyyy")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF da programação.");
    }
  };

  // Copy WhatsApp Bulletin
  const copyWhatsAppBulletin = () => {
    if (filteredEvents.length === 0) {
      alert("Nenhuma atividade para copiar no momento.");
      return;
    }

    let text = `✨ *CENTRO ESPÍRITA MIRANTE DE LUZ* ✨\n`;
    text += `📅 *PROGRAMAÇÃO DE ATIVIDADES*\n`;
    text += `----------------------------------------\n\n`;

    filteredEvents.forEach((ev) => {
      const dateTxt = format(ev.date, "dd/MM/yyyy (EEEE)", { locale: ptBR });
      const spk = getSpeaker(ev.speakerId);
      const speakerTxt = spk
        ? `${spk.name} (${spk.spiritistCenter || "CEMIL"})`
        : ev.speakerName || "Equipe da Casa";

      text += `🔹 *${dateTxt}* às *${ev.time || "19:30"}*\n`;
      text += `📌 *${ev.title}* (${AGENDA_EVENT_TYPE_LABELS[ev.type] || ev.type})\n`;
      if (ev.description) text += `📖 *Tema:* ${ev.description}\n`;
      if (ev.speakerId || ev.speakerName) text += `🗣️ *Palestrante:* ${speakerTxt}\n`;
      if (ev.location) text += `📍 *Local:* ${ev.location}\n`;
      if (ev.streamUrl) text += `🎥 *Ao Vivo:* ${ev.streamUrl}\n`;
      text += `\n`;
    });

    text += `----------------------------------------\n`;
    text += `🙏 *Venha participar e reabastecer suas energias fraternas!*`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Programação copiada para a área de transferência! Cole no seu WhatsApp.");
      })
      .catch(() => {
        alert("Não foi possível copiar automaticamente. Tente novamente.");
      });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-white/50 min-h-[60vh]">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <p className="text-gray-500 font-bold tracking-tight">Carregando Agenda da Casa...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Agenda da Casa
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium font-serif italic">
              Controle de doutrinárias, estudos, festas e palestras públicas.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("events")}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                activeTab === "events"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Atividades ({events.length})
            </button>
            <button
              onClick={() => setActiveTab("speakers")}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
                activeTab === "speakers"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Palestrantes ({speakers.length})
            </button>
          </div>

          {/* Bulletin Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportBulletinPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-2xl font-bold text-xs hover:bg-indigo-50 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Gerar PDF da Programação"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Boletim PDF</span>
            </button>

            <button
              onClick={copyWhatsAppBulletin}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Copiar texto formatado para WhatsApp"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {isAdmin && (
              <button
                onClick={() =>
                  activeTab === "events"
                    ? setIsModalOpen(true)
                    : setIsSpeakerModalOpen(true)
                }
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <Plus size={18} />
                <span>
                  {activeTab === "events"
                    ? "Marcar Atividade"
                    : "Cadastrar Palestrante"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={
                activeTab === "events"
                  ? "Buscar por título, tema, palestrante ou local..."
                  : "Buscar palestrante por nome, centro ou e-mail..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 py-3 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
            />
          </div>

          {activeTab === "events" && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter */}
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 pl-3">Tipo:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none pr-3 cursor-pointer"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="DOUTRINARIA">Doutrinária</option>
                  <option value="ESTUDO">Estudos</option>
                  <option value="FESTA">Festa/Evento</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 pl-3">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 outline-none pr-3 cursor-pointer"
                >
                  <option value="ALL">Todos</option>
                  <option value="UPCOMING">Próximos & Hoje</option>
                  <option value="HOJE">Hoje</option>
                  <option value="FINALIZADO">Concluídos</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === "events" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const status = getEventStatus(event.date, event.time);
              const spk = getSpeaker(event.speakerId);

              return (
                <motion.div
                  layout
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col group overflow-hidden relative",
                    status === "FINALIZADO" && "opacity-75 hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "p-6 flex flex-col gap-4 flex-1",
                      event.type === "DOUTRINARIA"
                        ? "bg-indigo-50/30"
                        : event.type === "ESTUDO"
                        ? "bg-emerald-50/30"
                        : event.type === "FESTA"
                        ? "bg-pink-50/30"
                        : "bg-gray-50/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                            event.type === "DOUTRINARIA"
                              ? "bg-indigo-100 text-indigo-700"
                              : event.type === "ESTUDO"
                              ? "bg-emerald-100 text-emerald-700"
                              : event.type === "FESTA"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-200 text-gray-700"
                          )}
                        >
                          {AGENDA_EVENT_TYPE_LABELS[event.type] || event.type}
                        </span>

                        {status === "FINALIZADO" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200/40">
                            <Check size={10} className="stroke-[3]" /> Concluído
                          </span>
                        )}
                        {status === "HOJE" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-amber-500 text-white border border-amber-600 rounded-lg animate-pulse shadow-sm font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping" />{" "}
                            HOJE
                          </span>
                        )}
                        {status === "EM_BREVE" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500 text-white border border-emerald-600 shadow-sm">
                            Em Breve
                          </span>
                        )}
                        {status === "AGENDADO" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-indigo-50/80 text-indigo-600 border border-indigo-100">
                            Agendado
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className={cn(
                              "p-2 transition-all rounded-lg flex items-center gap-1",
                              deletingId === event.id
                                ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1"
                                : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            )}
                          >
                            {deletingId === event.id ? (
                              "Confirma?"
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-black text-gray-900 tracking-tight leading-tight line-clamp-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-xs text-gray-500 font-medium line-clamp-3 leading-relaxed mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-4 space-y-2 border-t border-gray-100/60">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-indigo-500" />
                          <span>
                            {format(event.date, "EEEE, dd 'de' MMMM", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={14} />
                          <span>{event.time}</span>
                        </div>
                      </div>

                      {(spk || event.speakerName || event.speakerId) && (
                        <div className="flex items-center justify-between gap-2 text-xs font-bold text-indigo-700 bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100/50 mt-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mic2 size={16} className="shrink-0 text-indigo-600" />
                            <span className="truncate">
                              {spk
                                ? `${spk.name} (${spk.spiritistCenter || "CEMIL"})`
                                : event.speakerName || "Palestrante Cadastrado"}
                            </span>
                          </div>
                        </div>
                      )}

                      {event.streamUrl && (
                        <a
                          href={event.streamUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                        >
                          <Tv size={14} />
                          <span className="truncate">Transmissão ao Vivo</span>
                          <ExternalLink size={12} className="ml-auto" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <CalendarIcon className="text-gray-300" size={40} />
              </div>
              <p className="text-gray-400 font-bold">
                Nenhuma atividade encontrada com os filtros selecionados.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Speakers Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSpeakers.length > 0 ? (
            filteredSpeakers.map((s) => {
              const speakerEvents = events.filter((e) => e.speakerId === s.id);
              const upcomingCount = speakerEvents.filter(
                (e) => getEventStatus(e.date, e.time) !== "FINALIZADO"
              ).length;

              return (
                <motion.div
                  layout
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-100 font-black text-xl">
                        {(s.name || "?").charAt(0)}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSpeaker(s)}
                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSpeaker(s.id)}
                            className={cn(
                              "p-2 transition-all rounded-lg flex items-center gap-1",
                              deletingSpeakerId === s.id
                                ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1"
                                : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            )}
                          >
                            {deletingSpeakerId === s.id ? (
                              "Confirma?"
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                      {s.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-4 bg-indigo-50 px-3 py-1 rounded-full w-fit border border-indigo-100">
                      <Building2 size={12} />
                      <span>{s.spiritistCenter || "Centro Espírita"}</span>
                    </div>

                    <div className="space-y-2 text-xs text-gray-500 font-medium mb-6">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span>{s.phone || "Não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate">{s.email || "Não informado"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold">
                      Palestras na Casa:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 font-black px-2.5 py-1 rounded-xl text-[10px]">
                        Total: {speakerEvents.length}
                      </span>
                      {upcomingCount > 0 && (
                        <span className="bg-indigo-600 text-white font-black px-2.5 py-1 rounded-xl text-[10px] shadow-sm">
                          Próximas: {upcomingCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200">
              Nenhum palestrante encontrado.
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      <AnimatePresence>
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
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 sm:p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingEvent ? "Editar Atividade" : "Agendar Atividade"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Título da Atividade
                  </label>
                  <input
                    required
                    placeholder="Ex: Palestra Pública Doutrinária"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Data
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Horário
                    </label>
                    <input
                      required
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as AgendaEvent["type"],
                        })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none font-bold text-gray-700 rounded-2xl outline-none text-sm cursor-pointer"
                    >
                      <option value="DOUTRINARIA">Doutrinária</option>
                      <option value="ESTUDO">Estudos</option>
                      <option value="FESTA">Festa/Evento</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Palestrante
                    </label>
                    <select
                      value={formData.speakerId}
                      onChange={(e) =>
                        setFormData({ ...formData, speakerId: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none font-bold text-gray-700 rounded-2xl outline-none text-sm cursor-pointer"
                    >
                      <option value="">Nenhum/Interno</option>
                      {speakers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.spiritistCenter || "CEMIL"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Tema / Descrição
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrição detalhada ou tema da palestra..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Local
                    </label>
                    <input
                      placeholder="Ex: Auditório Principal"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Link da Transmissão (Opção Live)
                    </label>
                    <input
                      placeholder="Ex: https://youtube.com/..."
                      value={formData.streamUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, streamUrl: e.target.value })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 sm:py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm cursor-pointer"
                  >
                    Salvar Atividade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Speaker Modal */}
        {isSpeakerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSpeakerModalOpen(false)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 sm:p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingSpeaker ? "Editar Palestrante" : "Novo Palestrante"}
                </h2>
                <button
                  onClick={() => {
                    setIsSpeakerModalOpen(false);
                    setEditingSpeaker(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSpeakerSubmit}
                className="p-5 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Nome Completo
                  </label>
                  <input
                    required
                    value={speakerFormData.name}
                    onChange={(e) =>
                      setSpeakerFormData({
                        ...speakerFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Telefone
                    </label>
                    <input
                      required
                      value={speakerFormData.phone}
                      onChange={(e) =>
                        setSpeakerFormData({
                          ...speakerFormData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      E-mail
                    </label>
                    <input
                      required
                      type="email"
                      value={speakerFormData.email}
                      onChange={(e) =>
                        setSpeakerFormData({
                          ...speakerFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Centro Espírita de Origem
                  </label>
                  <input
                    required
                    value={speakerFormData.spiritistCenter}
                    onChange={(e) =>
                      setSpeakerFormData({
                        ...speakerFormData,
                        spiritistCenter: e.target.value,
                      })
                    }
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSpeakerModalOpen(false)}
                    className="flex-1 py-3 sm:py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm cursor-pointer"
                  >
                    Salvar Palestrante
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
