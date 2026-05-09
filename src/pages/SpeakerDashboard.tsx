import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Mic2, 
  Search,
  BookOpen,
  CalendarCheck,
  Star,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { AgendaEvent, Speaker } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SpeakerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<AgendaEvent[]>([]);
  const [totalSpeakers, setTotalSpeakers] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [events, speakers] = await Promise.all([
        dataService.getAgendaEvents(),
        dataService.getSpeakers()
      ]);
      
      const today = new Date().setHours(0,0,0,0);
      const upcoming = events
        .filter(e => e.date >= today)
        .sort((a,b) => a.date - b.date)
        .slice(0, 3);

      setUpcomingEvents(upcoming);
      setTotalSpeakers(speakers.length);
    } catch (err) {
      console.error("Error loading speaker dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-12 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-indigo-900 rounded-[60px] p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-20 -translate-y-20">
          <Mic2 size={400} />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/30 rounded-full text-xs font-black uppercase tracking-[0.3em]">
            <Star size={14} className="fill-current" />
            <span>Área do Orador</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
            A Palavra que <span className="text-indigo-400">Ilumina</span>
          </h1>
          <p className="text-xl text-indigo-100 font-medium">Gerencie suas palestras, temas e escalas de oratória da casa.</p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => navigate('/agenda')}
              className="px-8 py-4 bg-white text-indigo-900 rounded-[28px] font-black shadow-2xl shadow-indigo-950/20 hover:scale-105 transition-all text-sm uppercase tracking-widest"
            >
              Ver Agenda Completa
            </button>
            <button 
              onClick={() => navigate('/palestrantes')}
              className="px-8 py-4 bg-indigo-800 text-white border border-indigo-700/50 rounded-[28px] font-black hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest"
            >
              Lista de Oradores
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upcoming Lectures */}
        <div className="lg:col-span-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
              <CalendarCheck size={28} className="text-indigo-600" />
              Próximas Palestras Agendadas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
              >
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center justify-between">
                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                       {event.type}
                     </span>
                     <p className="text-sm font-bold text-gray-400">
                       {format(event.date, "dd/MM", { locale: ptBR })}
                     </p>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight italic">
                    {event.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Mic2 size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Responsável</p>
                      <p className="text-xs font-bold text-gray-700">{event.speakerName || 'A definir'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                <BookOpen size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="font-medium text-gray-500">Nenhuma palestra agendada para os próximos dias.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
