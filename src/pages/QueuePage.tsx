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
  ClipboardList,
  Printer,
  ExternalLink,
  Phone,
  MapPin,
  Heart,
  Sparkles,
  Search,
  ArrowLeft
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Participant, Sector, Worker, formatSectorName } from '../types';
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
    
    const uniqueS: Sector[] = [];
    const seenNames = new Set<string>();
    s?.forEach(item => {
      const normName = formatSectorName(item.name);
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        uniqueS.push({ ...item, name: normName });
      }
    });
    setSectors(uniqueS);
  };

  const getParticipant = (id: string) => participants.find(p => p.id === id);
  const getSector = (id: string) => sectors.find(s => s.id === id);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));
  const canManageQueue = isAdmin || ['COORDENADOR', 'ATENDENTE', 'SECRETARIO', 'RECEPCIONISTA'].includes(currentUser?.role || '');

  const handleStartService = async (id: string) => {
    if (!canManageQueue) {
      alert('Acesso Negado: Você não tem permissão para gerenciar a fila.');
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

  let filteredQueue = activeTab === 'all' 
    ? queue 
    : queue.filter(item => item.sectorId === activeTab);

  if (activeTab === 'all') {
    // Sort so IN_PROGRESS takes priority over WAITING, then by oldest arrivalDate to maintain true chronological priority
    const sortedQueue = [...filteredQueue].sort((a, b) => {
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
      const timeA = new Date(a.arrivalDate || 0).getTime();
      const timeB = new Date(b.arrivalDate || 0).getTime();
      return timeA - timeB;
    });

    const seenParticipants = new Set<string>();
    filteredQueue = sortedQueue.filter(item => {
      if (seenParticipants.has(item.participantId)) {
        return false;
      }
      seenParticipants.add(item.participantId);
      return true;
    });
  }

  return (
    <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 h-full flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer animate-in fade-in"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Fila Digital</h1>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">AO VIVO</span>
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-medium italic">Gerencie o fluxo em tempo real.</p>
          </div>
        </div>

        <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex overflow-x-auto no-scrollbar max-w-full touch-pan-x">
          <button
            onClick={() => setActiveSectorId('all')}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
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
                "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                activeTab === s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 sm:pr-4">
        {filteredQueue.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredQueue.map((item) => {
                const p = getParticipant(item.participantId);
                const s = getSector(item.sectorId);
                if (!p) return null;

                // Find all active queue entries for this participant to show their referred sectors under "Todos"
                const participantOtherEntries = queue.filter(x => x.participantId === item.participantId);
                const participantSectors = participantOtherEntries
                  .map(entry => getSector(entry.sectorId))
                  .filter((sec): sec is Sector => !!sec);

                // Find relative queue position for this specific sector (only amongst WAITING status items)
                const targetSectorWaitingEntries = queue.filter(
                  x => x.sectorId === item.sectorId && x.status === 'WAITING'
                );
                // Sort by priority first (true), and then by arrival date/time to find accurate position
                const sortedSectorWaiting = [...targetSectorWaitingEntries].sort((a, b) => {
                  if (a.priority && !b.priority) return -1;
                  if (!a.priority && b.priority) return 1;
                  const timeA = new Date(a.arrivalDate || 0).getTime();
                  const timeB = new Date(b.arrivalDate || 0).getTime();
                  return timeA - timeB;
                });
                const sectorQueuePosition = item.status === 'WAITING'
                  ? sortedSectorWaiting.findIndex(x => x.id === item.id) + 1
                  : null;

                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-white p-6 sm:p-8 rounded-[40px] border border-gray-100/50 transition-all flex flex-col gap-6",
                      item.status === 'IN_PROGRESS' 
                        ? "shadow-2xl shadow-indigo-100 ring-2 ring-indigo-500/20" 
                        : "shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-indigo-100/30"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      {/* Avatar Section */}
                      <div className="relative group/avatar">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-4xl sm:text-5xl shadow-2xl shadow-indigo-200 border-4 border-white transition-transform duration-500 group-hover/avatar:scale-105">
                          {(p.photoUrl) ? (
                            <img src={p.photoUrl} className="w-full h-full object-cover rounded-[inherit]" alt={p.name} referrerPolicy="no-referrer" />
                          ) : (
                            (p.name || '?').charAt(0)
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-indigo-50">
                          <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <h3 className="text-3xl sm:text-4xl font-black text-indigo-950 leading-tight tracking-tight">
                              {p.name.split(' ').slice(0, 2).join(' ')}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              {p.birthDate && (
                                <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-xs border border-indigo-100/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                  <Clock size={14} className="opacity-70" />
                                  <span>{Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / 31536000000)} anos</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-xs border border-indigo-100/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                <User size={14} className="opacity-70" />
                                <span>{p.gender === 'Feminino' ? 'Feminino' : 'Masculino'}</span>
                              </span>
                              <span className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">
                                <Search size={12} strokeWidth={3} />
                                #{item.id.slice(0, 5).toUpperCase()}
                              </span>
                            </div>

                            {/* Render referred sectors badges */}
                            {participantSectors.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {participantSectors.map((sec) => (
                                  <span key={sec.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-850 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border border-indigo-105">
                                    <MapPin size={10} className="text-indigo-500 animate-pulse" />
                                    <span>{sec.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-center sm:justify-start gap-3">
                             {item.status === 'WAITING' ? (
                               <div className="flex flex-col sm:flex-row items-center gap-3">
                                 <button 
                                   onClick={() => handleStartService(item.id)}
                                   className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-95 group ring-8 ring-emerald-50/50 cursor-pointer"
                                 >
                                   <Sparkles size={18} className="fill-white/20" />
                                   <span>INICIAR ATENDIMENTO</span>
                                 </button>
                                 {sectorQueuePosition && activeTab !== 'all' && (
                                   <span className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-100">
                                     <ClipboardList size={14} />
                                     <span>{sectorQueuePosition}º na Fila</span>
                                   </span>
                                 )}
                               </div>
                             ) : (
                               <div className="flex items-center gap-3 bg-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-indigo-200 shadow-inner">
                                 <Activity size={16} className="animate-pulse" />
                                 EM CURSO
                               </div>
                             )}
                             
                             <div className="flex items-center gap-2">
                               <button className="flex items-center justify-center w-12 h-12 bg-white text-indigo-600 border-2 border-indigo-50 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-90 group cursor-pointer">
                                 <Printer size={20} className="group-hover:scale-110 transition-transform" />
                               </button>
                               <button className="flex items-center justify-center w-12 h-12 bg-white text-indigo-600 border-2 border-indigo-50 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-90 group cursor-pointer">
                                 <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                               </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Info Grid - Unified Style with EvolutionPage */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-indigo-50">
                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-[24px] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group/item">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-400 group-hover/item:text-indigo-600 transition-colors">
                          <Phone size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Contato</p>
                          <p className="text-xs font-bold text-indigo-950 truncate">{p.phone || 'Não Informado'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-[24px] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group/item">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-400 group-hover/item:text-indigo-600 transition-colors">
                          <MapPin size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Endereço</p>
                          <p className="text-xs font-bold text-indigo-950 truncate" title={p.address}>{p.address || 'Não Informado'}</p>
                        </div>
                      </div>

                      <div className={cn(
                        "flex items-center gap-3 p-4 rounded-[24px] border-2 transition-all duration-300",
                        item.status === 'IN_PROGRESS'
                          ? "bg-amber-50 border-amber-100/50 text-amber-900" 
                          : "bg-emerald-50 border-emerald-100 text-emerald-900"
                      )}>
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm",
                          item.status === 'IN_PROGRESS' ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {item.status === 'IN_PROGRESS' ? <Activity size={14} className="animate-pulse" /> : <CheckCircle2 size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase tracking-wider opacity-60 mb-0.5">Status do Irmão</p>
                          <p className="text-[10px] font-black italic truncate">
                            {item.status === 'IN_PROGRESS' 
                              ? 'Em Atendimento' 
                              : (sectorQueuePosition && activeTab !== 'all') 
                                ? `${sectorQueuePosition}º na Fila` 
                                : 'Aguardando Fila'}
                          </p>
                        </div>
                      </div>
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
