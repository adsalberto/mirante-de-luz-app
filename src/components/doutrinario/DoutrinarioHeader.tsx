import React from 'react';
import { 
  Tv, 
  Calendar, 
  Mic2, 
  BookOpen, 
  HelpCircle, 
  ScrollText, 
  Clock, 
  Users, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { DoutrinarioPalestra, DoutrinarioEmprestimoLivro, DoutrinarioPergunta } from '../../types';

export type DoutrinarioTabType = 
  | 'MESA_AO_VIVO' 
  | 'CRONOGRAMA' 
  | 'EXPOSITORES' 
  | 'BIBLIOTECA' 
  | 'PERGUNTAS' 
  | 'ROTEIROS_DIRETRIZES';

interface DoutrinarioHeaderProps {
  activeTab: DoutrinarioTabType;
  onSelectTab: (tab: DoutrinarioTabType) => void;
  nextMeeting?: DoutrinarioPalestra;
  activeLoansCount: number;
  overdueLoansCount: number;
  pendingQuestionsCount: number;
  onOpenProjector: () => void;
}

export const DoutrinarioHeader: React.FC<DoutrinarioHeaderProps> = ({
  activeTab,
  onSelectTab,
  nextMeeting,
  activeLoansCount,
  overdueLoansCount,
  pendingQuestionsCount,
  onOpenProjector
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full border border-blue-400/30 font-medium">
              Diretrizes FEB & Codificação Kardequiana
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-300 font-medium bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3" /> Tempo Real Ativo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-blue-300" />
            Reunião Pública & Difusão Doutrinária
          </h1>
          <p className="text-sm text-blue-200/80 max-w-2xl">
            Gestão canônica de reuniões doutrinárias, condução da mesa diretora, escala de expositores, biblioteca circulante e acolhimento de dúvidas do público.
          </p>
        </div>

        {/* Quick Action: Open Fullscreen Projection */}
        <button
          id="btn-open-projector-tv"
          onClick={onOpenProjector}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all duration-200 shrink-0 cursor-pointer"
        >
          <Tv className="w-5 h-5 text-slate-950" />
          <span>Modo Telão / TV do Salão</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Meeting Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Próxima Doutrinária
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
              {nextMeeting ? nextMeeting.title : 'Nenhuma agendada'}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {nextMeeting ? `${nextMeeting.date} às ${nextMeeting.time}` : 'Aguardando escala'}
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Speaker Status */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Mic2 className="w-3.5 h-3.5 text-indigo-500" /> Expositor da Noite
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
              {nextMeeting ? nextMeeting.speakerName : 'A definir'}
            </p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
              nextMeeting?.status === 'CONFIRMADA' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : nextMeeting?.status === 'SUBSTITUIDA'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {nextMeeting?.status || 'Sem reunião ativa'}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Library Loans */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Empréstimos da Biblioteca
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{activeLoansCount}</p>
              <span className="text-xs text-slate-500">em circulação</span>
            </div>
            {overdueLoansCount > 0 ? (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-0.5 font-medium">
                <AlertCircle className="w-3 h-3" /> {overdueLoansCount} com prazo vencido
              </p>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Empréstimos em dia
              </p>
            )}
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Audience Questions */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> Perguntas dos Assistidos
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{pendingQuestionsCount}</p>
              <span className="text-xs text-slate-500">aguardando triagem</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esclarecimentos Kardequianos
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-2 shadow-sm overflow-x-auto">
        <nav className="flex space-x-2 py-2 min-w-max">
          <button
            id="tab-mesa-ao-vivo"
            onClick={() => onSelectTab('MESA_AO_VIVO')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'MESA_AO_VIVO'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Mesa do Dirigente & Ao Vivo</span>
          </button>

          <button
            id="tab-cronograma"
            onClick={() => onSelectTab('CRONOGRAMA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'CRONOGRAMA'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Cronograma de Reuniões</span>
          </button>

          <button
            id="tab-expositores"
            onClick={() => onSelectTab('EXPOSITORES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'EXPOSITORES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            <span>Expositores & Plantão</span>
          </button>

          <button
            id="tab-biblioteca"
            onClick={() => onSelectTab('BIBLIOTECA')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'BIBLIOTECA'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca & Empréstimos</span>
            {overdueLoansCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {overdueLoansCount}
              </span>
            )}
          </button>

          <button
            id="tab-perguntas"
            onClick={() => onSelectTab('PERGUNTAS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'PERGUNTAS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Perguntas dos Assistidos</span>
            {pendingQuestionsCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingQuestionsCount}
              </span>
            )}
          </button>

          <button
            id="tab-roteiros-diretrizes"
            onClick={() => onSelectTab('ROTEIROS_DIRETRIZES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ROTEIROS_DIRETRIZES'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Roteiros da Mesa & Diretrizes FEB</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
