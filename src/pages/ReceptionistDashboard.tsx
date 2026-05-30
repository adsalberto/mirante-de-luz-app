import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  ListOrdered, 
  Clock, 
  Search,
  ArrowRight,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  X,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Participant, ServiceQueueEntry, Sector, VisitorLog, CleaningChecklist } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    waitingInQueue: 0,
    servicesToday: 0
  });
  const [recentQueue, setRecentQueue] = useState<(ServiceQueueEntry & { participantName?: string, sectorName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // States for Recepção e Limpeza
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorPurpose, setNewVisitorPurpose] = useState('');

  const [cleaningChecklists, setCleaningChecklists] = useState<CleaningChecklist[]>([]);
  const [newChecklistRoomName, setNewChecklistRoomName] = useState('');
  const [newChecklistStatus, setNewChecklistStatus] = useState<'LIMPO' | 'ATENCAO' | 'PENDENTE'>('LIMPO');
  const [newChecklistResponsibleName, setNewChecklistResponsibleName] = useState('');
  const [newChecklistObservations, setNewChecklistObservations] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'ATENDIMENTOS' | 'LIMPEZA'>('ATENDIMENTOS');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allParticipants, queueItems, allSectors] = await Promise.all([
        dataService.getParticipants(),
        dataService.getQueue(),
        dataService.getSectors()
      ]);

      const today = new Date().setHours(0,0,0,0);
      
      const enrichedQueue = queueItems
        .filter(item => item.status === 'WAITING' || item.status === 'IN_PROGRESS')
        .slice(0, 5)
        .map(item => ({
          ...item,
          participantName: allParticipants.find(p => p.id === item.participantId)?.name || 'Desconhecido',
          sectorName: allSectors.find(s => s.id === item.sectorId)?.name || 'Setor'
        }));

      setStats({
        totalParticipants: allParticipants.length,
        waitingInQueue: queueItems.filter(i => i.status === 'WAITING').length,
        servicesToday: queueItems.filter(i => i.arrivalDate >= today).length
      });
      setRecentQueue(enrichedQueue);

      // Load Recepção e Limpeza logs
      const cachedVisitors = localStorage.getItem('admin_visitor_logs');
      if (cachedVisitors) {
        try { setVisitorLogs(JSON.parse(cachedVisitors)); } catch {}
      } else {
        const defaultVisitors: VisitorLog[] = [
          { id: 'v1', name: 'Fernanda de Souza Santos', phone: '(11) 98124-5511', purpose: 'Atendimento Fraterno Inicial', checkInTime: Date.now() - 10800000, checkOutTime: Date.now() - 7200000 },
          { id: 'v2', name: 'Wellington Silva Neves', phone: '(11) 99187-0099', purpose: 'Assistente social (Triagem)', checkInTime: Date.now() - 5400000 }
        ];
        localStorage.setItem('admin_visitor_logs', JSON.stringify(defaultVisitors));
        setVisitorLogs(defaultVisitors);
      }

      const cachedChecklists = localStorage.getItem('admin_cleaning_checklists');
      if (cachedChecklists) {
        try { setCleaningChecklists(JSON.parse(cachedChecklists)); } catch {}
      } else {
        const defaultChecklists: CleaningChecklist[] = [
          { id: 'cl1', roomName: 'Banheiros Masculinos (Térreo)', status: 'LIMPO', responsibleName: 'Marta (Voluntária)', lastCleanedAt: Date.now() - 7200000 },
          { id: 'cl2', roomName: 'Salas de Passe e Fluidoterapia', status: 'ATENCAO', responsibleName: 'Claudio (Voluntário)', lastCleanedAt: Date.now() - 14400000, observations: 'Reabastecer galão de álcool em gel na entrada' },
          { id: 'cl3', roomName: 'Salão de Palestras Doutrinárias', status: 'PENDENTE', responsibleName: 'Vera Lúcia (Voluntária)', lastCleanedAt: Date.now() - 43200000 }
        ];
        localStorage.setItem('admin_cleaning_checklists', JSON.stringify(defaultChecklists));
        setCleaningChecklists(defaultChecklists);
      }

    } catch (err) {
      console.error("Error loading receptionist stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVisitor = () => {
    if (!newVisitorName.trim()) return;
    const newV: VisitorLog = {
      id: 'v_' + Date.now(),
      name: newVisitorName,
      phone: newVisitorPhone || '(11) 90000-0000',
      purpose: newVisitorPurpose || 'Atendimento Fraterno',
      checkInTime: Date.now()
    };
    const updated = [newV, ...visitorLogs];
    setVisitorLogs(updated);
    localStorage.setItem('admin_visitor_logs', JSON.stringify(updated));
    setNewVisitorName('');
    setNewVisitorPhone('');
    setNewVisitorPurpose('');
  };

  const handleCheckOutVisitor = (id: string) => {
    const updated = visitorLogs.map(v => {
      if (v.id === id) {
        return { ...v, checkOutTime: Date.now() };
      }
      return v;
    });
    setVisitorLogs(updated);
    localStorage.setItem('admin_visitor_logs', JSON.stringify(updated));
  };

  const handleUpdateChecklistStatus = (id: string, newStatus: 'LIMPO' | 'ATENCAO' | 'PENDENTE', obs?: string) => {
    const updated = cleaningChecklists.map(cl => {
      if (cl.id === id) {
        return {
          ...cl,
          status: newStatus,
          responsibleName: currentUser?.name || 'Voluntário da Casa',
          lastCleanedAt: Date.now(),
          observations: obs !== undefined ? obs : cl.observations
        };
      }
      return cl;
    });
    setCleaningChecklists(updated);
    localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));
  };

  const handleAddChecklistActivity = () => {
    if (!newChecklistRoomName.trim()) {
      alert("Por favor, informe o nome do ambiente ou a tarefa de conservação.");
      return;
    }
    const newItem: CleaningChecklist = {
      id: "cl_" + Date.now().toString(36),
      roomName: newChecklistRoomName.trim(),
      status: newChecklistStatus,
      responsibleName: newChecklistResponsibleName.trim() || currentUser?.name || 'Voluntário da Casa',
      lastCleanedAt: Date.now(),
      observations: newChecklistObservations.trim()
    };

    const updated = [newItem, ...cleaningChecklists];
    setCleaningChecklists(updated);
    localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));

    // Cleanup state
    setNewChecklistRoomName('');
    setNewChecklistStatus('LIMPO');
    setNewChecklistResponsibleName('');
    setNewChecklistObservations('');
  };

  const handleDeleteChecklistActivity = (id: string) => {
    if (confirm("Tem certeza que deseja remover este ambiente/atividade do checklist?")) {
      const updated = cleaningChecklists.filter(cl => cl.id !== id);
      setCleaningChecklists(updated);
      localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));
    }
  };

  const menuActions = [
    {
      title: 'Cadastrar Atendido',
      desc: 'Novo registro de participante no sistema',
      icon: UserPlus,
      color: 'bg-indigo-500',
      action: () => navigate('/atendidos?action=new')
    },
    {
      title: 'Lista de Atendidos',
      desc: 'Buscar e gerenciar cadastros existentes',
      icon: Users,
      color: 'bg-emerald-500',
      action: () => navigate('/atendidos')
    },
    {
      title: 'Fila de Espera',
      desc: 'Ver e organizar ordem de atendimento',
      icon: ListOrdered,
      color: 'bg-amber-500',
      action: () => navigate('/fila')
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Área da Recepção</h1>
          <p className="text-gray-500 font-medium font-sans">Bem-vindo(a), {currentUser?.name}. Escolha sua área de simulação abaixo:</p>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="flex border-b border-gray-100 gap-6">
        <button
          onClick={() => setActiveSubTab('ATENDIMENTOS')}
          className={cn(
            "pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer font-sans",
            activeSubTab === 'ATENDIMENTOS'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          🔑 Filas de Atendimento
        </button>
        <button
          onClick={() => setActiveSubTab('LIMPEZA')}
          className={cn(
            "pb-3 text-xs sm:text-sm font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer font-sans",
            activeSubTab === 'LIMPEZA'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          🧹 Recepção & Limpeza (Visitas e Zelo)
        </button>
      </div>

      {activeSubTab === 'ATENDIMENTOS' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              label="Total de Atendidos" 
              value={stats.totalParticipants} 
              icon={Users} 
              trend="Ativos no sistema"
              color="indigo" 
            />
            <StatCard 
              label="Aguardando na Fila" 
              value={stats.waitingInQueue} 
              icon={Clock} 
              trend="Aguardando chamada"
              color="amber" 
            />
            <StatCard 
              label="Chamados Hoje" 
              value={stats.servicesToday} 
              icon={ClipboardCheck} 
              trend="Fluxo diário"
              color="emerald" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Actions */}
            <div className="lg:col-span-2 space-y-6 overflow-hidden">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutDashboard size={20} className="text-indigo-600" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuActions.map((item, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -4 }}
                    onClick={item.action}
                    className="flex items-start gap-4 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
                  >
                    <div className={`p-4 ${item.color} rounded-2xl text-white shadow-lg shadow-${item.color.split('-')[1]}-100`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <p className="text-sm text-gray-400 font-medium mt-1">{item.desc}</p>
                    </div>
                    <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recent Queue Activity */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock size={20} className="text-amber-600" />
                Fila Recente
              </h2>
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
                {recentQueue.length > 0 ? (
                  recentQueue.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{item.participantName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.sectorName}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                        item.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.status === 'IN_PROGRESS' ? 'Em Curso' : 'Espera'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-sm font-medium">Nenhum atendimento ativo no momento.</p>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/fila')}
                  className="w-full py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                >
                  Ver Fila Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Quick Stats - Recepção e Limpeza */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              label="Visitas Ativas" 
              value={visitorLogs.filter(v => !v.checkOutTime).length} 
              icon={Users} 
              trend="Irmãos em trânsito"
              color="indigo" 
            />
            <StatCard 
              label="Zelo: Ambientes Limpos" 
              value={cleaningChecklists.filter(cl => cl.status === 'LIMPO').length} 
              icon={CheckCircle2} 
              trend="Em perfeitas condições"
              color="emerald" 
            />
            <StatCard 
              label="Alertas / Pendentes" 
              value={cleaningChecklists.filter(cl => cl.status !== 'LIMPO').length} 
              icon={Clock} 
              trend="Necessitam atenção"
              color="amber" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Visitor Registry */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-50 pb-6 text-left">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Users className="text-indigo-600" size={22} />
                    Controle de Visitas e Recepção
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 font-sans">Registro de Acolhimento e Acesso ao Prédio</p>
                </div>

                {/* Registry Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-sans">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Irmão / Visitante</label>
                    <input
                      value={newVisitorName}
                      onChange={(e) => setNewVisitorName(e.target.value)}
                      placeholder="Ex: Amanda Ferreira Silva"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Telefone</label>
                    <input
                      value={newVisitorPhone}
                      onChange={(e) => setNewVisitorPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Finalidade do Acesso / Encaminhamento</label>
                    <input
                      value={newVisitorPurpose}
                      onChange={(e) => setNewVisitorPurpose(e.target.value)}
                      placeholder="Ex: Assistência Sopa / Atendimento Fraterno"
                      className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors h-10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRegisterVisitor}
                    className="sm:col-span-3 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer h-11"
                  >
                    Registrar Entrada de Visitante
                  </button>
                </div>

                {/* Visitors list */}
                <div className="space-y-3 pt-4 border-t border-gray-50 text-left font-sans">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Fluxo de Visitantes Hoje</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {visitorLogs.map((vl) => (
                      <div key={vl.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                        <div className="flex-1">
                          <h5 className="font-extrabold text-sm text-gray-950 leading-none">{vl.name}</h5>
                          <span className="inline-block text-[9px] text-[#78716c] font-black uppercase tracking-wider mt-1">{vl.purpose} • {vl.phone}</span>
                          <p className="text-[9px] text-gray-400 mt-1">
                            Chegada: {new Date(vl.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {vl.checkOutTime && ` • Saída: ${new Date(vl.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>

                        {!vl.checkOutTime ? (
                          <button
                            onClick={() => handleCheckOutVisitor(vl.id)}
                            className="p-2 sm:p-2.5 bg-gray-950 hover:bg-red-600 hover:scale-105 transition-all text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer w-full sm:w-auto text-center whitespace-nowrap"
                          >
                            Registrar Saída (Check-out)
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest w-full sm:w-auto text-center">
                            Saída Concluída
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Checklists */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="border-b border-gray-50 pb-6 text-left">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-600" size={22} />
                    Zelo de Ambientes (Limpeza e Conservação)
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 font-sans">Checklists e Ocorrências Prediais</p>
                </div>

                {/* Form to Launch New Cleaning Checklist or Area */}
                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 text-left space-y-4 font-sans">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic flex items-center gap-1.5 select-none text-[11px]">
                    <Plus size={14} className="text-indigo-600" />
                    Lançar Nova Atividade ou Ambiente
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Ambiente ou Tarefa</label>
                      <input
                        value={newChecklistRoomName}
                        onChange={(e) => setNewChecklistRoomName(e.target.value)}
                        placeholder="Ex: Refeitório Administrativo, Recepção, Banheiros"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Status de Conservação</label>
                      <select
                        value={newChecklistStatus}
                        onChange={(e) => setNewChecklistStatus(e.target.value as any)}
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-1.5 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="LIMPO">🟢 LIMPO / CONSERVADO</option>
                        <option value="ATENCAO">🟡 ATENÇÃO / MENOR</option>
                        <option value="PENDENTE">🔴 URGENTE / PENDENTE</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Responsável Executor</label>
                      <input
                        value={newChecklistResponsibleName}
                        onChange={(e) => setNewChecklistResponsibleName(e.target.value)}
                        placeholder="Ex: Maria José (Voluntária)"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Observações e Detalhes</label>
                      <input
                        value={newChecklistObservations}
                        onChange={(e) => setNewChecklistObservations(e.target.value)}
                        placeholder="Ex: Sem observações relevantes"
                        className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddChecklistActivity}
                      className="sm:col-span-6 w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      Registrar Nova Atividade / Ambiente
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-left font-sans">
                  {cleaningChecklists.map((cl) => (
                    <div key={cl.id} className="p-5 bg-gray-50 border border-gray-150 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            cl.status === 'LIMPO' ? "bg-emerald-500" : cl.status === 'ATENCAO' ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"
                          )} />
                          <h4 className="font-extrabold text-sm text-gray-950 leading-none">{cl.roomName}</h4>
                        </div>
                        {cl.observations && (
                          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-150 px-3 py-1.5 rounded-xl font-medium mt-2 leading-relaxed font-sans">
                            ⚠️ Alerta: {cl.observations}
                          </p>
                        )}
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider !mt-2">
                          Última Inspeção por: <strong>{cl.responsibleName}</strong> • {new Date(cl.lastCleanedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
                        {cl.status !== 'LIMPO' ? (
                          <button
                            onClick={() => handleUpdateChecklistStatus(cl.id, 'LIMPO', '')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                          >
                            Marcar como Limpo / Resolvido
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const obs = prompt("Informe a ocorrência ou falta de materiais observada na sala:");
                              if (obs !== null) {
                                handleUpdateChecklistStatus(cl.id, 'ATENCAO', obs);
                              }
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer font-sans"
                          >
                            Sinalizar Alerta / Falta
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteChecklistActivity(cl.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-500 rounded-xl transition-all cursor-pointer"
                          title="Excluir Atividade / Ambiente"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group font-sans"
    >
      <div className={`absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10 flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
            <span className="text-xs font-bold text-gray-400">{trend}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
