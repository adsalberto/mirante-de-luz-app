import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ListOrdered, 
  Clock, 
  Search,
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Participant, ServiceQueueEntry, Sector } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    waitingInQueue: 0,
    servicesToday: 0
  });
  const [recentQueue, setRecentQueue] = useState<(ServiceQueueEntry & { participantName?: string, sectorName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allParticipants, queueItems, allSectors] = await Promise.all([
        dataService.getParticipants(),
        dataService.getQueue(),
        dataService.getSectors()
      ]);

      const today = new Date().setHours(0,0,0,0);
      
      const enrichedQueue = queueItems
        .filter(item => item.status === 'WAITING' || item.status === 'IN_PROGRESS')
        .slice(0, 5)
        .map(item => ({
          ...item,
          participantName: allParticipants.find(p => p.id === item.participantId)?.name || 'Desconhecido',
          sectorName: allSectors.find(s => s.id === item.sectorId)?.name || 'Setor'
        }));

      setStats({
        totalParticipants: allParticipants.length,
        waitingInQueue: queueItems.filter(i => i.status === 'WAITING').length,
        servicesToday: queueItems.filter(i => i.arrivalDate >= today).length
      });
      setRecentQueue(enrichedQueue);
    } catch (err) {
      console.error("Error loading receptionist stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const menuActions = [
    {
      title: 'Cadastrar Atendido',
      desc: 'Novo registro de participante no sistema',
      icon: UserPlus,
      color: 'bg-indigo-500',
      action: () => navigate('/participantes?action=new')
    },
    {
      title: 'Lista de Atendidos',
      desc: 'Buscar e gerenciar cadastros existentes',
      icon: Users,
      color: 'bg-emerald-500',
      action: () => navigate('/participantes')
    },
    {
      title: 'Fila de Espera',
      desc: 'Ver e organizar ordem de atendimento',
      icon: ListOrdered,
      color: 'bg-amber-500',
      action: () => navigate('/fila')
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Área da Recepção</h1>
          <p className="text-gray-500 font-medium">Bem-vindo(a), {currentUser?.name}. O que deseja fazer hoje?</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          label="Total de Atendidos" 
          value={stats.totalParticipants} 
          icon={Users} 
          trend="Ativos no sistema"
          color="indigo" 
        />
        <StatCard 
          label="Aguardando na Fila" 
          value={stats.waitingInQueue} 
          icon={Clock} 
          trend="Aguardando chamada"
          color="amber" 
        />
        <StatCard 
          label="Chamados Hoje" 
          value={stats.servicesToday} 
          icon={ClipboardCheck} 
          trend="Fluxo diário"
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-indigo-600" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuActions.map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ y: -4 }}
                onClick={item.action}
                className="flex items-start gap-4 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
              >
                <div className={`p-4 ${item.color} rounded-2xl text-white shadow-lg shadow-${item.color.split('-')[1]}-100`}>
                  <item.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">{item.desc}</p>
                </div>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Queue Activity */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={20} className="text-amber-600" />
            Fila Recente
          </h2>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
            {recentQueue.length > 0 ? (
              recentQueue.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{item.participantName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.sectorName}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                    item.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.status === 'IN_PROGRESS' ? 'Em Curso' : 'Espera'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400">
                <p className="text-sm font-medium">Nenhum atendimento ativo no momento.</p>
              </div>
            )}
            <button 
              onClick={() => navigate('/fila')}
              className="w-full py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
            >
              Ver Fila Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
            <span className="text-xs font-bold text-gray-400">{trend}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
