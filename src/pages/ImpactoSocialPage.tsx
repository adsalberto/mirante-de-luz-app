import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, Target, TrendingUp, Plus, Edit2, Trash2, Award, 
  ShoppingBag, Users, Sparkles, Share2, Printer, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { SocialImpactMetric } from '../types';
import { exportToCSV, printFormattedReport } from '../lib/exportUtils';

export function ImpactoSocialPage() {
  const [metrics, setMetrics] = useState<SocialImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'CESTAS_BASICAS' as SocialImpactMetric['category'],
    targetCount: 100,
    currentCount: 0,
    period: 'MENSAL' as SocialImpactMetric['period'],
    monthYear: '08/2026',
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadMetrics = async () => {
    setLoading(true);
    const data = await dataService.getSocialMetrics();
    setMetrics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleOpenModal = (metric?: SocialImpactMetric) => {
    if (metric) {
      setEditingId(metric.id);
      setFormData({
        title: metric.title,
        category: metric.category,
        targetCount: metric.targetCount,
        currentCount: metric.currentCount,
        period: metric.period,
        monthYear: metric.monthYear || '08/2026',
        notes: metric.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        category: 'CESTAS_BASICAS',
        targetCount: 100,
        currentCount: 0,
        period: 'MENSAL',
        monthYear: '08/2026',
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
        showToast('Nova meta cadastrada com sucesso!');
      }
      setIsModalOpen(false);
      loadMetrics();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar indicador.');
    }
  };

  const handleQuickAdd = async (metric: SocialImpactMetric, delta: number) => {
    const newCount = Math.max(0, metric.currentCount + delta);
    try {
      await dataService.updateSocialMetric({
        ...metric,
        currentCount: newCount,
        updatedAt: Date.now()
      });
      setMetrics(prev => prev.map(m => m.id === metric.id ? { ...m, currentCount: newCount } : m));
      showToast(`Progresso atualizado (+${delta})`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este indicador de impacto social?')) {
      await dataService.deleteSocialMetric(id);
      showToast('Indicador removido.');
      loadMetrics();
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      metrics.map(m => ({
        Indicador: m.title,
        Categoria: m.category,
        Meta: m.targetCount,
        Realizado: m.currentCount,
        Atingimento: `${Math.round((m.currentCount / (m.targetCount || 1)) * 100)}%`,
        Periodo: m.period,
        MesAno: m.monthYear
      })),
      'impacto_social_metas'
    );
  };

  const handlePrintReport = () => {
    const rowsHtml = metrics.map(m => {
      const pct = Math.round((m.currentCount / (m.targetCount || 1)) * 100);
      return `
        <tr>
          <td><strong>${m.title}</strong></td>
          <td>${m.category}</td>
          <td>${m.targetCount}</td>
          <td>${m.currentCount}</td>
          <td><strong>${pct}%</strong></td>
          <td>${m.monthYear}</td>
        </tr>
      `;
    }).join('');

    const html = `
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

  const totalBenefited = metrics.reduce((acc, curr) => acc + curr.currentCount, 0);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-1">
            <HeartHandshake className="w-5 h-5" />
            <span>Assistência Social & Fraternidade</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Indicadores de Impacto Social</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            Acompanhe em tempo real a caridade realizada: cestas básicas entregues, atendimentos fraternos, doações de marmitas, passes e horas de trabalho amoroso doadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-200 text-sm font-medium transition border border-emerald-500/20 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-200 text-sm font-medium transition border border-emerald-500/20 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir PDF
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Total Impact Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações Executadas</div>
            <div className="text-2xl font-black text-slate-900">{totalBenefited.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cestas / Alimentos</div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.filter(m => m.category === 'CESTAS_BASICAS' || m.category === 'REFEICOES_SOPAO').reduce((acc, curr) => acc + curr.currentCount, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atendimentos / Passes</div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.filter(m => m.category === 'ATENDIMENTOS_FRATERNOS' || m.category === 'PASSES_MINISTRADOS').reduce((acc, curr) => acc + curr.currentCount, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metas Concluídas</div>
            <div className="text-2xl font-black text-slate-900">
              {metrics.filter(m => m.currentCount >= m.targetCount).length} / {metrics.length}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando metas sociais...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric) => {
            const percentage = Math.min(100, Math.round((metric.currentCount / (metric.targetCount || 1)) * 100));
            const isCompleted = metric.currentCount >= metric.targetCount;

            return (
              <motion.div
                key={metric.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl bg-white border shadow-sm relative overflow-hidden flex flex-col justify-between ${
                  isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                      {metric.monthYear || 'Mensal'}
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Meta Atingida!
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Faltam {Math.max(0, metric.targetCount - metric.currentCount)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{metric.title}</h3>
                  {metric.notes && <p className="text-xs text-slate-500 mb-4">{metric.notes}</p>}

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-600">Progresso:</span>
                      <span className="text-slate-900">{metric.currentCount} / {metric.targetCount} ({percentage}%)</span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Add / Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-400 mr-1">Adicionar:</span>
                    <button
                      onClick={() => handleQuickAdd(metric, 1)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickAdd(metric, 5)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickAdd(metric, 10)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                    >
                      +10
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(metric)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(metric.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
                <Target className="w-5 h-5 text-emerald-600" />
                {editingId ? 'Editar Meta Social' : 'Nova Meta de Impacto Social'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Indicador / Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Doação de Cestas Básicas para Famílias Atendidas"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="CESTAS_BASICAS">Cestas Básicas</option>
                    <option value="ATENDIMENTOS_FRATERNOS">Atendimentos Fraternos</option>
                    <option value="PASSES_MINISTRADOS">Passes Energéticos</option>
                    <option value="REFEICOES_SOPAO">Refeições / Sopão</option>
                    <option value="LIVROS_DOADOS">Livros Doados</option>
                    <option value="HORAS_VOLUNTARIAS">Horas Voluntárias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mês / Ano</label>
                  <input
                    type="text"
                    value={formData.monthYear}
                    onChange={(e) => setFormData({ ...formData, monthYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Alvo (Quantidade)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Realizado Atual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentCount}
                    onChange={(e) => setFormData({ ...formData, currentCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={3}
                  placeholder="Anotações adicionais sobre o setor ou campanha responsável..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
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
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
