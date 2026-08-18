import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Search, Filter, Download, 
  Calendar, Clock, CheckCircle2, AlertCircle, Edit2, 
  Trash2, X, Users, BookOpen, ShieldCheck, Printer, Check
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AdminAta, AtaTipo, AtaStatus } from '../../types';
import { formatDateBR } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ATA_TIPO_CONFIG: Record<AtaTipo, { label: string; bg: string; text: string }> = {
  REUNIAO_DIRETORIA: { label: 'Reunião de Diretoria', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  ASSEMBLEIA_ORDINARIA: { label: 'Assembleia Geral Ordinária', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ASSEMBLEIA_EXTRAORDINARIA: { label: 'Assembleia Geral Extraordinária', bg: 'bg-amber-50', text: 'text-amber-700' },
  CONSELHO_FISCAL: { label: 'Reunião Conselho Fiscal', bg: 'bg-purple-50', text: 'text-purple-700' }
};

const ATA_STATUS_CONFIG: Record<AtaStatus, { label: string; bg: string; text: string }> = {
  RASCUNHO: { label: 'Em Redação (Rascunho)', bg: 'bg-amber-100', text: 'text-amber-800' },
  APROVADA: { label: 'Aprovada pela Mesa', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  REGISTRADA_CARTORIO: { label: 'Registrada em Cartório', bg: 'bg-emerald-100', text: 'text-emerald-800' }
};

export const LivroAtasView: React.FC = () => {
  const [atas, setAtas] = useState<AdminAta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAta | null>(null);
  const [viewingAta, setViewingAta] = useState<AdminAta | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'REUNIAO_DIRETORIA' as AtaTipo,
    data: new Date().toISOString().split('T')[0],
    horaInicio: '19:30',
    horaFim: '21:00',
    local: 'Sede CEMIL - Sala de Reuniões da Diretoria',
    presidenteMesa: 'Presidente da Diretoria Executiva',
    secretarioMesa: '1º Secretário Geral',
    presentesStr: 'Membros da Diretoria Executiva e Conselho Fiscal',
    pauta: '',
    deliberacoes: '',
    status: 'APROVADA' as AtaStatus,
    livroNumero: 'Livro de Atas Nº 03',
    folhaNumero: 'Fl. 45-47'
  });

  useEffect(() => {
    const unsub = dataService.subscribeAdminAtas((list) => {
      setAtas(list || []);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item?: AdminAta) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        numero: item.numero,
        tipo: item.tipo,
        data: item.data,
        horaInicio: item.horaInicio,
        horaFim: item.horaFim || '',
        local: item.local,
        presidenteMesa: item.presidenteMesa,
        secretarioMesa: item.secretarioMesa,
        presentesStr: item.presentes.join(', '),
        pauta: item.pauta,
        deliberacoes: item.deliberacoes,
        status: item.status,
        livroNumero: item.livroNumero || '',
        folhaNumero: item.folhaNumero || ''
      });
    } else {
      const currentYear = new Date().getFullYear();
      const nextNum = atas.length + 1;
      setEditingItem(null);
      setFormData({
        numero: `ATA Nº ${String(nextNum).padStart(2, '0')}/${currentYear}`,
        tipo: 'REUNIAO_DIRETORIA',
        data: new Date().toISOString().split('T')[0],
        horaInicio: '19:30',
        horaFim: '21:00',
        local: 'Sede CEMIL - Sala de Reuniões da Diretoria',
        presidenteMesa: 'Presidente da Diretoria Executiva',
        secretarioMesa: '1º Secretário Geral',
        presentesStr: 'Diretoria Executiva, Coordenadores de Área, Membros do Conselho',
        pauta: '1. Abertura com Prece Inicial;\n2. Leitura e aprovação da ata anterior;\n3. Avaliação das atividades doutrinárias e sociais do mês;\n4. Planejamento das reformas prediais e aquisições;\n5. Assuntos gerais e encerramento.',
        deliberacoes: 'Aos presentes, foram aprovados os relatórios de atividades e o balancete financeiro do período. Deliberou-se por unanimidade dar prosseguimento ao cronograma estabelecido pela FEB e coordenadores.',
        status: 'APROVADA',
        livroNumero: 'Livro Nº 03',
        folhaNumero: 'Fl. 50'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero.trim() || !formData.pauta.trim()) return;

    const presentesArray = formData.presentesStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const item: AdminAta = {
      id: editingItem ? editingItem.id : `ata_${Date.now()}`,
      numero: formData.numero.trim(),
      tipo: formData.tipo,
      data: formData.data,
      horaInicio: formData.horaInicio,
      horaFim: formData.horaFim.trim() || undefined,
      local: formData.local.trim(),
      presidenteMesa: formData.presidenteMesa.trim(),
      secretarioMesa: formData.secretarioMesa.trim(),
      presentes: presentesArray,
      pauta: formData.pauta.trim(),
      deliberacoes: formData.deliberacoes.trim(),
      status: formData.status,
      livroNumero: formData.livroNumero.trim() || undefined,
      folhaNumero: formData.folhaNumero.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    await dataService.saveAdminAta(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, numero: string) => {
    if (window.confirm(`Deseja realmente remover a ${numero} do Livro de Atas?`)) {
      await dataService.deleteAdminAta(id);
    }
  };

  const exportAtaPDF = (item: AdminAta) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 27, 75); // Indigo 950
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRO ESPÍRITA MIRANTE DE LUZ', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Secretaria Geral & Diretoria Executiva • Livro Oficial de Atas`, 14, 22);
    doc.text(`Registro Oficial: ${item.livroNumero || 'Livro Geral'} • ${item.folhaNumero || 'Fl. 01'}`, 14, 28);

    // Body
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.numero} - ${ATA_TIPO_CONFIG[item.tipo]?.label.toUpperCase()}`, 14, 44);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formatDateBR(item.data)}  |  Horário: ${item.horaInicio} às ${item.horaFim || '--:--'}`, 14, 52);
    doc.text(`Local: ${item.local}`, 14, 58);
    doc.text(`Presidente da Mesa: ${item.presidenteMesa}`, 14, 64);
    doc.text(`Secretário(a) da Mesa: ${item.secretarioMesa}`, 14, 70);

    // Presentes
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBROS PRESENTES:', 14, 80);
    doc.setFont('helvetica', 'normal');
    const splitPresentes = doc.splitTextToSize(item.presentes.join(', '), 180);
    doc.text(splitPresentes, 14, 86);

    let currentY = 86 + (splitPresentes.length * 5) + 4;

    // Pauta
    doc.setFont('helvetica', 'bold');
    doc.text('PAUTA DOS TRABALHOS:', 14, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    const splitPauta = doc.splitTextToSize(item.pauta, 180);
    doc.text(splitPauta, 14, currentY);
    currentY += (splitPauta.length * 5) + 6;

    // Deliberações
    doc.setFont('helvetica', 'bold');
    doc.text('DELIBERAÇÕES E TRANSCRIÇÃO DOS FATOS:', 14, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    const splitDelib = doc.splitTextToSize(item.deliberacoes, 180);
    doc.text(splitDelib, 14, currentY);
    currentY += (splitDelib.length * 5) + 18;

    // Signatures
    if (currentY > 240) {
      doc.addPage();
      currentY = 40;
    }

    doc.setFontSize(9);
    doc.text('Lavrada a presente ata, que após lida e aprovada, segue assinada pela mesa dirigente.', 14, currentY);
    currentY += 24;

    doc.line(20, currentY, 95, currentY);
    doc.line(115, currentY, 190, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(item.presidenteMesa, 20, currentY);
    doc.text(item.secretarioMesa, 115, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Presidente da Sessão', 20, currentY);
    doc.text('Secretário(a) Geral', 115, currentY);

    doc.save(`Ata_${item.numero.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const filteredAtas = atas.filter(item => {
    const matchSearch = item.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pauta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deliberacoes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || item.tipo === filterTipo;
    const matchStatus = filterStatus === 'TODOS' || item.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar em pautas, deliberações ou número da ata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="REUNIAO_DIRETORIA">Reunião de Diretoria</option>
              <option value="ASSEMBLEIA_ORDINARIA">Assembleia Ordinária</option>
              <option value="ASSEMBLEIA_EXTRAORDINARIA">Assembleia Extraordinária</option>
              <option value="CONSELHO_FISCAL">Conselho Fiscal</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos Status</option>
              <option value="RASCUNHO">Em Rascunho</option>
              <option value="APROVADA">Aprovadas</option>
              <option value="REGISTRADA_CARTORIO">Em Cartório</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Lavrar Nova Ata</span>
        </button>
      </div>

      {/* Grid of Atas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAtas.length > 0 ? (
          filteredAtas.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-base tracking-tight">{item.numero}</h4>
                      <p className="text-[11px] font-bold text-gray-400">
                        {item.livroNumero || 'Livro Geral'} • {item.folhaNumero || 'Fl. 01'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${ATA_STATUS_CONFIG[item.status]?.bg} ${ATA_STATUS_CONFIG[item.status]?.text}`}>
                    {ATA_STATUS_CONFIG[item.status]?.label}
                  </span>
                </div>

                <div className="mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${ATA_TIPO_CONFIG[item.tipo]?.bg} ${ATA_TIPO_CONFIG[item.tipo]?.text}`}>
                    {ATA_TIPO_CONFIG[item.tipo]?.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar size={13} className="text-gray-400" />
                    <span>{formatDateBR(item.data)} às {item.horaInicio}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users size={13} className="text-gray-400" />
                    <span className="truncate">Presidente: <b>{item.presidenteMesa}</b></span>
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 space-y-1 mb-4 line-clamp-3">
                  <p className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">Deliberações:</p>
                  <p className="italic">{item.deliberacoes}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingAta(item)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Visualizar
                  </button>
                  <button
                    onClick={() => exportAtaPDF(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Download size={13} />
                    <span>Baixar PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Editar Ata"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.numero)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Nenhuma ata encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Utilize o botão acima para lavrar a primeira ata estatutária da Casa.</p>
          </div>
        )}
      </div>

      {/* Modal Redação/Edição de Ata */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {editingItem ? 'Editar Ata do Livro' : 'Lavrar Nova Ata de Reunião'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Secretaria Geral & Diretoria Executiva</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Número da Ata *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="ATA Nº 01/2026"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Tipo de Sessão
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as AtaTipo })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="REUNIAO_DIRETORIA">Reunião de Diretoria</option>
                      <option value="ASSEMBLEIA_ORDINARIA">Assembleia Geral Ordinária</option>
                      <option value="ASSEMBLEIA_EXTRAORDINARIA">Assembleia Geral Extraordinária</option>
                      <option value="CONSELHO_FISCAL">Conselho Fiscal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Status da Ata
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AtaStatus })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="RASCUNHO">Em Redação (Rascunho)</option>
                      <option value="APROVADA">Aprovada pela Mesa</option>
                      <option value="REGISTRADA_CARTORIO">Registrada em Cartório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Data da Reunião
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Horário Início
                    </label>
                    <input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Horário Término
                    </label>
                    <input
                      type="time"
                      value={formData.horaFim}
                      onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Local da Sessão
                    </label>
                    <input
                      type="text"
                      value={formData.local}
                      onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                      placeholder="Sede Social CEMIL - Sala 02"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Presidente da Mesa
                    </label>
                    <input
                      type="text"
                      value={formData.presidenteMesa}
                      onChange={(e) => setFormData({ ...formData, presidenteMesa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Secretário(a) da Mesa
                    </label>
                    <input
                      type="text"
                      value={formData.secretarioMesa}
                      onChange={(e) => setFormData({ ...formData, secretarioMesa: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Livro / Folha
                    </label>
                    <input
                      type="text"
                      value={formData.livroNumero}
                      onChange={(e) => setFormData({ ...formData, livroNumero: e.target.value })}
                      placeholder="Livro 03, Fl. 45"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Membros Presentes (separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={formData.presentesStr}
                      onChange={(e) => setFormData({ ...formData, presentesStr: e.target.value })}
                      placeholder="Nome 1, Nome 2, Nome 3..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Pauta dos Trabalhos *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.pauta}
                      onChange={(e) => setFormData({ ...formData, pauta: e.target.value })}
                      placeholder="Itens em discussão..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Deliberações e Transcrição Oficial *
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={formData.deliberacoes}
                      onChange={(e) => setFormData({ ...formData, deliberacoes: e.target.value })}
                      placeholder="Texto integral das deliberações e aprovações tomadas..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Lavrar e Registrar Ata'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Visualização Detalhada da Ata */}
      <AnimatePresence>
        {viewingAta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-gray-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${ATA_STATUS_CONFIG[viewingAta.status]?.bg} ${ATA_STATUS_CONFIG[viewingAta.status]?.text}`}>
                    {ATA_STATUS_CONFIG[viewingAta.status]?.label}
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">{viewingAta.numero}</h3>
                  <p className="text-xs font-semibold text-gray-400">{ATA_TIPO_CONFIG[viewingAta.tipo]?.label}</p>
                </div>
                <button
                  onClick={() => setViewingAta(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3.5 rounded-2xl">
                  <p><b>Data:</b> {formatDateBR(viewingAta.data)}</p>
                  <p><b>Horário:</b> {viewingAta.horaInicio} às {viewingAta.horaFim || '--:--'}</p>
                  <p><b>Presidente:</b> {viewingAta.presidenteMesa}</p>
                  <p><b>Secretário:</b> {viewingAta.secretarioMesa}</p>
                  <p className="col-span-2"><b>Local:</b> {viewingAta.local}</p>
                </div>

                <div>
                  <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1">Membros Presentes:</h5>
                  <p className="bg-gray-50 p-3 rounded-xl">{viewingAta.presentes.join(', ')}</p>
                </div>

                <div>
                  <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1">Pauta:</h5>
                  <p className="bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">{viewingAta.pauta}</p>
                </div>

                <div>
                  <h5 className="font-bold text-gray-900 uppercase text-[11px] mb-1">Deliberações:</h5>
                  <p className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50 whitespace-pre-wrap text-gray-800 font-medium">{viewingAta.deliberacoes}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => exportAtaPDF(viewingAta)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Download size={16} />
                  <span>Exportar em PDF Padrão Cartório</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
