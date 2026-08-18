import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Clock, 
  User, 
  Activity, 
  FileText, 
  Printer, 
  Calendar, 
  Users, 
  ArrowLeft,
  Download,
  AlertTriangle,
  Filter,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { AuditLog, Worker, LogCategory, LogSeverity } from '../types';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLogDisplay = (log: AuditLog) => {
  let cleanAction = log.action || '';
  let cleanDetails = log.details || '';
  let userName = log.userName || 'Sistema';

  // Trata formato de string legado se houver
  if (cleanAction.includes(' | ')) {
    const parts = cleanAction.split(' | ');
    if (parts.length >= 4) {
      userName = parts[2].replace(/[\[\]]/g, '').trim();
      cleanAction = parts[3].replace(/[\[\]]/g, '').trim();
    } else {
      cleanAction = parts[parts.length - 1].replace(/[\[\]]/g, '').trim();
    }
    if (cleanAction.includes(': ')) {
      const subParts = cleanAction.split(': ');
      cleanAction = subParts[0];
      cleanDetails = subParts.slice(1).join(': ');
    }
  }

  let category: LogCategory = log.category || 'GERAL';
  if (!log.category) {
    const lower = (cleanAction + ' ' + cleanDetails).toLowerCase();
    if (lower.includes('trabalhador') || lower.includes('permissão') || lower.includes('acesso') || lower.includes('voluntário') || lower.includes('rh')) category = 'RH';
    else if (lower.includes('estoque') || lower.includes('patrimônio') || lower.includes('item') || lower.includes('movimentação') || lower.includes('produto')) category = 'ESTOQUE';
    else if (lower.includes('atendido') || lower.includes('frequência') || lower.includes('atendimento') || lower.includes('fila') || lower.includes('recepção')) category = 'ATENDIMENTOS';
    else if (lower.includes('financeiro') || lower.includes('caixa') || lower.includes('venda')) category = 'FINANCEIRO';
    else if (lower.includes('segurança') || lower.includes('senha') || lower.includes('login')) category = 'SEGURANÇA';
    else category = 'SISTEMA';
  }

  let severity: LogSeverity = log.severity || 'INFO';
  if (!log.severity) {
    const lower = (cleanAction + ' ' + cleanDetails).toLowerCase();
    if (lower.includes('exclusão') || lower.includes('delet') || lower.includes('baixa') || lower.includes('remov')) severity = 'CRITICAL';
    else if (lower.includes('permissão') || lower.includes('ajuste') || lower.includes('alteraç') || lower.includes('atualizaç')) severity = 'WARN';
    else severity = 'INFO';
  }

  return { cleanAction, cleanDetails, userName, category, severity };
};

