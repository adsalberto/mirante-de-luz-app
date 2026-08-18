import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCheck, Plus, Search, Filter, Download, 
  CreditCard, CheckCircle2, AlertCircle, Phone, Mail, 
  MapPin, Calendar, Edit2, Trash2, X, FileText, Sparkles, Check
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AdminAssociado, AssociadoCategoria, AssociadoStatus } from '../../types';
import { formatDateBR, formatDateTimeBR, getTodayBR } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORIAS_CONFIG: Record<AssociadoCategoria, { label: string; bg: string; text: string }> = {
  EFETIVO: { label: 'Sócio Efetivo', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  CONTRIBUINTE: { label: 'Sócio Contribuinte', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  BENEMERITO: { label: 'Sócio Benemérito', bg: 'bg-purple-50', text: 'text-purple-700' },
  HONORARIO: { label: 'Sócio Honorário', bg: 'bg-amber-50', text: 'text-amber-700' }
};

const STATUS_CONFIG: Record<AssociadoStatus, { label: string; bg: string; text: string }> = {
  ATIVO: { label: 'Ativo', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  LICENCIADO: { label: 'Licenciado', bg: 'bg-amber-100', text: 'text-amber-800' },
  DESLIGADO: { label: 'Desligado', bg: 'bg-rose-100', text: 'text-rose-800' }
};

export const QuadroSocialView: React.FC = () => {
  const [associados, setAssociados] = useState<AdminAssociado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAssociado | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    categoria: 'EFETIVO' as AssociadoCategoria,
    dataAdmissao: new Date().toISOString().split('T')[0],
    status: 'ATIVO' as AssociadoStatus,
    mensalidadeValor: 50,
    diaVencimento: 10,
    adimplente: true,
    aptoVotoAssembleia: true,
    observacoes: ''
  });

  useEffect(() => {
    const unsub = dataService.subscribeAdminAssociados((list) => {
      setAssociados(list || []);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item?: AdminAssociado) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        cpf: item.cpf || '',
        email: item.email,
        telefone: item.telefone,
        endereco: item.endereco || '',
        categoria: item.categoria,
        dataAdmissao: item.dataAdmissao,
        status: item.status,
        mensalidadeValor: item.mensalidadeValor || 50,
        diaVencimento: item.diaVencimento || 10,
        adimplente: item.adimplente,
        aptoVotoAssembleia: item.aptoVotoAssembleia,
        observacoes: item.observacoes || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        endereco: '',
        categoria: 'EFETIVO',
        dataAdmissao: new Date().toISOString().split('T')[0],
        status: 'ATIVO',
        mensalidadeValor: 50,
        diaVencimento: 10,
        adimplente: true,
        aptoVotoAssembleia: true,
        observacoes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    const item: AdminAssociado = {
      id: editingItem ? editingItem.id : `assoc_${Date.now()}`,
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim() || undefined,
      email: formData.email.trim(),
      telefone: formData.telefone.trim(),
      endereco: formData.endereco.trim() || undefined,
      categoria: formData.categoria,
      dataAdmissao: formData.dataAdmissao,
      status: formData.status,
      mensalidadeValor: Number(formData.mensalidadeValor) || 0,
      diaVencimento: Number(formData.diaVencimento) || 10,
      adimplente: formData.adimplente,
      aptoVotoAssembleia: formData.aptoVotoAssembleia,
      observacoes: formData.observacoes.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    await dataService.saveAdminAssociado(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente remover o associado "${nome}" do quadro social?`)) {
      await dataService.deleteAdminAssociado(id);
    }
  };

  const toggleAdimplencia = async (item: AdminAssociado) => {
    const updated: AdminAssociado = {
      ...item,
      adimplente: !item.adimplente,
      aptoVotoAssembleia: !item.adimplente ? (item.categoria === 'EFETIVO') : false,
      ultimoPagamento: !item.adimplente ? getTodayBR() : item.ultimoPagamento,
      updatedAt: Date.now()
    };
    await dataService.saveAdminAssociado(updated);
  };

  const exportQuadroSocialPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 27, 75); // Indigo 950
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRO ESPÍRITA MIRANTE DE LUZ', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Secretaria Geral & Diretoria Executiva • Livro Geral do Quadro Social', 14, 23);

    // Metadata
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Data de Emissão: ${formatDateTimeBR(new Date())}`, 14, 40);
    doc.text(`Total de Registros: ${filteredAssociados.length} associados`, 14, 46);

    const tableData = filteredAssociados.map((a, idx) => [
      idx + 1,
      a.nome,
      CATEGORIAS_CONFIG[a.categoria]?.label || a.categoria,
      a.telefone || '-',
      formatDateBR(a.dataAdmissao),
      a.adimplente ? 'Em Dia' : 'Pendente',
      a.aptoVotoAssembleia ? 'Apto' : 'Inapto'
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['#', 'Nome do Associado', 'Categoria', 'Telefone', 'Admissão', 'Mensalidade', 'Voto Assembl.']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Quadro_Social_CEMIL_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filteredAssociados = associados.filter(item => {
    const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cpf && item.cpf.includes(searchTerm));
    const matchCat = filterCategoria === 'TODOS' || item.categoria === filterCategoria;
    const matchStatus = filterStatus === 'TODOS' || item.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const totalAtivos = associados.filter(a => a.status === 'ATIVO').length;
  const totalAdimplentes = associados.filter(a => a.adimplente && a.status === 'ATIVO').length;
  const totalAptosVoto = associados.filter(a => a.aptoVotoAssembleia && a.status === 'ATIVO').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Total no Quadro</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalAtivos} <span className="text-xs font-semibold text-gray-400">ativos</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Adimplência</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalAdimplentes} <span className="text-xs font-semibold text-gray-400">em dia</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-purple-500 uppercase tracking-widest">Aptos a Voto</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalAptosVoto} <span className="text-xs font-semibold text-gray-400">em assembleia</span></p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todas Categorias</option>
              <option value="EFETIVO">Sócios Efetivos</option>
              <option value="CONTRIBUINTE">Contribuintes</option>
              <option value="BENEMERITO">Beneméritos</option>
              <option value="HONORARIO">Honorários</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos Status</option>
              <option value="ATIVO">Ativos</option>
              <option value="LICENCIADO">Licenciados</option>
              <option value="DESLIGADO">Desligados</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={exportQuadroSocialPDF}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span>Exportar Livro (PDF)</span>
          </button>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Associado</span>
          </button>
        </div>
      </div>

      {/* Associados List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Associado</th>
                <th className="py-4 px-4">Categoria</th>
                <th className="py-4 px-4">Contato</th>
                <th className="py-4 px-4">Admissão</th>
                <th className="py-4 px-4">Contribuição</th>
                <th className="py-4 px-4 text-center">Voto em Assembleia</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAssociados.length > 0 ? (
                filteredAssociados.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                          {item.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{item.nome}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_CONFIG[item.status]?.bg} ${STATUS_CONFIG[item.status]?.text}`}>
                              {STATUS_CONFIG[item.status]?.label}
                            </span>
                          </div>
                          {item.cpf && <span className="text-xs text-gray-400 font-mono">CPF: {item.cpf}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${CATEGORIAS_CONFIG[item.categoria]?.bg} ${CATEGORIAS_CONFIG[item.categoria]?.text}`}>
                        {CATEGORIAS_CONFIG[item.categoria]?.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-0.5 text-xs text-gray-600">
                        <p className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" /> {item.telefone || '-'}</p>
                        <p className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" /> {item.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-600">
                      {formatDateBR(item.dataAdmissao)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAdimplencia(item)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            item.adimplente 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                          title="Clique para alternar adimplência"
                        >
                          {item.adimplente ? <Check size={14} /> : <X size={14} />}
                          <span>R$ {item.mensalidadeValor?.toFixed(2)} ({item.adimplente ? 'Em Dia' : 'Pendente'})</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.aptoVotoAssembleia ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.aptoVotoAssembleia ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        <span>{item.aptoVotoAssembleia ? 'Apto' : 'Inapto'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Editar Associado"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.nome)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    Nenhum associado encontrado no quadro com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {editingItem ? 'Editar Ficha do Associado' : 'Novo Associado Estatutário'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Quadro Social & Governança CEMIL</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Maria Clara de Souza"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 98888-7777"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      E-mail Institucional / Pessoal *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="maria.souza@exemplo.com"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Endereço Residencial
                    </label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua das Flores, 123 - Bairro Centro"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Categoria Estatutária
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as AssociadoCategoria })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="EFETIVO">Sócio Efetivo (com direito a voto)</option>
                      <option value="CONTRIBUINTE">Sócio Contribuinte</option>
                      <option value="BENEMERITO">Sócio Benemérito</option>
                      <option value="HONORARIO">Sócio Honorário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Status no Quadro
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssociadoStatus })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ATIVO">Ativo</option>
                      <option value="LICENCIADO">Licenciado</option>
                      <option value="DESLIGADO">Desligado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Data de Admissão
                    </label>
                    <input
                      type="date"
                      value={formData.dataAdmissao}
                      onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Valor Contribuição Mensal (R$)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={formData.mensalidadeValor}
                      onChange={(e) => setFormData({ ...formData, mensalidadeValor: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-6 md:col-span-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.adimplente}
                        onChange={(e) => setFormData({ ...formData, adimplente: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-gray-700">Mensalidade em Dia (Adimplente)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aptoVotoAssembleia}
                        onChange={(e) => setFormData({ ...formData, aptoVotoAssembleia: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-gray-700">Apto a Voto em Assembleia Geral</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Observações Estatutárias
                    </label>
                    <textarea
                      rows={2}
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Anotações de conselho, comissões ou cargos ocupados..."
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
                    {editingItem ? 'Atualizar Ficha' : 'Cadastrar Associado'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
