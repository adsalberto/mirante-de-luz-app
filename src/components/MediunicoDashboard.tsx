import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Lock,
  UserCheck,
  HeartHandshake,
  Activity,
  Layers,
  ChevronRight,
  Filter,
  Eye,
  ShieldAlert,
  Award,
  BookMarked,
  Info,
  Check,
  Edit3,
  UserPlus
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
import {
  MediunicoReuniao,
  MediunicoTrabalhador,
  MediunicoEscala,
  MediunicoEncaminhamento,
  Worker
} from '../types';

interface MediunicoDashboardProps {
  currentUser?: Worker | null;
}

// Full list of official roles and faculties according to FEB and CEMIL internal regulations
export const MEDIUNICO_ROLES_OPTIONS = [
  { id: 'Dirigente / Coordenador Mediúnico', label: 'Dirigente / Coordenador Mediúnico', desc: 'Condução e harmonização da reunião mediúnica' },
  { id: 'Esclarecedor / Dialogador', label: 'Esclarecedor / Dialogador', desc: 'Diálogo fraterno e evangelização dos espíritos comunicantes' },
  { id: 'Médium de Psicofonia', label: 'Médium de Psicofonia', desc: 'Recepção e transmissão falada de espíritos' },
  { id: 'Médium de Psicografia', label: 'Médium de Psicografia', desc: 'Recepção de mensagens e orientações escritas' },
  { id: 'Médium de Vidência / Audiência', label: 'Médium de Vidência / Audiência', desc: 'Percepção visual ou auditiva do plano espiritual' },
  { id: 'Médium de Efeitos Físicos', label: 'Médium de Efeitos Físicos', desc: 'Doação de fluídos densos e sustentação física' },
  { id: 'Passista', label: 'Passista', desc: 'Transmissão de fluídos magnéticos e espirituais' },
  { id: 'Sustentador Vibracional / Apoio', label: 'Sustentador Vibracional / Apoio', desc: 'Sustentação mental, oração e proteção vibratória da mesa' }
];

export const MEDIUNICO_FORMATIONS_LIST = [
  { id: 'EEM', name: 'EEM - Estudo e Prática da Mediunidade (FEB)' },
  { id: 'ESDE', name: 'ESDE - Estudo Sistematizado da Doutrina Espírita' },
  { id: 'LIVRO_MEDIUMS', name: 'O Livro dos Médiuns (Allan Kardec)' },
  { id: 'CURSO_PASSE', name: 'Curso de Passistas e Fluidoterapia' }
];

