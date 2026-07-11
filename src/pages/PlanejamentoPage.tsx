import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  GitPullRequest,
  CheckSquare,
  HelpCircle,
  FilePieChart,
  Grid,
  Search,
  MessageSquare,
  Eye,
  Settings,
  ChevronRight,
  ArrowRightLeft,
  CalendarRange,
  CornerDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  planejamentoService,
  StrategicPlan,
  Goal,
  Project,
  CoordActivity,
  PlanningEvent,
  MeetingMinutes,
  PlanningDocument,
  IntersectorDemand,
  COORDINATIONS
} from '../services/planejamentoData';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export function PlanejamentoPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estrategico' | 'metas' | 'projetos' | 'atividades' | 'calendario' | 'atas' | 'documentos' | 'integracao' | 'bi'>('dashboard');

  // Load States
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<CoordActivity[]>([]);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [meetings, setMeetings] = useState<MeetingMinutes[]>([]);
  const [documents, setDocuments] = useState<PlanningDocument[]>([]);
  const [demands, setDemands] = useState<IntersectorDemand[]>([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('Todos');

  // Deletion Modal safety States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'plan' | 'goal' | 'project' | 'activity' | 'event' | 'meeting' | 'document' | 'demand';
    id: string;
    label: string;
  } | null>(null);

  // Creation/Edit Modals States
  const [modalOpen, setModalOpen] = useState<{
    type: 'plan' | 'goal' | 'project' | 'activity' | 'event' | 'meeting' | 'document' | 'demand';
    mode: 'add' | 'edit';
    item?: any;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  // Active items detail trackers (for projects and minutes detail)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setPlans(planejamentoService.getPlans());
    setGoals(planejamentoService.getGoals());
    setProjects(planejamentoService.getProjects());
    setActivities(planejamentoService.getActivities());
    setEvents(planejamentoService.getEvents());
    setMeetings(planejamentoService.getMeetings());
    setDocuments(planejamentoService.getDocuments());
    setDemands(planejamentoService.getDemands());
  };

  const syncData = (type: string, updatedList: any[]) => {
    switch (type) {
      case 'plan':
        setPlans(updatedList);
        planejamentoService.savePlans(updatedList);
        break;
      case 'goal':
        setGoals(updatedList);
        planejamentoService.saveGoals(updatedList);
        break;
      case 'project':
        setProjects(updatedList);
        planejamentoService.saveProjects(updatedList);
        break;
      case 'activity':
        setActivities(updatedList);
        planejamentoService.saveActivities(updatedList);
        break;
      case 'event':
        setEvents(updatedList);
        planejamentoService.saveEvents(updatedList);
        break;
      case 'meeting':
        setMeetings(updatedList);
        planejamentoService.saveMeetings(updatedList);
        break;
      case 'document':
        setDocuments(updatedList);
        planejamentoService.saveDocuments(updatedList);
        break;
      case 'demand':
        setDemands(updatedList);
        planejamentoService.saveDemands(updatedList);
        break;
    }
  };

  // Safe deletion helper
  const triggerDelete = (type: any, id: string, label: string) => {
    setDeleteConfirm({ open: true, type, id, label });
  };

  const confirmDeletion = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    let list: any[] = [];
    switch (type) {
      case 'plan': list = plans.filter(p => p.id !== id); break;
      case 'goal': list = goals.filter(g => g.id !== id); break;
      case 'project': list = projects.filter(p => p.id !== id); break;
      case 'activity': list = activities.filter(a => a.id !== id); break;
      case 'event': list = events.filter(e => e.id !== id); break;
      case 'meeting': list = meetings.filter(m => m.id !== id); break;
      case 'document': list = documents.filter(d => d.id !== id); break;
      case 'demand': list = demands.filter(d => d.id !== id); break;
    }
    syncData(type, list);
    setDeleteConfirm(null);
  };

  // Open Form modal
  const openModalFor = (type: any, mode: 'add' | 'edit', item?: any) => {
    setModalOpen({ type, mode, item });
    if (mode === 'edit' && item) {
      setFormData({ ...item });
    } else {
      // Set defaults depending on type
      let defaults: any = {};
      if (type === 'plan') {
        defaults = { title: '', year: '2026', type: 'Anual', objective: '', description: '', responsible: 'Planejamento', deadline: '', status: 'Planejado' };
      } else if (type === 'goal') {
        defaults = { name: '', coordination: COORDINATIONS[0], description: '', startDate: '', endDate: '', successIndicator: '', progress: 0, status: 'Planejada' };
      } else if (type === 'project') {
        defaults = { name: '', description: '', coordinator: COORDINATIONS[0], startDate: '', endDate: '', budget: 0, status: 'Planejamento', team: '', tasks: [] };
      } else if (type === 'activity') {
        defaults = { coordination: COORDINATIONS[0], description: '', responsible: '', date: '', status: 'Pendente', resultado: '' };
      } else if (type === 'event') {
        defaults = { name: '', type: 'Reunião', date: '', time: '', coordination: COORDINATIONS[0], location: '', obs: '' };
      } else if (type === 'meeting') {
        defaults = { title: '', date: '', time: '', participants: '', agenda: '', decisions: '', actions: [] };
      } else if (type === 'document') {
        defaults = { name: '', category: 'Plano Anual', date: new Date().toISOString().split('T')[0], responsible: 'Planejamento', size: '1.2 MB' };
      } else if (type === 'demand') {
        defaults = { title: '', fromCoord: COORDINATIONS[0], toCoord: COORDINATIONS[1], description: '', deadline: '', status: 'Aberta', answer: '', date: new Date().toISOString().split('T')[0] };
      }
      setFormData(defaults);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalOpen) return;
    const { type, mode, item } = modalOpen;

    let updatedList = [];
    let currentList: any[] = [];
    switch (type) {
      case 'plan': currentList = plans; break;
      case 'goal': currentList = goals; break;
      case 'project': currentList = projects; break;
      case 'activity': currentList = activities; break;
      case 'event': currentList = events; break;
      case 'meeting': currentList = meetings; break;
      case 'document': currentList = documents; break;
      case 'demand': currentList = demands; break;
    }

    if (mode === 'add') {
      const newId = `${type.substring(0, 2)}_${Date.now()}`;
      let itemFormatted = { ...formData, id: newId };
      // Special sanitizations
      if (type === 'project') {
        itemFormatted.team = typeof formData.team === 'string' ? formData.team.split(',').map((s: string) => s.trim()) : [];
        itemFormatted.tasks = [];
      }
      if (type === 'meeting') {
        itemFormatted.participants = typeof formData.participants === 'string' ? formData.participants.split(',').map((s: string) => s.trim()) : [];
        itemFormatted.actions = [];
      }
      updatedList = [...currentList, itemFormatted];
    } else {
      let itemFormatted = { ...formData };
      if (type === 'project' && typeof formData.team === 'string') {
        itemFormatted.team = formData.team.split(',').map((s: string) => s.trim());
      }
      if (type === 'meeting' && typeof formData.participants === 'string') {
        itemFormatted.participants = formData.participants.split(',').map((s: string) => s.trim());
      }
      updatedList = currentList.map(x => x.id === item.id ? itemFormatted : x);
    }

    syncData(type, updatedList);
    setModalOpen(null);
  };

  // Project Task Helpers
  const toggleProjectTask = (projectId: string, taskId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
        return { ...p, tasks: updatedTasks };
      }
      return p;
    });
    syncData('project', updated);
  };

  const addProjectTask = (projectId: string, text: string, assigned: string, deadline: string) => {
    if (!text) return;
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const newTask = {
          id: `tk_${Date.now()}`,
          text,
          done: false,
          assignedTo: assigned || 'Geral',
          deadline: deadline || p.endDate
        };
        return { ...p, tasks: [...p.tasks, newTask] };
      }
      return p;
    });
    syncData('project', updated);
  };

  // Meeting Action Helpers
  const toggleMeetingActionDone = (meetingId: string, actionId: string) => {
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const updatedActions = m.actions.map(a => a.id === actionId ? { ...a, done: !a.done } : a);
        return { ...m, actions: updatedActions };
      }
      return m;
    });
    syncData('meeting', updated);
  };

  const addMeetingAction = (meetingId: string, text: string, resp: string, dl: string) => {
    if (!text) return;
    const updated = meetings.map(m => {
      if (m.id === meetingId) {
        const newAct = {
          id: `act_${Date.now()}`,
          text,
          responsible: resp || 'Secretário',
          deadline: dl || m.date,
          done: false
        };
        return { ...m, actions: [...m.actions, newAct] };
      }
      return m;
    });
    syncData('meeting', updated);
  };

  // General Status Count Metrics
  const activeProjectsCount = projects.filter(p => p.status === 'Em Execuição').length;
  const completedGoalsCount = goals.filter(g => g.status === 'Concluída').length;
  const inProgressGoalsCount = goals.filter(g => g.status === 'Em Execuição').length;
  const pendingDemandsCount = demands.filter(d => d.status === 'Aberta').length;

  // Custom visual calendar calculations
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState('2026-06');
  const getDaysInMonth = (yearMonth: string) => {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(y, m, 0);
    return date.getDate();
  };

  const getCalendarEventsForDay = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const fullDate = `${currentCalendarMonth}-${dayStr}`;
    return events.filter(e => e.date === fullDate);
  };

  // BI tab color array
  const BI_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section with consistent "Mirante de Luz" branding */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest leading-none">
            <Target size={16} />
            <span>Secretaria de Planejamento e Organização</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-none uppercase">
            Planejamento Geral
          </h1>
          <p className="text-gray-400 font-medium text-sm sm:text-base">
            Alinhamento estratégico, acompanhamento de metas institucionais e integração integrada entre os setores de caridade e ensino.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              // Easily trigger pre-seeded reset to show raw functionality
              if (window.confirm('Deseja resetar as informações deste módulo para o padrão pre-configurado da Secretaria?')) {
                localStorage.removeItem('plan_plans');
                localStorage.removeItem('plan_goals');
                localStorage.removeItem('plan_projects');
                localStorage.removeItem('plan_activities');
                localStorage.removeItem('plan_events');
                localStorage.removeItem('plan_meetings');
                localStorage.removeItem('plan_documents');
                localStorage.removeItem('plan_demands');
                loadAllData();
              }
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl text-xs font-bold transition-all"
          >
            Resetar Dados Demonstrativos
          </button>
        </div>
      </header>

      {/* Tabs list with horizontal scrolling support */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-gray-100">
        {[
          { id: 'dashboard', label: 'Painel Central', icon: Grid },
          { id: 'estrategico', label: 'Planos Estratégicos', icon: Layers },
          { id: 'metas', label: 'Gestão de Metas', icon: TrendingUp },
          { id: 'projetos', label: 'Projetos', icon: Briefcase },
          { id: 'atividades', label: 'Atividades Mensais', icon: CheckSquare },
          { id: 'calendario', label: 'Calendário Geral', icon: Calendar },
          { id: 'atas', label: 'Atas e Reuniões', icon: FileText },
          { id: 'documentos', label: 'Repositório', icon: Settings },
          { id: 'integracao', label: 'Demandas Integradas', icon: ArrowRightLeft },
          { id: 'bi', label: 'Métricas e BI', icon: FilePieChart }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97]",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600/10"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH OR CO-ORD FILTER (visible on list-heavy tabs) */}
      {['estrategico', 'metas', 'projetos', 'atividades', 'documentos', 'integracao'].includes(activeTab) && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-300">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar pelo título, descrição ou responsável..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 text-xs text-gray-800 outline-none transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Setor Responsável:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-xl text-xs font-bold outline-none text-gray-700"
            >
              <option value="Todos">Todos os Setores</option>
              {COORDINATIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT AREA */}
      <main className="min-h-[450px]">
        {/* TAB 1: DASHBOARD CENTRAL PANEL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick overview metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Projetos em Andamento', value: activeProjectsCount, sub: 'Fase de execução ativa', icon: Briefcase, color: 'indigo' },
                { title: 'Metas Concluídas', value: completedGoalsCount, sub: `${inProgressGoalsCount} em andamento`, icon: CheckCircle2, color: 'emerald' },
                { title: 'Demandas de Apoio Abertas', value: pendingDemandsCount, sub: 'Integração intersetorial pendente', icon: ArrowRightLeft, color: 'amber' },
                { title: 'Atas Registradas', value: meetings.length, sub: 'Histórico de deliberações', icon: FileText, color: 'purple' }
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">{m.title}</p>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none pt-1">{m.value}</h3>
                      <p className="text-[10px] text-gray-400 font-medium italic">{m.sub}</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", `bg-${m.color}-50 text-${m.color}-600`)}>
                      <Icon size={24} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Core dynamic states in progress */}
              <div className="lg:col-span-8 space-y-6">
                {/* Active Projects progress timeline */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight italic flex items-center gap-2 uppercase">
                      <Briefcase size={18} className="text-indigo-600" />
                      Projetos em Destaque
                    </h2>
                    <button
                      onClick={() => setActiveTab('projetos')}
                      className="text-[10px] font-black uppercase text-indigo-600 tracking-wider hover:underline"
                    >
                      Gerenciar Projetos
                    </button>
                  </div>
                  <div className="space-y-4">
                    {projects.map(p => {
                      const totalTasks = p.tasks.length;
                      const doneTasks = p.tasks.filter(t => t.done).length;
                      const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                      return (
                        <div key={p.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-gray-800 tracking-tight">{p.name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium italic">Coord: {p.coordinator}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              p.status === 'Em Execuição' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                            )}>
                              {p.status}
                            </span>
                          </div>
                          {/* Mini Progress */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500">
                              <span>Checklist do Projeto</span>
                              <span>{pct}% ({doneTasks}/{totalTasks})</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Integration Requests Box */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight italic flex items-center gap-2 uppercase">
                      <ArrowRightLeft size={18} className="text-indigo-600" />
                      Demandas de Apoio entre Setores
                    </h2>
                    <button
                      onClick={() => setActiveTab('integracao')}
                      className="text-[10px] font-black uppercase text-indigo-600 tracking-wider hover:underline"
                    >
                      Central de Solicitações
                    </button>
                  </div>
                  <div className="space-y-3">
                    {demands.slice(0, 3).map(d => (
                      <div key={d.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                          <MessageSquare size={16} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-xs text-gray-800 tracking-tight">{d.title}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                              d.status === 'Aberta' ? "bg-amber-50 text-amber-600" :
                              d.status === 'Aceita' ? "bg-blue-50 text-blue-600" :
                              "bg-emerald-50 text-emerald-600"
                            )}>
                              {d.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{d.description}</p>
                          <div className="pt-2 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <span>De: <strong className="text-gray-600">{d.fromCoord}</strong></span>
                            <span>Para: <strong className="text-gray-600">{d.toCoord}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Next happenings & meetings overview */}
              <div className="lg:col-span-4 space-y-6">
                {/* Metas Projections widget */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight italic flex items-center gap-2 uppercase">
                    <TrendingUp size={18} className="text-indigo-600" />
                    Progresso de Metas
                  </h2>
                  <div className="space-y-4">
                    {goals.slice(0, 4).map(g => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex justify-between items-end gap-2 text-xs">
                          <p className="font-bold text-gray-700 truncate">{g.name}</p>
                          <span className="font-black text-indigo-600">{g.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              g.progress === 100 ? "bg-emerald-500" : "bg-indigo-600"
                            )}
                            style={{ width: `${g.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events Calendar widget */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight italic uppercase flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      Próximos Eventos
                    </h2>
                    <button
                      onClick={() => setActiveTab('calendario')}
                      className="text-[10px] font-black uppercase text-indigo-600 tracking-wider hover:underline"
                    >
                      Calendário
                    </button>
                  </div>
                  <div className="space-y-3">
                    {events.slice(0, 3).map(e => (
                      <div key={e.id} className="p-3 bg-gray-50 rounded-2xl flex gap-3 text-xs border border-gray-100">
                        <div className="bg-indigo-600 text-white rounded-xl p-2 font-black text-center min-w-[50px] flex flex-col justify-center leading-tight">
                          <span>{e.date.split('-')[2]}</span>
                          <span className="text-[9px] uppercase tracking-wider font-medium">JUN</span>
                        </div>
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <h4 className="font-bold text-gray-800 tracking-tight truncate">{e.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{e.type} • {e.time}</p>
                          <p className="text-[10px] text-gray-500 italic truncate">{e.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLANS */}
        {activeTab === 'estrategico' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Planos Gerais da Casa</h3>
              <button
                onClick={() => openModalFor('plan', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Novo Plano
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans
                .filter(p => {
                  if (sectorFilter !== 'Todos' && p.responsible !== sectorFilter) return false;
                  return p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.objective.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600">
                          {p.type} • {p.year}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          p.status === 'Concluído' ? "bg-emerald-50 text-emerald-600" :
                          p.status === 'Em andamento' ? "bg-blue-50 text-blue-600" :
                          p.status === 'Suspenso' ? "bg-amber-50 text-amber-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {p.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-base text-gray-800 tracking-tight leading-tight">{p.title}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{p.responsible}</p>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed"><strong className="text-gray-800">Objetivo:</strong> {p.objective}</p>
                      <p className="text-xs text-gray-500 leading-relaxed italic">{p.description}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-between items-end gap-2">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Prazo Final</span>
                        <span className="text-xs font-bold text-gray-700">{p.deadline}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModalFor('plan', 'edit', p)}
                          className="p-1 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1"
                        >
                          <Pencil size={11} /> Editar
                        </button>
                        <button
                          onClick={() => triggerDelete('plan', p.id, p.title)}
                          className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all flex items-center gap-1"
                        >
                          <Trash2 size={11} /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: GOALS */}
        {activeTab === 'metas' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Painel de Metas de Planejamento</h3>
              <button
                onClick={() => openModalFor('goal', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Nova Meta
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest select-none">
                      <th className="p-4 pl-6">Meta</th>
                      <th className="p-4">Coordenação</th>
                      <th className="p-4">Indicador de Sucesso</th>
                      <th className="p-4">Período</th>
                      <th className="p-4" style={{ width: '180px' }}>Progresso</th>
                      <th className="p-4">Situação</th>
                      <th className="p-4 pr-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {goals
                      .filter(g => {
                        if (sectorFilter !== 'Todos' && g.coordination !== sectorFilter) return false;
                        return g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map(g => (
                        <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 pl-6 space-y-1">
                            <span className="font-extrabold text-gray-800 text-sm tracking-tight leading-tight block">{g.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium line-clamp-1 italic">{g.description}</span>
                          </td>
                          <td className="p-4 font-bold text-gray-800">{g.coordination}</td>
                          <td className="p-4 text-gray-600">{g.successIndicator}</td>
                          <td className="p-4 text-[11px] font-medium text-gray-500 whitespace-nowrap">
                            {g.startDate} até {g.endDate}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                <span>Controle de Meta</span>
                                <span>{g.progress}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${g.progress}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              g.status === 'Concluída' ? "bg-emerald-50 text-emerald-600" :
                              g.status === 'Em Execuição' ? "bg-blue-50 text-blue-600" :
                              g.status === 'Atrasada' ? "bg-red-50 text-red-600" :
                              "bg-gray-100 text-gray-600"
                            )}>
                              {g.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openModalFor('goal', 'edit', g)}
                                className="p-1 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1 inline-flex"
                              >
                                <Pencil size={11} /> Editar
                              </button>
                              <button
                                onClick={() => triggerDelete('goal', g.id, g.name)}
                                className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all flex items-center gap-1 inline-flex"
                              >
                                <Trash2 size={11} /> Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROJECTS */}
        {activeTab === 'projetos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Organização de Projetos</h3>
              <button
                onClick={() => openModalFor('project', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Novo Projeto
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Projects List LHS */}
              <div className="lg:col-span-5 space-y-4">
                {projects
                  .filter(p => {
                    if (sectorFilter !== 'Todos' && p.coordinator !== sectorFilter) return false;
                    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .map(p => {
                    const doneCnt = p.tasks.filter(t => t.done).length;
                    const totalCnt = p.tasks.length;
                    const pct = totalCnt > 0 ? Math.round((doneCnt / totalCnt) * 100) : 0;
                    const isSelected = selectedProjectId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={cn(
                          "bg-white p-5 rounded-3xl border [cursor:pointer] shadow-sm hover:shadow-md transition-all space-y-4",
                          isSelected ? "ring-2 ring-indigo-600 border-transparent bg-indigo-50/10" : "border-gray-100"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-base text-gray-800 tracking-tight leading-tight">{p.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Coordenador: {p.coordinator}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            p.status === 'Concluído' ? "bg-emerald-50 text-emerald-600" :
                            p.status === 'Em Execuição' ? "bg-blue-50 text-blue-600" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>

                        <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-gray-400">
                          <span>Checklist: {doneCnt}/{totalCnt} ({pct}%)</span>
                          <span>Orçamento: R$ {p.budget.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[10px] text-gray-400 font-medium">Período: {p.startDate} a {p.endDate}</span>
                          <span className="text-[10px] text-indigo-600 font-black flex items-center gap-1 hover:underline">
                            Cronograma <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Dynamic Project interactive timeline RHS */}
              <div className="lg:col-span-7">
                {selectedProjectId ? (() => {
                  const p = projects.find(x => x.id === selectedProjectId);
                  if (!p) return <div className="text-center p-12 text-gray-400">Projeto não encontrado...</div>;
                  return (
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-50">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Detalhes do Cronograma</span>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{p.name}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed font-medium">{p.description}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openModalFor('project', 'edit', p)}
                            className="p-1 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => triggerDelete('project', p.id, p.name)}
                            className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {/* Team List & Finances details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                            <Users size={12} /> Equipe Envolvida
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {p.team.length > 0 ? p.team.map((member, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-white border border-gray-100 rounded-full text-[11px] font-bold text-gray-700">
                                {member}
                              </span>
                            )) : <span className="text-xs text-gray-400 italic">Nenhum membro listado</span>}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                            <DollarSign size={12} /> Limite de Investimento
                          </span>
                          <p className="text-lg font-black text-indigo-900 leading-none">R$ {p.budget.toLocaleString('pt-BR')}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Aprovado pelo Secretário Financeiro</p>
                        </div>
                      </div>

                      {/* Checklist Interactive Manager */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                          <CheckSquare size={14} /> Checklist de Atividades e Prazos
                        </h4>

                        <div className="space-y-2">
                          {p.tasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:bg-gray-50/50">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={t.done}
                                  onChange={() => toggleProjectTask(p.id, t.id)}
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 accent-indigo-600 transition-all pointer-events-auto cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <span className={cn(
                                    "text-xs font-bold leading-tight",
                                    t.done ? "line-through text-gray-400 font-medium" : "text-gray-700"
                                  )}>
                                    {t.text}
                                  </span>
                                  <div className="flex gap-2 text-[10px] text-gray-400 font-medium">
                                    <span>Resp: <strong className="text-gray-500 font-bold">{t.assignedTo}</strong></span>
                                    <span>•</span>
                                    <span>Prazo: <strong className="text-gray-500 font-bold">{t.deadline}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inline Task adder */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget as HTMLFormElement;
                            const taskText = (form.elements.namedItem('taskText') as HTMLInputElement).value;
                            const taskAssigned = (form.elements.namedItem('taskAssigned') as HTMLInputElement).value;
                            const taskDeadline = (form.elements.namedItem('taskDeadline') as HTMLInputElement).value;
                            addProjectTask(p.id, taskText, taskAssigned, taskDeadline);
                            form.reset();
                          }}
                          className="pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                          <input
                            type="text"
                            name="taskText"
                            placeholder="Adicionar nova atividade..."
                            required
                            className="sm:col-span-2 px-3 py-2 border-0 bg-gray-50 focus:bg-white ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-600 rounded-xl text-xs text-gray-700"
                          />
                          <div className="flex gap-1.5 col-span-1">
                            <input
                              type="text"
                              name="taskAssigned"
                              placeholder="Responsável"
                              className="w-1/2 px-3 py-2 border-0 bg-gray-50 focus:bg-white ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-600 rounded-xl text-[11px] text-gray-700"
                            />
                            <button
                              type="submit"
                              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                            >
                              <Plus size={14} /> Inserir
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-full bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-12">
                    <Briefcase size={44} className="text-gray-300 mb-2" />
                    <h4 className="font-extrabold text-sm text-gray-700">Selecione um Projeto</h4>
                    <p className="text-xs text-gray-400 font-medium max-w-xs pt-1">
                      Clique em um projeto listado à esquerda para gerenciar seu cronograma de tarefas, escalas e limites financeiros.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COORDINATION ACTIVITIES */}
        {activeTab === 'atividades' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Monitoramento Semanal de Atividades</h3>
              <button
                onClick={() => openModalFor('activity', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Nova Atividade
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activities
                .filter(a => {
                  if (sectorFilter !== 'Todos' && a.coordination !== sectorFilter) return false;
                  return a.description.toLowerCase().includes(searchQuery.toLowerCase()) || a.responsible.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(a => (
                  <div key={a.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 tracking-wider">
                            {a.coordination}
                          </span>
                          <p className="text-[10px] text-gray-400 font-medium italic pt-1">Data agendada: {a.date}</p>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          a.status === 'Realizado' ? "bg-emerald-50 text-emerald-600" :
                          a.status === 'Em andamento' ? "bg-blue-50 text-blue-600" :
                          a.status === 'Cancelado' ? "bg-red-50 text-red-600" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 tracking-tight leading-relaxed">{a.description}</p>
                      
                      {a.resultado && (
                        <div className="p-3 bg-emerald-50/45 rounded-xl border border-emerald-50 space-y-1">
                          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                            <CheckCircle2 size={10} /> Resultado Alcançado
                          </span>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic">{a.resultado}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center text-[11px]">
                      <span className="font-bold text-gray-600">Resp: {a.responsible}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModalFor('activity', 'edit', a)}
                          className="p-1 px-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-[10px] font-bold text-gray-500 hover:text-gray-900 transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => triggerDelete('activity', a.id, a.description)}
                          className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 6: INSTITUTIONAL CALENDAR */}
        {activeTab === 'calendario' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Visualizador Geral</span>
                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Calendário Unificado da Casa</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-gray-400">Ir para o Mês:</span>
                <select
                  value={currentCalendarMonth}
                  onChange={(e) => setCurrentCalendarMonth(e.target.value)}
                  className="px-3 py-1 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-xl text-xs font-bold outline-none text-gray-700"
                >
                  <option value="2026-06">Junho 2026</option>
                  <option value="2026-07">Julho 2026</option>
                  <option value="2026-08">Agosto 2026</option>
                </select>
                <button
                  onClick={() => openModalFor('event', 'add')}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1"
                >
                  <Plus size={12} /> Novo Evento
                </button>
              </div>
            </div>

            {/* Custom Interactive Calendar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              {/* Grid 30 days block */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-extrabold text-sm text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                  <CalendarRange size={16} className="text-indigo-600" />
                  Mês de Trabalho Administrativo: {currentCalendarMonth === '2026-06' ? 'Junho' : currentCalendarMonth === '2026-07' ? 'Julho' : 'Agosto'}
                </h4>
                
                <div className="grid grid-cols-7 gap-2 select-none text-center font-black uppercase text-[9px] tracking-wider text-gray-400 border-b border-gray-50 pb-2">
                  <div>Dom</div>
                  <div>Seg</div>
                  <div>Ter</div>
                  <div>Qua</div>
                  <div>Qui</div>
                  <div>Sex</div>
                  <div>Sáb</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Mock spacing for month offsets (June starts on Monday) */}
                  {currentCalendarMonth === '2026-06' && <div />}
                  {currentCalendarMonth === '2026-07' && <div className="col-span-3" />}
                  {currentCalendarMonth === '2026-08' && <div className="col-span-6" />}

                  {Array.from({ length: getDaysInMonth(currentCalendarMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getCalendarEventsForDay(day);
                    return (
                      <div
                        key={day}
                        className={cn(
                          "min-h-[75px] p-2 bg-gray-50/50 rounded-xl hover:bg-indigo-50/30 transition-all border border-gray-100 flex flex-col justify-between align-stretch text-left group",
                          dayEvents.length > 0 ? "border-indigo-100 bg-white" : ""
                        )}
                      >
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 tracking-tight">{day}</span>
                        <div className="space-y-1">
                          {dayEvents.map(e => (
                            <div
                              key={e.id}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold leading-tight truncate border",
                                e.type === 'Reunião' ? "bg-amber-50 border-amber-100 text-amber-700" :
                                e.type === 'Campanha' ? "bg-rose-50 border-rose-100 text-rose-700" :
                                e.type === 'Curso' ? "bg-blue-50 border-blue-100 text-blue-700" :
                                "bg-emerald-50 border-emerald-100 text-emerald-700"
                              )}
                              title={`${e.name} (${e.time})`}
                            >
                              {e.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event Detailed view tab listing events RHS */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Lista de Eventos Cadastrados</span>
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {events
                      .filter(e => e.date.startsWith(currentCalendarMonth))
                      .map(e => (
                        <div key={e.id} className="p-3 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full font-black uppercase",
                              e.type === 'Reunião' ? "bg-amber-100 text-amber-800" :
                              e.type === 'Campanha' ? "bg-rose-100 text-rose-800" :
                              "bg-indigo-100 text-indigo-800"
                            )}>{e.type}</span>
                            <span className="font-extrabold text-gray-400">{e.date} {e.time}</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-gray-800">{e.name}</h5>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{e.coordination}</p>
                            <p className="text-[10px] text-gray-500 italic pt-1">Local: {e.location}</p>
                          </div>
                          {e.obs && <p className="text-[10px] text-gray-400 leading-snug border-l-2 border-indigo-100 pl-2">{e.obs}</p>}
                          
                          <div className="flex gap-1 justify-end pt-1">
                            <button
                              onClick={() => triggerDelete('event', e.id, e.name)}
                              className="p-1 px-2 hover:bg-red-50 text-[10px] font-black text-red-600 rounded transition-all"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: MEETING MINUTES & ACTIONS */}
        {activeTab === 'atas' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Atas Digitais de Planejamento</h3>
              <button
                onClick={() => openModalFor('meeting', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Elaborar Ata Digital
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Meeting List */}
              <div className="lg:col-span-5 space-y-4">
                {meetings.map(m => {
                  const isSelected = selectedMeetingId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMeetingId(m.id)}
                      className={cn(
                        "p-5 bg-white rounded-3xl border [cursor:pointer] shadow-sm hover:shadow-md transition-all space-y-3 relative",
                        isSelected ? "ring-2 ring-indigo-600 border-transparent bg-indigo-50/10" : "border-gray-100"
                      )}
                    >
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.date} às {m.time}</span>
                      <h4 className="font-extrabold text-sm text-gray-800 tracking-tight leading-snug">{m.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed italic">{m.agenda}</p>
                      
                      <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-indigo-600/80">
                        <span>Encaminhamentos: {m.actions?.length || 0}</span>
                        <span>Ver Ata na íntegra <ChevronRight size={12} className="inline" /></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Minute details & actionable tasks */}
              <div className="lg:col-span-7">
                {selectedMeetingId ? (() => {
                  const m = meetings.find(x => x.id === selectedMeetingId);
                  if (!m) return <div className="text-center p-12 text-gray-400">Ata não encontrada...</div>;
                  return (
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                      <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-50">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Ata Documental Autoridade Interna</span>
                          <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight">{m.title}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reunido dia: {m.date} às {m.time}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openModalFor('meeting', 'edit', m)}
                            className="p-1 px-2 text-[10px] font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 rounded-lg transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => triggerDelete('meeting', m.id, m.title)}
                            className="p-1 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-50 rounded-lg transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Participantes Presentes:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.participants.map((p, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-600">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Agenda & Decisions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block leading-none">Pauta de Discussão</span>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic">{m.agenda}</p>
                        </div>
                        <div className="p-4 bg-indigo-50/20 rounded-2xl space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block leading-none">Deliberações e Decisões</span>
                          <p className="text-[11px] text-gray-700 leading-relaxed font-bold">{m.decisions}</p>
                        </div>
                      </div>

                      {/* Actions/Tasks created from meeting */}
                      <div className="space-y-4 pt-2 border-t border-gray-50">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                          <CornerDownRight size={14} /> Atividades e Encaminhamentos Pendentes
                        </h4>

                        <div className="space-y-2">
                          {m.actions?.map(act => (
                            <div key={act.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50/50">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={act.done}
                                  onChange={() => toggleMeetingActionDone(m.id, act.id)}
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 accent-indigo-600 transition-all cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <p className={cn(
                                    "text-xs font-bold text-gray-700",
                                    act.done ? "line-through text-gray-400 font-medium" : ""
                                  )}>{act.text}</p>
                                  <div className="flex gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                    <span>Resp: <strong className="text-gray-500">{act.responsible}</strong></span>
                                    <span>•</span>
                                    <span>Prazo: <strong className="text-gray-500">{act.deadline}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inline action task adder */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const text = (form.elements.namedItem('actText') as HTMLInputElement).value;
                            const resp = (form.elements.namedItem('actResp') as HTMLInputElement).value;
                            const dl = (form.elements.namedItem('actDl') as HTMLInputElement).value;
                            addMeetingAction(m.id, text, resp, dl);
                            form.reset();
                          }}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                          <input
                            type="text"
                            name="actText"
                            placeholder="Atribuição ou tarefa..."
                            required
                            className="sm:col-span-2 px-3 py-2 border-0 bg-gray-50 focus:bg-white ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-600 rounded-xl text-xs text-gray-700"
                          />
                          <div className="flex gap-1.5 col-span-1">
                            <input
                              type="text"
                              name="actResp"
                              placeholder="Responsável"
                              className="w-1/2 px-3 py-2 border-0 bg-gray-50 focus:bg-white ring-1 ring-gray-100 focus:ring-2 focus:ring-indigo-600 rounded-xl text-[11px] text-gray-700"
                            />
                            <button
                              type="submit"
                              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center"
                            >
                              Encaminhar
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-full bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-12">
                    <FileText size={44} className="text-gray-300 mb-2" />
                    <h4 className="font-extrabold text-sm text-gray-700">Abra uma Ata Digital</h4>
                    <p className="text-xs text-gray-400 font-medium max-w-xs pt-1">
                      Selecione um registro de ata na coluna da esquerda para ler as decisões institucionais tomadas e gerenciar as pendências geradas pela secretaria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: DOCUMENT STORE */}
        {activeTab === 'documentos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Repositório de Planejamentos</h3>
              <button
                onClick={() => openModalFor('document', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Plus size={14} /> Catalogar PDF
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents
                .filter(d => {
                  if (sectorFilter !== 'Todos' && d.responsible !== sectorFilter) return false;
                  return d.name.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(d => (
                  <div key={d.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-start justify-between">
                    <div className="flex gap-3">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl flex-shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block">{d.category}</span>
                        <h4 className="font-bold text-xs text-gray-800 leading-snug line-clamp-1" title={d.name}>{d.name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Catalogador: {d.responsible}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Cadastrado: {d.date} • {d.size}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerDelete('document', d.id, d.name)}
                      className="p-1 px-2.5 rounded-lg border border-red-50 hover:bg-red-50 text-[10px] font-bold text-red-600 transition-all shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 9: INTERSECTORIAL COLLABORATION */}
        {activeTab === 'integracao' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Integração entre Coordenações</span>
                <p className="text-xs text-gray-400 font-medium">Central de apoio mútuco e solicitações colaborativas entre todos os setores autônomos.</p>
              </div>
              <button
                onClick={() => openModalFor('demand', 'add')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all flex-shrink-0"
              >
                <Plus size={14} /> Solicitar Apoio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demands
                .filter(d => {
                  if (sectorFilter !== 'Todos' && d.fromCoord !== sectorFilter && d.toCoord !== sectorFilter) return false;
                  return d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(d => (
                  <div key={d.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{d.date} • Prazo: {d.deadline}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          d.status === 'Aberta' ? "bg-amber-50 text-amber-600" :
                          d.status === 'Aceita' ? "bg-blue-50 text-blue-600" :
                          "bg-emerald-50 text-emerald-600"
                        )}>{d.status}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-base text-gray-800 tracking-tight leading-tight">{d.title}</h4>
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-wider">
                          <span>{d.fromCoord}</span>
                          <ArrowRightLeft size={12} className="text-gray-400" />
                          <span>{d.toCoord}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{d.description}</p>
                      
                      {d.status === 'Aberta' ? (
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-50 space-y-2">
                          <span className="text-[9px] font-black uppercase text-amber-700 tracking-widest block">Responder Solicitação de Apoio:</span>
                          <form
                            onSubmit={(e) => {
                               e.preventDefault();
                              const form = e.currentTarget;
                              const answer = (form.elements.namedItem('answerText') as HTMLInputElement).value;
                              const accept = (form.elements.namedItem('acceptRadio') as HTMLInputElement).checked;
                              const updated = demands.map(item => item.id === d.id ? {
                                ...item,
                                answer,
                                status: accept ? 'Aceita' : 'Recusada'
                              } as IntersectorDemand : item);
                              syncData('demand', updated);
                            }}
                            className="space-y-2"
                          >
                            <input
                              type="text"
                              name="answerText"
                              placeholder="Fórmula de resposta ou escalação de trabalhador..."
                              required
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-1 focus:ring-indigo-600"
                            />
                            <div className="flex justify-between items-center">
                              <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 cursor-pointer">
                                <input type="checkbox" name="acceptRadio" defaultChecked className="accent-indigo-600" />
                                Aceitar Demanda
                              </label>
                              <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-sm">
                                Enviar Resposta
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Resposta / Retorno:</span>
                            {d.status === 'Aceita' && (
                              <button
                                onClick={() => {
                                  const updated = demands.map(item => item.id === d.id ? { ...item, status: 'Concluída' } as IntersectorDemand : item);
                                  syncData('demand', updated);
                                }}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-[9px] font-bold uppercase transition-all"
                              >
                                Concluir de Apoio
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-semibold italic">{d.answer}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex justify-end gap-1">
                      <button
                        onClick={() => triggerDelete('demand', d.id, d.title)}
                        className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        Excluir Chamado
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 10: ANALYTICS & BI */}
        {activeTab === 'bi' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Probiabilidade de Sucesso Anual', val: '88%', sub: 'Acompanhamento trimestral', icon: TrendingUp },
                { label: 'Orçamentos Planejados Ativos', val: `R$ ${projects.reduce((acc, p) => acc + p.budget, 0).toLocaleString('pt-BR')}`, sub: 'Integrado ao Financeiro Cemil', icon: DollarSign },
                { label: 'Checklist Consolidado Geral', val: `${Math.round((projects.reduce((acc, p) => acc + p.tasks.filter(t => t.done).length, 0) / Math.max(projects.reduce((acc, p) => acc + p.tasks.length, 0), 1)) * 100)}%`, sub: 'Conformidade de prazos das coordenações', icon: CheckSquare }
              ].map((k, idx) => {
                const Icon = k.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider leading-none">{k.label}</p>
                      <h4 className="text-2xl font-black text-indigo-900 tracking-tight leading-none pt-1">{k.val}</h4>
                      <p className="text-[10px] text-gray-400 font-medium italic">{k.sub}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Icon size={20} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Proporção de Metas por Situação */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Metas por Situação de Progresso</span>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Em Execuição', value: goals.filter(g => g.status === 'Em Execuição').length },
                          { name: 'Concluídas', value: goals.filter(g => g.status === 'Concluída').length },
                          { name: 'Atrasadas', value: goals.filter(g => g.status === 'Atrasada').length },
                          { name: 'Planejadas', value: goals.filter(g => g.status === 'Planejada').length }
                        ].filter(v => v.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {goals.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={BI_COLORS[index % BI_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend side-info */}
                  <div className="space-y-2 pl-4 text-xs">
                    {[
                      { name: 'Em Execuição', fill: BI_COLORS[0] },
                      { name: 'Concluídas', fill: BI_COLORS[1] },
                      { name: 'Atrasadas', fill: BI_COLORS[2] },
                      { name: 'Planejadas', fill: BI_COLORS[3] }
                    ].map((l, i) => (
                      <div key={i} className="flex items-center gap-2 font-bold text-gray-600">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.fill }} />
                        <span>{l.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2: Orçamentos por Projeto Ativo */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Verba de Investimento Alocada por Projeto (R$)</span>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projects.map(p => ({ name: p.name.substring(0, 16) + '...', orçamento: p.budget }))}
                      margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="name" fontSize={10} stroke="#9ca3af" />
                      <YAxis fontSize={10} stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="orçamento" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: FORM CREATE / EDIT (Strategic Plans, Goals, Tasks, Atas, Document, Demands) */}
      <AnimatePresence>
        {modalOpen && (
          <div id="form-scrollable-modal" className="fixed inset-0 z-50 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] border border-gray-100 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col justify-between max-h-[90vh]"
            >
              <div className="p-6 bg-indigo-50/20 border-b border-gray-100/50 flex justify-between items-center">
                <h4 className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                  <Settings size={18} className="text-indigo-600" />
                  {modalOpen.mode === 'add' ? 'Adicionar' : 'Modificar'} {
                    modalOpen.type === 'plan' ? 'Plano Estratégico' :
                    modalOpen.type === 'goal' ? 'Meta' :
                    modalOpen.type === 'project' ? 'Projeto' :
                    modalOpen.type === 'activity' ? 'Atividade' :
                    modalOpen.type === 'event' ? 'Evento' :
                    modalOpen.type === 'meeting' ? 'Ata / Reunião' :
                    modalOpen.type === 'document' ? 'Documento PDF' :
                    'Chamado de Apoio'
                  }
                </h4>
                <button onClick={() => setModalOpen(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-all">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar text-xs text-gray-700">
                {/* DYNAMIC FIELDS FORM */}
                {modalOpen.type === 'plan' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Título do Plano</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                        placeholder="Ex: Reforço Pastoral e Ação Junina"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Ano</label>
                        <input
                          type="text"
                          required
                          value={formData.year || ''}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Tipo de Plano</label>
                        <select
                          value={formData.type || 'Anual'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl font-bold"
                        >
                          <option value="Anual">Anual</option>
                          <option value="Plurianual">Plurianual</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Objetivo Geral</label>
                      <input
                        type="text"
                        required
                        value={formData.objective || ''}
                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                        placeholder="Ex: Conquistar o acolhimento fraterno integral"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Descrição Detalhada</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                        placeholder="Justificativa, fases e considerações importantes..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Prazo de Encerramento</label>
                        <input
                          type="date"
                          required
                          value={formData.deadline || ''}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Status</label>
                        <select
                          value={formData.status || 'Planejado'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          <option value="Planejado">Planejado</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Suspenso">Suspenso</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {modalOpen.type === 'goal' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Nome da Meta</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Coordenação Responsável</label>
                      <select
                        value={formData.coordination || COORDINATIONS[0]}
                        onChange={(e) => setFormData({ ...formData, coordination: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                      >
                        {COORDINATIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 font-medium">Indicador de Sucesso</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 50 voluntários formados e certificados"
                        value={formData.successIndicator || ''}
                        onChange={(e) => setFormData({ ...formData, successIndicator: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Data de Início</label>
                        <input
                          type="date"
                          required
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Data de Término</label>
                        <input
                          type="date"
                          required
                          value={formData.endDate || ''}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Progresso (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.progress || 0}
                          onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600 font-medium">Situação</label>
                        <select
                          value={formData.status || 'Planejada'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          <option value="Planejada">Planejada</option>
                          <option value="Em Execuição">Em Execuição</option>
                          <option value="Concluída">Concluída</option>
                          <option value="Atrasada">Atrasada</option>
                          <option value="Cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Descrição</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                      />
                    </div>
                  </>
                )}

                {modalOpen.type === 'project' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Nome do Projeto</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Coordenador do Projeto</label>
                      <select
                        value={formData.coordinator || COORDINATIONS[0]}
                        onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                      >
                        {COORDINATIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Início</label>
                        <input
                          type="date"
                          required
                          value={formData.startDate || ''}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Término</label>
                        <input
                          type="date"
                          required
                          value={formData.endDate || ''}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Orçamento Previsto (R$)</label>
                        <input
                          type="number"
                          required
                          value={formData.budget || 0}
                          onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Status</label>
                        <select
                          value={formData.status || 'Planejamento'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          <option value="Planejamento">Planejamento</option>
                          <option value="Em Execuição">Em Execuição</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Equipe Envolvida (Separar por vígulas)</label>
                      <input
                        type="text"
                        value={Array.isArray(formData.team) ? formData.team.join(', ') : formData.team || ''}
                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        placeholder="Ex: João Mídias, Clara Logística"
                      />
                    </div>
                    <div className="space-y-1 font-medium">
                      <label className="font-bold text-gray-600">Descrição Geral</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {modalOpen.type === 'activity' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Coordenação realizadora</label>
                      <select
                        value={formData.coordination || COORDINATIONS[0]}
                        onChange={(e) => setFormData({ ...formData, coordination: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                      >
                        {COORDINATIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Descrição da Ação</label>
                      <input
                        type="text"
                        required
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        placeholder="Ex: Preparar lembrancinhas lúdicas infantis"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Trabalhador Responsável</label>
                        <input
                          type="text"
                          required
                          value={formData.responsible || ''}
                          onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Data Prevista</label>
                        <input
                          type="date"
                          required
                          value={formData.date || ''}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600 font-medium">Status Execução</label>
                        <select
                          value={formData.status || 'Pendente'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Realizado">Realizado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Resultado Alcançado (Caso concluída)</label>
                      <textarea
                        value={formData.resultado || ''}
                        onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                        placeholder="Ex: 120 crianças presenteadas."
                      />
                    </div>
                  </>
                )}

                {modalOpen.type === 'event' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 font-medium">Nome do Evento</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Tipo da Atividade</label>
                        <select
                          value={formData.type || 'Reunião'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          <option value="Reunião">Reunião</option>
                          <option value="Curso">Curso</option>
                          <option value="Palestra">Palestra</option>
                          <option value="Campanha">Campanha</option>
                          <option value="Evento">Evento</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600 font-medium">Coordenação</label>
                        <select
                          value={formData.coordination || COORDINATIONS[0]}
                          onChange={(e) => setFormData({ ...formData, coordination: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          {COORDINATIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Data do Calendário</label>
                        <input
                          type="date"
                          required
                          value={formData.date || ''}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Horário</label>
                        <input
                          type="time"
                          required
                          value={formData.time || ''}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Local ou Canal</label>
                      <input
                        type="text"
                        required
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        placeholder="Ex: Sala Vermelha (Kardec) ou Google Meet"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 font-medium">Observações</label>
                      <textarea
                        value={formData.obs || ''}
                        onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                      />
                    </div>
                  </>
                )}

                {modalOpen.type === 'meeting' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Título / Assunto da Ata</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        placeholder="Ex: Planejamento Pedagógico Bimestral"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-medium">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Data Reunião</label>
                        <input
                          type="date"
                          required
                          value={formData.date || ''}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Horário</label>
                        <input
                          type="time"
                          required
                          value={formData.time || ''}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Participantes (separados por vírgula)</label>
                      <input
                        type="text"
                        value={Array.isArray(formData.participants) ? formData.participants.join(', ') : formData.participants || ''}
                        onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                        placeholder="Ex: Carlos (Pres), Maria (Ensino)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Conteúdo Pauta</label>
                      <textarea
                        value={formData.agenda || ''}
                        required
                        onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Decisões Finais</label>
                      <textarea
                        value={formData.decisions || ''}
                        required
                        onChange={(e) => setFormData({ ...formData, decisions: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {modalOpen.type === 'document' && (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Nome do Arquivo PDF</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        placeholder="Ex: Relatorio_Atividades_Estudos_2026.pdf"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Categoria Documental</label>
                      <select
                        value={formData.category || 'Plano Anual'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                      >
                        <option value="Plano Anual">Plano Anual</option>
                        <option value="Planejamento Estratégico">Planejamento Estratégico</option>
                        <option value="Cronograma">Cronograma</option>
                        <option value="Projeto">Projeto</option>
                        <option value="Relatório">Relatório</option>
                        <option value="Diretrizes">Diretrizes</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Responsável</label>
                        <select
                          value={formData.responsible || 'Planejamento'}
                          onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl font-bold"
                        >
                          {COORDINATIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Tamanho Estimado</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 1.4 MB"
                          value={formData.size || '1.2 MB'}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                {modalOpen.type === 'demand' && (
                  <>
                    <div className="space-y-1 font-medium">
                      <label className="font-bold text-gray-600">Título do Chamado</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        placeholder="Ex: Apoio Visual em Mídias Sociais"
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 focus:bg-white rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-bold">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-600">Seu Setor (De:)</label>
                        <select
                          value={formData.fromCoord || COORDINATIONS[0]}
                          onChange={(e) => setFormData({ ...formData, fromCoord: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl text-gray-700"
                        >
                          {COORDINATIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1 font-semibold">
                        <label className="font-bold text-gray-600">Setor Solicitado (Para:)</label>
                        <select
                          value={formData.toCoord || COORDINATIONS[1]}
                          onChange={(e) => setFormData({ ...formData, toCoord: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl text-gray-700"
                        >
                          {COORDINATIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Prazo Esperado</label>
                      <input
                        type="date"
                        required
                        value={formData.deadline || ''}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">Descrição do Apoio Demandado</label>
                      <textarea
                        value={formData.description || ''}
                        required
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border-0 rounded-xl focus:bg-white"
                        placeholder="Explique detalhadamente o que precisa de cooperação ou material..."
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-xl active:scale-95 transition-all"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md"
                  >
                    Confirmar e Gravar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DELETION SAFETY EXCLUSIVE CONFIRMATION DIALOG (Avoids iframe errors) */}
      <AnimatePresence>
        {deleteConfirm && (
          <div id="delete-confirmation-container-modal" className="fixed inset-0 z-50 bg-indigo-950/45 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 max-w-sm w-full shadow-2xl space-y-4 text-center text-xs text-gray-700"
            >
              <div className="p-3 bg-red-50 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <h4 className="font-black text-gray-900 tracking-tight text-base uppercase">Confirmação de Exclusão</h4>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Ação Irreversível</p>
              
              <p className="text-gray-500 leading-relaxed font-semibold">
                Deseja realmente excluir permanentemente o item <strong className="text-gray-800 italic">"{deleteConfirm.label}"</strong>?
              </p>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-1/2 py-2.5 border border-gray-200 text-gray-700 font-extrabold hover:bg-gray-50 rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeletion}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl active:scale-95 transition-all shadow-md"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
