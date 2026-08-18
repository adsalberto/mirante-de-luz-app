import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Plus, Search, Filter, Download, 
  Calendar, CheckCircle2, AlertCircle, Edit2, Trash2, 
  X, TrendingUp, TrendingDown, DollarSign, ShieldCheck, 
  Store, FileSpreadsheet, Lock, Check
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AdminBalanceteMensal, CashSession } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const TesourariaBalancetesView: React.FC = () => {
  const [balancetes, setBalancetes] = useState<AdminBalanceteMensal[]>([]);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminBalanceteMensal | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    mesAno: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
    saldoAnterior: 5000,
    totalEntradas: 3200,
    totalSaidas: 1800,
    status: 'APROVADO_CONSELHO_FISCAL' as 'ABERTO' | 'FECHADO' | 'APROVADO_CONSELHO_FISCAL',
    parecerConselhoFiscal: 'O Conselho Fiscal examinou os livros caixas, comprovantes de receitas (doações, mensalidades, livraria) e despesas (água, luz, manutenção), constatando exatidão dos lançamentos contábeis.',
    dataAprovacao: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubBalancetes = dataService.subscribeAdminBalancetes((list) => {
      setBalancetes(list || []);
    });

    const unsubCash = dataService.subscribeActiveCashSession((session) => {
      setActiveCashSession(session);
    });

    return () => {
      unsubBalancetes();
      unsubCash();
    };
  }, []);

  const handleOpenModal = (item?: AdminBalanceteMensal) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        mesAno: item.mesAno,
        saldoAnterior: item.saldoAnterior,
        totalEntradas: item.totalEntradas,
        totalSaidas: item.totalSaidas,
        status: item.status,
        parecerConselhoFiscal: item.parecerConselhoFiscal || '',
        dataAprovacao: item.dataAprovacao || new Date().toISOString().split('T')[0]
      });
    } else {
      const now = new Date();
      const currentMesAno = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      setEditingItem(null);
      setFormData({
        mesAno: currentMesAno,
        saldoAnterior: 4500,
        totalEntradas: 3800,
        totalSaidas: 2100,
        status: 'APROVADO_CONSELHO_FISCAL',
        parecerConselhoFiscal: 'O Conselho Fiscal examinou as contas do mês e atesta regularidade e conformidade com as diretrizes estatutárias da Casa.',
        dataAprovacao: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mesAno.trim()) return;

    const saldoAnterior = Number(formData.saldoAnterior) || 0;
    const totalEntradas = Number(formData.totalEntradas) || 0;
    const totalSaidas = Number(formData.totalSaidas) || 0;
    const saldoAtual = saldoAnterior + totalEntradas - totalSaidas;

    const item: AdminBalanceteMensal = {
      id: editingItem ? editingItem.id : `balancete_${Date.now()}`,
      mesAno: formData.mesAno.trim(),
      saldoAnterior,
      totalEntradas,
      totalSaidas,
      saldoAtual,
      status: formData.status,
      parecerConselhoFiscal: formData.parecerConselhoFiscal.trim() || undefined,
      dataAprovacao: formData.dataAprovacao || undefined,
      createdAt: editingItem ? editingItem.createdAt : Date.now()
    };

    await dataService.saveAdminBalancete(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, mesAno: string) => {
    if (window.confirm(`Deseja realmente remover o balancete de ${mesAno}?`)) {
      await dataService.deleteAdminBalancete(id);
    }
  };

  const exportBalancetePDF = (item: AdminBalanceteMensal) => {
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
    doc.text('Tesouraria & Conselho Fiscal • Balancete Contábil Mensal Demonstrativo', 14, 22);
    doc.text(`Competência: ${item.mesAno}`, 14, 28);

    // Body
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`DEMONSTRATIVO FINANCEIRO - MÊS ${item.mesAno}`, 14, 46);

    const tableData = [
      ['Saldo Anterior em Caixa/Bancos', `R$ ${item.saldoAnterior.toFixed(2)}`],
      ['(+) Total de Entradas / Receitas (Doações, Livraria, Bazar, Mensalidades)', `R$ ${item.totalEntradas.toFixed(2)}`],
      ['(-) Total de Saídas / Despesas (Manutenção, Insumos, Cestas)', `R$ ${item.totalSaidas.toFixed(2)}`],
      ['(=) Saldo Final do Exercício', `R$ ${item.saldoAtual.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 52,
      head: [['Item Contábil', 'Valor (R$)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Parecer do Conselho Fiscal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARECER DO CONSELHO FISCAL:', 14, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    const splitParecer = doc.splitTextToSize(item.parecerConselhoFiscal || 'Sem parecer registrado.', 180);
    doc.text(splitParecer, 14, currentY);
    currentY += (splitParecer.length * 5) + 20;

    // Assinaturas
    doc.line(20, currentY, 90, currentY);
    doc.line(115, currentY, 185, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('1º Tesoureiro Geral', 20, currentY);
    doc.text('Presidente do Conselho Fiscal', 115, currentY);

    doc.save(`Balancete_${item.mesAno.replace('/', '_')}_CEMIL.pdf`);
  };

  const filteredBalancetes = balancetes.filter(item => 
    item.mesAno.includes(searchTerm) ||
    (item.parecerConselhoFiscal && item.parecerConselhoFiscal.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalEntradasConsolidadas = balancetes.reduce((acc, b) => acc + b.totalEntradas, 0);
  const totalSaidasConsolidadas = balancetes.reduce((acc, b) => acc + b.totalSaidas, 0);
  const ultimoBalancete = balancetes[0];

  return (
    <div className="space-y-6">
      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Saldo Atual Estimado</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              R$ {(ultimoBalancete?.saldoAtual || 5000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Entradas (Histórico)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              + R$ {totalEntradasConsolidadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Saídas (Histórico)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              - R$ {totalSaidasConsolidadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-purple-500 uppercase tracking-widest">Caixa PDV Livraria</p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {activeCashSession && activeCashSession.isOpen ? (
                <span className="text-emerald-600 flex items-center gap-1 font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aberto ({activeCashSession.openedBy})
                </span>
              ) : (
                <span className="text-gray-400 font-semibold">Fechado</span>
              )}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Store size={22} />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por mês/ano (ex: 08/2026)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Registrar Novo Balancete</span>
        </button>
      </div>

      {/* Grid of Balancetes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBalancetes.length > 0 ? (
          filteredBalancetes.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-base">Competência {item.mesAno}</h4>
                      <p className="text-xs text-gray-400">Prestação de Contas Mensal</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    item.status === 'APROVADO_CONSELHO_FISCAL' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : item.status === 'FECHADO' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'APROVADO_CONSELHO_FISCAL' ? 'Aprovado Conselho Fiscal' : item.status === 'FECHADO' ? 'Fechado' : 'Aberto'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded-2xl text-xs mb-4">
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Entradas</span>
                    <span className="font-black text-emerald-600 text-sm">+ R$ {item.totalEntradas.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Saídas</span>
                    <span className="font-black text-rose-600 text-sm">- R$ {item.totalSaidas.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Saldo Anterior</span>
                    <span className="font-bold text-gray-700">R$ {item.saldoAnterior.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Saldo Final</span>
                    <span className="font-black text-indigo-900 text-sm">R$ {item.saldoAtual.toFixed(2)}</span>
                  </div>
                </div>

                {item.parecerConselhoFiscal && (
                  <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50 text-xs text-gray-700 mb-4 line-clamp-2 italic">
                    <b>Parecer:</b> {item.parecerConselhoFiscal}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => exportBalancetePDF(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download size={13} />
                  <span>Baixar Balancete (PDF)</span>
                </button>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.mesAno)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <Coins size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Nenhum balancete cadastrado</p>
            <p className="text-xs text-gray-400 mt-1">Registre o fechamento contábil mensal e o parecer do conselho fiscal.</p>
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição de Balancete */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {editingItem ? 'Editar Balancete' : 'Novo Balancete Contábil Mensal'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Tesouraria & Conselho Fiscal CEMIL</p>
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
                      Mês / Ano (Competência) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.mesAno}
                      onChange={(e) => setFormData({ ...formData, mesAno: e.target.value })}
                      placeholder="08/2026"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Status da Prestação
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ABERTO">Aberto (Em Lançamento)</option>
                      <option value="FECHADO">Fechado pela Tesouraria</option>
                      <option value="APROVADO_CONSELHO_FISCAL">Aprovado pelo Conselho Fiscal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Saldo Anterior em Caixa (R$)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={formData.saldoAnterior}
                      onChange={(e) => setFormData({ ...formData, saldoAnterior: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Total de Entradas no Mês (R$)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={formData.totalEntradas}
                      onChange={(e) => setFormData({ ...formData, totalEntradas: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Total de Saídas / Despesas (R$)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={formData.totalSaidas}
                      onChange={(e) => setFormData({ ...formData, totalSaidas: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Data da Homologação
                    </label>
                    <input
                      type="date"
                      value={formData.dataAprovacao}
                      onChange={(e) => setFormData({ ...formData, dataAprovacao: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Parecer e Ata do Conselho Fiscal
                    </label>
                    <textarea
                      rows={3}
                      value={formData.parecerConselhoFiscal}
                      onChange={(e) => setFormData({ ...formData, parecerConselhoFiscal: e.target.value })}
                      placeholder="Parecer do conselho sobre a prestação de contas..."
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
                    {editingItem ? 'Atualizar Balancete' : 'Salvar Balancete'}
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
