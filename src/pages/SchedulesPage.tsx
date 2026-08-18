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
  ArrowLeft,
  Printer,
  Bell,
  AlertTriangle,
  Grid,
  List,
  Copy,
  Share2,
  Tv,
  Check,
  Sparkles,
  Download,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { dataService } from '../services/dataService';
import { SectorSchedule, Worker, ScheduleAssignment, Sector, formatSectorName, SectorActivity } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { printFormattedReport } from '../lib/exportUtils';
import { ScheduleRemindersModal } from '../components/ScheduleRemindersModal';

export const SchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [schedules, setSchedules] = useState<SectorSchedule[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [isAddingSector, setIsAddingSector] = useState(false);
  const [isEditingSector, setIsEditingSector] = useState(false);
  const [targetSector, setTargetSector] = useState<{id: string, name: string} | null>(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<SectorSchedule | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  
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
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
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

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  const canManage = (sectorId?: string) => {
    if (isAdmin) return true;
    if (currentUser?.role === 'COORDENADOR' && currentUser.sectorId === sectorId) return true;
    return false;
  };

  useEffect(() => {
    if (currentUser?.role === 'RECEPCIONISTA') return;

    // Real-time listener for monthly schedules
    const unsubSchedules = dataService.subscribeToSchedulesByMonth(selectedMonth, selectedYear, (list) => {
      setSchedules(list || []);
    });

    // Load workers & sectors
    loadStaticData();

    return () => {
      unsubSchedules();
    };
  }, [selectedMonth, selectedYear, currentUser]);

  const loadStaticData = async () => {
    const [w, sec] = await Promise.all([
      dataService.getWorkers(),
      dataService.getSectors()
    ]);

    setWorkers(w || []);

    // Clean duplicate sectors if any
    let doutrinariaExists = false;
    const seenNames = new Set<string>();
    const cleanedSec: Sector[] = [];

    for (const sector of (sec || [])) {
      const formattedName = formatSectorName(sector.name);
      const normalizedName = formattedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      
      if (normalizedName === 'mediunidade') {
        sector.name = 'Mediúnica';
        dataService.updateSector(sector);
      } else {
        sector.name = formattedName;
      }

      if (seenNames.has(sector.name.toLowerCase().trim())) {
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
      });
    }

    setSectors(cleanedSec);
  };

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
        const sector = sectors.find(s => s.id === targetSector.id);
        if (sector) {
          await dataService.updateSector({ ...sector, name: newSectorName });
        }
      } else {
        const newSector = await dataService.addSector({
          name: newSectorName,
          type: 'OUTROS',
          description: 'Novo setor de escala'
        });
        await dataService.addSectorSchedule(newSector.name, newSector.id, selectedMonth, selectedYear);
      }
      
      closeSectorModal();
      await loadStaticData();
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
        }
        setDeletingSectorId(null);
        await loadStaticData();
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
        updatedAssignments = updatedAssignments.map(a => 
          a.id === editingAssignmentId 
            ? { ...a, workerId: worker.id, workerName: worker.name, days: daysDetail } 
            : a
        );
      } else {
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

      if (currentSchedule.id.startsWith('temp-')) {
        currentSchedule = await dataService.addSectorSchedule(
          currentSchedule.sectorName,
          currentSchedule.sectorId,
          selectedMonth,
          selectedYear
        );
      }

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

      updatedActivities.sort((a, b) => a.specificDay - b.specificDay);

      const updatedSchedule = {
        ...currentSchedule,
        activities: updatedActivities
      };

      await dataService.updateSectorSchedule(updatedSchedule);
      setShowActivityModal(false);
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
      alert('Atividade removida com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir atividade:', err);
      alert('Erro ao excluir atividade de escala.');
    }
  };

  // Comprehensive Filter (Sector name, Worker names, Activity title/dirigente/passistas)
  const displaySchedules = sectors
    .filter(s => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;

      const matchesSectorName = s.name.toLowerCase().includes(term);
      const existing = schedules.find(sch => sch.sectorId === s.id);
      
      const matchesWorkerName = existing?.assignments.some(a => 
        a.workerName.toLowerCase().includes(term)
      ) || false;

      const matchesActivity = existing?.activities?.some(act => 
        (act.title && act.title.toLowerCase().includes(term)) ||
        (act.dirigente && act.dirigente.toLowerCase().includes(term)) ||
        (act.passistas && act.passistas.some(p => p.toLowerCase().includes(term)))
      ) || false;

      const matchesSearch = matchesSectorName || matchesWorkerName || matchesActivity;

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

  // Calculate Schedule Conflicts (Dupla Escala Check)
  const getScheduleConflicts = () => {
    const map = new Map<string, { workerName: string; sectorNames: Set<string>; dayLabel: string; shift: string }>();

    schedules.forEach(s => {
      s.assignments.forEach(a => {
        const wName = a.workerName.trim();
        if (!wName) return;

        a.days.forEach(d => {
          const dayKey = d.specificDay ? `day-${d.specificDay}` : `dow-${d.dayOfWeek}`;
          const dayLabel = d.specificDay ? `Dia ${d.specificDay}` : daysOfWeek[d.dayOfWeek];
          const shift = d.shift || 'Normal';
          const key = `${wName.toLowerCase()}|${dayKey}|${shift}`;

          if (!map.has(key)) {
            map.set(key, {
              workerName: wName,
              sectorNames: new Set([s.sectorName]),
              dayLabel,
              shift
            });
          } else {
            map.get(key)!.sectorNames.add(s.sectorName);
          }
        });
      });
    });

    const conflicts: { workerName: string; sectorNames: string[]; dayLabel: string; shift: string }[] = [];
    map.forEach(entry => {
      if (entry.sectorNames.size > 1) {
        conflicts.push({
          workerName: entry.workerName,
          sectorNames: Array.from(entry.sectorNames),
          dayLabel: entry.dayLabel,
          shift: entry.shift
        });
      }
    });

    return conflicts;
  };

  const scheduleConflicts = getScheduleConflicts();

  // Export PDF Bulletin
  const exportSchedulesPDF = () => {
    try {
      const doc = new jsPDF();
      const monthName = months[selectedMonth];

      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text("CENTRO ESPÍRITA MIRANTE DE LUZ", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.setFont("helvetica", "bold");
      doc.text(`QUADRO GERAL DE ESCALAS DE SERVIÇO - ${monthName.toUpperCase()} / ${selectedYear}`, 105, 27, { align: "center" });

      doc.setDrawColor(220);
      doc.line(14, 32, 196, 32);

      let startY = 38;

      displaySchedules.forEach((schedule) => {
        if (startY > 240) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(30);
        doc.setFont("helvetica", "bold");
        doc.text(`Setor: ${schedule.sectorName}`, 14, startY);
        startY += 6;

        const tableData = schedule.assignments.map((a) => {
          const daysTxt = a.days
            .map((d) => (d.specificDay ? `Dia ${d.specificDay}` : daysOfWeek[d.dayOfWeek]))
            .join(", ");
          const shiftTxt = a.days[0]?.shift || "Normal";
          return [a.workerName, daysTxt, shiftTxt];
        });

        if (tableData.length > 0) {
          autoTable(doc, {
            startY: startY,
            head: [["Trabalhador Voluntário", "Dias de Escala", "Turno"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 70 },
              1: { cellWidth: 80 },
              2: { cellWidth: 32 },
            },
          });
          startY = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(150);
          doc.text("Nenhum trabalhador escalado neste setor.", 18, startY);
          startY += 8;
        }
      });

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
          105,
          285,
          { align: "center" }
        );
      }

      doc.save(`Escalas_CEMIL_${monthName}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF de escalas:", err);
      alert("Erro ao gerar PDF das escalas.");
    }
  };

  // Copy WhatsApp Day Schedule
  const copyDayWhatsAppSchedule = (dayNum: number) => {
    const dateObj = new Date(selectedYear, selectedMonth, dayNum);
    const dateFormatted = format(dateObj, "dd/MM/yyyy (EEEE)", { locale: ptBR });
    const dayOfWeekIdx = dateObj.getDay();

    let text = `✨ *CENTRO ESPÍRITA MIRANTE DE LUZ* ✨\n`;
    text += `📅 *ESCALA DE TRABALHO DO DIA - ${dateFormatted.toUpperCase()}*\n`;
    text += `----------------------------------------\n\n`;

    let foundAny = false;

    displaySchedules.forEach((s) => {
      const dayAssignments = s.assignments.filter((a) =>
        a.days.some((d) => d.specificDay === dayNum || d.dayOfWeek === dayOfWeekIdx)
      );

      const dayActivities = (s.activities || []).filter(
        (act) => act.specificDay === dayNum
      );

      if (dayAssignments.length > 0 || dayActivities.length > 0) {
        foundAny = true;
        text += `🏢 *SETOR: ${s.sectorName.toUpperCase()}*\n`;

        if (dayAssignments.length > 0) {
          text += `👥 *Voluntários Escalados:*\n`;
          dayAssignments.forEach((a) => {
            const shiftInfo =
              a.days.find((d) => d.specificDay === dayNum || d.dayOfWeek === dayOfWeekIdx)
                ?.shift || "Ativo";
            text += `  • *${a.workerName}* (${shiftInfo})\n`;
          });
        }

        if (dayActivities.length > 0) {
          text += `📌 *Atividades & Programação:*\n`;
          dayActivities.forEach((act) => {
            text += `  • *${act.time}:* ${act.title || "Sessão"}`;
            if (act.dirigente) text += ` (Dirigente: ${act.dirigente})`;
            text += `\n`;
          });
        }

        text += `\n`;
      }
    });

    if (!foundAny) {
      alert(`Nenhuma atividade ou voluntário escalado para o dia ${dayNum}.`);
      return;
    }

    text += `----------------------------------------\n`;
    text += `🙏 *"A caridade é o farol que ilumina nossos caminhos."*`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(`Escala do dia ${dayNum} copiada para a área de transferência!`);
      })
      .catch(() => {
        alert("Não foi possível copiar a escala.");
      });
  };

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

  if (currentUser?.role === 'RECEPCIONISTA') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <CalendarCheck size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-gray-900">Acesso Negado</h2>
        <p className="text-gray-500 max-w-sm mt-2">Recepcionistas não possuem permissão para visualizar ou gerenciar escalas de trabalho.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold">Voltar ao Início</button>
      </div>
    );
  }

  // Days in selected month for Calendar View
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 shrink-0 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Escala de Serviço Semanal
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium font-serif italic">
              Organização de tarefas, dias de atendimento e divisão de equipes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === 'cards'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <LayoutGrid size={14} />
              <span>Por Setor</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === 'calendar'
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <Calendar size={14} />
              <span>Grade Mensal</span>
            </button>
          </div>

          <button 
            onClick={() => setIsRemindersOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Disparo WhatsApp</span>
          </button>

          <button 
            onClick={exportSchedulesPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Exportar PDF Completo"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">PDF Geral</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => {
                setIsAddingSector(true);
                setIsEditingSector(false);
                setNewSectorName('');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Novo Grupo de Escala</span>
            </button>
          )}
        </div>
      </header>

      {/* Schedule Conflicts Alert Banner */}
      {scheduleConflicts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900">
                Alerta de Conflito ({scheduleConflicts.length} voluntários com Dupla Escala)
              </h4>
              <div className="text-xs text-amber-800/90 font-medium mt-1 space-y-1">
                {scheduleConflicts.slice(0, 3).map((c, i) => (
                  <p key={i}>
                    • <strong>{c.workerName}</strong> escalado no mesmo turno (<em>{c.shift} - {c.dayLabel}</em>) nos setores: <u>{c.sectorNames.join(' e ')}</u>
                  </p>
                ))}
                {scheduleConflicts.length > 3 && (
                  <p className="text-[11px] font-bold italic">...e mais {scheduleConflicts.length - 3} conflito(s).</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Month Selector Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
          >
            &larr; Mês Anterior
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            <span className="text-lg font-black text-gray-900">
              {months[selectedMonth]} / {selectedYear}
            </span>
          </div>

          <button 
            onClick={() => changeMonth(1)}
            className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
          >
            Próximo Mês &rarr;
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar voluntário, setor ou atividade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-11 pr-4 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
          />
        </div>
      </div>

      {/* VIEW MODE 1: CARDS BY SECTOR */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displaySchedules.length > 0 ? (
            displaySchedules.map((schedule) => {
              const activeTab = activeCardTabs[schedule.id] || 'atuantes';
              const isUserCoord = currentUser?.role === 'COORDENADOR' && currentUser.sectorId === schedule.sectorId;
              const hasManagePermission = canManage(schedule.sectorId);

              return (
                <motion.div 
                  layout
                  key={schedule.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden group"
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-indigo-50/40 via-white to-transparent">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/60">
                        {schedule.sectorName}
                      </span>
                      <h3 className="text-lg font-black text-gray-900 mt-2">
                        {schedule.sectorName}
                      </h3>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setTargetSector({ id: schedule.sectorId, name: schedule.sectorName });
                            setNewSectorName(schedule.sectorName);
                            setIsEditingSector(true);
                            setIsAddingSector(true);
                          }}
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar Nome do Grupo"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSector(schedule.id, schedule.sectorId)}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            deletingSectorId === schedule.id ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1" : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                          )}
                        >
                          {deletingSectorId === schedule.id ? 'Confirma?' : <Trash2 size={16} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Tab Switcher */}
                  <div className="px-6 pt-4 flex items-center justify-between border-b border-gray-100/60">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveCardTabs({ ...activeCardTabs, [schedule.id]: 'atuantes' })}
                        className={cn(
                          "pb-3 text-xs font-bold transition-all relative cursor-pointer",
                          activeTab === 'atuantes' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Equipe ({schedule.assignments.length})
                        {activeTab === 'atuantes' && (
                          <motion.div layoutId={`tab-${schedule.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                        )}
                      </button>
                      <button 
                        onClick={() => setActiveCardTabs({ ...activeCardTabs, [schedule.id]: 'atividades' })}
                        className={cn(
                          "pb-3 text-xs font-bold transition-all relative cursor-pointer",
                          activeTab === 'atividades' ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Programação ({(schedule.activities || []).length})
                        {activeTab === 'atividades' && (
                          <motion.div layoutId={`tab-${schedule.id}`} className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                        )}
                      </button>
                    </div>

                    {hasManagePermission && (
                      <button 
                        onClick={() => {
                          if (activeTab === 'atuantes') {
                            setEditingSchedule(schedule);
                            setEditingAssignmentId(null);
                            setShowAssignmentModal(true);
                          } else {
                            handleOpenActivityModal(schedule);
                          }
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer pb-3"
                      >
                        <Plus size={14} />
                        <span>{activeTab === 'atuantes' ? 'Atribuir' : 'Atividade'}</span>
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                    {activeTab === 'atuantes' ? (
                      schedule.assignments.length > 0 ? (
                        schedule.assignments.map((assignment) => {
                          const workerHasConflict = scheduleConflicts.some(c => c.workerName.toLowerCase().trim() === assignment.workerName.toLowerCase().trim());

                          return (
                            <div 
                              key={assignment.id} 
                              className="p-3.5 bg-gray-50/80 hover:bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 group/item transition-all"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-gray-900 truncate">
                                    {assignment.workerName}
                                  </span>
                                  {workerHasConflict && (
                                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 shrink-0" title="Voluntário com Dupla Escala neste turno">
                                      ⚠️ Dupla
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-gray-500 font-medium space-y-0.5">
                                  {assignment.days.map((d, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <Clock size={11} className="text-indigo-500 shrink-0" />
                                      <span className="truncate">
                                        {d.specificDay ? `Dia ${d.specificDay}` : daysOfWeek[d.dayOfWeek]}: <strong>{d.shift}</strong>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {hasManagePermission && (
                                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleEditAssignment(schedule, assignment)}
                                    className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveAssignment(schedule, assignment.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                          Nenhum voluntário atribuído.
                        </div>
                      )
                    ) : (
                      /* Atividades Tab */
                      (schedule.activities || []).length > 0 ? (
                        (schedule.activities || []).map((act) => (
                          <div 
                            key={act.id} 
                            className="p-3.5 bg-gray-50/80 hover:bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 group/act transition-all"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px]">
                                Dia {act.specificDay} • {act.time}
                              </span>

                              {hasManagePermission && (
                                <div className="flex items-center gap-1 opacity-0 group-hover/act:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleOpenActivityModal(schedule, act)}
                                    className="p-1 text-gray-300 hover:text-indigo-600"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteActivity(schedule, act.id)}
                                    className="p-1 text-gray-300 hover:text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-extrabold text-gray-900">
                              {act.title}
                            </p>

                            {act.dirigente && (
                              <p className="text-[10px] text-gray-500 font-medium">
                                Dirigente: <strong className="text-gray-700">{act.dirigente}</strong>
                              </p>
                            )}

                            {act.passistas && act.passistas.length > 0 && (
                              <p className="text-[10px] text-gray-500 font-medium">
                                Passistas: <strong className="text-indigo-600">{act.passistas.join(', ')}</strong>
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                          Nenhuma atividade específica cadastrada.
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-[32px] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Nenhum grupo ou escala cadastrado para este mês.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: UNIFIED MONTHLY CALENDAR GRID */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">
                Grade de Serviço Geral do Mês ({months[selectedMonth]} / {selectedYear})
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Visão unificada dia a dia de todos os voluntários e atividades agendadas.
              </p>
            </div>

            <button 
              onClick={exportSchedulesPDF}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir Grade PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const dateObj = new Date(selectedYear, selectedMonth, dayNum);
              const dayOfWeekIdx = dateObj.getDay();
              const dayOfWeekName = daysOfWeek[dayOfWeekIdx];

              // Find assigned workers for this day
              const dayAssignmentsList: { workerName: string; sectorName: string; shift: string }[] = [];
              displaySchedules.forEach((s) => {
                s.assignments.forEach((a) => {
                  a.days.forEach((d) => {
                    if (d.specificDay === dayNum || (d.specificDay === undefined && d.dayOfWeek === dayOfWeekIdx)) {
                      dayAssignmentsList.push({
                        workerName: a.workerName,
                        sectorName: s.sectorName,
                        shift: d.shift
                      });
                    }
                  });
                });
              });

              // Find activities for this day
              const dayActivitiesList: { title: string; sectorName: string; time: string; dirigente?: string }[] = [];
              displaySchedules.forEach((s) => {
                (s.activities || []).forEach((act) => {
                  if (act.specificDay === dayNum) {
                    dayActivitiesList.push({
                      title: act.title,
                      sectorName: s.sectorName,
                      time: act.time,
                      dirigente: act.dirigente
                    });
                  }
                });
              });

              const isToday = new Date().getDate() === dayNum && new Date().getMonth() === selectedMonth && new Date().getFullYear() === selectedYear;

              return (
                <div 
                  key={dayNum}
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 min-h-[140px]",
                    isToday ? "bg-indigo-50/60 border-indigo-200 ring-2 ring-indigo-500/20" : "bg-gray-50/50 border-gray-100 hover:border-indigo-100 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-gray-100/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-sm font-black", isToday ? "text-indigo-700" : "text-gray-900")}>
                        {dayNum}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        {dayOfWeekName.substring(0, 3)}
                      </span>
                    </div>

                    <button 
                      onClick={() => copyDayWhatsAppSchedule(dayNum)}
                      className="p-1 text-gray-300 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer"
                      title="Copiar Escala do Dia para WhatsApp"
                    >
                      <Share2 size={12} />
                    </button>
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-32 text-[10px]">
                    {dayAssignmentsList.length > 0 && (
                      <div className="space-y-1">
                        {dayAssignmentsList.slice(0, 3).map((da, idx) => (
                          <div key={idx} className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-2xs">
                            <span className="font-extrabold text-gray-800 block truncate">{da.workerName}</span>
                            <span className="text-[9px] text-indigo-600 font-bold block truncate">{da.sectorName}</span>
                          </div>
                        ))}
                        {dayAssignmentsList.length > 3 && (
                          <span className="text-[9px] font-bold text-gray-400 block text-center">
                            +{dayAssignmentsList.length - 3} voluntários
                          </span>
                        )}
                      </div>
                    )}

                    {dayActivitiesList.length > 0 && (
                      <div className="pt-1 border-t border-gray-100 space-y-1">
                        {dayActivitiesList.map((act, idx) => (
                          <div key={idx} className="bg-indigo-100/50 text-indigo-900 p-1 rounded-md text-[9px] font-bold truncate">
                            📌 {act.title}
                          </div>
                        ))}
                      </div>
                    )}

                    {dayAssignmentsList.length === 0 && dayActivitiesList.length === 0 && (
                      <span className="text-[10px] text-gray-300 italic block py-2 text-center">Sem escala</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SECTOR GROUP */}
      <AnimatePresence>
        {isAddingSector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-800">
                  {isEditingSector ? 'Editar Grupo de Escala' : 'Novo Grupo de Escala'}
                </h3>
                <button onClick={closeSectorModal} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSector} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Nome do Setor / Grupo</label>
                  <input 
                    required
                    placeholder="Ex: Passe, Atendimento Fraterno, Recepção..."
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={closeSectorModal}
                    className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 text-xs"
                  >
                    Salvar Grupo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ASSIGN WORKER */}
      <AnimatePresence>
        {showAssignmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {editingAssignmentId ? 'Editar Atribuição' : 'Escalar Voluntário'}
                  </h3>
                  <p className="text-xs text-slate-500">Setor: {editingSchedule?.sectorName}</p>
                </div>
                <button onClick={() => setShowAssignmentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Select Worker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Selecionar Trabalhador Voluntário</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Buscar voluntário por nome..."
                      value={workerSearchTerm}
                      onChange={(e) => setWorkerSearchTerm(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pt-2 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                    {workers
                      .filter(w => !workerSearchTerm || w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()))
                      .map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setSelectedWorkerId(w.id);
                            setSelectedWorkerName(w.name);
                            setWorkerSearchTerm(w.name);
                          }}
                          className={cn(
                            "w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer",
                            selectedWorkerId === w.id ? "bg-indigo-600 text-white" : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <span>{w.name}</span>
                          {selectedWorkerId === w.id && <Check size={14} />}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Assignment Type Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500">Formato de Escala</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('weekly')}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        assignmentType === 'weekly' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                      )}
                    >
                      Recorrente (Dias da Semana)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentType('specific')}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        assignmentType === 'specific' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                      )}
                    >
                      Dia Específico do Mês
                    </button>
                  </div>
                </div>

                {/* Schedule Days Input */}
                {assignmentType === 'weekly' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Dias Semanais e Horário/Turno</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {daysOfWeek.map((dayName, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-24 text-xs font-bold text-slate-700">{dayName}:</span>
                          <input 
                            placeholder="Ex: 19:30 - 20:30 ou Plantão"
                            value={dayShifts[`weekly-${idx}`] || ''}
                            onChange={(e) => setDayShifts({ ...dayShifts, [`weekly-${idx}`]: e.target.value })}
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Dia do Mês e Horário/Turno</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        onChange={(e) => {
                          const dayVal = e.target.value;
                          if (dayVal) {
                            setDayShifts({ ...dayShifts, [`specific-${dayVal}`]: '19:30 - 20:30' });
                          }
                        }}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <option value="">+ Selecionar Dia</option>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>Dia {d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 pt-2">
                      {Object.entries(dayShifts)
                        .filter(([k]) => k.startsWith('specific-'))
                        .map(([k, shiftVal]) => {
                          const dayNum = k.replace('specific-', '');
                          return (
                            <div key={k} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <span className="text-xs font-bold text-slate-800 w-16">Dia {dayNum}:</span>
                              <input 
                                value={shiftVal}
                                onChange={(e) => setDayShifts({ ...dayShifts, [k]: e.target.value })}
                                className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const copy = { ...dayShifts };
                                  delete copy[k];
                                  setDayShifts(copy);
                                }}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setShowAssignmentModal(false)}
                    className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={handleAddAssignment}
                    disabled={!selectedWorkerId}
                    className="flex-1 py-3 bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 text-xs cursor-pointer"
                  >
                    Confirmar Escala
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD/EDIT ACTIVITY */}
      <AnimatePresence>
        {showActivityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {editingActivityId ? 'Editar Atividade' : 'Nova Atividade no Cronograma'}
                  </h3>
                  <p className="text-xs text-slate-500">Setor: {selectedScheduleForActivity?.sectorName}</p>
                </div>
                <button onClick={() => setShowActivityModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveActivity} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Dia do Mês</label>
                    <input 
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={activityFormData.specificDay}
                      onChange={(e) => setActivityFormData({ ...activityFormData, specificDay: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Horário</label>
                    <input 
                      required
                      placeholder="Ex: 19:30 - 20:30"
                      value={activityFormData.time}
                      onChange={(e) => setActivityFormData({ ...activityFormData, time: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Título / Tema da Sessão</label>
                  <input 
                    required
                    placeholder="Ex: Estudo do Evangelho - Cap V"
                    value={activityFormData.title}
                    onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Dirigente / Responsável</label>
                  <input 
                    placeholder="Ex: Altamir Arruda"
                    value={activityFormData.dirigente}
                    onChange={(e) => setActivityFormData({ ...activityFormData, dirigente: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Passistas / Apoio (Separados por vírgula)</label>
                  <input 
                    placeholder="Ex: Iris Abreu, Marilda Arruda"
                    value={activityFormData.passistas}
                    onChange={(e) => setActivityFormData({ ...activityFormData, passistas: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Formato</label>
                    <select
                      value={activityFormData.format}
                      onChange={(e) => setActivityFormData({ ...activityFormData, format: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="ONLINE">Online</option>
                      <option value="HIBRIDO">Híbrido</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Observação</label>
                    <input 
                      placeholder="Ex: Aula prática"
                      value={activityFormData.observations}
                      onChange={(e) => setActivityFormData({ ...activityFormData, observations: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowActivityModal(false)}
                    className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 text-xs cursor-pointer"
                  >
                    Salvar Atividade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP REMINDERS MODAL */}
      <ScheduleRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        sectorName="Escalas da Casa Espírita"
        workersToRemind={displaySchedules.flatMap(s => s.assignments.map(a => {
          const matchedWorker = workers.find(w => w.id === a.workerId || w.name.toLowerCase().trim() === a.workerName.toLowerCase().trim());
          return {
            name: a.workerName,
            phone: matchedWorker?.phone || '',
            day: a.days.map(d => d.specificDay ? `Dia ${d.specificDay}` : daysOfWeek[d.dayOfWeek]).join(', '),
            shift: a.days[0]?.shift || 'Normal'
          };
        }))}
      />
    </div>
  );
};
