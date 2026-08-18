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
  Printer,
  Lock,
  Barcode,
  UserCheck,
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { MarketProduct, CashSession, Worker } from '../types';
import { cn } from '../lib/utils';

export const VendasPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [cart, setCart] = useState<{ product: MarketProduct; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LIVRARIA' | 'CANTINA' | 'BAZAR'>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTÃO' | 'CONTA_TRABALHADOR'>('PIX');
  
  // Workers for "Conta do Trabalhador / Venda Consignada"
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  // Change Calculator (Calculadora de Troco)
  const [receivedCash, setReceivedCash] = useState<string>('');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [soldAmount, setSoldAmount] = useState(0);

  // Cashier (Caixa Diário) states
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [closeCashModal, setCloseCashModal] = useState(false);
  const [openOperator, setOpenOperator] = useState('');
  const [openInitialCash, setOpenInitialCash] = useState('100.00');
  const [closeActualCash, setCloseActualCash] = useState('');

  // Snapshot states for the printable receipt modal
  const [checkoutCart, setCheckoutCart] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [checkoutSubtotal, setCheckoutSubtotal] = useState(0);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutTxId, setCheckoutTxId] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('');
  const [checkoutWorkerName, setCheckoutWorkerName] = useState<string | undefined>(undefined);
  const [checkoutChangeGiven, setCheckoutChangeGiven] = useState(0);
  const [checkoutReceivedCash, setCheckoutReceivedCash] = useState(0);

  // Cart discount states
  const [discountType, setDiscountType] = useState<'PERCENT' | 'VALUE'>('PERCENT');
  const [discountValueInput, setDiscountValueInput] = useState<string>('0');

  // New Product States (with promoPrice & barcode option)
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPromoPrice, setNewProdPromoPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdMin, setNewProdMin] = useState('5');
  const [newProdExp, setNewProdExp] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');

  // Editing Product States
  const [editingProduct, setEditingProduct] = useState<MarketProduct | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdPromoPrice, setEditProdPromoPrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdMin, setEditProdMin] = useState('5');
  const [editProdExp, setEditProdExp] = useState('');
  const [editProdBarcode, setEditProdBarcode] = useState('');

  // 1. Subscribe to Firestore Real-time Products, Cash Session, and Workers
  useEffect(() => {
    // Real-time market products listener from Firestore
    const unsubProducts = dataService.subscribeMarketProducts((list) => {
      setProducts(list);
    });

    // Real-time active cash session listener from Firestore
    const unsubSession = dataService.subscribeActiveCashSession((active) => {
      setCashSession(active);
      setSessionLoading(false);
    });

    // Load workers list for "Conta do Trabalhador"
    dataService.getWorkers().then(wList => {
      if (wList) setWorkers(wList.filter(w => w.active));
    });

    return () => {
      unsubProducts();
      unsubSession();
    };
  }, []);

  // Helper to obtain active selling price (considers promo value)
  const getSellingPrice = (p: MarketProduct): number => {
    if (p.promoPrice !== undefined && p.promoPrice > 0 && p.promoPrice < p.price) {
      return p.promoPrice;
    }
    return p.price;
  };

  // Expiration Check Helper for Cantina/Food
  const getExpirationBadge = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const today = new Date().toISOString().split('T')[0];
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (expirationDate <= today) {
      return { text: `⚠️ Vencido (${expirationDate.split('-').reverse().slice(0, 2).join('/')})`, isExpired: true };
    } else if (diffDays <= 7) {
      return { text: `⏳ Vence em ${diffDays}d`, isExpiringSoon: true };
    }
    return null;
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

  // Troco calculo
  const parsedReceivedCash = parseFloat(receivedCash) || 0;
  const changeAmount = paymentMethod === 'DINHEIRO' && parsedReceivedCash >= finalTotal
    ? parsedReceivedCash - finalTotal
    : 0;

  // Finalize Sale in Firestore
  const handlePOSCheckout = async () => {
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

    if (paymentMethod === 'DINHEIRO' && parsedReceivedCash > 0 && parsedReceivedCash < finalTotal) {
      alert(`O valor em dinheiro informado (R$ ${parsedReceivedCash.toFixed(2)}) é inferior ao total da venda (R$ ${finalTotal.toFixed(2)}).`);
      return;
    }

    if (paymentMethod === 'CONTA_TRABALHADOR' && !selectedWorkerId) {
      alert('Selecione o Voluntário/Trabalhador responsável para vincular esta venda.');
      return;
    }

    const selectedWorker = workers.find(w => w.id === selectedWorkerId);

    // 1. Reduce stock in Firestore
    for (const item of cart) {
      const newStock = Math.max(0, item.product.stock - item.quantity);
      await dataService.updateMarketProduct({ ...item.product, stock: newStock });
    }

    // 2. Format details and create Financial Entry in Firestore
    const itemsDescription = cart.map(c => {
      const itemPrice = getSellingPrice(c.product);
      const isPromo = c.product.promoPrice !== undefined && c.product.promoPrice < c.product.price;
      return `${c.quantity}x ${c.product.name.split(':')[0]} (${isPromo ? 'PROMO ' : ''}R$ ${itemPrice.toFixed(2)})`;
    }).join(', ');

    const discountDetail = discountAmount > 0 
      ? ` [Desc: R$ ${discountAmount.toFixed(2)}]`
      : '';

    const workerDetail = selectedWorker ? ` [Voluntário: ${selectedWorker.name}]` : '';

    const txCategory = selectedCategory === 'CANTINA' ? 'LIVRARIA_BAZAR' : 'LIVRARIA_BAZAR';
    const entryPaymentMethod = paymentMethod === 'CONTA_TRABALHADOR' ? 'DINHEIRO' : (paymentMethod as any);

    const txId = `TX:${Date.now()}`;
    await dataService.addFinancialEntry({
      description: `[PDV - ${paymentMethod === 'CONTA_TRABALHADOR' ? 'Conta Trabalhador' : paymentMethod}] ${itemsDescription}${discountDetail}${workerDetail}`,
      amount: finalTotal,
      type: 'RECEITA',
      category: txCategory,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: entryPaymentMethod,
      createdBy: cashSession?.openedBy || currentUser?.name || 'Operador PDV'
    });

    // 3. Update active cash session in Firestore
    if (cashSession && cashSession.isOpen) {
      const activeSession: CashSession = { ...cashSession };
      activeSession.transactionsCount += 1;
      if (paymentMethod === 'DINHEIRO' || paymentMethod === 'CONTA_TRABALHADOR') {
        activeSession.cashTotal += finalTotal;
      } else if (paymentMethod === 'PIX') {
        activeSession.pixTotal += finalTotal;
      } else if (paymentMethod === 'CARTÃO') {
        activeSession.cardTotal += finalTotal;
      }
      await dataService.saveActiveCashSession(activeSession);
    }

    // Audit Log in Firestore
    dataService.createLog(
      'Venda Realizada', 
      `Nova venda finalizada via PDV [Líquido: R$ ${finalTotal.toFixed(2)} - ${paymentMethod}]${workerDetail}${discountDetail}: ${itemsDescription}`
    );

    // Capture snapshot for receipt print
    const itemsSnapshot = cart.map(c => ({
      name: c.product.name.split(':')[0],
      qty: c.quantity,
      price: getSellingPrice(c.product)
    }));

    setCheckoutCart(itemsSnapshot);
    setCheckoutSubtotal(cartSubtotal);
    setCheckoutDiscount(discountAmount);
    setCheckoutTxId(txId);
    setCheckoutPaymentMethod(paymentMethod === 'CONTA_TRABALHADOR' ? `Conta Voluntário (${selectedWorker?.name})` : paymentMethod);
    setCheckoutWorkerName(selectedWorker?.name);
    setCheckoutReceivedCash(paymentMethod === 'DINHEIRO' ? parsedReceivedCash : finalTotal);
    setCheckoutChangeGiven(changeAmount);

    // Reset UI state
    setSoldAmount(finalTotal);
    setCart([]);
    setDiscountValueInput('0');
    setReceivedCash('');
    setSelectedWorkerId('');
    setCheckoutSuccess(true);
  };

  // Open Cashier Session in Firestore
  const handleOpenCashSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const op = openOperator || currentUser?.name || 'Operador de Vendas';
    const initCash = parseFloat(openInitialCash) || 0;
    
    const newSession: CashSession = {
      id: 'current_session',
      isOpen: true,
      openedAt: new Date().toISOString(),
      openedBy: op,
      initialCash: initCash,
      transactionsCount: 0,
      pixTotal: 0,
      cashTotal: 0,
      cardTotal: 0
    };
    
    await dataService.saveActiveCashSession(newSession);
    dataService.createLog(
      'Caixa Aberto', 
      `Nova sessão de caixa aberta pelo operador ${op} com troco inicial de R$ ${initCash.toFixed(2)}`
    );
  };

  // Close Cashier Session in Firestore
  const handleCloseCashSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashSession) return;
    
    const actualCashCollected = parseFloat(closeActualCash) || 0;
    const expectedCashValue = cashSession.initialCash + cashSession.cashTotal;
    const difference = actualCashCollected - expectedCashValue;
    
    const finalSession: CashSession = {
      ...cashSession,
      closedAt: new Date().toISOString(),
      finalCashExpected: expectedCashValue,
      finalCashRecorded: actualCashCollected,
      difference: difference
    };

    await dataService.closeActiveCashSession(finalSession);
    setCloseCashModal(false);
    alert(`Caixa fechado com sucesso! Balanço final registrado de R$ ${actualCashCollected.toFixed(2)}.`);
  };

  // Native Print Receipt (Zero Pop-Up Blocker Risk)
  const handlePrintReceipt = () => {
    window.print();
  };

  // Add new product to Firestore
  const handleCreateProduct = async (e: React.FormEvent) => {
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

    await dataService.addMarketProduct({
      name: newProdName,
      category: newProdCategory,
      price: price,
      promoPrice: promo,
      stock: stock,
      minLimit: min || 5,
      expirationDate: newProdExp ? newProdExp : undefined,
      barcode: newProdBarcode ? newProdBarcode.trim() : undefined
    });

    // Reset forms
    setNewProdName('');
    setNewProdPrice('');
    setNewProdPromoPrice('');
    setNewProdStock('');
    setNewProdExp('');
    setNewProdBarcode('');
    setShowAddProductModal(false);
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
    setEditProdBarcode(p.barcode || '');
    setShowEditProductModal(true);
  };

  // Update Product in Firestore
  const handleUpdateProduct = async (e: React.FormEvent) => {
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

    const updatedItem: MarketProduct = {
      ...editingProduct,
      name: editProdName,
      category: editProdCategory,
      price: price,
      promoPrice: promo && promo > 0 ? promo : undefined,
      stock: stock,
      minLimit: min,
      expirationDate: editProdExp ? editProdExp : undefined,
      barcode: editProdBarcode ? editProdBarcode.trim() : undefined
    };

    await dataService.updateMarketProduct(updatedItem);
    setShowEditProductModal(false);
    setEditingProduct(null);
  };

  // Delete product in Firestore
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja DELETAR o produto "${name}" permanentemente do estoque?`)) {
      await dataService.deleteMarketProduct(id);
      setCart(cart.filter(item => item.product.id !== id));
      setShowEditProductModal(false);
      setEditingProduct(null);
    }
  };

  // Filter products by search (Name or Barcode)
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!cashSession || !cashSession.isOpen) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-amber-50 text-amber-500 rounded-full w-fit mx-auto">
            <Lock size={44} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-901 uppercase tracking-tight">Caixa Diário Fechado</h2>
            <p className="text-xs text-indigo-600 font-black uppercase tracking-widest">Sincronização em Tempo Real (Firestore)</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Para realizar vendas na Livraria, Cantina ou Bazar com auditoria e sincronização direta na Tesouraria Geral do CEMIL, abra a sessão informando seu nome e o troco inicial.
            </p>
          </div>
          
          <form onSubmit={handleOpenCashSession} className="space-y-4 pt-4 border-t border-gray-100 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Operador do Balcão</label>
              <input
                type="text"
                required
                placeholder="Ex: Pedro Rezende"
                value={openOperator || currentUser?.name || 'Operador de Vendas'}
                onChange={e => setOpenOperator(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Troco de Abertura (R$)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-xs text-gray-450 font-black">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={openInitialCash}
                  onChange={e => setOpenInitialCash(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-black focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-750 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer mt-2"
            >
              Abrir Caixa no Banco de Dados
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Painel Geral</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Active Cash Session Indicator */}
          {cashSession && cashSession.isOpen && (
            <div className="flex items-center gap-3 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100/50 rounded-2xl px-4 py-2 text-left shadow-sm">
              <div className="text-left py-0.5">
                <p className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">Caixa Diário (Nuvem)</p>
                <p className="text-[11px] font-extrabold text-gray-700 leading-none mt-0.5">Op: {cashSession.openedBy}</p>
              </div>
              <div className="h-6 w-px bg-indigo-100" />
              <div className="text-left font-mono py-0.5">
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Fundo de Troco</p>
                <p className="text-[11px] font-black text-emerald-600 leading-none mt-0.5">R$ {cashSession.initialCash.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCloseActualCash((cashSession.initialCash + cashSession.cashTotal).toFixed(2));
                  setCloseCashModal(true);
                }}
                className="ml-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-rose-100 active:scale-95"
              >
                Fechar Caixa
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95 cursor-pointer"
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

              {/* Search input with Barcode Scanner hint */}
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-350" title="Suporta Leitor de Código de Barras USB">
                  <Barcode size={18} />
                </span>
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
                  <p className="text-sm text-gray-500 max-w-sm mt-1">Nenhum produto encontrado na categoria selecionada ou com este código de busca.</p>
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
                  const discountPercent = hasPromo ? Math.round(((p.price - p.promoPrice!) / p.price) * 100) : 0;
                  const expInfo = getExpirationBadge(p.expirationDate);
                  
                  return (
                    <div 
                      key={p.id}
                      className={cn(
                        "bg-white rounded-2xl p-4.5 border transition-all flex flex-col justify-between group min-h-[190px] relative overflow-hidden",
                        isOut 
                          ? "opacity-60 border-gray-100 bg-gray-50/50" 
                          : "border-gray-100 hover:border-indigo-150 hover:shadow-lg hover:shadow-indigo-50/20"
                      )}
                    >
                      {/* Promo Tag overlay */}
                      {hasPromo && !isOut && (
                        <div className="absolute top-0 right-0 bg-rose-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 animate-pulse">
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

                        {/* Expiration date or Barcode badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {expInfo && (
                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                              expInfo.isExpired ? "bg-rose-100 text-rose-700 animate-bounce" : "bg-amber-100 text-amber-800"
                            )}>
                              {expInfo.text}
                            </span>
                          )}
                          {p.barcode && (
                            <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 flex items-center gap-1">
                              <Barcode size={10} /> {p.barcode}
                            </span>
                          )}
                        </div>
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
            <div className="p-5 flex-1 max-h-[220px] overflow-y-auto no-scrollbar border-b border-gray-50 min-h-[150px]">
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

            {/* Discount management section */}
            <div className="p-4 border-b border-gray-100 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-405 font-black uppercase tracking-wider flex items-center gap-1">
                  <Percent size={13} className="text-rose-600" />
                  Desconto no Carrinho
                </span>
                <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded-full">
                  {discountAmount > 0 ? `- R$ ${discountAmount.toFixed(2)}` : 'Nenhum'}
                </span>
              </div>

              {/* Presets discount buttons row */}
              <div className="grid grid-cols-5 gap-1 shadow-sm rounded-lg overflow-hidden border border-gray-100 bg-white">
                {[0, 5, 10, 15, 20].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => applyPresetDiscount(v)}
                    className={cn(
                      "py-1 text-[10px] font-black transition-all cursor-pointer border-r border-gray-100 last:border-0",
                      numDiscountValue === v && discountType === 'PERCENT' ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {v === 0 ? 'Sem desc.' : `${v}%`}
                  </button>
                ))}
              </div>

              {/* Custom discount picker */}
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-gray-100">
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value as 'PERCENT' | 'VALUE');
                    setDiscountValueInput('0');
                  }}
                  className="bg-transparent text-[10px] font-black text-gray-700 uppercase pr-1 focus:outline-none cursor-pointer"
                >
                  <option value="PERCENT">% Porcentagem</option>
                  <option value="VALUE">R$ Valor Fixo</option>
                </select>

                <div className="flex-1 flex items-center justify-end font-mono">
                  <span className="text-[10px] font-bold text-gray-400 mr-1">
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
                  <div className="flex justify-between items-center text-xs text-rose-600 font-extrabold leading-none">
                    <span className="flex items-center gap-1">🏷️ Desconto Total</span>
                    <span className="font-mono font-black">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-end justify-between border-t border-gray-100 pt-2.5 mt-1 pb-1">
                  <span className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-none">Total Líquido</span>
                  <span className="font-black text-xl text-indigo-950 font-mono leading-none">
                    R$ {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment methods choosing */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Método de Recebimento</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      paymentMethod === 'PIX'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <QrCode size={15} />
                    <span className="text-[10px] font-black uppercase">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      paymentMethod === 'DINHEIRO'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <Coins size={15} />
                    <span className="text-[10px] font-black uppercase">Dinheiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTÃO')}
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      paymentMethod === 'CARTÃO'
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <CreditCard size={15} />
                    <span className="text-[10px] font-black uppercase">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CONTA_TRABALHADOR')}
                    className={cn(
                      "p-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all cursor-pointer",
                      paymentMethod === 'CONTA_TRABALHADOR'
                        ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm font-bold"
                        : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <UserCheck size={15} />
                    <span className="text-[10px] font-black uppercase">Voluntário</span>
                  </button>
                </div>
              </div>

              {/* Conditional Change Calculator for Cash */}
              {paymentMethod === 'DINHEIRO' && (
                <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <Calculator size={13} /> Calculadora de Troco
                    </span>
                    {changeAmount > 0 && (
                      <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Troco: R$ {changeAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Valor Entregue pelo Comprador (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Ex: ${(Math.ceil(finalTotal / 10) * 10).toFixed(2)}`}
                      value={receivedCash}
                      onChange={e => setReceivedCash(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 font-mono text-xs font-black focus:outline-none text-emerald-950"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Worker Selector for Worker Account */}
              {paymentMethod === 'CONTA_TRABALHADOR' && (
                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100 space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase text-amber-800 block flex items-center gap-1">
                    <UserCheck size={13} /> Selecionar Voluntário/Trabalhador
                  </label>
                  <select
                    value={selectedWorkerId}
                    onChange={e => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                  >
                    <option value="">-- Selecionar Trabalhador --</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.position ? `(${w.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                <p className="text-xs text-gray-400 font-medium">Cadastre obras, materiais, lanches ou itens do bazar com código de barras.</p>
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Preço de Venda (R$)</label>
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

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <Barcode size={13} /> Código de Barras (EAN / SKU)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 78910001 (Opcional - Leitor USB)"
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="bg-rose-50/50 rounded-2xl p-3 border border-rose-100/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <Tag size={12} />
                    <span>Promoção Ativa? (Opcional)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 inset-y-0 text-rose-500 text-xs font-black font-mono flex items-center pointer-events-none">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 35.00 (Opcional)"
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
                  Editar Item & Promoção
                </h2>
                <p className="text-xs text-gray-400 font-medium">Modifique preços, estoque, código de barras e validade.</p>
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
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Preço Regular (R$)</label>
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

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <Barcode size={13} /> Código de Barras (EAN / SKU)
                  </label>
                  <input
                    type="text"
                    value={editProdBarcode}
                    onChange={e => setEditProdBarcode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* PROMO BOX */}
                <div className="bg-rose-50/75 rounded-2xl p-4 border border-rose-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                    <Sparkles size={13} className="animate-bounce" />
                    <span>PROMOÇÃO ATIVA / LIQUIDAÇÃO?</span>
                  </div>
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

      {/* Checkout Success & Thermal Receipt Modal */}
      <AnimatePresence>
        {checkoutSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative border border-gray-100"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto">
                <Check size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-emerald-600">Venda Registrada na Nuvem!</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Entrada financeira e abatimento de estoque gravados no Firestore</p>
              </div>

              {/* Printable 80mm Thermal Receipt */}
              <div id="printable-receipt" className="bg-white border border-gray-200 rounded-2xl p-4 text-left font-mono text-[11px] text-gray-800 space-y-3 relative overflow-hidden shadow-sm max-h-[320px] overflow-y-auto">
                
                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-300">
                  <p className="text-xs font-black uppercase text-gray-900">ASSOC. ESPÍRITA MIRANTE DE LUZ</p>
                  <p className="text-[9px] text-gray-500">Montes Claros - MG • CNPJ 12.345.678/0001-90</p>
                  <p className="text-[9px] font-black uppercase text-indigo-700">Comprovante Não-Fiscal de Venda</p>
                </div>

                <div className="space-y-0.5 text-[10px]">
                  <p><strong>Cód:</strong> {checkoutTxId}</p>
                  <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
                  <p><strong>Operador:</strong> {cashSession?.openedBy || currentUser?.name || 'Balcão'}</p>
                  {checkoutWorkerName && (
                    <p className="text-amber-800 font-bold"><strong>Voluntário:</strong> {checkoutWorkerName}</p>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-300 pt-2">
                  <table className="w-full text-[10.5px]">
                    <thead>
                      <tr className="border-b border-dashed border-gray-200 text-gray-400">
                        <th className="text-left font-normal pb-1">QTD x Item</th>
                        <th className="text-right font-normal pb-1">Total (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-gray-100">
                      {checkoutCart.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{item.qty}x {item.name}</td>
                          <td className="text-right py-1">R$ {(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-dashed border-gray-350 pt-2 font-black text-xs space-y-1">
                  <div className="flex justify-between font-normal text-[10.5px]">
                    <span>Subtotal:</span>
                    <span>R$ {checkoutSubtotal.toFixed(2)}</span>
                  </div>
                  {checkoutDiscount > 0 && (
                    <div className="flex justify-between font-medium text-rose-600 text-[10.5px]">
                      <span>Desconto Aplicado:</span>
                      <span>- R$ {checkoutDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-indigo-700 pt-1 border-t border-dashed border-gray-250">
                    <span>TOTAL LÍQUIDO PAGO:</span>
                    <span>R$ {soldAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 pt-2 space-y-0.5 text-[10px]">
                  <p><strong>Recebimento:</strong> {checkoutPaymentMethod}</p>
                  {checkoutReceivedCash > soldAmount && (
                    <>
                      <p><strong>Valor Entregue:</strong> R$ {checkoutReceivedCash.toFixed(2)}</p>
                      <p className="text-emerald-700 font-extrabold"><strong>Troco Devolvido:</strong> R$ {checkoutChangeGiven.toFixed(2)}</p>
                    </>
                  )}
                </div>

                <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500 leading-snug">
                  "A caridade de cada tostão constrói<br />pontos de socorro. Deus lhe pague!"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="py-3 px-4 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  Imprimir Recibo
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutSuccess(false)}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  Confirmar & Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FECHAR CAIXA DIÁRIO MODAL */}
      <AnimatePresence>
        {closeCashModal && cashSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-5 text-left relative border border-gray-100"
            >
              <button
                type="button"
                onClick={() => setCloseCashModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1 border-b border-gray-50 pb-4">
                <h2 className="text-lg font-black text-gray-901 uppercase tracking-tight flex items-center gap-2">
                  <Lock className="text-rose-500" size={20} />
                  Fechar Caixa do Turno
                </h2>
                <p className="text-xs text-gray-400 font-medium">Preste contas e feche a sessão oficial no banco de dados.</p>
              </div>

              <div className="space-y-4 text-xs font-medium text-gray-600">
                <div className="grid grid-cols-2 gap-3 py-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-sans">
                  <div>
                    <span className="text-[9px] text-gray-400 font-black uppercase">Operador:</span>
                    <p className="font-extrabold text-gray-800">{cashSession.openedBy}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 font-black uppercase">Hora de Abertura:</span>
                    <p className="font-bold text-gray-800">{new Date(cashSession.openedAt).toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-50 pt-2">
                  <h4 className="font-black text-[10px] text-indigo-600 uppercase tracking-widest italic">Resumo de Movimentações</h4>
                  <div className="space-y-1 pt-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>(+) Fundo de Troco Inicial:</span>
                      <span className="font-mono font-bold">R$ {cashSession.initialCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Entradas em Dinheiro:</span>
                      <span className="font-mono font-bold text-emerald-600">R$ {cashSession.cashTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Recebido por PIX:</span>
                      <span className="font-mono font-bold">R$ {cashSession.pixTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Recebido por CARTÃO:</span>
                      <span className="font-mono font-bold">R$ {cashSession.cardTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-50 pt-2 text-indigo-750 font-extrabold text-[12px]">
                      <span>(=) Dinheiro Esperado em Caixa:</span>
                      <span className="font-mono">R$ {(cashSession.initialCash + cashSession.cashTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCloseCashSession} className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Dinheiro Físico Contado (R$)</label>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-snug">Conte o dinheiro físico no gaveteiro e informe o total real encontrado (excluindo PIX/Cartão).</p>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-450 font-black">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={closeActualCash}
                        onChange={e => setCloseActualCash(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-black focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Profit or loss indicator */}
                  {closeActualCash && (
                    (() => {
                      const actual = parseFloat(closeActualCash) || 0;
                      const expected = cashSession.initialCash + cashSession.cashTotal;
                      const diff = actual - expected;
                      if (Math.abs(diff) < 0.01) {
                        return (
                          <div className="p-3 bg-emerald-50 text-emerald-800 text-[10.5px] rounded-xl font-bold flex items-center gap-1.5 border border-emerald-100 animate-in zoom-in-95 leading-relaxed">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Fechamento Perfeito! Nenhuma divergência física encontrada.
                          </div>
                        );
                      } else if (diff < 0) {
                        return (
                          <div className="p-3 bg-rose-50 text-rose-800 text-[10.5px] rounded-xl font-bold flex flex-col gap-0.5 border border-rose-100 animate-in zoom-in-95 leading-normal">
                            <div className="flex items-center gap-1.5 font-black text-rose-900 uppercase text-[9px] tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              Divergência: Diferença de Caixa (Quebra)
                            </div>
                            <span>Faltando <strong>R$ {Math.abs(diff).toFixed(2)}</strong> em relação ao esperado. Verifique possíveis erros de troco ou pagamentos esquecidos.</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-3 bg-amber-50 text-amber-800 text-[10.5px] rounded-xl font-bold flex flex-col gap-0.5 border border-amber-100 animate-in zoom-in-95 leading-normal">
                            <div className="flex items-center gap-1.5 font-black text-amber-900 uppercase text-[9px] tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Divergência: Sobra de Caixa
                            </div>
                            <span>Excesso de <strong>R$ {diff.toFixed(2)}</strong> em relação ao esperado. Pode ser troco não entregue ou doações extras recebidas no balcão.</span>
                          </div>
                        );
                      }
                    })()
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Confirmar & Fechar Caixa Turno
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
