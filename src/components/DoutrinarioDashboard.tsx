import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  NotebookPen, 
  Briefcase, 
  HelpCircle, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Search, 
  Check, 
  Clock, 
  ArrowRight, 
  User, 
  Compass, 
  Award, 
  AlertTriangle, 
  Home, 
  Phone, 
  Mail, 
  BookMarked, 
  ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { 
  Speaker, 
  AgendaEvent, 
  DoutrinarioMaterial, 
  DoutrinarioReuniao, 
  DoutrinarioTrabalhador, 
  DoutrinarioApoio, 
  DoutrinarioDiretriz 
} from '../types';

export const DoutrinarioDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXPOSITORES' | 'PALESTRAS' | 'BIBLIOTECA' | 'REUNIOES' | 'TRABALHADORES' | 'APOIO' | 'DIRETRIZES'>('EXPOSITORES');
  const [loading, setLoading] = useState(false);

  // --- ENTITY STATES ---
  const [expositores, setExpositores] = useState<Speaker[]>([]);
  const [palestras, setPalestras] = useState<AgendaEvent[]>([]);
  const [materiais, setMateriais] = useState<DoutrinarioMaterial[]>([]);
  const [reunioes, setReunioes] = useState<DoutrinarioReuniao[]>([]);
  const [trabalhadores, setTrabalhadores] = useState<DoutrinarioTrabalhador[]>([]);
  const [apoios, setApoios] = useState<DoutrinarioApoio[]>([]);
  const [diretrizes, setDiretrizes] = useState<DoutrinarioDiretriz[]>([]);

  // --- SEARCH STATES ---
  const [searchText, setSearchText] = useState('');

  // --- FORMS STATES ---
  // Expositores (Speakers)
  const [expName, setExpName] = useState('');
  const [expPhone, setExpPhone] = useState('');
  const [expEmail, setExpEmail] = useState('');
  const [expCenter, setExpCenter] = useState('');
  const [expCity, setExpCity] = useState('');
  const [expThemes, setExpThemes] = useState('');
  const [expAvailability, setExpAvailability] = useState('');
  const [expObservations, setExpObservations] = useState('');
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Palestras (AgendaEvents)
  const [palTitle, setPalTitle] = useState('');
  const [palDesc, setPalDesc] = useState('');
  const [palDate, setPalDate] = useState('');
  const [palTime, setPalTime] = useState('');
  const [palSpeakerId, setPalSpeakerId] = useState('');
  const [palLocation, setPalLocation] = useState('');
  const [palResponsible, setPalResponsible] = useState('');
  const [palExpectedPublic, setPalExpectedPublic] = useState('');
  const [editingPalId, setEditingPalId] = useState<string | null>(null);

  // Biblioteca (Materials)
  const [matName, setMatName] = useState('');
  const [matType, setMatType] = useState<'LIVRO' | 'APOSTILA' | 'PDF' | 'AUDIO' | 'VIDEO'>('LIVRO');
  const [matAuthor, setMatAuthor] = useState('');
  const [matCategory, setMatCategory] = useState<'OBRAS_BASICAS' | 'MEDIUNIDADE' | 'EVANGELIZACAO' | 'ESTUDOS' | 'REFORMA_INTIMA' | 'ATENDIMENTO_FRATERNO'>('OBRAS_BASICAS');
  const [matObservations, setMatObservations] = useState('');
  const [editingMatId, setEditingMatId] = useState<string | null>(null);

  // Reuniões / Atas
  const [reuDate, setReuDate] = useState('');
  const [reuParticipants, setReuParticipants] = useState('');
  const [reuSubjects, setReuSubjects] = useState('');
  const [reuDecisions, setReuDecisions] = useState('');
  const [reuForwardings, setReuForwardings] = useState('');
  const [editingReuId, setEditingReuId] = useState<string | null>(null);

  // Trabalhadores
  const [trabName, setTrabName] = useState('');
  const [trabRole, setTrabRole] = useState<'EXPOSITOR' | 'REVISOR' | 'COORDENADOR' | 'APOIO_DOUTRINARIO'>('EXPOSITOR');
  const [trabArea, setTrabArea] = useState('');
  const [trabHouseTime, setTrabHouseTime] = useState('');
  const [trabAvailability, setTrabAvailability] = useState('');
  const [trabContact, setTrabContact] = useState('');
  const [editingTrabId, setEditingTrabId] = useState<string | null>(null);

  // Apoio Intersetorial
  const [apoFromSector, setApoFromSector] = useState('');
  const [apoTitle, setApoTitle] = useState('');
  const [apoDesc, setApoDesc] = useState('');
  const [apoResponse, setApoResponse] = useState('');
  const [editingApoId, setEditingApoId] = useState<string | null>(null);

  // Diretrizes Internas
  const [dirTitle, setDirTitle] = useState('');
  const [dirCategory, setDirCategory] = useState('Manuais');
  const [dirResponsible, setDirResponsible] = useState('');
  const [dirObservations, setDirObservations] = useState('');
  const [editingDirId, setEditingDirId] = useState<string | null>(null);

  // --- INITIAL DATA FETCHING ---
  const loadAll = async () => {
    setLoading(true);
    try {
      // Fetch Expositores (Speakers)
      const dataExp = await dataService.getSpeakers();
      setExpositores(dataExp || []);

      // Fetch Palestras (DOUTRINARIA AgendaEvents)
      const dataPal = await dataService.getAgendaEvents();
      setPalestras((dataPal || []).filter(e => e.type === 'DOUTRINARIA'));

      // Fetch Materials
      const dataMat = await dataService.getDoutrinarioMateriais();
      setMateriais(dataMat || []);

      // Fetch Reuniões
      const dataReu = await dataService.getDoutrinarioReunioes();
      setReunioes(dataReu || []);

      // Fetch Trabalhadores
      const dataTrab = await dataService.getDoutrinarioTrabalhadores();
      setTrabalhadores(dataTrab || []);

      // Fetch Apoios
      const dataApo = await dataService.getDoutrinarioApoios();
      setApoios(dataApo || []);

      // Fetch Diretrizes
      const dataDir = await dataService.getDoutrinarioDiretrizes();
      setDiretrizes(dataDir || []);
    } catch (e) {
      console.error("Erro ao sincronizar dados doutrinários:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- CRUD ACTIONS ---

  // 1. EXPOSITORES (SPEAKERS)
  const handleSaveExpositor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName) return;

    try {
      const payload: Omit<Speaker, 'id'> & { id?: string } = {
        name: expName,
        phone: expPhone,
        email: expEmail,
        spiritistCenter: expCenter,
        city: expCity,
        themes: expThemes,
        availability: expAvailability,
        observations: expObservations
      };

      if (editingExpId) {
        await dataService.updateSpeaker({ ...payload, id: editingExpId } as Speaker);
      } else {
        await dataService.addSpeaker(payload);
      }

      // Reset
      setExpName('');
      setExpPhone('');
      setExpEmail('');
      setExpCenter('');
      setExpCity('');
      setExpThemes('');
      setExpAvailability('');
      setExpObservations('');
      setEditingExpId(null);
      await loadAll();
    } catch (err) {
      console.error("Erro salvando palestrante:", err);
    }
  };

  const handleEditExpositor = (item: Speaker) => {
    setEditingExpId(item.id);
    setExpName(item.name);
    setExpPhone(item.phone || '');
    setExpEmail(item.email || '');
    setExpCenter(item.spiritistCenter || '');
    setExpCity(item.city || '');
    setExpThemes(item.themes || '');
    setExpAvailability(item.availability || '');
    setExpObservations(item.observations || '');
  };

  const handleDeleteExpositor = async (id: string) => {
    if (!confirm('Deseja excluir este expositor?')) return;
    try {
      await dataService.deleteSpeaker(id);
      await loadAll();
    } catch (err) {
      console.error("Erro deletando expositor:", err);
    }
  };

  // 2. PALESTRAS (AGENDAEVENTS)
  const handleSavePalestra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palTitle || !palDate || !palTime) return;

    const speakerObj = expositores.find(s => s.id === palSpeakerId);

    try {
      const dateTimestamp = new Date(`${palDate}T${palTime}`).getTime();
      const payload = {
        title: palTitle,
        description: palDesc,
        date: dateTimestamp,
        time: palTime,
        type: 'DOUTRINARIA' as const,
        speakerId: palSpeakerId || undefined,
        speakerName: speakerObj ? speakerObj.name : 'Tema Livre / Variados',
        location: palLocation || 'Salão de Conferências',
        responsible: palResponsible || 'Coordenação Doutrinária',
        expectedPublic: Number(palExpectedPublic) || 60
      };

      if (editingPalId) {
        await dataService.updateAgendaEvent({ ...payload, id: editingPalId });
      } else {
        await dataService.addAgendaEvent(payload);
      }

      setPalTitle('');
      setPalDesc('');
      setPalDate('');
      setPalTime('');
      setPalSpeakerId('');
      setPalLocation('');
      setPalResponsible('');
      setPalExpectedPublic('');
      setEditingPalId(null);
      await loadAll();
    } catch (err) {
      console.error("Erro ao gravar palestra:", err);
    }
  };

  const handleEditPalestra = (item: AgendaEvent) => {
    setEditingPalId(item.id);
    setPalTitle(item.title);
    setPalDesc(item.description || '');
    setPalLocation(item.location || '');
    setPalResponsible(item.responsible || '');
    setPalExpectedPublic(item.expectedPublic ? String(item.expectedPublic) : '');
    setPalTime(item.time || '20:00');
    setPalSpeakerId(item.speakerId || '');
    if (item.date) {
      const formattedDate = new Date(item.date).toISOString().split('T')[0];
      setPalDate(formattedDate);
    }
  };

  const handleDeletePalestra = async (id: string) => {
    if (!confirm('Deseja realmente remover esta palestra da agenda doutrinária?')) return;
    try {
      await dataService.deleteAgendaEvent(id);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // 3. BIBLIOTECA (MATERIAL CATALOGUE)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName || !matAuthor) return;

    const payload = {
      name: matName,
      type: matType,
      author: matAuthor,
      category: matCategory,
      observations: matObservations
    };

    try {
      if (editingMatId) {
        await dataService.updateDoutrinarioMaterial({ id: editingMatId, ...payload } as DoutrinarioMaterial);
      } else {
        await dataService.addDoutrinarioMaterial(payload as any);
      }

      setMatName('');
      setMatType('LIVRO');
      setMatAuthor('');
      setMatCategory('OBRAS_BASICAS');
      setMatObservations('');
      setEditingMatId(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMaterial = (item: DoutrinarioMaterial) => {
    setEditingMatId(item.id);
    setMatName(item.name);
    setMatType(item.type);
    setMatAuthor(item.author);
    setMatCategory(item.category);
    setMatObservations(item.observations || '');
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Deseja excluir este material do acervo doutrinário?')) return;
    try {
      await dataService.deleteDoutrinarioMaterial(id);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // 4. REUNIÕES / ATAS
  const handleSaveReuniao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuDate || !reuSubjects) return;

    const participantList = reuParticipants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const payload = {
      date: reuDate,
      participants: participantList,
      subjects: reuSubjects,
      decisions: reuDecisions,
      forwardings: reuForwardings
    };

    try {
      if (editingReuId) {
        await dataService.updateDoutrinarioReuniao({ id: editingReuId, ...payload } as DoutrinarioReuniao);
      } else {
        await dataService.addDoutrinarioReuniao(payload as any);
      }

      setReuDate('');
      setReuParticipants('');
      setReuSubjects('');
      setReuDecisions('');
      setReuForwardings('');
      setEditingReuId(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReuniao = (item: DoutrinarioReuniao) => {
    setEditingReuId(item.id);
    setReuDate(item.date);
    setReuParticipants(item.participants.join(', '));
    setReuSubjects(item.subjects);
    setReuDecisions(item.decisions);
    setReuForwardings(item.forwardings);
  };

  const handleDeleteReuniao = async (id: string) => {
    if (!confirm('Deseja excluir esta ata de reunião?')) return;
    try {
      await dataService.deleteDoutrinarioReuniao(id);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // 5. TRABALHADORES (SCALES)
  const handleSaveTrabalhador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabName || !trabArea) return;

    const payload = {
      name: trabName,
      role: trabRole,
      area: trabArea,
      houseTime: trabHouseTime || undefined,
      availability: trabAvailability,
      contact: trabContact
    };

    try {
      if (editingTrabId) {
        await dataService.updateDoutrinarioTrabalhador({ id: editingTrabId, ...payload } as DoutrinarioTrabalhador);
      } else {
        await dataService.addDoutrinarioTrabalhador(payload as any);
      }

      setTrabName('');
      setTrabRole('EXPOSITOR');
      setTrabArea('');
      setTrabHouseTime('');
      setTrabAvailability('');
      setTrabContact('');
      setEditingTrabId(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTrabalhador = (item: DoutrinarioTrabalhador) => {
    setEditingTrabId(item.id);
    setTrabName(item.name);
    setTrabRole(item.role);
    setTrabArea(item.area);
    setTrabHouseTime(item.houseTime || '');
    setTrabAvailability(item.availability);
    setTrabContact(item.contact);
  };

  const handleDeleteTrabalhador = async (id: string) => {
    if (!confirm('Deseja remover este trabalhador doutrinário?')) return;
    try {
      await dataService.deleteDoutrinarioTrabalhador(id);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. APOIO INTERSETORIAL (FORUM & COOPERATIONS)
  const handleSaveApoio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apoFromSector || !apoTitle) return;

    const payload = {
      fromSector: apoFromSector,
      title: apoTitle,
      description: apoDesc,
      status: 'PENDENTE' as const,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await dataService.addDoutrinarioApoio(payload);
      setApoFromSector('');
      setApoTitle('');
      setApoDesc('');
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveApoio = async (item: DoutrinarioApoio) => {
    if (!apoResponse) return alert('Por favor, informe a resposta técnica / resolução doutrinária para o setor solicitante.');
    try {
      const updated: DoutrinarioApoio = {
        ...item,
        status: 'ATENDIDO',
        response: apoResponse
      };
      await dataService.updateDoutrinarioApoio(updated);
      setApoResponse('');
      setEditingApoId(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApoio = async (id: string) => {
    if (!confirm('Remover esta solicitação de cooperação intersetorial?')) return;
    try {
      await dataService.deleteDoutrinarioApoio(id);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  // 7. DIRETRIZES
  const handleSaveDiretriz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirTitle || !dirResponsible) return;

    const payload = {
      title: dirTitle,
      category: dirCategory,
      responsible: dirResponsible,
      observations: dirObservations,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      if (editingDirId) {
        await dataService.updateDoutrinarioDiretriz({ id: editingDirId, ...payload } as DoutrinarioDiretriz);
      } else {
        await dataService.addDoutrinarioDiretriz(payload as any);
      }

      setDirTitle('');
      setDirCategory('Manuais');
      setDirResponsible('');
      setDirObservations('');
      setEditingDirId(null);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditDiretriz = (item: DoutrinarioDiretriz) => {
    setEditingDirId(item.id);
    setDirTitle(item.title);
    setDirCategory(item.category);
    setDirResponsible(item.responsible);
    setDirObservations(item.observations || '');
  };

  const handleDeleteDiretriz = async (id: string) => {
    if (!confirm('Deseja excluir esta circular/diretriz?')) return;
    try {
      await dataService.deleteDoutrinarioDiretriz(id);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  // --- FILTERED DATA BY SEARCH BAR ---
  const filteredExpositores = expositores.filter(ex => 
    ex.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (ex.city && ex.city.toLowerCase().includes(searchText.toLowerCase())) ||
    (ex.themes && ex.themes.toLowerCase().includes(searchText.toLowerCase()))
  );

  const filteredPalestras = palestras.filter(pal =>
    pal.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (pal.speakerName && pal.speakerName.toLowerCase().includes(searchText.toLowerCase()))
  );

  const filteredMateriais = materiais.filter(m =>
    m.name.toLowerCase().includes(searchText.toLowerCase()) ||
    m.author.toLowerCase().includes(searchText.toLowerCase()) ||
    m.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredReunioes = reunioes.filter(reu =>
    reu.subjects.toLowerCase().includes(searchText.toLowerCase()) ||
    reu.decisions.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredTrabalhadores = trabalhadores.filter(t =>
    t.name.toLowerCase().includes(searchText.toLowerCase()) ||
    t.role.toLowerCase().includes(searchText.toLowerCase()) ||
    t.area.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredApoios = apoios.filter(ap =>
    ap.fromSector.toLowerCase().includes(searchText.toLowerCase()) ||
    ap.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDiretrizes = diretrizes.filter(d =>
    d.title.toLowerCase().includes(searchText.toLowerCase()) ||
    d.responsible.toLowerCase().includes(searchText.toLowerCase())
  );

  const navItems = [
    { id: 'EXPOSITORES', label: 'Gestão de Expositores', icon: Users },
    { id: 'PALESTRAS', label: 'Agenda de Palestras', icon: Calendar },
    { id: 'BIBLIOTECA', label: 'Biblioteca & Acervo', icon: BookOpen },
    { id: 'REUNIOES', label: 'Atas de Reuniões', icon: NotebookPen },
    { id: 'TRABALHADORES', label: 'Escalas & Trabalhadores', icon: Briefcase },
    { id: 'APOIO', label: 'Apoio Intersetorial', icon: HelpCircle },
    { id: 'DIRETRIZES', label: 'Diretrizes & Normas', icon: FileText },
  ] as const;

  return (
    <div className="w-full bg-slate-50 rounded-[48px] border border-gray-100 p-8 sm:p-12 shadow-sm text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200/60 pb-10 mb-10">
        <div>
          <span className="px-5 py-2 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 tracking-wider uppercase">
            Coordenação e Unidade Doutrinária
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic mt-3 flex items-center gap-3">
            <Compass className="text-indigo-600 animate-spin-slow" size={32} />
            Setor Doutrinário
          </h2>
          <p className="text-gray-500 mt-2 text-sm max-w-xl">
            Apoio, unificação temática, manual de diretrizes para expositores e integração doutrinária com todos os setores da casa espírita.
          </p>
        </div>

        {/* Global Toolbar Search */}
        <div className="relative w-full lg:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Pesquisar neste setor..."
            className="w-full pl-11 pr-5 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all text-gray-700"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button 
              onClick={() => setSearchText('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 mb-10 border-b border-gray-100 pb-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSearchText('');
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                active 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' 
                  : 'bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} className={active ? 'text-white' : 'text-indigo-500'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium mt-4">Sincronizando com o centro doutrinário...</p>
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          {/* TAB 1: SPEAKERS */}
          {activeTab === 'EXPOSITORES' && (
            <motion.div 
              key="expositores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              {/* Form card */}
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingExpId ? 'Editar Expositor' : 'Cadastrar Expositor'}</span>
                  <Users size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveExpositor} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nome Completo</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Haroldo Dutra Dias"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={expName}
                      onChange={e => setExpName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Telefone</label>
                      <input 
                        type="text"
                        placeholder="(31) 99888-7766"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={expPhone}
                        onChange={e => setExpPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">E-mail</label>
                      <input 
                        type="email"
                        placeholder="exemplo@gmail.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={expEmail}
                        onChange={e => setExpEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Centro de Origem</label>
                    <input 
                      type="text"
                      placeholder="Ex: União Espírita Mineira"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={expCenter}
                      onChange={e => setExpCenter(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cidade - UF</label>
                      <input 
                        type="text"
                        placeholder="Ex: Belo Horizonte - MG"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={expCity}
                        onChange={e => setExpCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Disponibilidade</label>
                      <input 
                        type="text"
                        placeholder="Ex: Fins de semana"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={expAvailability}
                        onChange={e => setExpAvailability(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Temas / Linhas de Estudo</label>
                    <input 
                      type="text"
                      placeholder="Ex: O Novo Testamento, Espiritismo e Ciência"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={expThemes}
                      onChange={e => setExpThemes(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Observações Científicas / Postura</label>
                    <textarea 
                      rows={2}
                      placeholder="..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={expObservations}
                      onChange={e => setExpObservations(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingExpId ? 'Atualizar Expositor' : 'Confirmar Cadastro'}
                    </button>
                    {editingExpId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingExpId(null);
                          setExpName('');
                          setExpPhone('');
                          setExpEmail('');
                          setExpCenter('');
                          setExpCity('');
                          setExpThemes('');
                          setExpAvailability('');
                          setExpObservations('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-250 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Cadastros Ativos ({filteredExpositores.length})
                  </h4>
                </div>

                {filteredExpositores.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhum palestrante / expositor encontrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExpositores.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-gray-900 line-clamp-1">{item.name}</h5>
                              <p className="text-xs font-semibold text-indigo-600 mt-0.5">{item.spiritistCenter || 'Centro Independente'}</p>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditExpositor(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteExpositor(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1 bg-slate-50 p-3 rounded-2xl">
                            {item.city && <p className="line-clamp-1">🌍 <strong>Local:</strong> {item.city}</p>}
                            {item.phone && <p>📞 <strong>Tel:</strong> {item.phone}</p>}
                            {item.email && <p className="line-clamp-1">✉️ <strong>Email:</strong> {item.email}</p>}
                            {item.availability && <p className="line-clamp-1">🕒 <strong>Disp:</strong> {item.availability}</p>}
                          </div>

                          {item.themes && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Especialidades:</span>
                              <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-0.5">{item.themes}</p>
                            </div>
                          )}
                        </div>

                        {item.observations && (
                          <div className="mt-4 pt-3 border-t border-gray-100/60 text-xs text-gray-400 italic font-medium">
                            "{item.observations}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: PUBLIC LECTURES */}
          {activeTab === 'PALESTRAS' && (
            <motion.div 
              key="palestras"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              {/* Form columns */}
              <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingPalId ? 'Editar Palestra' : 'Agendar Palestra'}</span>
                  <Calendar size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSavePalestra} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título Temático</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: A Imortalidade da Alma"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={palTitle}
                      onChange={e => setPalTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Alinhamento Científico</label>
                    <textarea 
                      rows={2}
                      placeholder="Explique o viés espiritualista ou obras-base..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={palDesc}
                      onChange={e => setPalDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Data</label>
                      <input 
                        type="date"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={palDate}
                        onChange={e => setPalDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Horário</label>
                      <input 
                        type="time"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={palTime}
                        onChange={e => setPalTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Associar Expositor Cadastrado</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={palSpeakerId}
                      onChange={e => setPalSpeakerId(e.target.value)}
                    >
                      <option value="">Sem expositor fixo (Tema Aberto / Variados)</option>
                      {expositores.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.spiritistCenter})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Local da Palestra</label>
                    <input 
                      type="text"
                      placeholder="Ex: Salão de Conferências Principal"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={palLocation}
                      onChange={e => setPalLocation(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Responsável</label>
                      <input 
                        type="text"
                        placeholder="Ex: Gabriel Chaves"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={palResponsible}
                        onChange={e => setPalResponsible(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Público Esperado</label>
                      <input 
                        type="number"
                        placeholder="Ex: 80"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={palExpectedPublic}
                        onChange={e => setPalExpectedPublic(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} />
                      {editingPalId ? 'Atualizar Palestra' : 'Confirmar Agenda'}
                    </button>
                    {editingPalId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingPalId(null);
                          setPalTitle('');
                          setPalDesc('');
                          setPalDate('');
                          setPalTime('');
                          setPalSpeakerId('');
                          setPalLocation('');
                          setPalResponsible('');
                          setPalExpectedPublic('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Agenda */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Cronograma de Palestras Recorrentes ({filteredPalestras.length})
                  </h4>
                </div>

                {filteredPalestras.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhuma palestra agendada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPalestras.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group"
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-100">
                                  Público Espírita
                                </span>
                                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                  <Clock size={12} />
                                  {item.time || '20:00'} hs
                                </span>
                              </div>
                              <h5 className="font-bold text-lg text-gray-900 mt-2">{item.title}</h5>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditPalestra(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeletePalestra(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 leading-relaxed font-normal">
                            {item.description || 'Abordagem filosófica geral sobre os preceitos do consolador prometido.'}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 pt-2 bg-slate-50/60 p-4 rounded-2xl border border-dashed border-gray-100">
                            <div>
                              <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Palestrante:</span>
                              <span className="font-semibold text-indigo-700">{item.speakerName || 'Coletivo / Doutrinário'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Local:</span>
                              <span className="font-semibold text-gray-800">{item.location || 'Salão'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Coordenador:</span>
                              <span className="font-semibold text-gray-800">{item.responsible || 'Coordenador'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider">Público Estimado:</span>
                              <span className="font-semibold text-gray-800">~{item.expectedPublic || 60} pessoas</span>
                            </div>
                          </div>
                        </div>

                        {/* Calendar Icon Badge */}
                        <div className="p-4 bg-indigo-50/80 rounded-3xl border border-indigo-100/50 flex flex-col items-center justify-center min-w-24 text-center self-start md:self-auto">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                            {item.date ? new Date(item.date).toLocaleString('default', { month: 'short' }) : 'Dia'}
                          </span>
                          <span className="text-2xl font-black text-indigo-800 tracking-tighter">
                            {item.date ? new Date(item.date).getDate() : '??'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: BIBLIOTECA & ACERVO */}
          {activeTab === 'BIBLIOTECA' && (
            <motion.div 
              key="biblioteca"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingMatId ? 'Editar Material' : 'Catalogar Livro / Recurso'}</span>
                  <BookMarked size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveMaterial} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título do Material / Livro</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: O Livro dos Espíritos"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={matName}
                      onChange={e => setMatName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Formato</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-1000"
                        value={matType}
                        onChange={e => setMatType(e.target.value as any)}
                      >
                        <option value="LIVRO">Livro Físico</option>
                        <option value="APOSTILA">Apostila de Estudo</option>
                        <option value="PDF">Documento PDF</option>
                        <option value="AUDIO">Áudio / Gravação</option>
                        <option value="VIDEO">Vídeo / Conferência</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Categoria Temática</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-1000"
                        value={matCategory}
                        onChange={e => setMatCategory(e.target.value as any)}
                      >
                        <option value="OBRAS_BASICAS">Obras Básicas (Kardec)</option>
                        <option value="MEDIUNIDADE">Módulo Mediunidade</option>
                        <option value="EVANGELIZACAO">Evangelização Infantil</option>
                        <option value="ESTUDOS">Estudos / Ensino (ESDE/EEM)</option>
                        <option value="REFORMA_INTIMA">Reforma Íntima / Apoio</option>
                        <option value="ATENDIMENTO_FRATERNO">Atendimento Fraterno</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Autor / Mentor Espiritual</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Allan Kardec / Emmanuel"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={matAuthor}
                      onChange={e => setMatAuthor(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Prateleira / Observações de Empréstimo</label>
                    <textarea 
                      rows={3}
                      placeholder="Disponível para estudo ou somente consulta..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={matObservations}
                      onChange={e => setMatObservations(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingMatId ? 'Atualizar Registro' : 'Confirmar Cadastro'}
                    </button>
                    {editingMatId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingMatId(null);
                          setMatName('');
                          setMatType('LIVRO');
                          setMatAuthor('');
                          setMatCategory('OBRAS_BASICAS');
                          setMatObservations('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List acervo */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Acervo Doutrinário Consolidado ({filteredMateriais.length})
                  </h4>
                </div>

                {filteredMateriais.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhum material cadastrado nesta prateleira.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMateriais.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 bg-indigo-50/70 text-indigo-600 rounded-2xl flex-shrink-0">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 mt-1">
                              Por <strong className="text-gray-700">{item.author}</strong> • <span className="text-indigo-600 font-semibold">{item.category}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditMaterial(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMaterial(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: REUNIÕES / ATAS */}
          {activeTab === 'REUNIOES' && (
            <motion.div 
              key="reunioes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingReuId ? 'Editar Ata' : 'Definir Ata de Reunião'}</span>
                  <NotebookPen size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveReuniao} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Data do Encontro</label>
                    <input 
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={reuDate}
                      onChange={e => setReuDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Participantes (separados por vírgula)</label>
                    <input 
                      type="text"
                      placeholder="Ex: Gabriel Chaves, Haroldo Dias, Chico Xavier"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={reuParticipants}
                      onChange={e => setReuParticipants(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Assuntos Tratados / Avaliações</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Alinhamento doutrinário com o passe, análise e revisões de livros..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={reuSubjects}
                      onChange={e => setReuSubjects(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Decisões Tomadas</label>
                    <textarea 
                      rows={2}
                      placeholder="..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={reuDecisions}
                      onChange={e => setReuDecisions(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Encaminhamentos / Responsáveis</label>
                    <textarea 
                      rows={2}
                      placeholder="..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={reuForwardings}
                      onChange={e => setReuForwardings(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingReuId ? 'Atualizar Ata' : 'Salvar Ata'}
                    </button>
                    {editingReuId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingReuId(null);
                          setReuDate('');
                          setReuParticipants('');
                          setReuSubjects('');
                          setReuDecisions('');
                          setReuForwardings('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-250 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Atas */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Histórico de Reuniões ({filteredReunioes.length})
                  </h4>
                </div>

                {filteredReunioes.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <NotebookPen size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhuma ata cadastrada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReunioes.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                          <span className="text-sm font-extrabold text-indigo-700">🗓️ {item.date}</span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditReuniao(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteReuniao(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p>👥 <strong>Participantes:</strong> {item.participants.join(', ')}</p>
                          <p>📝 <strong>Assuntos:</strong> {item.subjects}</p>
                          {item.decisions && <p>⚖️ <strong>Decisões:</strong> {item.decisions}</p>}
                          {item.forwardings && <p>➡️ <strong>Encaminhamentos:</strong> {item.forwardings}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: TRABALHADORES & ACTIVITES SCALES */}
          {activeTab === 'TRABALHADORES' && (
            <motion.div 
              key="trabalhadores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingTrabId ? 'Editar Escala' : 'Alocar Trabalhador'}</span>
                  <Briefcase size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveTrabalhador} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nome do Trabalhador</label>
                    <input 
                      type="text"
                      required
                      placeholder="Roberto Shinyashiki"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={trabName}
                      onChange={e => setTrabName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Função</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={trabRole}
                        onChange={e => setTrabRole(e.target.value as any)}
                      >
                        <option value="EXPOSITOR">Expositor Doutrinário</option>
                        <option value="REVISOR">Revisor de Temática</option>
                        <option value="COORDENADOR">Coordenador do Setor</option>
                        <option value="APOIO_DOUTRINARIO">Apoio Doutrinário</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tempo de Casa</label>
                      <input 
                        type="text"
                        placeholder="Ex: 5 anos"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={trabHouseTime}
                        onChange={e => setTrabHouseTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Área Designada / Escala</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Palestras Públicas de Segunda-Feira"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={trabArea}
                      onChange={e => setTrabArea(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Contato</label>
                      <input 
                        type="text"
                        placeholder="(31) 98888-2222"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={trabContact}
                        onChange={e => setTrabContact(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Periodicidade</label>
                      <input 
                        type="text"
                        placeholder="Ex: Segundas, 19:00"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={trabAvailability}
                        onChange={e => setTrabAvailability(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingTrabId ? 'Atualizar Escala' : 'Fixar Escala'}
                    </button>
                    {editingTrabId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingTrabId(null);
                          setTrabName('');
                          setTrabRole('EXPOSITOR');
                          setTrabArea('');
                          setTrabHouseTime('');
                          setTrabAvailability('');
                          setTrabContact('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Workers */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Trabalhadores Ativos do Setor ({filteredTrabalhadores.length})
                  </h4>
                </div>

                {filteredTrabalhadores.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhum trabalhador matriculado na escala doutrinária.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTrabalhadores.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="p-3 bg-indigo-50/70 text-indigo-600 rounded-2xl flex-shrink-0">
                            <User size={18} />
                          </span>
                          <div>
                            <h5 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 mt-1">
                              Função: <strong className="text-indigo-600">{item.role}</strong> | Área: <span className="font-semibold">{item.area}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-100 text-slate-500">
                            {item.availability}
                          </span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditTrabalhador(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTrabalhador(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: CROSS-SECTOR ASSISTANCE */}
          {activeTab === 'APOIO' && (
            <motion.div 
              key="apoio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>Cooperar com outro Setor</span>
                  <HelpCircle size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveApoio} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Setor Solicitante</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Passe / Comunicação e Mídias / Social"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={apoFromSector}
                      onChange={e => setApoFromSector(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título Temático do Auxílio</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Sugestão de posts doutrinários"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={apoTitle}
                      onChange={e => setApoTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descrição Curta da Demanda / Dúvida</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Preciso de ajuda com a postagem sobre imortalidade..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={apoDesc}
                      onChange={e => setApoDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2 pt-3"
                  >
                    <Plus size={16} />
                    Abrir Chamado de Auxílio Doutrinário
                  </button>
                </form>
              </div>

              {/* List Demands */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Fluxo Cooperativo Intersetorial ({filteredApoios.length})
                  </h4>
                </div>

                {filteredApoios.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <HelpCircle size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhuma cooperação doutrinária pendente de alinhamento com outros setores.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApoios.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-3 relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                              item.status === 'PENDENTE' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {item.status}
                            </span>
                            <h5 className="font-bold text-gray-900 mt-2">{item.title}</h5>
                            <p className="text-xs text-indigo-600 font-semibold">Solicitado por: {item.fromSector} (em {item.date})</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteApoio(item.id)}
                            className="p-1.5 text-slate-450 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed font-normal bg-slate-50 p-3 rounded-2xl">
                          {item.description}
                        </p>

                        {item.status === 'ATENDIDO' && item.response && (
                          <div className="text-xs text-slate-600 bg-emerald-50/50 p-4 border border-dashed border-emerald-100 rounded-2xl space-y-1">
                            <span className="block font-black uppercase tracking-wider text-[9px] text-emerald-700">Parecer Técnico Doutrinário:</span>
                            <p className="font-medium italic">"{item.response}"</p>
                          </div>
                        )}

                        {item.status === 'PENDENTE' && (
                          <div className="pt-2">
                            {editingApoId === item.id ? (
                              <div className="space-y-3 pt-2">
                                <textarea
                                  rows={3}
                                  placeholder="Escreva a resolução / subsídio doutrinário técnico oficial..."
                                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-gray-800"
                                  value={apoResponse}
                                  onChange={e => setApoResponse(e.target.value)}
                                ></textarea>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleResolveApoio(item)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5"
                                  >
                                    <Clock size={12} />
                                    Enviar Resolução
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingApoId(null);
                                      setApoResponse('');
                                    }}
                                    className="px-3 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-lg text-xs font-semibold"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingApoId(item.id)}
                                className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                              >
                                Responder Demanda <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 7: PUBLIC DIRECTIVES */}
          {activeTab === 'DIRETRIZES' && (
            <motion.div 
              key="diretrizes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-5 bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm self-start">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4 mb-6 italic flex items-center justify-between">
                  <span>{editingDirId ? 'Editar Diretriz' : 'Publicar Diretriz'}</span>
                  <ShieldCheck size={18} className="text-indigo-500" />
                </h3>

                <form onSubmit={handleSaveDiretriz} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Título / Nome Circular</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Regulamento de Expositores Espíritas"
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={dirTitle}
                      onChange={e => setDirTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Categoria</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={dirCategory}
                        onChange={e => setDirCategory(e.target.value)}
                      >
                        <option value="Manuais">Manuais de Conduta</option>
                        <option value="Guias">Guias Temáticos</option>
                        <option value="Normas">Normatizações Básicas</option>
                        <option value="Circulares">Circulares Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Responsável</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Gabriel Chaves"
                        className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                        value={dirResponsible}
                        onChange={e => setDirResponsible(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Regulamento Completo / Conteúdo Doutrinário</label>
                    <textarea 
                      rows={5}
                      placeholder="..."
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-800"
                      value={dirObservations}
                      onChange={e => setDirObservations(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 text-xs tracking-wider uppercase flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingDirId ? 'Atualizar Normativa' : 'Publicar Normativa'}
                    </button>
                    {editingDirId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingDirId(null);
                          setDirTitle('');
                          setDirCategory('Manuais');
                          setDirResponsible('');
                          setDirObservations('');
                        }}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Directives */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Instruções Normativas Ativas ({filteredDiretrizes.length})
                  </h4>
                </div>

                {filteredDiretrizes.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center text-gray-400">
                    <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                    Nenhuma instrução normativa ou circular oficial ativa.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDiretrizes.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-100 text-slate-600 uppercase">
                              🛡️ {item.category}
                            </span>
                            <h5 className="font-bold text-gray-900 text-lg mt-2">{item.title}</h5>
                            <p className="text-xs text-indigo-600 font-semibold mb-2">Publicado por {item.responsible} (em {item.date})</p>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditDiretriz(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteDiretriz(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {item.observations && (
                          <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed bg-slate-50 p-4 border border-gray-150 rounded-2xl font-normal col-span-2">
                            {item.observations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
