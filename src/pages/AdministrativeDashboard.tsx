import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  Settings,
  ShieldCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { DashboardStats, Worker } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function AdministrativeDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const s = await dataService.getStats();
      setStats(s);
    } catch (err) {
      console.error("Error loading admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const adminActions = [
    {
      title: 'Gestão de Voluntários',
      desc: 'Analisar e aprovar novos cadastros de trabalhadores',
      icon: UserCheck,
      color: 'bg-purple-500',
      path: '/trabalhadores',
      count: stats?.pendingVolunteers || 0
    },
    {
      title: 'Escalas e Plantões',
      desc: 'Organizar quem trabalha em cada setor hoje',
      icon: CalendarCheck,
      color: 'bg-emerald-500',
      path: '/escalas'
    },
    {
      title: 'Relatórios de Atividade',
      desc: 'Ver estatísticas de frequência e atendimentos',
      icon: BarChart3,
      color: 'bg-indigo-500',
      path: '/relatorios'
    },
    {
      title: 'Configurações de Setores',
      desc: 'Gerenciar departamentos e tipos de atendimento',
      icon: Building2,
      color: 'bg-amber-500',
      path: '/setores'
    }
  ];

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Área de Secretaria</h1>
          <p className="text-gray-500 font-medium">Gestão administrativa e operacional da casa.</p>
        </div>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Voluntários Ativos" 
          value={stats?.activeVolunteers || 0} 
          icon={Users} 
          color="purple" 
        />
        <MetricCard 
          label="Setores Operantes" 
          value={stats?.sectorCount || 0} 
          icon={Building2} 
          color="indigo" 
        />
        <MetricCard 
          label="Aguardando Aprovação" 
          value={stats?.pendingVolunteers || 0} 
          icon={ShieldCheck} 
          color="amber" 
          highlight={!!stats?.pendingVolunteers}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ações de Gestão */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" />
            Operações do Dia
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {adminActions.map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ x: 8 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-5 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
              >
                <div className={`p-4 ${item.color} rounded-2xl text-white shadow-lg relative`}>
                  <item.icon size={24} />
                  {item.count ? (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {item.count}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">{item.desc}</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-indigo-500 transition-all" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Auditoria e Logs Rápidos */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} className="text-rose-600" />
            Auditoria recente
          </h2>
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="space-y-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">Alteração de Escala</p>
                      <p className="text-[10px] text-gray-400 font-medium">Por Coordenadoria • Há 2 horas</p>
                    </div>
                 </div>
               ))}
            </div>
            <button 
              onClick={() => navigate('/logs')}
              className="w-full py-4 text-xs font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
            >
              Ver Logs Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, highlight }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className={cn(
      "p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm relative group overflow-hidden",
      highlight && "ring-2 ring-amber-500 ring-offset-2"
    )}>
      <div className="relative z-10 flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{value}</h3>
        </div>
      </div>
    </div>
  );
}
