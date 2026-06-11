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
  Pencil,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { SectorSchedule, Worker, ScheduleAssignment, Sector, formatSectorName, SectorActivity } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const SchedulesPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [dayShifts, setDayShifts] = useState<Record<string, string>>({});
  const [assignmentType, setAssignmentType] = useState<'weekly' | 'specific'>('weekly');

  // Active Tab per sector card ('atuantes' or 'atividades')
  const [activeCardTabs, setActiveCardTabs] = useState<Record<string, 'atuantes' | 'atividades'>>({});

  // Activity Modal states
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedScheduleForActivity, setSelectedScheduleForActivity] = useState<SectorSchedule | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityFormData, setActivityFormData] = useState({
    specificDay: 1,
    time: '18:50 - 19:30',
    title: '',
    dirigente: '',
    passistas: '',
    format: 'PRESENCIAL' as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO',
    observations: ''
  });

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
      setAssignmentType('weekly');
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
        alert('Item excluído com sucesso!');
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
        .map(([key, shift]) => {
          if (key.startsWith('specific-')) {
            const specificDay = parseInt(key.replace('specific-', ''));
            const dayOfWeek = new Date(selectedYear, selectedMonth, specificDay).getDay();
            return {
              dayOfWeek,
              specificDay,
              shift
            };
          } else {
            const dayIdxStr = key.startsWith('weekly-') ? key.replace('weekly-', '') : key;
            const dayOfWeek = parseInt(dayIdxStr);
            return {
              dayOfWeek,
              shift
            };
          }
        });

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
    
    const initialDayShifts: Record<string, string> = {};
    assignment.days.forEach(d => {
      if (d.specificDay !== undefined) {
        initialDayShifts[`specific-${d.specificDay}`] = d.shift;
      } else {
        initialDayShifts[`weekly-${d.dayOfWeek}`] = d.shift;
      }
    });
    setDayShifts(initialDayShifts);
    
    const hasSpecific = assignment.days.some(d => d.specificDay !== undefined);
    setAssignmentType(hasSpecific ? 'specific' : 'weekly');
    
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

  const handleOpenActivityModal = (schedule: SectorSchedule, activity?: any) => {
    setSelectedScheduleForActivity(schedule);
    if (activity) {
      setEditingActivityId(activity.id);
      setActivityFormData({
        specificDay: activity.specificDay || 1,
        time: activity.time || '18:50 - 19:30',
        title: activity.title || '',
        dirigente: activity.dirigente || '',
        passistas: activity.passistas ? activity.passistas.join(', ') : '',
        format: (activity.format || 'PRESENCIAL') as 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO',
        observations: activity.observations || ''
      });
    } else {
      setEditingActivityId(null);
      setActivityFormData({
        specificDay: 1,
        time: '18:50 - 19:30',
        title: '',
        dirigente: '',
        passistas: '',
        format: 'PRESENCIAL',
        observations: ''
      });
    }
    setShowActivityModal(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleForActivity) return;

    try {
      let currentSchedule = selectedScheduleForActivity;

      // Ensure "virtual" schedule is added before appending activities
      if (currentSchedule.id.startsWith('temp-')) {
        currentSchedule = await dataService.addSectorSchedule(
          currentSchedule.sectorName,
          currentSchedule.sectorId,
          selectedMonth,
          selectedYear
        );
      }

      // Format passistas to array
      const passistasArr = activityFormData.passistas
        ? activityFormData.passistas.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const currentActivities = currentSchedule.activities || [];
      const newActivity = {
        id: editingActivityId || 'activity-' + Math.random().toString(36).substring(2, 9),
        specificDay: Number(activityFormData.specificDay),
        time: activityFormData.time,
        title: activityFormData.title,
        dirigente: activityFormData.dirigente || undefined,
        passistas: passistasArr.length > 0 ? passistasArr : undefined,
        format: activityFormData.format,
        observations: activityFormData.observations || undefined
      };

      let updatedActivities = [];
      if (editingActivityId) {
        updatedActivities = currentActivities.map(act => act.id === editingActivityId ? newActivity : act);
      } else {
        updatedActivities = [...currentActivities, newActivity];
      }

      // Sort activities chronologically by day
      updatedActivities.sort((a, b) => a.specificDay - b.specificDay);

      const updatedSchedule = {
        ...currentSchedule,
        activities: updatedActivities
      };

      await dataService.updateSectorSchedule(updatedSchedule);
      setShowActivityModal(false);
      await loadData();
      alert('Atividade de escala registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar atividade:', err);
      alert('Não foi possível salvar a atividade.');
    }
  };

  const handleDeleteActivity = async (schedule: SectorSchedule, activityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade da programação?')) return;
    try {
      const currentActivities = schedule.activities || [];
      const updatedActivities = currentActivities.filter(act => act.id !== activityId);
      
      const updatedSchedule = {
        ...schedule,
        activities: updatedActivities
      };
      
      await dataService.updateSectorSchedule(updatedSchedule);
      await loadData();
      alert('Atividade removida com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir atividade:', err);
      alert('Erro ao excluir atividade de escala.');
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
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedJuneScale = async () => {
    if (!confirm('Deseja de fato importar todas as escalas de todos os setores e preencher as atividades completas de Junho/2026 conforme o documento original?')) return;
    setIsSeeding(true);
    try {
      // 1. Ensure all 6 sectors exist
      const sectorDefs = [
        { name: 'Passe e Fluidoterapia', type: 'PASSE', description: 'Atendimento fluídico espiritual e passes magnéticos' },
        { name: 'Atendimento Fraterno', type: 'FRATERNO', description: 'Orientação, plantão e acolhimento fraterno' },
        { name: 'Estudos', type: 'ESTUDO', description: 'Estudo das obras básicas e complementares do Espiritismo' },
        { name: 'Trabalho Mediúnico', type: 'MEDIUNICO', description: 'Encontros de relaxamento, desenvolvimento e qualificação mediúnica' },
        { name: 'Doutrinária', type: 'ESTUDO', description: 'Série doutrinária de autoconhecimento, palestras e atendimento de grupo' },
        { name: 'Administrativo', type: 'ADMINISTRATIVO', description: 'Planejamento, diretoria e reuniões extraordinárias' }
      ];

      const activeSectorsList = await dataService.getSectors() || [];
      const sectorMap: Record<string, Sector> = {};

      for (const sDef of sectorDefs) {
        let found = activeSectorsList.find(s => s.name.trim().toLowerCase() === sDef.name.toLowerCase());
        if (!found) {
          found = await dataService.addSector(sDef as any);
        }
        sectorMap[sDef.name] = found;
      }

      // 2. Clear or get all workers to assign
      const passistasList = [
        { name: 'Altamir Arruda', email: 'altamir.arruda@mirantedeluz.org', role: 'COORDENADOR', position: 'Coordenador', status: 'ATIVO' },
        { name: 'Iris Abreu', email: 'iris.abreu@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Marilda Arruda', email: 'marilda.arruda@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Adriana Luz', email: 'adriana.luz@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Andreza Costa', email: 'andreza.costa@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Kírlia Arruda', email: 'kirlia.arruda@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Valdison Lima', email: 'valdison.lima@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Carlos Alberto', email: 'carlos.alberto@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Frederico Portela', email: 'frederico.portela@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Cátia Santos', email: 'catia.santos@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Cleonice Arruda', email: 'cleonice.arruda@mirantedeluz.org', role: 'TRABALHADOR', position: 'Passista', status: 'ATIVO' },
        { name: 'Cleiton Arruda', email: 'cleiton.arruda@mirantedeluz.org', role: 'ADMIN', position: 'Presidente(s)', status: 'ATIVO' },
        { name: 'Marielzia Arruda', email: 'marielzia.arruda@mirantedeluz.org', role: 'COORDENADOR', position: 'Expositora', status: 'ATIVO' },
        { name: 'Mônica Bonfim', email: 'monica.bonfim@mirantedeluz.org', role: 'TRABALHADOR', position: 'Expositora', status: 'ATIVO' }
      ];

      const createdWorkersMap: Record<string, string> = {};
      const currentWorkers = await dataService.getWorkers() || [];

      for (const p of passistasList) {
        const existing = currentWorkers.find(cw => cw.name.trim().toLowerCase() === p.name.trim().toLowerCase());
        if (existing) {
          createdWorkersMap[p.name] = existing.id;
        } else {
          const newId = 'worker-' + Math.random().toString(36).substring(2, 9);
          const newW = {
            id: newId,
            name: p.name,
            email: p.email,
            role: p.role,
            position: p.position,
            status: p.status,
            sectors: [sectorMap['Passe e Fluidoterapia'].id],
            createdAt: new Date().toISOString()
          } as any;
          await dataService.updateWorker(newW);
          createdWorkersMap[p.name] = newId;
        }
      }

      // Reload sector schedules for Month = 5 (June), Year = 2026
      const allSchedules = await dataService.getSchedulesByMonth(5, 2026) || [];

      // 3. SEED THE COMPREHENSIVE ACTIVITIES LIST FOR EACH SECTOR
      const activitiesSeeding: Record<string, SectorActivity[]> = {
        'Passe e Fluidoterapia': [
          { id: 'act-p1', specificDay: 2, time: '19:30 - 20:00', title: 'Passe e Fluidoterapia', passistas: ['Altamir Arruda', 'Iris Abreu'], format: 'PRESENCIAL' },
          { id: 'act-p2', specificDay: 6, time: '20:00 - 20:30', title: 'Passe e Fluidoterapia', passistas: ['Andreza Costa', 'Kírlia Arruda', 'Valdison Lima'], format: 'PRESENCIAL' },
          { id: 'act-p3', specificDay: 9, time: '19:30 - 20:00', title: 'Passe e Fluidoterapia', passistas: ['Iris Abreu', 'Marilda Arruda'], format: 'PRESENCIAL' },
          { id: 'act-p4', specificDay: 13, time: '20:00 - 20:30', title: 'Passe e Fluidoterapia', passistas: ['Marilda Arruda', 'Carlos Alberto', 'Valdison Lima'], format: 'PRESENCIAL' },
          { id: 'act-p5', specificDay: 16, time: '19:30 - 20:00', title: 'Passe e Fluidoterapia', passistas: ['Adriana Luz', 'Altamir Arruda'], format: 'PRESENCIAL' },
          { id: 'act-p6', specificDay: 20, time: '20:00 - 20:30', title: 'Passe e Fluidoterapia', passistas: ['Frederico Portela', 'Cátia Santos', 'Valdison Lima'], format: 'PRESENCIAL' },
          { id: 'act-p7', specificDay: 27, time: '20:00 - 20:30', title: 'Passe e Fluidoterapia', passistas: ['Adriana Luz', 'Cleonice Arruda', 'Valdison Lima'], format: 'PRESENCIAL' },
          { id: 'act-p8', specificDay: 30, time: '19:30 - 20:00', title: 'Passe e Fluidoterapia', passistas: ['Altamir Arruda', 'Adriana Luz'], format: 'PRESENCIAL' }
        ],
        'Atendimento Fraterno': [
          { id: 'act-af1', specificDay: 2, time: '20:00 - 21:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af2', specificDay: 3, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af3', specificDay: 5, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af4', specificDay: 6, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af5', specificDay: 9, time: '20:00 - 21:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af6', specificDay: 10, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af7', specificDay: 11, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af8', specificDay: 12, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af9', specificDay: 13, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af10', specificDay: 16, time: '20:00 - 21:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af11', specificDay: 17, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af12', specificDay: 18, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af13', specificDay: 19, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af14', specificDay: 20, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af15', specificDay: 26, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'ONLINE' },
          { id: 'act-af16', specificDay: 27, time: '18:00 - 19:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' },
          { id: 'act-af17', specificDay: 30, time: '20:00 - 21:00', title: 'Plantão de Atendimento Fraterno', format: 'PRESENCIAL' }
        ],
        'Estudos': [
          { id: 'act-es1', specificDay: 2, time: '18:50 - 19:30', title: 'Estudo do Evangelho - Cap V - Bem-aventurados os aflitos', dirigente: 'Altamir Arruda', format: 'PRESENCIAL' },
          { id: 'act-es2', specificDay: 2, time: '20:00 - 21:30', title: 'Estudo de O Livro dos Espíritos 2026 - Cap VI - Da vida espírita', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-es3', specificDay: 3, time: '20:00 - 21:30', title: 'Estudo da Revista Espírita 1866', dirigente: 'Cleonice Arruda', format: 'ONLINE' },
          { id: 'act-es4', specificDay: 9, time: '18:50 - 19:30', title: 'Estudo do Evangelho - Cap V - Bem-aventurados os aflitos', dirigente: 'Marielzia Arruda', format: 'PRESENCIAL' },
          { id: 'act-es5', specificDay: 9, time: '20:00 - 21:30', title: 'Estudo de O Livro dos Espíritos 2026 - Cap VI - Da vida espírita', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-es6', specificDay: 10, time: '20:00 - 21:30', title: 'Estudo da Revista Espírita 1866', dirigente: 'Valdison Lima', format: 'ONLINE' },
          { id: 'act-es7', specificDay: 11, time: '19:30 - 21:30', title: 'Estudo do Livro Religião dos Espíritos', dirigente: 'Altamir Arruda', format: 'ONLINE' },
          { id: 'act-es8', specificDay: 16, time: '18:50 - 19:30', title: 'Estudo do Evangelho - Cap V - Bem-aventurados os aflitos', dirigente: 'Altamir Arruda', format: 'PRESENCIAL' },
          { id: 'act-es9', specificDay: 16, time: '20:00 - 21:30', title: 'Estudo de O Livro dos Espíritos 2026 - Cap VI - Da vida espírita', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-es10', specificDay: 17, time: '20:00 - 21:30', title: 'Estudo da Revista Espírita 1866', dirigente: 'Marilda Arruda', format: 'ONLINE' },
          { id: 'act-es11', specificDay: 18, time: '19:30 - 21:30', title: 'Estudo do Livro Religião dos Espíritos', dirigente: 'Cleiton Arruda', format: 'ONLINE' },
          { id: 'act-es12', specificDay: 24, time: '20:00 - 21:30', title: 'Recesso - São João', observations: 'LIBERADO DEVIDO AO SÃO JOÃO', format: 'ONLINE' },
          { id: 'act-es13', specificDay: 25, time: '19:30 - 21:30', title: 'Recesso - São João', observations: 'LIBERADO DEVIDO AO SÃO JOÃO', format: 'ONLINE' },
          { id: 'act-es14', specificDay: 30, time: '18:50 - 19:30', title: 'Estudo do Evangelho - Cap V - Bem-aventurados os aflitos', dirigente: 'Marilda Arruda', format: 'PRESENCIAL' },
          { id: 'act-es15', specificDay: 30, time: '20:00 - 21:30', title: 'Estudo de O Livro dos Espíritos 2026 - Cap VI - Da vida espírita', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' }
        ],
        'Trabalho Mediúnico': [
          { id: 'act-m1', specificDay: 5, time: '20:00 - 21:30', title: 'Encontro de Relaxamento Especial aos médiuns', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-m2', specificDay: 12, time: '20:00 - 21:30', title: 'Desenvolvimento Mediúnico - 4º Ano', dirigente: 'Cleiton Arruda', format: 'ONLINE' },
          { id: 'act-m3', specificDay: 19, time: '20:00 - 21:30', title: 'Qualificação Mediúnica - 2º Ano', dirigente: 'Altamir Arruda e Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-m4', specificDay: 26, time: '20:00 - 21:30', title: 'Desenvolvimento Mediúnico - 4º Ano', dirigente: 'Cleiton Arruda', format: 'ONLINE' }
        ],
        'Doutrinária': [
          { id: 'act-d1', specificDay: 6, time: '19:00 - 20:00', title: 'Série Doutrinária Autoconhecimento', dirigente: 'Altamir Arruda', format: 'PRESENCIAL' },
          { id: 'act-d2', specificDay: 6, time: '20:30 - 22:00', title: 'Reunião Mediúnica', format: 'PRESENCIAL' },
          { id: 'act-d3', specificDay: 13, time: '19:00 - 20:00', title: 'Série Doutrinária Autoconhecimento', dirigente: 'Marielzia Arruda', format: 'PRESENCIAL' },
          { id: 'act-d4', specificDay: 13, time: '20:30 - 22:00', title: '7º Atendimento de Grupo 2026', format: 'PRESENCIAL' },
          { id: 'act-d5', specificDay: 20, time: '19:00 - 20:00', title: 'Série Doutrinária Autoconhecimento', dirigente: 'Cleiton Arruda', format: 'PRESENCIAL' },
          { id: 'act-d6', specificDay: 20, time: '20:30 - 22:00', title: '5º Atendimento de Grupo 2026', format: 'PRESENCIAL' },
          { id: 'act-d7', specificDay: 27, time: '19:00 - 20:00', title: 'Série Doutrinária Autoconhecimento', dirigente: 'Mônica Bonfim', format: 'PRESENCIAL' },
          { id: 'act-d8', specificDay: 27, time: '20:30 - 22:00', title: '8º Atendimento de Grupo 2026', format: 'PRESENCIAL' }
        ],
        'Administrativo': [
          { id: 'act-ad1', specificDay: 14, time: '10:00 - 12:30', title: '1ª Reunião Extraordinária 2026 - Indicadores de Desempenho 2026.1', dirigente: 'Cleiton Arruda', format: 'HIBRIDO' },
          { id: 'act-ad2', specificDay: 28, time: '09:00 - 12:30', title: '3ª Reunião de Diretoria 2026', dirigente: 'Cleiton Arruda', format: 'HIBRIDO' }
        ]
      };

      // 4. PREPARE THE SPECIFIC WORKER ASSIGNMENTS TO SEED
      const passeDocAssignments = [
        { workerName: 'Altamir Arruda', days: [{ dayOfWeek: 2, specificDay: 2, shift: '19:00 - 19:30' }, { dayOfWeek: 2, specificDay: 16, shift: '19:00 - 19:30' }, { dayOfWeek: 2, specificDay: 30, shift: '19:00 - 19:30' }] },
        { workerName: 'Iris Abreu', days: [{ dayOfWeek: 2, specificDay: 2, shift: '19:00 - 19:30' }, { dayOfWeek: 2, specificDay: 9, shift: '18:50 - 19:30' }] },
        { workerName: 'Marilda Arruda', days: [{ dayOfWeek: 2, specificDay: 9, shift: '18:50 - 19:30' }, { dayOfWeek: 6, specificDay: 13, shift: '19:30 - 20:00' }] },
        { workerName: 'Adriana Luz', days: [{ dayOfWeek: 2, specificDay: 16, shift: '19:00 - 19:30' }, { dayOfWeek: 6, specificDay: 27, shift: '19:30 - 20:00' }, { dayOfWeek: 2, specificDay: 30, shift: '19:00 - 19:30' }] },
        { workerName: 'Andreza Costa', days: [{ dayOfWeek: 6, specificDay: 6, shift: '19:30 - 20:00' }] },
        { workerName: 'Kírlia Arruda', days: [{ dayOfWeek: 6, specificDay: 6, shift: '19:30 - 20:00' }] },
        { workerName: 'Valdison Lima', days: [{ dayOfWeek: 6, specificDay: 6, shift: '19:30 - 20:00' }, { dayOfWeek: 6, specificDay: 13, shift: '19:30 - 20:00' }, { dayOfWeek: 6, specificDay: 20, shift: '19:30 - 20:00' }, { dayOfWeek: 6, specificDay: 27, shift: '19:30 - 20:00' }] },
        { workerName: 'Carlos Alberto', days: [{ dayOfWeek: 6, specificDay: 13, shift: '19:30 - 20:00' }] },
        { workerName: 'Frederico Portela', days: [{ dayOfWeek: 6, specificDay: 20, shift: '19:30 - 20:00' }] },
        { workerName: 'Cátia Santos', days: [{ dayOfWeek: 6, specificDay: 20, shift: '19:30 - 20:00' }] },
        { workerName: 'Cleonice Arruda', days: [{ dayOfWeek: 6, specificDay: 27, shift: '19:30 - 20:00' }] }
      ];

      for (const sectorName of Object.keys(sectorMap)) {
        const sector = sectorMap[sectorName];
        let sch = allSchedules.find(s => s.sectorId === sector.id);
        if (!sch) {
          sch = await dataService.addSectorSchedule(sector.name, sector.id, 5, 2026);
        }

        // Setup assignments
        let compiledAssignments: ScheduleAssignment[] = [];
        if (sectorName === 'Passe e Fluidoterapia') {
          compiledAssignments = passeDocAssignments.map(da => {
            const workerId = createdWorkersMap[da.workerName];
            return {
              id: Math.random().toString(36).substring(2, 9),
              workerId: workerId || 'temp-' + Math.random().toString(36).substring(2, 9),
              workerName: da.workerName,
              days: da.days
            };
          });
        } else {
          // General assignments: assign typical workers
          const workersForThisSector = passistasList.filter(p => {
            if (sectorName === 'Estudos') return ['Altamir Arruda', 'Cleiton Arruda', 'Cleonice Arruda', 'Valdison Lima', 'Marilda Arruda'].includes(p.name);
            if (sectorName === 'Atendimento Fraterno') return ['Altamir Arruda', 'Cleonice Arruda', 'Cleiton Arruda'].includes(p.name);
            if (sectorName === 'Doutrinária') return ['Altamir Arruda', 'Marielzia Arruda', 'Cleiton Arruda', 'Mônica Bonfim'].includes(p.name);
            if (sectorName === 'Trabalho Mediúnico') return ['Cleiton Arruda', 'Altamir Arruda'].includes(p.name);
            if (sectorName === 'Administrativo') return ['Cleiton Arruda', 'Altamir Arruda'].includes(p.name);
            return false;
          });

          compiledAssignments = workersForThisSector.map(w => {
            const workerId = createdWorkersMap[w.name];
            return {
              id: Math.random().toString(36).substring(2, 9),
              workerId: workerId || 'temp-' + Math.random().toString(36).substring(2, 9),
              workerName: w.name,
              days: [{ dayOfWeek: 2, shift: 'Horário do Plantão' }] // default simple weekly template
            };
          });
        }

        const seededActivities = activitiesSeeding[sectorName] || [];

        const updatedSchedule = {
          ...sch,
          assignments: compiledAssignments,
          activities: seededActivities
        };

        await dataService.updateSectorSchedule(updatedSchedule);
      }

      setSelectedMonth(5);
      setSelectedYear(2026);
      
      await loadData();
      alert('Sensacional! Todas as escalas, trabalhadores, horários do Passe e o cronograma completo de Atividades de Junho/2026 foram registrados permanentemente!');
    } catch (err) {
      console.error('Erro ao semear:', err);
      alert('Ocorreu um erro ao realizar a semeadura abrangente.');
    } finally {
      setIsSeeding(false);
    }
  };

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
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer mt-1"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
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
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {isAdmin && (
            <button 
              onClick={handleSeedJuneScale}
              disabled={isSeeding}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-[24px] font-black transition-all active:scale-95 shadow-lg shadow-emerald-100 border border-emerald-500 text-[10px] sm:text-base cursor-pointer disabled:opacity-50"
              title="Importar todos os trabalhadores e horários do documento original de Junho/2026"
            >
              <CalendarCheck size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span>{isSeeding ? 'Importando...' : 'Importar Escala de Junho/2026 (Foto)'}</span>
            </button>
          )}
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
                  <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">
                    {schedule.assignments.length} Atuantes • {schedule.activities?.length || 0} Atividades
                  </p>
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

            {/* Tab Toggles */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1 select-none">
              <button 
                onClick={() => setActiveCardTabs(prev => ({ ...prev, [schedule.id]: 'atuantes' }))}
                className={cn(
                  "flex-grow py-2 text-center text-[10px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer",
                  (activeCardTabs[schedule.id] || 'atuantes') === 'atuantes'
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                Trabalhadores
              </button>
              <button 
                onClick={() => setActiveCardTabs(prev => ({ ...prev, [schedule.id]: 'atividades' }))}
                className={cn(
                  "flex-grow py-2 text-center text-[10px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer flex items-center justify-center gap-1",
                  (activeCardTabs[schedule.id] || 'atuantes') === 'atividades'
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                Cronograma
                {schedule.activities && schedule.activities.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-600 rounded-full text-[8px] font-black leading-none">
                    {schedule.activities.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content list body */}
            <div className="p-2 sm:p-4 flex-1 space-y-2.5 max-h-[300px] sm:max-h-[340px] overflow-y-auto custom-scrollbar">
              {(activeCardTabs[schedule.id] || 'atuantes') === 'atuantes' ? (
                schedule.assignments.length > 0 ? (
                  schedule.assignments.map((assignment) => {
                    const worksToday = assignment.days.some(d => {
                      if (d.specificDay !== undefined) {
                        const today = new Date();
                        return d.specificDay === today.getDate() && 
                               selectedMonth === today.getMonth() && 
                               selectedYear === today.getFullYear();
                      }
                      return d.dayOfWeek === currentDayIdx;
                    });

                    // Sort days: specific chronologically first, then weekly
                    const sortedDays = [...assignment.days].sort((a, b) => {
                      if (a.specificDay !== undefined && b.specificDay !== undefined) {
                        return a.specificDay - b.specificDay;
                      }
                      if (a.specificDay !== undefined) return -1;
                      if (b.specificDay !== undefined) return 1;
                      return a.dayOfWeek - b.dayOfWeek;
                    });
                    
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
                              {sortedDays.map((d, index) => {
                                const displayDayName = d.specificDay !== undefined 
                                  ? `${String(d.specificDay).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}` 
                                  : daysOfWeek[d.dayOfWeek].substring(0, 3);
                                const uniqueKey = d.specificDay !== undefined ? `spec-${d.specificDay}` : `week-${d.dayOfWeek}-${index}`;
                                return (
                                  <div key={uniqueKey} className="flex items-center gap-0.5 sm:gap-1 text-[7px] sm:text-[8px] font-bold">
                                    <span className={cn("uppercase", worksToday ? "text-indigo-100" : "text-gray-400")}>{displayDayName}</span>
                                    <span className={cn("italic", worksToday ? "text-white/80" : "text-indigo-500/80")}>{d.shift}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all shrink-0">
                            {canManage(schedule.sectorId) && (
                              <button 
                                onClick={() => handleEditAssignment(schedule, assignment)}
                                className={cn(
                                  "p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer",
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
                                  "p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer",
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
                  <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-2 opacity-40">
                    <Users size={20} className="text-gray-300" />
                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Ninguém<br/>escalado</p>
                  </div>
                )
              ) : (
                schedule.activities && schedule.activities.length > 0 ? (
                  schedule.activities.map((act) => {
                    const today = new Date();
                    const isTodayAct = act.specificDay === today.getDate() && 
                                       selectedMonth === today.getMonth() && 
                                       selectedYear === today.getFullYear();
                    
                    return (
                      <div key={act.id} className={cn(
                        "p-3 rounded-2xl border transition-all relative flex gap-2.5 items-start group/act-item",
                        isTodayAct 
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-50"
                          : "bg-gray-50 border-gray-100/70 hover:bg-indigo-50/10 hover:border-indigo-100"
                      )}>
                        {/* Day Plate */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl shrink-0 flex flex-col items-center justify-center border font-black",
                          isTodayAct
                            ? "bg-white text-indigo-600 border-white"
                            : "bg-white text-gray-800 border-gray-200/60 shadow-sm"
                        )}>
                          <span className="text-sm leading-none">{String(act.specificDay).padStart(2, '0')}</span>
                          <span className="text-[7px] uppercase tracking-widest font-black leading-none mt-0.5">
                            {months[selectedMonth].substring(0, 3)}
                          </span>
                        </div>

                        {/* Activity details */}
                        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "text-[8px] font-mono font-bold",
                              isTodayAct ? "text-indigo-200" : "text-gray-400"
                            )}>{act.time}</span>
                            {act.format && (
                              <span className={cn(
                                "text-[7px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-widest",
                                act.format === 'PRESENCIAL' 
                                  ? (isTodayAct ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600 border border-emerald-100")
                                  : act.format === 'ONLINE'
                                    ? (isTodayAct ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-600 border border-sky-100")
                                    : (isTodayAct ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600 border border-purple-100")
                              )}>
                                {act.format}
                              </span>
                            )}
                          </div>
                          
                          <p className={cn(
                            "text-xs font-bold leading-snug tracking-tight",
                            isTodayAct ? "text-white" : "text-gray-900"
                          )}>
                            {act.title}
                          </p>

                          {act.dirigente && (
                            <p className={cn(
                              "text-[9px] font-medium leading-none",
                              isTodayAct ? "text-indigo-100" : "text-gray-500"
                            )}>
                              <strong className={isTodayAct ? "text-white" : "text-indigo-600"}>Dirigente:</strong> {act.dirigente}
                            </p>
                          )}

                          {act.passistas && act.passistas.length > 0 && (
                            <div className={cn(
                              "text-[9px] font-medium leading-tight",
                              isTodayAct ? "text-indigo-100" : "text-gray-500"
                            )}>
                              <strong className={isTodayAct ? "text-white" : "text-indigo-600"}>Atuantes:</strong> {act.passistas.join(', ')}
                            </div>
                          )}

                          {act.observations && (
                            <div className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-md italic font-semibold border mt-1 select-none",
                              isTodayAct 
                                ? "bg-indigo-700/50 text-indigo-100 border-indigo-500" 
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              {act.observations}
                            </div>
                          )}
                        </div>

                        {/* Inline Edit/Delete for activities */}
                        {canManage(schedule.sectorId) && (
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover/act-item:opacity-100 transition-all shrink-0 select-none">
                            <button
                              onClick={() => handleOpenActivityModal(schedule, act)}
                              className={cn(
                                "p-1 rounded hover:bg-white/10 transition-colors cursor-pointer",
                                isTodayAct ? "text-white hover:bg-white/20" : "text-gray-300 hover:text-indigo-600 hover:bg-gray-100"
                              )}
                              title="Editar Atividade"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(schedule, act.id)}
                              className={cn(
                                "p-1 rounded hover:bg-white/10 transition-colors cursor-pointer",
                                isTodayAct ? "text-white hover:bg-white/20" : "text-gray-300 hover:text-red-500 hover:bg-gray-100"
                              )}
                              title="Excluir Atividade"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-2 opacity-40">
                    <CalendarCheck size={20} className="text-gray-300" />
                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Nenhuma atividade<br/>agendada</p>
                  </div>
                )
              )}
            </div>
            
            <div className="p-3 sm:p-4 bg-gray-50/50">
              {canManage(schedule.sectorId) && (
                (activeCardTabs[schedule.id] || 'atuantes') === 'atuantes' ? (
                  <button 
                    onClick={() => {
                      setEditingSchedule(schedule);
                      setEditingAssignmentId(null);
                      setShowAssignmentModal(true);
                    }}
                    className="w-full py-2 sm:py-2.5 bg-white text-gray-600 border border-gray-100 font-bold rounded-xl sm:rounded-[16px] text-[9px] sm:text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                  >
                    <UserPlus size={12} className="sm:size-[14px]" />
                    <span>Escalar</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleOpenActivityModal(schedule)}
                    className="w-full py-2 sm:py-2.5 bg-indigo-600 text-white font-bold rounded-xl sm:rounded-[16px] text-[9px] sm:text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus size={12} className="sm:size-[14px]" />
                    <span>Nova Atividade</span>
                  </button>
                )
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

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Escala e Horários</label>
                    <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('weekly');
                          setDayShifts({});
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                          assignmentType === 'weekly' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-650"
                        )}
                      >
                        Padrão Semanal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('specific');
                          setDayShifts({});
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                          assignmentType === 'specific' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-650"
                        )}
                      >
                        Datas Específicas
                      </button>
                    </div>
                  </div>

                  {assignmentType === 'weekly' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {daysOfWeek.map((day, idx) => {
                        const key = `weekly-${idx}`;
                        const isSelected = dayShifts[key] !== undefined;
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
                                    delete next[key];
                                  } else {
                                    next[key] = '';
                                  }
                                  return next;
                                });
                              }}
                              className={cn(
                                "w-14 py-1.5 rounded-lg text-[10px] font-black transition-all border shrink-0 cursor-pointer",
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
                                  value={dayShifts[key] || ''} 
                                  onChange={e => setDayShifts(prev => ({ ...prev, [key]: e.target.value }))} 
                                  className="w-full bg-white px-2 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 outline-none border border-transparent focus:border-indigo-600 transition-all font-mono" 
                                  placeholder="Horário (ex: 19:30)"
                                  autoFocus
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 border border-gray-100 rounded-2xl bg-gray-50/50">
                      {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map((dayNum) => {
                        const dateObj = new Date(selectedYear, selectedMonth, dayNum);
                        const dayOfWeekIdx = dateObj.getDay();
                        const dayName = daysOfWeek[dayOfWeekIdx];
                        const key = `specific-${dayNum}`;
                        const isSelected = dayShifts[key] !== undefined;
                        
                        return (
                          <div key={dayNum} className={cn(
                            "flex flex-col gap-1.5 p-2 rounded-xl border transition-all text-left",
                            isSelected ? "bg-indigo-50/50 border-indigo-100 ring-1 ring-indigo-200" : "bg-white border-transparent hover:border-gray-150"
                          )}>
                            <button
                              type="button"
                              onClick={() => {
                                setDayShifts(prev => {
                                  const next = { ...prev };
                                  if (isSelected) {
                                    delete next[key];
                                  } else {
                                    next[key] = '';
                                  }
                                  return next;
                                });
                              }}
                              className={cn(
                                "w-full text-center py-1 rounded-lg text-[10px] font-black transition-all border cursor-pointer block",
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                  : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                              )}
                            >
                              {String(dayNum).padStart(2, '0')}/{String(selectedMonth + 1).padStart(2, '0')} - {dayName.substring(0, 3)}
                            </button>
                            
                            {isSelected && (
                              <input 
                                value={dayShifts[key] || ''} 
                                onChange={e => setDayShifts(prev => ({ ...prev, [key]: e.target.value }))} 
                                className="w-full bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-gray-750 outline-none border border-gray-200 focus:border-indigo-600 transition-all text-center font-mono" 
                                placeholder="Ex: 19:00"
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* Modal Adicionar/Editar Atividades no Cronograma */}
      <AnimatePresence>
        {showActivityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivityModal(false)}
              className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4 shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter italic">
                    {editingActivityId ? 'Editar Atividade' : 'Nova Atividade no Cronograma'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-tight">
                    Setor: <strong className="text-indigo-600">{selectedScheduleForActivity?.sectorName}</strong> • {months[selectedMonth]} {selectedYear}
                  </p>
                </div>
                <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSaveActivity} className="space-y-4 flex-1 overflow-y-auto pr-1 py-1 custom-scrollbar">
                {/* Specific Day selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dia de Realização</label>
                  <select
                    required
                    value={activityFormData.specificDay}
                    onChange={e => setActivityFormData(prev => ({ ...prev, specificDay: Number(e.target.value) }))}
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  >
                    {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map((dayNum) => {
                      const dateObj = new Date(selectedYear, selectedMonth, dayNum);
                      const dayOfWeekIdx = dateObj.getDay();
                      const dayName = daysOfWeek[dayOfWeekIdx];
                      return (
                        <option key={dayNum} value={dayNum}>
                          Dia {String(dayNum).padStart(2, '0')} ({dayName})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Time range */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Horário de Início e Fim</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.time}
                    onChange={e => setActivityFormData(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="ex: 18:50 - 19:30"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                {/* Title / Topic */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Título / Tema da Atividade</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.title}
                    onChange={e => setActivityFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="ex: Estudo do Cap V - Bem-aventurados os aflitos"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                {/* Format Presencial/Online/Hibrido */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Formato</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PRESENCIAL', 'ONLINE', 'HIBRIDO'] as const).map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setActivityFormData(prev => ({ ...prev, format: fmt }))}
                        className={cn(
                          "py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                          activityFormData.format === fmt
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                        )}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dirigente */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dirigente / Expositor (Opcional)</label>
                  <input
                    type="text"
                    value={activityFormData.dirigente}
                    onChange={e => setActivityFormData(prev => ({ ...prev, dirigente: e.target.value }))}
                    placeholder="Nome do palestrante ou dirigente"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                {/* Passistas / Atuantes escalados */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Atuantes / Equipe de Apoio (Opcional, sep. por vírgula)</label>
                  <input
                    type="text"
                    value={activityFormData.passistas}
                    onChange={e => setActivityFormData(prev => ({ ...prev, passistas: e.target.value }))}
                    placeholder="Nome 1, Nome 2, Nome 3"
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                </div>

                {/* Observations */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Observações / Recados (Opcional)</label>
                  <textarea
                    value={activityFormData.observations}
                    onChange={e => setActivityFormData(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Indique se há algum recesso, feriado local ou recados gerais aos trabalhadores."
                    rows={2}
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:bg-white focus:border-indigo-600 outline-none transition-all resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50 mt-4 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => setShowActivityModal(false)} 
                    className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition-all text-xs border border-transparent order-2 sm:order-1 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[1.5] py-3 bg-indigo-600 text-white font-black rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all text-xs order-1 sm:order-2 cursor-pointer"
                  >
                    Salvar no Cronograma
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
