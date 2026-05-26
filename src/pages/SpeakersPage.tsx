import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dataService } from "../services/dataService";
import { Speaker } from "../types";
import { useAuth } from "../context/AuthContext";

import { cn } from "../lib/utils";

export const SpeakersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ADM";
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    spiritistCenter: "",
    observations: "",
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "RECEPCIONISTA") {
        window.location.href = "/";
      }
    }
    loadSpeakers();
  }, [currentUser]);

  const loadSpeakers = async () => {
    const data = await dataService.getSpeakers();
    setSpeakers(data);
  };

  const handleDeleteSpeaker = async () => {
    if (!speakerToDelete) return;
    try {
      await dataService.deleteSpeaker(speakerToDelete.id);
      setIsDeletingConfirmOpen(false);
      setSpeakerToDelete(null);
      await loadSpeakers();
      alert("Palestrante excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir palestrante:", err);
      alert("Erro ao excluir palestrante.");
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
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpeaker) {
        await dataService.updateSpeaker({ ...editingSpeaker, ...formData });
        alert("Dados do palestrante atualizados com sucesso!");
      } else {
        await dataService.addSpeaker(formData);
        alert("Novo palestrante cadastrado com sucesso!");
      }
      setFormData({
        name: "",
        phone: "",
        email: "",
        spiritistCenter: "",
        observations: "",
      });
      setEditingSpeaker(null);
      setIsModalOpen(false);
      await loadSpeakers();
    } catch (err: any) {
      console.error("Erro ao salvar palestrante:", err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || "Sem permissão"}`);
      } catch {
        alert("Ocorreu um erro ao salvar os dados do palestrante.");
      }
    }
  };

  const filtered = speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.spiritistCenter.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter italic">
              Palestrantes
            </h1>
            <p className="text-gray-500 font-medium tracking-tight">
              Gestão de irmãos que compartilham a palavra no Mirante de Luz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-full md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar palestrante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 py-3.5 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-medium"
            />
          </div>
          {isAdmin && (
            <button
              id="open-speaker-modal"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Novo Palestrante</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length > 0 ? (
          filtered.map((s, index) => (
            <motion.div
              layout
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/40 hover:border-indigo-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform" />

              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                  <Mic2 size={28} />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 z-10">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSpeakerToDelete(s);
                        setIsDeletingConfirmOpen(true);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-lg"
                      title="Excluir Palestrante"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.name}
                </h3>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest bg-indigo-50/50 w-fit px-3 py-1 rounded-full">
                  <Building2 size={12} />
                  <span>{s.spiritistCenter}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-gray-500 font-medium border-t border-gray-50 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                    <Phone size={14} />
                  </div>
                  <span className="font-bold text-gray-700">{s.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                    <Mail size={14} />
                  </div>
                  <span className="truncate font-bold text-gray-700">
                    {s.email}
                  </span>
                </div>

                {s.observations && (
                  <div className="mt-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
                      <FileText size={12} />
                      Observações
                    </div>
                    <p className="text-xs italic leading-relaxed text-gray-400 line-clamp-2">
                      {s.observations}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
              <Mic2 size={40} />
            </div>
            <p className="text-gray-400 font-bold italic tracking-tight">
              Nenhum palestrante encontrado.
            </p>
          </div>
        )}
      </div>

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
                setFormData({
                  name: "",
                  phone: "",
                  email: "",
                  spiritistCenter: "",
                  observations: "",
                });
              }}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 pb-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">
                    {editingSpeaker ? "Editar Palestrante" : "Novo Palestrante"}
                  </h2>
                  <p className="text-xs font-medium text-gray-400">
                    Gerencie as informações do irmão palestrante
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSpeaker(null);
                    setFormData({
                      name: "",
                      phone: "",
                      email: "",
                      spiritistCenter: "",
                      observations: "",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-8 space-y-5 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      required
                      value={formData.name}
                      autoFocus
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-700"
                      placeholder="Nome do irmão..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Telefone/WhatsApp
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-700"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      E-mail
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-700"
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Centro Espírita de Origem
                  </label>
                  <input
                    required
                    value={formData.spiritistCenter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        spiritistCenter: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all font-bold text-gray-700"
                    placeholder="Ex: CE Fraternidade"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={2}
                    value={formData.observations}
                    onChange={(e) =>
                      setFormData({ ...formData, observations: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all resize-none font-medium text-gray-600"
                    placeholder="Disponibilidade, temas de preferência..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingSpeaker(null);
                      setFormData({
                        name: "",
                        phone: "",
                        email: "",
                        spiritistCenter: "",
                        observations: "",
                      });
                    }}
                    className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>{editingSpeaker ? "Salvar" : "Cadastrar"}</span>
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
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
                  Deseja realmente excluir{" "}
                  <strong>{speakerToDelete?.name}</strong>? Esta ação não pode
                  ser desfeita.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeletingConfirmOpen(false)}
                  className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteSpeaker}
                  className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
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
