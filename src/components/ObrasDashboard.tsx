import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hammer,
  Calculator,
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  Users,
  Building,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Layers,
  Edit3,
  Calendar,
  Tag,
  Receipt,
  Download,
  Info,
  Check,
  RotateCcw,
  ShieldAlert,
  HardHat
} from 'lucide-react';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { ConstructionProject, ObraExpense, ObraSimulation, Worker } from '../types';

interface ObrasDashboardProps {
  currentUser?: Worker | null;
}

export const ObrasDashboard: React.FC<ObrasDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'SIMULADOR' | 'PROJETOS' | 'EXTRATO' | 'MUTIRAO'>('PROJETOS');
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [expenses, setExpenses] = useState<ObraExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected project for expense view / detail
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  
  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ConstructionProject | null>(null);
  const [targetProjectForStage, setTargetProjectForStage] = useState<ConstructionProject | null>(null);

  // Form states - New Project
  const [newProjName, setNewProjName] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjPlanned, setNewProjPlanned] = useState('');
  const [newProjCoordinator, setNewProjCoordinator] = useState(currentUser?.name || 'Coordenação de Patrimônio');
  const [newProjEndDate, setNewProjEndDate] = useState('');
  const [newProjVolunteerHours, setNewProjVolunteerHours] = useState('40');
  const [newProjNotes, setNewProjNotes] = useState('');

  // Form states - New Expense
  const [expenseProjId, setExpenseProjId] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'MATERIAL' | 'MAO_DE_OBRA' | 'LOCACAO' | 'LICENCAS' | 'OUTROS'>('MATERIAL');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseReceiptRef, setExpenseReceiptRef] = useState('');

  // Form states - New Stage
  const [stageName, setStageName] = useState('');
  const [stageDuration, setStageDuration] = useState('');
  const [stageResponsible, setStageResponsible] = useState('');

  // Simulator state
  const [simCategory, setSimCategory] = useState<'PINTURA' | 'BANHEIRO_PCD' | 'TELHADO' | 'ELETRICA_LED' | 'SALAO_GERAL' | 'OUTRO'>('PINTURA');
  const [simArea, setSimArea] = useState<number>(80);
  const [simStandard, setSimStandard] = useState<'ECONOMICO' | 'MEDIO' | 'ALTA_DURABILIDADE'>('MEDIO');
  const [simHasVolunteers, setSimHasVolunteers] = useState<boolean>(true);

  // 1. Subscribe to Firestore
  useEffect(() => {
    let unsubscribeProjects: (() => void) | null = null;
    let unsubscribeExpenses: (() => void) | null = null;

    try {
      const projRef = collection(db, 'obras_projetos');
      unsubscribeProjects = onSnapshot(projRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: ConstructionProject[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as ConstructionProject);
          });
          setProjects(list);
        } else {
          // Initialize default projects if empty
          const defaults: ConstructionProject[] = [
            {
              id: 'obra_default_1',
              name: 'Reforma do Salão Principal e Pintura Doutrinária',
              location: 'Sede Principal - Salão de Palestras',
              status: 'EM_ANDAMENTO',
              budgetPlanned: 18500,
              budgetActual: 6200,
              startDate: '2026-07-01',
              estimatedEndDate: '2026-09-30',
              percentage: 35,
              coordinator: 'Carlos Alberto (Patrimônio)',
              volunteerHoursEst: 60,
              notes: 'Pintura completa das paredes internas, troca de luminárias para LED e reparo de infiltrações.',
              stages: [
                { id: 'st_1', name: 'Mapeamento de umidade e lixamento', status: 'CONCLUIDO', duration: '5 dias', responsible: 'Mestre da Obra' },
                { id: 'st_2', name: 'Aplicação de selador e massa corrida', status: 'EM_ANDAMENTO', duration: '10 dias', responsible: 'Equipe de Pintura' },
                { id: 'st_3', name: 'Pintura em tinta acrílica lavável', status: 'PLANEJADO', duration: '7 dias', responsible: 'Mutirão Voluntário' },
                { id: 'st_4', name: 'Troca de lâmpadas para painéis LED 30W', status: 'PLANEJADO', duration: '3 dias', responsible: 'Eletricista Voluntário' }
              ]
            },
            {
              id: 'obra_default_2',
              name: 'Adequação de Banheiro Acessível PCD & Rampas',
              location: 'Anexo de Atendimentos & Acolhimento',
              status: 'EM_ANDAMENTO',
              budgetPlanned: 12000,
              budgetActual: 11400,
              startDate: '2026-06-15',
              estimatedEndDate: '2026-08-30',
              percentage: 75,
              coordinator: 'Eng. Roberto Rezende',
              volunteerHoursEst: 30,
              notes: 'Instalação de barras de apoio em inox, porta de 90cm, lavatório suspenso e piso tátil.',
              stages: [
                { id: 'st_21', name: 'Demolição e readequação de tubulação', status: 'CONCLUIDO', duration: '4 dias', responsible: 'Encanador e Auxiliares' },
                { id: 'st_22', name: 'Assentamento de revestimento e barras PCD', status: 'CONCLUIDO', duration: '8 dias', responsible: 'Pedreiro Especializado' },
                { id: 'st_23', name: 'Instalação de louças e metais acessíveis', status: 'EM_ANDAMENTO', duration: '3 dias', responsible: 'Equipe Técnica' }
              ]
            }
          ];
          // Seed defaults asynchronously
          defaults.forEach(async (p) => {
            await addDoc(collection(db, 'obras_projetos'), p);
          });
          setProjects(defaults);
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore projects fetch error:", err);
        setLoading(false);
      });

      const expRef = collection(db, 'obras_despesas');
      unsubscribeExpenses = onSnapshot(expRef, (snapshot) => {
        const expList: ObraExpense[] = [];
        snapshot.forEach((d) => {
          expList.push({ id: d.id, ...d.data() } as ObraExpense);
        });
        setExpenses(expList);
      }, (err) => {
        console.error("Firestore expenses fetch error:", err);
      });

    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    return () => {
      if (unsubscribeProjects) unsubscribeProjects();
      if (unsubscribeExpenses) unsubscribeExpenses();
    };
  }, []);

  // 2. Calculations for Simulator
  const calculateSimulation = (): ObraSimulation => {
    let baseCostPerUnit = 0;
    let baseDaysPerUnit = 0;
    let materialsList: { item: string; quantity: string; estimatedPrice: number }[] = [];

    switch (simCategory) {
      case 'PINTURA':
        baseCostPerUnit = 38; // R$/m²
        baseDaysPerUnit = 0.12; // dias/m²
        const latasTinta = Math.ceil(simArea / 30);
        const latasSelador = Math.ceil(simArea / 80);
        materialsList = [
          { item: 'Tinta Acrílica Lavável Premium (18L)', quantity: `${latasTinta} lata(s)`, estimatedPrice: latasTinta * 380 },
          { item: 'Selador Acrílico Preparador (18L)', quantity: `${latasSelador} lata(s)`, estimatedPrice: latasSelador * 160 },
          { item: 'Kit Lixas, Pincéis e Rolos Antigota', quantity: '1 kit completo', estimatedPrice: 320 },
          { item: 'Massa Corrida para Retoque (25kg)', quantity: `${Math.ceil(simArea / 40)} saco(s)`, estimatedPrice: Math.ceil(simArea / 40) * 65 }
        ];
        break;

      case 'BANHEIRO_PCD':
        baseCostPerUnit = 340; // R$/m² ou kit
        baseDaysPerUnit = 0.25;
        materialsList = [
          { item: 'Kit Barras de Apoio Aço Inox (Norma ABNT NBR 9050)', quantity: '1 jogo completo', estimatedPrice: 850 },
          { item: 'Bacia Sanitária Especial com Abertura e Assento PCD', quantity: '1 unidade', estimatedPrice: 1200 },
          { item: 'Lavatório Suspenso sem Coluna com Torneira Alavanca', quantity: '1 unidade', estimatedPrice: 680 },
          { item: 'Piso Antiderrapante e Revestimento Cerâmico', quantity: `${Math.ceil(simArea * 1.5)} m²`, estimatedPrice: Math.ceil(simArea * 1.5) * 55 }
        ];
        break;

      case 'TELHADO':
        baseCostPerUnit = 110; // R$/m²
        baseDaysPerUnit = 0.18;
        const qtdManta = Math.ceil(simArea / 10);
        materialsList = [
          { item: 'Telhas Térmicas/Acústicas ou Cerâmicas', quantity: `${Math.ceil(simArea * 1.1)} m²`, estimatedPrice: Math.ceil(simArea * 1.1) * 48 },
          { item: 'Manta Térmica Aluminizada Dupla Face', quantity: `${qtdManta} rolo(s)`, estimatedPrice: qtdManta * 210 },
          { item: 'Calhas e Rufos Galvanizados 0.5mm', quantity: `${Math.ceil(Math.sqrt(simArea) * 4)}m`, estimatedPrice: Math.ceil(Math.sqrt(simArea) * 4) * 42 }
        ];
        break;

      case 'ELETRICA_LED':
        baseCostPerUnit = 60; // R$/m²
        baseDaysPerUnit = 0.08;
        const paineisLED = Math.ceil(simArea / 12);
        const rolosFio = Math.ceil(simArea / 25);
        materialsList = [
          { item: 'Painéis Plafon LED 30W/36W Alta Eficiência', quantity: `${paineisLED} unidades`, estimatedPrice: paineisLED * 85 },
          { item: 'Rolo Fio Cobre Flexível 2.5mm² / 4mm²', quantity: `${rolosFio} rolo(s) 100m`, estimatedPrice: rolosFio * 290 },
          { item: 'Quadro de Distribuição, Disjuntores DIN e DPS', quantity: '1 kit segurança', estimatedPrice: 650 }
        ];
        break;

      case 'SALAO_GERAL':
        baseCostPerUnit = 220; // R$/m²
        baseDaysPerUnit = 0.3;
        materialsList = [
          { item: 'Argamassa e Revestimento Porcelanato de Alta Tráfego', quantity: `${simArea} m²`, estimatedPrice: simArea * 80 },
          { item: 'Tinta para Paredes e Forro PVC/Gesso', quantity: `${simArea} m²`, estimatedPrice: simArea * 45 },
          { item: 'Iluminação LED e Pontos de Tomada Bivolt', quantity: 'Pontos completos', estimatedPrice: simArea * 35 }
        ];
        break;

      default:
        baseCostPerUnit = 100;
        baseDaysPerUnit = 0.15;
        materialsList = [
          { item: 'Insumos Diversos de Construção e Reparo', quantity: 'Conforme projeto', estimatedPrice: simArea * 70 }
        ];
        break;
    }

    const multStandard = simStandard === 'ECONOMICO' ? 0.85 : simStandard === 'MEDIO' ? 1.0 : 1.35;
    let totalMaterialCost = materialsList.reduce((acc, m) => acc + m.estimatedPrice, 0) * multStandard;
    
    // Mão de obra estimada em ~45% do custo total
    let laborCost = totalMaterialCost * 0.8;
    let volunteerSavings = 0;

    if (simHasVolunteers) {
      // 60% da mão de obra feita por mutirão voluntário do Centro Espírita
      volunteerSavings = laborCost * 0.65;
      laborCost = laborCost * 0.35;
    }

    const finalEstimatedCost = Math.round(totalMaterialCost + laborCost);
    const estimatedDays = Math.max(3, Math.round(simArea * baseDaysPerUnit));

    return {
      category: simCategory,
      areaSqMeters: simArea,
      standard: simStandard,
      hasVolunteers: simHasVolunteers,
      estimatedCost: finalEstimatedCost,
      estimatedDays,
      estimatedVolunteerSavings: Math.round(volunteerSavings),
      materials: materialsList
    };
  };

  const simulationResult = calculateSimulation();

  // Convert Simulation to Project
  const handleConvertSimulationToProject = () => {
    const categoryLabels: Record<string, string> = {
      PINTURA: 'Pintura e Restauro Doutrinário',
      BANHEIRO_PCD: 'Adequação Banheiro Acessível PCD',
      TELHADO: 'Reforma do Telhado e Calhas',
      ELETRICA_LED: 'Modernização Elétrica e LED',
      SALAO_GERAL: 'Reforma Geral do Salão'
    };

    setNewProjName(`${categoryLabels[simCategory] || 'Obra'} (${simArea}m²)`);
    setNewProjLocation('Sede do Centro Espírita');
    setNewProjPlanned(String(simulationResult.estimatedCost));
    setNewProjVolunteerHours(String(Math.round(simulationResult.estimatedDays * 8)));
    setNewProjNotes(`Simulação gerada automaticamente. Padrão: ${simStandard}, Área: ${simArea}m². Economia estimada com mutirão: R$ ${simulationResult.estimatedVolunteerSavings.toLocaleString('pt-BR')}`);
    
    setIsNewProjectModalOpen(true);
  };

  // 3. Handlers for Projects (Firestore)
  const handleCreateProject = async () => {
    if (!newProjName.trim()) return;

    try {
      const planned = Number(newProjPlanned) || 10000;
      const newProjData: Omit<ConstructionProject, 'id'> = {
        name: newProjName.trim(),
        location: newProjLocation.trim() || 'Sede Geral',
        status: 'EM_ANDAMENTO',
        budgetPlanned: planned,
        budgetActual: 0,
        startDate: new Date().toISOString().split('T')[0],
        estimatedEndDate: newProjEndDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
        percentage: 10,
        coordinator: newProjCoordinator || currentUser?.name || 'Coordenação de Patrimônio',
        volunteerHoursEst: Number(newProjVolunteerHours) || 40,
        notes: newProjNotes,
        stages: [
          { id: 'st_' + Date.now() + '_1', name: 'Cotação de materiais e autorização da diretoria', status: 'CONCLUIDO', duration: '3 dias', responsible: 'Coordenação' },
          { id: 'st_' + Date.now() + '_2', name: 'Compra de insumos e organização de canteiro', status: 'EM_ANDAMENTO', duration: '5 dias', responsible: 'Equipe de Compras' },
          { id: 'st_' + Date.now() + '_3', name: 'Execução de serviços e mutirão voluntário', status: 'PLANEJADO', duration: '15 dias', responsible: 'Mestre e Trabalhadores' },
          { id: 'st_' + Date.now() + '_4', name: 'Vistoria final e limpeza do espaço', status: 'PLANEJADO', duration: '2 dias', responsible: 'Comissão de Limpeza' }
        ]
      };

      await addDoc(collection(db, 'obras_projetos'), newProjData);

      // Reset form
      setNewProjName('');
      setNewProjLocation('');
      setNewProjPlanned('');
      setNewProjNotes('');
      setIsNewProjectModalOpen(false);
    } catch (e) {
      console.error("Error creating project in Firestore:", e);
      alert("Erro ao salvar projeto no banco de dados.");
    }
  };

  const handleUpdateProjectStatus = async (projId: string, nextStatus: 'PLANEJADO' | 'EM_ANDAMENTO' | 'PAUSADO' | 'FINALIZADO' | 'CONCLUIDO') => {
    try {
      const pRef = doc(db, 'obras_projetos', projId);
      await updateDoc(pRef, { status: nextStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!window.confirm("Deseja realmente remover este projeto de obra? Todos os dados associados serão apagados.")) return;
    try {
      await deleteDoc(doc(db, 'obras_projetos', projId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStageStatus = async (projId: string, stageIndex: number) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    const nextStages = proj.stages.map((st, idx) => {
      if (idx === stageIndex) {
        const nextStatus: 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' =
          st.status === 'PLANEJADO' ? 'EM_ANDAMENTO' : st.status === 'EM_ANDAMENTO' ? 'CONCLUIDO' : 'PLANEJADO';
        return { ...st, status: nextStatus };
      }
      return st;
    });

    const doneCount = nextStages.filter(s => s.status === 'CONCLUIDO').length;
    const calcPercent = nextStages.length > 0 ? Math.round((doneCount / nextStages.length) * 100) : proj.percentage;

    try {
      const pRef = doc(db, 'obras_projetos', projId);
      await updateDoc(pRef, {
        stages: nextStages,
        percentage: calcPercent,
        status: calcPercent === 100 ? 'CONCLUIDO' : proj.status
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStage = async () => {
    if (!targetProjectForStage || !stageName.trim()) return;

    const newStage = {
      id: 'st_' + Date.now(),
      name: stageName.trim(),
      status: 'PLANEJADO' as const,
      duration: stageDuration.trim() || '3 dias',
      responsible: stageResponsible.trim() || 'Equipe Técnica'
    };

    const updatedStages = [...targetProjectForStage.stages, newStage];
    const doneCount = updatedStages.filter(s => s.status === 'CONCLUIDO').length;
    const calcPercent = Math.round((doneCount / updatedStages.length) * 100);

    try {
      const pRef = doc(db, 'obras_projetos', targetProjectForStage.id);
      await updateDoc(pRef, {
        stages: updatedStages,
        percentage: calcPercent
      });

      setStageName('');
      setStageDuration('');
      setStageResponsible('');
      setIsAddStageModalOpen(false);
      setTargetProjectForStage(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Handlers for Expenses (Firestore)
  const handleAddExpense = async () => {
    if (!expenseProjId || !expenseDesc.trim() || !expenseAmount) {
      alert("Por favor, selecione a obra, preencha a descrição e o valor.");
      return;
    }

    const val = Number(expenseAmount);
    if (isNaN(val) || val <= 0) {
      alert("Insira um valor numérico válido.");
      return;
    }

    try {
      const newExp: Omit<ObraExpense, 'id'> = {
        projectId: expenseProjId,
        description: expenseDesc.trim(),
        category: expenseCategory,
        supplier: expenseSupplier.trim() || 'Fornecedor Local',
        amount: val,
        date: expenseDate,
        registeredBy: currentUser?.name || 'Gestão de Obras',
        receiptRef: expenseReceiptRef.trim() || undefined
      };

      await addDoc(collection(db, 'obras_despesas'), newExp);

      // Recalculate project total budgetActual
      const proj = projects.find(p => p.id === expenseProjId);
      if (proj) {
        const currentTotal = proj.budgetActual || 0;
        const newTotal = currentTotal + val;
        await updateDoc(doc(db, 'obras_projetos', expenseProjId), {
          budgetActual: newTotal
        });
      }

      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseSupplier('');
      setExpenseReceiptRef('');
      setIsNewExpenseModalOpen(false);
    } catch (e) {
      console.error("Error adding expense:", e);
      alert("Erro ao registrar fatura.");
    }
  };

  const handleDeleteExpense = async (exp: ObraExpense) => {
    if (!window.confirm("Deseja apagar este lançamento financeiro?")) return;
    try {
      await deleteDoc(doc(db, 'obras_despesas', exp.id));

      // Subtract from project budgetActual
      const proj = projects.find(p => p.id === exp.projectId);
      if (proj) {
        const newTotal = Math.max(0, (proj.budgetActual || 0) - exp.amount);
        await updateDoc(doc(db, 'obras_projetos', exp.projectId), {
          budgetActual: newTotal
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Computed metrics across all projects
  const totalPlanned = projects.reduce((acc, p) => acc + (p.budgetPlanned || 0), 0);
  const totalActual = projects.reduce((acc, p) => acc + (p.budgetActual || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'EM_ANDAMENTO').length;
  const totalVolunteerHours = projects.reduce((acc, p) => acc + (p.volunteerHoursEst || 0), 0);

  // Filtered expenses list
  const filteredExpenses = selectedProjectId === 'ALL'
    ? expenses
    : expenses.filter(e => e.projectId === selectedProjectId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-indigo-950 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-[11px] font-bold uppercase tracking-wider">
              <HardHat size={14} className="text-purple-400" />
              <span>Gestão Patrimonial & Obras Fraternas</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tight">Gestão de Obras, Reformas & Manutenção Predial</h1>
            <p className="text-purple-200 text-sm max-w-2xl leading-relaxed">
              Planejamento, estimativa de custos por m², controle de notas fiscais, mutirão de trabalhadores voluntários e manutenção da estrutura do Centro Espírita.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('SIMULADOR');
              }}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer"
            >
              <Calculator size={16} />
              <span>Planejar Orçamento</span>
            </button>

            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-5 py-3 bg-white text-gray-950 hover:bg-gray-100 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus size={16} />
              <span>Lançar Projeto</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Projetos Ativos</span>
            <p className="text-2xl font-black mt-1 text-white">{activeProjectsCount} <span className="text-xs font-normal text-purple-300">/ {projects.length} totais</span></p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Orçamento Planejado</span>
            <p className="text-2xl font-black mt-1 text-white">R$ {totalPlanned.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Investido / Executado</span>
            <p className={`text-2xl font-black mt-1 ${totalActual > totalPlanned ? 'text-rose-400' : 'text-emerald-400'}`}>
              R$ {totalActual.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Mutirão Voluntário</span>
            <p className="text-2xl font-black mt-1 text-amber-300">{totalVolunteerHours} hrs <span className="text-xs font-normal text-purple-300">est.</span></p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('PROJETOS')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PROJETOS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Building size={16} />
          <span>Projetos & Acompanhamento ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SIMULADOR')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SIMULADOR'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Calculator size={16} />
          <span>Orçamento Paramétrico por m²</span>
        </button>

        <button
          onClick={() => setActiveTab('EXTRATO')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'EXTRATO'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Receipt size={16} />
          <span>Extrato Financeiro & Faturas ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MUTIRAO')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'MUTIRAO'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          <span>Mutirão de Voluntários</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
          <HardHat size={32} className="mx-auto text-purple-500 animate-bounce mb-3" />
          <p className="font-bold text-xs uppercase tracking-widest">Carregando dados das Obras e Reformas...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: PROJETOS & ACOMPANHAMENTO */}
          {activeTab === 'PROJETOS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic">Obras e Reformas Registradas</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Etapas, orçamentos e prazos de execução</p>
                </div>

                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-100"
                >
                  <Plus size={15} />
                  <span>Nova Obra</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 space-y-4">
                  <Building size={40} className="mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-gray-500">Nenhuma obra ou reforma cadastrada no momento.</p>
                  <button
                    onClick={() => setActiveTab('SIMULADOR')}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-700"
                  >
                    Usar Orçamento Paramétrico
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {projects.map((proj) => {
                    const isOverBudget = proj.budgetActual > proj.budgetPlanned;
                    const percentBudgetUsed = proj.budgetPlanned > 0 ? Math.round((proj.budgetActual / proj.budgetPlanned) * 100) : 0;

                    return (
                      <div
                        key={proj.id}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 relative group"
                      >
                        {/* Top Info */}
                        <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                proj.status === 'EM_ANDAMENTO'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : proj.status === 'CONCLUIDO' || proj.status === 'FINALIZADO'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : proj.status === 'PAUSADO'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {proj.status.replace('_', ' ')}
                              </span>

                              {isOverBudget && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10} />
                                  Orçamento Excedido
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{proj.name}</h3>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <Building size={12} className="text-gray-400" />
                              <span>{proj.location}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setTargetProjectForStage(proj);
                                setIsAddStageModalOpen(true);
                              }}
                              title="Adicionar Etapa"
                              className="p-2 hover:bg-purple-50 text-purple-600 rounded-xl transition-colors cursor-pointer"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              title="Excluir Obra"
                              className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Financial Bar */}
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-500 uppercase tracking-wider text-[10px]">Executado / Planejado</span>
                            <span className={isOverBudget ? 'text-rose-600 font-black' : 'text-gray-900'}>
                              R$ {proj.budgetActual.toLocaleString('pt-BR')} / R$ {proj.budgetPlanned.toLocaleString('pt-BR')} ({percentBudgetUsed}%)
                            </span>
                          </div>

                          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isOverBudget ? 'bg-rose-500' : percentBudgetUsed > 80 ? 'bg-amber-500' : 'bg-purple-600'
                              }`}
                              style={{ width: `${Math.min(100, percentBudgetUsed)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span>Coordenador: <strong>{proj.coordinator}</strong></span>
                            <span>Entrega est.: <strong>{proj.estimatedEndDate}</strong></span>
                          </div>
                        </div>

                        {/* Stages list */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                            <span className="uppercase text-[10px] text-gray-400 tracking-wider">Etapas ({proj.stages?.length || 0}) — Conclusão: {proj.percentage}%</span>
                            <span className="text-purple-600">{proj.stages?.filter(s => s.status === 'CONCLUIDO').length || 0} de {proj.stages?.length || 0} concluídas</span>
                          </div>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {proj.stages && proj.stages.map((st, idx) => (
                              <div
                                key={st.id || idx}
                                onClick={() => handleToggleStageStatus(proj.id, idx)}
                                className="p-2.5 bg-white border border-gray-100 hover:border-purple-200 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all hover:bg-purple-50/40"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  {st.status === 'CONCLUIDO' ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                  ) : st.status === 'EM_ANDAMENTO' ? (
                                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                                  )}
                                  <span className={`font-semibold truncate ${st.status === 'CONCLUIDO' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {st.name}
                                  </span>
                                </div>

                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 ml-2 shrink-0">
                                  <span>{st.duration}</span>
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">@{st.responsible?.split(' ')[0]}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                          <button
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setExpenseProjId(proj.id);
                              setIsNewExpenseModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt size={13} />
                            <span>Lançar Fatura</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateProjectStatus(proj.id, proj.status === 'EM_ANDAMENTO' ? 'PAUSADO' : 'EM_ANDAMENTO')}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              {proj.status === 'EM_ANDAMENTO' ? 'Pausar' : 'Reativar'}
                            </button>

                            {proj.status !== 'CONCLUIDO' && (
                              <button
                                onClick={() => handleUpdateProjectStatus(proj.id, 'CONCLUIDO')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                              >
                                Concluir Obra
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIMULADOR PARAMÉTRICO */}
          {activeTab === 'SIMULADOR' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Controls */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic flex items-center gap-2">
                    <Calculator className="text-purple-600" size={22} />
                    Cálculo Paramétrico de Custos & Insumos
                  </h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Estimativa de Obra por m² para Casa Espírita</p>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Tipo / Categoria da Reforma</label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PINTURA">🎨 Pintura e Restauro de Parede/Fachada</option>
                    <option value="BANHEIRO_PCD">♿ Adequação de Banheiro Acessível PCD</option>
                    <option value="TELHADO">🛖 Reforma de Telhado, Manta e Calhas</option>
                    <option value="ELETRICA_LED">💡 Modernização Elétrica e Iluminação LED</option>
                    <option value="SALAO_GERAL">🏗️ Reforma Geral do Salão / Cozinha Fraterna</option>
                    <option value="OUTRO">🛠️ Reparo ou Manutenção Específica</option>
                  </select>
                </div>

                {/* Area Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Área / Metragem Estimada (m²)</label>
                    <span className="text-sm font-black text-purple-600">{simArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={simArea}
                    onChange={(e) => setSimArea(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>10 m² (Sala)</span>
                    <span>150 m² (Salão)</span>
                    <span>500 m² (Prédio)</span>
                  </div>
                </div>

                {/* Quality Standard */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Padrão de Insumos & Acabamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ECONOMICO', label: 'Econômico' },
                      { id: 'MEDIO', label: 'Médio / Padrão' },
                      { id: 'ALTA_DURABILIDADE', label: 'Alta Durabilidade' }
                    ].map((std) => (
                      <button
                        key={std.id}
                        type="button"
                        onClick={() => setSimStandard(std.id as any)}
                        className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          simStandard === std.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {std.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volunteer Workforce Toggle */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-amber-700" />
                      <div>
                        <p className="text-xs font-black text-amber-900 uppercase">Mutirão Voluntário Espírita</p>
                        <p className="text-[10px] text-amber-700 font-medium">Contar com força de trabalho comunitária aos finais de semana</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simHasVolunteers}
                      onChange={(e) => setSimHasVolunteers(e.target.checked)}
                      className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 italic">Resultado do Cálculo da Previsão</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Valores estimados com base no mercado atual</p>
                  </div>

                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-black uppercase">
                    Área: {simArea} m²
                  </span>
                </div>

                {/* Main Estimated Output Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-4 rounded-2xl text-white space-y-1">
                    <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider">Custo Total Previsto</span>
                    <p className="text-2xl font-black">R$ {simulationResult.estimatedCost.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-purple-200 italic">~R$ {Math.round(simulationResult.estimatedCost / simArea)} / m²</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Tempo Est. Execução</span>
                    <p className="text-2xl font-black text-gray-900">{simulationResult.estimatedDays} <span className="text-xs font-semibold text-gray-500">dias</span></p>
                    <p className="text-[10px] text-gray-400 italic">~{Math.ceil(simulationResult.estimatedDays / 7)} semana(s)</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-900 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Economia c/ Mutirão</span>
                    <p className="text-2xl font-black text-emerald-600">R$ {simulationResult.estimatedVolunteerSavings.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-emerald-700 italic">Força fraterna voluntária</p>
                  </div>
                </div>

                {/* Detailed Materials List Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <Layers size={14} className="text-purple-600" />
                    Lista Sugerida de Materiais & Insumos
                  </h4>

                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden text-xs">
                    {simulationResult.materials.map((mat, idx) => (
                      <div key={idx} className="p-3 bg-white hover:bg-gray-50/50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{mat.item}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Quantidade: {mat.quantity}</p>
                        </div>
                        <span className="font-black text-gray-900">R$ {Math.round(mat.estimatedPrice).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button: Transform into Project */}
                <div className="pt-2">
                  <button
                    onClick={handleConvertSimulationToProject}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Converter Orçamento em Projeto de Obra Executiva</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXTRATO FINANCEIRO & FATURAS */}
          {activeTab === 'EXTRATO' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic">Extrato de Faturas e Despesas das Obras</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Histórico auditável de pagamentos, materiais e notas fiscais</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Filter by project */}
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                  >
                    <option value="ALL">Todas as Obras ({expenses.length} faturas)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsNewExpenseModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-100 shrink-0"
                  >
                    <Plus size={15} />
                    <span>Lançar Fatura</span>
                  </button>
                </div>
              </div>

              {/* Table of Expenses */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {filteredExpenses.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 space-y-3">
                    <Receipt size={36} className="mx-auto text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">Nenhum lançamento financeiro registrado nesta seleção.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                          <th className="p-4">Data</th>
                          <th className="p-4">Obra</th>
                          <th className="p-4">Descrição do Gasto</th>
                          <th className="p-4">Categoria</th>
                          <th className="p-4">Fornecedor</th>
                          <th className="p-4 text-right">Valor (R$)</th>
                          <th className="p-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-medium">
                        {filteredExpenses.map((exp) => {
                          const proj = projects.find(p => p.id === exp.projectId);

                          return (
                            <tr key={exp.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="p-4 font-bold text-gray-600">{exp.date}</td>
                              <td className="p-4 font-bold text-gray-900 max-w-xs truncate">{proj?.name || 'Obra Removida'}</td>
                              <td className="p-4 text-gray-800 font-semibold">{exp.description}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-black uppercase">
                                  {exp.category.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-4 text-gray-600 italic">{exp.supplier || 'N/I'}</td>
                              <td className="p-4 text-right font-black text-gray-900 text-sm">
                                R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(exp)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                  title="Apagar Fatura"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MUTIRÃO DE VOLUNTÁRIOS */}
          {activeTab === 'MUTIRAO' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 italic flex items-center gap-2">
                  <Users className="text-purple-600" size={24} />
                  Escala de Mutirão Fraterno Espírita
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Organização dos Trabalhadores Voluntários de Manutenção</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">Horas Estimadas de Mutirão</span>
                  <p className="text-3xl font-black text-purple-900">{totalVolunteerHours} hrs</p>
                  <p className="text-xs text-purple-700 font-medium">Equivalente a cerca de {Math.round(totalVolunteerHours / 8)} dias úteis de trabalho</p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Economia Direta no Orçamento</span>
                  <p className="text-3xl font-black text-emerald-900">R$ {(totalVolunteerHours * 35).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-emerald-700 font-medium">Base de R$ 35/h praticada no mercado de construção</p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Próximo Encontro de Trabalho</span>
                  <p className="text-xl font-black text-amber-900">Sábado, às 08:00</p>
                  <p className="text-xs text-amber-700 font-medium">Salão Principal (Pintura & Organização)</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-2">
                <p className="font-bold text-gray-900 flex items-center gap-2">
                  <Info size={16} className="text-purple-600" />
                  Como funciona o Mutirão de Obras no Centro Espírita?
                </p>
                <p className="leading-relaxed">
                  Os mutirões fraternos reúnem freqüentadores e trabalhadores qualificados (pintores, eletricistas, pedreiros, serventes) para executar melhorias na infraestrutura da Casa Espírita. Essa ação fortalece a união fraterna, reduz custos operacionais e mantém o ambiente limpo e acolhedor para as atividades doutrinárias.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: NEW PROJECT */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900 italic">Cadastrar Nova Obra ou Reforma</h3>
                <button
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Nome do Projeto de Obra *</label>
                  <input
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Ex: Pintura do Salão Principal e Reparo do Telhado"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Localização na Casa</label>
                  <input
                    value={newProjLocation}
                    onChange={(e) => setNewProjLocation(e.target.value)}
                    placeholder="Ex: Anexo de Atendimentos / Salão de Palestras"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Orçamento Planejado (R$) *</label>
                    <input
                      type="number"
                      value={newProjPlanned}
                      onChange={(e) => setNewProjPlanned(e.target.value)}
                      placeholder="12000"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Previsão de Entrega</label>
                    <input
                      type="date"
                      value={newProjEndDate}
                      onChange={(e) => setNewProjEndDate(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Coordenador Responsável</label>
                  <input
                    value={newProjCoordinator}
                    onChange={(e) => setNewProjCoordinator(e.target.value)}
                    placeholder="Nome do coordenador de patrimônio"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Observações / Detalhes</label>
                  <textarea
                    rows={2}
                    value={newProjNotes}
                    onChange={(e) => setNewProjNotes(e.target.value)}
                    placeholder="Especificações dos insumos, fornecedores sugeridos, etc."
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 cursor-pointer"
                >
                  Salvar Projeto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW EXPENSE */}
      <AnimatePresence>
        {isNewExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900 italic">Lançar Fatura / Nota de Obra</h3>
                <button
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Selecione a Obra *</label>
                  <select
                    value={expenseProjId}
                    onChange={(e) => setExpenseProjId(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:outline-none"
                  >
                    <option value="">-- Selecione uma Obra --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Descrição da Despesa / Insumo *</label>
                  <input
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="Ex: 10 latas de Tinta Suvinil + Rolos de Pintura"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Categoria *</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:outline-none"
                    >
                      <option value="MATERIAL">Material de Construção</option>
                      <option value="MAO_DE_OBRA">Mão de Obra Especializada</option>
                      <option value="LOCACAO">Locação de Equipamento</option>
                      <option value="LICENCAS">Taxas e Licenças</option>
                      <option value="OUTROS">Outros Gastos</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Valor Total (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="850.00"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Fornecedor / Loja</label>
                    <input
                      value={expenseSupplier}
                      onChange={(e) => setExpenseSupplier(e.target.value)}
                      placeholder="Ex: Depósito Santo Antônio"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Data do Pagamento</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Nº Comprovante / Recibo</label>
                  <input
                    value={expenseReceiptRef}
                    onChange={(e) => setExpenseReceiptRef(e.target.value)}
                    placeholder="Ex: NF-e 0019283"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddExpense}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 cursor-pointer"
                >
                  Registrar Fatura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD STAGE */}
      <AnimatePresence>
        {isAddStageModalOpen && targetProjectForStage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900 italic">Adicionar Etapa em "{targetProjectForStage.name}"</h3>
                <button
                  onClick={() => setIsAddStageModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Nome da Etapa *</label>
                  <input
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="Ex: Pintura da parede frontal e retoques"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Duração Estimada</label>
                    <input
                      value={stageDuration}
                      onChange={(e) => setStageDuration(e.target.value)}
                      placeholder="Ex: 5 dias"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Responsável</label>
                    <input
                      value={stageResponsible}
                      onChange={(e) => setStageResponsible(e.target.value)}
                      placeholder="Ex: Mestre de Obras"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddStageModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddStage}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
