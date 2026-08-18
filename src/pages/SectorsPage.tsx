import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Search,
  ChevronRight, 
  ChevronDown,
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
  ArrowLeft,
  Trash2,
  Layers,
  Filter
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Sector, SectorType, SECTOR_TYPE_LABELS, formatSectorName } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getSectorTheme } from '../constants/sectorThemes';

export function SectorsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSector, setNewSector] = useState<Partial<Sector>>({
    name: '',
    type: 'OUTROS' as SectorType,
    description: '',
    parentSectorId: '',
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
    if (currentUser && currentUser.role === 'RECEPCIONISTA') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Real-time subscriptions to sectors and queue
  useEffect(() => {
    const unsubSectors = dataService.subscribeToSectors(async (sList) => {
      if ((!sList || sList.length === 0) && isAdmin) {
        await dataService.populateDefaults();
      } else {
        setSectors(sList || []);
      }
    });

    const unsubQueue = dataService.subscribeToQueue((qList) => {
      const counts: Record<string, number> = {};
      (qList || []).forEach(item => {
        if (item.status === 'WAITING' && item.sectorId) {
          counts[item.sectorId] = (counts[item.sectorId] || 0) + 1;
        }
      });
      setQueueCounts(counts);
    });

    return () => {
      unsubSectors();
      unsubQueue();
    };
  }, [isAdmin]);

  const handleDeleteSector = async (e: React.MouseEvent, sector: Sector) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (window.confirm(`Tem certeza de que deseja excluir o setor "${sector.name}"? Esta ação removerá o regimento do setor.`)) {
      try {
        await dataService.deleteSector(sector.id);
        alert('Setor excluído com sucesso.');
      } catch (err) {
        console.error('Erro ao excluir setor:', err);
        alert('Erro ao tentar excluir o setor.');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sectorToCreate = { ...newSector } as any; 
      await dataService.addSector(sectorToCreate);
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
      parentSectorId: '',
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

  const toggleParentExpand = (e: React.MouseEvent, parentId: string) => {
    e.stopPropagation();
    setExpandedParents(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  // Filter sectors
  const filteredSectors = sectors.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.coordinator && s.coordinator.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === 'all' || s.type === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  // Top-level parent sectors vs sub-sectors
  const topLevelSectors = filteredSectors.filter(s => {
    if (searchTerm.trim()) return true; // Show all when searching
    return !s.parentSectorId;
  });

  const uniqueTopSectors: Sector[] = [];
  const seenNames = new Set<string>();
  topLevelSectors.forEach(s => {
    const normName = formatSectorName(s.name);
    if (!seenNames.has(normName)) {
      seenNames.add(normName);
      uniqueTopSectors.push({ ...s, name: normName });
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight italic">Setores de Trabalho</h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Estrutura organizacional, hierarquia e regimentos do Mirante de Luz</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-white border border-gray-150 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 shadow-sm cursor-pointer outline-none focus:border-indigo-600"
          >
            <option value="all">📁 Todos os Tipos</option>
            <option value="FRATERNO">Atendimento Fraterno</option>
            <option value="PASSE">Passe & Fluidoterapia</option>
            <option value="ARTE">Arte Espírita (Coral & Teatro)</option>
            <option value="COMUNICACAO">Comunicação Social</option>
            <option value="ESTUDO">Estudos</option>
            <option value="INFANCIA">Infância & Juventude</option>
            <option value="SOCIAL">Ação Social</option>
            <option value="ADMINISTRATIVO">Administrativo</option>
            <option value="MEDIUNICO">Trabalho Mediúnico</option>
            <option value="OUTROS">Outros</option>
          </select>

          <div className="relative group flex-1 md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar setor, regimento ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl outline-none focus:ring-4 focus:ring-indigo-50 border border-gray-100 focus:border-indigo-600 transition-all font-medium shadow-sm text-sm"
            />
          </div>

          {isAdmin && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Novo Setor</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {uniqueTopSectors.map((sector, index) => {
          const waitingCount = queueCounts[sector.id] || 0;
          const subSectors = sectors.filter(sub => sub.parentSectorId === sector.id);
          const isExpanded = expandedParents[sector.id];
          const theme = getSectorTheme(sector.type, sector.name);
          const SectorIcon = theme.icon;

          return (
            <div key={sector.id} className="flex flex-col space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/setores/${sector.id}`)}
                className={cn(
                  "bg-white p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border transition-all group text-left relative overflow-hidden active:scale-[0.99] cursor-pointer shadow-sm hover:shadow-xl",
                  theme.border,
                  theme.borderHover,
                  theme.shadow
                )}
              >
                <div className={cn(
                  "absolute top-0 right-0 w-28 h-28 bg-gradient-to-br rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform",
                  theme.gradientLight
                )} />
                
                <div className="flex flex-col h-full space-y-3 sm:space-y-4 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shrink-0 group-hover:scale-110 shadow-sm",
                      theme.bgLight,
                      theme.text,
                      `group-hover:bg-gradient-to-br ${theme.gradient} group-hover:text-white`
                    )}>
                      <SectorIcon size={20} className="sm:size-6" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "px-2.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-full border shadow-2xs",
                          theme.badgeBg
                        )}>
                          {theme.badgeLabel}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteSector(e, sector)}
                            title="Excluir Setor"
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      {waitingCount > 0 && (
                        <div className="px-2 py-0.5 bg-amber-50 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-amber-600 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                          <Users size={10} />
                          <span>Fila: {waitingCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {sector.parentSectorId && (
                      <div className={cn(
                        "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-max mb-0.5",
                        theme.bgLight,
                        theme.text
                      )}>
                        <span>Sub-setor de: {sectors.find(p => p.id === sector.parentSectorId)?.name || 'Outro'}</span>
                      </div>
                    )}
                    <h3 className={cn(
                      "text-lg sm:text-xl font-bold text-gray-900 transition-colors leading-tight",
                      `group-hover:${theme.text}`
                    )}>{formatSectorName(sector.name)}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed">
                      {sector.description}
                    </p>
                  </div>

                  {sector.coordinator && (
                    <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                      <Users size={12} className={cn("shrink-0", theme.text)} />
                      <span className="truncate">Coord: {sector.coordinator}</span>
                    </div>
                  )}

                  <div className="pt-3 sm:pt-4 mt-auto flex items-center justify-between border-t border-gray-50 group-hover:border-gray-100 transition-colors">
                    {subSectors.length > 0 ? (
                      <button
                        onClick={(e) => toggleParentExpand(e, sector.id)}
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer",
                          theme.bgLight,
                          theme.text
                        )}
                      >
                        <Layers size={12} />
                        <span>{subSectors.length} Sub-setor{subSectors.length > 1 ? 'es' : ''}</span>
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                         <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold">
                           <Users size={12} /> <span className="hidden sm:inline">Equipe</span>
                         </div>
                         <div className="w-1 h-1 rounded-full bg-gray-200" />
                         <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold">
                           <ScrollText size={12} /> <span className="hidden sm:inline">Regimento</span>
                         </div>
                      </div>
                    )}

                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 transition-all translate-x-2 group-hover:translate-x-0 group-hover:text-white shadow-xs",
                      theme.bgLight,
                      `group-hover:bg-gradient-to-br ${theme.gradient}`
                    )}>
                       <ChevronRight size={16} className="sm:size-5" />
                    </div>
                  </div>
                </div>
              </motion.div>

                {/* Sub-sectors accordion list */}
                <AnimatePresence>
                  {isExpanded && subSectors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "rounded-2xl p-3 border space-y-1.5 ml-3",
                        theme.bgLight,
                        theme.border
                      )}
                    >
                      <div className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 mb-1 flex items-center gap-1",
                        theme.text
                      )}>
                        <Layers size={10} /> Sub-setores vinculados:
                      </div>
                      {subSectors.map(sub => {
                        const subTheme = getSectorTheme(sub.type, sub.name);
                        const SubIcon = subTheme.icon;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => navigate(`/setores/${sub.id}`)}
                            className="flex items-center justify-between p-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-800 transition-all cursor-pointer group/sub shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <SubIcon size={14} className={subTheme.text} />
                              <span className={cn("transition-colors", `group-hover/sub:${subTheme.text}`)}>{sub.name}</span>
                            </div>
                            <ChevronRight size={12} className="text-gray-300 group-hover/sub:text-gray-600" />
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          );
        })}

        {uniqueTopSectors.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Building2 size={32} />
            </div>
            <p className="text-gray-400 font-medium italic">Nenhum setor encontrado para os filtros selecionados...</p>
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
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
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
                        <option value="ARTE">Arte Espírita (Coral & Teatro)</option>
                        <option value="COMUNICACAO">Comunicação Social</option>
                        <option value="ESTUDO">Estudos</option>
                        <option value="INFANCIA">Infância & Juventude</option>
                        <option value="SOCIAL">Ação Social</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                        <option value="MEDIUNICO">Trabalho Mediúnico</option>
                        <option value="OUTROS">Outros / Não Especificado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Setor Superior / Pai (Opcional - Sub-setor)</label>
                      <select value={newSector.parentSectorId || ''} onChange={e => setNewSector({...newSector, parentSectorId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700">
                        <option value="">-- Sem Setor Superior (Setor Principal) --</option>
                        {sectors.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
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
                  className="flex-1 py-4 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
