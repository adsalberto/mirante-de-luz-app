import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  Search,
  ClipboardList,
  History,
  LayoutDashboard,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Sector, Worker } from '../types';
import { useAuth } from '../context/AuthContext';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waitingQueue, setWaitingQueue] = useState<(ServiceQueueEntry & { participantName?: string, sectorName?: string })[]>([]);
  const [myStats, setMyStats] = useState({
    activeInQueue: 0,
    servicesToday: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [queueItems, allParticipants, allSectors] = await Promise.all([
        dataService.getQueue(),
        dataService.getParticipants(),
        dataService.getSectors()
      ]);

      const waiting = queueItems
        .filter(item => item.status === 'WAITING')
        .map(item => ({
          ...item,
          participantName: allParticipants.find(p => p.id === item.participantId)?.name || 'Atendido',
          sectorName: allSectors.find(s => s.id === item.sectorId)?.name || 'Setor'
        }))
        .slice(0, 5);

      setWaitingQueue(waiting);
      setMyStats({
        activeInQueue: queueItems.filter(i => i.status === 'WAITING').length,
        servicesToday: queueItems.filter(i => i.status === 'FINISHED').length // Corrigido para status correto
      });
    } catch (err) {
      console.error("Error loading volunteer stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Ver Fila de Espera',
      desc: 'Chamar próximo atendimento',
      icon: Clock,
      color: 'bg-amber-500',
      path: '/fila'
    },
    {
      title: 'Lista de Atendidos',
      desc: 'Buscar prontuários e históricos',
      icon: Users,
      color: 'bg-indigo-500',
      path: '/atendidos'
    },
    {
      title: 'Meus Dados',
      desc: 'Ver perfil e escala',
      icon: ClipboardList,
      color: 'bg-emerald-500',
      path: '/perfil'
    }
  ];

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">
            Olá, {currentUser?.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 font-medium">Bom trabalho no auxílio ao próximo hoje.</p>
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={120} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/80 mb-1">Aguardando Chamada</p>
            <h3 className="text-5xl font-black">{myStats.activeInQueue}</h3>
          </div>
          <button 
            onClick={() => navigate('/fila')}
            className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"
          >
            <ArrowRight size={24} />
          </button>
        </div>
        
        <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Prontuários Registrados</p>
            <h3 className="text-5xl font-black text-gray-900 italic">24</h3>
            <p className="text-xs font-bold text-emerald-500 mt-1">Sempre atualizado</p>
          </div>
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-3xl">
            <History size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Waiting List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Quem está esperando?
            </h2>
            <button 
              onClick={() => navigate('/fila')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Ver fila completa
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            {waitingQueue.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {waitingQueue.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => navigate('/fila')}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${item.priority ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.participantName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{item.sectorName}</span>
                          {item.priority && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">Prioridade</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <LayoutDashboard size={40} className="mx-auto text-gray-200" />
                <p className="font-medium">Nenhum atendimento na fila de espera.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            Acesso Rápido
          </h2>
          <div className="space-y-4">
            {quickActions.map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ x: 8 }}
                onClick={() => navigate(action.path)}
                className="w-full p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-5 text-left hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
              >
                <div className={`p-4 ${action.color} rounded-2xl text-white shadow-lg`}>
                  <action.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{action.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">{action.desc}</p>
                </div>
                <ArrowRight size={20} className="text-gray-200 group-hover:text-indigo-500 transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