const getCategoryBadge = (category: LogCategory) => {
  switch (category) {
    case 'RH':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'ESTOQUE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ATENDIMENTOS':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'FINANCEIRO':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'SEGURANÇA':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'SISTEMA':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getSeverityBadge = (severity: LogSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'WARN':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'INFO':
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

export const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    const unsubLogs = dataService.subscribeToLogs((list) => setLogs(list || []));
    const unsubWorkers = dataService.subscribeToWorkers((list) => setWorkers(list || []));
    return () => {
      unsubLogs();
      unsubWorkers();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const { cleanAction, cleanDetails, userName, category, severity } = getLogDisplay(log);

      const matchesSearch = 
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cleanAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cleanDetails.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = selectedUserId === 'all' || log.userId === selectedUserId;
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || severity === selectedSeverity;
      
      const logDate = new Date(log.timestamp);
      const matchesDate = (!startDate || logDate >= startOfDay(new Date(startDate))) && 
                          (!endDate || logDate <= endOfDay(new Date(endDate)));

      return matchesSearch && matchesUser && matchesCategory && matchesSeverity && matchesDate;
    });
  }, [logs, searchTerm, selectedUserId, selectedCategory, selectedSeverity, startDate, endDate]);

  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => isToday(new Date(l.timestamp)));
    const criticalLogs = logs.filter(l => {
      const { severity } = getLogDisplay(l);
      return severity === 'CRITICAL';
    });
    const tempAccessCount = workers.filter(w => w.tempRole && w.tempRoleExpiry && Date.now() < w.tempRoleExpiry).length;

    return {
      total: logs.length,
      todayCount: todayLogs.length,
      criticalCount: criticalLogs.length,
      tempAccessCount
    };
  }, [logs, workers]);

  const generateCSV = () => {
    const headers = ["Data/Hora", "Categoria", "Severidade", "Usuário", "Ação", "Detalhes"];
    const rows = filteredLogs.map(log => {
      const { cleanAction, cleanDetails, userName, category, severity } = getLogDisplay(log);
      const dateFormatted = format(log.timestamp, "dd/MM/yyyy HH:mm:ss");
      return [
        `"${dateFormatted}"`,
        `"${category}"`,
        `"${severity}"`,
        `"${userName.replace(/"/g, '""')}"`,
        `"${cleanAction.replace(/"/g, '""')}"`,
        `"${cleanDetails.replace(/"/g, '""')}"`
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_mirante_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Data/Hora", "Cat.", "Severidade", "Usuário", "Ação", "Detalhes"];
    const tableRows: any[] = [];

    filteredLogs.forEach(log => {
      const { cleanAction, cleanDetails, userName, category, severity } = getLogDisplay(log);
      tableRows.push([
        format(log.timestamp, "dd/MM/yy HH:mm"),
        category,
        severity,
        userName,
        cleanAction,
        cleanDetails || '-'
      ]);
    });

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("Relatório de Auditoria e Segurança", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Instituição: Casa Espírita Mirante de Luz`, 14, 27);
    doc.text(`Total de registros: ${filteredLogs.length}`, 14, 32);
    doc.text(`Gerado por: ${currentUser?.email || 'Sistema'} em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 37);

    doc.setDrawColor(230, 230, 230);
    doc.line(14, 42, 196, 42);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 47,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 32 },
        4: { cellWidth: 38 },
        5: { cellWidth: 'auto' }
      }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, 196, 285, { align: 'right' });
      doc.text("Documento Oficial de Auditoria - Uso Interno Restrito", 14, 285);
    }

    doc.save(`auditoria_mirante_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedUserId('all');
    setSelectedCategory('all');
    setSelectedSeverity('all');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.25em] mb-2">
              <ShieldCheck size={14} />
              <span>Segurança e Trilha de Auditoria</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">
              Logs de Auditoria
            </h1>
            <p className="text-gray-400 font-medium">Sincronização em tempo real de todas as movimentações do sistema.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={generateCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-5 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button 
            onClick={generatePDF}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <Printer size={18} />
            Relatório PDF
          </button>
        </div>
      </header>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Recente</p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Ações Hoje</p>
            <p className="text-2xl font-black text-emerald-600">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Eventos Críticos</p>
            <p className="text-2xl font-black text-rose-600">{stats.criticalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Acessos Temporários</p>
            <p className="text-2xl font-black text-amber-600">{stats.tempAccessCount}</p>
          </div>
        </div>
      </div>

      {/* Painel de Controle de Acesso Temporário */}
      <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-6 rounded-[32px] border border-amber-100 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-amber-950 uppercase tracking-wider">Acompanhamento de Permissões Temporárias</h2>
            <p className="text-[10px] text-amber-800/80 font-medium">Controle de acessos especiais concedidos, autorizadores e validade do acesso.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.filter(w => w.tempRole && w.tempRoleExpiry && Date.now() < w.tempRoleExpiry).map(worker => {
            const timeLeft = worker.tempRoleExpiry ? worker.tempRoleExpiry - Date.now() : 0;
            const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
            const timeLabel = hoursLeft > 24 
              ? `${Math.ceil(hoursLeft / 24)} dia(s)` 
              : `${hoursLeft} hora(s)`;
            
            // Busca o responsável pelo registro
            const grantLog = logs.find(l => 
              (l.action.includes('Permissão Temporária Concedida') || l.action.includes('Concedeu permissão')) && 
              (l.action.includes(worker.name) || (l.details && l.details.includes(worker.name)))
            );
            
            let grantor = worker.grantedBy || 'Coordenação Geral';
            if (grantLog) {
              const display = getLogDisplay(grantLog);
              grantor = grantLog.grantedBy || display.userName || 'Coordenação';
            }

            return (
              <div key={worker.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-gray-900 leading-tight">{worker.name}</span>
                    <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-950 border border-amber-200/50 rounded-full font-black uppercase tracking-wider animate-pulse">
                      Acesso Ativo
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">E-mail: {worker.email}</p>
                </div>

                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 flex flex-col gap-1 text-[10px] text-amber-950 font-bold">
                  <div className="flex justify-between">
                    <span className="text-amber-800/80 font-medium text-[9px] uppercase tracking-wide">Cargo Temporário</span>
                    <span className="text-amber-900">{worker.tempRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800/80 font-medium text-[9px] uppercase tracking-wide">Autorizado por</span>
                    <span className="text-amber-950 font-black">{grantor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-800/80 font-medium text-[9px] uppercase tracking-wide">Tempo Restante</span>
                    <span>{timeLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {workers.filter(w => w.tempRole && w.tempRoleExpiry && Date.now() < w.tempRoleExpiry).length === 0 && (
            <div className="col-span-full py-6 text-center bg-amber-50/20 rounded-2xl border border-dashed border-amber-100/50 flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] text-amber-800/60 font-medium">Nenhum voluntário possui permissão temporária de acesso ativa no momento.</span>
            </div>
          )}
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider">
            <Filter size={14} className="text-indigo-600" />
            <span>Filtros de Busca & Auditoria</span>
          </div>
          {(startDate || endDate || selectedUserId !== 'all' || selectedCategory !== 'all' || selectedSeverity !== 'all' || searchTerm) && (
            <button 
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-xl transition-all cursor-pointer"
            >
              <X size={12} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1">
              <Calendar size={12} /> Data Inicial
            </label>
            <input 
              type="date" 
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2.5 font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1">
              <Calendar size={12} /> Data Final
            </label>
            <input 
              type="date" 
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2.5 font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1">
              <Users size={12} /> Usuário
            </label>
            <select 
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2.5 font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="all">Todos os Usuários</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1">
              <Filter size={12} /> Categoria
            </label>
            <select 
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2.5 font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas as Categorias</option>
              <option value="RH">RH / Voluntários</option>
              <option value="ESTOQUE">Estoque / Patrimônio</option>
              <option value="ATENDIMENTOS">Atendimentos / Fila</option>
              <option value="FINANCEIRO">Financeiro / Caixa</option>

              <option value="SEGURANÇA">Segurança / Contas</option>
              <option value="SISTEMA">Sistema / Configurações</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 ml-1">
              <AlertTriangle size={12} /> Severidade
            </label>
            <select 
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-2.5 font-bold text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <option value="all">Todas as Severidades</option>
              <option value="INFO">Informativo (Normal)</option>
              <option value="WARN">Alerta / Alteração</option>
              <option value="CRITICAL">Crítico / Exclusão</option>
            </select>
          </div>
        </div>
      </div>

      {/* Busca rápida */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Pesquisar por usuário, nome da ação ou detalhes adicionais..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[28px] font-bold text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Severidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário Responsável</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação / Evento</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log, idx) => {
                const { cleanAction, cleanDetails, userName, category, severity } = getLogDisplay(log);

                return (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">
                          {format(log.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getCategoryBadge(category)}`}>
                        {category}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getSeverityBadge(severity)}`}>
                        {severity === 'CRITICAL' ? 'Crítico' : severity === 'WARN' ? 'Alerta' : 'Info'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700">
                          {(userName || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-gray-900">{userName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-900">
                        {cleanAction}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 max-w-sm">
                        <FileText size={13} className="text-gray-300 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-500 font-medium leading-relaxed">
                          {cleanDetails || 'Sem detalhes adicionais.'}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <Activity size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Nenhum log encontrado</p>
                        <p className="text-xs text-gray-400">Tente ajustar seus termos de pesquisa ou limpar os filtros aplicados.</p>
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
