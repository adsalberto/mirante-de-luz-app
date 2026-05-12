import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  LayoutDashboard,
  Zap,
  ArrowRight,
  Sparkles,
  Search,
  MessageSquare,
  Palette,
  Eye,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  FileDown,
  CheckCircle2,
  Activity,
  Handshake,
  BookOpen,
  Baby,
  Shield,
  ListOrdered,
  Calendar,
  Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Sector, SectorDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useRef } from 'react';

interface SectorDashboardProps {
  sectorId: string;
  sectorName: string;
}

const StatCard = ({ title, value, icon: Icon, color, bg, shadow, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={cn(
      "p-6 sm:p-8 bg-white rounded-[40px] border border-gray-50 shadow-xl overflow-hidden relative group transition-all",
      shadow
    )}
  >
    <div className={cn("absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.03] translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 transition-transform group-hover:scale-125 duration-700", color.replace('text', 'bg'))}>
      <Icon size={128} />
    </div>
    
    <div className="relative z-10 space-y-4">
      <div className={cn("inline-flex p-3 rounded-[20px]", bg, color)}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-4xl font-black text-gray-900 tracking-tight mt-1">{value}</h3>
      </div>
    </div>
  </motion.div>
);

export default function SectorDashboard({ sectorId, sectorName }: SectorDashboardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState<Sector | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<(ServiceQueueEntry & { participantName?: string })[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    inProgress: 0,
    completedToday: 0
  });

  useEffect(() => {
    loadData();
  }, [sectorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allQueue, allParticipants, allSectors] = await Promise.all([
        dataService.getQueue(),
        dataService.getParticipants(),
        dataService.getSectors()
      ]);
      
      const currentSector = allSectors?.find(s => s.id === sectorId);
      if (currentSector) setSector(currentSector);

      const sectorQueue = (allQueue || []).filter(item => item.sectorId === sectorId);
      
      const waiting = sectorQueue
        .filter(item => item.status === 'WAITING')
        .map(item => ({
          ...item,
          participantName: (allParticipants || []).find(p => p.id === item.participantId)?.name || 'Participante'
        }));

      setWaitingQueue(waiting);
      setStats({
        waiting: waiting.length,
        inProgress: sectorQueue.filter(item => item.status === 'IN_PROGRESS').length,
        completedToday: sectorQueue.filter(item => item.status === 'FINISHED').length
      });
    } catch (err) {
      console.error(`Error loading stats for ${sectorName}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartService = async (id: string) => {
    if (!currentUser) return;
    try {
      await dataService.updateQueueStatus(id, 'IN_PROGRESS', currentUser.id);
      loadData();
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
    }
  };

  const canManageDocuments = currentUser && (
    ['ADMIN', 'ADM'].includes(currentUser.role) || 
    (currentUser.role === 'COORDENADOR' && currentUser.sectorId === sectorId)
  );

  const canEditSector = currentUser && (
    ['ADMIN', 'ADM'].includes(currentUser.role) || 
    (currentUser.role === 'COORDENADOR' && currentUser.sectorId === sectorId)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    try {
      setLoading(true);
      await dataService.addSectorDocument(sectorId, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: '#',
        uploadedBy: currentUser.name || currentUser.email
      });
      loadData();
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      setLoading(true);
      await dataService.deleteSectorDocument(sectorId, docId);
      loadData();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSectorIcon = () => {
    const name = sectorName.toLowerCase();
    if (name.includes('comunicação')) return MessageSquare;
    if (name.includes('arte')) return Palette;
    if (name.includes('fraterno') || name.includes('atendimento')) return Users;
    if (name.includes('passe')) return Zap;
    if (name.includes('estudo') || name.includes('doutrinária')) return BookOpen;
    if (name.includes('infantil') || name.includes('mocidade')) return Baby;
    if (name.includes('social')) return Handshake;
    if (name.includes('mediúnica')) return Activity;
    if (name.includes('administrativo') || name.includes('secretaria')) return Shield;
    return Sparkles;
  };

  const SectorIcon = getSectorIcon();

  const quickActions = [
    {
      title: 'Chamar Próximo',
      desc: `Fila de espera: ${stats.waiting} aguardando`,
      icon: Clock,
      color: 'bg-amber-500',
      action: () => {
        if (waitingQueue.length > 0) handleStartService(waitingQueue[0].id);
        else navigate('/fila');
      }
    },
    {
      title: 'Novo Atendimento',
      desc: 'Encaminhar para este setor',
      icon: Users,
      color: 'bg-indigo-500',
      action: () => navigate(`/fila?sectorId=${sectorId}`)
    },
    {
      title: 'Documentação',
      desc: 'Manuais e arquivos do setor',
      icon: FileText,
      color: 'bg-emerald-500',
      action: () => documentsRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      title: 'Relatórios Históricos',
      desc: 'Produtividade e métricas',
      icon: Activity,
      color: 'bg-indigo-500',
      action: () => navigate('/relatorios')
    }
  ];

  if (canEditSector) {
    quickActions.push({
      title: 'Editar Setor',
      desc: 'Regimento e informações',
      icon: Pencil,
      color: 'bg-purple-500',
      action: () => navigate(`/setores/${sectorId}`)
    });
  }

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Hero Section */}
      <div className="bg-indigo-900 rounded-[50px] p-8 md:p-14 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-1000">
          <SectorIcon size={350} />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] border border-white/10">
            <Sparkles size={14} className="text-indigo-300" />
            <span>Simulador de Setor: {sectorName}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
            Gestão <span className="text-indigo-400">Dinâmica</span> do Setor
          </h1>
          
          <p className="text-lg text-indigo-100 font-medium max-w-xl">
            Ambiente de controle para o setor de {sectorName}. Monitore a fila em tempo real, gerencie documentos e lidere a equipe com excelência.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={loadData}
              className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-900 rounded-[24px] font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              <Zap size={18} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar Painel</span>
            </button>
            <div className="flex items-center gap-4 px-6 py-4 bg-indigo-800/50 rounded-[24px] border border-indigo-700/50">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Setor Operante</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Polish Stats matching Master Dash */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Aguardando Agora" 
          value={stats.waiting} 
          icon={Clock} 
          color="text-amber-600" 
          bg="bg-amber-50" 
          shadow="shadow-amber-500/10"
          delay={0}
        />
        <StatCard 
          title="Atendimento Ativo" 
          value={stats.inProgress} 
          icon={Activity} 
          color="text-indigo-600" 
          bg="bg-indigo-50" 
          shadow="shadow-indigo-500/10"
          delay={0.1}
        />
        <StatCard 
          title="Concluídos Hoje" 
          value={stats.completedToday} 
          icon={CheckCircle2} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
          shadow="shadow-emerald-500/10"
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Fila Real-time */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 italic flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <ListOrdered size={20} strokeWidth={3} />
                </div>
                Fila de Espera Atual
              </h2>
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 focus-within:ring-2 ring-indigo-500/20 transition-all">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="Localizar atendido..." className="bg-transparent text-xs font-bold outline-none w-40" />
              </div>
            </div>

            <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 hover:shadow-indigo-500/5">
              {waitingQueue.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {waitingQueue.map((item, idx) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all cursor-pointer group/row"
                    >
                      <div className="flex items-center gap-6 flex-1" onClick={() => navigate(`/atendimentos?participantId=${item.participantId}`)}>
                        <div className={cn(
                          "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all group-hover/row:scale-110",
                          item.priority ? "bg-amber-50 text-amber-600 shadow-lg shadow-amber-500/10" : "bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-500/10"
                        )}>
                          <Users size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors leading-none">{item.participantName}</h4>
                          <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <Clock size={12} strokeWidth={3} />
                                <span>Desde há 12 min</span>
                             </div>
                            {item.priority && (
                                <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 animate-pulse">Prioridade</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <div className="hidden sm:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-gray-300 uppercase italic">Posição</span>
                            <span className="text-2xl font-black text-gray-100 italic group-hover/row:text-indigo-100 transition-colors">#0{idx + 1}</span>
                         </div>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleStartService(item.id);
                           }}
                           className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-indigo-100"
                         >
                           Iniciar Atendimento
                         </button>
                         <ArrowRight size={20} className="text-gray-200 group-hover/row:text-indigo-500 group-hover:translate-x-2 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-24 text-center text-gray-300 space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 group-hover:scale-110 transition-transform duration-700">
                      <Sparkles size={48} className="text-gray-100" />
                  </div>
                  <div className="max-w-xs mx-auto">
                      <p className="font-black uppercase tracking-widest text-[11px] text-gray-500 italic">Harmonia Alcançada</p>
                      <p className="text-sm font-medium text-gray-400 mt-2 italic leading-relaxed">Nenhum irmão aguardando no momento. Este é um instante de paz para o seu setor.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section Refined */}
          <div ref={documentsRef} className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900 italic flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <FileText size={20} strokeWidth={3} />
                </div>
                Biblioteca & Manuais
              </h2>
              {canManageDocuments && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 pr-6 pl-4 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95 group"
                >
                  <div className="p-1 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                    <UploadCloud size={16} />
                  </div>
                  <span>Catalogar PDF</span>
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf" 
                className="hidden" 
              />
            </div>

            <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden group/docs">
              {sector?.documents && sector.documents.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {sector.documents.map((doc, idx) => (
                    <motion.div 
                      key={doc.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group/doc"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center group-hover/doc:scale-110 transition-transform shadow-lg shadow-red-500/5 border border-red-100/50">
                          <FileText size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-gray-900 leading-none">{doc.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <Calendar size={12} />
                                <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-gray-200" />
                             <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider font-mono">
                                <Zap size={12} />
                                <span>{doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-gray-200" />
                             <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic group-hover/doc:text-indigo-600 transition-colors">
                                Autorized by @{doc.uploadedBy.split('@')[0]}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover/doc:opacity-100 transition-all translate-x-4 group-hover/doc:translate-x-0">
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-gray-100"
                        >
                          <Eye size={16} />
                          <span>Luz</span>
                        </a>
                        {canManageDocuments && (
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-24 text-center text-gray-300 space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 group-hover/docs:scale-110 transition-transform duration-700">
                      <FileDown size={48} className="text-gray-100" />
                  </div>
                  <div className="max-w-xs mx-auto">
                      <p className="font-black uppercase tracking-widest text-[11px] text-gray-400">Repositório Vazio</p>
                      <p className="text-sm font-medium text-gray-400 mt-2 italic leading-relaxed">Nenhum manual de instrução ou PDF foi catalogado para este setor dinâmico ainda.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar Actions */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Ações Rápidas Grid */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 italic flex items-center gap-3 px-2">
              <Zap size={20} className="text-indigo-600" />
              Ações de Comando
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  whileHover={{ x: 8, scale: 1.02 }}
                  onClick={action.action}
                  className="w-full p-6 bg-white rounded-[40px] border border-gray-50 shadow-sm flex items-center gap-5 text-left hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-[22px] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:shadow-2xl duration-500`}>
                    <action.icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight italic leading-none">{action.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{action.desc}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-100 group-hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Activity Mini Stats Card */}
          <div className="bg-gray-900 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-gray-200">
             <div className="absolute -bottom-10 -left-10 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                <SectorIcon size={250} />
             </div>
             <div className="relative z-10 space-y-8">
                <div>
                    <h3 className="text-2xl font-black italic tracking-tight italic">Relatório Express</h3>
                    <p className="text-indigo-300/60 text-sm font-medium mt-1">Visão imediata do fluxo setorial.</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Carga Horária</span>
                           <span className="text-xs font-bold text-white/40">Hoje</span>
                        </div>
                        <span className="text-2xl font-black italic">6.2h</span>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Satisfação</span>
                           <span className="text-xs font-bold text-white/40">Média</span>
                        </div>
                        <span className="text-2xl font-black italic text-emerald-400">98%</span>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/relatorios')}
                  className="w-full py-5 bg-indigo-600 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-indigo-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/50 group/rel"
                >
                    <Activity size={18} className="group-hover/rel:animate-pulse" />
                    Exportar Métricas
                </button>
             </div>
          </div>

           {/* Feedback Widget matching Master Dash sidebar vibes */}
           <div className="bg-emerald-500 rounded-[48px] p-8 text-white relative overflow-hidden group shadow-xl shadow-emerald-100">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap size={24} className="text-white" />
                 </div>
                 <h3 className="text-xl font-black tracking-tight leading-tight italic">Excelência no Auxílio</h3>
                 <p className="text-sm font-medium text-emerald-50">Continue mantendo o padrão de amor e caridade em cada atendimento deste setor.</p>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