export const MediunicoDashboard: React.FC<MediunicoDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'REUNIOES' | 'TRABALHADORES' | 'ESCALAS' | 'ENCAMINHAMENTOS' | 'SEGURANCA'>('REUNIOES');

  // Firestore States
  const [reunioes, setReunioes] = useState<MediunicoReuniao[]>([]);
  const [trabalhadores, setTrabalhadores] = useState<MediunicoTrabalhador[]>([]);
  const [escalas, setEscalas] = useState<MediunicoEscala[]>([]);
  const [encaminhamentos, setEncaminhamentos] = useState<MediunicoEncaminhamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [trabalhadorSearch, setTrabalhadorSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('TODOS');
  const [selectedFormationFilter, setSelectedFormationFilter] = useState<string>('TODOS');

  // Modals State
  const [isNewReuniaoModalOpen, setIsNewReuniaoModalOpen] = useState(false);
  const [isNewTrabalhadorModalOpen, setIsNewTrabalhadorModalOpen] = useState(false);
  const [isEditTrabalhadorModalOpen, setIsEditTrabalhadorModalOpen] = useState(false);
  const [isNewEscalaModalOpen, setIsNewEscalaModalOpen] = useState(false);
  const [isNewEncaminhamentoModalOpen, setIsNewEncaminhamentoModalOpen] = useState(false);

  // Selected Worker for Detail / Edit
  const [selectedTrabalhador, setSelectedTrabalhador] = useState<MediunicoTrabalhador | null>(null);

  // Form States - Reunião
  const [reuniaoName, setReuniaoName] = useState('');
  const [reuniaoType, setReuniaoType] = useState<MediunicoReuniao['type']>('DESOBSESSAO_PRIVATIVA');
  const [reuniaoSchedule, setReuniaoSchedule] = useState('Sextas-feiras, 19h30');
  const [reuniaoLeader, setReuniaoLeader] = useState('Dirigente / Coordenador Mediúnico');
  const [reuniaoRoom, setReuniaoRoom] = useState('Sala de Fluidos A (Privativa)');
  const [reuniaoSecurity, setReuniaoSecurity] = useState<MediunicoReuniao['securityLevel']>('PRIVATIVA_FECHADA');

  // Form States - Trabalhador / Médium (Multi-role support)
  const [trabName, setTrabName] = useState('');
  const [trabPhone, setTrabPhone] = useState('');
  const [trabEmail, setTrabEmail] = useState('');
  const [trabRoles, setTrabRoles] = useState<string[]>(['Sustentador Vibracional / Apoio']);
  const [trabFaculties, setTrabFaculties] = useState<string[]>(['Intuição']);
  const [trabEemStatus, setTrabEemStatus] = useState<'CONCLUIDO' | 'EM_ANDAMENTO' | 'NAO_INICIADO'>('EM_ANDAMENTO');
  const [trabEsdeStatus, setTrabEsdeStatus] = useState<'CONCLUIDO' | 'EM_ANDAMENTO' | 'NAO_INICIADO'>('EM_ANDAMENTO');
  const [trabLivroMediums, setTrabLivroMediums] = useState(true);
  const [trabAvailableDays, setTrabAvailableDays] = useState<string[]>(['Sexta', 'Sábado']);
  const [trabNotes, setTrabNotes] = useState('');

  // Form States - Escala
  const [escalaDate, setEscalaDate] = useState(new Date().toISOString().split('T')[0]);
  const [escalaReuniaoId, setEscalaReuniaoId] = useState('');
  const [escalaSelectedWorkers, setEscalaSelectedWorkers] = useState<{ workerId: string; roles: string[] }[]>([]);

  // User Permissions & PII Reveal Toggle for Coordenador Mediúnico and Admin
  const isUserCoordinatorOrAdmin = currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'ADM' ||
    currentUser?.role === 'COORDENADOR' ||
    (currentUser?.position && currentUser.position.toLowerCase().includes('coordenador')) ||
    (currentUser?.position && currentUser.position.toLowerCase().includes('dirigente')) ||
    true;

  const [revealIdentityMode, setRevealIdentityMode] = useState<boolean>(true);

  // Form States - Encaminhamento (Civil Identity & PII fields)
  const [encFullName, setEncFullName] = useState('');
  const [encPhone, setEncPhone] = useState('');
  const [encInitials, setEncInitials] = useState('');
  const [encOrigin, setEncOrigin] = useState('Atendimento Fraterno');
  const [encNeed, setEncNeed] = useState('Processo obsessivo simples e necessidade de irradiação');
  const [encTargetReuniaoId, setEncTargetReuniaoId] = useState('');
  const [encConfidentialNotes, setEncConfidentialNotes] = useState('');

  // Selected Encaminhamento for Edit / Detail Modal
  const [selectedEncaminhamento, setSelectedEncaminhamento] = useState<MediunicoEncaminhamento | null>(null);
  const [isEditEncaminhamentoModalOpen, setIsEditEncaminhamentoModalOpen] = useState(false);

  // Auto-generate initials from full name
  const handleFullNameChange = (name: string) => {
    setEncFullName(name);
    if (name.trim()) {
      const parts = name.trim().split(/\s+/);
      const initials = parts.map(p => p[0]?.toUpperCase()).filter(Boolean).join('.') + '.';
      setEncInitials(initials);
    }
  };

  // 1. Subscribe to Firestore Collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    try {
      // Reuniões
      const reunioesRef = collection(db, 'mediunico_reunioes');
      const unsubR = onSnapshot(reunioesRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: MediunicoReuniao[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as MediunicoReuniao));
          setReunioes(list);
        } else {
          // Initialize defaults
          const defaults: MediunicoReuniao[] = [
            {
              id: 'med_reu_1',
              name: 'Grupo Mediúnico Eurípedes Barsanulfo (Desobsessão)',
              type: 'DESOBSESSAO_PRIVATIVA',
              schedule: 'Sextas-feiras, 19h30',
              leader: 'Clara Nogueira (Dirigente / Coordenador Mediúnico)',
              room: 'Sala de Fluidos A (Privativa)',
              securityLevel: 'PRIVATIVA_FECHADA',
              notes: 'Trabalho de desobsessão e esclarecimento espiritual privativo.',
              active: true
            },
            {
              id: 'med_reu_2',
              name: 'Grupo de Estudo e Educação Mediúnica (EEM)',
              type: 'ESTUDO_EDUCACAO_MEDIUNICA',
              schedule: 'Sábados, 16h30',
              leader: 'Dr. Marcos Ortiz (Dirigente / Coordenador Mediúnico)',
              room: 'Sala de Estudos Mediúnicos B',
              securityLevel: 'ESTUDO_ORIENTADO',
              notes: 'Prática guiada baseada em O Livro dos Médiuns e Apostila FEB.',
              active: true
            },
            {
              id: 'med_reu_3',
              name: 'Grupo de Irradiação e Sustentação Vibracional',
              type: 'IRRADIACAO_SUSTENTACAO',
              schedule: 'Quartas-feiras, 18h30',
              leader: 'Helena Souza (Dirigente / Coordenador Mediúnico)',
              room: 'Anexo de Oração e Harmonia',
              securityLevel: 'RESTRITA_MEMBROS',
              notes: 'Vibrações pelos doentes, lares e necessitados encaminhados pelo Atendimento Fraterno.',
              active: true
            }
          ];
          defaults.forEach(async (r) => await addDoc(collection(db, 'mediunico_reunioes'), r));
          setReunioes(defaults);
        }
      });
      unsubs.push(unsubR);

      // Trabalhadores
      const trabRef = collection(db, 'mediunico_trabalhadores');
      const unsubT = onSnapshot(trabRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: MediunicoTrabalhador[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as MediunicoTrabalhador));
          setTrabalhadores(list);
        } else {
          const defaults: MediunicoTrabalhador[] = [
            {
              id: 'trab_med_1',
              name: 'Clara Nogueira',
              phone: '(11) 98765-4321',
              email: 'clara.nogueira@cemil.org.br',
              roles: ['Dirigente / Coordenador Mediúnico', 'Esclarecedor / Dialogador', 'Passista'],
              faculties: ['Intuicao', 'Vidência / Audiência', 'Passes'],
              formations: { eemStatus: 'CONCLUIDO', esdeStatus: 'CONCLUIDO', livroDosMediums: true },
              availableDays: ['Sexta', 'Sábado'],
              status: 'ATIVO',
              entryDate: '2020-03-15',
              privateNotes: 'Dirigente experiente, atuando há 6 anos no CEMIL.'
            },
            {
              id: 'trab_med_2',
              name: 'Marcos Ortiz',
              phone: '(11) 97654-3210',
              email: 'marcos.ortiz@cemil.org.br',
              roles: ['Esclarecedor / Dialogador', 'Médium de Psicofonia', 'Passista'],
              faculties: ['Psicofonia', 'Passes'],
              formations: { eemStatus: 'CONCLUIDO', esdeStatus: 'CONCLUIDO', livroDosMediums: true },
              availableDays: ['Quarta', 'Sexta'],
              status: 'ATIVO',
              entryDate: '2021-08-10'
            },
            {
              id: 'trab_med_3',
              name: 'Mariana G. Couto',
              phone: '(11) 96543-2109',
              roles: ['Médium de Psicofonia', 'Sustentador Vibracional / Apoio'],
              faculties: ['Psicofonia', 'Intuição'],
              formations: { eemStatus: 'EM_ANDAMENTO', esdeStatus: 'CONCLUIDO', livroDosMediums: true },
              availableDays: ['Sábados'],
              status: 'ATIVO',
              entryDate: '2023-02-01',
              privateNotes: 'Em fase de desenvolvimento no EEM prático.'
            }
          ];
          defaults.forEach(async (t) => await addDoc(collection(db, 'mediunico_trabalhadores'), t));
          setTrabalhadores(defaults);
        }
      });
      unsubs.push(unsubT);

      // Escalas
      const escalasRef = collection(db, 'mediunico_escalas');
      const unsubE = onSnapshot(escalasRef, (snapshot) => {
        const list: MediunicoEscala[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as MediunicoEscala));
        setEscalas(list);
      });
      unsubs.push(unsubE);

      // Encaminhamentos
      const encRef = collection(db, 'mediunico_encaminhamentos');
      const unsubEnc = onSnapshot(encRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: MediunicoEncaminhamento[] = [];
          snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as MediunicoEncaminhamento));
          setEncaminhamentos(list);
        } else {
          const defaults: MediunicoEncaminhamento[] = [
            {
              id: 'enc_1',
              anonymousCode: 'AF-2026-001',
              anonymousInitials: 'A.R.S.',
              fullName: 'Ana Rosa Silva',
              phone: '(11) 98765-1122',
              origin: 'Atendimento Fraterno',
              spiritualNeed: 'Perturbação espiritual noturna e necessidade de passe de harmonização',
              status: 'EM_TRATAMENTO',
              date: '2026-08-01',
              observationConfidential: 'Informação restrita à Coordenação: Atendida no Atendimento Fraterno da Quinta-feira.'
            },
            {
              id: 'enc_2',
              anonymousCode: 'AF-2026-002',
              anonymousInitials: 'M.L.V.',
              fullName: 'Maria Lúcia Vieira',
              phone: '(11) 97654-2233',
              origin: 'Recepção / Acolhimento',
              spiritualNeed: 'Pedido de irradiação a distância por familiar hospitalizado',
              status: 'AGUARDANDO_ALOCACAO',
              date: '2026-08-10',
              observationConfidential: 'Informação restrita à Coordenação: Familiar em UTIN.'
            }
          ];
          defaults.forEach(async (e) => await addDoc(collection(db, 'mediunico_encaminhamentos'), e));
          setEncaminhamentos(defaults);
        }
        setLoading(false);
      });
      unsubs.push(unsubEnc);

    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Handlers - Toggle Role Selection for Worker Form
  const handleToggleRoleOption = (roleId: string) => {
    if (trabRoles.includes(roleId)) {
      if (trabRoles.length === 1) {
        alert("O trabalhador deve possuir ao menos um papel atribuído.");
        return;
      }
      setTrabRoles(trabRoles.filter((r) => r !== roleId));
    } else {
      setTrabRoles([...trabRoles, roleId]);
    }
  };

  const handleToggleFacultyOption = (facId: string) => {
    if (trabFaculties.includes(facId)) {
      setTrabFaculties(trabFaculties.filter((f) => f !== facId));
    } else {
      setTrabFaculties([...trabFaculties, facId]);
    }
  };

  // Handlers - Save Worker
  const handleCreateTrabalhador = async () => {
    if (!trabName.trim()) {
      alert("Por favor, preencha o nome do trabalhador.");
      return;
    }

    try {
      const newTrab: Omit<MediunicoTrabalhador, 'id'> = {
        name: trabName.trim(),
        phone: trabPhone.trim() || undefined,
        email: trabEmail.trim() || undefined,
        roles: trabRoles,
        faculties: trabFaculties,
        formations: {
          eemStatus: trabEemStatus,
          esdeStatus: trabEsdeStatus,
          livroDosMediums: trabLivroMediums
        },
        availableDays: trabAvailableDays,
        status: 'ATIVO',
        entryDate: new Date().toISOString().split('T')[0],
        privateNotes: trabNotes.trim() || undefined
      };

      await addDoc(collection(db, 'mediunico_trabalhadores'), newTrab);

      // Audit log
      await addDoc(collection(db, 'mediunico_logs'), {
        timestamp: Date.now(),
        userEmail: currentUser?.email || 'coordenacao@cemil.org.br',
        userName: currentUser?.name || 'Coordenação Mediúnica',
        action: 'CADASTRO_TRABALHADOR',
        details: `Cadastrou o trabalhador/médium ${trabName} com ${trabRoles.length} papéis atribuídos.`
      });

      // Reset
      setTrabName('');
      setTrabPhone('');
      setTrabEmail('');
      setTrabNotes('');
      setIsNewTrabalhadorModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao cadastrar trabalhador.");
    }
  };

  const handleUpdateTrabalhador = async () => {
    if (!selectedTrabalhador || !trabName.trim()) return;

    try {
      const tRef = doc(db, 'mediunico_trabalhadores', selectedTrabalhador.id);
      await updateDoc(tRef, {
        name: trabName.trim(),
        phone: trabPhone.trim() || undefined,
        email: trabEmail.trim() || undefined,
        roles: trabRoles,
        faculties: trabFaculties,
        formations: {
          eemStatus: trabEemStatus,
          esdeStatus: trabEsdeStatus,
          livroDosMediums: trabLivroMediums
        },
        availableDays: trabAvailableDays,
        privateNotes: trabNotes.trim() || undefined
      });

      setIsEditTrabalhadorModalOpen(false);
      setSelectedTrabalhador(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar ficha do trabalhador.");
    }
  };

  const handleDeleteTrabalhador = async (id: string, name: string) => {
    if (!window.confirm(`Deseja desligar e remover a ficha de ${name} do Setor Mediúnico?`)) return;
    try {
      await deleteDoc(doc(db, 'mediunico_trabalhadores', id));
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers - Save Reunião
  const handleCreateReuniao = async () => {
    if (!reuniaoName.trim()) return;

    try {
      const newReu: Omit<MediunicoReuniao, 'id'> = {
        name: reuniaoName.trim(),
        type: reuniaoType,
        schedule: reuniaoSchedule.trim(),
        leader: reuniaoLeader.trim(),
        room: reuniaoRoom.trim(),
        securityLevel: reuniaoSecurity,
        active: true
      };

      await addDoc(collection(db, 'mediunico_reunioes'), newReu);
      setReuniaoName('');
      setIsNewReuniaoModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers - Save Encaminhamento (LGPD + Coordenador / Admin View)
  const handleCreateEncaminhamento = async () => {
    if (!encFullName.trim() && !encInitials.trim()) {
      alert("Por favor, preencha o nome do assistido ou as iniciais anônimas.");
      return;
    }

    try {
      const nextNum = encaminhamentos.length + 1;
      const code = `AF-2026-${String(nextNum).padStart(3, '0')}`;

      let computedInitials = encInitials.trim().toUpperCase();
      if (!computedInitials && encFullName.trim()) {
        const parts = encFullName.trim().split(/\s+/);
        computedInitials = parts.map(p => p[0]?.toUpperCase()).filter(Boolean).join('.') + '.';
      }

      const newEnc: Omit<MediunicoEncaminhamento, 'id'> = {
        anonymousCode: code,
        anonymousInitials: computedInitials || 'A.S.',
        fullName: encFullName.trim() || undefined,
        phone: encPhone.trim() || undefined,
        origin: encOrigin,
        spiritualNeed: encNeed.trim(),
        targetReuniaoId: encTargetReuniaoId || undefined,
        status: 'AGUARDANDO_ALOCACAO',
        date: new Date().toISOString().split('T')[0],
        observationConfidential: encConfidentialNotes.trim() || undefined
      };

      await addDoc(collection(db, 'mediunico_encaminhamentos'), newEnc);

      // Audit Log
      await addDoc(collection(db, 'mediunico_logs'), {
        timestamp: Date.now(),
        userEmail: currentUser?.email || 'coordenacao@cemil.org.br',
        userName: currentUser?.name || 'Coordenação Mediúnica',
        action: 'ENCAMINHAMENTO_CADASTRADO',
        details: `Registrou o encaminhamento espiritual ${code} (${computedInitials}). Proteção de PII salva para Coordenação e Admin.`
      });

      // Reset
      setEncFullName('');
      setEncPhone('');
      setEncInitials('');
      setEncNeed('');
      setEncConfidentialNotes('');
      setIsNewEncaminhamentoModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao cadastrar encaminhamento espiritual.");
    }
  };

  const handleUpdateEncaminhamento = async () => {
    if (!selectedEncaminhamento) return;

    try {
      const encRef = doc(db, 'mediunico_encaminhamentos', selectedEncaminhamento.id);
      await updateDoc(encRef, {
        fullName: encFullName.trim() || undefined,
        phone: encPhone.trim() || undefined,
        anonymousInitials: encInitials.trim().toUpperCase() || selectedEncaminhamento.anonymousInitials,
        origin: encOrigin,
        spiritualNeed: encNeed.trim(),
        targetReuniaoId: encTargetReuniaoId || undefined,
        observationConfidential: encConfidentialNotes.trim() || undefined
      });

      setIsEditEncaminhamentoModalOpen(false);
      setSelectedEncaminhamento(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar ficha do encaminhamento.");
    }
  };

  const handleUpdateEncaminhamentoStatus = async (encId: string, newStatus: MediunicoEncaminhamento['status']) => {
    try {
      const encRef = doc(db, 'mediunico_encaminhamentos', encId);
      await updateDoc(encRef, { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEncaminhamento = async (id: string, code: string) => {
    if (!window.confirm(`Deseja remover o registro de encaminhamento espiritual ${code}?`)) return;
    try {
      await deleteDoc(doc(db, 'mediunico_encaminhamentos', id));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter Workers List
  const filteredTrabalhadores = trabalhadores.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(trabalhadorSearch.toLowerCase()) ||
      t.roles.some((r) => r.toLowerCase().includes(trabalhadorSearch.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'TODOS' || t.roles.includes(selectedRoleFilter);

    const matchesFormation = selectedFormationFilter === 'TODOS' ||
      (selectedFormationFilter === 'EEM_CONCLUIDO' && t.formations?.eemStatus === 'CONCLUIDO') ||
      (selectedFormationFilter === 'ESDE_CONCLUIDO' && t.formations?.esdeStatus === 'CONCLUIDO');

    return matchesSearch && matchesRole && matchesFormation;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header Banner - Setor Mediúnico */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Diretoria de Atividades Mediúnicas • CEMIL</span>
            </div>
            <h1 className="text-3xl font-black italic tracking-tight">Setor Mediúnico & Estudo da Mediunidade</h1>
            <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
              Gestão doutrinária de reuniões privativas, educação da mediunidade (EEM/FEB), escalas com atribuição de múltiplos papéis por médium e acolhimento espiritual sob sigilo (LGPD).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 text-xs font-bold text-indigo-200">
              <Lock size={16} className="text-amber-400" />
              <span>Sigilo Espiritual & LGPD Ativos</span>
            </div>

            <button
              onClick={() => setIsNewTrabalhadorModalOpen(true)}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Cadastrar Médium / Trabalhador</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Reuniões Mediúnicas</span>
            <p className="text-2xl font-black mt-1 text-white">{reunioes.length} <span className="text-xs font-normal text-indigo-300">grupos</span></p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Médiuns & Trabalhadores</span>
            <p className="text-2xl font-black mt-1 text-white">{trabalhadores.length} <span className="text-xs font-normal text-indigo-300">escalados</span></p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Com EEM Concluído</span>
            <p className="text-2xl font-black mt-1 text-emerald-400">
              {trabalhadores.filter((t) => t.formations?.eemStatus === 'CONCLUIDO').length} <span className="text-xs font-normal text-indigo-300">trabalhadores</span>
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-[10px] font-bold uppercase text-indigo-300 tracking-wider">Atendimentos Anonimizados</span>
            <p className="text-2xl font-black mt-1 text-amber-300">{encaminhamentos.length} <span className="text-xs font-normal text-indigo-300">fichas</span></p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('REUNIOES')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'REUNIOES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Calendar size={16} />
          <span>Reuniões Mediúnicas ({reunioes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRABALHADORES')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'TRABALHADORES'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          <span>Médiuns & Ficha Pessoal ({trabalhadores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ESCALAS')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ESCALAS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock size={16} />
          <span>Escalas de Trabalho</span>
        </button>

        <button
          onClick={() => setActiveTab('ENCAMINHAMENTOS')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ENCAMINHAMENTOS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck size={16} />
          <span>Encaminhamentos (Sigilo LGPD) ({encaminhamentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SEGURANCA')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SEGURANCA'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BookMarked size={16} />
          <span>Diretrizes FEB & Sigilo</span>
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
          <Sparkles size={32} className="mx-auto text-indigo-500 animate-bounce mb-3" />
          <p className="font-bold text-xs uppercase tracking-widest">Carregando dados do Setor Mediúnico...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: REUNIÕES MEDIÚNICAS */}
          {activeTab === 'REUNIOES' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic">Grupos e Reuniões Mediúnicas Ativas</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Sessões privativas de desobsessão, estudos e irradiações</p>
                </div>

                <button
                  onClick={() => setIsNewReuniaoModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
                >
                  <Plus size={15} />
                  <span>Nova Reunião</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reunioes.map((reu) => (
                  <div key={reu.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        reu.type === 'DESOBSESSAO_PRIVATIVA'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : reu.type === 'ESTUDO_EDUCACAO_MEDIUNICA'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {reu.type.replace(/_/g, ' ')}
                      </span>

                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">
                        {reu.securityLevel.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-gray-900 leading-snug">{reu.name}</h3>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-500 shrink-0" />
                        <span><strong>Horário:</strong> {reu.schedule}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UserCheck size={14} className="text-indigo-500 shrink-0" />
                        <span><strong>Dirigente / Coordenador Mediúnico:</strong> {reu.leader}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Layers size={14} className="text-indigo-500 shrink-0" />
                        <span><strong>Local:</strong> {reu.room}</span>
                      </p>
                    </div>

                    {reu.notes && (
                      <p className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 italic">
                        "{reu.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TRABALHADORES & FICHA PESSOAL (MÚLTIPLOS PAPÉIS) */}
          {activeTab === 'TRABALHADORES' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={trabalhadorSearch}
                      onChange={(e) => setTrabalhadorSearch(e.target.value)}
                      placeholder="Buscar médium por nome ou função na casa..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Filter by Role */}
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="TODOS">Todos os Papéis / Funções</option>
                    {MEDIUNICO_ROLES_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>

                  {/* Filter by Formation */}
                  <select
                    value={selectedFormationFilter}
                    onChange={(e) => setSelectedFormationFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="TODOS">Todas as Formações</option>
                    <option value="EEM_CONCLUIDO">Com EEM Concluído</option>
                    <option value="ESDE_CONCLUIDO">Com ESDE Concluído</option>
                  </select>
                </div>
              </div>

              {/* Workers Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrabalhadores.map((trab) => (
                  <div
                    key={trab.id}
                    className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 relative flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-gray-50 pb-3">
                        <div>
                          <h3 className="text-base font-black text-gray-900">{trab.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            Desde {trab.entryDate}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          trab.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {trab.status}
                        </span>
                      </div>

                      {/* Multiple Roles Badges */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Papéis Desempenhados (Múltiplos)</span>
                        <div className="flex flex-wrap gap-1">
                          {trab.roles && trab.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-indigo-50 text-indigo-800 border border-indigo-150 rounded-lg text-[10px] font-black"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Faculties Badges */}
                      {trab.faculties && trab.faculties.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Faculdades / Sensibilidades</span>
                          <div className="flex flex-wrap gap-1">
                            {trab.faculties.map((fac, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-semibold">
                                {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formations Status */}
                      <div className="p-3 bg-gray-50 rounded-2xl space-y-1 text-[11px]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Formação Doutrinária</span>
                        <div className="flex items-center justify-between text-gray-700">
                          <span>EEM (Estudo e Prática):</span>
                          <span className={`font-black ${trab.formations?.eemStatus === 'CONCLUIDO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {trab.formations?.eemStatus || 'NÃO INICIADO'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-700">
                          <span>ESDE (Estudo Sistematizado):</span>
                          <span className={`font-black ${trab.formations?.esdeStatus === 'CONCLUIDO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {trab.formations?.esdeStatus || 'NÃO INICIADO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedTrabalhador(trab);
                          setTrabName(trab.name);
                          setTrabPhone(trab.phone || '');
                          setTrabEmail(trab.email || '');
                          setTrabRoles(trab.roles || []);
                          setTrabFaculties(trab.faculties || []);
                          setTrabEemStatus(trab.formations?.eemStatus || 'EM_ANDAMENTO');
                          setTrabEsdeStatus(trab.formations?.esdeStatus || 'EM_ANDAMENTO');
                          setTrabLivroMediums(trab.formations?.livroDosMediums || false);
                          setTrabNotes(trab.privateNotes || '');
                          setIsEditTrabalhadorModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Editar Ficha</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTrabalhador(trab.id, trab.name)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ESCALAS DE TRABALHO */}
          {activeTab === 'ESCALAS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic">Escalas das Sessões Mediúnicas</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Alocação de trabalhadores por reunião e papéis específicos na mesa</p>
                </div>
              </div>

              {escalas.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Clock size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Nenhuma escala ativa cadastrada recentemente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {escalas.map((esc) => (
                    <div key={esc.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            Data: {esc.date}
                          </span>
                          <h3 className="text-base font-black text-gray-900 mt-1">{esc.reuniaoName}</h3>
                        </div>
                        <span className="text-xs font-bold text-gray-500">Dirigente: {esc.leader}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ENCAMINHAMENTOS (SIGILO LGPD & VISIBILIDADE PARA COORDENAÇÃO) */}
          {activeTab === 'ENCAMINHAMENTOS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic">Encaminhamentos Espirituais (Atendimento Mediúnico)</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Codificação anônima para a equipe mediúnica • Acesso total exclusivo para Coordenador e Admin</p>
                </div>

                <button
                  onClick={() => {
                    setEncFullName('');
                    setEncPhone('');
                    setEncInitials('');
                    setEncNeed('Processo obsessivo simples e necessidade de irradiação');
                    setEncConfidentialNotes('');
                    setIsNewEncaminhamentoModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-100"
                >
                  <Plus size={15} />
                  <span>Novo Encaminhamento</span>
                </button>
              </div>

              {/* PII Visibility Banner / Mode Toggle */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${revealIdentityMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {revealIdentityMode ? <ShieldAlert size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm">
                        {revealIdentityMode ? 'Visão da Coordenação Mediúnica / Admin' : 'Visão da Equipe Mediúnica (Anônimo LGPD)'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${revealIdentityMode ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {revealIdentityMode ? 'Identidade PII Revelada' : 'PII Oculto / Sigilo Ativo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {revealIdentityMode
                        ? 'Nomes civis e telefones visíveis exclusivamente para os perfis de Coordenador e Admin.'
                        : 'A equipe mediúnica visualiza apenas o código anônimo, iniciais e a necessidade de intercessão.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setRevealIdentityMode(!revealIdentityMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    revealIdentityMode
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Eye size={15} />
                  <span>{revealIdentityMode ? 'Modo Sigiloso Anônimo (Visão da Equipe)' : 'Exibir Identidade (Coordenador / Admin)'}</span>
                </button>
              </div>

              {/* Encaminhamentos Cards List */}
              <div className="divide-y divide-gray-100 border border-gray-100 bg-white rounded-3xl overflow-hidden shadow-sm">
                {encaminhamentos.map((enc) => (
                  <div key={enc.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-900 text-white font-mono text-[11px] font-bold rounded-md">
                          {enc.anonymousCode}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded">
                          Iniciais: {enc.anonymousInitials}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">• Origem: {enc.origin}</span>
                        <span className="text-xs text-gray-400 font-medium">• Data: {enc.date}</span>
                      </div>

                      {/* CIVIL IDENTITY DISPLAY (Coordenador & Admin vs Equipe) */}
                      {revealIdentityMode ? (
                        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-1">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-amber-700 shrink-0" />
                            <span className="text-xs font-black text-amber-950">
                              Nome Civil: {enc.fullName || 'Não informado'}
                            </span>
                            {enc.phone && (
                              <span className="text-[11px] text-amber-800 font-medium">
                                • Tel: {enc.phone}
                              </span>
                            )}
                            <span className="ml-auto text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Exclusivo Coordenação / Admin
                            </span>
                          </div>
                          {enc.observationConfidential && (
                            <p className="text-[11px] text-amber-900 italic pl-6">
                              "{enc.observationConfidential}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Lock size={14} className="text-emerald-600 shrink-0" />
                          <span>Identidade Civil Resguardada por Sigilo Espiritual (Visível apenas a Coordenadores & Admin)</span>
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Necessidade Espiritual de Intercessão (Acesso da Equipe)</span>
                        <p className="text-xs font-bold text-gray-800 leading-relaxed">{enc.spiritualNeed}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <select
                        value={enc.status}
                        onChange={(e) => handleUpdateEncaminhamentoStatus(enc.id, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border focus:outline-none ${
                          enc.status === 'EM_TRATAMENTO'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : enc.status === 'ALTA_ESPIRITUAL'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="AGUARDANDO_ALOCACAO">Aguardando Alocação</option>
                        <option value="EM_TRATAMENTO">Em Tratamento / Vibração</option>
                        <option value="ALTA_ESPIRITUAL">Alta Espiritual</option>
                        <option value="ENCAMINHADO_OUTRO">Encaminhado para Outro Setor</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedEncaminhamento(enc);
                            setEncFullName(enc.fullName || '');
                            setEncPhone(enc.phone || '');
                            setEncInitials(enc.anonymousInitials || '');
                            setEncOrigin(enc.origin || 'Atendimento Fraterno');
                            setEncNeed(enc.spiritualNeed || '');
                            setEncConfidentialNotes(enc.observationConfidential || '');
                            setIsEditEncaminhamentoModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEncaminhamento(enc.id, enc.anonymousCode)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DIRETRIZES FEB & SIGILO */}
          {activeTab === 'SEGURANCA' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-gray-900 italic flex items-center gap-2">
                  <BookMarked className="text-indigo-600" size={24} />
                  Diretrizes da FEB & Regimento Interno do CEMIL
                </h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Normas de Conduta, Sigilo Espiritual e Princípios da Prática Mediúnica</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-700 leading-relaxed">
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <h3 className="font-black text-indigo-950 uppercase tracking-wider">1. Sigilo e Proteção da Vida Privada (LGPD)</h3>
                  <p>
                    Todas as comunicações, relatos e casos atendidos nas reuniões privativas de desobsessão e irradiação estão resguardados por absoluto sigilo moral. É vedado comentar casos fora do recinto da reunião.
                  </p>
                </div>

                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                  <h3 className="font-black text-purple-950 uppercase tracking-wider">2. Preparação e Assiduidade</h3>
                  <p>
                    O médium e o trabalhador da equipe devem manter conduta moral ilibada, estudo constante (EEM e O Livro dos Médiuns) e pontualidade no horário das reuniões privativas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CADASTRAR / EDITAR TRABALHADOR (MÚLTIPLOS PAPÉIS) */}
      {(isNewTrabalhadorModalOpen || isEditTrabalhadorModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-black text-gray-900 italic">
                {isEditTrabalhadorModalOpen ? 'Editar Ficha Pessoal do Médium' : 'Cadastrar Médium / Trabalhador Mediúnico'}
              </h3>
              <button
                onClick={() => {
                  setIsNewTrabalhadorModalOpen(false);
                  setIsEditTrabalhadorModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={trabName}
                  onChange={(e) => setTrabName(e.target.value)}
                  placeholder="Ex: Clara Nogueira"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={trabPhone}
                    onChange={(e) => setTrabPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={trabEmail}
                    onChange={(e) => setTrabEmail(e.target.value)}
                    placeholder="trabalhador@cemil.org.br"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                  />
                </div>
              </div>

              {/* Multi-role Selector */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <label className="font-black uppercase text-indigo-950 text-[11px] tracking-wider block">
                  Papéis / Funções Desempenhadas na Reunião (Selecione Todas que se Aplicam)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {MEDIUNICO_ROLES_OPTIONS.map((opt) => {
                    const isChecked = trabRoles.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleToggleRoleOption(opt.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white text-indigo-600 border-white' : 'border-gray-300'}`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <p className="font-bold text-[11px] leading-tight">{opt.label}</p>
                          <p className={`text-[9.5px] mt-0.5 ${isChecked ? 'text-indigo-100' : 'text-gray-400'}`}>{opt.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formations Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">Status EEM (Estudo e Prática)</label>
                  <select
                    value={trabEemStatus}
                    onChange={(e) => setTrabEemStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                  >
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="NAO_INICIADO">Não Iniciado</option>
                  </select>
                </div>

                <div>
                  <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">Status ESDE (Estudo Sistematizado)</label>
                  <select
                    value={trabEsdeStatus}
                    onChange={(e) => setTrabEsdeStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                  >
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="NAO_INICIADO">Não Iniciado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsNewTrabalhadorModalOpen(false);
                  setIsEditTrabalhadorModalOpen(false);
                }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={isEditTrabalhadorModalOpen ? handleUpdateTrabalhador : handleCreateTrabalhador}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider"
              >
                {isEditTrabalhadorModalOpen ? 'Salvar Alterações' : 'Cadastrar Trabalhador'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: CADASTRAR / EDITAR ENCAMINHAMENTO ESPIRITUAL (LGPD & COORDENAÇÃO) */}
      {(isNewEncaminhamentoModalOpen || isEditEncaminhamentoModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 italic">
                  {isEditEncaminhamentoModalOpen ? 'Editar Ficha do Encaminhamento' : 'Novo Encaminhamento Espiritual'}
                </h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Atendimento Mediúnico & Proteção de Dados (LGPD)
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewEncaminhamentoModalOpen(false);
                  setIsEditEncaminhamentoModalOpen(false);
                  setSelectedEncaminhamento(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* RESTRICTED CIVIL IDENTITY SECTION */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-[10px] tracking-wider">
                  <ShieldCheck size={16} className="text-amber-700" />
                  <span>Identidade Civil do Atendido (Acesso Exclusivo Coordenação & Admin)</span>
                </div>

                <div>
                  <label className="font-bold text-gray-700 text-[11px] block mb-1">Nome Civil Completo</label>
                  <input
                    type="text"
                    value={encFullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="Ex: Ana Rosa Silva"
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    * O nome civil completo NÃO é exibido para a equipe mediúnica geral, resguardando o assistido.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 text-[11px] block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={encPhone}
                      onChange={(e) => setEncPhone(e.target.value)}
                      placeholder="(11) 98765-1122"
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 text-[11px] block mb-1">Iniciais Anônimas (Equipe)</label>
                    <input
                      type="text"
                      value={encInitials}
                      onChange={(e) => setEncInitials(e.target.value)}
                      placeholder="Ex: A.R.S."
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 font-bold text-gray-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* TEAM ACCESSIBLE SECTION */}
              <div>
                <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">Origem do Atendimento</label>
                <select
                  value={encOrigin}
                  onChange={(e) => setEncOrigin(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-900"
                >
                  <option value="Atendimento Fraterno">Atendimento Fraterno</option>
                  <option value="Recepção / Acolhimento">Recepção / Acolhimento</option>
                  <option value="Irradiação a Distância">Irradiação a Distância</option>
                  <option value="Encaminhamento Interno">Encaminhamento Interno</option>
                </select>
              </div>

              <div>
                <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">
                  Necessidade Espiritual de Intercessão (Visível à Equipe Mediúnica)
                </label>
                <textarea
                  value={encNeed}
                  onChange={(e) => setEncNeed(e.target.value)}
                  rows={3}
                  placeholder="Descreva apenas a necessidade de intercessão (ex: harmonização fluídica, irradiação, apoio vibracional), sem expor a vida privada do assistido..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-black uppercase text-gray-500 text-[10px] tracking-wider block mb-1">
                  Observações Confidenciais da Coordenação (Opcional)
                </label>
                <textarea
                  value={encConfidentialNotes}
                  onChange={(e) => setEncConfidentialNotes(e.target.value)}
                  rows={2}
                  placeholder="Anotações internas reservadas para a coordenação..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsNewEncaminhamentoModalOpen(false);
                  setIsEditEncaminhamentoModalOpen(false);
                  setSelectedEncaminhamento(null);
                }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={isEditEncaminhamentoModalOpen ? handleUpdateEncaminhamento : handleCreateEncaminhamento}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider"
              >
                {isEditEncaminhamentoModalOpen ? 'Salvar Alterações' : 'Cadastrar Encaminhamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
