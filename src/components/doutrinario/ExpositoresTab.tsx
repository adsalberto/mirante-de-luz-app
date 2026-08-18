import React, { useState } from 'react';
import { 
  Plus, 
  Mic2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  Search, 
  Tag, 
  FileText,
  Building,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { DoutrinarioExpositor } from '../../types';

interface ExpositoresTabProps {
  expositores: DoutrinarioExpositor[];
  onSaveExpositor: (expositor: Omit<DoutrinarioExpositor, 'id'> | DoutrinarioExpositor) => Promise<void>;
  onDeleteExpositor: (id: string) => Promise<void>;
}

export const ExpositoresTab: React.FC<ExpositoresTabProps> = ({
  expositores,
  onSaveExpositor,
  onDeleteExpositor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpositor, setEditingExpositor] = useState<DoutrinarioExpositor | null>(null);

  // Term Modal State
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'INTERNO' as DoutrinarioExpositor['type'],
    centerOrigin: '',
    status: 'ATIVO' as DoutrinarioExpositor['status'],
    specialtyThemes: [] as string[],
    availabilities: [] as string[],
    termAccepted: true,
    termAcceptedDate: new Date().toISOString().split('T')[0],
    bio: ''
  });

  const [themeInput, setThemeInput] = useState('');
  const [availInput, setAvailInput] = useState('');

  const handleOpenNew = () => {
    setEditingExpositor(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      type: 'INTERNO',
      centerOrigin: 'Centro Espírita Atual',
      status: 'ATIVO',
      specialtyThemes: ['O Evangelho Segundo o Espiritismo', 'O Livro dos Espíritos'],
      availabilities: ['Quarta-feira 20h', 'Domingo 09h'],
      termAccepted: true,
      termAcceptedDate: new Date().toISOString().split('T')[0],
      bio: ''
    });
    setThemeInput('');
    setAvailInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DoutrinarioExpositor) => {
    setEditingExpositor(item);
    setFormData({
      name: item.name,
      email: item.email || '',
      phone: item.phone || '',
      type: item.type,
      centerOrigin: item.centerOrigin || '',
      status: item.status,
      specialtyThemes: item.specialtyThemes || [],
      availabilities: item.availabilities || [],
      termAccepted: item.termAccepted,
      termAcceptedDate: item.termAcceptedDate || '',
      bio: item.bio || ''
    });
    setThemeInput('');
    setAvailInput('');
    setIsModalOpen(true);
  };

  const handleAddTheme = () => {
    if (themeInput.trim() && !formData.specialtyThemes.includes(themeInput.trim())) {
      setFormData({
        ...formData,
        specialtyThemes: [...formData.specialtyThemes, themeInput.trim()]
      });
      setThemeInput('');
    }
  };

  const handleRemoveTheme = (t: string) => {
    setFormData({
      ...formData,
      specialtyThemes: formData.specialtyThemes.filter(x => x !== t)
    });
  };

  const handleAddAvail = () => {
    if (availInput.trim() && !formData.availabilities.includes(availInput.trim())) {
      setFormData({
        ...formData,
        availabilities: [...formData.availabilities, availInput.trim()]
      });
      setAvailInput('');
    }
  };

  const handleRemoveAvail = (a: string) => {
    setFormData({
      ...formData,
      availabilities: formData.availabilities.filter(x => x !== a)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingExpositor) {
      await onSaveExpositor({
        ...editingExpositor,
        ...formData
      });
    } else {
      await onSaveExpositor({
        ...formData
      });
    }
    setIsModalOpen(false);
  };

  const filteredList = expositores.filter((exp) => {
    const matchesSearch = 
      exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.centerOrigin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.specialtyThemes.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = 
      typeFilter === 'ALL' ||
      (typeFilter === 'INTERNO' && exp.type === 'INTERNO') ||
      (typeFilter === 'CONVIDADO' && exp.type === 'CONVIDADO_EXTERNO') ||
      (typeFilter === 'PLANTAO' && exp.status === 'PLANTAO_EMERGENCIA');
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, tema de domínio ou casa de origem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Todos os Expositores</option>
            <option value="INTERNO">Trabalhadores da Casa</option>
            <option value="CONVIDADO">Convidados Externos</option>
            <option value="PLANTAO">Plantonistas de Emergência</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTermModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Termo Doutrinário FEB</span>
          </button>

          <button
            id="btn-add-expositor"
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Expositor</span>
          </button>
        </div>
      </div>

      {/* Expositores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header with Avatar and Type */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold flex items-center justify-center shadow-md">
                    {item.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      {item.centerOrigin || (item.type === 'INTERNO' ? 'Casa Espírita Atual' : 'Convidado Externo')}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'PLANTAO_EMERGENCIA'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                    : item.status === 'ATIVO'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {item.status === 'PLANTAO_EMERGENCIA' ? '⭐ Plantonista' : item.status === 'ATIVO' ? 'Ativo' : 'Indisponível'}
                </span>
              </div>

              {/* Doctrinal FEB Term Badge */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-medium">
                  {item.termAccepted ? 'Diretrizes Doutrinárias e Éticas Aceitas' : 'Pendente de Alinhamento Doutrinário'}
                </span>
              </div>

              {/* Specialty Themes */}
              {item.specialtyThemes && item.specialtyThemes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Temas de Domínio
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.specialtyThemes.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded-lg font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availabilities */}
              {item.availabilities && item.availabilities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Disponibilidade
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.availabilities.map((a, idx) => (
                      <span key={idx} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        • {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Contact */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.phone && (
                  <a
                    href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all"
                    title={`WhatsApp: ${item.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {item.email && (
                  <a
                    href={`mailto:${item.email}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all"
                    title={`Email: ${item.email}`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Editar Expositor"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteExpositor(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Excluir Expositor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
            <Mic2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhum expositor encontrado
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cadastre os expositores internos e convidados da Casa Espírita com disponibilidade de temas e contatos.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO DE EXPOSITOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mic2 className="w-5 h-5 text-blue-600" />
                {editingExpositor ? 'Editar Expositor' : 'Novo Expositor Doutrinário'}
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do expositor espírita"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="email@expositor.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Tipo de Vínculo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="INTERNO">Trabalhador da Casa</option>
                    <option value="CONVIDADO_EXTERNO">Convidado Externo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Status / Escala
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="PLANTAO_EMERGENCIA">⭐ Plantonista de Emergência</option>
                    <option value="INDISPONIVEL">Indisponível</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Casa Espírita de Origem
                </label>
                <input
                  type="text"
                  placeholder="Nome do Centro Espírita onde atua"
                  value={formData.centerOrigin}
                  onChange={(e) => setFormData({ ...formData, centerOrigin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Specialty Themes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Temas de Domínio
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar tema (ex: Família e Reencarnação)"
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTheme}
                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formData.specialtyThemes.map((t, idx) => (
                    <span key={idx} className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      {t}
                      <button type="button" onClick={() => handleRemoveTheme(t)} className="text-blue-500 hover:text-blue-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Term checkbox */}
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="chk-term"
                  checked={formData.termAccepted}
                  onChange={(e) => setFormData({ ...formData, termAccepted: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                />
                <label htmlFor="chk-term" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer">
                  Confirmo o alinhamento com as <span className="font-bold text-slate-900 dark:text-white">Diretrizes da FEB</span> (fidelidade a Kardec, vedação à cobrança de cachê e observância do tempo regulamentar de 35 a 45 min).
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingExpositor ? 'Salvar Alterações' : 'Cadastrar Expositor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TERMO DE DIRETRIZES DOUTRINÁRIAS FEB */}
      {isTermModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Termo de Diretrizes & Fidelidade Doutrinária (FEB)
              </h3>
              <button
                onClick={() => setIsTermModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-80 overflow-y-auto p-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Princípios Norteadores para a Exposição Espírita:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong>Fidelidade à Codificação:</strong> A exposição pública deve fundamentar-se estritamente nas Obras Básicas de Allan Kardec e no Evangelho de Jesus.</li>
                <li><strong>Gratuidade Absoluta:</strong> Em conformidade com o princípio "Dai de graça o que de graça recebestes", é terminantemente vedada a cobrança ou estipulação de honorários/cachês.</li>
                <li><strong>Linguagem Acolhedora e Clara:</strong> A mensagem deve ser compreensível tanto a frequentadores veteranos quanto a assistidos que comparecem à Casa pela primeira vez.</li>
                <li><strong>Isenção Partidária e Sem Sincretismos:</strong> Não se deve utilizar a tribuna espírita para manifestações político-partidárias ou práticas estranhas à Doutrina Espírita.</li>
                <li><strong>Disciplina do Tempo:</strong> A preleção doutrinária deve ter duração entre 35 e 45 minutos para resguardar a ordem do cronograma e o encaminhamento ao passe.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsTermModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
