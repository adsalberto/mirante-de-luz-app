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
  FileDown
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

export default function SectorDashboard({ sectorId, sectorName }: SectorDashboardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // In a real app, we might set up a listener here
  }, [sectorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allQueue = await dataService.getQueue();
      const allParticipants = await dataService.getParticipants();
      const allSectors = await dataService.getSectors();
      
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
        url: '#', // In a real app, this would be the URL from Firebase Storage
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

  // Icon selection based on sector name/type
  const getSectorIcon = () => {
    const name = sectorName.toLowerCase();
    if (name.includes('comunicação')) return <MessageSquare size={24} />;
    if (name.includes('arte')) return <Palette size={24} />;
    if (name.includes('fraterno')) return <Users size={24} />;
    if (name.includes('passe')) return <Zap size={24} />;
    return <Sparkles size={24} />;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
            {getSectorIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">
              Painel: {sectorName}
            </h1>
            <p className="text-gray-500 font-medium text-sm">Visualização de controle setorial para administradores.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Setor Ativo</span>
          </div>
          <button 
            onClick={loadData}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <Zap size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Aguardando</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-gray-900 leading-none">{stats.waiting}</h3>
            <span className="text-xs font-bold text-amber-500 mb-0.5">Irmãos</span>
          </div>
        </div>
        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Em Atendimento</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-gray-900 leading-none">{stats.inProgress}</h3>
            <span className="text-xs font-bold text-indigo-500 mb-0.5">No momento</span>
          </div>
        </div>
        <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Concluídos</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-emerald-600 leading-none">{stats.completedToday}</h3>
            <span className="text-xs font-bold text-emerald-400 mb-0.5">Hoje</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Waiting List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              Fila do Setor
            </h2>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <Search size={14} className="text-gray-400" />
              <input type="text" placeholder="Filtrar..." className="bg-transparent text-[10px] font-bold outline-none w-24" />
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            {waitingQueue.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {waitingQueue.map((item) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 flex-1" onClick={() => navigate(`/atendimentos?participantId=${item.participantId}`)}>
                      <div className={cn("p-3 rounded-2xl", item.priority ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600")}>
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.participantName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Desde: {new Date(item.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {item.priority && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">Prioridade</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleStartService(item.id);
                         }}
                         className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                       >
                         Assumir
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-gray-300 space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <LayoutDashboard size={40} className="text-gray-100" />
                </div>
                <div>
                    <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Tranquilidade</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">Nenhum irmão aguardando neste setor.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="lg:col-span-8 space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              Documentos do Setor (PDF)
            </h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <UploadCloud size={14} />
              Enviar PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".pdf" 
              className="hidden" 
            />
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            {sector?.documents && sector.documents.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {sector.documents.map((doc) => (
                  <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{doc.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                             {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                          </span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                             Por: {doc.uploadedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-gray-300 space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-gray-100">
                    <FileDown size={40} className="text-gray-100" />
                </div>
                <div>
                    <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Biblioteca Vazia</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">Nenhum documento ou manual enviado para este setor.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-indigo-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                    <h3 className="text-xl font-black italic tracking-tight">Atividade Setorial</h3>
                    <p className="text-indigo-300 text-sm font-medium mt-1">Monitore o fluxo de trabalho.</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-[24px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Em Espera</span>
                        <span className="text-lg font-black">{stats.waiting}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-[24px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Produtividade</span>
                        <span className="text-lg font-black">{stats.completedToday}</span>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/relatorios')}
                  className="w-full py-4 bg-indigo-500 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-900 transition-all flex items-center justify-center gap-2"
                >
                    <Eye size={16} />
                    Relatórios Detalhados
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
