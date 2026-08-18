import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Plus, Search, Filter, Sparkles, Monitor, Trash2, Edit3, 
  AlertTriangle, CheckCircle2, Info, Megaphone, Share2, Tag, Calendar, User,
  Pin, Eye, Clock, Image as ImageIcon, Check, EyeOff, Layers, ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { AnnouncementNotification } from '../types';
import { exportToCSV } from '../lib/exportUtils';
import { useAuth } from '../context/AuthContext';

export function AvisosPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Check user role permissions
  const isAdminOrSecretary = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toUpperCase();
    return ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA'].includes(role);
  }, [currentUser]);

  const userEmail = currentUser?.email || 'anonimo@cemil.com';

  const [announcements, setAnnouncements] = useState<AnnouncementNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODOS');
  const [audienceFilter, setAudienceFilter] = useState<string>('TODOS');
  const [statusTab, setStatusTab] = useState<'ATIVOS' | 'FIXADOS' | 'ARQUIVADOS' | 'TODOS'>('ATIVOS');

  // Modal State for Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal State for Viewing Detail
  const [viewingDetail, setViewingDetail] = useState<AnnouncementNotification | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GERAL' as AnnouncementNotification['category'],
    priority: 'MEDIA' as AnnouncementNotification['priority'],
    targetAudience: 'TODOS' as AnnouncementNotification['targetAudience'],
    displayOnMascotProjection: true,
    active: true,
    isPinned: false,
    expiresAt: '',
    imageUrl: '',
    authorName: currentUser?.name || 'Secretaria Geral'
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

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return announcements.filter(item => {
      // 1. Status Tab filter
      if (statusTab === 'ATIVOS' && !item.active) return false;
      if (statusTab === 'ARQUIVADOS' && item.active) return false;
      if (statusTab === 'FIXADOS' && (!item.isPinned || !item.active)) return false;

      // 2. Text Search
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                            item.content.toLowerCase().includes(search.toLowerCase()) ||
                            item.authorName.toLowerCase().includes(search.toLowerCase());

      // 3. Category & Priority
      const matchesCategory = categoryFilter === 'TODOS' || item.category === categoryFilter;
      const matchesPriority = priorityFilter === 'TODOS' || item.priority === priorityFilter;

      // 4. Target Audience
      const matchesAudience = audienceFilter === 'TODOS' || item.targetAudience === 'TODOS' || item.targetAudience === audienceFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesAudience;
    });
  }, [announcements, search, categoryFilter, priorityFilter, audienceFilter, statusTab]);

  // Statistics
  const stats = useMemo(() => {
    const totalActive = announcements.filter(a => a.active).length;
    const totalPinned = announcements.filter(a => a.active && a.isPinned).length;
    const totalMascot = announcements.filter(a => a.active && a.displayOnMascotProjection).length;
    const totalHighPriority = announcements.filter(a => a.active && (a.priority === 'ALTA' || a.category === 'URGENTE')).length;

    return { totalActive, totalPinned, totalMascot, totalHighPriority };
  }, [announcements]);

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
        isPinned: !!announcement.isPinned,
        expiresAt: announcement.expiresAt || '',
        imageUrl: announcement.imageUrl || '',
        authorName: announcement.authorName || currentUser?.name || 'Secretaria Geral'
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
        isPinned: false,
        expiresAt: '',
        imageUrl: '',
        authorName: currentUser?.name || 'Secretaria Geral'
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
          createdAt: Date.now(),
          readBy: []
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
    if (!isAdminOrSecretary) return;
    if (window.confirm('Deseja realmente remover este aviso do mural?')) {
      try {
        await dataService.deleteAnnouncement(id);
        showToast('Aviso removido do sistema.');
      } catch (err) {
        console.error(err);
        showToast('Erro ao excluir.');
      }
    }
  };

  const handleTogglePin = async (announcement: AnnouncementNotification) => {
    if (!isAdminOrSecretary) return;
    try {
      await dataService.togglePinAnnouncement(announcement.id, !announcement.isPinned);
      showToast(announcement.isPinned ? 'Aviso desafixado do topo.' : 'Aviso fixado no topo do mural!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMascotProjection = async (announcement: AnnouncementNotification) => {
    if (!isAdminOrSecretary) return;
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
    if (!isAdminOrSecretary) return;
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

  const handleAcknowledgeRead = async (announcement: AnnouncementNotification) => {
    try {
      await dataService.acknowledgeAnnouncement(announcement.id, userEmail);
      showToast('Sua leitura / ciência foi registrada com sucesso!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredAnnouncements.map(a => ({
        Título: a.title,
        Conteúdo: a.content,
        Categoria: a.category,
        Prioridade: a.priority,
        Público: a.targetAudience,
        FixadoTopo: a.isPinned ? 'SIM' : 'NÃO',
        ProjeçãoMascote: a.displayOnMascotProjection ? 'SIM' : 'NÃO',
        Status: a.active ? 'Ativo' : 'Arquivado',
        Validade: a.expiresAt || 'Sem expiração',
        CiênciasLeitura: (a.readBy || []).length,
        DataCriacao: new Date(a.createdAt).toLocaleString('pt-BR')
      })),
      'avisos_mural_filtrados'
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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-1">
            <Bell className="w-5 h-5 text-indigo-400" />
            <span>Mural de Avisos & Comunicação Integrada</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mural Inteligente & Alertas</h1>
          <p className="text-indigo-200 text-sm mt-1 max-w-2xl font-normal leading-relaxed">
            Central de comunicados oficiais em tempo real para voluntários, frequentadores e sincronização automática com o telão do Mascote Virtual do Auditório.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition border border-white/15 flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-300" />
            <span>Voltar ao Início</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-indigo-200 text-sm font-medium transition border border-indigo-500/20 flex items-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            Exportar CSV
          </button>

          {isAdminOrSecretary && (
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Aviso
            </button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Avisos Ativos</p>
            <p className="text-xl font-black text-slate-800">{stats.totalActive}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Pin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Fixados em Destaque</p>
            <p className="text-xl font-black text-slate-800">{stats.totalPinned}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Telão do Mascote</p>
            <p className="text-xl font-black text-slate-800">{stats.totalMascot}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Alta Prioridade / Urgente</p>
            <p className="text-xl font-black text-slate-800">{stats.totalHighPriority}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ATIVOS', 'FIXADOS', 'ARQUIVADOS', 'TODOS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  statusTab === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'ATIVOS' && '📢 Ativos'}
                {tab === 'FIXADOS' && '📌 Fixados no Topo'}
                {tab === 'ARQUIVADOS' && '📁 Arquivados'}
                {tab === 'TODOS' && '📋 Todos'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{filteredAnnouncements.length}</span> avisos
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mensagem, palavra-chave, autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
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
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="TODOS">Todas Prioridades</option>
              <option value="ALTA">Alta Prioridade</option>
              <option value="MEDIA">Média Prioridade</option>
              <option value="BAIXA">Baixa Prioridade</option>
            </select>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="TODOS">Público: Todos</option>
              <option value="VOLUNTARIOS">Voluntários</option>
              <option value="FREQUENTADORES">Frequentadores</option>
              <option value="COORDENADORES">Coordenadores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-semibold">
          Carregando avisos em tempo real...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Nenhum aviso encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não há comunicados cadastrados no momento para esta aba ou critérios de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAnnouncements.map((item) => {
            const isRead = (item.readBy || []).includes(userEmail);
            const readCount = (item.readBy || []).length;
            const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date(new Date().toDateString());

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl border bg-white shadow-sm flex flex-col justify-between relative overflow-hidden transition-all ${
                  !item.active ? 'opacity-60 bg-slate-50 border-slate-200' : 
                  item.isPinned ? 'border-indigo-400 ring-2 ring-indigo-500/20 shadow-md' :
                  item.priority === 'ALTA' ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200/80'
                }`}
              >
                {/* Image Banner if Present */}
                {item.imageUrl && (
                  <div className="mb-4 -mx-6 -mt-6 h-36 bg-gray-100 overflow-hidden relative border-b">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}

                {/* Badges on Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {item.isPinned && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Pin className="w-3 h-3 fill-white" />
                      Fixado
                    </span>
                  )}
                  {item.priority === 'ALTA' && item.active && (
                    <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <AlertTriangle className="w-3 h-3" />
                      Urgente
                    </span>
                  )}
                  {isExpired && (
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Expirado
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3 pr-24">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.category === 'URGENTE' ? 'bg-red-100 text-red-700' :
                      item.category === 'ESCALA' ? 'bg-blue-100 text-blue-700' :
                      item.category === 'EVENTO' ? 'bg-purple-100 text-purple-700' :
                      item.category === 'ESPIRITUAL' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.category}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> {item.authorName}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setViewingDetail(item)}
                    className="text-base font-extrabold text-slate-900 mb-2 hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {item.content}
                  </p>

                  {item.content.length > 200 && (
                    <button
                      onClick={() => setViewingDetail(item)}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 mt-1 inline-block"
                    >
                      Ler aviso completo →
                    </button>
                  )}
                </div>

                {/* Footer Controls & Acknowledgment */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Read / Acknowledged Button */}
                    <button
                      onClick={() => handleAcknowledgeRead(item)}
                      disabled={isRead}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isRead 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isRead ? 'Ciente / Lido' : 'Marcar Ciente'}
                    </button>

                    {isAdminOrSecretary && readCount > 0 && (
                      <span className="text-[10px] text-slate-400 font-extrabold bg-slate-100 px-2 py-1 rounded-lg">
                        {readCount} {readCount === 1 ? 'leitura' : 'leituras'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    {isAdminOrSecretary && (
                      <>
                        <button
                          onClick={() => handleTogglePin(item)}
                          className={`p-2 rounded-xl transition ${
                            item.isPinned ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-400'
                          }`}
                          title={item.isPinned ? 'Desafixar do topo' : 'Fixar no topo do mural'}
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleMascotProjection(item)}
                          className={`p-2 rounded-xl transition ${
                            item.displayOnMascotProjection 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'hover:bg-slate-100 text-slate-400'
                          }`}
                          title={item.displayOnMascotProjection ? 'No Telão do Mascote' : 'Adicionar à Projeção do Mascote'}
                        >
                          <Monitor className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 text-xs font-bold"
                          title={item.active ? 'Arquivar aviso' : 'Reativar aviso'}
                        >
                          {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 transition"
                          title="Editar aviso"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition"
                          title="Excluir aviso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                {editingId ? 'Editar Aviso do Mural' : 'Publicar Novo Aviso'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Título do Aviso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alinhamento das equipes de Passe neste sábado"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="GERAL">Geral</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="ESCALA">Escalas</option>
                    <option value="EVENTO">Eventos</option>
                    <option value="ESPIRITUAL">Espiritual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Conteúdo da Mensagem</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva detalhadamente o recado para exibição no mural..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Público Alvo</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="TODOS">Todos (Público Geral)</option>
                    <option value="VOLUNTARIOS">Apenas Voluntários</option>
                    <option value="FREQUENTADORES">Frequentadores</option>
                    <option value="COORDENADORES">Coordenadores de Setor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Nome do Autor / Setor</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Data de Expiração (Opcional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">URL da Imagem / Banner (Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isPinned" className="text-xs font-extrabold text-slate-700 flex items-center gap-1 cursor-pointer">
                    <Pin className="w-3.5 h-3.5 text-indigo-600" />
                    Fixar aviso no topo do mural
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="displayOnMascot"
                    checked={formData.displayOnMascotProjection}
                    onChange={(e) => setFormData({ ...formData, displayOnMascotProjection: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="displayOnMascot" className="text-xs font-extrabold text-slate-700 flex items-center gap-1 cursor-pointer">
                    <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                    Exibir no Telão do Auditório (Projeção do Mascote)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal for Reading Full Detail */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4 overflow-hidden relative"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  {viewingDetail.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(viewingDetail.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button onClick={() => setViewingDetail(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            {viewingDetail.imageUrl && (
              <div className="-mx-6 h-48 bg-slate-100 overflow-hidden">
                <img src={viewingDetail.imageUrl} alt={viewingDetail.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{viewingDetail.title}</h2>
              <p className="text-xs text-slate-500 font-bold">Por: {viewingDetail.authorName} • Público: {viewingDetail.targetAudience}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pt-2 max-h-80 overflow-y-auto">
                {viewingDetail.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => {
                  handleAcknowledgeRead(viewingDetail);
                  setViewingDetail(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmar Leitura / Ciente
              </button>

              <button
                onClick={() => setViewingDetail(null)}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
