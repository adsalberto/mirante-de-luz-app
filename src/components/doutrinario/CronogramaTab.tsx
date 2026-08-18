import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Users, 
  Search, 
  Filter,
  FileText,
  Video,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { DoutrinarioPalestra, DoutrinarioExpositor } from '../../types';

interface CronogramaTabProps {
  palestras: DoutrinarioPalestra[];
  expositores: DoutrinarioExpositor[];
  onSavePalestra: (palestra: Omit<DoutrinarioPalestra, 'id'> | DoutrinarioPalestra) => Promise<void>;
  onDeletePalestra: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: DoutrinarioPalestra['status'], substituteName?: string) => Promise<void>;
}

export const CronogramaTab: React.FC<CronogramaTabProps> = ({
  palestras,
  expositores,
  onSavePalestra,
  onDeletePalestra,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPalestra, setEditingPalestra] = useState<DoutrinarioPalestra | null>(null);

  // Substitute Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subTargetPalestra, setSubTargetPalestra] = useState<DoutrinarioPalestra | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    bookReference: '',
    speakerId: '',
    speakerName: '',
    speakerIsGuest: false,
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    status: 'PREVISTA' as DoutrinarioPalestra['status'],
    slidesUrl: '',
    recordingUrl: '',
    attendanceCount: 0,
    notes: '',
    themeCategory: 'EVANGELHO' as DoutrinarioPalestra['themeCategory']
  });

  const handleOpenNew = () => {
    setEditingPalestra(null);
    setFormData({
      title: '',
      bookReference: 'O Evangelho Segundo o Espiritismo',
      speakerId: '',
      speakerName: '',
      speakerIsGuest: false,
      date: new Date().toISOString().split('T')[0],
      time: '19:30',
      status: 'PREVISTA',
      slidesUrl: '',
      recordingUrl: '',
      attendanceCount: 0,
      notes: '',
      themeCategory: 'EVANGELHO'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DoutrinarioPalestra) => {
    setEditingPalestra(item);
    setFormData({
      title: item.title,
      bookReference: item.bookReference,
      speakerId: item.speakerId || '',
      speakerName: item.speakerName,
      speakerIsGuest: item.speakerIsGuest,
      date: item.date,
      time: item.time,
      status: item.status,
      slidesUrl: item.slidesUrl || '',
      recordingUrl: item.recordingUrl || '',
      attendanceCount: item.attendanceCount || 0,
      notes: item.notes || '',
      themeCategory: item.themeCategory || 'EVANGELHO'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.speakerName) return;

    if (editingPalestra) {
      await onSavePalestra({
        ...editingPalestra,
        ...formData
      });
    } else {
      await onSavePalestra({
        ...formData,
        createdAt: Date.now()
      });
    }
    setIsModalOpen(false);
  };

  const handleOpenSubstituteModal = (item: DoutrinarioPalestra) => {
    setSubTargetPalestra(item);
    setSelectedSubstituteId('');
    setIsSubModalOpen(true);
  };

  const handleConfirmSubstitute = async () => {
    if (!subTargetPalestra || !selectedSubstituteId) return;
    const subExp = expositores.find(e => e.id === selectedSubstituteId);
    if (!subExp) return;

    await onUpdateStatus(subTargetPalestra.id, 'SUBSTITUIDA', subExp.name);
    setIsSubModalOpen(false);
  };

  // Filter list
  const filteredList = palestras.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.speakerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bookReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // On-call substitute speakers
  const onCallSpeakers = expositores.filter(e => e.status === 'PLANTAO_EMERGENCIA' || e.status === 'ATIVO');

  const getStatusBadge = (status: DoutrinarioPalestra['status']) => {
    switch (status) {
      case 'CONFIRMADA':
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmada</span>;
      case 'EM_ANDAMENTO':
        return <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse"><Clock className="w-3.5 h-3.5" /> Em Andamento</span>;
      case 'CONCLUIDA':
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">Concluída</span>;
      case 'SUBSTITUIDA':
        return <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Expositor Substituído</span>;
      case 'CANCELADA':
        return <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-semibold px-2.5 py-1 rounded-full">Cancelada</span>;
      default:
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full">Prevista</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Filter, Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por tema, expositor ou livro base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="PREVISTA">Previstas</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluídas</option>
            <option value="SUBSTITUIDA">Substituídas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>

        <button
          id="btn-add-palestra"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Reunião Doutrinária</span>
        </button>
      </div>

      {/* Palestras Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header of Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{item.time}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              {/* Title & Reference */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-1 font-medium">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.bookReference}</span>
                </p>
              </div>

              {/* Speaker Card */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">
                    {item.speakerName[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {item.speakerName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.speakerIsGuest ? 'Expositor(a) Convidado(a)' : 'Trabalhador(a) da Casa'}
                    </span>
                  </div>
                </div>

                {item.substituteSpeakerName && (
                  <div className="text-right">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Substituto:</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.substituteSpeakerName}</span>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                {item.attendanceCount !== undefined && item.attendanceCount > 0 && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-medium">
                    <Users className="w-3 h-3 text-slate-500" /> {item.attendanceCount} presentes
                  </span>
                )}
                {item.slidesUrl && (
                  <a
                    href={item.slidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <FileText className="w-3 h-3" /> Slides
                  </a>
                )}
                {item.recordingUrl && (
                  <a
                    href={item.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <Video className="w-3 h-3" /> Gravação
                  </a>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {item.status === 'PREVISTA' && (
                  <button
                    onClick={() => onUpdateStatus(item.id, 'CONFIRMADA')}
                    className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Confirmar Presença
                  </button>
                )}
                {item.status === 'CONFIRMADA' && (
                  <button
                    onClick={() => onUpdateStatus(item.id, 'EM_ANDAMENTO')}
                    className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Iniciar Reunião
                  </button>
                )}
                {item.status === 'EM_ANDAMENTO' && (
                  <button
                    onClick={() => onUpdateStatus(item.id, 'CONCLUIDA')}
                    className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 hover:bg-purple-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Concluir Reunião
                  </button>
                )}
                <button
                  onClick={() => handleOpenSubstituteModal(item)}
                  className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <PhoneCall className="w-3 h-3" /> Acionar Plantão
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                  title="Editar Palestra"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeletePalestra(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                  title="Excluir Palestra"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhuma reunião doutrinária encontrada
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clique no botão "Agendar Reunião Doutrinária" acima para cadastrar novos temas, datas e expositores.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: NOVA / EDITAR PALESTRA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {editingPalestra ? 'Editar Reunião Doutrinária' : 'Agendar Nova Reunião Doutrinária'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tema da Palestra */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Tema da Exposição Doutrinária *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: As Bem-Aventuranças e o Consolo Espiritual"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Livro de Referência Kardequiana */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Referência Doutrinária (Kardec / FEB) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: O Evangelho Segundo o Espiritismo - Cap. V, itens 1 a 6"
                  value={formData.bookReference}
                  onChange={(e) => setFormData({ ...formData, bookReference: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Expositor Selection / Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Expositor Cadastrado
                  </label>
                  <select
                    value={formData.speakerId}
                    onChange={(e) => {
                      const exp = expositores.find(x => x.id === e.target.value);
                      if (exp) {
                        setFormData({
                          ...formData,
                          speakerId: exp.id,
                          speakerName: exp.name,
                          speakerIsGuest: exp.type === 'CONVIDADO_EXTERNO'
                        });
                      } else {
                        setFormData({ ...formData, speakerId: '' });
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Selecionar da lista ou digitar ao lado...</option>
                    {expositores.map(exp => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name} ({exp.type === 'CONVIDADO_EXTERNO' ? 'Convidado' : 'Casa'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Nome do Expositor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do expositor"
                    value={formData.speakerName}
                    onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date, Time & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PREVISTA">Prevista</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                  </select>
                </div>
              </div>

              {/* Guest checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-speaker-guest"
                  checked={formData.speakerIsGuest}
                  onChange={(e) => setFormData({ ...formData, speakerIsGuest: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="chk-speaker-guest" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Expositor(a) Convidado(a) de outra Casa Espírita
                </label>
              </div>

              {/* Links & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Link de Slides / Apresentação
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.slidesUrl}
                    onChange={(e) => setFormData({ ...formData, slidesUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Link de Gravação / Transmissão
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/live/..."
                    value={formData.recordingUrl}
                    onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer"
                >
                  {editingPalestra ? 'Salvar Alterações' : 'Agendar Reunião'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACIONAR EXPOSITOR DE PLANTÃO */}
      {isSubModalOpen && subTargetPalestra && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-500" />
                Acionar Plantão de Expositores
              </h3>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Selecione um expositor com disponibilidade imediata para assumir o tema da reunião de <span className="font-bold">{subTargetPalestra.date}</span> ({subTargetPalestra.title}):
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Expositor Substituto
              </label>
              <select
                value={selectedSubstituteId}
                onChange={(e) => setSelectedSubstituteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">Selecione um expositor de plantão...</option>
                {onCallSpeakers.map(sp => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name} - {sp.phone || 'Sem fone'} {sp.status === 'PLANTAO_EMERGENCIA' ? '⭐ (Plantão)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedSubstituteId}
                onClick={handleConfirmSubstitute}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar Substituição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
