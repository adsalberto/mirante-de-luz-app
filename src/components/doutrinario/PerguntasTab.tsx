import React, { useState } from 'react';
import { 
  Plus, 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen, 
  X, 
  Trash2, 
  MessageSquare, 
  Edit3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { DoutrinarioPergunta } from '../../types';

interface PerguntasTabProps {
  perguntas: DoutrinarioPergunta[];
  onSavePergunta: (pergunta: Omit<DoutrinarioPergunta, 'id'> | DoutrinarioPergunta) => Promise<void>;
  onDeletePergunta: (id: string) => Promise<void>;
}

export const PerguntasTab: React.FC<PerguntasTabProps> = ({
  perguntas,
  onSavePergunta,
  onDeletePergunta
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [selectedPergunta, setSelectedPergunta] = useState<DoutrinarioPergunta | null>(null);

  // New Question Form
  const [newQuestionData, setNewQuestionData] = useState({
    meetingDate: new Date().toISOString().split('T')[0],
    palestraTitle: '',
    questionText: '',
    askerName: ''
  });

  // Answer Form
  const [answerData, setAnswerData] = useState({
    answerText: '',
    answeredBy: '',
    doctrinalRef: '',
    status: 'RESPONDIDA' as DoutrinarioPergunta['status']
  });

  const handleOpenAdd = () => {
    setNewQuestionData({
      meetingDate: new Date().toISOString().split('T')[0],
      palestraTitle: 'Reunião Pública Doutrinária',
      questionText: '',
      askerName: 'Assistido(a)'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAnswer = (item: DoutrinarioPergunta) => {
    setSelectedPergunta(item);
    setAnswerData({
      answerText: item.answerText || '',
      answeredBy: item.answeredBy || 'Expositor da Noite',
      doctrinalRef: item.doctrinalRef || 'O Livro dos Espíritos',
      status: item.status === 'RECEBIDA' ? 'RESPONDIDA' : item.status
    });
    setIsAnswerModalOpen(true);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionData.questionText) return;

    await onSavePergunta({
      ...newQuestionData,
      status: 'RECEBIDA',
      createdAt: Date.now()
    });
    setIsAddModalOpen(false);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPergunta || !answerData.answerText) return;

    await onSavePergunta({
      ...selectedPergunta,
      ...answerData
    });
    setIsAnswerModalOpen(false);
  };

  const filteredList = perguntas.filter((p) => {
    const matchesSearch = 
      p.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.askerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.answerText || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DoutrinarioPergunta['status']) => {
    switch (status) {
      case 'RESPONDIDA':
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Respondida</span>;
      case 'EM_TRIAGEM':
        return <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Em Triagem</span>;
      case 'ARQUIVADA':
        return <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">Arquivada</span>;
      default:
        return <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Aguardando Resposta</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar perguntas, dúvidas ou respostas..."
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
            <option value="RECEBIDA">Aguardando Resposta</option>
            <option value="EM_TRIAGEM">Em Triagem</option>
            <option value="RESPONDIDA">Respondidas</option>
            <option value="ARQUIVADA">Arquivadas</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Pergunta da Urna / Assistido</span>
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold">{item.meetingDate}</span>
                <span>•</span>
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>{item.askerName || 'Assistido Anônimo'}</span>
                {item.palestraTitle && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-xs">{item.palestraTitle}</span>
                  </>
                )}
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Pergunta do Assistido:
              </span>
              <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                "{item.questionText}"
              </p>
            </div>

            {/* Answer Section if available */}
            {item.answerText ? (
              <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Esclarecimento Doutrinário:
                  </span>
                  {item.doctrinalRef && (
                    <span className="text-xs text-slate-500 font-medium">
                      Ref: {item.doctrinalRef}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  {item.answerText}
                </p>
                {item.answeredBy && (
                  <p className="text-[11px] text-slate-400 text-right">
                    Respondido por: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.answeredBy}</span>
                  </p>
                )}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => handleOpenAnswer(item)}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{item.answerText ? 'Editar Resposta' : 'Elaborar Resposta Doutrinária'}</span>
              </button>

              <button
                onClick={() => onDeletePergunta(item.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                title="Excluir Pergunta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhuma pergunta registrada
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilize esta seção para registrar dúvidas depositadas na urna de perguntas pelos frequentadores da reunião pública.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: NOVA PERGUNTA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Registrar Pergunta do Assistido
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Pergunta / Dúvida do Assistido *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Digite a dúvida transcrita da urna ou relatada pelo frequentador..."
                  value={newQuestionData.questionText}
                  onChange={(e) => setNewQuestionData({ ...newQuestionData, questionText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Nome do Assistido
                  </label>
                  <input
                    type="text"
                    placeholder="Ou 'Anônimo'"
                    value={newQuestionData.askerName}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, askerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Data da Reunião
                  </label>
                  <input
                    type="date"
                    value={newQuestionData.meetingDate}
                    onChange={(e) => setNewQuestionData({ ...newQuestionData, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Pergunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELABORAR RESPOSTA */}
      {isAnswerModalOpen && selectedPergunta && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Resposta e Fundamentação Kardequiana
              </h3>
              <button
                onClick={() => setIsAnswerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">Pergunta:</span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic mt-0.5">
                "{selectedPergunta.questionText}"
              </p>
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Resposta / Esclarecimento à Luz do Espiritismo *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Elabore a resposta fraterna fundamentada na Codificação Espírita..."
                  value={answerData.answerText}
                  onChange={(e) => setAnswerData({ ...answerData, answerText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Referência (Kardec / FEB)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: O Livro dos Espíritos, q. 132"
                    value={answerData.doctrinalRef}
                    onChange={(e) => setAnswerData({ ...answerData, doctrinalRef: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Responsável pelo Esclarecimento
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do expositor ou comissão"
                    value={answerData.answeredBy}
                    onChange={(e) => setAnswerData({ ...answerData, answeredBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAnswerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Resposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
