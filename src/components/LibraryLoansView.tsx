import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, Calendar, Clock, CheckCircle, AlertTriangle, User, Phone, Trash2, Edit3, ArrowRight, BookMarked, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { BookLoan } from '../types';

export const LibraryLoansView: React.FC = () => {
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EMPRESTADO' | 'DEVOLVIDO' | 'ATRASADO'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<BookLoan | null>(null);

  // Form fields
  const [bookTitle, setBookTitle] = useState('');
  const [bookCode, setBookCode] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days loan period by default
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const list = await dataService.getBookLoans();
    setLoans(list || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle || !borrowerName) return;

    if (editingLoan) {
      await dataService.updateBookLoan({
        ...editingLoan,
        bookTitle,
        bookIsbnOrCode: bookCode,
        borrowerName,
        borrowerContact,
        loanDate,
        dueDate,
        notes
      });
    } else {
      await dataService.addBookLoan({
        bookTitle,
        bookIsbnOrCode: bookCode,
        borrowerName,
        borrowerContact,
        loanDate,
        dueDate,
        status: 'EMPRESTADO',
        notes
      });
    }

    closeModal();
    loadLoans();
  };

  const handleReturnBook = async (loan: BookLoan) => {
    await dataService.updateBookLoan({
      ...loan,
      status: 'DEVOLVIDO',
      returnDate: new Date().toISOString().split('T')[0]
    });
    loadLoans();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro de empréstimo?')) {
      await dataService.deleteBookLoan(id);
      loadLoans();
    }
  };

  const openNewModal = () => {
    setEditingLoan(null);
    setBookTitle('');
    setBookCode('');
    setBorrowerName('');
    setBorrowerContact('');
    setLoanDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (loan: BookLoan) => {
    setEditingLoan(loan);
    setBookTitle(loan.bookTitle);
    setBookCode(loan.bookIsbnOrCode || '');
    setBorrowerName(loan.borrowerName);
    setBorrowerContact(loan.borrowerContact);
    setLoanDate(loan.loanDate);
    setDueDate(loan.dueDate);
    setNotes(loan.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLoan(null);
  };

  const filteredLoans = loans.filter(l => {
    const matchesSearch = 
      l.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.bookIsbnOrCode && l.bookIsbnOrCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = loans.filter(l => l.status === 'EMPRESTADO').length;
  const overdueCount = loans.filter(l => l.status === 'ATRASADO' || (l.status === 'EMPRESTADO' && l.dueDate < new Date().toISOString().split('T')[0])).length;

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{loans.length}</div>
            <div className="text-xs font-semibold text-slate-500">Total de Empréstimos</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeCount}</div>
            <div className="text-xs font-semibold text-slate-500">Livros em Empréstimo</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{overdueCount}</div>
            <div className="text-xs font-semibold text-slate-500">Em Atraso / Cobrança</div>
          </div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por livro, leitor ou código..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'EMPRESTADO', 'ATRASADO', 'DEVOLVIDO'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st === 'EMPRESTADO' ? 'Empréstimos' : st === 'ATRASADO' ? 'Atrasados' : 'Devolvidos'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Novo Empréstimo</span>
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Obra Espiritual / Livro</th>
                <th className="p-4">Leitor / Contato</th>
                <th className="p-4">Data Empréstimo</th>
                <th className="p-4">Data Devolução</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {filteredLoans.length > 0 ? (
                filteredLoans.map(loan => {
                  const isOverdue = loan.status === 'ATRASADO' || (loan.status === 'EMPRESTADO' && loan.dueDate < new Date().toISOString().split('T')[0]);
                  
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-900">{loan.bookTitle}</div>
                        {loan.bookIsbnOrCode && (
                          <div className="text-xs text-slate-400 font-mono">Cód: {loan.bookIsbnOrCode}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{loan.borrowerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={12} />
                          <span>{loan.borrowerContact}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">{loan.loanDate}</td>
                      <td className="p-4 font-semibold text-slate-600">
                        {loan.dueDate}
                        {loan.returnDate && (
                          <div className="text-xs text-emerald-600 font-bold">Devolvido em {loan.returnDate}</div>
                        )}
                      </td>
                      <td className="p-4">
                        {loan.status === 'DEVOLVIDO' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold">
                            <CheckCircle size={12} />
                            Devolvido
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl text-xs font-bold animate-pulse">
                            <AlertTriangle size={12} />
                            Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                            <Clock size={12} />
                            Emprestado
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        {loan.status !== 'DEVOLVIDO' && (
                          <button
                            onClick={() => handleReturnBook(loan)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            title="Registrar devolução"
                          >
                            Devolver
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(loan)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    Nenhum empréstimo encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 border border-slate-100 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              {editingLoan ? 'Editar Empréstimo de Livro' : 'Novo Empréstimo de Livro'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Título do Livro / Obra *</label>
                <input 
                  type="text"
                  required
                  value={bookTitle}
                  onChange={e => setBookTitle(e.target.value)}
                  placeholder="Ex: O Livro dos Espíritos - Allan Kardec"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Código / Tombamento (Opcional)</label>
                <input 
                  type="text"
                  value={bookCode}
                  onChange={e => setBookCode(e.target.value)}
                  placeholder="Ex: BIB-0042"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nome do Leitor / Frequentador *</label>
                <input 
                  type="text"
                  required
                  value={borrowerName}
                  onChange={e => setBorrowerName(e.target.value)}
                  placeholder="Ex: Maria das Graças Silva"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Telefone / WhatsApp de Contato</label>
                <input 
                  type="text"
                  value={borrowerContact}
                  onChange={e => setBorrowerContact(e.target.value)}
                  placeholder="Ex: (11) 98888-7711"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Data Empréstimo</label>
                  <input 
                    type="date"
                    value={loanDate}
                    onChange={e => setLoanDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Data Devolução Prevista</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Observações</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observações do leitor ou da obra..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-100"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
