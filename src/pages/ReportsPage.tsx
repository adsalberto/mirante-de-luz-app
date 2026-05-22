import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Table, PieChart, Activity, BarChart3, Filter, CheckCircle2, Users, Calendar, ClipboardList } from 'lucide-react';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';
import { formatSectorName, Sector } from '../types';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RECEPCIONISTA') {
        navigate('/');
      }
    }
  }, [currentUser, navigate]);

  const exportToExcel = async (type: string) => {
    setIsExporting(true);
    try {
      let data: any[] = [];
      let sheetName = "Relatorio";

      if (type === 'workers') {
        const workers = await dataService.getWorkers();
        data = workers.map(w => ({
          'Nome': w.name,
          'Função': w.role,
          'Email': w.email,
          'Setor': w.sectorId || 'N/I'
        }));
        sheetName = "Trabalhadores";
      } else if (type === 'agenda') {
        const events = await dataService.getAgendaEvents();
        data = events.map(e => ({
          'Data': new Date(e.date).toLocaleDateString('pt-BR'),
          'Título': e.title,
          'Tipo': e.type,
          'Palestrante ID': e.speakerId || 'N/A'
        }));
        sheetName = "Agenda";
      } else if (type === 'logs') {
        const logs = await dataService.getLogs();
        data = logs?.map(l => ({
          'Data/Hora': new Date(l.timestamp).toLocaleString('pt-BR'),
          'Ação': l.action,
          'Usuário': l.userName
        })) || [];
        sheetName = "Auditoria";
      } else if (type === 'sectors') {
        const sectors = await dataService.getSectors();
        const uniqueS: Sector[] = [];
        const seenNames = new Set<string>();
        sectors?.forEach(s => {
          const normName = formatSectorName(s.name);
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueS.push({ ...s, name: normName });
          }
        });
        data = uniqueS.map(s => ({
          'Nome': s.name,
          'Tipo': s.type,
          'Descrição': s.description
        }));
        sheetName = "Setores";
      } else {
        const participants = await dataService.getParticipants();
        data = participants.map(p => ({
          'Nome': p.name || 'N/I',
          'Telefone': p.phone || 'N/I',
          'Sexo': (p.gender === 'Masculino' || p.gender === 'M') ? 'Masculino' : (p.gender === 'Feminino' || p.gender === 'F') ? 'Feminino' : p.gender || 'N/I',
          'Data Nascimento': p.birthDate || 'N/I',
          'Endereço': p.address || 'N/I',
          'Consentimento LGPD': p.lgpdConsent ? 'Sim' : 'Não',
          'Status': p.currentStatus === 'IDLE' ? 'Livre' : 
                   p.currentStatus === 'WAITING' ? 'Em Espera' :
                   p.currentStatus === 'IN_SERVICE' ? 'Em Atendimento' :
                   p.currentStatus === 'COMPLETED' ? 'Concluído' :
                   p.currentStatus === 'REFERRERED' ? 'Encaminhado' : p.currentStatus || 'Livre'
        }));
        sheetName = "Atendidos";
      }

      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);
      
      writeFile(workbook, `Relatorio_${type}_${new Date().getTime()}.xlsx`);
    } catch (err) {
      console.error('Erro Excel:', err);
      alert('Erro ao exportar Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async (type: string) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let title = "Relatório Geral";
      let head: string[][] = [];
      let body: any[][] = [];

      if (type === 'workers') {
        const workers = await dataService.getWorkers();
        title = "Quadro de Trabalhadores";
        head = [['Nome', 'Função', 'Setor', 'Email']];
        body = workers.map(w => [w.name, w.role, w.sectorId || 'N/I', w.email]);
      } else if (type === 'agenda') {
        const events = await dataService.getAgendaEvents();
        title = "Calendário de Atividades";
        head = [['Data', 'Evento', 'Tipo', 'Palestrante ID']];
        body = events.map(e => [new Date(e.date).toLocaleDateString('pt-BR'), e.title, e.type, e.speakerId || 'N/A']);
      } else if (type === 'sectors') {
        const sectors = await dataService.getSectors();
        const uniqueS: Sector[] = [];
        const seenNames = new Set<string>();
        sectors?.forEach(s => {
          const normName = formatSectorName(s.name);
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueS.push({ ...s, name: normName });
          }
        });
        title = "Quadro de Setores";
        head = [['Nome', 'Tipo', 'Descrição']];
        body = uniqueS.map(s => [s.name, s.type, s.description]);
      } else {
        const participants = await dataService.getParticipants();
        title = "Relatório de Atendimentos";
        head = [['Nome', 'Telefone', 'Sexo', 'Nascimento', 'Endereço']];
        body = participants.map(p => [
          p.name || 'N/I', 
          p.phone || 'N/I', 
          (p.gender === 'Masculino' || p.gender === 'M') ? 'M' : 'F',
          p.birthDate || 'N/I', 
          p.address || 'N/I'
        ]);
      }
      
      doc.setFontSize(18);
      doc.text(`${title} - CEMIL`, 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);
      
      const options: UserOptions = {
        startY: 35,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      };

      autoTable(doc, options);
      doc.save(`Relatorio_${type}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro ao gerar relatório PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    { id: 'all', title: 'Prontuário Geral', desc: 'Dados consolidados de todos os atendidos e setores.', icon: FileText, color: 'indigo' },
    { id: 'workers', title: 'Quadro de Voluntários', desc: 'Listing completa de trabalhadores ativos por setor.', icon: Users, color: 'emerald' },
    { id: 'agenda', title: 'Calendário de Atividades', desc: 'Programação de palestras, cursos e eventos.', icon: Calendar, color: 'blue' },
    { id: 'logs', title: 'Logs de Auditoria', desc: 'Histórico de acessos e modificações no sistema.', icon: ClipboardList, color: 'rose' },
    { id: 'fraterno', title: 'Atendimento Fraterno', desc: 'Relatório detalhado do setor fraterno.', icon: Activity, color: 'sky' },
    { id: 'passe', title: 'Estatísticas de Passe', desc: 'Contagem e recorrência de passes realizados.', icon: BarChart3, color: 'purple' },
    { id: 'social', title: 'Ação Social', desc: 'Beneficiários e impacto social da casa.', icon: PieChart, color: 'amber' },
    { id: 'sectors', title: 'Estatísticas por Setor', desc: 'Distribuição de atendimentos e ocupação por área.', icon: BarChart3, color: 'orange' },
  ];

  return (
    <div className="p-8 space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Central de Relatórios</h1>
        <p className="text-gray-500 font-medium">Exporte dados para análise e auditoria institucional.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <motion.div
            key={report.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={cn(
                "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500",
                report.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                report.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                report.color === 'blue' ? "bg-blue-50 text-blue-600" :
                report.color === 'rose' ? "bg-rose-50 text-rose-600" :
                report.color === 'sky' ? "bg-sky-50 text-sky-600" :
                report.color === 'purple' ? "bg-purple-50 text-purple-600" :
                report.color === 'orange' ? "bg-orange-50 text-orange-600" :
                "bg-amber-50 text-amber-600"
              )}>
                <report.icon size={32} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => exportToPDF(report.id)}
                  disabled={isExporting}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
                  title="Exportar PDF"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => exportToExcel(report.id)}
                  disabled={isExporting}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                  title="Exportar Excel"
                >
                  <Table size={18} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{report.title}</h3>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed font-medium line-clamp-2">{report.desc}</p>
            
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Sincronizado</span>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Real-time</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-4">
              <h2 className="text-3xl font-black leading-tight">Relatório de Transparência<br/><span className="text-indigo-300">CEMIL {new Date().getFullYear()}</span></h2>
              <p className="text-indigo-100/70 font-medium">Esteja em conformidade com as diretrizes da Federação e garanta a excelência no atendimento assistencial.</p>
              <button className="flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95">
                <Filter size={18} />
                <span>Personalizar Relatório Geral</span>
              </button>
            </div>
            <div className="w-full md:w-64 aspect-square bg-indigo-800/50 rounded-3xl border-2 border-indigo-700/50 flex items-center justify-center">
               <PieChart size={100} className="text-indigo-500/50" />
            </div>
         </div>
      </div>
    </div>
  );
};
