import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, Target, TrendingUp, Plus, Edit2, Trash2, Award, 
  ShoppingBag, Users, Sparkles, Share2, Printer, CheckCircle2,
  DollarSign, History, Filter, Calendar, FileText, ChevronDown, ChevronUp,
  AlertCircle, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { SocialImpactMetric, SocialImpactLog } from '../types';
import { exportToCSV, printFormattedReport } from '../lib/exportUtils';
import { useAuth } from '../context/AuthContext';

export function ImpactoSocialPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isAdminOrSecretary = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toUpperCase();
    return ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA'].includes(role);
  }, [currentUser]);

  const userEmail = currentUser?.email || 'voluntario@cemil.com';
  const userName = currentUser?.name || 'Voluntário Fraterno';

  const getCurrentMonthYear = () => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${m}/${y}`;
  };

  const [metrics, setMetrics] = useState<SocialImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [monthYearFilter, setMonthYearFilter] = useState<string>(getCurrentMonthYear());
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Contribution Modal
  const [contributionMetric, setContributionMetric] = useState<SocialImpactMetric | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(1);
  const [contributionNote, setContributionNote] = useState<string>('');

  // Log Drawer Modal
  const [historyMetric, setHistoryMetric] = useState<SocialImpactMetric | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'CESTAS_BASICAS' as SocialImpactMetric['category'],
    targetCount: 100,
    currentCount: 0,
    unit: 'UNIDADES' as NonNullable<SocialImpactMetric['unit']>,
    period: 'MENSAL' as SocialImpactMetric['period'],
    monthYear: getCurrentMonthYear(),
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time Firestore Subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = dataService.subscribeSocialMetrics((data) => {
      setMetrics(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Available MonthYears for Filter
  const availableMonthYears = useMemo(() => {
    const set = new Set<string>();
    set.add(getCurrentMonthYear());
    metrics.forEach(m => {
      if (m.monthYear) set.add(m.monthYear);
    });
    return Array.from(set).sort().reverse();
  }, [metrics]);

  // Filtered Metrics
  const filteredMetrics = useMemo(() => {
    return metrics.filter(item => {
      // MonthYear filter
      if (monthYearFilter !== 'TODOS' && item.monthYear !== monthYearFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'TODOS' && item.category !== categoryFilter) {
        return false;
      }
      // Status filter
      const isCompleted = item.currentCount >= item.targetCount;
      const isSupered = item.currentCount > item.targetCount;
      if (statusFilter === 'EM_ANDAMENTO' && isCompleted) return false;
      if (statusFilter === 'CONCLUIDAS' && !isCompleted) return false;
      if (statusFilter === 'SUPERADAS' && !isSupered) return false;

      return true;
    });
  }, [metrics, categoryFilter, monthYearFilter, statusFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalCurrent = filteredMetrics.reduce((acc, curr) => acc + curr.currentCount, 0);
    const totalTarget = filteredMetrics.reduce((acc, curr) => acc + curr.targetCount, 0);
    const completedCount = filteredMetrics.filter(m => m.currentCount >= m.targetCount).length;
    const superedCount = filteredMetrics.filter(m => m.currentCount > m.targetCount).length;

    return { totalCurrent, totalTarget, completedCount, superedCount, totalCount: filteredMetrics.length };
  }, [filteredMetrics]);

  const handleOpenModal = (metric?: SocialImpactMetric) => {
    if (!isAdminOrSecretary) {
      showToast('Apenas administradores e a secretaria podem criar ou modificar metas.');
      return;
    }
    if (metric) {
      setEditingId(metric.id);
      setFormData({
        title: metric.title,
        category: metric.category,
        targetCount: metric.targetCount,
        currentCount: metric.currentCount,
        unit: metric.unit || 'UNIDADES',
        period: metric.period,
        monthYear: metric.monthYear || getCurrentMonthYear(),
        notes: metric.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: 'CESTAS_BASICAS',
        targetCount: 100,
        currentCount: 0,
        unit: 'UNIDADES',
        period: 'MENSAL',
        monthYear: getCurrentMonthYear(),
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Preencha o título do indicador.');
      return;
    }

    try {
      if (editingId) {
        const existing = metrics.find(m => m.id === editingId);
        if (existing) {
          await dataService.updateSocialMetric({
            ...existing,
            ...formData,
            updatedAt: Date.now()
          });
          showToast('Indicador atualizado!');
        }
      } else {
        await dataService.addSocialMetric({
          ...formData,
          updatedAt: Date.now()
        });
        showToast('Nova meta de impacto cadastrada!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar indicador.');
    }
  };

  const handleOpenContribution = (metric: SocialImpactMetric) => {
    setContributionMetric(metric);
    setContributionAmount(1);
    setContributionNote('');
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionMetric || contributionAmount <= 0) return;

    try {
      await dataService.addContributionLog(
        contributionMetric.id,
        contributionAmount,
        `${userName} (${userEmail})`,
        contributionNote
      );
      showToast(`+${contributionAmount} adicionado a ${contributionMetric.title}!`);
      setContributionMetric(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar aporte.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdminOrSecretary) return;
    if (window.confirm('Excluir este indicador de impacto social?')) {
      await dataService.deleteSocialMetric(id);
      showToast('Indicador removido.');
    }
  };

  const formatUnitValue = (val: number, unit?: SocialImpactMetric['unit']) => {
    if (unit === 'REAIS_BRL') {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (unit === 'HORAS') {
      return `${val.toLocaleString('pt-BR')} hs`;
    }
    if (unit === 'KILOS') {
      return `${val.toLocaleString('pt-BR')} kg`;
    }
    return val.toLocaleString('pt-BR');
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredMetrics.map(m => ({
        Indicador: m.title,
        Categoria: m.category,
        Unidade: m.unit || 'UNIDADES',
        MetaAlvo: m.targetCount,
        Realizado: m.currentCount,
        Atingimento: `${Math.round((m.currentCount / (m.targetCount || 1)) * 100)}%`,
        Periodo: m.period,
        MesAno: m.monthYear,
        Notas: m.notes || ''
      })),
      `impacto_social_${monthYearFilter.replace('/', '_')}`
    );
  };

  const handlePrintReport = () => {
    const rowsHtml = filteredMetrics.map(m => {
      const pct = Math.round((m.currentCount / (m.targetCount || 1)) * 100);
      return `
        <tr>
          <td><strong>${m.title}</strong></td>
          <td>${m.category}</td>
          <td>${formatUnitValue(m.targetCount, m.unit)}</td>
          <td>${formatUnitValue(m.currentCount, m.unit)}</td>
          <td><strong>${pct}%</strong></td>
          <td>${m.monthYear}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <h3>Mês/Período: ${monthYearFilter}</h3>
      <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Categoria</th>
            <th>Meta Alvo</th>
            <th>Realizado</th>
            <th>Progresso (%)</th>
            <th>Mês/Ano</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
    printFormattedReport('Relatório de Impacto Social e Fraterno', html);
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
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-1">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
            <span>Assistência Social & Fraternidade</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Indicadores de Impacto Social</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl leading-relaxed font-normal">
            Acompanhe em tempo real a caridade e amor em ação: cestas básicas entregues, atendimentos fraternos, marmitas, passes e horas dedicadas aos necessitados.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition border border-white/15 flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-emerald-300" />
            <span>Voltar ao Início</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-emerald-200 text-sm font-medium transition border border-emerald-500/20 flex items-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-emerald-200 text-sm font-medium transition border border-emerald-500/20 flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Relatório PDF
          </button>

          {isAdminOrSecretary && (
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Meta
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total de Indicadores</p>
            <p className="text-xl font-black text-slate-800">{stats.totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Metas Concluídas</p>
            <p className="text-xl font-black text-slate-800">{stats.completedCount} / {stats.totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Metas Superadas ⭐</p>
            <p className="text-xl font-black text-slate-800">{stats.superedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Volume Total Beneficiado</p>
            <p className="text-xl font-black text-slate-800">{stats.totalCurrent.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros do Painel:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month/Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={monthYearFilter}
              onChange={(e) => setMonthYearFilter(e.target.value)}
              className="text-xs font-extrabold bg-transparent text-slate-800 focus:outline-none"
            >
              <option value="TODOS">Todos os Períodos</option>
              {availableMonthYears.map(my => (
                <option key={my} value={my}>Mês/Ano: {my}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todas Categorias</option>
            <option value="CESTAS_BASICAS">Cestas Básicas</option>
            <option value="ATENDIMENTOS_FRATERNOS">Atendimentos Fraternos</option>
            <option value="PASSES_MINISTRADOS">Passes Energéticos</option>
            <option value="REFEICOES_SOPAO">Refeições / Sopão</option>
            <option value="LIVROS_DOADOS">Livros Doados</option>
            <option value="HORAS_VOLUNTARIAS">Horas Voluntárias</option>
            <option value="ARRECADACAO_FINANCEIRA">Arrecadação Financeira</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDAS">Metas Concluídas</option>
            <option value="SUPERADAS">Metas Superadas ⭐</option>
          </select>
        </div>
      </div>

      {/* Metrics List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-semibold">
          Carregando metas sociais em tempo real...
        </div>
      ) : filteredMetrics.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">Nenhum indicador encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não há metas sociais cadastradas para o período ou filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMetrics.map((metric) => {
            const pctRaw = (metric.currentCount / (metric.targetCount || 1)) * 100;
            const percentageDisplay = Math.round(pctRaw);
            const percentageBar = Math.min(100, Math.round(pctRaw));
            const isCompleted = metric.currentCount >= metric.targetCount;
            const isSupered = metric.currentCount > metric.targetCount;

            return (
              <motion.div
                key={metric.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl bg-white border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${
                  isSupered ? 'border-amber-300 ring-2 ring-amber-400/20' :
                  isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                      {metric.monthYear || 'Mensal'} • {metric.period}
                    </span>

                    {isSupered ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Meta Superada ⭐ ({percentageDisplay}%)
                      </span>
                    ) : isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Meta Atingida!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Faltam {formatUnitValue(Math.max(0, metric.targetCount - metric.currentCount), metric.unit)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mb-1 leading-snug">{metric.title}</h3>
                  {metric.notes && <p className="text-xs text-slate-500 mb-4">{metric.notes}</p>}

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progresso Atual:</span>
                      <span className="text-slate-900 font-extrabold">
                        {formatUnitValue(metric.currentCount, metric.unit)} / {formatUnitValue(metric.targetCount, metric.unit)} ({percentageDisplay}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isSupered ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        }`}
                        style={{ width: `${percentageBar}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Addition & History */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenContribution(metric)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-md flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar Aporte
                    </button>

                    {(metric.logs || []).length > 0 && (
                      <button
                        onClick={() => setHistoryMetric(metric)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1"
                        title="Ver histórico de doações/aportes"
                      >
                        <History className="w-3.5 h-3.5" />
                        {(metric.logs || []).length}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    {isAdminOrSecretary && (
                      <>
                        <button
                          onClick={() => handleOpenModal(metric)}
                          className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-600 transition"
                          title="Editar Indicador"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(metric.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition"
                          title="Excluir Indicador"
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

      {/* Modal for Creating / Editing Metric */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                {editingId ? 'Editar Meta Social' : 'Nova Meta de Impacto Social'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Título do Indicador / Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Doação de Cestas Básicas para Famílias Cadastradas"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="CESTAS_BASICAS">Cestas Básicas</option>
                    <option value="ATENDIMENTOS_FRATERNOS">Atendimentos Fraternos</option>
                    <option value="PASSES_MINISTRADOS">Passes Energéticos</option>
                    <option value="REFEICOES_SOPAO">Refeições / Sopão</option>
                    <option value="LIVROS_DOADOS">Livros Doados</option>
                    <option value="HORAS_VOLUNTARIAS">Horas Voluntárias</option>
                    <option value="ARRECADACAO_FINANCEIRA">Arrecadação Financeira</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Unidade de Medida</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="UNIDADES">Unidades (Itens, Pessoas)</option>
                    <option value="REAIS_BRL">Moeda (R$)</option>
                    <option value="HORAS">Horas (hs)</option>
                    <option value="KILOS">Quilos (kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Mês / Ano (MM/AAAA)</label>
                  <input
                    type="text"
                    required
                    value={formData.monthYear}
                    onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Período</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Meta Alvo (Quantidade)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Realizado Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentCount}
                    onChange={(e) => setFormData({ ...formData, currentCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={3}
                  placeholder="Anotações adicionais sobre o setor ou campanha responsável..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal for Registering Contribution / Log */}
      {contributionMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Registrar Aporte / Contribuição
              </h2>
              <button onClick={() => setContributionMetric(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
              <p className="text-xs font-extrabold text-emerald-800">{contributionMetric.title}</p>
              <p className="text-[11px] text-emerald-600 font-medium">
                Progresso atual: {formatUnitValue(contributionMetric.currentCount, contributionMetric.unit)} / {formatUnitValue(contributionMetric.targetCount, contributionMetric.unit)}
              </p>
            </div>

            <form onSubmit={handleSaveContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Quantidade Adicionada</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Origem / Anotação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Campanha de Inverno do Voluntário João"
                  value={contributionNote}
                  onChange={(e) => setContributionNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setContributionMetric(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal for Viewing Contribution History */}
      {historyMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Histórico de Contribuições
              </h2>
              <button onClick={() => setHistoryMetric(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border">
              <p className="text-xs font-extrabold text-slate-800">{historyMetric.title}</p>
              <p className="text-[11px] text-slate-500">
                Mês/Ano: {historyMetric.monthYear} • Total acumulado: {formatUnitValue(historyMetric.currentCount, historyMetric.unit)}
              </p>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(historyMetric.logs || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum histórico registrado.</p>
              ) : (
                (historyMetric.logs || []).map((log) => (
                  <div key={log.id} className="p-3 bg-white rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="text-emerald-600 font-extrabold">+{formatUnitValue(log.amount, historyMetric.unit)}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Por: {log.addedBy}</p>
                    {log.note && <p className="text-[11px] text-slate-600 italic">"{log.note}"</p>}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t text-right">
              <button
                onClick={() => setHistoryMetric(null)}
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
