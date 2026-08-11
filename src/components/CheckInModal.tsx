import React, { useState, useEffect } from 'react';
import { QrCode, Search, CheckCircle, UserCheck, ShieldCheck, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { Participant, Worker, AttendanceCheckIn } from '../types';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [sector, setSector] = useState('Geral / Atendimento');
  const [role, setRole] = useState<'FREQUENTADOR' | 'VOLUNTARIO' | 'ATENDIDO'>('FREQUENTADOR');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<AttendanceCheckIn[]>([]);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const [pList, wList, cList] = await Promise.all([
      dataService.getParticipants(),
      dataService.getWorkers(),
      dataService.getAttendanceCheckIns()
    ]);
    setParticipants(pList || []);
    setWorkers(wList || []);
    setRecentCheckIns(cList || []);
  };

  const handleQuickCheckIn = async (personName: string, personId: string, typeRole: 'FREQUENTADOR' | 'VOLUNTARIO' | 'ATENDIDO') => {
    setLoading(true);
    try {
      await dataService.recordCheckIn({
        participantId: personId,
        participantName: personName,
        role: typeRole,
        sectorOrActivity: sector,
        timestamp: Date.now(),
        method: code ? 'QR_CODE' : 'MANUAL',
        status: 'PRESENTE'
      });
      
      setLastSuccess(`Presença confirmada para ${personName}!`);
      setCode('');
      loadData();
      if (onSuccess) onSuccess();
      setTimeout(() => setLastSuccess(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const query = code.trim().toLowerCase();
    
    // Find worker or participant by ID, code or name
    const foundWorker = workers.find(w => w.id.toLowerCase() === query || w.name.toLowerCase().includes(query));
    if (foundWorker) {
      handleQuickCheckIn(foundWorker.name, foundWorker.id, 'VOLUNTARIO');
      return;
    }

    const foundPart = participants.find(p => p.id.toLowerCase() === query || p.name.toLowerCase().includes(query));
    if (foundPart) {
      handleQuickCheckIn(foundPart.name, foundPart.id, 'FREQUENTADOR');
      return;
    }

    // Direct check-in by name if not found in DB
    handleQuickCheckIn(code.trim(), `manual_${Date.now()}`, role);
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
                <QrCode size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Check-In Inteligente de Frequência</h2>
                <p className="text-xs text-slate-500 font-medium">Escaneie o QR Code, insira o código de barras ou pesquise o nome</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {lastSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-bold text-sm"
            >
              <CheckCircle className="text-emerald-600" size={20} />
              <span>{lastSuccess}</span>
            </motion.div>
          )}

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Setor / Atividade</label>
                <input 
                  type="text" 
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Passe / Palestra / Sopa"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Perfil Padrão</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FREQUENTADOR">Frequentador</option>
                  <option value="VOLUNTARIO">Voluntário / Trabalhador</option>
                  <option value="ATENDIDO">Assistido / Atendido</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Código de Barras / QR Code / Nome</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-28 py-3.5 bg-slate-50 border-2 border-indigo-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Escaneie ou digite o código/nome..."
                />
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                <button 
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </form>

          {/* Quick Selection List */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <UserCheck size={14} className="text-indigo-600" />
              <span>Confirmar Presença Rápida (Clique para Registrar)</span>
            </h3>
            
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {workers.slice(0, 4).map(w => (
                <div 
                  key={w.id} 
                  onClick={() => handleQuickCheckIn(w.name, w.id, 'VOLUNTARIO')}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                      {w.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-900">{w.name}</div>
                      <div className="text-xs text-slate-500">Voluntário • {w.role}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white px-3 py-1 rounded-xl transition-all">
                    Registrar
                  </span>
                </div>
              ))}

              {participants.slice(0, 4).map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleQuickCheckIn(p.name, p.id, 'FREQUENTADOR')}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">{p.name}</div>
                      <div className="text-xs text-slate-500">Frequentador • Telef: {p.phone || 'N/A'}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white px-3 py-1 rounded-xl transition-all">
                    Registrar
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Check-Ins */}
          {recentCheckIns.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Últimos Check-ins do Dia ({recentCheckIns.length})</h4>
              <div className="flex flex-wrap gap-2">
                {recentCheckIns.slice(0, 5).map(c => (
                  <span key={c.id} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1 rounded-xl font-medium">
                    ✓ {c.participantName} ({new Date(c.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
