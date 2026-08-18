import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Plus, Search, Filter, Download, 
  MapPin, CheckCircle2, AlertCircle, Edit2, Trash2, 
  X, Tag, DollarSign, Calendar, Building2, Wrench
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AdminPatrimonioItem, PatrimonioCategoria, PatrimonioEstado } from '../../types';
import { formatDateBR, getTodayBR } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAT_CAT_CONFIG: Record<PatrimonioCategoria, { label: string; bg: string; text: string }> = {
  EQUIPAMENTO_AUDIOVISUAL: { label: 'Audiovisual / Som', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  MOBILIARIO: { label: 'Mobiliário & Cadeiras', bg: 'bg-amber-50', text: 'text-amber-700' },
  INFORMATICA: { label: 'Informática & Rede', bg: 'bg-blue-50', text: 'text-blue-700' },
  INSTRUMENTO_MUSICAL: { label: 'Música / Harmonização', bg: 'bg-purple-50', text: 'text-purple-700' },
  ELETRODOMESTICO: { label: 'Eletrodomésticos', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  IMOVEL: { label: 'Imóvel / Benfeitorias', bg: 'bg-slate-50', text: 'text-slate-700' },
  OUTROS: { label: 'Outros Bens', bg: 'bg-gray-50', text: 'text-gray-700' }
};

const PAT_ESTADO_CONFIG: Record<PatrimonioEstado, { label: string; bg: string; text: string }> = {
  EXCELENTE: { label: 'Excelente', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  BOM: { label: 'Bom', bg: 'bg-blue-100', text: 'text-blue-800' },
  REGULAR: { label: 'Regular', bg: 'bg-amber-100', text: 'text-amber-800' },
  NECESSITA_MANUTENCAO: { label: 'Requer Manutenção', bg: 'bg-rose-100', text: 'text-rose-800' },
  INSERVIVEL: { label: 'Inservível / Baixa', bg: 'bg-gray-100', text: 'text-gray-600' }
};

export const PatrimonioInventarioView: React.FC = () => {
  const [patrimonio, setPatrimonio] = useState<AdminPatrimonioItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminPatrimonioItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    numeroTombamento: '',
    denominacao: '',
    categoria: 'EQUIPAMENTO_AUDIOVISUAL' as PatrimonioCategoria,
    localizacaoSala: 'Salão Principal Doutrinário',
    estadoConservacao: 'BOM' as PatrimonioEstado,
    dataAquisicao: new Date().toISOString().split('T')[0],
    formaAquisicao: 'DOACAO' as 'DOACAO' | 'COMPRA' | 'COMODATO',
    valorEstimado: 0,
    doadorOuFornecedor: '',
    responsavelGuarda: 'Coordenação de Patrimônio',
    observacoes: ''
  });

  useEffect(() => {
    const unsub = dataService.subscribeAdminPatrimonio((list) => {
      setPatrimonio(list || []);
    });
    return () => unsub();
  }, []);

  const handleOpenModal = (item?: AdminPatrimonioItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        numeroTombamento: item.numeroTombamento,
        denominacao: item.denominacao,
        categoria: item.categoria,
        localizacaoSala: item.localizacaoSala,
        estadoConservacao: item.estadoConservacao,
        dataAquisicao: item.dataAquisicao,
        formaAquisicao: item.formaAquisicao,
        valorEstimado: item.valorEstimado || 0,
        doadorOuFornecedor: item.doadorOuFornecedor || '',
        responsavelGuarda: item.responsavelGuarda || 'Coordenação de Patrimônio',
        observacoes: item.observacoes || ''
      });
    } else {
      const nextTombo = `PAT-${String(patrimonio.length + 1).padStart(4, '0')}`;
      setEditingItem(null);
      setFormData({
        numeroTombamento: nextTombo,
        denominacao: '',
        categoria: 'EQUIPAMENTO_AUDIOVISUAL',
        localizacaoSala: 'Salão Principal Doutrinário',
        estadoConservacao: 'BOM',
        dataAquisicao: new Date().toISOString().split('T')[0],
        formaAquisicao: 'DOACAO',
        valorEstimado: 0,
        doadorOuFornecedor: '',
        responsavelGuarda: 'Coordenação de Patrimônio',
        observacoes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numeroTombamento.trim() || !formData.denominacao.trim()) return;

    const item: AdminPatrimonioItem = {
      id: editingItem ? editingItem.id : `pat_${Date.now()}`,
      numeroTombamento: formData.numeroTombamento.trim(),
      denominacao: formData.denominacao.trim(),
      categoria: formData.categoria,
      localizacaoSala: formData.localizacaoSala.trim(),
      estadoConservacao: formData.estadoConservacao,
      dataAquisicao: formData.dataAquisicao,
      formaAquisicao: formData.formaAquisicao,
      valorEstimado: Number(formData.valorEstimado) || 0,
      doadorOuFornecedor: formData.doadorOuFornecedor.trim() || undefined,
      responsavelGuarda: formData.responsavelGuarda.trim() || undefined,
      observacoes: formData.observacoes.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    await dataService.saveAdminPatrimonioItem(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, tombo: string, nome: string) => {
    if (window.confirm(`Deseja realmente dar baixa no bem tombado "${tombo} - ${nome}"?`)) {
      await dataService.deleteAdminPatrimonioItem(id);
    }
  };

  const exportInventarioPDF = () => {
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
    doc.text('Secretaria Geral & Almoxarifado • Livro de Inventário e Tombamento de Bens', 14, 22);

    // Summary metadata
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Data do Inventário: ${getTodayBR()}  |  Total de Bens: ${filteredPatrimonio.length}`, 14, 42);
    const valorTotal = filteredPatrimonio.reduce((acc, curr) => acc + (curr.valorEstimado || 0), 0);
    doc.text(`Valor Estimado Total dos Bens: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 48);

    const tableData = filteredPatrimonio.map((p) => [
      p.numeroTombamento,
      p.denominacao,
      PAT_CAT_CONFIG[p.categoria]?.label || p.categoria,
      p.localizacaoSala,
      PAT_ESTADO_CONFIG[p.estadoConservacao]?.label || p.estadoConservacao,
      p.valorEstimado ? `R$ ${p.valorEstimado.toFixed(2)}` : 'R$ 0,00',
      p.formaAquisicao
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['Tombamento', 'Denominação do Bem', 'Categoria', 'Localização', 'Estado', 'Valor Estimado', 'Aquisição']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Inventario_Patrimonio_CEMIL_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filteredPatrimonio = patrimonio.filter(item => {
    const matchSearch = item.numeroTombamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.denominacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.localizacaoSala.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategoria === 'TODOS' || item.categoria === filterCategoria;
    const matchEstado = filterEstado === 'TODOS' || item.estadoConservacao === filterEstado;
    return matchSearch && matchCat && matchEstado;
  });

  const totalBens = patrimonio.length;
  const bensManutencao = patrimonio.filter(p => p.estadoConservacao === 'NECESSITA_MANUTENCAO').length;
  const valorTotalBens = patrimonio.reduce((acc, curr) => acc + (curr.valorEstimado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Total Tombado</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalBens} <span className="text-xs font-semibold text-gray-400">itens</span></p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Valor Estimado</p>
            <p className="text-2xl font-black text-gray-900 mt-1">R$ {valorTotalBens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Manutenção Pendente</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{bensManutencao} <span className="text-xs font-semibold text-gray-400">requer reparo</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Wrench size={24} />
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
              placeholder="Buscar por tombamento, denominação ou sala..."
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
              <option value="EQUIPAMENTO_AUDIOVISUAL">Audiovisual / Som</option>
              <option value="MOBILIARIO">Mobiliário</option>
              <option value="INFORMATICA">Informática</option>
              <option value="INSTRUMENTO_MUSICAL">Harmonização / Música</option>
              <option value="ELETRODOMESTICO">Eletrodomésticos</option>
              <option value="IMOVEL">Imóvel</option>
              <option value="OUTROS">Outros</option>
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos os Estados</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="NECESSITA_MANUTENCAO">Requer Manutenção</option>
              <option value="INSERVIVEL">Inservível</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={exportInventarioPDF}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span>Inventário Geral (PDF)</span>
          </button>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} />
            <span>Tombar Novo Bem</span>
          </button>
        </div>
      </div>

      {/* Table of Assets */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Tombamento & Bem</th>
                <th className="py-4 px-4">Categoria</th>
                <th className="py-4 px-4">Localização (Sala)</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4">Aquisição</th>
                <th className="py-4 px-4">Valor Estimado</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPatrimonio.length > 0 ? (
                filteredPatrimonio.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl font-mono text-xs font-black">
                          {item.numeroTombamento}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{item.denominacao}</div>
                          {item.doadorOuFornecedor && (
                            <span className="text-xs text-gray-400">Origem: {item.doadorOuFornecedor}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${PAT_CAT_CONFIG[item.categoria]?.bg} ${PAT_CAT_CONFIG[item.categoria]?.text}`}>
                        {PAT_CAT_CONFIG[item.categoria]?.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-gray-700">
                      <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" /> {item.localizacaoSala}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PAT_ESTADO_CONFIG[item.estadoConservacao]?.bg} ${PAT_ESTADO_CONFIG[item.estadoConservacao]?.text}`}>
                        {PAT_ESTADO_CONFIG[item.estadoConservacao]?.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600">
                      <p className="font-bold">{item.formaAquisicao}</p>
                      <p className="text-[10px] text-gray-400">{formatDateBR(item.dataAquisicao)}</p>
                    </td>
                    <td className="py-4 px-4 text-xs font-black text-gray-900">
                      {item.valorEstimado ? `R$ ${item.valorEstimado.toFixed(2)}` : 'R$ 0,00'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.numeroTombamento, item.denominacao)}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Baixar Tombamento"
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
                    Nenhum bem patrimonial encontrado no almoxarifado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição de Tombamento */}
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
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {editingItem ? 'Editar Bem Tombado' : 'Tombar Novo Bem Patrimonial'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Controle de Bens & Almoxarifado CEMIL</p>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Número do Tombamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numeroTombamento}
                      onChange={(e) => setFormData({ ...formData, numeroTombamento: e.target.value })}
                      placeholder="PAT-0001"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Categoria do Bem
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as PatrimonioCategoria })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="EQUIPAMENTO_AUDIOVISUAL">Equipamento Audiovisual / Som</option>
                      <option value="MOBILIARIO">Mobiliário / Mesas e Cadeiras</option>
                      <option value="INFORMATICA">Informática / Computador / Projetor</option>
                      <option value="INSTRUMENTO_MUSICAL">Instrumento Musical / Harmonização</option>
                      <option value="ELETRODOMESTICO">Eletrodoméstico / Cozinha</option>
                      <option value="IMOVEL">Imóvel / Estrutura Física</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Denominação do Bem (Nome / Modelo) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.denominacao}
                      onChange={(e) => setFormData({ ...formData, denominacao: e.target.value })}
                      placeholder="Ex: Projetor Epson PowerLite X49 ou Microfone Sem Fio Shure"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Localização / Sala Alocada *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.localizacaoSala}
                      onChange={(e) => setFormData({ ...formData, localizacaoSala: e.target.value })}
                      placeholder="Ex: Salão Nobre, Sala de Passes, Livraria"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Estado de Conservação
                    </label>
                    <select
                      value={formData.estadoConservacao}
                      onChange={(e) => setFormData({ ...formData, estadoConservacao: e.target.value as PatrimonioEstado })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="EXCELENTE">Excelente</option>
                      <option value="BOM">Bom</option>
                      <option value="REGULAR">Regular</option>
                      <option value="NECESSITA_MANUTENCAO">Necessita Manutenção / Reparo</option>
                      <option value="INSERVIVEL">Inservível (Pronto para Baixa)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Forma de Aquisição
                    </label>
                    <select
                      value={formData.formaAquisicao}
                      onChange={(e) => setFormData({ ...formData, formaAquisicao: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="DOACAO">Doação Espontânea</option>
                      <option value="COMPRA">Compra Direta Institucional</option>
                      <option value="COMODATO">Comodato / Empréstimo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Valor Estimado / Nota Fiscal (R$)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={formData.valorEstimado}
                      onChange={(e) => setFormData({ ...formData, valorEstimado: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Data da Aquisição / Entrada
                    </label>
                    <input
                      type="date"
                      value={formData.dataAquisicao}
                      onChange={(e) => setFormData({ ...formData, dataAquisicao: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Doador ou Fornecedor
                    </label>
                    <input
                      type="text"
                      value={formData.doadorOuFornecedor}
                      onChange={(e) => setFormData({ ...formData, doadorOuFornecedor: e.target.value })}
                      placeholder="Ex: Irmão Benfeitor Anônimo ou Loja Kalunga"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Observações / Número de Série
                    </label>
                    <textarea
                      rows={2}
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Número de série, voltagem, acessórios inclusos..."
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
                    {editingItem ? 'Atualizar Tombamento' : 'Salvar Tombamento'}
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
