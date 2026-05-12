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
  X
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Sector, SectorType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function SectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sector, setSector] = useState<Sector | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Sector>>({});

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RECEPCIONISTA') {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (id) {
      loadSector();
    }
  }, [id]);

  const loadSector = async () => {
    const sectors = await dataService.getSectors();
    const found = sectors.find(s => s.id === id);
    if (found) {
      setSector(found);
      setEditForm(found);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !sector) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    try {
      await dataService.addSectorDocument(sector.id, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: '#',
        uploadedBy: currentUser.name || currentUser.email
      });
      loadSector();
      alert('Documento catalogado com sucesso!');
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      alert('Erro ao enviar documento.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!sector || !window.confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await dataService.deleteSectorDocument(sector.id, docId);
      loadSector();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
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

  if (!sector) return null;

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
              className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar aos Setores
            </button>
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sector.id)) && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
              >
                <Pencil size={16} /> Editar Regimento
              </button>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Setor: {sector.type}
                </div>
                <div className="text-[10px] font-bold text-gray-300 flex items-center gap-1.5">
                  <History size={12} /> Atualizado em 05/05/2026
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter italic">
                {sector.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Conteúdo */}
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

          <Section title="2. Equipe e Perfil" icon={Users} color="purple">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <h3 className="font-black text-amber-900 uppercase text-sm tracking-tight italic">Observação Importante</h3>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Este regimento deve ser lido e compreendido por todos os voluntários que ingressarem no setor. O estudo constante garante a unidade do Mirante de Luz.
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
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sector.id)) && (
                <>
                  <button 
                    onClick={() => document.getElementById('details-file-upload')?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={16} />
                    <span>Adicionar PDF</span>
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
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{doc.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Zap size={20} />
                    </a>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sector.id)) && (
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-400 italic">Nenhum documento cadastrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
                    <p className="text-sm font-medium text-gray-400">{sector.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                  className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
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
