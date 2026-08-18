import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic2,
  Search,
  Plus,
  Trash2,
  Phone,
  Mail,
  Building2,
  FileText,
  X,
  ChevronRight,
  Pencil,
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dataService } from "../services/dataService";
import { Speaker, AgendaEvent } from "../types";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SpeakersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const canManage = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || "").toUpperCase();
    return ["ADMIN", "ADM", "COORDENADOR", "SECRETARIO", "RECEPCIONISTA"].includes(role);
  }, [currentUser]);

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCenterFilter, setSelectedCenterFilter] = useState("TODOS");
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    spiritistCenter: "",
    observations: "",
    city: "",
    themes: "",
    availability: ""
  });

  // Toast Auto Hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Realtime Subscriptions
  useEffect(() => {
    const unsubSpeakers = dataService.subscribeToSpeakers((data) => {
      setSpeakers(data || []);
    });

    const unsubAgenda = dataService.subscribeToAgendaEvents((events) => {
      setAgendaEvents(events || []);
    });

    return () => {
      unsubSpeakers();
      unsubAgenda();
    };
  }, []);

  // Compute stats per speaker
  const speakerStats = useMemo(() => {
    const statsMap: Record<string, { totalLectures: number; nextEvent?: AgendaEvent; lastEvent?: AgendaEvent }> = {};
    const now = Date.now();

    speakers.forEach(sp => {
      const spEvents = agendaEvents.filter(
        e => (e.speakerId && e.speakerId === sp.id) ||
             (e.speakerName && e.speakerName.toLowerCase().trim() === sp.name.toLowerCase().trim())
      );

      const totalLectures = spEvents.length;
      
      const futureEvents = spEvents
        .filter(e => e.date >= now)
        .sort((a, b) => a.date - b.date);

      const pastEvents = spEvents
        .filter(e => e.date < now)
        .sort((a, b) => b.date - a.date);

      statsMap[sp.id] = {
        totalLectures,
        nextEvent: futureEvents[0],
        lastEvent: pastEvents[0]
      };
    });

    return statsMap;
  }, [speakers, agendaEvents]);

  // Unique Spiritist Centers for filter
  const spiritistCenters = useMemo(() => {
    const centers = new Set<string>();
    speakers.forEach(s => {
      if (s.spiritistCenter) centers.add(s.spiritistCenter.trim());
    });
    return Array.from(centers).sort();
  }, [speakers]);

  // Filtered Speakers
  const filtered = useMemo(() => {
    return speakers.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.spiritistCenter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.observations && s.observations.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.themes && s.themes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCenter =
        selectedCenterFilter === "TODOS" ||
        s.spiritistCenter.trim().toLowerCase() === selectedCenterFilter.toLowerCase();

      return matchSearch && matchCenter;
    });
  }, [speakers, searchTerm, selectedCenterFilter]);

  const handleDeleteSpeaker = async () => {
    if (!speakerToDelete) return;
    try {
      await dataService.deleteSpeaker(speakerToDelete.id);
      setIsDeletingConfirmOpen(false);
      setSpeakerToDelete(null);
      showToast("Palestrante excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir palestrante:", err);
      showToast("Erro ao excluir palestrante.", "error");
    }
  };

  const handleEdit = (s: Speaker) => {
    setEditingSpeaker(s);
    setFormData({
      name: s.name || "",
      phone: s.phone || "",
      email: s.email || "",
      spiritistCenter: s.spiritistCenter || "",
      observations: s.observations || "",
      city: s.city || "",
      themes: s.themes || "",
      availability: s.availability || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpeaker) {
        await dataService.updateSpeaker({ ...editingSpeaker, ...formData });
        showToast("Dados do palestrante atualizados com sucesso!");
      } else {
        await dataService.addSpeaker(formData);
        showToast("Novo palestrante cadastrado com sucesso!");
      }
      setFormData({
        name: "",
        phone: "",
        email: "",
        spiritistCenter: "",
        observations: "",
        city: "",
        themes: "",
        availability: ""
      });
      setEditingSpeaker(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar palestrante:", err);
      showToast("Ocorreu um erro ao salvar os dados do palestrante.", "error");
    }
  };

  // WhatsApp helper
  const handleOpenWhatsApp = (speaker: Speaker) => {
    const rawPhone = (speaker.phone || "").replace(/\D/g, "");
    if (!rawPhone) {
      showToast("Este palestrante não possui telefone cadastrado.", "error");
      return;
    }
    const phoneWithCountry = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
    const nextEv = speakerStats[speaker.id]?.nextEvent;
    
    let msg = `Muita paz, irmão(ã) ${speaker.name}! Entramos em contato da Secretaria do Centro Espírita Mirante de Luz.`;
    if (nextEv) {
      const evDate = format(nextEv.date, "dd/MM/yyyy ('às' HH:mm)", { locale: ptBR });
      msg += ` Lembramos da sua palestra agendada para ${evDate} com o tema: "${nextEv.title}". Confirmamos sua presença?`;
    }

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (speakers.length === 0) return;
    const headers = ["Nome", "Telefone", "E-mail", "Centro Espírita", "Cidade", "Temas Habituais", "Total Palestras", "Observações"];
    const rows = filtered.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.spiritistCenter || '').replace(/"/g, '""')}"`,
      `"${(s.city || '').replace(/"/g, '""')}"`,
      `"${(s.themes || '').replace(/"/g, '""')}"`,
      speakerStats[s.id]?.totalLectures || 0,
      `"${(s.observations || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `palestrantes_mirante_de_luz_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Relatório CSV exportado com sucesso!");
  };

  // Printable View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-red-600 text-white shadow-red-200'
            }`}
          >
            <CheckCircle2 size={20} />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter italic">
                Palestrantes & Oradores
              </h1>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-indigo-100">
                {speakers.length} Cadastrados
              </span>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">
              Quadro oficial de irmãos palestrantes e gerenciamento das escalas doutrinárias
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Exportar em CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Imprimir Escala"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {canManage && (
            <button
              id="open-speaker-modal"
              onClick={() => {
                setEditingSpeaker(null);
                setFormData({
                  name: "",
                  phone: "",
                  email: "",
                  spiritistCenter: "",
                  observations: "",
                  city: "",
                  themes: "",
                  availability: ""
                });
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Plus size={18} />
              <span>Novo Palestrante</span>
            </button>
          )}
        </div>
      </header>

      {/* Filters and Search Bar */}
      <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 print:hidden">
        <div className="relative group w-full md:flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, e-mail, centro ou tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 py-3 pl-12 pr-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-medium text-sm"
          />
        </div>

        {/* Center Filter */}
        {spiritistCenters.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <select
              value={selectedCenterFilter}
              onChange={(e) => setSelectedCenterFilter(e.target.value)}
              className="bg-gray-50 border border-gray-100 py-3 px-4 rounded-2xl font-bold text-xs text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 w-full md:w-56"
            >
              <option value="TODOS">Todos os Centros Espíritas</option>
              {spiritistCenters.map(center => (
                <option key={center} value={center}>{center}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Printable Header */}
      <div className="hidden print:block mb-8 text-center space-y-2">
        <h1 className="text-2xl font-bold">Centro Espírita Mirante de Luz</h1>
        <h2 className="text-lg font-semibold text-gray-700">Quadro Oficial de Palestrantes & Oradores</h2>
        <p className="text-xs text-gray-500">Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      {/* Speaker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((s, index) => {
            const stats = speakerStats[s.id] || { totalLectures: 0 };
            return (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/40 hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform" />

                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                      <Mic2 size={26} />
                    </div>

                    <div className="flex items-center gap-1 z-10 print:hidden">
                      {s.phone && (
                        <button
                          onClick={() => handleOpenWhatsApp(s)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Enviar Mensagem / Lembrete no WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Editar Palestrante"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSpeakerToDelete(s);
                              setIsDeletingConfirmOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir Palestrante"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </h3>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest bg-indigo-50/60 w-fit px-3 py-1 rounded-full border border-indigo-100">
                      <Building2 size={12} />
                      <span>{s.spiritistCenter || 'Centro não informado'}</span>
                    </div>
                  </div>

                  {/* Quick Stats Banner */}
                  <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total de Palestras</span>
                      <div className="flex items-center gap-1 font-black text-indigo-900 text-sm">
                        <Award size={14} className="text-amber-500" />
                        <span>{stats.totalLectures} realizada(s)</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Próxima Palestra</span>
                      <p className="font-bold text-gray-700 truncate">
                        {stats.nextEvent ? format(stats.nextEvent.date, "dd/MM/yyyy", { locale: ptBR }) : 'Nenhuma agendada'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info & Details */}
                  <div className="space-y-2 text-xs text-gray-600 font-medium pt-2">
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span className="font-bold text-gray-800">{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.themes && (
                      <div className="flex items-start gap-2 pt-1">
                        <BookOpen size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-600 italic">
                          <strong>Temas:</strong> {s.themes}
                        </p>
                      </div>
                    )}
                    {s.observations && (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100/60 mt-2">
                        <p className="text-[11px] text-gray-500 italic line-clamp-2">
                          "{s.observations}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Next Event Callout */}
                {stats.nextEvent && (
                  <div className="mt-4 pt-3 border-t border-gray-100 bg-indigo-50/40 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700">Escalado em:</span>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{stats.nextEvent.title}</p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {format(stats.nextEvent.date, "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[32px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Mic2 size={40} />
            </div>
            <p className="text-gray-500 font-bold italic tracking-tight">
              Nenhum palestrante encontrado para o filtro selecionado.
            </p>
          </div>
        )}
      </div>

      {/* Modal Novo / Editar Palestrante */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingSpeaker(null);
              }}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">
                    {editingSpeaker ? "Editar Palestrante" : "Novo Palestrante"}
                  </h2>
                  <p className="text-xs font-medium text-gray-400">
                    Cadastre oradores para sintonizar a escala doutrinária da casa
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSpeaker(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-8 space-y-4 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Nome Completo *
                  </label>
                  <input
                    required
                    value={formData.name}
                    autoFocus
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                    placeholder="Nome do irmão orador..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                      placeholder="orador@exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Centro Espírita de Origem *
                    </label>
                    <input
                      required
                      value={formData.spiritistCenter}
                      onChange={(e) => setFormData({ ...formData, spiritistCenter: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                      placeholder="Ex: CE Mirante de Luz"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Cidade / UF
                    </label>
                    <input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                      placeholder="Ex: São Paulo / SP"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Temas / Tópicos de Preferência
                  </label>
                  <input
                    value={formData.themes}
                    onChange={(e) => setFormData({ ...formData, themes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 text-sm"
                    placeholder="Ex: Evangelho Segundo o Espiritismo, Passe, Mediunidade, Mocidade"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Observações & Disponibilidade
                  </label>
                  <textarea
                    rows={2}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all resize-none font-medium text-gray-600 text-xs"
                    placeholder="Prefere palestrar aos sábados, necessita de projetor, etc."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSpeaker(null);
                    }}
                    className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <span>{editingSpeaker ? "Salvar Alterações" : "Cadastrar Palestrante"}</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Confirmação Exclusão */}
        {isDeletingConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-red-950/40 backdrop-blur-sm"
              onClick={() => setIsDeletingConfirmOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Trash2 size={40} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight italic">
                  Confirmar Exclusão
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-2">
                  Deseja realmente remover o orador{" "}
                  <strong>{speakerToDelete?.name}</strong>?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeletingConfirmOpen(false)}
                  className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSpeaker}
                  className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
