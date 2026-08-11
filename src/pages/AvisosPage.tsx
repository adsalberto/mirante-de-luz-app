import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Plus, Search, Filter, Sparkles, Monitor, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Info, Megaphone, Share2, Tag, Calendar, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { AnnouncementNotification } from '../types';
import { exportToCSV } from '../lib/exportUtils';

export function AvisosPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GERAL' as AnnouncementNotification['category'],
    priority: 'MEDIA' as AnnouncementNotification['priority'],
    targetAudience: 'TODOS' as AnnouncementNotification['targetAudience'],
    displayOnMascotProjection: true,
    active: true,
    authorName: 'Secretaria Geral'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubscribe = dataService.subscribeAnnouncements((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                            item.content.toLowerCase().includes(search.toLowerCase()) ||
                            item.authorName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'TODOS' || item.category === categoryFilter;
      const matchesPriority = priorityFilter === 'TODOS' || item.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [announcements, search, categoryFilter, priorityFilter]);

  const handleOpenModal = (announcement?: AnnouncementNotification) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        displayOnMascotProjection: announcement.displayOnMascotProjection,
        active: announcement.active,
        authorName: announcement.authorName || 'Secretaria Geral'
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        category: 'GERAL',
        priority: 'MEDIA',
        targetAudience: 'TODOS',
        displayOnMascotProjection: true,
        active: true,
        authorName: 'Secretaria Geral'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Por favor, preencha o título e o conteúdo do aviso.');
      return;
    }

    try {
      if (editingId) {
        const existing = announcements.find(a => a.id === editingId);
        if (existing) {
          await dataService.updateAnnouncement({
            ...existing,
            ...formData
          });
          showToast('Aviso atualizado com sucesso!');
        }
      } else {
        await dataService.addAnnouncement({
          ...formData,
          createdAt: Date.now()
        });
        showToast('Novo aviso publicado no mural!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar aviso.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente remover este aviso do mural?')) {
      try {
        await dataService.deleteAnnouncement(id);
        showToast('Aviso removido.');
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.');
      }
    }
  };

  const handleToggleMascotProjection = async (announcement: AnnouncementNotification) => {
    try {
      await dataService.updateAnnouncement({
        ...announcement,
        displayOnMascotProjection: !announcement.displayOnMascotProjection
      });
      showToast(
        !announcement.displayOnMascotProjection 
          ? 'Aviso enviado para exibição na projeção do Mascote!' 
          : 'Aviso removido da projeção do Mascote.'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (announcement: AnnouncementNotification) => {
    try {
      await dataService.updateAnnouncement({
        ...announcement,
        active: !announcement.active
      });
      showToast(announcement.active ? 'Aviso arquivado.' : 'Aviso reativado.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      announcements.map(a => ({
        Título: a.title,
        Conteúdo: a.content,
        Categoria: a.category,
        Prioridade: a.priority,
        Público: a.targetAudience,
        ProjeçãoMascote: a.displayOnMascotProjection ? 'SIM' : 'NÃO',
        Status: a.active ? 'Ativo' : 'Arquivado',
        Data: new Date(a.createdAt).toLocaleString('pt-BR')
      })),
      'avisos_mural'
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-1">
            <Bell className="w-5 h-5" />
            <span>Mural de Avisos & Comunicação Integrada</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mural Inteligente & Alertas</h1>
          <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
            Gerencie avisos em tempo real para os voluntários, frequentadores e sincronize automaticamente os recados no telão do Mascote Virtual do Auditório.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-200 text-sm font-medium transition border border-indigo-500/20 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Aviso
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, palavra-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todas Categorias</option>
            <option value="GERAL">Geral</option>
            <option value="URGENTE">Urgente</option>
            <option value="ESCALA">Escalas</option>
            <option value="EVENTO">Eventos</option>
            <option value="ESPIRITUAL">Espiritual</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todas Prioridades</option>
            <option value="ALTA">Alta Prioridade</option>
            <option value="MEDIA">Média Prioridade</option>
            <option value="BAIXA">Baixa Prioridade</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Carregando avisos em tempo real...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800">Nenhum aviso encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Não há avisos cadastrados para os filtros selecionados. Clique em "Novo Aviso" para publicar um comunicado no mural.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between relative overflow-hidden ${
                !item.active ? 'opacity-60 bg-slate-50 border-slate-200' : 
                item.priority === 'ALTA' ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200/80'
              }`}
            >
              {item.priority === 'ALTA' && item.active && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Prioridade Alta
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.category === 'URGENTE' ? 'bg-red-100 text-red-700' :
                    item.category === 'ESCALA' ? 'bg-blue-100 text-blue-700' :
                    item.category === 'EVENTO' ? 'bg-purple-100 text-purple-700' :
                    item.category === 'ESPIRITUAL' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.authorName}
                  </span>

                  <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>

              {/* Status and Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleMascotProjection(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    item.displayOnMascotProjection 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Ativar/desativar exibição no telão do auditório no Mascote Virtual"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  {item.displayOnMascotProjection ? 'No Telão do Mascote' : '+ Adicionar ao Mascote'}
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-xs font-medium"
                    title={item.active ? 'Arquivar aviso' : 'Reativar aviso'}
                  >
                    {item.active ? 'Arquivar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                    title="Editar aviso"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                    title="Excluir aviso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for Creating / Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                {editingId ? 'Editar Aviso' : 'Publicar Novo Aviso'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Aviso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento das equipes de Passe neste sábado"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="GERAL">Geral</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="ESCALA">Escalas</option>
                    <option value="EVENTO">Eventos</option>
                    <option value="ESPIRITUAL">Espiritual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Conteúdo do Mensagem</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva detalhadamente o recado para exibição no mural..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Público Alvo</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="TODOS">Todos (Público Geral)</option>
                    <option value="VOLUNTARIOS">Apenas Voluntários</option>
                    <option value="FREQUENTADORES">Frequentadores</option>
                    <option value="COORDENADORES">Coordenadores de Setor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Autor / Setor</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="displayOnMascot"
                  checked={formData.displayOnMascotProjection}
                  onChange={(e) => setFormData({ ...formData, displayOnMascotProjection: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="displayOnMascot" className="text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer">
                  <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                  Exibir no Telão do Auditório (Projeção do Mascote)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
