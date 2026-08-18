import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, Clock, ShieldCheck, X, AlertCircle, Phone, Sparkles, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { ScheduleReminder } from '../types';

interface ScheduleRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorName?: string;
  workersToRemind?: Array<{ name: string; phone?: string; day: string; shift: string }>;
}

export const ScheduleRemindersModal: React.FC<ScheduleRemindersModalProps> = ({
  isOpen,
  onClose,
  sectorName = 'Setor Geral',
  workersToRemind = []
}) => {
  const [reminders, setReminders] = useState<ScheduleReminder[]>([]);
  const [customMsg, setCustomMsg] = useState('Olá! Lembramos da sua escala de voluntariado na Casa Espírita. Contamos com sua presença ilumina!');
  const [lastSent, setLastSent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  const loadReminders = async () => {
    const list = await dataService.getScheduleReminders();
    setReminders(list || []);
  };

  const handleSendSingleWhatsApp = (name: string, phone: string, dateStr: string, shiftStr: string) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const message = `Olá ${name}! 🌿\n\nLembramos da sua escala de trabalho voluntário no setor *${sectorName}*:\n📅 *Data:* ${dateStr}\n⏰ *Turno:* ${shiftStr}\n\n${customMsg}\n\nFraterno abraço!`;
    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    setLastSent(`Mensagem enviada para ${name}`);
    setTimeout(() => setLastSent(null), 3000);
  };

  const handleBatchSchedule = async () => {
    for (const w of workersToRemind) {
      await dataService.addScheduleReminder({
        workerName: w.name,
        workerPhone: w.phone || 'Sem telefone',
        sectorName,
        date: w.day,
        shift: w.shift,
        status: 'PENDENTE'
      });
    }
    setLastSent(`Agendados ${workersToRemind.length} lembretes automáticos na fila!`);
    loadReminders();
    setTimeout(() => setLastSent(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Disparo e Lembretes de Escala</h2>
                <p className="text-xs text-slate-500 font-medium">Envio de confirmações via WhatsApp e fila automatizada</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {lastSent && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="text-emerald-600" size={18} />
              <span>{lastSent}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Mensagem Padrão do Lembrete</label>
            <textarea 
              rows={3}
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* List of Workers in current schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Voluntários Escalados ({workersToRemind.length})</h3>
              {workersToRemind.length > 0 && (
                <button
                  onClick={handleBatchSchedule}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Agendar Todos na Fila
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {workersToRemind.length > 0 ? (
                workersToRemind.map((w, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{w.name}</div>
                      <div className="text-xs text-slate-500">Escala: {w.day} ({w.shift}) • Tel: {w.phone || 'Não informado'}</div>
                    </div>
                    <button
                      onClick={() => handleSendSingleWhatsApp(w.name, w.phone || '', w.day, w.shift)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Send size={12} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Nenhum voluntário selecionado no momento.
                </div>
              )}
            </div>
          </div>

          {/* Queue history */}
          {reminders.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fila de Lembretes do Sistema ({reminders.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {reminders.slice(0, 5).map(r => (
                  <div key={r.id} className="p-2 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{r.workerName} - {r.sectorName} ({r.date})</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Official Meta API Guide */}
          <div className="pt-3 border-t border-slate-100 p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <FileText size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Guia de Cadastramento WhatsApp Cloud API (Meta)</div>
                <div className="text-[11px] text-slate-500">Instruções completas para cadastrar o App e obter as chaves oficiais.</div>
              </div>
            </div>
            <a 
              href="/Guia_Integracao_WhatsApp_Meta.txt" 
              download="Guia_Integracao_WhatsApp_Meta.txt"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Download size={14} />
              <span>Baixar Guia (.txt)</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
