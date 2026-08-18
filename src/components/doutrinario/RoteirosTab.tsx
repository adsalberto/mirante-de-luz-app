import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Volume2, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Radio
} from 'lucide-react';
import { DoutrinarioRoteiro } from '../../types';

interface RoteirosTabProps {
  roteiros: DoutrinarioRoteiro[];
  onSaveRoteiro: (roteiro: Omit<DoutrinarioRoteiro, 'id'> | DoutrinarioRoteiro) => Promise<void>;
  onDeleteRoteiro: (id: string) => Promise<void>;
}

export const RoteirosTab: React.FC<RoteirosTabProps> = ({
  roteiros,
  onSaveRoteiro,
  onDeleteRoteiro
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoteiro, setEditingRoteiro] = useState<DoutrinarioRoteiro | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'MESA_DIRETORA' as DoutrinarioRoteiro['category'],
    content: '',
    estimatedMinutes: 50,
    steps: [] as { order: number; title: string; description: string; durationMinutes: number }[]
  });

  const [stepTitle, setStepTitle] = useState('');
  const [stepDesc, setStepDesc] = useState('');
  const [stepDuration, setStepDuration] = useState(5);

  const handleOpenNew = () => {
    setEditingRoteiro(null);
    setFormData({
      title: '',
      category: 'MESA_DIRETORA',
      content: '',
      estimatedMinutes: 50,
      steps: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DoutrinarioRoteiro) => {
    setEditingRoteiro(item);
    setFormData({
      title: item.title,
      category: item.category,
      content: item.content,
      estimatedMinutes: item.estimatedMinutes || 50,
      steps: item.steps || []
    });
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    if (stepTitle.trim()) {
      const nextOrder = formData.steps.length + 1;
      setFormData({
        ...formData,
        steps: [
          ...formData.steps,
          {
            order: nextOrder,
            title: stepTitle.trim(),
            description: stepDesc.trim(),
            durationMinutes: stepDuration
          }
        ]
      });
      setStepTitle('');
      setStepDesc('');
      setStepDuration(5);
    }
  };

  const handleRemoveStep = (order: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.order !== order)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingRoteiro) {
      await onSaveRoteiro({
        ...editingRoteiro,
        ...formData
      });
    } else {
      await onSaveRoteiro({
        ...formData,
        createdAt: Date.now()
      });
    }
    setIsModalOpen(false);
  };

  const filteredRoteiros = roteiros.filter(r => selectedCategory === 'ALL' || r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Bar with Standard Norms Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Diretrizes de Orientação FEB
          </span>
          <h2 className="text-xl font-bold">
            Roteiros, Protocolos da Mesa & Diretrizes Doutrinárias
          </h2>
          <p className="text-xs text-blue-150 leading-relaxed text-blue-100">
            Orientações canônicas para a condução harmoniosa das Reuniões Públicas Doutrinárias, preparação do ambiente e fidelidade aos princípios kardequianos.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="bg-white hover:bg-blue-50 text-blue-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Roteiro Personalizado</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'Todos os Roteiros' },
          { id: 'MESA_DIRETORA', label: 'Mesa Diretora & Dirigentes' },
          { id: 'EXPOSITORES', label: 'Normas para Expositores' },
          { id: 'VIBRACOES', label: 'Guia de Vibrações' },
          { id: 'PASSE', label: 'Encaminhamento ao Passe' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Default Canonical Guidelines Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Canonical Card 1: Roteiro da Reunião Pública */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              Estrutura Padrão da Reunião Pública (FEB)
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
              60 Minutos Total
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
              <div>
                <strong className="text-slate-900 dark:text-white">Harmonização do Ambiente (10 min):</strong>
                <p className="text-slate-500">Música suave instrumental e acomodação serena dos assistidos no salão principal.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
              <div>
                <strong className="text-slate-900 dark:text-white">Leitura Preparatória & Prece Inicial (5 min):</strong>
                <p className="text-slate-500">Leitura breve de <i>O Evangelho Segundo o Espiritismo</i> seguida de oração simples e fervorosa.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
              <div>
                <strong className="text-slate-900 dark:text-white">Exposição Doutrinária (35 a 45 min):</strong>
                <p className="text-slate-500">Desenvolvimento claro e evangélico do tema selecionado, sem divagações estranhas ao Espiritismo.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">4</div>
              <div>
                <strong className="text-slate-900 dark:text-white">Vibrações Fraternas Coletivas (5 min):</strong>
                <p className="text-slate-500">Emissão de pensamentos de paz para enfermos, lares, crianças, idosos e o planeta.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">5</div>
              <div>
                <strong className="text-slate-900 dark:text-white">Prece Final e Encaminhamento ao Passe (Contínuo):</strong>
                <p className="text-slate-500">Agradecimento a Jesus e direcionamento ordenado para as cabines de passe fluídico.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Canonical Card 2: Manual do Dirigente da Mesa */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Recomendações ao Dirigente da Mesa
            </h3>
            <span className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-full">
              Postura & Ética
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              • <strong>Preces Espontâneas:</strong> Evitar fórmulas sacramentais decoradas ou orações excessivamente longas. A prece espírita prima pela sinceridade do coração e elevação dos sentimentos.
            </p>
            <p>
              • <strong>Acolhimento Fraterno:</strong> Ter especial carinho com quem visita a Casa pela primeira vez, explicando sumariamente como funcionam os trabalhos da noite sem constrangimentos.
            </p>
            <p>
              • <strong>Disciplina dos Horários:</strong> Iniciar e terminar a reunião pontualmente, respeitando o tempo dos frequentadores e dos trabalhadores dos demais setores (passe, biblioteca, acolhimento).
            </p>
            <p>
              • <strong>Sintonia Espiritual:</strong> O dirigente é a antena vibratória da mesa; deve manter-se em prece silenciosa e vigilância durante toda a explanação do expositor.
            </p>
          </div>
        </div>
      </div>

      {/* User Custom Saved Roteiros */}
      {filteredRoteiros.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Roteiros & Manuais Customizados da Casa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoteiros.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                      {r.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {r.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteRoteiro(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {r.content}
                </p>

                {r.steps && r.steps.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-500">Etapas do Roteiro:</span>
                    {r.steps.map((st, idx) => (
                      <div key={idx} className="text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span>{st.order}. {st.title}</span>
                        <span className="text-[10px] text-slate-400">{st.durationMinutes} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR ROTEIRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {editingRoteiro ? 'Editar Roteiro / Protocolo' : 'Novo Roteiro / Protocolo Doutrinário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Título do Roteiro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roteiro da Reunião de Domingo Manhã"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="MESA_DIRETORA">Mesa Diretora</option>
                    <option value="EXPOSITORES">Expositores</option>
                    <option value="VIBRACOES">Vibrações</option>
                    <option value="PASSE">Passe</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Duração Total (Minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Orientações Gerais / Texto
                </label>
                <textarea
                  rows={4}
                  placeholder="Orientações aos dirigentes e trabalhadores da mesa..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Roteiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
