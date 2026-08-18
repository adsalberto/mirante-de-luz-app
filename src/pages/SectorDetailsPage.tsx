import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  MapPin, 
  Clock, 
  Target, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
  History,
  Zap,
  Boxes,
  ScrollText,
  LayoutGrid,
  Pencil,
  Save,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Download,
  ExternalLink,
  UserCheck,
  Phone,
  Mail,
  Building2,
  Eye,
  CheckCircle2,
  HeartHandshake,
  Activity
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Sector, SectorType, SECTOR_TYPE_LABELS, formatSectorName, Worker } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import SectorDashboard from '../components/SectorDashboard';
import { getSectorTheme } from '../constants/sectorThemes';

export default function SectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sector, setSector] = useState<Sector | null>(null);
  const [allSectors, setAllSectors] = useState<Sector[]>([]);
  const [sectorWorkers, setSectorWorkers] = useState<Worker[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Sector>>({});
  const [activeSectorView, setActiveSectorView] = useState<'OPERACIONAL' | 'REGIMENTO'>('OPERACIONAL');

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM';
  const isCoordinator = currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sector?.id;

  useEffect(() => {
    if (currentUser && currentUser.role === 'RECEPCIONISTA') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Real-time subscriptions
  useEffect(() => {
    if (!id) return;

    const unsubSectors = dataService.subscribeToSectors((sectors) => {
      setAllSectors(sectors || []);
      const found = (sectors || []).find(s => s.id === id);
      if (found) {
        setSector(found);
        setEditForm(found);
      }
    });

    const unsubWorkers = dataService.subscribeToWorkers((workers) => {
      const filtered = (workers || []).filter(w => w.sectorId === id);
      setSectorWorkers(filtered);
    });

    const unsubQueue = dataService.subscribeToQueue((queue) => {
      const waiting = (queue || []).filter(q => q.sectorId === id && q.status === 'WAITING').length;
      setQueueCount(waiting);
    });

    return () => {
      unsubSectors();
      unsubWorkers();
      unsubQueue();
    };
  }, [id, sector?.name]);

  const getBreadcrumbs = (s: Sector): Sector[] => {
    const list: Sector[] = [];
    let current: Sector | undefined = s;
    while (current?.parentSectorId) {
      const parentId = current.parentSectorId;
      const parent: Sector | undefined = allSectors.find(item => item.id === parentId);
      if (parent) {
        list.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return list;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !sector) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // Limit 10MB
      alert('O arquivo PDF não deve exceder 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await dataService.addSectorDocument(sector.id, {
          name: file.name,
          size: file.size,
          type: file.type,
          url: dataUrl,
          uploadedBy: currentUser.name || currentUser.email
        });
        setIsUploading(false);
        alert('Documento PDF catalogado e salvo com sucesso!');
      };
      reader.onerror = () => {
        setIsUploading(false);
        alert('Erro ao ler o arquivo PDF.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setIsUploading(false);
      alert('Erro ao enviar documento.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!sector || !window.confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await dataService.deleteSectorDocument(sector.id, docId);
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
    }
  };

  const handleDeleteSector = async () => {
    if (!sector || !isAdmin) return;
    if (window.confirm(`Tem certeza absoluta de que deseja EXCLUIR o setor "${sector.name}"? Esta ação removerá o regimento permanentemente.`)) {
      try {
        await dataService.deleteSector(sector.id);
        alert('Setor excluído com sucesso.');
        navigate('/setores');
      } catch (err) {
        console.error('Erro ao excluir setor:', err);
        alert('Erro ao excluir setor.');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;
    
    try {
      const updatedSector = { ...sector, ...editForm } as Sector;
      await dataService.updateSector(updatedSector);
      setSector(updatedSector);
      setIsEditing(false);
      alert('Alterações salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar setor:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Erro ao salvar as alterações do setor.');
      }
    }
  };

  if (!sector) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
            <Building2 size={32} />
          </div>
          <p className="text-gray-500 font-medium">Carregando detalhes do setor...</p>
        </div>
      </div>
    );
  }

  const InfoBlock = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
        <Icon size={12} className="text-gray-300" />
        {label}
      </div>
      <p className="text-sm font-bold text-gray-800 leading-tight">
        {value || <span className="text-gray-300 italic font-medium">Não informado</span>}
      </p>
    </div>
  );

  const Section = ({ title, children, icon: Icon, color = "indigo" }: { title: string, children: React.ReactNode, icon: any, color?: string }) => (
    <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 space-y-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900 tracking-tighter uppercase flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", `bg-${color}-50 text-${color}-600`)}>
            <Icon size={20} />
          </div>
          {title}
        </h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative">
      {/* Header Fixo/Hero */}
      <div className="bg-white border-b border-gray-100 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between font-bold text-sm">
            <button 
              onClick={() => navigate('/setores')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl transition-all cursor-pointer font-black text-xs border border-slate-200/80 shadow-xs hover:shadow-sm active:scale-95 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-indigo-600" /> 
              <span>Voltar aos Setores</span>
            </button>
            <div className="flex items-center gap-3">
              {(isAdmin || isCoordinator) && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs"
                >
                  <Pencil size={16} /> Editar Regimento
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={handleDeleteSector}
                  className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs"
                >
                  <Trash2 size={16} /> Excluir Setor
                </button>
              )}
            </div>
          </div>
          
          {(() => {
            const theme = getSectorTheme(sector.type, sector.name);
            const SectorIcon = theme.icon;
            return (
              <>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={cn(
                        "px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-full border shadow-2xs flex items-center gap-1.5",
                        theme.badgeBg
                      )}>
                        <SectorIcon size={14} />
                        <span>{theme.badgeLabel}</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                        <History size={13} /> Regimento & Gestão Operacional
                      </div>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter italic flex flex-wrap items-center gap-1">
                      {allSectors.length > 0 && getBreadcrumbs(sector).map((ancestor) => (
                        <span key={ancestor.id} className="flex items-center gap-1 text-gray-400 font-medium">
                          <button 
                            onClick={() => navigate(`/setores/${ancestor.id}`)}
                            className="hover:underline hover:text-indigo-600 bg-transparent border-none p-0 cursor-pointer text-4xl lg:text-5xl font-black tracking-tighter"
                          >
                            {formatSectorName(ancestor.name)}
                          </button>
                          <span className="text-gray-300 font-sans text-3xl font-normal">/</span>
                        </span>
                      ))}
                      <span>{formatSectorName(sector.name)}</span>
                    </h1>
                  </div>
                </div>

                {/* Quick Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl shadow-2xs", theme.bgLight, theme.text)}>
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Voluntários</p>
                      <p className="text-lg font-black text-gray-900">{sectorWorkers.length}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shadow-2xs">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Em Fila</p>
                      <p className="text-lg font-black text-gray-900">{queueCount}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shadow-2xs">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sub-setores</p>
                      <p className="text-lg font-black text-gray-900">
                        {allSectors.filter(s => s.parentSectorId === sector.id).length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-2xs">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Documentos</p>
                      <p className="text-lg font-black text-gray-900">{sector.documents?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Sector Module Tab Switcher for All Sectors */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveSectorView('OPERACIONAL')}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95",
                      activeSectorView === 'OPERACIONAL'
                        ? `${theme.bgActive} shadow-md`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Activity size={16} />
                    <span>Painel de Gestão Dinâmica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSectorView('REGIMENTO')}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95",
                      activeSectorView === 'REGIMENTO'
                        ? `${theme.bgActive} shadow-md`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <History size={16} />
                    <span>Regimento Interno & Ficha do Setor</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* View Conditional Rendering: Operational Module vs Regiment */}
      {activeSectorView === 'OPERACIONAL' ? (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <SectorDashboard sectorId={sector.id} sectorName={sector.name} />
        </div>
      ) : (
      /* Grid de Conteúdo do Regimento */
      <div className="max-w-6xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white space-y-8 shadow-xl shadow-indigo-100">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-200">Missão do Setor</h3>
              <p className="text-lg font-bold leading-tight italic">
                "{sector.mission || sector.description}"
              </p>
            </div>

            <div className="h-px bg-white/10 w-full" />

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Coordenador(a)</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-black">
                    {sector.coordinator?.charAt(0) || <Users size={18} />}
                  </div>
                  <p className="font-black">{sector.coordinator || 'A definir'}</p>
                </div>
              </div>

               <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Localização</div>
                <div className="flex items-center gap-2 font-bold text-sm bg-white/10 p-3 rounded-2xl border border-white/5 mx-[-12px]">
                  <MapPin size={16} className="text-indigo-300" />
                  {sector.location || 'Salão Principal'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-gray-100 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Dados Auxiliares</h3>
            <div className="space-y-6">
              <InfoBlock icon={Users} label="Subcoordenador" value={sector.subcoordinator} />
              <InfoBlock icon={Briefcase} label="Secretário(a)" value={sector.secretary} />
              <InfoBlock icon={Clock} label="Horários" value={sector.schedule} />
              <InfoBlock icon={Layers} label="Frequência Reunião" value={sector.meetingFrequency} />
            </div>
          </div>

          {allSectors.filter(s => s.parentSectorId === sector.id).length > 0 && (
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Layers size={14} className="text-indigo-500" /> Sub-setores Vinculados ({allSectors.filter(s => s.parentSectorId === sector.id).length})
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {allSectors.filter(s => s.parentSectorId === sector.id).map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => navigate(`/setores/${sub.id}`)}
                    className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-transparent hover:border-indigo-100 text-left transition-all active:scale-95 group font-bold text-xs cursor-pointer"
                  >
                    <span className="text-gray-800 group-hover:text-indigo-900 transition-colors">{sub.name}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-all translate-x-[-2px] group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-8 space-y-8">
          
          <Section title="1. Fundamentação e Objetivos" icon={ShieldCheck} color="indigo">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Base Doutrinária</h4>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
                  {sector.foundation || 'Obras Básicas de Allan Kardec e complementares recomendadas pela FEB.'}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Objetivo Geral</h4>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {sector.description}
                </p>
              </div>
            </div>
          </Section>

          {/* Equipe do Setor */}
          <Section title={`2. Voluntários e Equipe Alocada (${sectorWorkers.length})`} icon={Users} color="purple">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Perfil do Trabalhador</h4>
                  <div className="flex gap-3">
                    <div className="mt-1"><AlertCircle size={14} className="text-purple-500" /></div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{sector.workerProfile || 'Comprometimento com o estudo e prática espírita.'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Fluxo de Ingresso</h4>
                  <div className="flex gap-3">
                    <div className="mt-1"><Zap size={14} className="text-amber-500" /></div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{sector.entryFlow || 'Entrevista com a coordenação e período de estágio.'}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Voluntários do Setor */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={14} className="text-indigo-600" /> Integrantes Vinculados ao Setor
                </h4>

                {sectorWorkers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sectorWorkers.map(worker => (
                      <div key={worker.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm">
                            {worker.name.charAt(0)}
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-gray-900 text-sm leading-none">{worker.name}</h5>
                            <p className="text-[11px] text-gray-500 font-medium">{worker.position || worker.role || 'Membro do Corpo'}</p>
                            {worker.email && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Mail size={10} /> {worker.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-widest",
                            worker.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-400"
                          )}>
                            {worker.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs font-medium text-gray-400 italic">Nenhum voluntário vinculado diretamente a este setor ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <Section title="3. Rotina e Funcionamento" icon={Boxes} color="blue">
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Atividades Principais</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(sector.mainActivities || '').split(',').map((act, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-xs font-bold text-blue-900 capitalize">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {act.trim() || 'Atividade Doutrinária'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <InfoBlock icon={HelpCircle} label="A quem responde" value={sector.reportsTo} />
                <InfoBlock icon={LayoutGrid} label="Interações" value={sector.interactions} />
              </div>
            </div>
          </Section>

          <Section title="4. Recursos e Avaliação" icon={Target} color="green">
             <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recursos Necessários</h4>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{sector.resources || 'Conforme demanda do setor.'}</p>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Metas e Indicadores</h4>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{sector.goals || 'Assiduidade e qualidade no atendimento.'}</p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Desafios Atuais</h4>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{sector.challenges || 'Aperfeiçoamento contínuo das práticas.'}</p>
                </div>
              </div>
            </div>
          </Section>

          <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4">
            <div className="mt-1 text-amber-600"><ScrollText size={24} /></div>
            <div className="space-y-1">
              <h3 className="font-black text-amber-900 uppercase text-sm tracking-tight italic">Observação Doutrinária</h3>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Este regimento deve ser lido e compreendido por todos os voluntários que ingressarem no setor. O estudo constante garante a unidade dos trabalhos no Mirante de Luz.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <FileText size={20} />
                </div>
                Biblioteca & Manuais (PDF)
              </h2>
              {(isAdmin || isCoordinator) && (
                <>
                  <button 
                    disabled={isUploading}
                    onClick={() => document.getElementById('details-file-upload')?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={16} />
                    <span>{isUploading ? 'Anexando...' : 'Adicionar PDF'}</span>
                  </button>
                  <input 
                    id="details-file-upload"
                    type="file" 
                    accept=".pdf"
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sector.documents && sector.documents.length > 0 ? sector.documents.map(doc => (
                <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm truncate max-w-[180px]" title={doc.name}>{doc.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.url && doc.url !== '#' ? (
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        target="_blank" 
                        rel="noreferrer"
                        title="Abrir ou Baixar PDF"
                        className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                      >
                        <Download size={16} />
                      </a>
                    ) : (
                      <span className="p-2 text-gray-300 text-xs italic">Sem link</span>
                    )}
                    {(isAdmin || isCoordinator) && (
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Excluir Documento"
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-400 italic">Nenhum documento ou regimento em PDF anexado a este setor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Barra de Navegação Inferior com Botão Voltar */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/setores')}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-2xl transition-all cursor-pointer font-black text-xs border border-slate-200 shadow-sm hover:shadow-md active:scale-95 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-indigo-600" /> 
          <span>Voltar ao Painel Geral de Setores</span>
        </button>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors"
        >
          Voltar ao Topo ↑
        </button>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Pencil size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Editar Regimento</h2>
                    <p className="text-sm font-medium text-gray-400">{formatSectorName(sector.name)}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                {/* Seção 1: Dados Básicos */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                    <LayoutGrid size={14} /> Dados e Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Setor</label>
                      <input required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Localização</label>
                      <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Missão (Objetivo Geral)</label>
                      <textarea rows={2} value={editForm.mission} onChange={e => setEditForm({...editForm, mission: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Setor Superior / Pai (Opcional - Sub-setor)</label>
                      <select value={editForm.parentSectorId || ''} onChange={e => setEditForm({...editForm, parentSectorId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700">
                        <option value="">-- Sem Setor Superior (Setor Principal) --</option>
                        {allSectors.filter(s => s.id !== sector.id).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Fundamentação Doutrinária</label>
                      <input value={editForm.foundation} onChange={e => setEditForm({...editForm, foundation: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Seção 2: Equipe */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-2">
                    <Users size={14} /> Estrutura Humana
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Coordenador</label>
                      <input value={editForm.coordinator} onChange={e => setEditForm({...editForm, coordinator: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Subcoordenador</label>
                      <input value={editForm.subcoordinator} onChange={e => setEditForm({...editForm, subcoordinator: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Secretário(a)</label>
                      <input value={editForm.secretary} onChange={e => setEditForm({...editForm, secretary: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Perfil Desejado do Trabalhador</label>
                        <textarea rows={2} value={editForm.workerProfile} onChange={e => setEditForm({...editForm, workerProfile: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Pré-requisitos morais e doutrinários..." />
                       </div>
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Fluxo de Ingresso</label>
                        <textarea rows={2} value={editForm.entryFlow} onChange={e => setEditForm({...editForm, entryFlow: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Ex: Entrevista -> Estágio -> Efetivação" />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Seção 3: Atividades */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Boxes size={14} /> Funcionamento e Rotina
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Atividades Principais (Separe por vírgula)</label>
                      <textarea rows={2} value={editForm.mainActivities} onChange={e => setEditForm({...editForm, mainActivities: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dias e Horários</label>
                      <input value={editForm.schedule} onChange={e => setEditForm({...editForm, schedule: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Frequência de Reunião de Equipe</label>
                      <input value={editForm.meetingFrequency} onChange={e => setEditForm({...editForm, meetingFrequency: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">A quem este setor responde?</label>
                      <input value={editForm.reportsTo} onChange={e => setEditForm({...editForm, reportsTo: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Conselho Doutrinário" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Interações com outros setores</label>
                      <input value={editForm.interactions} onChange={e => setEditForm({...editForm, interactions: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Recepção e Passe" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {/* Seção 4: Metas e Recursos */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                    <Target size={14} /> Metas e Recursos
                  </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Necessidades de Espaço e Equipamentos (Recursos)</label>
                      <textarea rows={2} value={editForm.resources} onChange={e => setEditForm({...editForm, resources: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Ex: Projetor, macas, materiais pedagógicos..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Metas e Indicadores de Qualidade</label>
                      <input value={editForm.goals} onChange={e => setEditForm({...editForm, goals: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Feedback dos frequentadores..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Principais Desafios Atuais</label>
                      <input value={editForm.challenges} onChange={e => setEditForm({...editForm, challenges: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                   </div>
                </div>
              </form>

              <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={20} /> Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
