import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  HeartHandshake, 
  TrendingUp, 
  ChevronRight,
  UserPlus,
  Calendar,
  CalendarCheck,
  Zap,
  Sparkles,
  Heart,
  ShieldCheck,
  Mic2,
  Settings,
  LayoutDashboard,
  MessageSquare,
  Palette,
  BookOpen,
  Baby,
  Handshake,
  Activity,
  Shield,
  ArrowLeft,
  GraduationCap,
  Megaphone,
  Monitor,
  Package,
  Wrench
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { dataService } from '../services/dataService';
import { DashboardStats, AgendaEvent, Speaker, Sector, AGENDA_EVENT_TYPE_LABELS, formatSectorName } from '../types';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { reflections } from '../constants/reflections';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReceptionistDashboard from './ReceptionistDashboard';
import VolunteerDashboard from './VolunteerDashboard';
import SpeakerDashboard from './SpeakerDashboard';
import AdministrativeDashboard from './AdministrativeDashboard';
import SectorDashboard from '../components/SectorDashboard';
import { DoutrinarioDashboard } from '../components/doutrinario/DoutrinarioDashboard';
import { FraternoDashboard } from '../components/fraterno/FraternoDashboard';

const ViewSwitcher = ({ current, set, sectors }: { current: string, set: (v: any) => void, sectors: Sector[] }) => {
  const getSectorIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('comunicação') || n.includes('comunicacao')) return Megaphone;
    if (n.includes('tecnolog') || n.includes('informát') || n.includes('informat')) return Monitor;
    if (n.includes('patrimônio') || n.includes('patrimonio') || n.includes('material')) return Package;
    if (n.includes('obra') || n.includes('reforma') || n.includes('manuten')) return Wrench;
    if (n.includes('arte') || n.includes('coral') || n.includes('música') || n.includes('musica')) return Palette;
    if (n.includes('fraterno')) return HeartHandshake;
    if (n.includes('passe') || n.includes('fluidotera')) return Zap;
    if (n.includes('estudo') || n.includes('doutrin')) return BookOpen;
    if (n.includes('infantil') || n.includes('evangeliza')) return Baby;
    if (n.includes('mocidade') || n.includes('jovem') || n.includes('juventude')) return Heart;
    if (n.includes('social')) return Handshake;
    if (n.includes('mediún') || n.includes('mediun')) return Activity;
    if (n.includes('administrativo') || n.includes('secretaria') || n.includes('governança')) return Settings;
    return LayoutDashboard;
  };

  // Grupo 1: Setores de Trabalho & Módulos Operacionais
  const operationalViews = [
    { id: 'MASTER', label: 'Visão Master', icon: Sparkles },
    { id: 'RECEPTION', label: 'Recepção e Triagem', icon: Users },
    { id: 'ADMIN', label: 'Secretaria & Governança', icon: Settings },
    { id: 'FRATERNO', label: 'Atendimento Fraterno', icon: HeartHandshake },
    { id: 'SOCIAL', label: 'Ação Social Espírita', icon: Handshake },
    { id: 'PASSE', label: 'Passe & Fluidoterapia', icon: Zap },
    { id: 'MEDIUNICO', label: 'Coordenação Mediúnica', icon: Activity },
    { id: 'DOUTRI', label: 'Coordenação Doutrinária', icon: BookOpen },
    { id: 'SPEAKER', label: 'Tribuna & Palestras', icon: Mic2 },
    { id: 'ESTUDOS', label: 'Estudos Doutrinários', icon: GraduationCap },
    { id: 'INFANTIL', label: 'Evangelização Infantil', icon: Baby },
    { id: 'MOCIDADE', label: 'Mocidade & Juventude', icon: Heart },
    { id: 'ARTE', label: 'Arte Espírita & Coral', icon: Palette },
  ];

  // Grupo 2: Demais Setores de Trabalho
  const demaisViewsBase = [
    { id: 'COMUNICACAO', label: 'Comunicação Social', icon: Megaphone },
    { id: 'TECNOLOGIA', label: 'Tecnologia & Informática', icon: Monitor },
    { id: 'PATRIMONIO', label: 'Material & Patrimônio', icon: Package },
    { id: 'OBRAS', label: 'Manutenção, Reforma & Obras', icon: Wrench },
  ];

  // Filtra setores dinâmicos cadastrados que não conflitem com os módulos acima
  const extraDynamicSectors = sectors
    .map(s => {
      const normalizedName = formatSectorName(s.name);
      return {
        id: `SECTOR:${s.id}:${normalizedName}`,
        label: normalizedName,
        icon: getSectorIcon(normalizedName),
        originalName: s.name
      };
    })
    .reduce((acc: any[], current) => {
      const isDuplicate = acc.some(item => item.label.toLowerCase() === current.label.toLowerCase());
      if (isDuplicate) return acc;

      const name = current.originalName.toLowerCase();
      const isHandledByPredefined = 
        name.includes('fraterno') || 
        name.includes('recepção') || 
        name.includes('recepcao') || 
        name.includes('triagem') || 
        name.includes('passe') ||
        name.includes('fluidotera') ||
        name.includes('arte') ||
        name.includes('música') ||
        name.includes('musica') ||
        name.includes('coral') ||
        name.includes('teatro') ||
        name.includes('mediún') ||
        name.includes('mediun') ||
        name.includes('secretaria') ||
        name.includes('governança') ||
        name.includes('governanca') ||
        name.includes('administrat') ||
        name.includes('social') ||
        name.includes('sapse') ||
        name.includes('doutrin') ||
        name.includes('obra') ||
        name.includes('reforma') ||
        name.includes('manuten') ||
        name.includes('palestra') ||
        name.includes('tribuna') ||
        name.includes('estudo') ||
        name.includes('infantil') ||
        name.includes('evangeliza') ||
        name.includes('criança') ||
        name.includes('crianca') ||
        name.includes('mocidade') ||
        name.includes('juventude') ||
        name.includes('jovem') ||
        name.includes('comunicação') ||
        name.includes('comunicacao') ||
        name.includes('tecnologia') ||
        name.includes('informát') ||
        name.includes('informat') ||
        name.includes('patrimônio') ||
        name.includes('patrimonio') ||
        name.includes('material') ||
        name.includes('almoxarif');

      if (!isHandledByPredefined) acc.push(current);
      return acc;
    }, []);

  const demaisSetoresViews = [...demaisViewsBase, ...extraDynamicSectors];

  const ButtonGroup = ({ 
    title, 
    items, 
    colorClass,
    gridClass
  }: { 
    title: string, 
    items: any[], 
    colorClass: string,
    gridClass: string
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className={cn("w-1.5 h-4 rounded-full", colorClass)} />
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-950/70 italic">{title}</label>
      </div>
      <div className={cn("gap-2.5 p-3 sm:p-4 bg-indigo-50/30 rounded-[32px] border border-indigo-100/50", gridClass)}>
        {items.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              set(v.id);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-2.5 sm:p-3.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all duration-300 active:scale-95 border min-h-[102px] text-center w-full",
              current === v.id 
                ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 -translate-y-0.5" 
                : "bg-white text-indigo-600 border-indigo-50/70 hover:border-indigo-200 hover:bg-white/95 shadow-sm"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-colors shrink-0",
              current === v.id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
            )}>
              <v.icon size={18} className={current === v.id ? "animate-pulse" : ""} />
            </div>
            <span className="text-center leading-snug break-words hyphens-auto w-full px-0.5">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 mb-12">
      <ButtonGroup 
        title="Setores de Trabalho & Módulos Operacionais" 
        items={operationalViews} 
        colorClass="bg-indigo-600" 
        gridClass="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7"
      />
      <ButtonGroup 
        title="Demais Setores de Trabalho" 
        items={demaisSetoresViews} 
        colorClass="bg-slate-600" 
        gridClass="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
      />
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<string>('MASTER');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyChart, setWeeklyChart] = useState<{ name: string; total: number; dateStr: string }[]>([]);
  const [nextEvents, setNextEvents] = useState<AgendaEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [dailyReflection, setDailyReflection] = useState(reflections[0]);

  useEffect(() => {
    // Pick reflection based on day
    const dayTimestamp = startOfDay(new Date()).getTime();
    const index = (dayTimestamp / (1000 * 60 * 60 * 24)) % reflections.length;
    setDailyReflection(reflections[Math.floor(index)]);

    // Real-time subscriptions
    const unsubStats = dataService.subscribeToStats((s) => setStats(s));
    const unsubChart = dataService.subscribeToWeeklyAttendanceChart((chartData) => setWeeklyChart(chartData));
    const unsubAgenda = dataService.subscribeToAgendaEvents((events) => {
      const upcoming = (events || [])
        .filter(event => {
          const eventDate = new Date(event.date);
          if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
              eventDate.setHours(hours, minutes, 0, 0);
            }
          } else {
            eventDate.setHours(23, 59, 59, 999);
          }
          return eventDate.getTime() >= Date.now() - 3600000; // includes events happening today
        })
        .sort((a, b) => a.date - b.date)
        .slice(0, 3);
      setNextEvents(upcoming);
    });

    const fetchStaticInfo = async () => {
      try {
        const [spk, sect] = await Promise.all([
          dataService.getSpeakers(),
          dataService.getSectors()
        ]);
        setSectors(sect || []);
        setSpeakers(spk || []);
      } catch (err) {
        console.error("Dashboard static info error:", err);
      }
    };

    fetchStaticInfo();

    return () => {
      unsubStats();
      unsubChart();
      unsubAgenda();
    };
  }, []);

  // Deep-link check for assistido check-in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasAssistidoLink = params.get('assistidoId') || params.get('scan');
    if (hasAssistidoLink && sectors.length > 0) {
      // Find the social action sector
      const socialSector = sectors.find(s => s.name.toLowerCase().includes('social'));
      if (socialSector) {
        const normalizedName = formatSectorName(socialSector.name);
        setActiveView(`SECTOR:${socialSector.id}:${normalizedName}`);
      } else {
        // Fallback default
        setActiveView('SECTOR:soc:Ação Social Espírita');
      }
    }
  }, [sectors]);

  // Render content based on active view
  const renderActiveViewContent = () => {
    if (activeView === 'MASTER') {
      const cards = [
        { title: 'Aguardando', value: stats?.waitingCount || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', shadow: 'shadow-amber-500/5', border: 'border-amber-100/50' },
        { title: 'Em Atendimento', value: stats?.inServiceCount || 0, icon: HeartHandshake, color: 'text-indigo-600', bg: 'bg-indigo-50', shadow: 'shadow-indigo-500/5', border: 'border-indigo-100/50' },
        { title: 'Concluídos Hoje', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-500/5', border: 'border-emerald-100/50' },
        { title: 'Voluntários Ativos', value: stats?.activeVolunteers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', shadow: 'shadow-purple-500/5', border: 'border-purple-100/50' },
      ];

      return (
        <div className="space-y-8 sm:space-y-12">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={cn(
                  "p-5 sm:p-8 bg-white rounded-[32px] sm:rounded-[40px] border border-gray-50 shadow-xl overflow-hidden relative group transition-all",
                  card.shadow
                )}
              >
                <div className={cn("absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.03] translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 transition-transform group-hover:scale-125 duration-700", card.color.replace('text', 'bg'))}>
                  <card.icon size={128} />
                </div>
                
                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className={cn("inline-flex p-2.5 sm:p-3 rounded-2xl sm:rounded-[20px]", card.bg, card.color)}>
                    <card.icon size={20} className="sm:size-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{card.title}</p>
                    <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-0.5 sm:mt-1">{card.value}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pending Volunteers Alert */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position))) && (stats?.pendingVolunteers || 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-amber-600 rounded-[32px] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-200"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                  <Heart size={32} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tight">Novos Corações Esperando...</h3>
                  <p className="text-amber-100 font-bold text-sm">Existem {stats?.pendingVolunteers} solicitações de voluntariado aguardando análise.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/trabalhadores', { state: { filterPending: true } })}
                className="px-8 py-3 bg-white text-amber-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-50 transition-all shadow-lg active:scale-95"
              >
                Analisar Solicitações
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Chart Section */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-gray-50 shadow-sm space-y-6 sm:space-y-10 group transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Fluxo de Atendimentos</h2>
                    <p className="text-sm text-gray-400 font-medium">Histórico de freqüência real da semana em tempo real</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                      <TrendingUp size={14} strokeWidth={3} />
                      <span>{weeklyChart.reduce((acc, curr) => acc + curr.total, 0)} Registros na Semana</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mr-2 italic">Sincronizado ao Vivo</span>
                  </div>
                </div>
                
                <div className="h-[350px] w-full mt-4 pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyChart}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                        dy={15}
                      />
                      <YAxis hide />
                      <Tooltip 
                        formatter={(val: number) => [`${val} Atendimento(s)`, 'Total']}
                        labelFormatter={(label: string) => {
                          const found = weeklyChart.find(item => item.name === label);
                          return found ? `${label} (${found.dateStr})` : label;
                        }}
                        contentStyle={{ 
                          borderRadius: '24px', 
                          border: 'none', 
                          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                          padding: '16px'
                        }}
                        cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                        labelStyle={{ fontWeight: 800, color: '#1e1b4b', marginBottom: '4px' }}
                        itemStyle={{ fontWeight: 700, color: '#6366f1' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#6366f1" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        animationDuration={1500}
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#1e1b4b' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden group min-h-[220px] flex flex-col justify-center">
                  <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-700">
                    <Heart size={160} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Sparkles size={24} className="text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300/80 mb-2">Reflexão Doutrinária</p>
                      <p className="text-xl font-serif italic text-indigo-50 leading-tight">
                        "{dailyReflection.text}"
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-indigo-400">— {dailyReflection.author}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-[24px]">
                        <Calendar size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Escala Mensal</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight italic">Próximos Plantões</h3>
                      <p className="text-xs text-gray-400 font-medium">Confira quem está na escala hoje.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/escalas')}
                    className="w-full mt-6 py-4 bg-gray-50 text-gray-900 font-black rounded-[24px] hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-100"
                  >
                    <span>Ver Escala Completa</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-8">
              {/* Quick Actions */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-gray-50 shadow-sm space-y-6 sm:space-y-8">
                <h2 className="text-xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
                  <Zap size={20} className="text-indigo-600" />
                  Ações Rápidas
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Relatórios de Atendimento', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', path: '/relatorios', roles: ['ADMIN', 'COORDENADOR'] },
                    { label: 'Gestão de Trabalhadores', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', path: '/trabalhadores', roles: ['ADMIN'] },
                    { label: 'Escalas Mensais', icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/escalas', roles: ['ADMIN', 'COORDENADOR'] },
                    { label: 'Agenda Doutrinária', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', path: '/agenda', roles: ['ADMIN', 'COORDENADOR'] },
                    { label: 'Gerenciar Setores', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/setores', roles: ['ADMIN'] },
                    { label: 'Logs de Auditoria', icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50', path: '/logs', roles: ['ADMIN'] },
                  ].filter(a => {
                    if (!currentUser?.role) return false;
                    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));
                    if (isAdmin && a.roles.includes('ADMIN')) return true;
                    return a.roles.includes(currentUser.role);
                  }).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center justify-between p-4 rounded-[24px] border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-all group active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-2xl transition-all group-hover:scale-110 shadow-sm", action.bg, action.color)}>
                          <action.icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-sm text-gray-700 tracking-tight">{action.label}</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Activities */}
              <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-gray-50 shadow-sm space-y-6 sm:space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight italic">Calendário</h2>
                  <button 
                    onClick={() => navigate('/agenda')}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Ver tudo
                  </button>
                </div>
                
                <div className="space-y-6">
                  {nextEvents.length > 0 ? nextEvents.map((event, idx) => (
                    <div key={event.id} className="group relative pl-6 border-l-2 border-indigo-100 hover:border-indigo-600 transition-all py-1">
                      <div className="absolute left-[-5px] top-4 w-2 h-2 rounded-full bg-white border-2 border-indigo-600 scale-0 group-hover:scale-100 transition-transform" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none">
                          {format(event.date, "dd 'de' MMM", { locale: ptBR })} • {event.time}
                        </p>
                        <h4 className="text-sm font-bold text-gray-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium italic">{AGENDA_EVENT_TYPE_LABELS[event.type] || event.type}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                      <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-400 font-medium">Sem eventos agendados.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'RECEPTION') return <ReceptionistDashboard />;
    if (activeView === 'ADMIN') return <AdministrativeDashboard />;
    if (activeView === 'VOLUNTEER' || activeView === 'FRATERNO') return <SectorDashboard sectorId="sec-fraterno" sectorName="Atendimento Fraterno" />;
    if (activeView === 'SOCIAL') return <SectorDashboard sectorId="social" sectorName="Ação Social Espírita" />;
    if (activeView === 'PASSE') return <SectorDashboard sectorId="sec-passe" sectorName="Passe e Fluidoterapia" />;
    if (activeView === 'MEDIUNICO') return <SectorDashboard sectorId="sec-mediunidade" sectorName="Coordenação Mediúnica" />;
    if (activeView === 'DOUTRI') return <DoutrinarioDashboard />;
    if (activeView === 'SPEAKER') return <SpeakerDashboard />;
    if (activeView === 'ESTUDOS') return <SectorDashboard sectorId="sec-estudos" sectorName="Estudos Doutrinários" />;
    if (activeView === 'INFANTIL') return <SectorDashboard sectorId="sec-infantil" sectorName="Evangelização Infantil" />;
    if (activeView === 'MOCIDADE') return <SectorDashboard sectorId="sec-mocidade" sectorName="Mocidade e Juventude" />;
    if (activeView === 'ARTE') return <SectorDashboard sectorId="sec-arte" sectorName="Arte Espírita e Coral" />;

    // Demais Setores de Trabalho
    if (activeView === 'COMUNICACAO') return <SectorDashboard sectorId="sec-comunicacao" sectorName="Comunicação Social" />;
    if (activeView === 'TECNOLOGIA') return <SectorDashboard sectorId="sec-tecnologia" sectorName="Tecnologia & Informática" />;
    if (activeView === 'PATRIMONIO') return <SectorDashboard sectorId="sec-patrimonio" sectorName="Material & Patrimônio" />;
    if (activeView === 'OBRAS') return <SectorDashboard sectorId="sec-obras" sectorName="Manutenção, Reforma e Obra" />;

    if (activeView.startsWith('SECTOR:')) {
      const [_, sectorId, sectorName] = activeView.split(':');
      if (sectorName.toLowerCase().includes('doutrin')) {
        return <DoutrinarioDashboard />;
      }
      return <SectorDashboard sectorId={sectorId} sectorName={sectorName} />;
    }

    return null;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 sm:space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-1">
            <Sparkles size={14} />
            <span>Mirante de Luz</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-none">
            Vibrações de Paz
          </h1>
          <p className="text-gray-400 font-medium text-sm sm:text-lg">Gestão administrativa e espiritual.</p>
        </div>
        <button 
          id="new-participant-btn-dash"
          onClick={() => navigate('/atendidos')}
          className="flex items-center justify-center gap-3 bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[24px] font-black shadow-xl sm:shadow-2xl shadow-gray-200 hover:bg-gray-800 transition-all hover:-translate-y-1 active:scale-95 group text-sm sm:text-base"
        >
          <UserPlus size={18} className="sm:size-5 group-hover:scale-110 transition-transform" />
          <span>Novo Atendimento</span>
        </button>
      </header>

      <ViewSwitcher current={activeView} set={setActiveView} sectors={sectors} />

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
        {activeView !== 'MASTER' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white rounded-[28px] shadow-lg border border-indigo-700/50">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-700/80 rounded-2xl text-indigo-200">
                <ArrowLeft size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 block">
                  Setor de Trabalho em Visualização
                </span>
                <p className="text-sm sm:text-base font-black italic text-white">
                  {activeView === 'RECEPTION' && 'Setor: Recepção e Triagem de Frequentadores'}
                  {activeView === 'ADMIN' && 'Setor: Secretaria Geral & Governança'}
                  {(activeView === 'VOLUNTEER' || activeView === 'FRATERNO') && 'Setor: Atendimento Fraterno & Plantão de Escuta'}
                  {activeView === 'SOCIAL' && 'Setor: Ação Social Espírita (SAPSE - Assistidos, Famílias, Cestas & Doações)'}
                  {activeView === 'PASSE' && 'Setor: Passe e Fluidoterapia (Salas, Cabines & Registros)'}
                  {activeView === 'MEDIUNICO' && 'Setor: Coordenação Mediúnica (Reuniões, Médiuns & Desobsessão)'}
                  {activeView === 'DOUTRI' && 'Setor: Coordenação Doutrinária (Mesa Dirigente, Cronograma, Expositores & Biblioteca)'}
                  {activeView === 'SPEAKER' && 'Setor: Tribuna e Palestras Doutrinárias'}
                  {activeView === 'ESTUDOS' && 'Setor: Estudos Doutrinários (ESDE, EADE & Grupos)'}
                  {activeView === 'INFANTIL' && 'Setor: Evangelização Espírita Infantil'}
                  {activeView === 'MOCIDADE' && 'Setor: Mocidade e Juventude Espírita'}
                  {activeView === 'ARTE' && 'Setor: Arte Espírita e Coral'}
                  {activeView === 'COMUNICACAO' && 'Setor: Comunicação Social & Divulgação'}
                  {activeView === 'TECNOLOGIA' && 'Setor: Tecnologia e Informática'}
                  {activeView === 'PATRIMONIO' && 'Setor: Material e Patrimônio'}
                  {activeView === 'OBRAS' && 'Setor: Manutenção, Reforma e Obra'}
                  {activeView.startsWith('SECTOR:') && `Setor: ${formatSectorName(activeView.split(':')[2] || 'Setor Específico')}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveView('MASTER')}
              className="px-5 py-3 bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 self-end sm:self-auto shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Voltar à Visão Master</span>
            </button>
          </div>
        )}

        {renderActiveViewContent()}
      </main>
    </div>
  );
};
