import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Search,
  ChevronRight, 
  Users, 
  ScrollText,
  Plus,
  X,
  LayoutGrid,
  Save,
  Boxes,
  Target,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Sector, SectorType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function SectorsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSector, setNewSector] = useState<Partial<Sector>>({
    name: '',
    type: 'OUTROS' as SectorType,
    description: '',
    mission: '',
    foundation: '',
    location: '',
    coordinator: '',
    subcoordinator: '',
    secretary: '',
    workerProfile: '',
    entryFlow: '',
    mainActivities: '',
    schedule: '',
    meetingFrequency: '',
    reportsTo: '',
    interactions: '',
    resources: '',
    goals: '',
    challenges: ''
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM';
  
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RECEPCIONISTA') {
        navigate('/');
      }
    }
    loadSectors();
  }, [currentUser, navigate]);

  const loadSectors = async () => {
    try {
      console.log("Loading sectors...");
      let data = await dataService.getSectors();
      console.log("Sectors loaded:", data?.length);
      
      if (data && data.length === 0 && (currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || currentUser?.email === 'carlostecal35@gmail.com')) {
        console.log("Sectors empty, attempting auto-population...");
        await dataService.populateDefaults();
        data = await dataService.getSectors();
      }
      setSectors(data || []);
    } catch (err) {
      console.error("Failed to load sectors:", err);
      // Fallback or alert could go here
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sectorToCreate = { ...newSector } as any; 
      await dataService.addSector(sectorToCreate);
      await loadSectors();
      setIsAdding(false);
      resetForm();
      alert('Setor criado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao criar setor:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao criar setor: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Erro ao criar o setor.');
      }
    }
  };

  const resetForm = () => {
    setNewSector({
      name: '',
      type: 'OUTROS',
      description: '',
      mission: '',
      foundation: '',
      location: '',
      coordinator: '',
      subcoordinator: '',
      secretary: '',
      workerProfile: '',
      entryFlow: '',
      mainActivities: '',
      schedule: '',
      meetingFrequency: '',
      reportsTo: '',
      interactions: '',
      resources: '',
      goals: '',
      challenges: ''
    });
  };

  const filteredSectors = sectors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Setores de Trabalho</h1>
          <p className="text-gray-500 font-medium">Estrutura organizacional e regimentos do Mirante de Luz</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 border border-gray-100 focus:border-indigo-600 transition-all font-medium shadow-sm"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all shrink-0"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Novo Setor</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSectors.map((sector, index) => (
          <motion.button
            key={sector.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/setores/${sector.id}`)}
            className="bg-white p-6 rounded-[32px] border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform" />
            
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-start justify-between">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Building2 size={24} />
                </div>
                <div className="px-3 py-1 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-full">
                  {sector.type}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{sector.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {sector.description}
                </p>
              </div>

              <div className="pt-4 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-400">
                   <div className="flex items-center gap-1.5 text-xs font-bold">
                     <Users size={14} /> Equipe
                   </div>
                   <div className="w-1 h-1 rounded-full bg-gray-200" />
                   <div className="flex items-center gap-1.5 text-xs font-bold">
                     <ScrollText size={14} /> Regimento
                   </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all translate-x-4 group-hover:translate-x-0">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          </motion.button>
        ))}

        {filteredSectors.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Building2 size={32} />
            </div>
            <p className="text-gray-400 font-medium italic">Nenhum setor encontrado...</p>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
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
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Setor de Trabalho</h2>
                    <p className="text-sm font-medium text-gray-400">Preencha a estrutura e regimento básico</p>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                    <LayoutGrid size={14} /> Dados e Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Setor</label>
                      <input required value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Setor de Passes" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Atividade</label>
                      <select value={newSector.type} onChange={e => setNewSector({...newSector, type: e.target.value as SectorType})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700">
                        <option value="FRATERNO">Atendimento Fraterno</option>
                        <option value="PASSE">Passe & Fluidoterapia</option>
                        <option value="ESTUDO">Estudo Doutrinário</option>
                        <option value="INFANCIA">Infância & Juventude</option>
                        <option value="SOCIAL">Ação Social</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                        <option value="MEDIUNICO">Trabalho Mediúnico</option>
                        <option value="OUTROS">Outros / Não Especificado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Missão (Objetivo Geral)</label>
                      <textarea rows={2} value={newSector.mission} onChange={e => setNewSector({...newSector, mission: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Principal razão de existir..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Localização</label>
                      <input value={newSector.location} onChange={e => setNewSector({...newSector, location: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Sala 3, Salão Principal" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Fundamentação Doutrinária</label>
                      <input value={newSector.foundation} onChange={e => setNewSector({...newSector, foundation: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: O Evangelhos Segundo o Espiritismo" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Breve Descrição para a Listagem</label>
                      <input value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Resumo em uma frase..." />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-2">
                    <Users size={14} /> Estrutura Humana
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Coordenador</label>
                      <input value={newSector.coordinator} onChange={e => setNewSector({...newSector, coordinator: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                     <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Subcoordenador</label>
                      <input value={newSector.subcoordinator} onChange={e => setNewSector({...newSector, subcoordinator: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Perfil do Trabalhador e Fluxo de Ingresso</label>
                       <textarea rows={2} value={newSector.workerProfile} onChange={e => setNewSector({...newSector, workerProfile: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Pré-requisitos e como entrar..." />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                    <Boxes size={14} /> Atividades e Horário
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Atividades Principais (separadas por vírgula)</label>
                      <textarea rows={2} value={newSector.mainActivities} onChange={e => setNewSector({...newSector, mainActivities: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dias e Horários</label>
                      <input value={newSector.schedule} onChange={e => setNewSector({...newSector, schedule: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Frequência de Reunião</label>
                      <input value={newSector.meetingFrequency} onChange={e => setNewSector({...newSector, meetingFrequency: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" />
                    </div>
                  </div>
                </div>
              </form>

              <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Salvar Setor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
