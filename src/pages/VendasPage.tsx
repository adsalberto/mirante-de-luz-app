import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  BookOpen, 
  Coffee, 
  ShoppingBag, 
  AlertTriangle, 
  QrCode, 
  Coins, 
  CreditCard,
  PlusCircle,
  FileCheck2,
  Package,
  Percent,
  Tag,
  Pencil,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { cn } from '../lib/utils';

// Enhanced Interfaces with Promotional pricing support
interface MarketProduct {
  id: string;
  name: string;
  category: 'LIVRARIA' | 'CANTINA' | 'BAZAR';
  price: number;
  promoPrice?: number; // Optional promotional price
  stock: number;
  minLimit: number;
  expirationDate?: string;
}

interface FinancialTransaction {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SAÍDA';
  category: string;
  description: string;
  amount: number;
  amountEstimated?: number;
  amountRealized?: number;
  status?: string;
  accountType?: string;
  paymentMethod?: string;
}

export const VendasPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [cart, setCart] = useState<{ product: MarketProduct; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LIVRARIA' | 'CANTINA' | 'BAZAR'>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTÃO'>('PIX');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [soldAmount, setSoldAmount] = useState(0);
  const [finalDiscountApplied, setFinalDiscountApplied] = useState(0);

  // Cart discount states
  const [discountType, setDiscountType] = useState<'PERCENT' | 'VALUE'>('PERCENT');
  const [discountValueInput, setDiscountValueInput] = useState<string>('0');

  // New Product States (with promoPrice option)
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPromoPrice, setNewProdPromoPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdMin, setNewProdMin] = useState('5');
  const [newProdExp, setNewProdExp] = useState('');

  // Editing Product States
  const [editingProduct, setEditingProduct] = useState<MarketProduct | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdPromoPrice, setEditProdPromoPrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdMin, setEditProdMin] = useState('5');
  const [editProdExp, setEditProdExp] = useState('');

  // Load Admin Data from Storage
  useEffect(() => {
    // 1. Load Products
    const cachedProducts = localStorage.getItem('admin_products');
    if (cachedProducts) {
      try {
        setProducts(JSON.parse(cachedProducts));
      } catch {
        initializeDefaultProducts();
      }
    } else {
      initializeDefaultProducts();
    }
  }, []);

  const initializeDefaultProducts = () => {
    const defaults: MarketProduct[] = [
      { id: 'p1', name: 'Livro: O Livro dos Espíritos (Edição Histórica FEB)', category: 'LIVRARIA', price: 45.00, promoPrice: 39.90, stock: 12, minLimit: 5 },
      { id: 'p2', name: 'Livro: O Evangelho Segundo o Espiritismo', category: 'LIVRARIA', price: 45.00, stock: 3, minLimit: 5 },
      { id: 'p3', name: 'Livro: O Livro dos Médiuns', category: 'LIVRARIA', price: 45.00, stock: 6, minLimit: 5 },
      { id: 'p4', name: 'Pão de Queijo Assado (Fornada do Dia)', category: 'CANTINA', price: 5.50, stock: 25, minLimit: 8, expirationDate: '2026-05-22' },
      { id: 'p5', name: 'Suco Natural Polpa 300ml (Uva/Laranja)', category: 'CANTINA', price: 6.00, stock: 15, minLimit: 5, expirationDate: '2026-06-10' },
      { id: 'p6', name: 'Bolo Caseiro de Cenoura (Fatia)', category: 'CANTINA', price: 4.50, stock: 4, minLimit: 5, expirationDate: '2026-05-18' },
      { id: 'p7', name: 'Camiseta Infantil Estampa Mirante', category: 'BAZAR', price: 35.00, promoPrice: 24.90, stock: 8, minLimit: 3 },
      { id: 'p8', name: 'Artesanato em Gesso Decorado', category: 'BAZAR', price: 25.00, stock: 2, minLimit: 3 }
    ];
    localStorage.setItem('admin_products', JSON.stringify(defaults));
    setProducts(defaults);
  };

  const saveProductsToStorage = (list: MarketProduct[]) => {
    localStorage.setItem('admin_products', JSON.stringify(list));
    setProducts(list);
  };

  // Helper to obtain active selling price (considers promo value)
  const getSellingPrice = (p: MarketProduct): number => {
    if (p.promoPrice !== undefined && p.promoPrice > 0 && p.promoPrice < p.price) {
      return p.promoPrice;
    }
    return p.price;
  };

  // Cart operations
  const addToCart = (p: MarketProduct) => {
    if (p.stock <= 0) {
      alert('Produto esgotado no estoque!');
      return;
    }
    const existing = cart.find(item => item.product.id === p.id);
    if (existing) {
      if (existing.quantity >= p.stock) {
        alert('Limite do estoque atingido!');
        return;
      }
      setCart(cart.map(item => item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product: p, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const updateCartQty = (id: string, diff: number) => {
    const item = cart.find(i => i.product.id === id);
    if (!item) return;
    const newQty = item.quantity + diff;
    if (newQty <= 0) {
      removeFromCart(id);
    } else {
      const prod = products.find(p => p.id === id);
      if (prod && newQty > prod.stock) {
        alert('Limite do estoque atingido!');
        return;
      }
      setCart(cart.map(i => i.product.id === id ? { ...i, quantity: newQty } : i));
    }
  };

  // Reset/Reset demo inventory if needed
  const handleResetCatalog = () => {
    if (window.confirm('Deseja resetar o estoque para as configurações padrão do Mirante de Luz? (Isso sobrescreverá suas alterações locais)')) {
      initializeDefaultProducts();
      setCart([]);
    }
  };

  // Apply quick discount preset on total cart
  const applyPresetDiscount = (val: number, type: 'PERCENT' | 'VALUE' = 'PERCENT') => {
    setDiscountType(type);
    setDiscountValueInput(val.toString());
  };

  // Calculate Subtotal 
  const cartSubtotal = cart.reduce((acc, c) => acc + (getSellingPrice(c.product) * c.quantity), 0);

  // Calculate discount value
  const numDiscountValue = parseFloat(discountValueInput) || 0;
  const discountAmount = discountType === 'PERCENT'
    ? (cartSubtotal * numDiscountValue) / 100
    : numDiscountValue;

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  const handlePOSCheckout = () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho primeiro.');
      return;
    }

    if (numDiscountValue < 0 || discountAmount < 0) {
      alert('O valor do desconto não pode ser negativo.');
      return;
    }

    if (discountAmount > cartSubtotal) {
      alert('O desconto não pode ser maior do que o valor total da compra!');
      return;
    }

    // Step 1: Reduce stock in DB
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });

    saveProductsToStorage(updatedProducts);

    // Step 2: Save to transactions
    const itemsDescription = cart.map(c => {
      const itemPrice = getSellingPrice(c.product);
      const isPromo = c.product.promoPrice !== undefined && c.product.promoPrice < c.product.price;
      return `${c.quantity}x ${c.product.name.split(':')[0]} (${isPromo ? 'PROMO ' : ''}R$ ${itemPrice.toFixed(2)})`;
    }).join(', ');

    const discountDetail = discountAmount > 0 
      ? ` [Desconto de R$ ${discountAmount.toFixed(2)} (${discountType === 'PERCENT' ? `${discountValueInput}%` : 'Fixo'})]`
      : '';

    const tx: FinancialTransaction = {
      id: `TX:${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      category: 'Venda de Eventos/Bazar',
      description: `[PDV - ${paymentMethod}] ${itemsDescription}${discountDetail}`,
      amount: finalTotal,
      amountEstimated: finalTotal,
      amountRealized: finalTotal,
      status: 'Recebido',
      paymentMethod: paymentMethod
    };

    // Load existing transactions
    let existingTx: FinancialTransaction[] = [];
    const cachedTx = localStorage.getItem('admin_transactions');
    if (cachedTx) {
      try {
        existingTx = JSON.parse(cachedTx);
      } catch {}
    }

    const updatedTx = [tx, ...existingTx];
    localStorage.setItem('admin_transactions', JSON.stringify(updatedTx));

    // Audit Log
    dataService.createLog(
      'Venda Realizada', 
      `Nova venda finalizada via PDV [Líquido: R$ ${finalTotal.toFixed(2)} - ${paymentMethod}]${discountDetail}: ${itemsDescription}`
    );

    // Show success modal
    setSoldAmount(finalTotal);
    setFinalDiscountApplied(discountAmount);
    setCart([]);
    setDiscountValueInput('0');
    setCheckoutSuccess(true);
  };

  // Add new product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) {
      alert('Preencha os dados necessários do produto.');
      return;
    }
    const price = parseFloat(newProdPrice);
    const promo = newProdPromoPrice ? parseFloat(newProdPromoPrice) : undefined;
    const stock = parseInt(newProdStock);
    const min = parseInt(newProdMin);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      alert('Valores de preço e estoque inválidos.');
      return;
    }

    if (promo !== undefined && (isNaN(promo) || promo < 0)) {
      alert('Valor promocional inválido.');
      return;
    }

    if (promo !== undefined && promo >= price) {
      alert('O preço promocional precisa ser menor do que o preço original!');
      return;
    }

    const item: MarketProduct = {
      id: `P:${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      price: price,
      promoPrice: promo,
      stock: stock,
      minLimit: min || 5,
      expirationDate: newProdExp ? newProdExp : undefined
    };

    const updated = [...products, item];
    saveProductsToStorage(updated);
    
    // Reset forms
    setNewProdName('');
    setNewProdPrice('');
    setNewProdPromoPrice('');
    setNewProdStock('');
    setNewProdExp('');
    setShowAddProductModal(false);

    alert(`Produto "${newProdName}" cadastrado no acervo com sucesso!`);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: MarketProduct) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdPrice(p.price.toString());
    setEditProdPromoPrice(p.promoPrice ? p.promoPrice.toString() : '');
    setEditProdStock(p.stock.toString());
    setEditProdMin(p.minLimit.toString());
    setEditProdExp(p.expirationDate || '');
    setShowEditProductModal(true);
  };

  // Edit / Update Product
  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editProdName || !editProdPrice || !editProdStock) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const price = parseFloat(editProdPrice);
    const promo = editProdPromoPrice ? parseFloat(editProdPromoPrice) : undefined;
    const stock = parseInt(editProdStock);
    const min = parseInt(editProdMin);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      alert('Valores de preço ou estoque inválidos.');
      return;
    }

    if (promo !== undefined && (isNaN(promo) || promo < 0)) {
      alert('Preço promocional inválido.');
      return;
    }

    if (promo !== undefined && promo >= price) {
      alert('Preço promocional precisa ser menor do que o original!');
      return;
    }

    const updated = products.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          name: editProdName,
          category: editProdCategory,
          price: price,
          promoPrice: promo && promo > 0 ? promo : undefined,
          stock: stock,
          minLimit: min,
          expirationDate: editProdExp ? editProdExp : undefined
        };
      }
      return p;
    });

    saveProductsToStorage(updated);
    setShowEditProductModal(false);
    setEditingProduct(null);

    // Also update instances in active cart if any
    const updatedCart = cart.map(item => {
      const liveProd = updated.find(up => up.id === item.product.id);
      if (liveProd) {
        return { ...item, product: liveProd };
      }
      return item;
    });
    setCart(updatedCart);

    alert('Informações do produto e promoções salvas com sucesso!');
  };

  // Delete product on editing modal
  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja DELETAR o produto "${name}" permanentemente do estoque?`)) {
      const updated = products.filter(p => p.id !== id);
      saveProductsToStorage(updated);
      setCart(cart.filter(item => item.product.id !== id));
      setShowEditProductModal(false);
      setEditingProduct(null);
      alert('Produto removido.');
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-905 tracking-tight uppercase flex items-center gap-2">
              <ShoppingCart size={28} className="text-indigo-600" />
              PDV de Vendas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Livraria de Obras Espíritas, Cantina Fraterna & Bazar Beneficente</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleResetCatalog}
            className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all active:scale-95 cursor-pointer"
            title="Resetar Estoque para Padrão"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Products catalog (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-5">
            
            {/* Filtering and search row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Category selector */}
              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full md:w-auto overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                    selectedCategory === 'ALL'
                      ? "bg-indigo-600 text-white shadow-md animate-in zoom-in-95 duration-150"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('LIVRARIA')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                    selectedCategory === 'LIVRARIA'
                      ? "bg-indigo-600 text-white shadow-md animate-in zoom-in-95"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <BookOpen size={14} />
                  Livraria
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('CANTINA')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                    selectedCategory === 'CANTINA'
                      ? "bg-indigo-600 text-white shadow-md animate-in zoom-in-95"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Coffee size={14} />
                  Cantina
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('BAZAR')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                    selectedCategory === 'BAZAR'
                      ? "bg-indigo-600 text-white shadow-md animate-in zoom-in-95"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <ShoppingBag size={14} />
                  Bazar
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar produto no estoque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

            </div>

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center justify-center space-y-4">
                <div className="p-4 bg-gray-50 rounded-full text-gray-400 border border-gray-100">
                  <Package size={40} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Nenhum produto catalogado</h3>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">Nenhum produto encontrado na categoria selecionada ou com este termo de busca.</p>
                </div>
                <button
                  onClick={() => { setSelectedCategory('ALL'); setSearchTerm(''); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.minLimit;
                  const isOut = p.stock <= 0;
                  const hasPromo = p.promoPrice !== undefined && p.promoPrice > 0 && p.promoPrice < p.price;
                  const activePrice = getSellingPrice(p);
                  const discountPercent = hasPromo ? Math.round(((p.price - p.promoPrice!) / p.price) * 100) : 0;
                  
                  return (
                    <div 
                      key={p.id}
                      className={cn(
                        "bg-white rounded-2xl p-4.5 border transition-all flex flex-col justify-between group h-[180px] relative overflow-hidden",
                        isOut 
                          ? "opacity-60 border-gray-100 bg-gray-50/50" 
                          : "border-gray-100 hover:border-indigo-150 hover:shadow-lg hover:shadow-indigo-50/20"
                      )}
                    >
                      {/* Promo Tag overlay */}
                      {hasPromo && !isOut && (
                        <div className="absolute top-0 right-0 bg-rose-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1/5 animate-pulse">
                          <span>Oferta -{discountPercent}%</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {/* Category and stock tag row */}
                        <div className="flex justify-between items-center pr-12">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            p.category === 'LIVRARIA' ? "bg-indigo-50 text-indigo-600" :
                            p.category === 'CANTINA' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {p.category}
                          </span>

                          <span className={cn(
                            "text-[10px] font-extrabold uppercase",
                            isOut ? "text-rose-600 font-black animate-pulse" :
                            isLowStock ? "text-amber-600" : "text-gray-400"
                          )}>
                            {isOut ? 'ESGOTADO' : `ESTOQUE: ${p.stock}`}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h3 className="font-black text-gray-900 leading-snug text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 h-10 pr-2">
                          {p.name}
                        </h3>
                      </div>

                      {/* Buy Action and Price row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                        <div>
                          {hasPromo ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold line-through leading-none">R$ {p.price.toFixed(2)}</span>
                              <span className="text-[15px] font-black text-rose-600 font-mono mt-0.5">
                                R$ {p.promoPrice!.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Preço</p>
                              <span className="text-[15px] font-black text-indigo-650 font-mono">
                                R$ {p.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Quick edit product directly from POS */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-2 border border-gray-100 hover:border-indigo-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer"
                            title="Editar produto / Gerenciar promoção"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            disabled={isOut}
                            onClick={() => addToCart(p)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border",
                              isOut 
                                ? "bg-gray-100 border-gray-150 text-gray-300 cursor-not-allowed"
                                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95"
                            )}
                            title="Adicionar ao carrinho"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Cart, Checkout, Summary Details (4 cols) */}
        <div className="lg:col-span-4 min-h-[500px] sticky top-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
            
            {/* Header / Cart Overview */}
            <div className="p-5 bg-indigo-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={20} className="text-[#FED02F]" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider">Carrinho PDV</h2>
              </div>
              <span className="bg-[#FED02F] text-indigo-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {cart.reduce((acc, c) => acc + c.quantity, 0)} ITENS
              </span>
            </div>

            {/* Cart list items */}
            <div className="p-5 flex-1 max-h-[250px] overflow-y-auto no-scrollbar border-b border-gray-50 min-h-[170px]">
              {cart.length === 0 ? (
                <div className="h-full py-10 flex flex-col items-center justify-center text-center space-y-3">
                  <ShoppingCart size={32} className="text-gray-300" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Carrinho Vazio</p>
                  <p className="text-[11px] text-gray-400 max-w-[180px]">Clique no botão "+" nos produtos ao lado para iniciar uma venda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const price = getSellingPrice(item.product);
                    const originalPrice = item.product.price;
                    const hasPromo = item.product.promoPrice !== undefined && item.product.promoPrice < originalPrice;
                    
                    return (
                      <div key={item.product.id} className="flex justify-between items-center gap-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-800 text-[11.5px] truncate leading-tight flex items-center gap-1">
                            {hasPromo && <span className="text-rose-500 font-bold" title="Preço de promoção ativo">🏷️</span>}
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {hasPromo && (
                              <span className="text-[9px] text-gray-400 line-through font-mono">
                                R$ {originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span className="text-[10px] text-indigo-650 font-mono font-black">
                              R$ {price.toFixed(2)} {hasPromo && <span className="text-rose-600 text-[9px] font-bold">(OFERTA)</span>}
                            </span>
                          </div>
                        </div>

                        {/* Quantity tools */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1 hover:bg-gray-200 text-gray-600 rounded-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="font-mono text-xs font-black text-gray-800 min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1 hover:bg-gray-200 text-gray-600 rounded-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50/70 rounded-md transition-all ml-1.5 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NEW ADDITION: Discount management section */}
            <div className="p-4 border-b border-gray-100 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-405 font-black uppercase tracking-wider flex items-center gap-1">
                  <Percent size={13} className="text-rose-600" />
                  Desconto no Carrinho (Promoções)
                </span>
                <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded-full">
                  {discountAmount > 0 ? `- R$ ${discountAmount.toFixed(2)}` : 'Nenhum'}
                </span>
              </div>

              {/* Presets discount buttons row */}
              <div className="grid grid-cols-5 gap-1 shadow-sm rounded-lg overflow-hidden border border-gray-100 bg-white">
                <button
                  type="button"
                  onClick={() => applyPresetDiscount(0)}
                  className={cn(
                    "py-1.5 text-[10px] font-black transition-all cursor-pointer border-r border-gray-100 last:border-0",
                    numDiscountValue === 0 ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  Sem desc.
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDiscount(5)}
                  className={cn(
                    "py-1.5 text-[10px] font-black transition-all cursor-pointer border-r border-gray-100 last:border-0",
                    numDiscountValue === 5 && discountType === 'PERCENT' ? "bg-rose-550 text-white" : "text-gray-500 hover:bg-gray-55"
                  )}
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDiscount(10)}
                  className={cn(
                    "py-1.5 text-[10px] font-black transition-all cursor-pointer border-r border-gray-100 last:border-0",
                    numDiscountValue === 10 && discountType === 'PERCENT' ? "bg-rose-550 text-white" : "text-gray-500 hover:bg-gray-55"
                  )}
                >
                  10%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDiscount(15)}
                  className={cn(
                    "py-1.5 text-[10px] font-black transition-all cursor-pointer border-r border-gray-100 last:border-0",
                    numDiscountValue === 15 && discountType === 'PERCENT' ? "bg-rose-550 text-white" : "text-gray-500 hover:bg-gray-55"
                  )}
                >
                  15%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetDiscount(20)}
                  className={cn(
                    "py-1.5 text-[10px] font-black transition-all cursor-pointer last:border-0",
                    numDiscountValue === 20 && discountType === 'PERCENT' ? "bg-rose-550 text-white" : "text-gray-500 hover:bg-gray-55"
                  )}
                >
                  20%
                </button>
              </div>

              {/* Custom discount picker toggler */}
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100">
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value as 'PERCENT' | 'VALUE');
                    setDiscountValueInput('0');
                  }}
                  className="bg-transparent text-[11px] font-black text-gray-700 uppercase pr-2 focus:outline-none focus:ring-0 border-0 cursor-pointer"
                >
                  <option value="PERCENT">% Percentual</option>
                  <option value="VALUE">Valor Bruto (R$)</option>
                </select>

                <div className="flex-1 flex items-center justify-end font-mono">
                  <span className="text-[11px] font-bold text-gray-400 mr-1">
                    {discountType === 'PERCENT' ? '%' : 'R$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountValueInput}
                    onChange={(e) => setDiscountValueInput(e.target.value)}
                    className="w-16 text-right bg-gray-50 border border-gray-100 focus:border-rose-500/50 rounded-lg py-1 px-1.5 font-bold text-xs font-mono focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Checkout settings and summary */}
            <div className="p-5 bg-gray-50/30 space-y-4">
              
              {/* Total calculations list */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold leading-none">
                  <span>Subtotal</span>
                  <span className="font-mono text-gray-700">R$ {cartSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-600 font-extrabold leading-none animate-in slide-in-from-top-1">
                    <span className="flex items-center gap-1">🏷️ Desconto Total</span>
                    <span className="font-mono font-black">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-end justify-between border-t border-gray-100 pt-3 mt-1 pb-1">
                  <span className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-none">Total Líquido</span>
                  <span className="font-black text-xl text-indigo-950 font-mono leading-none">
                    R$ {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment methods choosing */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Método de Recebimento</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={cn(
                      "p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer",
                      paymentMethod === 'PIX'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <QrCode size={16} />
                    <span className="text-[9px] font-black uppercase">PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={cn(
                      "p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer",
                      paymentMethod === 'DINHEIRO'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <Coins size={16} />
                    <span className="text-[9px] font-black uppercase">Dinheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTÃO')}
                    className={cn(
                      "p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer",
                      paymentMethod === 'CARTÃO'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-55"
                    )}
                  >
                    <CreditCard size={16} />
                    <span className="text-[9px] font-black uppercase">Cartão</span>
                  </button>
                </div>
              </div>

              {/* Checkout Submit button */}
              <button
                type="button"
                onClick={handlePOSCheckout}
                disabled={cart.length === 0}
                className={cn(
                  "w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-center cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md",
                  cart.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-150"
                    : "bg-indigo-600 text-white hover:bg-indigo-750 active:scale-95 shadow-indigo-150 hover:shadow-lg"
                )}
              >
                <FileCheck2 size={16} />
                <span>Finalizar Cobrança</span>
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* Modern Dialog - Fast creation of product */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl relative border border-gray-105"
            >
              <button 
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 mb-5">
                <h2 className="text-lg font-black text-gray-901 uppercase tracking-tight flex items-center justify-center gap-1.5">
                  <PlusCircle className="text-indigo-650" size={20} />
                  Catalogar Produto Novo
                </h2>
                <p className="text-xs text-gray-400 font-medium">Cadastre obras, materiais, lanches ou itens do bazar direto no sistema.</p>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Livro Caminho da Luz"
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Categoria</label>
                    <select
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value as 'LIVRARIA' | 'CANTINA' | 'BAZAR')}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="LIVRARIA">Livraria</option>
                      <option value="CANTINA">Cantina</option>
                      <option value="BAZAR">Bazar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center pb-0.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Preço de Venda (R$)</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="Ex: 45.00"
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100/50 space-y-1">
                  <div className="flex items-center gap-1 md:gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <Tag size={12} />
                    <span>Promoção Ativa? (Opcional)</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal mb-1.5">Configure um valor com desconto. Ao vender, o sistema priorizará esse preço.</p>
                  
                  <div className="relative">
                    <span className="absolute left-3 inset-y-0 text-rose-500 text-xs font-black font-mono flex items-center pointer-events-none">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 35.00 (Deixar em branco para preço regular)"
                      value={newProdPromoPrice}
                      onChange={e => setNewProdPromoPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-rose-100 rounded-xl text-xs font-semibold text-rose-600 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-350"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estoque Inicial</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Qtd"
                      value={newProdStock}
                      onChange={e => setNewProdStock(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estoque Mínimo</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Mínimo"
                      value={newProdMin}
                      onChange={e => setNewProdMin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {newProdCategory === 'CANTINA' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Data de Validade</label>
                    <input
                      type="date"
                      value={newProdExp}
                      onChange={e => setNewProdExp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Cadastrar
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Promote Existing Product Modal */}
      <AnimatePresence>
        {showEditProductModal && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl relative border border-gray-105"
            >
              <button 
                type="button"
                onClick={() => { setShowEditProductModal(false); setEditingProduct(null); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 mb-5">
                <h2 className="text-lg font-black text-gray-901 uppercase tracking-tight flex items-center justify-center gap-1.5">
                  <Pencil className="text-indigo-650" size={18} />
                  Gerenciar Item & Promoção
                </h2>
                <p className="text-xs text-gray-400 font-medium">Modifique preços, estoque, lance descontos e promoções.</p>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={editProdName}
                    onChange={e => setEditProdName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Categoria</label>
                    <select
                      value={editProdCategory}
                      onChange={e => setEditProdCategory(e.target.value as 'LIVRARIA' | 'CANTINA' | 'BAZAR')}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="LIVRARIA">Livraria</option>
                      <option value="CANTINA">Cantina</option>
                      <option value="BAZAR">Bazar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Preço de Venda Regular (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editProdPrice}
                      onChange={e => setEditProdPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* PROMO BOX */}
                <div className="bg-rose-50/75 rounded-2xl p-4 border border-rose-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <Sparkles size={13} className="animate-bounce" />
                    <span>PROMOÇÃO ATIVA / LIQUIDAÇÃO?</span>
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-normal mb-1">
                    Defina um preço promocional menor que o preço das obras regulares ou bazar. Apague o valor para desativar a promoção do produto.
                  </p>
                  
                  <div className="relative">
                    <span className="absolute left-3 inset-y-0 text-rose-550 text-xs font-black font-mono flex items-center pointer-events-none">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 35.00 (Deixe zerado para apagar promoção)"
                      value={editProdPromoPrice}
                      onChange={e => setEditProdPromoPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/15 focus:border-rose-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estoque Atual</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editProdStock}
                      onChange={e => setEditProdStock(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estoque Mínimo</label>
                    <input
                      type="number"
                      min="1"
                      value={editProdMin}
                      onChange={e => setEditProdMin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {editProdCategory === 'CANTINA' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Data de Validade</label>
                    <input
                      type="date"
                      value={editProdExp}
                      onChange={e => setEditProdExp(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-3 justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-rose-100 shrink-0"
                    title="Excluir Item do Catálogo"
                  >
                    <Trash2 size={14} />
                    <span>Deletar</span>
                  </button>

                  <div className="flex gap-1.5 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowEditProductModal(false); setEditingProduct(null); }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal */}
      <AnimatePresence>
        {checkoutSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-sm w-full p-6 shadow-2xl space-y-5 text-center relative border border-gray-100"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto">
                <Check size={40} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-gray-901 uppercase tracking-tight text-emerald-650">Venda de Sucesso!</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Lançamento de Entrada no Caixa</p>
                <div className="space-y-0.5">
                  <p className="text-2xl font-black text-indigo-900 tracking-tight font-mono leading-none">
                    R$ {soldAmount.toFixed(2)}
                  </p>
                  {finalDiscountApplied > 0 && (
                    <p className="text-xs font-bold text-rose-600 font-mono">
                      (Desconto de R$ {finalDiscountApplied.toFixed(2)} deduzido)
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-[10.5px] text-gray-500 font-medium leading-relaxed">
                As unidades do estoque foram atualizadas em tempo real e o faturamento líquido foi lançado com sucesso no livro caixa financeiro do portal (Mirante de Luz) na modalidade <span className="font-extrabold text-indigo-650 leading-none">{paymentMethod}</span>.
              </div>

              <button
                type="button"
                onClick={() => setCheckoutSuccess(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer animate-pulse"
              >
                Nova venda no PDV
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
