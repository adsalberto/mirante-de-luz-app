import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  AlertTriangle, 
  Printer, 
  PlusCircle, 
  MinusCircle, 
  MapPin, 
  Sparkles, 
  Coffee, 
  BookOpen, 
  Wrench, 
  FileText, 
  Layers, 
  Tv, 
  HelpCircle,
  RefreshCw,
  Heart,
  Users,
  Mic2,
  Building2,
  CalendarCheck,
  Flame,
  Layout,
  Tag
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { 
  InventoryItem, 
  InventoryCategory, 
  InventoryItemStatus, 
  INVENTORY_CATEGORY_LABELS, 
  INVENTORY_STATUS_LABELS,
  Sector
} from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const InventoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM' || currentUser?.role === 'SECRETARIO' || currentUser?.role === 'COORDENADOR';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string>('ALL'); // 'ALL' or 'NONE' or sector.id

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'MOBILIARIO' as InventoryCategory,
    quantity: 0,
    minQuantity: 0,
    unit: 'unidades',
    location: '',
    sectorId: '', // Selected sector ID (empty string for general / no sector)
    status: 'BOM' as InventoryItemStatus,
    observation: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // First, fetch the sectors
      const fetchedSectors = await dataService.getSectors();
      const sectorsList = fetchedSectors || [];
      setSectors(sectorsList);

      // Next, load the inventory
      let data = await dataService.getInventoryItems();
      
      // Bootstrap with classic CEMIL inventory items matched with actual Sector IDs if empty
      if (!data || data.length === 0) {
        console.log("Bootstrap empty inventory database with standard CEMIL items mapped to sectors...");
        
        // Helper to find a sector ID by name keyword
        const getSectorIdByName = (keyword: string): string => {
          const found = sectorsList.find(s => s.name.toLowerCase().includes(keyword.toLowerCase()));
          return found ? found.id : '';
        };

        const adminId = getSectorIdByName('Administrativo');
        const estudoId = getSectorIdByName('Estudos');
        const passeId = getSectorIdByName('Passe');
        const doutrinariaId = getSectorIdByName('Doutrinária');
        const socialId = getSectorIdByName('Ação Social');
        const livrariaId = getSectorIdByName('Comunicação') || getSectorIdByName('Administrativo');

        const bootstrapItems: Omit<InventoryItem, 'id'>[] = [
          {
            name: "Cadeiras de Plástico Brancas",
            category: "MOBILIARIO",
            quantity: 120,
            minQuantity: 40,
            unit: "unidades",
            location: "Salão Principal",
            sectorId: adminId || '',
            status: "BOM",
            observation: "Limpeza regular mensal necessária",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "O Livro dos Espíritos (Allan Kardec)",
            category: "LIVRARIA",
            quantity: 25,
            minQuantity: 5,
            unit: "livros",
            location: "Livraria / Recepção",
            sectorId: livrariaId || '',
            status: "BOM",
            observation: "Consignados da distribuidora FEB",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "O Evangelho Segundo o Espiritismo (Allan Kardec)",
            category: "LIVRARIA",
            quantity: 30,
            minQuantity: 5,
            unit: "livros",
            location: "Livraria / Recepção",
            sectorId: livrariaId || '',
            status: "BOM",
            observation: "Essencial para venda e brinde a recém-chegados",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Copos d'água mineral descartáveis 200ml",
            category: "COZINHA",
            quantity: 350,
            minQuantity: 200,
            unit: "copos",
            location: "Cozinha d'água fluida",
            sectorId: passeId || '',
            status: "BOM",
            observation: "Consumo alto nos passes. Manter estoque seguro.",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Detergente Líquido de Louças",
            category: "LIMPEZA",
            quantity: 4,
            minQuantity: 8,
            unit: "frascos",
            location: "Cozinha principal",
            sectorId: adminId || '',
            status: "REGULAR",
            observation: "Estoque atual insuficiente para a festa de final do mês",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Papel Sulfite A4 Branco",
            category: "SUPRIMENTOS",
            quantity: 3,
            minQuantity: 5,
            unit: "resmas",
            location: "Recepção / Secretaria",
            sectorId: adminId || '',
            status: "BOM",
            observation: "Impressão da ficha cadastral de atendimentos e avisos",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Projetor Digital Multimídia",
            category: "ELETRONICOS",
            quantity: 1,
            minQuantity: 1,
            unit: "aparelho",
            location: "Sala de Estudos",
            sectorId: estudoId || '',
            status: "BOM",
            observation: "Utilizado nas quartas e sábados",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Microfone Sem Fio Shure",
            category: "ELETRONICOS",
            quantity: 2,
            minQuantity: 1,
            unit: "unidades",
            location: "Palco / Doutrinárias",
            sectorId: doutrinariaId || '',
            status: "BOM",
            observation: "Testar pilhas antes de cada reunião",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Desinfetante Sanitário Florestal",
            category: "LIMPEZA",
            quantity: 10,
            minQuantity: 5,
            unit: "galões",
            location: "Depósito de Limpeza",
            sectorId: adminId || '',
            status: "BOM",
            observation: "Forte odor, diluir conforme instruções",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Cesta Básica Social Regular",
            category: "COZINHA",
            quantity: 14,
            minQuantity: 15,
            unit: "cestas",
            location: "Depósito de Doações",
            sectorId: socialId || '',
            status: "BOM",
            observation: "Distribuído mensalmente para famílias assistidas",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          },
          {
            name: "Lâmpadas Led Claras 12W",
            category: "MANUTENCAO",
            quantity: 15,
            minQuantity: 4,
            unit: "unidades",
            location: "Armário de ferramentas",
            sectorId: adminId || '',
            status: "BOM",
            observation: "Lâmpadas reservas de emergência",
            lastUpdated: Date.now(),
            updatedBy: currentUser?.name || "Sistema"
          }
        ];

        for (const item of bootstrapItems) {
          await dataService.addInventoryItem(item);
        }
        data = await dataService.getInventoryItems();
      }

      setItems(data || []);
    } catch (err) {
      console.error("Erro ao carregar dados do inventário e setores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      location: item.location || '',
      sectorId: item.sectorId || '',
      status: item.status,
      observation: item.observation || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await dataService.deleteInventoryItem(itemToDelete.id);
      setIsDeletingConfirmOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir item do inventário:', err);
      alert('Erro ao excluir item.');
    }
  };

  const handleOpenDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeletingConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        quantity: Number(formData.quantity),
        minQuantity: Number(formData.minQuantity),
        unit: formData.unit,
        location: formData.location,
        sectorId: formData.sectorId || '',
        status: formData.status,
        observation: formData.observation,
        lastUpdated: Date.now(),
        updatedBy: currentUser?.name || 'Sistema'
      };

      if (editingItem) {
        await dataService.updateInventoryItem({ id: editingItem.id, ...payload });
      } else {
        await dataService.addInventoryItem(payload);
      }

      setFormData({
        name: '',
        category: 'MOBILIARIO',
        quantity: 0,
        minQuantity: 0,
        unit: 'unidades',
        location: '',
        sectorId: '',
        status: 'BOM',
        observation: ''
      });
      setEditingItem(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar item do inventário:', err);
      alert('Ocorreu um erro ao salvar o item.');
    }
  };

  // Quick Quantity Update (+ and - clicking)
  const handleQuickQuantityUpdate = async (item: InventoryItem, delta: number) => {
    if (!canEdit) return;
    const newQty = Math.max(0, item.quantity + delta);
    
    // Optimistic UI state update
    setItems(items.map(it => it.id === item.id ? { ...it, quantity: newQty, lastUpdated: Date.now(), updatedBy: currentUser?.name || 'Sistema' } : it));

    try {
      const updatedItem: InventoryItem = {
        ...item,
        quantity: newQty,
        lastUpdated: Date.now(),
        updatedBy: currentUser?.name || 'Sistema'
      };
      await dataService.updateInventoryItem(updatedItem);
    } catch (err) {
      console.error('Erro ao atualizar quantidade rápida:', err);
      // rollback
      loadData();
    }
  };

  // Visual Category Helper Mapping
  const getCategoryIcon = (category: InventoryCategory) => {
    switch (category) {
      case 'MOBILIARIO': return <Layers className="text-amber-500" size={18} />;
      case 'ELETRONICOS': return <Tv className="text-blue-500" size={18} />;
      case 'LIVRARIA': return <BookOpen className="text-teal-500" size={18} />;
      case 'COZINHA': return <Coffee className="text-emerald-500" size={18} />;
      case 'LIMPEZA': return <Sparkles className="text-purple-500" size={18} />;
      case 'SUPRIMENTOS': return <FileText className="text-indigo-500" size={18} />;
      case 'MANUTENCAO': return <Wrench className="text-rose-500" size={18} />;
      default: return <HelpCircle className="text-gray-500" size={18} />;
    }
  };

  const getCategoryColorTextAndBg = (category: InventoryCategory) => {
    switch (category) {
      case 'MOBILIARIO': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'ELETRONICOS': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'LIVRARIA': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'COZINHA': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'LIMPEZA': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'SUPRIMENTOS': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'MANUTENCAO': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusBadge = (status: InventoryItemStatus) => {
    switch (status) {
      case 'BOM':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">✔ Ótimo / Bom</span>;
      case 'REGULAR':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">⚖ Regular</span>;
      case 'RUIM':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">⚡ Ruim</span>;
      case 'EM_MANUTENCAO':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-105 animate-pulse">🛠 Manutenção</span>;
      case 'EM_FALTA':
        return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-150 text-gray-650 border border-gray-250 line-through">🛑 Acabou</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gray-50 text-gray-700 border border-gray-100">Outro</span>;
    }
  };

  // Maps Sector Type/Name to clean visual icons
  const getSectorIcon = (sectorName: string) => {
    const s = sectorName.toLowerCase();
    if (s.includes('fraterno')) return <Users className="shrink-0" size={16} />;
    if (s.includes('passe') || s.includes('fluido')) return <Sparkles className="shrink-0" size={16} />;
    if (s.includes('estudo') || s.includes('doutrin')) return <BookOpen className="shrink-0" size={16} />;
    if (s.includes('infan') || s.includes('joven') || s.includes('juventude')) return <Coffee className="shrink-0" size={16} />;
    if (s.includes('social')) return <Heart className="shrink-0" size={16} />;
    if (s.includes('admin')) return <Building2 className="shrink-0" size={16} />;
    if (s.includes('comun')) return <Tv className="shrink-0" size={16} />;
    return <Package className="shrink-0" size={16} />;
  };

  // Filter items in memory based on ALL filters including the Sector Selector!
  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const isLowStock = item.quantity <= item.minQuantity;
    const matchesLowStock = !lowStockOnly || isLowStock;

    // Sector filtering logic
    let matchesSector = true;
    if (selectedSectorId === 'NONE') {
      matchesSector = !item.sectorId || item.sectorId === '';
    } else if (selectedSectorId !== 'ALL') {
      matchesSector = item.sectorId === selectedSectorId;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesLowStock && matchesSector;
  });

  // Print Inventory Handler
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Resolve sector names
    const getSectorName = (id?: string) => {
      if (!id) return 'Geral / Sem Setor';
      const sec = sectors.find(s => s.id === id);
      return sec ? sec.name : 'Geral / Sem Setor';
    };

    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Inventário Geral - CEMIL</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            h1 { text-align: center; color: #063994; margin-bottom: 5px; }
            h3 { text-align: center; color: #666; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 15px; text-align: left; }
            th { background-color: #f4f6fa; color: #063994; font-weight: bold; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .warning { color: red; font-weight: bold; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .meta { text-align: right; font-size: 11px; color: #888; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>MIRANTE DE LUZ - CEMIL</h1>
          <h3>Inventário Físico por Setores do Centro - Emitido em ${new Date().toLocaleDateString('pt-BR')}</h3>
          
          <table>
            <thead>
              <tr>
                <th>Setor do Centro</th>
                <th>Item / Descrição</th>
                <th>Categoria</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Estado Geral</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(item => `
                <tr>
                  <td><strong>${getSectorName(item.sectorId)}</strong></td>
                  <td>
                    <strong>${item.name}</strong><br/>
                    <small style="color: #666">${item.location ? 'Local: ' + item.location + ' | ' : ''} ${item.observation || ''}</small>
                  </td>
                  <td>${INVENTORY_CATEGORY_LABELS[item.category] || item.category}</td>
                  <td class="${item.quantity <= item.minQuantity ? 'warning' : ''}">
                    ${item.quantity} ${item.unit} ${item.quantity <= item.minQuantity ? ' (Estoque Baixo!)' : ''}
                  </td>
                  <td>${item.minQuantity} ${item.unit}</td>
                  <td>${INVENTORY_STATUS_LABELS[item.status] || item.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="meta">Mirante de Luz (Cemil) - Sistema de Gestão Interna. Operador: ${currentUser?.name || "Funcionário"}</p>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Stats Counters (Filtered by the sector choice if not 'ALL')
  const countItemsInSector = (secId: string) => {
    if (secId === 'ALL') return items.length;
    if (secId === 'NONE') return items.filter(i => !i.sectorId).length;
    return items.filter(i => i.sectorId === secId).length;
  };

  const countLowStockInSector = (secId: string) => {
    const list = secId === 'ALL' ? items : secId === 'NONE' ? items.filter(i => !i.sectorId) : items.filter(i => i.sectorId === secId);
    return list.filter(i => i.quantity <= i.minQuantity).length;
  };

  const countMaintenanceInSector = (secId: string) => {
    const list = secId === 'ALL' ? items : secId === 'NONE' ? items.filter(i => !i.sectorId) : items.filter(i => i.sectorId === secId);
    return list.filter(i => i.status === 'EM_MANUTENCAO').length;
  };

  const getSectorsStatsCount = () => {
    return Array.from(new Set(items.map(i => i.sectorId).filter(Boolean))).length;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Header block with description and title */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter italic flex items-center gap-2">
            <Package className="text-indigo-600 shrink-0" size={32} />
            Inventário do Centro
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Controle integrado de materiais patrimoniais, utensílios e insumos divididos pelos setores do Mirante de Luz (CEMIL)
          </p>
        </div>
        
        {/* Actions header buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-white border border-gray-100 hover:border-gray-200 text-gray-700 px-5 py-3.5 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
            title="Imprimir Relatório de Inventário"
          >
            <Printer size={18} className="text-gray-400" />
            <span>Imprimir</span>
          </button>

          {canEdit && (
            <button 
              id="open-inventory-modal"
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  category: 'MOBILIARIO',
                  quantity: 0,
                  minQuantity: 0,
                  unit: 'unidades',
                  location: '',
                  sectorId: selectedSectorId !== 'ALL' && selectedSectorId !== 'NONE' ? selectedSectorId : '',
                  status: 'BOM',
                  observation: ''
                });
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0 animate-pulse-slow"
            >
              <Plus size={20} />
              <span>Novo Registro</span>
            </button>
          )}
        </div>
      </header>

      {/* NEW SECTION: SECTOR-BASED WORKSPACE SEGMENTATION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
            <Layout size={14} className="text-indigo-600" />
            Setores do Centro Administrativo & Espiritual
          </h2>
          <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border px-2 py-0.5 rounded">
            Dividido em {sectors.length} setores ativos
          </span>
        </div>

        {/* Dynamic Sector selection tabs */}
        <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          
          {/* General Tab */}
          <button
            onClick={() => setSelectedSectorId('ALL')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0",
              selectedSectorId === 'ALL'
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
            )}
          >
            <Package size={16} />
            <span>Todos os Setores</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full",
              selectedSectorId === 'ALL' ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
            )}>
              {items.length}
            </span>
          </button>

          {/* Group of Real Firebase Sectors */}
          {sectors.map((sec) => {
            const isActive = selectedSectorId === sec.id;
            const itemsCount = countItemsInSector(sec.id);
            const lowStockCountSec = countLowStockInSector(sec.id);

            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectorId(sec.id)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0 relative",
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
                )}
              >
                {getSectorIcon(sec.name)}
                <span className="truncate max-w-[130px]">{sec.name}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  isActive ? "bg-indigo-500 text-white" : "bg-gray-50 text-gray-500"
                )}>
                  {itemsCount}
                </span>

                {/* Micro low stock warning dot indicator */}
                {lowStockCountSec > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full animate-ping" />
                )}
              </button>
            );
          })}

          {/* Uncategorized stock drawer */}
          <button
            onClick={() => setSelectedSectorId('NONE')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0",
              selectedSectorId === 'NONE'
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
            )}
          >
            <HelpCircle size={16} />
            <span>Geral / Sem Setor</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full",
              selectedSectorId === 'NONE' ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
            )}>
              {countItemsInSector('NONE')}
            </span>
          </button>

        </div>
      </section>

      {/* Metrics Summary Panels linked to the chosen Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Total items registered in sector */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Package size={22} />
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            {selectedSectorId === 'ALL' ? 'Inventário Geral' : 'Neste Setor'}
          </span>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {countItemsInSector(selectedSectorId)}
          </p>
          <div className="mt-2 text-xs font-semibold text-gray-500">Produtos sob gestão</div>
        </div>

        {/* Low Stock count alert */}
        <div className={cn(
          "p-6 rounded-[32px] border transition-all relative overflow-hidden",
          countLowStockInSector(selectedSectorId) > 0 
            ? "bg-rose-50/50 border-rose-100 shadow-sm" 
            : "bg-white border-gray-100 shadow-sm"
        )}>
          <div className={cn(
            "absolute right-4 top-4 w-12 h-12 rounded-2xl flex items-center justify-center",
            countLowStockInSector(selectedSectorId) > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-400"
          )}>
            <AlertTriangle size={22} className={cn(countLowStockInSector(selectedSectorId) > 0 && "animate-bounce")} />
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estoque Crítico</span>
          <p className={cn(
            "text-3xl font-black mt-2",
            countLowStockInSector(selectedSectorId) > 0 ? "text-rose-600" : "text-gray-900"
          )}>{countLowStockInSector(selectedSectorId)}</p>
          <div className="mt-2 text-xs font-semibold text-gray-500">
            {countLowStockInSector(selectedSectorId) > 0 ? "⚠️ Necessita de compra/reposição" : "Equilíbrio de estoque ok"}
          </div>
        </div>

        {/* Repairs indicators */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Wrench size={22} />
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Manutenções</span>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {countMaintenanceInSector(selectedSectorId)}
          </p>
          <div className="mt-2 text-xs font-semibold text-gray-500">Bens com falhas físicas</div>
        </div>

        {/* Sector Profile Header details info card */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-4 top-2 w-10 h-10 text-gray-300">
            <Flame size={44} className="opacity-10" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Setor Selecionado</span>
            <span className="font-extrabold text-sm text-indigo-700 mt-1 block truncate">
              {selectedSectorId === 'ALL' 
                ? 'Todos os Setores' 
                : selectedSectorId === 'NONE' 
                ? 'Geral / Sem Setor' 
                : sectors.find(s => s.id === selectedSectorId)?.name || 'Carregando...'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wide">
            Cemil • Mirante de Luz
          </div>
        </div>

      </div>

      {/* Filter and search utilities controls */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Quick search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar pelo nome ou localização deste setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 py-3 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-semibold text-gray-700"
            />
          </div>

          {/* Category drop selection filter */}
          <div className="w-full lg:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 py-3.5 px-4 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
            >
              <option value="ALL">🔍 Todas Categorias</option>
              {Object.entries(INVENTORY_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Status filter selection */}
          <div className="w-full lg:w-60">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 py-3.5 px-4 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors"
            >
              <option value="ALL">📎 Todos os Estados</option>
              {Object.entries(INVENTORY_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 2 filters: Stock alerts checkbox */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 flex-wrap gap-2 text-xs">
          
          <label className="inline-flex items-center gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 border-gray-300 pointer-events-auto"
            />
            <span className="font-extrabold text-gray-550 tracking-tight">Esconder itens em estoque satisfatório (Mostrar apenas reposição necessário)</span>
          </label>

          {/* Filter clear/status text */}
          <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase">
            Exibindo {filtered.length} de {items.length} itens correspondentes
          </div>

        </div>

      </div>

      {/* Main Inventory Layout: Table view */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando inventário integrado por setores...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-800">Nenhum item patrimonial registrado</h3>
            <p className="text-gray-400 text-sm max-w-sm mt-1">
              {selectedSectorId === 'ALL' 
                ? 'Nenhum bem ou suprimento condiz com os termos de busca informados.'
                : 'Não há itens de inventário associados a este setor ainda.'}
            </p>
            {canEdit && selectedSectorId !== 'ALL' && selectedSectorId !== 'NONE' && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                    name: 'Novo Item para ' + (sectors.find(s => s.id === selectedSectorId)?.name || 'Setor'),
                    category: 'SUPRIMENTOS',
                    quantity: 1,
                    minQuantity: 1,
                    unit: 'unidades',
                    location: '',
                    sectorId: selectedSectorId,
                    status: 'BOM',
                    observation: ''
                  });
                  setIsModalOpen(true);
                }}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95"
              >
                Cadastrar Item neste Setor
              </button>
            )}
            
            {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || lowStockOnly || selectedSectorId !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                  setLowStockOnly(false);
                  setSelectedSectorId('ALL');
                }}
                className="mt-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs"
              >
                Limpar Todos os Filtros & Voltar ao Geral
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-gray-400">Patrimônio / Descrição</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Setor Atribuído</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Categoria</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Estoque Atual</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Guarda específica</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Estado de Conservação</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">Última Modificação</th>
                  <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  const itemSectorName = sectors.find(s => s.id === item.sectorId)?.name || 'Geral / Administrativo';
                  const itemSectorId = item.sectorId;
                  
                  return (
                    <tr key={item.id} className={cn(
                      "hover:bg-gray-50/40 transition-colors border-l-4",
                      isLow ? "border-l-rose-500/80 bg-rose-50/10" : "border-l-transparent"
                    )}>
                      
                      {/* Name & Desc */}
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border",
                            isLow ? "bg-rose-50 border-rose-100" : "bg-gray-50 border-gray-100"
                          )}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-[13px]">{item.name}</div>
                            {item.observation ? (
                              <div className="text-gray-400 text-[10px] mt-0.5 max-w-[220px]" title={item.observation}>
                                {item.observation}
                              </div>
                            ) : (
                              <div className="text-gray-300 text-[10px] italic">Sem observações descritivas</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sector assignment info */}
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-1.5 text-indigo-950 font-black text-[11px]">
                          {getSectorIcon(itemSectorName)}
                          <span className="truncate max-w-[140px] text-indigo-950" title={itemSectorName}>{itemSectorName}</span>
                        </div>
                      </td>

                      {/* Category Label badge */}
                      <td className="py-5 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border",
                          getCategoryColorTextAndBg(item.category)
                        )}>
                          {INVENTORY_CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </td>

                      {/* Quantity & Unit controls */}
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          
                          {/* Easy Decrease button */}
                          {canEdit && (
                            <button
                              onClick={() => handleQuickQuantityUpdate(item, -1)}
                              className="text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-40 cursor-pointer"
                              disabled={item.quantity <= 0}
                              title="Diminuir unidade"
                            >
                              <MinusCircle size={18} />
                            </button>
                          )}

                          {/* Number view */}
                          <div className="text-center min-w-[40px]">
                            <span className={cn(
                              "text-xs font-black",
                              isLow ? "text-rose-600" : "text-gray-800"
                            )}>
                              {item.quantity}
                            </span>
                            <span className="text-gray-400 text-[9px] block">
                              {item.unit || 'unid'}
                            </span>
                          </div>

                          {/* Easy Increase button */}
                          {canEdit && (
                            <button
                              onClick={() => handleQuickQuantityUpdate(item, 1)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Adicionar unidade"
                            >
                              <PlusCircle size={18} />
                            </button>
                          )}

                          {/* Low stock tag */}
                          {isLow && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 border border-rose-200 animate-pulse shrink-0">
                              Repor!
                            </span>
                          )}

                        </div>
                      </td>

                      {/* Storage Location */}
                      <td className="py-5 px-4 text-[11px] text-gray-600 font-bold">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin size={12} className="text-gray-400 shrink-0" />
                          <span>{item.location || 'Não informado'}</span>
                        </div>
                      </td>

                      {/* Status / Condition label */}
                      <td className="py-5 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Log trace indicator */}
                      <td className="py-5 px-4">
                        <div className="text-[10px] text-gray-500 font-medium">
                          Por: <span className="font-black text-gray-600">{item.updatedBy || 'Sistema'}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">
                          {new Date(item.lastUpdated || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="bg-gray-55 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 p-2 rounded-xl border border-gray-100/50 transition-colors cursor-pointer"
                            title="Editar Dados"
                          >
                            <Pencil size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenDelete(item)}
                              className="bg-gray-55 hover:bg-rose-55 hover:text-rose-600 text-gray-500 p-2 rounded-xl border border-gray-100/50 transition-colors cursor-pointer"
                              title="Remover Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER GENERAL LEGEND AND STATEMENT */}
      <footer className="text-center p-4 border-t border-gray-150/50 mt-12 bg-white/20 rounded-3xl text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">
        🔐 Controle de Setores do Mirante de Luz | O inventário é integrado e atualizado de forma síncrona com os coordenadores responsáveis
      </footer>

      {/* Modal form for adding/editing inventory item details */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              layoutId={editingItem ? `item-edit-${editingItem.id}` : 'item-new'}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[32px] border border-gray-100 shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-none">
                      {editingItem ? 'Editar Item do Setor' : 'Cadastrar novo bem / insumo'}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold mt-1">Defina as estatísticas e attribua ao setor correto</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Sector Assignment Choice */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Setor Responsável / Vinculado *</label>
                  <select
                    required
                    value={formData.sectorId}
                    onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                  >
                    <option value="">🏠 Geral / Sem Setor Vinculado</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Nome do Item/Patrimônio *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Cadeira, Garrafa de Café, Papel A4..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category select block */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Grupo / Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryCategory })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                    >
                      {Object.entries(INVENTORY_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Measuring Unit */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Unidade de Medida</label>
                    <input
                      type="text"
                      placeholder="Ex: unidades, resmas, pacotes, litros"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quantidade Atual */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Quantidade Em Estoque *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>

                  {/* Quantidade Mínima de Alert */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Estoque Mínimo de Alerta</label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="Ex: 5"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location where it is stored */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Local Físico de Guarda</label>
                    <input
                      type="text"
                      placeholder="Ex: Armário A, Prateleira 3, Sob o altar"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Estado Físico / Condição</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryItemStatus })}
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                    >
                      {Object.entries(INVENTORY_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Observations */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Observações Adicionais</label>
                  <textarea
                    rows={3}
                    placeholder="Detalhes sobre manutenção, validade ou observação de consumo..."
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs resize-none"
                  />
                </div>

                {/* Submitting buttons action pane */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-gray-150 hover:bg-gray-50 text-gray-600 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Adastrar Registro'}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deleting warning modal */}
      <AnimatePresence>
        {isDeletingConfirmOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] border border-gray-105 shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-gray-900">Excluir Item do Inventário?</h3>
              <p className="text-gray-400 text-xs font-semibold mt-2 max-w-sm mx-auto">
                Você tem certeza que deseja deletar do sistema o item <strong className="text-gray-700">"{itemToDelete.name}"</strong>? Esta ação é irreversível e será gravada nos logs de auditoria.
              </p>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsDeletingConfirmOpen(false);
                    setItemToDelete(null);
                  }}
                  className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-100 transition-all active:scale-95 cursor-pointer"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
