import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Mail,
  UserCircle,
  X,
  Pencil,
  Lock,
  Search,
  ArrowLeft
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Worker, Sector, UserRole, SectorType } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, registerWorker } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [isAddingSector, setIsAddingSector] = useState(false);
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [workerPassword, setWorkerPassword] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newWorker, setNewWorker] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    role: 'VOLUNTARIO' as UserRole, 
    position: '', // NEW
    sectorId: '', 
    photoUrl: '',
    acceptedTerm: false
  });
  const [newSector, setNewSector] = useState({ 
    name: '', 
    type: 'FRATERNO' as SectorType, 
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

  const isAdmin = 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'ADM' || 
    (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  const resetSectorForm = () => {
    setNewSector({ 
      name: '', 
      type: 'FRATERNO', 
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [w, s] = await Promise.all([dataService.getWorkers(), dataService.getSectors()]);
    setWorkers(w);
    setSectors(s);
  };

  const handleEditWorker = (w: Worker) => {
    setEditingWorker(w);
    setNewWorker({
      name: w.name,
      email: w.email,
      phone: w.phone || '',
      role: w.role,
      position: w.position || '', // NEW
      sectorId: w.sectorId || '',
      photoUrl: w.photoUrl || '',
      acceptedTerm: w.acceptedTerm || false
    });
    setIsAddingWorker(true);
  };

  const handleEditSector = (s: Sector) => {
    setEditingSector(s);
    setNewSector({
      name: s.name,
      type: s.type,
      description: s.description || '',
      mission: s.mission || '',
      foundation: s.foundation || '',
      location: s.location || '',
      coordinator: s.coordinator || '',
      subcoordinator: s.subcoordinator || '',
      secretary: s.secretary || '',
      workerProfile: s.workerProfile || '',
      entryFlow: s.entryFlow || '',
      mainActivities: s.mainActivities || '',
      schedule: s.schedule || '',
      meetingFrequency: s.meetingFrequency || '',
      reportsTo: s.reportsTo || '',
      interactions: s.interactions || '',
      resources: s.resources || '',
      goals: s.goals || '',
      challenges: s.challenges || ''
    });
    setIsAddingSector(true);
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to save worker...", { editing: !!editingWorker, email: newWorker.email });
    
    if (newWorker.role === 'VOLUNTARIO' && !newWorker.acceptedTerm) {
      alert('É necessário aceitar o Termo de Adesão ao Trabalho Voluntário.');
      return;
    }

    const normalizedEmail = newWorker.email.toLowerCase().trim();

    setIsSubmittingWorker(true);
    try {
      // 1. Check if worker already exists in Firestore BEFORE trying to create Auth
      if (!editingWorker) {
        console.log("Checking for duplicates for email:", normalizedEmail);
        const existingWorkers = await dataService.getWorkers();
        if (!existingWorkers) throw new Error("Não foi possível validar a lista de trabalhadores.");
        
        const duplicate = existingWorkers.find(w => w.email.toLowerCase().trim() === normalizedEmail);
        
        if (duplicate) {
          alert(`O trabalhador "${duplicate.name}" já está cadastrado com este e-mail.\n\nSugestão: Tente localizar o cadastro atual na lista e editá-lo se necessário.`);
          setIsSubmittingWorker(false);
          return;
        }
      }

      console.log("Preparing payload for worker:", normalizedEmail);
      const payload = {
        ...newWorker,
        email: normalizedEmail,
        termAcceptedAt: newWorker.acceptedTerm ? Date.now() : undefined
      };

      if (editingWorker) {
        console.log("Updating existing worker:", editingWorker.id);
        await dataService.updateWorker({ ...editingWorker, ...payload });
        alert('Trabalhador atualizado com sucesso!');
      } else {
        if (!workerPassword || workerPassword.length < 6) {
          alert('Senha deve ter no mínimo 6 caracteres.');
          setIsSubmittingWorker(false);
          return;
        }
        console.log("Registering new worker auth account...");
        await registerWorker(payload, workerPassword);
        alert('Trabalhador cadastrado e conta de acesso criada com sucesso!');
      }
      setIsAddingWorker(false);
      setEditingWorker(null);
      setNewWorker({ name: '', email: '', phone: '', role: 'VOLUNTARIO', position: '', sectorId: '', photoUrl: '', acceptedTerm: false });
      setWorkerPassword('');
      loadData();
    } catch (err: any) {
      console.log('Interpreting registration error...', err);
      const msg = (err.message || err || '').toString();
      console.log('Extracted message:', msg);
      
      const isDomainError = msg.includes('AUTH_EMAIL_ALREADY_IN_USE') || msg.includes('auth/email-already-in-use') || msg.includes('already-in-use');

      if (isDomainError) {
        // If we reach here, it means the email exists in Firebase Auth but NOT as an active worker profile
        const isCurrentAdmin = normalizedEmail === currentUser?.email?.toLowerCase().trim();
        
        if (isCurrentAdmin) {
          alert('ATENÇÃO: Você está tentando cadastrar o seu PRÓPRIO e-mail de administrador.\n\nSeu perfil já existe. Se quiser alterar seus dados, localize seu nome na lista e use o botão de editar.');
          setIsSubmittingWorker(false);
          return;
        }

        const friendlyMsg = 'Este e-mail já está em uso. Tente fazer login ou recupere sua senha.';

        const dialogMsg = 
          friendlyMsg + '\n\n' +
          'AVISO: Este e-mail já possui uma conta de acesso (login) registrada no sistema Firebase (provavelmente de um cadastro antigo que foi excluído).\n\n' +
          'Deseja REATIVAR o perfil deste colaborador? Ele poderá entrar com a mesma senha que usava antes.';
          
        if (confirm(dialogMsg)) {
          try {
            console.log("Proceeding with manual profile creation for existing auth user...");
            setIsSubmittingWorker(true);
            const profilePayload = {
              ...newWorker,
              email: normalizedEmail,
              active: true,
              createdAt: Date.now(),
              termAcceptedAt: newWorker.acceptedTerm ? Date.now() : undefined
            };
            
            await dataService.addWorkerManual(profilePayload);
            
            alert('Sucesso! O perfil foi recriado e vinculado ao e-mail existente.');
            
            setIsAddingWorker(false);
            setEditingWorker(null);
            setNewWorker({ name: '', email: '', phone: '', role: 'VOLUNTARIO', position: '', sectorId: '', photoUrl: '', acceptedTerm: false });
            setWorkerPassword('');
            loadData();
            return;
          } catch (profileErr: any) {
             console.error('Manual link error:', profileErr);
             alert('Erro ao vincular perfil: ' + (profileErr.message || 'Erro de permissão ou conexão.'));
          }
        }
      } else if (msg.includes('auth/weak-password')) {
        alert('A senha informada é muito fraca. Por favor, use pelo menos 6 caracteres.');
      } else {
        alert('Não foi possível concluir o registro:\n' + (msg || 'Erro de conexão ou permissão. Verifique os campos e tente novamente.'));
      }
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSector) {
        await dataService.updateSector({ ...editingSector, ...newSector });
        alert('Setor atualizado com sucesso!');
      } else {
        await dataService.addSector(newSector);
        alert('Setor criado com sucesso!');
      }
      setIsAddingSector(false);
      setEditingSector(null);
      resetSectorForm();
      loadData();
    } catch (err: any) {
      console.error('Erro ao salvar setor:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar setor: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Ocorreu um erro ao salvar o setor.');
      }
    }
  };

  const handleDeleteWorkerAction = async () => {
    if (!workerToDelete) return;
    try {
      await dataService.deleteWorker(workerToDelete.id);
      loadData();
      setIsDeletingConfirmOpen(false);
      setWorkerToDelete(null);
      alert('Trabalhador excluído com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir trabalhador:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao excluir: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Ocorreu um erro ao excluir o trabalhador.');
      }
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (deletingSectorId === id) {
      await dataService.deleteSector(id);
      setDeletingSectorId(null);
      loadData();
    } else {
      setDeletingSectorId(id);
      setTimeout(() => setDeletingSectorId(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 sm:space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="space-y-2">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-2"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight italic">Configurações & Gestão</h1>
        <p className="text-sm sm:text-base text-gray-500 font-medium italic">Gerenciamento de equipe e frentes de trabalho do Mirante de Luz.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Gestão de Voluntários */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} /> Equipe da Casa
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Localizar trabalhador..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                />
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsAddingWorker(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
                >
                  <Plus size={16} /> <span className="uppercase tracking-widest px-1">Novo</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers
              .filter(w => {
                const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.email.toLowerCase().includes(searchTerm.toLowerCase());
                const isUserAllowed = isAdmin || (currentUser?.role === 'COORDENADOR' && w.sectorId === currentUser.sectorId);
                return matchesSearch && isUserAllowed;
              })
              .map(w => {
                const canEdit = isAdmin || (currentUser?.role === 'COORDENADOR' && w.sectorId === currentUser.sectorId);
                
                return (
                  <motion.div 
                    layout
                    key={w.id} 
                    className="bg-white p-4 sm:p-5 rounded-[28px] border border-gray-50 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                      {w.photoUrl ? (
                        <div className="relative group/photo shrink-0">
                          <img src={w.photoUrl} alt={w.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white shadow-md object-cover ring-4 ring-gray-50" referrerPolicy="no-referrer" />
                          {canEdit && (
                            <button 
                               onClick={() => handleEditWorker(w)}
                               className="absolute inset-0 bg-indigo-600/60 rounded-2xl flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all text-white backdrop-blur-[2px]"
                            >
                               <Pencil size={18} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div 
                           onClick={() => canEdit && handleEditWorker(w)}
                           className={cn(
                             "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-white ring-4 ring-gray-50 transition-all shrink-0",
                             canEdit ? "cursor-pointer hover:bg-indigo-600 hover:text-white bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-300"
                           )}
                        >
                          {(w.name || '?').charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 pr-8">
                         <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate">{w.name}</h4>
                           {!w.active && (
                             <span className="text-[7px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Pendente</span>
                           )}
                         </div>
                         <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate mb-2">
                           {w.email} {w.position && <span className="text-indigo-600 font-black ml-1">• {w.position}</span>}
                         </p>
                         
                         <div className="flex flex-wrap gap-2">
                           <span className={cn(
                             "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                             (w.role === 'ADMIN' || w.role === 'ADM') ? "bg-purple-50 text-purple-600 border-purple-100" :
                             w.role === 'COORDENADOR' ? "bg-blue-50 text-blue-600 border-blue-100" :
                             "bg-gray-50 text-gray-500 border-gray-100"
                           )}>
                             {w.role}
                           </span>
                           <span className="text-[8px] font-black text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-widest italic border border-indigo-50">
                             {sectors.find(s => s.id === w.sectorId)?.name || 'Geral'}
                           </span>
                         </div>
                      </div>

                      <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-all">
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleEditWorker(w)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setWorkerToDelete(w);
                                setIsDeletingConfirmOpen(true);
                              }}
                              className="p-2 mr-1 rounded-xl transition-all flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50"
                              title="Excluir Trabalhador"
                            >
                               <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            
            {workers.filter(w => {
              if (isAdmin) return true;
              if (currentUser?.role === 'COORDENADOR') return w.sectorId === currentUser.sectorId;
              return false;
            }).length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                  <Users size={32} />
                </div>
                <p className="text-gray-400 font-medium italic">Nenhum trabalhador encontrado...</p>
              </div>
            )}
          </div>
        </div>

        {/* Gestão de Setores */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={24} /> Setores
            </h2>
            {isAdmin && (
              <button 
                onClick={() => setIsAddingSector(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          <div className="space-y-3">
             {sectors.map(s => (
               <div key={s.id} className="p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{s.name}</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.type}</p>
                    </div>
                  </div>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM') && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditSector(s)}
                          className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSector(s.id)}
                          className={cn(
                            "p-2 transition-all rounded-lg",
                            deletingSectorId === s.id ? "bg-red-500 text-white text-[10px] font-bold px-2 py-1" : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          )}
                        >
                          {deletingSectorId === s.id ? "Confirma?" : <Trash2 size={16} />}
                        </button>
                      </div>
                    )}
               </div>
             ))}
             {isAdmin && (
               <button 
                 onClick={() => setIsAddingSector(true)}
                 className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[24px] text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
               >
                  + Adicionar Novo Setor
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Modal Adicionar Colaborador */}
      {isAddingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm" onClick={() => setIsAddingWorker(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">{editingWorker ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Cadastre um novo irmão de jornada.</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingWorker(false);
                  setEditingWorker(null);
                  setNewWorker({ name: '', email: '', phone: '', role: 'VOLUNTARIO', position: '', sectorId: '', photoUrl: '', acceptedTerm: false });
                }} 
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Trabalhador</label>
                  <input required value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-sm" placeholder="Ex: Francisco Cândido" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cargo Institucional</label>
                  <select value={newWorker.position} onChange={e => setNewWorker({...newWorker, position: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700 text-sm">
                    <option value="">Nenhum cargo específico</option>
                    <option value="Presidente(s)">Presidente(s)</option>
                    <option value="Vice-presidente(s)">Vice-presidente(s)</option>
                    <option value="1º Secretário(a)">1º Secretário(a)</option>
                    <option value="Secretário(a) de Planejamento">Secretário(a) de Planejamento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">E-mail para Login</label>
                  <input required type="email" value={newWorker.email} onChange={e => setNewWorker({...newWorker, email: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700" placeholder="Ex: voluntario@cemil.org" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Telefone da Equipe</label>
                  <input value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700" placeholder="(00) 00000-0000" />
                </div>
              </div>

              <ImageUpload 
                label="Foto do Trabalhador"
                value={newWorker.photoUrl} 
                onChange={val => setNewWorker({...newWorker, photoUrl: val})} 
              />

              {!editingWorker && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Senha Inicial</label>
                  <div className="relative group/pass">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within/pass:text-indigo-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      required 
                      type="password" 
                      value={workerPassword} 
                      onChange={e => setWorkerPassword(e.target.value)} 
                      className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700" 
                      placeholder="Mínimo 6 caracteres" 
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nível de Acesso</label>
                  <select value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value as UserRole})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700">
                    <option value="VOLUNTARIO">Voluntário</option>
                    <option value="ATENDENTE">Atendente</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                    <option value="SECRETARIO">Secretário</option>
                    <option value="COORDENADOR">Coordenador</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="ADM">ADM (Admin)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Setor Principal</label>
                  <select value={newWorker.sectorId} onChange={e => setNewWorker({...newWorker, sectorId: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700">
                    <option value="">Acesso Geral</option>
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-5 bg-indigo-50/50 rounded-[24px] border border-indigo-100 space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-2">
                  <ShieldCheck size={14} /> Termo de Adesão ao Trabalho Voluntário
                </h3>
                <div className="max-h-[80px] overflow-y-auto text-[10px] text-indigo-700/80 leading-relaxed font-medium bg-white/50 p-3 rounded-xl border border-indigo-100/50 custom-scrollbar">
                  <p className="mb-2">Pelo presente instrumento, o voluntário adere ao trabalho voluntário no <strong>CENTRO ESPÍRITA MIRANTE DE LUZ</strong>, nos termos da Lei nº 9.608/98.</p>
                  <p className="mb-2">O serviço voluntário não gera vínculo empregatício... O voluntário declara estar ciente das normas da casa e compromete-se a desempenhar suas tarefas com zelo e ética.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={newWorker.acceptedTerm}
                      onChange={e => setNewWorker({...newWorker, acceptedTerm: e.target.checked})}
                      className="peer hidden" 
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-indigo-200 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                    Li e concordo com os termos de voluntariado da casa.
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingWorker(false);
                    setEditingWorker(null);
                    setNewWorker({ name: '', email: '', phone: '', role: 'VOLUNTARIO', position: '', sectorId: '', photoUrl: '', acceptedTerm: false });
                  }} 
                  className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingWorker}
                  className="flex-[1.5] py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isSubmittingWorker ? (
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       <span>Processando...</span>
                    </div>
                  ) : (
                    editingWorker ? 'Salvar Alterações' : 'Salvar Trabalhador'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Adicionar Setor */}
      {isAddingSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm" onClick={() => setIsAddingSector(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">{editingSector ? 'Editar Setor' : 'Novo Setor'}</h2>
                <p className="text-xs text-gray-400 font-medium tracking-tight">Crie uma nova frente de atendimento.</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingSector(false);
                  setEditingSector(null);
                  resetSectorForm();
                }} 
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleAddSector} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-4 pr-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Setor</label>
                  <input required value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700" placeholder="Ex: Evangelização Juvenil" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Atividade</label>
                    <select value={newSector.type} onChange={e => setNewSector({...newSector, type: e.target.value as SectorType})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700">
                      <option value="FRATERNO">Atendimento Fraterno</option>
                      <option value="PASSE">Passe & Fluidoterapia</option>
                      <option value="ESTUDO">Estudo</option>
                      <option value="INFANCIA">Infância & Juventude</option>
                      <option value="SOCIAL">Ação Social</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="MEDIUNICO">Trabalho Mediúnico</option>
                      <option value="OUTROS">Outros / Não Especificado</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Localização</label>
                    <input value={newSector.location} onChange={e => setNewSector({...newSector, location: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Sala 3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Missão / Objetivo Geral</label>
                  <textarea rows={2} value={newSector.mission} onChange={e => setNewSector({...newSector, mission: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Qual a razão de existir deste setor?" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Fundamentação Doutrinária</label>
                  <input value={newSector.foundation} onChange={e => setNewSector({...newSector, foundation: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: O Evangelho Segundo o Espiritismo" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Coordenador</label>
                    <input value={newSector.coordinator} onChange={e => setNewSector({...newSector, coordinator: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Nome" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Subcoordenador</label>
                    <input value={newSector.subcoordinator} onChange={e => setNewSector({...newSector, subcoordinator: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Vice" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Secretário(a)</label>
                    <input value={newSector.secretary} onChange={e => setNewSector({...newSector, secretary: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Nome" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Horário de Trabalho</label>
                    <input value={newSector.schedule} onChange={e => setNewSector({...newSector, schedule: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Terças 20h" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Frequência Reuniões de Equipe</label>
                    <input value={newSector.meetingFrequency} onChange={e => setNewSector({...newSector, meetingFrequency: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Mensal" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">A quem responde?</label>
                    <input value={newSector.reportsTo} onChange={e => setNewSector({...newSector, reportsTo: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Ex: Diretoria Executiva" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Recursos e Materiais Necessários</label>
                  <textarea rows={2} value={newSector.resources} onChange={e => setNewSector({...newSector, resources: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Ex: Projetor, macas, computador" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Metas e Indicadores</label>
                    <input value={newSector.goals} onChange={e => setNewSector({...newSector, goals: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Qualidade, frequência..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Principais Desafios</label>
                    <input value={newSector.challenges} onChange={e => setNewSector({...newSector, challenges: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium" placeholder="Melhorar o que?" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Atividades Principais (separadas por vírgula)</label>
                  <textarea rows={2} value={newSector.mainActivities} onChange={e => setNewSector({...newSector, mainActivities: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner" placeholder="Ex: Passe, Estudo, Vibração" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Breve Descrição para Painéis</label>
                  <textarea rows={2} value={newSector.description} onChange={e => setNewSector({...newSector, description: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none" placeholder="Finalidade resumida..." />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingSector(false);
                    setEditingSector(null);
                    resetSectorForm();
                  }} 
                  className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-[1.5] py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                  {editingSector ? 'Salvar Alterações' : 'Criar Setor'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Trabalhador */}
      {isDeletingConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-red-950/40 backdrop-blur-sm" onClick={() => setIsDeletingConfirmOpen(false)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Confirmar Exclusão</h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Tem certeza que deseja excluir o trabalhador <strong className="text-gray-900">{workerToDelete?.name}</strong>?
              </p>
              <div className="text-[10px] text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-100 italic leading-relaxed text-left">
                <strong>Nota Importante:</strong> O perfil no banco de dados (Firestore) será eliminado. 
                Por segurança, o acesso de login (Firebase Auth) não é removido automaticamente para evitar perda acidental de conta. 
                Se você re-cadastrar este e-mail no futuro, o sistema perguntará se deseja reativar o acesso.
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeletingConfirmOpen(false)}
                className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteWorkerAction}
                className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Opções Avançadas */}
      {isAdmin && (
        <div className="pt-10 border-t border-gray-100 italic">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-red-50/30 p-8 rounded-[32px] border border-red-100 shadow-inner">
            <div>
              <h3 className="text-lg font-bold text-red-900 not-italic">Manutenção de Dados</h3>
              <p className="text-sm text-red-600 font-medium max-w-md">Utilize esta opção somente se houver erro ao carregar as abas ou o prontuário. Isso retornará o sistema aos dados originais da casa.</p>
            </div>
            <button 
              onClick={async () => {
                if (confirm('ATENÇÃO: Deseja restaurar a estrutura básica de setores caso tenham desaparecido? Dados de atendimentos existentes NÃO serão apagados.')) {
                  try {
                    const restored = await dataService.populateDefaults();
                    if (restored) {
                      alert('Setores restaurados com sucesso!');
                      loadData();
                    } else {
                      alert('Os setores já existem ou não puderam ser restaurados.');
                    }
                  } catch (err: any) {
                    alert('Erro ao restaurar: ' + err.message);
                  }
                }
              }}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>Restaurar Setores Padrão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
