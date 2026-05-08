import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Search, Clock, User, Activity, FileText } from 'lucide-react';
import { dataService } from '../services/dataService';
import { AuditLog, Worker } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

export const LogsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await dataService.getLogs();
    setLogs(data);
  };

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.25em] mb-2">
            <ShieldCheck size={14} />
            <span>Segurança e Auditoria</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">
            Logs do Sistema
          </h1>
          <p className="text-gray-400 font-medium">Registro histórico de todas as alterações realizadas.</p>
        </div>
      </header>

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Pesquisar por usuário, ação ou detalhes..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[32px] font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data/Hora</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log, idx) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Clock size={14} />
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {format(log.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                        {(log.userName || '?').charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-2 max-w-md">
                      <FileText size={14} className="text-gray-300 mt-1 flex-shrink-0" />
                      <span className="text-xs text-gray-500 font-medium leading-relaxed">
                        {log.details || 'Sem detalhes adicionais.'}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                        <Activity size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Nenhum log encontrado</p>
                        <p className="text-xs text-gray-400">Tente ajustar seus termos de pesquisa.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
