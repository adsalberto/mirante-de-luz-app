import React, { useEffect, useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  User, 
  ArrowRight,
  Filter,
  MoreVertical,
  Activity,
  Zap,
  ClipboardList
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Participant, Sector, Worker } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState<ServiceQueueEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveSectorId] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling simulation
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [q, p, s] = await Promise.all([
      dataService.getQueue(),
      dataService.getParticipants(),
      dataService.getSectors()
    ]);
    setQueue(q.filter(x => x.status !== 'FINISHED' && x.status !== 'CANCELLED'));
    setParticipants(p);
    setSectors(s);
  };

  const getParticipant = (id: string) => participants.find(p => p.id === id);
  const getSector = (id: string) => sectors.find(s => s.id === id);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM';

  const handleStartService = async (id: string) => {
    if (!isAdmin) {
      alert('Acesso Negado: Apenas administradores podem alterar o status da fila.');
      return;
    }
    try {
      await dataService.updateQueueStatus(id, 'IN_PROGRESS', currentUser!.id);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao iniciar atendimento:', err);
      alert('Erro ao iniciar atendimento.');
    }
  };

  const filteredQueue = activeTab === 'all' 
    ? queue 
    : queue.filter(item => item.sectorId === activeTab);

  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Fila Digital</h1>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>
          </div>
          <p className="text-gray-500 font-medium italic">Gerencie o fluxo de irmãos em tempo real.</p>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveSectorId('all')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50"
            )}
          >
            Todos
          </button>
          {sectors.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSectorId(s.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-4">
        {filteredQueue.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredQueue.map((item) => {
                const p = getParticipant(item.participantId);
                const s = getSector(item.sectorId);
                if (!p) return null;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-white p-6 rounded-[32px] border-2 transition-all flex flex-col gap-6",
                      item.status === 'IN_PROGRESS' 
                        ? "border-indigo-500 shadow-xl shadow-indigo-50" 
                        : "border-gray-50 shadow-sm hover:border-indigo-100"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center border-2 shadow-sm",
                          item.status === 'IN_PROGRESS' ? "bg-indigo-600 border-indigo-400 text-white rotate-6" : "bg-gray-50 border-gray-100 text-gray-400"
                        )}>
                          {item.status === 'IN_PROGRESS' ? <Activity size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Destino</p>
                          <h4 className="font-bold text-gray-900 leading-none">{s?.name}</h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.priority && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-amber-100">
                            <Zap size={10} fill="currentColor" />
                            <span>Prioridade</span>
                          </div>
                        )}
                        <button 
                          onClick={() => navigate(`/atendimentos?participantId=${item.participantId}`)}
                          title="Ver Prontuário"
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <ClipboardList size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-gray-100 to-indigo-50 flex items-center justify-center text-indigo-300 font-black text-2xl border-2 border-white shadow-inner">
                        {(p.name || '?').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-gray-900 leading-tight">{p.name}</h3>
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                            (p.gender === 'Masculino' || p.gender === 'M') ? "bg-blue-50 text-blue-600 border-blue-100" : (p.gender === 'Feminino' || p.gender === 'F') ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-gray-50 text-gray-400 border-gray-100"
                          )}>
                            {(p.gender === 'Masculino' || p.gender === 'M') ? 'Masc' : (p.gender === 'Feminino' || p.gender === 'F') ? 'Fem' : p.gender || 'N/I'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400 mt-1 flex items-center gap-1.5">
                          <User size={14} className="opacity-50" />
                          <span>Em espera há {formatDistanceToNow(item.arrivalDate, { locale: ptBR })}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                       {item.status === 'WAITING' ? (
                         <>
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => handleStartService(item.id)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                              >
                                <Play size={18} fill="currentColor" />
                                <span>Iniciar Atendimento</span>
                              </button>
                              <button 
                                onClick={async () => {
                                  if (confirm('Deseja remover este irmão da fila?')) {
                                    try {
                                      await dataService.updateQueueStatus(item.id, 'CANCELLED');
                                      await loadData();
                                    } catch (err) {
                                      console.error('Erro ao cancelar fila:', err);
                                      alert('Erro ao remover da fila.');
                                    }
                                  }
                                }}
                                className="p-4 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 rounded-[20px] transition-colors"
                              >
                                <XCircle size={20} />
                              </button>
                            </>
                          ) : (
                            <div className="flex-1 py-4 text-center bg-gray-50 text-gray-400 rounded-[20px] font-bold text-xs uppercase tracking-widest italic border border-gray-100">
                              Aguardando Chamar
                            </div>
                          )}
                         </>
                       ) : (
                         <div className="w-full flex items-center justify-between p-4 bg-indigo-50 rounded-[20px]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Activity size={14} className="text-indigo-600" />
                              </div>
                              <span className="text-sm font-bold text-indigo-800 animate-pulse">Atendimento em Curso...</span>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={async () => {
                                  try {
                                    await dataService.updateQueueStatus(item.id, 'FINISHED');
                                    await loadData();
                                  } catch (err) {
                                    console.error('Erro ao finalizar atendimento:', err);
                                    alert('Erro ao finalizar atendimento.');
                                  }
                                }}
                                className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-black text-xs shadow-sm hover:shadow-md transition-all active:scale-95 uppercase tracking-tighter"
                              >
                                Finalizar
                              </button>
                            )}
                         </div>
                       )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-50 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center border-2 border-indigo-50 shadow-xl">
                <CheckCircle2 className="text-emerald-500" size={48} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">Fila Vazia!</h3>
              <p className="text-gray-400 font-medium mt-2 max-w-xs mx-auto">
                No momento, todos os irmãos já estão em tratamento ou encaminhados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
