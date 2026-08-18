import React, { useState } from 'react';
import { 
  Plus, 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Phone, 
  FileText, 
  Trash2, 
  Edit3, 
  X,
  Sparkles,
  BookMarked
} from 'lucide-react';
import { DoutrinarioMaterial, DoutrinarioEmprestimoLivro } from '../../types';

interface BibliotecaTabProps {
  materiais: DoutrinarioMaterial[];
  emprestimos: DoutrinarioEmprestimoLivro[];
  onSaveMaterial: (material: Omit<DoutrinarioMaterial, 'id'> | DoutrinarioMaterial) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onSaveEmprestimo: (emprestimo: Omit<DoutrinarioEmprestimoLivro, 'id'> | DoutrinarioEmprestimoLivro) => Promise<void>;
  onReturnEmprestimo: (id: string, bookId: string) => Promise<void>;
  onRenewEmprestimo: (id: string) => Promise<void>;
  onDeleteEmprestimo: (id: string) => Promise<void>;
}

export const BibliotecaTab: React.FC<BibliotecaTabProps> = ({
  materiais,
  emprestimos,
  onSaveMaterial,
  onDeleteMaterial,
  onSaveEmprestimo,
  onReturnEmprestimo,
  onRenewEmprestimo,
  onDeleteEmprestimo
}) => {
  const [subView, setSubView] = useState<'CATALOGO' | 'EMPRESTIMOS'>('CATALOGO');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<DoutrinarioMaterial | null>(null);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedBookForLoan, setSelectedBookForLoan] = useState<DoutrinarioMaterial | null>(null);

  // Material Form State
  const [bookFormData, setBookFormData] = useState({
    name: '',
    author: '',
    type: 'LIVRO' as DoutrinarioMaterial['type'],
    category: 'OBRAS_BASICAS' as DoutrinarioMaterial['category'],
    totalCopies: 3,
    availableCopies: 3,
    observations: ''
  });

  // Loan Form State
  const [loanFormData, setLoanFormData] = useState({
    bookId: '',
    bookTitle: '',
    author: '',
    readerName: '',
    readerPhone: '',
    readerEmail: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const handleOpenNewBook = () => {
    setEditingMaterial(null);
    setBookFormData({
      name: '',
      author: 'Allan Kardec',
      type: 'LIVRO',
      category: 'OBRAS_BASICAS',
      totalCopies: 3,
      availableCopies: 3,
      observations: ''
    });
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (item: DoutrinarioMaterial) => {
    setEditingMaterial(item);
    setBookFormData({
      name: item.name,
      author: item.author,
      type: item.type,
      category: item.category,
      totalCopies: item.totalCopies || 1,
      availableCopies: item.availableCopies || 1,
      observations: item.observations || ''
    });
    setIsBookModalOpen(true);
  };

  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.name || !bookFormData.author) return;

    if (editingMaterial) {
      await onSaveMaterial({
        ...editingMaterial,
        ...bookFormData
      });
    } else {
      await onSaveMaterial({
        ...bookFormData
      });
    }
    setIsBookModalOpen(false);
  };

  const handleOpenLoanForBook = (book: DoutrinarioMaterial) => {
    setSelectedBookForLoan(book);
    setLoanFormData({
      bookId: book.id,
      bookTitle: book.name,
      author: book.author,
      readerName: '',
      readerPhone: '',
      readerEmail: '',
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    });
    setIsLoanModalOpen(true);
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanFormData.readerName || !loanFormData.bookId) return;

    await onSaveEmprestimo({
      ...loanFormData,
      status: 'EMPRESTADO'
    });
    setIsLoanModalOpen(false);
  };

  // Filtered Materials
  const filteredMaterials = materiais.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Loans
  const filteredLoans = emprestimos.filter((emp) => {
    const matchesSearch = 
      emp.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.readerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.readerPhone.includes(searchTerm);
    return matchesSearch;
  });

  const isOverdue = (dueDate: string, status: DoutrinarioEmprestimoLivro['status']) => {
    if (status === 'DEVOLVIDO') return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const activeLoans = emprestimos.filter(e => e.status !== 'DEVOLVIDO');
  const overdueCount = activeLoans.filter(e => isOverdue(e.dueDate, e.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSubView('CATALOGO')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'CATALOGO'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo do Acervo ({materiais.length})</span>
          </button>

          <button
            onClick={() => setSubView('EMPRESTIMOS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'EMPRESTIMOS'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Controle de Empréstimos ({activeLoans.length})</span>
            {overdueCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {overdueCount} vencidos
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subView === 'CATALOGO' ? (
            <button
              onClick={handleOpenNewBook}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Obra ao Acervo</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (materiais.length > 0) {
                  handleOpenLoanForBook(materiais[0]);
                } else {
                  handleOpenNewBook();
                }
              }}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Empréstimo</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={subView === 'CATALOGO' ? "Buscar livro ou autor espírita..." : "Buscar por leitor, livro ou telefone..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {subView === 'CATALOGO' && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="OBRAS_BASICAS">Obras Básicas (Kardec)</option>
            <option value="MEDIUNIDADE">Mediunidade</option>
            <option value="ESTUDOS">Estudos Doutrinários</option>
            <option value="EVANGELIZACAO">Infância & Juventude</option>
            <option value="REFORMA_INTIMA">Reforma Íntima / Mensagens</option>
          </select>
        )}
      </div>

      {/* 1. VIEW: CATÁLOGO DO ACERVO */}
      {subView === 'CATALOGO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                    {item.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={`font-bold ${
                      (item.availableCopies || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}>
                      {item.availableCopies || 0}
                    </span>
                    <span className="text-slate-400">/{item.totalCopies || 1} exemplares</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Autor(a): <span className="font-semibold text-slate-700 dark:text-slate-300">{item.author}</span>
                  </p>
                </div>

                {item.observations && (
                  <p className="text-xs text-slate-500 line-clamp-2 italic">
                    "{item.observations}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between gap-2">
                <button
                  disabled={(item.availableCopies || 0) <= 0}
                  onClick={() => handleOpenLoanForBook(item)}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Emprestar</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditBook(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMaterial(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMaterials.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                Nenhum livro cadastrado
              </p>
              <p className="text-xs text-slate-500">
                Clique em "Adicionar Obra ao Acervo" para registrar livros das Obras Básicas e literatura complementar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. VIEW: CONTROLE DE EMPRÉSTIMOS */}
      {subView === 'EMPRESTIMOS' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3.5">Livro & Autor</th>
                  <th className="px-4 py-3.5">Leitor / Assistido</th>
                  <th className="px-4 py-3.5">Contato</th>
                  <th className="px-4 py-3.5">Retirada</th>
                  <th className="px-4 py-3.5">Devolução Prevista</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLoans.map((emp) => {
                  const overdue = isOverdue(emp.dueDate, emp.status);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div>{emp.bookTitle}</div>
                        <span className="text-[10px] text-slate-500 font-normal">{emp.author}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {emp.readerName}
                      </td>
                      <td className="px-4 py-3">
                        {emp.readerPhone && (
                          <a
                            href={`https://wa.me/55${emp.readerPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Phone className="w-3 h-3" /> {emp.readerPhone}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {emp.borrowDate}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${overdue ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1' : 'text-slate-800 dark:text-slate-200'}`}>
                          {overdue && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          {emp.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {emp.status === 'DEVOLVIDO' ? (
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                            Devolvido
                          </span>
                        ) : overdue ? (
                          <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                            Atrasado
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            Em Andamento
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {emp.status !== 'DEVOLVIDO' && (
                          <>
                            <button
                              onClick={() => onReturnEmprestimo(emp.id, emp.bookId)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer"
                              title="Registrar devolução"
                            >
                              Devolver
                            </button>
                            <button
                              onClick={() => onRenewEmprestimo(emp.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer"
                              title="Renovar por mais 14 dias"
                            >
                              Renovar (+14d)
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteEmprestimo(emp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      Nenhum empréstimo ativo no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO DE LIVRO */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {editingMaterial ? 'Editar Obra do Acervo' : 'Adicionar Nova Obra ao Acervo'}
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBook} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Título da Obra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: O Livro dos Espíritos"
                  value={bookFormData.name}
                  onChange={(e) => setBookFormData({ ...bookFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Autor(a) / Espírito *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Allan Kardec"
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Categoria
                  </label>
                  <select
                    value={bookFormData.category}
                    onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="OBRAS_BASICAS">Obras Básicas (Kardec)</option>
                    <option value="MEDIUNIDADE">Mediunidade</option>
                    <option value="ESTUDOS">Estudos Doutrinários</option>
                    <option value="EVANGELIZACAO">Infância & Juventude</option>
                    <option value="REFORMA_INTIMA">Reforma Íntima / Mensagens</option>
                    <option value="ATENDIMENTO_FRATERNO">Atendimento Fraterno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Total de Exemplares
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookFormData.totalCopies}
                    onChange={(e) => setBookFormData({ ...bookFormData, totalCopies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Disponíveis para Empréstimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={bookFormData.totalCopies}
                    value={bookFormData.availableCopies}
                    onChange={(e) => setBookFormData({ ...bookFormData, availableCopies: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingMaterial ? 'Salvar Obra' : 'Cadastrar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO EMPRÉSTIMO */}
      {isLoanModalOpen && selectedBookForLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                Registrar Empréstimo de Livro
              </h3>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Livro Selecionado:</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{loanFormData.bookTitle}</p>
              <p className="text-xs text-slate-500">Autor: {loanFormData.author}</p>
            </div>

            <form onSubmit={handleSubmitLoan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Nome do Leitor / Assistido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do assistido"
                  value={loanFormData.readerName}
                  onChange={(e) => setLoanFormData({ ...loanFormData, readerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(00) 00000-0000"
                  value={loanFormData.readerPhone}
                  onChange={(e) => setLoanFormData({ ...loanFormData, readerPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Data do Empréstimo
                  </label>
                  <input
                    type="date"
                    required
                    value={loanFormData.borrowDate}
                    onChange={(e) => setLoanFormData({ ...loanFormData, borrowDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Devolução Prevista (+14d)
                  </label>
                  <input
                    type="date"
                    required
                    value={loanFormData.dueDate}
                    onChange={(e) => setLoanFormData({ ...loanFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
