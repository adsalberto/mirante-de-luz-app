import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  X, 
  ChevronRight,
  Mic2,
  Trash2,
  CalendarDays,
  Pencil
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AgendaEvent, Speaker, Worker } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'speakers'>('events');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingSpeakerId, setDeletingSpeakerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'DOUTRINARIA' as AgendaEvent['type'],
    speakerId: ''
  });

  const [speakerFormData, setSpeakerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    spiritistCenter: '',
    observations: ''
  });

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RECEPCIONISTA') {
        navigate('/');
      }
    }
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    const [e, s] = await Promise.all([
      dataService.getAgendaEvents(),
      dataService.getSpeakers()
    ]);
    setEvents(e.sort((a,b) => a.date - b.date));
    setSpeakers(s);
  };

  const handleEdit = (event: AgendaEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      type: event.type,
      speakerId: event.speakerId || ''
    });
    setIsModalOpen(true);
  };

  const handleEditSpeaker = (s: Speaker) => {
    setEditingSpeaker(s);
    setSpeakerFormData({
      name: s.name,
      phone: s.phone,
      email: s.email,
      spiritistCenter: s.spiritistCenter,
      observations: s.observations || ''
    });
    setIsSpeakerModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: new Date(formData.date + 'T00:00:00').getTime()
      };

      if (editingEvent) {
        await dataService.updateAgendaEvent({ ...editingEvent, ...eventData });
        alert('Atividade atualizada com sucesso!');
      } else {
        await dataService.addAgendaEvent(eventData);
        alert('Atividade agendada com sucesso!');
      }
      
      setFormData({ title: '', description: '', date: '', time: '', type: 'DOUTRINARIA', speakerId: '' });
      setEditingEvent(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar atividade:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Ocorreu um erro ao salvar a atividade.');
      }
    }
  };

  const handleSpeakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpeaker) {
        await dataService.updateSpeaker({ ...editingSpeaker, ...speakerFormData });
        alert('Palestrante atualizado com sucesso!');
      } else {
        await dataService.addSpeaker(speakerFormData);
        alert('Palestrante cadastrado com sucesso!');
      }
      
      setSpeakerFormData({ name: '', phone: '', email: '', spiritistCenter: '', observations: '' });
      setEditingSpeaker(null);
      setIsSpeakerModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar palestrante:', err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || 'Sem permissão'}`);
      } catch {
        alert('Ocorreu um erro ao salvar os dados do palestrante.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await dataService.deleteAgendaEvent(id);
      setDeletingId(null);
      loadData();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleDeleteSpeaker = async (id: string) => {
    if (deletingSpeakerId === id) {
      await dataService.deleteSpeaker(id);
      setDeletingSpeakerId(null);
      loadData();
    } else {
      setDeletingSpeakerId(id);
      setTimeout(() => setDeletingSpeakerId(null), 3000);
    }
  };

  const getSpeakerName = (id?: string) => speakers.find(s => s.id === id)?.name || 'Nenhum palestrante cadastrado';

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda da Casa</h1>
          <p className="text-gray-500 font-medium font-serif italic">Controle de doutrinárias, estudo e atividades especiais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex">
            <button 
              onClick={() => setActiveTab('events')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'events' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Atividades
            </button>
            <button 
              onClick={() => setActiveTab('speakers')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'speakers' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Palestrantes
            </button>
          </div>
          {isAdmin && (
            <button 
              onClick={() => activeTab === 'events' ? setIsModalOpen(true) : setIsSpeakerModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} />
              <span>{activeTab === 'events' ? 'Marcar Atividade' : 'Cadastrar Palestrante'}</span>
            </button>
          )}
        </div>
      </header>

      {activeTab === 'events' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.length > 0 ? events.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col group overflow-hidden"
            >
              <div className={cn(
                "p-6 flex flex-col gap-4 flex-1",
                event.type === 'DOUTRINARIA' ? "bg-indigo-50/30" : 
                event.type === 'ESTUDO' ? "bg-emerald-50/30" : 
                event.type === 'FESTA' ? "bg-pink-50/30" : "bg-gray-50/30"
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    event.type === 'DOUTRINARIA' ? "bg-indigo-100 text-indigo-700" : 
                    event.type === 'ESTUDO' ? "bg-emerald-100 text-emerald-700" : 
                    event.type === 'FESTA' ? "bg-pink-100 text-pink-700" : "bg-gray-200 text-gray-700"
                  )}>
                    {event.type}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEdit(event)}
                        className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className={cn(
                          "p-2 transition-all rounded-lg flex items-center gap-1",
                          deletingId === event.id ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1" : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {deletingId === event.id ? "Confirma?" : <Trash2 size={16} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight line-clamp-1">{event.title}</h3>
                  <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{event.description}</p>
                </div>

                <div className="mt-auto pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <CalendarDays size={16} className="text-gray-400" />
                    <span>{format(event.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Clock size={16} className="text-gray-400" />
                    <span>{event.time}</span>
                  </div>
                  {event.speakerId && (
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-2xl border border-indigo-100/50 mt-4">
                      <Mic2 size={16} />
                      <span>{getSpeakerName(event.speakerId)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <CalendarIcon className="text-gray-200" size={40} />
              </div>
              <p className="text-gray-400 font-bold">Nenhuma atividade agendada.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {speakers.length > 0 ? speakers.map((s) => (
            <motion.div
              layout
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-black">
                  {(s.name || '?').charAt(0)}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditSpeaker(s)}
                      className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSpeaker(s.id)}
                      className={cn(
                        "p-2 transition-all rounded-lg flex items-center gap-1",
                        deletingSpeakerId === s.id ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1" : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {deletingSpeakerId === s.id ? "Confirma?" : <Trash2 size={16} />}
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{s.name}</h3>
              <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-4 bg-indigo-50/50 px-3 py-1 rounded-full w-fit">
                <span>{s.spiritistCenter}</span>
              </div>

              <div className="space-y-2 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-black">TEL:</span>
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-black">EMAIL:</span>
                  <span className="truncate">{s.email}</span>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold">
              Nenhum palestrante cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Modals remain mostly same but updated for reuse or duplicate for speed */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? 'Editar Atividade' : 'Agendar Atividade'}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingEvent(null); setFormData({ title: '', description: '', date: '', time: '', type: 'DOUTRINARIA', speakerId: '' }); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Título da Atividade</label>
                  <input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                    <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário</label>
                    <input required type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as AgendaEvent['type']})} className="w-full px-5 py-4 bg-gray-50 border-none font-bold text-gray-700 rounded-2xl outline-none">
                      <option value="DOUTRINARIA">Doutrinária</option>
                      <option value="ESTUDO">Estudo</option>
                      <option value="FESTA">Festa/Evento</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Palestrante</label>
                    <select value={formData.speakerId} onChange={(e) => setFormData({...formData, speakerId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none font-bold text-gray-700 rounded-2xl outline-none">
                      <option value="">Nenhum/Interno</option>
                      {speakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isSpeakerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSpeakerModalOpen(false)} className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">{editingSpeaker ? 'Editar Palestrante' : 'Novo Palestrante'}</h2>
                <button onClick={() => { setIsSpeakerModalOpen(false); setEditingSpeaker(null); setSpeakerFormData({ name: '', phone: '', email: '', spiritistCenter: '', observations: '' }); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSpeakerSubmit} className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                  <input required value={speakerFormData.name} onChange={(e) => setSpeakerFormData({...speakerFormData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                    <input required value={speakerFormData.phone} onChange={(e) => setSpeakerFormData({...speakerFormData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input required type="email" value={speakerFormData.email} onChange={(e) => setSpeakerFormData({...speakerFormData, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Centro Espírita</label>
                  <input required value={speakerFormData.spiritistCenter} onChange={(e) => setSpeakerFormData({...speakerFormData, spiritistCenter: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsSpeakerModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
