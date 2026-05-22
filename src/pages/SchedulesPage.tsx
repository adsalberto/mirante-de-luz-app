import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  X,
  Search,
  Users,
  LayoutGrid,
  ChevronRight,
  MoreVertical,
  CalendarCheck,
  Pencil
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { SectorSchedule, Worker, ScheduleAssignment, Sector, formatSectorName } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const SchedulesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<SectorSchedule[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAddingSector, setIsAddingSector] = useState(false);
  const [isEditingSector, setIsEditingSector] = useState(false);
  const [targetSector, setTargetSector] = useState<{id: string, name: string} | null>(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<SectorSchedule | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [workingAssignmentId, setWorkingAssignmentId] = useState<string | null>(null);
  
  // Selection for new assignment
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedWorkerName, setSelectedWorkerName] = useState('');
  const [dayShifts, setDayShifts] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // Reset assignment state when modal opens
  useEffect(() => {
    if (showAssignmentModal && !editingAssignmentId) {
      setWorkerSearchTerm('');
      setSelectedWorkerId('');
      setSelectedWorkerName('');
      setDayShifts({});
    }
  }, [showAssignmentModal, editingAssignmentId]);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  const canManage = (sectorId?: string) => {
    if (isAdmin) return true;
    if (currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sectorId) return true;
    return false;
  };

  const loadData = async () => {
    const [s, w, sec] = await Promise.all([
      dataService.getSchedulesByMonth(selectedMonth, selectedYear),
      dataService.getWorkers(),
      dataService.getSectors()
    ]);

    // Proactive renaming and duplicate cleaning
    let doutrinariaExists = false;
    const seenNames = new Set<string>();
    const cleanedSec: Sector[] = [];

    for (const sector of (sec || [])) {
      const formattedName = formatSectorName(sector.name);
      const normalizedName = formattedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      
      // Fix Mediunidade name
      if (normalizedName === 'mediunidade') {
        sector.name = 'Mediúnica';
        dataService.updateSector(sector);
      } else {
        sector.name = formattedName;
      }

      // Check for duplicates
      if (seenNames.has(sector.name.toLowerCase().trim())) {
        // Current implementation: hide the duplicate and potentially delete it
        if (isAdmin) {
          dataService.deleteSector(sector.id);
        }
        continue;
      }
      
      seenNames.add(sector.name.toLowerCase().trim());
      cleanedSec.push(sector);
      
      if (normalizedName === 'doutrinaria') doutrinariaExists = true;
    }

    if (sec && sec.length > 0 && !doutrinariaExists) {
      dataService.addSector({ 
        name: 'Doutrinária', 
        type: 'ESTUDO', 
        description: 'Palestras e ensinamentos' 
      }).then(() => loadData());
    }

    setSchedules(s);
    setWorkers(w);
    setSectors(cleanedSec);
  };

  const closeSectorModal = () => {
    setIsAddingSector(false);
    setIsEditingSector(false);
    setTargetSector(null);
    setNewSectorName('');
  };

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    
    try {
      if (isEditingSector && targetSector) {
        // Update existing sector
        const sector = sectors.find(s => s.id === targetSector.id);
        if (sector) {
          await dataService.updateSector({ ...sector, name: newSectorName });
        }
      } else {
        // Create a NEW sector
        const newSector = await dataService.addSector({
          name: newSectorName,
          type: 'OUTROS',
          description: 'Novo setor de escala'
        });
        await dataService.addSectorSchedule(newSector.name, newSector.id, selectedMonth, selectedYear);
      }
      
      closeSectorModal();
      await loadData();
      alert(isEditingSector ? 'Grupo atualizado!' : 'Grupo de escala criado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao processar grupo:', err);
      alert('Erro ao salvar grupo de escala.');
    }
  };

  const handleDeleteSector = async (id: string, sectorId?: string) => {
    if (deletingSectorId === id) {
      try {
        if (id.startsWith('temp-')) {
          if (sectorId) await dataService.deleteSector(sectorId);
        } else {
          await dataService.deleteSectorSchedule(id);
          // Only ask to remove sector permanently if it is a real delete of a schedule
          // but usually admins use the sectors page for permanent removal
        }
        setDeletingSectorId(null);
        await loadData();
      } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao realizar a exclusão.');
      }
    } else {
      setDeletingSectorId(id);
      setTimeout(() => setDeletingSectorId(null), 3000);
    }
  };

  const handleAddAssignment = async () => {
    if (!editingSchedule || !selectedWorkerId) return;
    
    try {
      let currentSchedule = editingSchedule;

      // Handle "virtual" schedule (not yet in database for this month)
      if (currentSchedule.id.startsWith('temp-')) {
        currentSchedule = await dataService.addSectorSchedule(
          currentSchedule.sectorName,
          currentSchedule.sectorId,
          selectedMonth,
          selectedYear
        );
      }
      
      const worker = workers.find(w => w.id === selectedWorkerId);
      if (!worker) return;

      const daysDetail = Object.entries(dayShifts)
        .filter(([_, shift]) => shift.trim() !== '')
        .map(([day, shift]) => ({
          dayOfWeek: parseInt(day),
          shift: shift
        }));

      let updatedAssignments = [...currentSchedule.assignments];

      if (editingAssignmentId) {
        // Update existing
        updatedAssignments = updatedAssignments.map(a => 
          a.id === editingAssignmentId 
            ? { ...a, workerId: worker.id, workerName: worker.name, days: daysDetail } 
            : a
        );
      } else {
        // Add new
        const newAssignment: ScheduleAssignment = {
          id: Math.random().toString(36).substr(2, 9),
          workerId: worker.id,
          workerName: worker.name,
          days: daysDetail
        };
        updatedAssignments.push(newAssignment);
      }

      const updatedSchedule = {
        ...currentSchedule,
        assignments: updatedAssignments
      };

      await dataService.updateSectorSchedule(updatedSchedule);
      setEditingSchedule(updatedSchedule);
      setSelectedWorkerId('');
      setWorkerSearchTerm('');
      setSelectedWorkerName('');
      setDayShifts({});
      setEditingAssignmentId(null);
      setShowAssignmentModal(false);
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar atribuição:', err);
      alert('Erro ao salvar escala do trabalhador.');
    }
  };

  const handleEditAssignment = (schedule: SectorSchedule, assignment: ScheduleAssignment) => {
    setEditingSchedule(schedule);
    setEditingAssignmentId(assignment.id);
    setSelectedWorkerId(assignment.workerId);
    setSelectedWorkerName(assignment.workerName);
    setWorkerSearchTerm(assignment.workerName);
    
    const initialDayShifts: Record<number, string> = {};
    assignment.days.forEach(d => {
      initialDayShifts[d.dayOfWeek] = d.shift;
    });
    setDayShifts(initialDayShifts);
    setShowAssignmentModal(true);
  };

  const handleRemoveAssignment = async (schedule: SectorSchedule, assignmentId: string) => {
    if (!confirm('Remover o trabalhador deste grupo de escala?')) return;
    try {
      const updatedAssignments = schedule.assignments.filter(a => a.id !== assignmentId);
      const updatedSchedule = { ...schedule, assignments: updatedAssignments };
      await dataService.updateSectorSchedule(updatedSchedule);
      if (editingSchedule?.id === schedule.id) {
        setEditingSchedule(updatedSchedule);
      }
      await loadData();
    } catch (err) {
      console.error('Erro ao remover atribuição:', err);
      alert('Erro ao remover trabalhador da escala.');
    }
  };

  const displaySchedules = sectors
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (currentUser?.role === 'COORDENADOR') {
        return matchesSearch && s.id === currentUser.sectorId;
      }
      return matchesSearch;
    })
    .map(sector => {
      const existing = schedules.find(sch => sch.sectorId === sector.id);
      if (existing) return existing;
      return {
        id: `temp-${sector.id}`,
        sectorId: sector.id,
        sectorName: sector.name,
        month: selectedMonth,
        year: selectedYear,
        assignments: []
      } as SectorSchedule;
    });

  if (currentUser?.role === 'RECEPCIONISTA') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <CalendarCheck size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-gray-900">Acesso Negado</h2>
        <p className="text-gray-500 max-w-sm mt-2">Recepcionistas não possuem permissão para visualizar ou gerenciar escalas de trabalho.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Voltar ao Início</button>
      </div>
    );
  }

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const currentDayIdx = new Date().getDay();

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleImportPrevious = async () => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    
    if (confirm(`Deseja importar as escalas de ${months[prevMonth]} ${prevYear}? Isso não sobrescreverá escalas já criadas neste mês.`)) {
      try {
        await dataService.copySchedules(prevMonth, prevYear, selectedMonth, selectedYear);
        await loadData();
        alert('Escalas importadas com sucesso!');
      } catch (err) {
        console.error('Erro ao importar escalas:', err);
        alert('Erro ao importar escalas do mês anterior.');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-12 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[9px] sm:text-xs uppercase tracking-[0.25em]">
            <Calendar size={14} />
            <span>Gestão Operacional</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter italic leading-none">
            Escala Mensal
          </h1>
          <div className="flex items-center gap-1 sm:gap-4 mt-1 sm:mt-2 bg-white/50 p-1 rounded-2xl w-fit border border-white/50">
             <button 
               onClick={() => changeMonth(-1)}
               className="p-1.5 sm:p-3 hover:bg-white hover:shadow-sm rounded-xl text-indigo-600 transition-all active:scale-95 shrink-0"
             >
               <ChevronRight size={16} className="rotate-180 sm:size-5" />
             </button>
             <h2 className="text-sm sm:text-2xl font-black text-indigo-600 italic min-w-[100px] sm:min-w-[200px] text-center px-2">
               {months[selectedMonth]} {selectedYear}
             </h2>
             <button 
               onClick={() => changeMonth(1)}
               className="p-1.5 sm:p-3 hover:bg-white hover:shadow-sm rounded-xl text-indigo-600 transition-all active:scale-95 shrink-0"
             >
               <ChevronRight size={16} className="sm:size-5" />
             </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {schedules.length === 0 && (
            <button 
              onClick={handleImportPrevious}
              className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-[24px] font-bold hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 text-[10px] sm:text-base"
            >
              <CalendarCheck size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span>Importar Anterior</span>
            </button>
          )}
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Buscar escala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-4 bg-white rounded-xl sm:rounded-[24px] border border-gray-100 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-gray-700 w-full sm:w-[240px] lg:w-[280px] shadow-sm text-xs sm:text-base"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddingSector(true)}
              className="flex items-center justify-center gap-2 sm:gap-3 bg-gray-900 text-white px-4 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-[24px] font-black shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all hover:-translate-y-1 active:scale-95 group text-xs sm:text-base"
            >
              <Plus size={16} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span>Novo Grupo</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
        {displaySchedules.map((schedule) => (
          <motion.div
            key={schedule.id}
            layoutId={schedule.id}
            className="bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] sm:active:scale-100"
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start gap-3 sm:gap-4 bg-white group-hover:bg-indigo-50/20 transition-colors">
              <div className="p-2 sm:p-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl transition-transform group-hover:rotate-6 shrink-0 shadow-lg shadow-indigo-200/50">
                <LayoutGrid size={20} className="sm:size-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight leading-tight truncate">{schedule.sectorName}</h3>
                <div className="flex items-center gap-2 mt-0.5 mb-2 sm:mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">{schedule.assignments.length} Atuantes</p>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  {canManage(schedule.sectorId) && (
                    <button 
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setEditingAssignmentId(null);
                        setShowAssignmentModal(true);
                      }}
                      className="p-2 sm:p-2.5 bg-white text-gray-400 hover:text-indigo-600 rounded-xl sm:rounded-2xl transition-all shadow-sm border border-gray-100 hover:border-indigo-100 hover:shadow-md"
                      title="Adicionar trabalhador"
                    >
                      <Plus size={16} className="sm:size-[18px]" />
                    </button>
                  )}
                  {canManage(schedule.sectorId) && (
                    <button 
                      onClick={() => {
                        setTargetSector({ id: schedule.sectorId, name: schedule.sectorName });
                        setNewSectorName(schedule.sectorName);
                        setIsEditingSector(true);
                        setIsAddingSector(true);
                      }}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 text-gray-300 hover:text-indigo-600 rounded-lg sm:rounded-xl transition-all"
                      title="Editar nome"
                    >
                      <Pencil size={14} className="sm:size-4" />
                    </button>
                  )}
                  {canManage(schedule.sectorId) && (
                    <button 
                      onClick={() => handleDeleteSector(schedule.id, schedule.sectorId)}
                      className={cn(
                        "p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center min-w-[32px] sm:min-w-[36px]",
                        deletingSectorId === schedule.id 
                          ? "bg-red-500 text-white px-2 sm:px-3" 
                          : "hover:bg-red-50 text-gray-300 hover:text-red-500"
                      )}
                      title="Remover grupo"
                    >
                      {deletingSectorId === schedule.id ? (
                        <span className="text-[8px] sm:text-[10px] font-black uppercase whitespace-nowrap">Excluir?</span>
                      ) : (
                        <Trash2 size={14} className="sm:size-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2 sm:p-4 flex-1 space-y-2 sm:space-y-2.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
              {schedule.assignments.length > 0 ? (
                schedule.assignments.map((assignment) => {
                  const worksToday = assignment.days.some(d => d.dayOfWeek === currentDayIdx);
                  
                  return (
                    <div key={assignment.id} className={cn(
                      "p-2 sm:p-3 rounded-[16px] sm:rounded-[18px] border transition-all group/item relative shadow-sm",
                      worksToday 
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-100" 
                        : "bg-white border-gray-100/50 hover:border-indigo-100 hover:bg-indigo-50/10"
                    )}>
                      {worksToday && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-white text-indigo-600 text-[7px] font-black rounded-full uppercase tracking-widest shadow-sm">
                          Hoje
                        </div>
                      )}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          onClick={() => handleEditAssignment(schedule, assignment)}
                          className={cn(
                            "w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-black text-[9px] sm:text-[10px] cursor-pointer transition-all shrink-0",
                            worksToday 
                              ? "bg-white text-indigo-600 border-white" 
                              : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                          )}
                        >
                          {(assignment.workerName || '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[11px] sm:text-xs font-bold truncate leading-tight", worksToday ? "text-white" : "text-gray-900")}>
                            {assignment.workerName}
                          </p>
                          <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 mt-0.5 sm:mt-1">
                            {assignment.days && assignment.days.map((d) => (
                              <div key={d.dayOfWeek} className="flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] font-bold">
                                <span className={cn("uppercase", worksToday ? "text-indigo-100" : "text-gray-400")}>{daysOfWeek[d.dayOfWeek].substring(0, 3)}</span>
                                <span className={cn("italic", worksToday ? "text-white/80" : "text-indigo-500/80")}>{d.shift}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all shrink-0">
                          {canManage(schedule.sectorId) && (
                            <button 
                              onClick={() => handleEditAssignment(schedule, assignment)}
                              className={cn(
                                "p-1 sm:p-1.5 rounded-lg transition-all",
                                worksToday ? "text-white hover:bg-white/20" : "text-gray-300 hover:text-indigo-600 hover:bg-white"
                              )}
                            >
                              <Pencil size={12} className="sm:size-[14px]" />
                            </button>
                          )}
                          {canManage(schedule.sectorId) && (
                            <button 
                              onClick={() => {
                                if (workingAssignmentId === assignment.id) {
                                  handleRemoveAssignment(schedule, assignment.id);
                                  setWorkingAssignmentId(null);
                                } else {
                                  setWorkingAssignmentId(assignment.id);
                                  setTimeout(() => setWorkingAssignmentId(null), 3000);
                                }
                              }}
                              className={cn(
                                "p-1 sm:p-1.5 rounded-lg transition-all",
                                workingAssignmentId === assignment.id 
                                  ? "bg-red-500 text-white" 
                                  : (worksToday ? "text-white hover:bg-white/20" : "text-gray-300 hover:text-red-500 hover:bg-white")
                              )}
                            >
                              <Trash2 size={12} className="sm:size-[14px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-2 sm:space-y-3 opacity-40">
                  <Users size={20} className="sm:size-6 text-gray-300" />
                  <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Ninguém<br/>escalado</p>
                </div>
              )}
            </div>
            
            <div className="p-3 sm:p-4 bg-gray-50/50">
              {canManage(schedule.sectorId) && (
                <button 
                  onClick={() => {
                    setEditingSchedule(schedule);
                    setEditingAssignmentId(null);
                    setShowAssignmentModal(true);
                  }}
                  className="w-full py-2 sm:py-2.5 bg-white text-gray-600 border border-gray-100 font-bold rounded-xl sm:rounded-[16px] text-[9px] sm:text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                >
                  <UserPlus size={12} className="sm:size-[14px]" />
                  <span>Escalar</span>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Novo Grupo */}
      <AnimatePresence>
        {isAddingSector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSectorModal}
              className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl p-6 sm:p-8 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter italic">
                    {isEditingSector ? 'Editar Grupo' : 'Novo Grupo de Escala'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-tight">
                    {isEditingSector ? 'Atualize o nome desta frente de trabalho.' : 'Defina uma nova frente de escala para a casa.'}
                  </p>
                </div>
                <button onClick={closeSectorModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateSector} className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Setor/Grupo</label>
                  <input 
                    required 
                    autoFocus
                    value={newSectorName} 
                    onChange={e => setNewSectorName(e.target.value)} 
                    className="w-full px-5 py-3.5 sm:py-4 bg-gray-50 rounded-xl sm:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-sm sm:text-base" 
                    placeholder="Ex: Passe de Cura, Vibração..." 
                  />
                </div>
                <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <button type="button" onClick={closeSectorModal} className="flex-1 py-3.5 sm:py-4 font-bold text-gray-400 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base">Cancelar</button>
                  <button type="submit" className="flex-[1.5] py-3.5 sm:py-4 bg-indigo-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-sm sm:text-base">
                    {isEditingSector ? 'Salvar Alterações' : 'Criar Grupo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Adicionar Atribuição */}
      <AnimatePresence>
        {showAssignmentModal && editingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignmentModal(false)}
              className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter italic">
                    {editingAssignmentId ? 'Editar Escala' : 'Escalar Trabalhador'}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">Setor: {editingSchedule.sectorName}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setEditingAssignmentId(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Selecionar Trabalhador</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Pesquisar trabalhador..."
                      value={workerSearchTerm}
                      onChange={(e) => {
                        setWorkerSearchTerm(e.target.value);
                        if (selectedWorkerName && e.target.value !== selectedWorkerName) {
                          setSelectedWorkerId('');
                          setSelectedWorkerName('');
                        }
                      }}
                      className="w-full pl-11 pr-10 py-3 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-indigo-600 focus:bg-white transition-all font-bold text-gray-700 text-sm"
                    />
                    {workerSearchTerm && (
                      <button 
                        onClick={() => {
                          setWorkerSearchTerm('');
                          setSelectedWorkerId('');
                          setSelectedWorkerName('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar border border-gray-100 rounded-2xl p-2 bg-gray-50/50">
                    {workers.length === 0 ? (
                      <div className="col-span-full text-center py-6 space-y-2">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">Nenhum trabalhador cadastrado.</p>
                         <button 
                           onClick={() => window.location.href = '/trabalhadores'}
                           className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                         >
                           Cadastrar Voluntários
                         </button>
                      </div>
                    ) : workers
                      .filter(w => w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()) || w.email?.toLowerCase().includes(workerSearchTerm.toLowerCase()))
                      .map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setSelectedWorkerId(w.id);
                            setSelectedWorkerName(w.name);
                            setWorkerSearchTerm(w.name);
                          }}
                          className={cn(
                            "text-left px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between",
                            selectedWorkerId === w.id 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "text-gray-600 hover:bg-white hover:text-indigo-600"
                          )}
                        >
                          <span className="truncate">{w.name}</span>
                          {selectedWorkerId === w.id && <CheckCircle2 size={12} className="shrink-0 ml-2" />}
                        </button>
                      ))}
                    {workers.length > 0 && workers.filter(w => w.name.toLowerCase().includes(workerSearchTerm.toLowerCase())).length === 0 && (
                      <p className="col-span-full text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum trabalhador encontrado</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dias da Semana e Horários</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {daysOfWeek.map((day, idx) => {
                      const isSelected = dayShifts[idx] !== undefined;
                      return (
                        <div key={day} className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border transition-all",
                          isSelected ? "bg-indigo-50/50 border-indigo-100 ring-1 ring-indigo-100" : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                        )}>
                          <button
                            type="button"
                            onClick={() => {
                              setDayShifts(prev => {
                                const next = { ...prev };
                                if (isSelected) {
                                  delete next[idx];
                                } else {
                                  next[idx] = '';
                                }
                                return next;
                              });
                            }}
                            className={cn(
                              "w-14 py-1.5 rounded-lg text-[10px] font-black transition-all border shrink-0",
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-gray-400 border-gray-100"
                            )}
                          >
                            {day.substring(0, 3)}
                          </button>
                          
                          {isSelected && (
                            <div className="flex-1 flex items-center gap-1.5 focus-within:ring-1 focus-within:ring-indigo-200 rounded-lg">
                              <input 
                                value={dayShifts[idx]} 
                                onChange={e => setDayShifts(prev => ({ ...prev, [idx]: e.target.value }))} 
                                className="w-full bg-white px-2 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 outline-none border border-transparent focus:border-indigo-600 transition-all" 
                                placeholder="Horário (ex: 19:30)"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 border-t border-gray-50 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAssignmentModal(false)} 
                  className="flex-1 py-3 sm:py-4 font-bold text-gray-400 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition-all text-xs sm:text-base order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddAssignment}
                  disabled={!selectedWorkerId}
                  className="flex-[1.5] py-3 sm:py-4 bg-indigo-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all text-xs sm:text-base order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {editingAssignmentId ? (
                    <span className="flex items-center justify-center gap-2">
                       <CheckCircle2 size={16} />
                       Salvar
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                       <UserPlus size={16} />
                       Confirmar
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
