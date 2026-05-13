import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Search, Clock, User, Activity, FileText, Printer, Calendar, Users } from 'lucide-react';
import { dataService } from '../services/dataService';
import { AuditLog, Worker } from '../types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const LogsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('all');

  useEffect(() => {
    loadLogs();
    loadWorkers();
  }, []);

  const loadLogs = async () => {
    const data = await dataService.getLogs();
    setLogs(data || []);
  };

  const loadWorkers = async () => {
    const data = await dataService.getWorkers();
    setWorkers(data || []);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUserId === 'all' || log.userId === selectedUserId;
    
    const logDate = new Date(log.timestamp);
    const matchesDate = (!startDate || logDate >= startOfDay(new Date(startDate))) && 
                       (!endDate || logDate <= endOfDay(new Date(endDate)));

    return matchesSearch && matchesUser && matchesDate;
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Data/Hora", "Usuário", "Ação", "Detalhes"];
    const tableRows: any[] = [];

    filteredLogs.forEach(log => {
      const logData = [
        format(log.timestamp, "dd/MM/yyyy HH:mm:ss"),
        log.userName,
        log.action.split(' | ').pop()?.replace('[', '').replace(']', '') || log.action,
        log.details || '-'
      ];
      tableRows.push(logData);
    });

    const userName = selectedUserId === 'all' ? 'Geral' : workers.find(w => w.id === selectedUserId)?.name || 'Usuário';
    const dateRange = startDate && endDate ? ` de ${format(new Date(startDate), "dd/MM/yyyy")} a ${format(new Date(endDate), "dd/MM/yyyy")}` : '';

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("Relatório de Auditoria - Mirante de Luz", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Filtro Selecionado: ${userName}`, 14, 28);
    doc.text(`Período: ${dateRange || 'Geral (Todo o histórico)'}`, 14, 33);
    doc.text(`Gerado por: ${currentUser?.email || 'Sistema'} em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 38);

    doc.setDrawColor(230, 230, 230);
    doc.line(14, 42, 196, 42);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 'auto' }
      }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, 196, 285, { align: 'right' });
      doc.text("Informação Confidencial - Mirante de Luz", 14, 285);
    }

    doc.save(`auditoria_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

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
        <button 
          onClick={generatePDF}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
        >
          <Printer size={18} />
          Gerar Relatório PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <Calendar size={12} /> Data Inicial
          </label>
          <input 
            type="date" 
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <Calendar size={12} /> Data Final
          </label>
          <input 
            type="date" 
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <Users size={12} /> Filtrar por Usuário
          </label>
          <select 
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="all">Todos os Usuários</option>
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>
        </div>
      </div>

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
