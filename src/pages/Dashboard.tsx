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
  Settings
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
import { DashboardStats, AgendaEvent, Speaker, Worker } from '../types';
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

const ViewSwitcher = ({ current, set }: { current: string, set: (v: any) => void }) => {
  const views = [
    { id: 'MASTER', label: 'Visão Master', icon: Sparkles },
    { id: 'RECEPTION', label: 'Simular Recepção', icon: Users },
    { id: 'VOLUNTEER', label: 'Simular Atendimento', icon: HeartHandshake },
    { id: 'SPEAKER', label: 'Simular Oratória', icon: Mic2 },
    { id: 'ADMIN', label: 'Simular Secretaria', icon: Settings },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 overflow-x-auto no-scrollbar">
      {views.map(v => (
        <button
          key={v.id}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            set(v.id);
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            current === v.id 
              ? "bg-indigo-600 text-white shadow-lg" 
              : "bg-white text-indigo-400 hover:bg-white/80"
          )}
        >
          <v.icon size={14} />
          {v.label}
        </button>
      ))}
    </div>
  );
};

const dataChart = [
  { name: 'Seg', total: 40 },
  { name: 'Ter', total: 30 },
  { name: 'Qua', total: 45 },
  { name: 'Qui', total: 20 },
  { name: 'Sex', total: 10 },
  { name: 'Sab', total: 60 },
  { name: 'Dom', total: 15 },
];

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'MASTER' | 'RECEPTION' | 'VOLUNTEER' | 'SPEAKER' | 'ADMIN'>('MASTER');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [nextEvents, setNextEvents] = useState<AgendaEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [dailyReflection, setDailyReflection] = useState(reflections[0]);

  useEffect(() => {
    // Pick reflection based on day
    const dayTimestamp = startOfDay(new Date()).getTime();
    const index = (dayTimestamp / (1000 * 60 * 60 * 24)) % reflections.length;
    setDailyReflection(reflections[Math.floor(index)]);

    const fetchData = async () => {
      try {
        const [s, e, spk] = await Promise.all([
          dataService.getStats(),
          dataService.getAgendaEvents(),
          dataService.getSpeakers()
        ]);
        setStats(s);
        
        const upcoming = (e || [])
          .filter(event => event.date >= new Date().setHours(0,0,0,0))
          .sort((a,b) => a.date - b.date)
          .slice(0, 3);
        setNextEvents(upcoming);
        setSpeakers(spk || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };
    fetchData();
  }, []);

  // Render sub-dashboards if master wants to "preview" their experience
  // MUST be after all hooks to avoid hook calculation errors
  if (activeView === 'RECEPTION') return <div className="p-8"><ViewSwitcher current={activeView} set={setActiveView} /><ReceptionistDashboard /></div>;
  if (activeView === 'VOLUNTEER') return <div className="p-8"><ViewSwitcher current={activeView} set={setActiveView} /><VolunteerDashboard /></div>;
  if (activeView === 'SPEAKER') return <div className="p-8"><ViewSwitcher current={activeView} set={setActiveView} /><SpeakerDashboard /></div>;
  if (activeView === 'ADMIN') return <div className="p-8"><ViewSwitcher current={activeView} set={setActiveView} /><AdministrativeDashboard /></div>;

  const cards = [
    { title: 'Aguardando', value: stats?.waitingCount || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', shadow: 'shadow-amber-500/5', border: 'border-amber-100/50' },
    { title: 'Em Atendimento', value: stats?.inServiceCount || 0, icon: HeartHandshake, color: 'text-indigo-600', bg: 'bg-indigo-50', shadow: 'shadow-indigo-500/5', border: 'border-indigo-100/50' },
    { title: 'Concluídos Hoje', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', shadow: 'shadow-emerald-500/5', border: 'border-emerald-100/50' },
    { title: 'Voluntários Ativos', value: stats?.activeVolunteers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', shadow: 'shadow-purple-500/5', border: 'border-purple-100/50' },
  ];

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
          <ViewSwitcher current={activeView} set={setActiveView} />
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
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM') && (stats?.pendingVolunteers || 0) > 0 && (
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
            onClick={() => navigate('/trabalhadores')}
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
                <p className="text-sm text-gray-400 font-medium">Histórico de freqüência semanal da casa</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">
                  <TrendingUp size={14} strokeWidth={3} />
                  <span>+12% Crescimento</span>
                </div>
                <span className="text-[10px] font-bold text-gray-300 mr-2 italic">Ref. Março 2024</span>
              </div>
            </div>
            
            <div className="h-[350px] w-full mt-4 pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataChart}>
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
                    animationDuration={2000}
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
                const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'ADM';
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
                    <p className="text-[10px] text-gray-400 font-medium italic">{event.type}</p>
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
};
