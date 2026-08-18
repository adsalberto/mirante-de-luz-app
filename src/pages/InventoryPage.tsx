import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Building2,
  Flame,
  Tag,
  Shirt,
  ArrowLeft,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dataService } from "../services/dataService";
import {
  InventoryItem,
  InventoryCategory,
  InventoryItemStatus,
  InventoryMovement,
  InventoryMovementType,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_STATUS_LABELS,
  Sector,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const canEdit =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ADM" ||
    currentUser?.role === "SECRETARIO" ||
    currentUser?.role === "COORDENADOR";

  const [activeTab, setActiveTab] = useState<"INVENTORY" | "MOVEMENTS">("INVENTORY");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering states for inventory
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string>("ALL");

  // Filtering states for movements
  const [movementSearchTerm, setMovementSearchTerm] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("ALL");

  // Modal states for Item Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Modal state for Registering Movement (Entrada / Saída / Baixa)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementFormData, setMovementFormData] = useState({
    itemId: "",
    type: "ENTRADA" as InventoryMovementType,
    quantity: 1,
    reason: "",
  });

  // Form state for Item Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    category: "MOBILIARIO" as InventoryCategory,
    quantity: 0,
    minQuantity: 0,
    unit: "unidades",
    location: "",
    sectorId: "",
    status: "BOM" as InventoryItemStatus,
    observation: "",
    patrimonyCode: "",
    unitPrice: 0,
  });

  useEffect(() => {
    setLoading(true);

    // Fetch sectors
    dataService.getSectors().then((fetchedSectors) => {
      setSectors(fetchedSectors || []);
    });

    // Real-time subscription to Inventory
    const unsubInventory = dataService.subscribeToInventory(async (data) => {
      if (!data || data.length === 0) {
        // Bootstrap standard items if collection is empty
        await bootstrapInventory();
      } else {
        setItems(data);
        setLoading(false);
      }
    });

    // Real-time subscription to Movements Log
    const unsubMovements = dataService.subscribeToInventoryMovements((movs) => {
      setMovements(movs || []);
    });

    return () => {
      unsubInventory();
      unsubMovements();
    };
  }, []);

  const bootstrapInventory = async () => {
    try {
      const sectorsList = (await dataService.getSectors()) || [];
      const getSectorIdByName = (keyword: string): string => {
        const found = sectorsList.find((s) =>
          s.name.toLowerCase().includes(keyword.toLowerCase())
        );
        return found ? found.id : "";
      };

      const adminId = getSectorIdByName("Administrativo");
      const estudoId = getSectorIdByName("Estudos");
      const passeId = getSectorIdByName("Passe");
      const doutrinariaId = getSectorIdByName("Doutrinária");
      const socialId = getSectorIdByName("Ação Social");
      const livrariaId =
        getSectorIdByName("Comunicação") || getSectorIdByName("Administrativo");

      const bootstrapItems: Omit<InventoryItem, "id">[] = [
        {
          name: "Cadeiras de Plástico Brancas",
          category: "MOBILIARIO",
          quantity: 120,
          minQuantity: 40,
          unit: "unidades",
          location: "Salão Principal",
          sectorId: adminId || "",
          status: "BOM",
          observation: "Limpeza regular mensal necessária",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-001",
          unitPrice: 35.0,
        },
        {
          name: "O Livro dos Espíritos (Allan Kardec)",
          category: "LIVRARIA",
          quantity: 25,
          minQuantity: 5,
          unit: "livros",
          location: "Livraria / Recepção",
          sectorId: livrariaId || "",
          status: "BOM",
          observation: "Consignados da distribuidora FEB",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-002",
          unitPrice: 42.0,
        },
        {
          name: "O Evangelho Segundo o Espiritismo (Allan Kardec)",
          category: "LIVRARIA",
          quantity: 30,
          minQuantity: 5,
          unit: "livros",
          location: "Livraria / Recepção",
          sectorId: livrariaId || "",
          status: "BOM",
          observation: "Essencial para venda e brinde a recém-chegados",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-003",
          unitPrice: 38.0,
        },
        {
          name: "Copos d'água mineral descartáveis 200ml",
          category: "COZINHA",
          quantity: 350,
          minQuantity: 200,
          unit: "copos",
          location: "Cozinha d'água fluida",
          sectorId: passeId || "",
          status: "BOM",
          observation: "Consumo alto nos passes. Manter estoque seguro.",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-004",
          unitPrice: 0.15,
        },
        {
          name: "Projetor Digital Multimídia Epson",
          category: "ELETRONICOS",
          quantity: 1,
          minQuantity: 1,
          unit: "aparelho",
          location: "Sala de Estudos",
          sectorId: estudoId || "",
          status: "BOM",
          observation: "Utilizado nas palestras das quartas e sábados",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-005",
          unitPrice: 2800.0,
        },
        {
          name: "Microfone Sem Fio Shure",
          category: "ELETRONICOS",
          quantity: 2,
          minQuantity: 1,
          unit: "unidades",
          location: "Palco / Doutrinárias",
          sectorId: doutrinariaId || "",
          status: "BOM",
          observation: "Testar pilhas antes de cada reunião",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-006",
          unitPrice: 650.0,
        },
        {
          name: "Cesta Básica Social Regular",
          category: "COZINHA",
          quantity: 14,
          minQuantity: 15,
          unit: "cestas",
          location: "Depósito de Doações",
          sectorId: socialId || "",
          status: "BOM",
          observation: "Distribuído mensalmente para famílias assistidas",
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || "Sistema",
          patrimonyCode: "PAT-2026-007",
          unitPrice: 110.0,
        },
      ];

      for (const item of bootstrapItems) {
        await dataService.addInventoryItem(item);
      }
    } catch (err) {
      console.error("Erro no bootstrap do inventário:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "MOBILIARIO",
      quantity: item.quantity ?? 0,
      minQuantity: item.minQuantity ?? 0,
      unit: item.unit || "unidades",
      location: item.location || "",
      sectorId: item.sectorId || "",
      status: item.status || "BOM",
      observation: item.observation || "",
      patrimonyCode: item.patrimonyCode || "",
      unitPrice: item.unitPrice ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await dataService.deleteInventoryItem(itemToDelete.id);
      setIsDeletingConfirmOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir item do inventário:", err);
      alert("Erro ao excluir item. Por favor, verifique suas permissões.");
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
        sectorId: formData.sectorId || "",
        status: formData.status,
        observation: formData.observation,
        lastUpdated: Date.now(),
        updatedBy: currentUser?.name || "Sistema",
        patrimonyCode: formData.patrimonyCode || "",
        unitPrice: Number(formData.unitPrice) || 0,
      };

      if (editingItem) {
        await dataService.updateInventoryItem({
          id: editingItem.id,
          ...payload,
        });
      } else {
        await dataService.addInventoryItem(payload);
      }

      setFormData({
        name: "",
        category: "MOBILIARIO",
        quantity: 0,
        minQuantity: 0,
        unit: "unidades",
        location: "",
        sectorId: "",
        status: "BOM",
        observation: "",
        patrimonyCode: "",
        unitPrice: 0,
      });
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar item do inventário:", err);
      alert("Ocorreu um erro ao salvar o item.");
    }
  };

  // Quick Quantity Update (+ and -) with atomic increment/decrement and history logging
  const handleQuickQuantityUpdate = async (item: InventoryItem, delta: number) => {
    if (!canEdit) return;
    const reason = delta > 0 ? "Ajuste Manual Rápido (+)" : "Ajuste Manual Rápido (-)";
    await dataService.updateInventoryQuantityAtomic(
      item.id,
      delta,
      currentUser?.name || "Sistema",
      reason
    );
  };

  // Manual Movement Registration (Entrada / Saída / Baixa / Ajuste)
  const handleRegisterMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementFormData.itemId || movementFormData.quantity <= 0) {
      alert("Selecione o item e informe uma quantidade válida.");
      return;
    }

    const item = items.find((i) => i.id === movementFormData.itemId);
    if (!item) return;

    const qty = Number(movementFormData.quantity);
    let delta = qty;
    if (movementFormData.type === "SAIDA" || movementFormData.type === "BAIXA") {
      delta = -qty;
    }

    const defaultReasons: Record<InventoryMovementType, string> = {
      ENTRADA: "Compra / Doação recebida",
      SAIDA: "Retirada para uso / consumo no setor",
      BAIXA: "Descarte por avaria / quebra / vencimento",
      AJUSTE: "Recontagem física de inventário",
    };

    const reasonToUse =
      movementFormData.reason.trim() || defaultReasons[movementFormData.type];

    await dataService.updateInventoryQuantityAtomic(
      item.id,
      delta,
      currentUser?.name || "Sistema",
      reasonToUse
    );

    setIsMovementModalOpen(false);
    setMovementFormData({
      itemId: "",
      type: "ENTRADA",
      quantity: 1,
      reason: "",
    });
  };

  // Category Icon Helper
  const getCategoryIcon = (category: InventoryCategory) => {
    switch (category) {
      case "MOBILIARIO":
        return <Layers className="text-amber-500" size={18} />;
      case "ELETRONICOS":
        return <Tv className="text-blue-500" size={18} />;
      case "LIVRARIA":
        return <BookOpen className="text-teal-500" size={18} />;
      case "COZINHA":
        return <Coffee className="text-emerald-500" size={18} />;
      case "LIMPEZA":
        return <Sparkles className="text-purple-500" size={18} />;
      case "SUPRIMENTOS":
        return <FileText className="text-indigo-500" size={18} />;
      case "MANUTENCAO":
        return <Wrench className="text-rose-500" size={18} />;
      case "FIGURINO":
        return <Shirt className="text-pink-500" size={18} />;
      case "ACESSORIOS":
        return <Tag className="text-fuchsia-500" size={18} />;
      default:
        return <HelpCircle className="text-gray-500" size={18} />;
    }
  };

  const getCategoryColorTextAndBg = (category: InventoryCategory) => {
    switch (category) {
      case "MOBILIARIO":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "ELETRONICOS":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "LIVRARIA":
        return "bg-teal-50 text-teal-700 border-teal-100";
      case "COZINHA":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "LIMPEZA":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "SUPRIMENTOS":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "MANUTENCAO":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "FIGURINO":
        return "bg-pink-50 text-pink-700 border-pink-100";
      case "ACESSORIOS":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const getStatusBadge = (status: InventoryItemStatus) => {
    switch (status) {
      case "BOM":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
            ✔ Ótimo / Bom
          </span>
        );
      case "REGULAR":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
            ⚖ Regular
          </span>
        );
      case "RUIM":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
            ⚡ Ruim
          </span>
        );
      case "EM_MANUTENCAO":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
            🛠 Manutenção
          </span>
        );
      case "EM_FALTA":
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-150 text-gray-600 border border-gray-250 line-through">
            🛑 Acabou
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gray-50 text-gray-700 border border-gray-100">
            Outro
          </span>
        );
    }
  };

  const getSectorIcon = (sectorName: string) => {
    const s = sectorName.toLowerCase();
    if (s.includes("fraterno")) return <Users className="shrink-0" size={16} />;
    if (s.includes("passe") || s.includes("fluido"))
      return <Sparkles className="shrink-0" size={16} />;
    if (s.includes("estudo") || s.includes("doutrin"))
      return <BookOpen className="shrink-0" size={16} />;
    if (s.includes("infan") || s.includes("joven") || s.includes("juventude"))
      return <Coffee className="shrink-0" size={16} />;
    if (s.includes("social")) return <Heart className="shrink-0" size={16} />;
    if (s.includes("admin")) return <Building2 className="shrink-0" size={16} />;
    if (s.includes("comun")) return <Tv className="shrink-0" size={16} />;
    return <Package className="shrink-0" size={16} />;
  };

  // Filter items in memory
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.patrimonyCode && item.patrimonyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const isLowStock = item.quantity <= item.minQuantity;
    const matchesLowStock = !lowStockOnly || isLowStock;

    let matchesSector = true;
    if (selectedSectorId === "NONE") {
      matchesSector = !item.sectorId || item.sectorId === "";
    } else if (selectedSectorId !== "ALL") {
      matchesSector = item.sectorId === selectedSectorId;
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesLowStock &&
      matchesSector
    );
  });

  // Filter movements
  const filteredMovements = movements.filter((mov) => {
    const matchesSearch =
      mov.itemName.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      mov.reason.toLowerCase().includes(movementSearchTerm.toLowerCase()) ||
      mov.updatedBy.toLowerCase().includes(movementSearchTerm.toLowerCase());
    const matchesType =
      movementTypeFilter === "ALL" || mov.type === movementTypeFilter;
    return matchesSearch && matchesType;
  });

  // Sector Counts
  const countItemsInSector = (secId: string) => {
    if (secId === "ALL") return items.length;
    if (secId === "NONE") return items.filter((i) => !i.sectorId).length;
    return items.filter((i) => i.sectorId === secId).length;
  };

  const countLowStockInSector = (secId: string) => {
    const target =
      secId === "ALL"
        ? items
        : secId === "NONE"
        ? items.filter((i) => !i.sectorId)
        : items.filter((i) => i.sectorId === secId);
    return target.filter((i) => i.quantity <= i.minQuantity).length;
  };

  const countMaintenanceInSector = (secId: string) => {
    const target =
      secId === "ALL"
        ? items
        : secId === "NONE"
        ? items.filter((i) => !i.sectorId)
        : items.filter((i) => i.sectorId === secId);
    return target.filter((i) => i.status === "EM_MANUTENCAO").length;
  };

  // Total Patrimonial Valuation
  const totalValuationInSector = (secId: string) => {
    const target =
      secId === "ALL"
        ? items
        : secId === "NONE"
        ? items.filter((i) => !i.sectorId)
        : items.filter((i) => i.sectorId === secId);
    return target.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  };

  // Print Report Handler
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const getSectorName = (id?: string) => {
      if (!id) return "Geral / Sem Setor";
      const sec = sectors.find((s) => s.id === id);
      return sec ? sec.name : "Geral / Sem Setor";
    };

    const totalVal = filtered.reduce(
      (acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0),
      0
    );

    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Inventário Geral - CEMIL</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            h1 { text-align: center; color: #063994; margin-bottom: 5px; }
            h3 { text-align: center; color: #666; font-weight: normal; margin-top: 0; margin-bottom: 20px; }
            .valuation { text-align: center; font-size: 14px; font-weight: bold; color: #15803d; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f4f6fa; color: #063994; font-weight: bold; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .warning { color: red; font-weight: bold; }
            .meta { text-align: right; font-size: 11px; color: #888; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>MIRANTE DE LUZ - CEMIL</h1>
          <h3>Inventário Físico e Patrimônio por Setores - Emitido em ${new Date().toLocaleDateString("pt-BR")}</h3>
          <div class="valuation">Valor Patrimonial Total Calculado: R$ ${totalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          
          <table>
            <thead>
              <tr>
                <th>Cód. Tombamento</th>
                <th>Setor</th>
                <th>Item / Descrição</th>
                <th>Categoria</th>
                <th>Qtd</th>
                <th>Valor Un.</th>
                <th>Valor Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (item) => `
                <tr>
                  <td><strong>${item.patrimonyCode || "N/A"}</strong></td>
                  <td>${getSectorName(item.sectorId)}</td>
                  <td><strong>${item.name}</strong> ${item.observation ? `<br/><small>(${item.observation})</small>` : ""}</td>
                  <td>${INVENTORY_CATEGORY_LABELS[item.category] || item.category}</td>
                  <td>${item.quantity} ${item.unit} ${item.quantity <= item.minQuantity ? '<span class="warning">(Repor)</span>' : ""}</td>
                  <td>R$ ${(item.unitPrice || 0).toFixed(2)}</td>
                  <td>R$ ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
                  <td>${INVENTORY_STATUS_LABELS[item.status] || item.status}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="meta">
            Relatório Oficial do Sistema Integrado CEMIL • Gerado por: ${currentUser?.name || "Administrador"}
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Top Header Navigation */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-3 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-2xl transition-colors cursor-pointer"
            title="Voltar ao Início"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Package size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Inventário & Patrimônio Físico
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado
              </span>
            </div>
            <p className="text-gray-400 text-xs font-semibold mt-1">
              Gestão patrimonial, doações, insumos de consumo e movimentações por setor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Action Buttons */}
          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-gray-100"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir Relatório</span>
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer border border-teal-100 shadow-sm"
              >
                <TrendingUp size={16} />
                <span>Nova Movimentação</span>
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                    name: "",
                    category: "MOBILIARIO",
                    quantity: 1,
                    minQuantity: 5,
                    unit: "unidades",
                    location: "",
                    sectorId: selectedSectorId === "ALL" || selectedSectorId === "NONE" ? "" : selectedSectorId,
                    status: "BOM",
                    observation: "",
                    patrimonyCode: `PAT-${new Date().getFullYear()}-${String(items.length + 1).padStart(3, "0")}`,
                    unitPrice: 0,
                  });
                  setIsModalOpen(true);
                }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                <span>Cadastrar Item</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Primary Tab Bar (Estoque vs Histórico) */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={cn(
            "px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "INVENTORY"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Package size={16} />
          <span>Estoque & Bens Patrimoniais ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("MOVEMENTS")}
          className={cn(
            "px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "MOVEMENTS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <History size={16} />
          <span>Histórico de Movimentações ({movements.length})</span>
        </button>
      </div>

      {activeTab === "INVENTORY" ? (
        <>
          {/* Sector Carousel Switcher */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Filtrar Inventário por Setor da Casa Espírita
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {selectedSectorId === "ALL"
                  ? "Exibindo Todos os Setores"
                  : selectedSectorId === "NONE"
                  ? "Sem Setor Atribuído"
                  : sectors.find((s) => s.id === selectedSectorId)?.name}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {/* All Sectors Option */}
              <button
                onClick={() => setSelectedSectorId("ALL")}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0",
                  selectedSectorId === "ALL"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
                )}
              >
                <Building2 size={16} />
                <span>Todos os Setores</span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    selectedSectorId === "ALL"
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {items.length}
                </span>
              </button>

              {/* Individual Sectors Buttons */}
              {sectors.map((sector) => {
                const count = countItemsInSector(sector.id);
                const lowCount = countLowStockInSector(sector.id);
                const isSelected = selectedSectorId === sector.id;

                return (
                  <button
                    key={sector.id}
                    onClick={() => setSelectedSectorId(sector.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0 relative",
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
                    )}
                  >
                    {getSectorIcon(sector.name)}
                    <span className="truncate max-w-[150px]">{sector.name}</span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {count}
                    </span>
                    {lowCount > 0 && !isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-1 -right-1 ring-2 ring-white animate-pulse"></span>
                    )}
                  </button>
                );
              })}

              {/* Uncategorized stock drawer */}
              <button
                onClick={() => setSelectedSectorId("NONE")}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-xs transition-all duration-250 cursor-pointer border select-none shrink-0",
                  selectedSectorId === "NONE"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-100/80 text-gray-600 hover:border-gray-200"
                )}
              >
                <HelpCircle size={16} />
                <span>Geral / Sem Setor</span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    selectedSectorId === "NONE"
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {countItemsInSector("NONE")}
                </span>
              </button>
            </div>
          </section>

          {/* Metrics Summary Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Total items registered */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Package size={22} />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {selectedSectorId === "ALL" ? "Inventário Geral" : "Neste Setor"}
              </span>
              <p className="text-3xl font-black text-gray-900 mt-2">
                {countItemsInSector(selectedSectorId)}
              </p>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                Produtos sob gestão
              </div>
            </div>

            {/* Low Stock count alert */}
            <div
              className={cn(
                "p-6 rounded-[32px] border transition-all relative overflow-hidden",
                countLowStockInSector(selectedSectorId) > 0
                  ? "bg-rose-50/50 border-rose-100 shadow-sm"
                  : "bg-white border-gray-100 shadow-sm"
              )}
            >
              <div
                className={cn(
                  "absolute right-4 top-4 w-12 h-12 rounded-2xl flex items-center justify-center",
                  countLowStockInSector(selectedSectorId) > 0
                    ? "bg-rose-100 text-rose-600"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <AlertTriangle
                  size={22}
                  className={cn(
                    countLowStockInSector(selectedSectorId) > 0 && "animate-bounce"
                  )}
                />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Estoque Crítico
              </span>
              <p
                className={cn(
                  "text-3xl font-black mt-2",
                  countLowStockInSector(selectedSectorId) > 0
                    ? "text-rose-600"
                    : "text-gray-900"
                )}
              >
                {countLowStockInSector(selectedSectorId)}
              </p>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                {countLowStockInSector(selectedSectorId) > 0
                  ? "⚠️ Necessita de reposição"
                  : "Equilíbrio de estoque ok"}
              </div>
            </div>

            {/* Total Patrimonial Valuation */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign size={22} />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Valor Patrimonial Total
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                R$ {totalValuationInSector(selectedSectorId).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                Avaliação estimada dos bens
              </div>
            </div>

            {/* Repairs / Maintenance */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-4 top-4 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Wrench size={22} />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Manutenções
              </span>
              <p className="text-3xl font-black text-gray-900 mt-2">
                {countMaintenanceInSector(selectedSectorId)}
              </p>
              <div className="mt-2 text-xs font-semibold text-gray-500">
                Bens com reparo pendente
              </div>
            </div>
          </div>

          {/* Filter and search utilities controls */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Quick search */}
              <div className="flex-1 relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar por código de tombamento, nome do item ou local de guarda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 py-3 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-semibold text-gray-700 text-xs"
                />
              </div>

              {/* Category drop selection filter */}
              <div className="w-full lg:w-64">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 py-3 px-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                >
                  <option value="ALL">🔍 Todas Categorias</option>
                  {Object.entries(INVENTORY_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter selection */}
              <div className="w-full lg:w-60">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-100 py-3 px-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                >
                  <option value="ALL">📎 Todos os Estados</option>
                  {Object.entries(INVENTORY_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox filter for low stock */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-4 flex-wrap gap-2 text-xs">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 border-gray-300 pointer-events-auto"
                />
                <span className="font-extrabold text-gray-600 tracking-tight">
                  Mostrar apenas itens com estoque crítico / reposição necessária
                </span>
              </label>

              <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase">
                Exibindo {filtered.length} de {items.length} itens correspondentes
              </div>
            </div>
          </div>

          {/* Main Inventory Table */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24 gap-4">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Sincronizando inventário e patrimônio em tempo real...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-24 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <Package size={32} />
                </div>
                <h3 className="text-lg font-black text-gray-800">
                  Nenhum item patrimonial registrado
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mt-1">
                  {selectedSectorId === "ALL"
                    ? "Nenhum bem condiz com os filtros aplicados."
                    : "Não há itens de inventário associados a este setor ainda."}
                </p>
                {(searchTerm ||
                  categoryFilter !== "ALL" ||
                  statusFilter !== "ALL" ||
                  lowStockOnly ||
                  selectedSectorId !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("ALL");
                      setStatusFilter("ALL");
                      setLowStockOnly(false);
                      setSelectedSectorId("ALL");
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs"
                  >
                    Limpar Filtros & Mostrar Todos
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Cód. / Tombamento & Item
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Setor Atribuído
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Categoria
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Estoque Atual
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Valoração
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Guarda Físico
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Condição
                      </th>
                      <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item) => {
                      const isLow = item.quantity <= item.minQuantity;
                      const itemSectorName =
                        sectors.find((s) => s.id === item.sectorId)?.name ||
                        "Geral / Administrativo";

                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-gray-50/40 transition-colors border-l-4",
                            isLow
                              ? "border-l-rose-500 bg-rose-50/10"
                              : "border-l-transparent"
                          )}
                        >
                          {/* Name & Tombamento */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                                  isLow
                                    ? "bg-rose-50 border-rose-100"
                                    : "bg-gray-50 border-gray-100"
                                )}
                              >
                                {getCategoryIcon(item.category)}
                              </div>
                              <div>
                                {item.patrimonyCode && (
                                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[9px] font-bold block w-fit mb-0.5">
                                    {item.patrimonyCode}
                                  </span>
                                )}
                                <div className="font-bold text-gray-800 text-xs">
                                  {item.name}
                                </div>
                                {item.observation && (
                                  <div
                                    className="text-gray-400 text-[10px] mt-0.5 max-w-[220px] truncate"
                                    title={item.observation}
                                  >
                                    {item.observation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sector assignment */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs">
                              {getSectorIcon(itemSectorName)}
                              <span className="truncate max-w-[130px]">
                                {itemSectorName}
                              </span>
                            </div>
                          </td>

                          {/* Category Label badge */}
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border",
                                getCategoryColorTextAndBg(item.category)
                              )}
                            >
                              {INVENTORY_CATEGORY_LABELS[item.category] ||
                                item.category}
                            </span>
                          </td>

                          {/* Quantity & Quick Actions */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button
                                  onClick={() =>
                                    handleQuickQuantityUpdate(item, -1)
                                  }
                                  className="text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-30 cursor-pointer"
                                  disabled={item.quantity <= 0}
                                  title="Remover 1 unidade"
                                >
                                  <MinusCircle size={18} />
                                </button>
                              )}

                              <div className="text-center min-w-[36px]">
                                <span
                                  className={cn(
                                    "text-xs font-black",
                                    isLow ? "text-rose-600" : "text-gray-800"
                                  )}
                                >
                                  {item.quantity}
                                </span>
                                <span className="text-gray-400 text-[9px] block">
                                  {item.unit || "unid"}
                                </span>
                              </div>

                              {canEdit && (
                                <button
                                  onClick={() => handleQuickQuantityUpdate(item, 1)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Adicionar 1 unidade"
                                >
                                  <PlusCircle size={18} />
                                </button>
                              )}

                              {isLow && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 border border-rose-200 animate-pulse shrink-0">
                                  Repor
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Valuation */}
                          <td className="py-4 px-4">
                            <div className="text-xs font-extrabold text-gray-800">
                              R$ {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                            </div>
                            <div className="text-[9px] text-gray-400">
                              R$ {(item.unitPrice || 0).toFixed(2)} / {item.unit || "unid"}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="py-4 px-4 text-xs text-gray-600 font-bold">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-gray-400 shrink-0" />
                              <span>{item.location || "Não informado"}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">{getStatusBadge(item.status)}</td>

                          {/* Action buttons */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(item)}
                                className="bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 p-2 rounded-xl border border-gray-100 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenDelete(item)}
                                  className="bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-500 p-2 rounded-xl border border-gray-100 transition-colors cursor-pointer"
                                  title="Remover"
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
        </>
      ) : (
        /* MOVEMENTS HISTORICAL TAB */
        <div className="space-y-6">
          {/* Movement Filters Bar */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-1 w-full relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por item, motivo ou responsável pela movimentação..."
                value={movementSearchTerm}
                onChange={(e) => setMovementSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 py-3 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-semibold text-gray-700 text-xs"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 py-3 px-4 rounded-2xl font-bold text-gray-700 outline-none text-xs"
              >
                <option value="ALL">🔁 Todos os Tipos</option>
                <option value="ENTRADA">🟢 Entradas / Compras</option>
                <option value="SAIDA">🔵 Saídas / Uso</option>
                <option value="BAIXA">🔴 Baixas / Quebras</option>
                <option value="AJUSTE">🟣 Ajustes de Contagem</option>
              </select>
            </div>
          </div>

          {/* Movements Log Table */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            {filteredMovements.length === 0 ? (
              <div className="p-16 text-center text-gray-400 space-y-2">
                <History size={36} className="mx-auto text-gray-300" />
                <p className="font-bold text-sm text-gray-700">Nenhuma movimentação registrada</p>
                <p className="text-xs">As alterações de quantidade e baixas de estoque aparecerão aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Data / Hora
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Tipo
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Item do Inventário
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Variação
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Estoque Anterior → Novo
                      </th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Motivo / Justificativa
                      </th>
                      <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Responsável
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredMovements.map((mov) => {
                      const isEntry = mov.type === "ENTRADA";
                      const isExit = mov.type === "SAIDA";
                      const isDiscard = mov.type === "BAIXA";

                      return (
                        <tr key={mov.id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-6 font-semibold text-gray-500 whitespace-nowrap">
                            {new Date(mov.timestamp).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                isEntry
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : isExit
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : isDiscard
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : "bg-purple-50 text-purple-700 border-purple-100"
                              )}
                            >
                              {mov.type}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-extrabold text-gray-800">
                            {mov.itemName}
                          </td>
                          <td className="py-4 px-4 font-black">
                            <span
                              className={
                                isEntry
                                  ? "text-emerald-600"
                                  : isExit || isDiscard
                                  ? "text-rose-600"
                                  : "text-purple-600"
                              }
                            >
                              {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-gray-600">
                            {mov.previousQuantity} → <strong className="text-gray-900">{mov.newQuantity}</strong>
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-medium">
                            {mov.reason || "Não especificado"}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-gray-700">
                            {mov.updatedBy}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal form for adding/editing inventory item details */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
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
                      {editingItem ? "Editar Item do Setor" : "Cadastrar novo bem / insumo"}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold mt-1">
                      Preencha os dados e código de tombamento patrimonial
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sector Assignment Choice */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Setor Responsável / Vinculado *
                  </label>
                  <select
                    required
                    value={formData.sectorId}
                    onChange={(e) =>
                      setFormData({ ...formData, sectorId: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                  >
                    <option value="">🏠 Geral / Sem Setor Vinculado</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Patrimony Code */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Cód. Tombamento / Patrimônio
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: PAT-2026-001"
                      value={formData.patrimonyCode}
                      onChange={(e) =>
                        setFormData({ ...formData, patrimonyCode: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-mono font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Valor Unitário Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.unitPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, unitPrice: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Nome do Item/Patrimônio *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Cadeira de Plástico, Projetor, Copos..."
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Grupo / Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as InventoryCategory,
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                    >
                      {Object.entries(INVENTORY_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Unidade de Medida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: unidades, resmas, pacotes"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Quantidade */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Quantidade Em Estoque *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Number(e.target.value),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>

                  {/* Estoque Mínimo */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Estoque Mínimo de Alerta
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.minQuantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minQuantity: Number(e.target.value),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Location */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Local Físico de Guarda
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Armário A, Prateleira 3"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                      Estado Físico / Condição
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as InventoryItemStatus,
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-colors text-xs"
                    >
                      {Object.entries(INVENTORY_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Observation */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes sobre garantia, doador ou manutenção..."
                    value={formData.observation}
                    onChange={(e) =>
                      setFormData({ ...formData, observation: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none focus:bg-white focus:border-indigo-600 transition-all text-xs resize-none"
                  />
                </div>

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
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                  >
                    {editingItem ? "Salvar Alterações" : "Cadastrar Registro"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Registering Movement (Entrada / Saída / Baixa) */}
      <AnimatePresence>
        {isMovementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] border border-gray-100 shadow-2xl p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-none">
                      Lançar Movimentação
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold mt-1">
                      Registre entrada, saída para uso ou baixa por avaria
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMovementModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRegisterMovementSubmit} className="space-y-4">
                {/* Select Item */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Selecione o Item do Inventário *
                  </label>
                  <select
                    required
                    value={movementFormData.itemId}
                    onChange={(e) =>
                      setMovementFormData({ ...movementFormData, itemId: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none text-xs"
                  >
                    <option value="">Selecione o produto...</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Estoque atual: {i.quantity} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Movement Type */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Tipo de Movimentação *
                  </label>
                  <select
                    value={movementFormData.type}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        type: e.target.value as InventoryMovementType,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none text-xs"
                  >
                    <option value="ENTRADA">🟢 Entrada (Compra / Doação recebida)</option>
                    <option value="SAIDA">🔵 Saída (Consumo / Uso no setor)</option>
                    <option value="BAIXA">🔴 Baixa (Avaria / Quebra / Descarte)</option>
                    <option value="AJUSTE">🟣 Ajuste Manual (Contagem)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Quantidade a Movimentar *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={movementFormData.quantity}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-gray-700 outline-none text-xs"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Motivo / Justificativa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Compra do mês, evento de domingo, cadeira quebrada..."
                    value={movementFormData.reason}
                    onChange={(e) =>
                      setMovementFormData({ ...movementFormData, reason: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-semibold text-gray-700 outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsMovementModalOpen(false)}
                    className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-lg shadow-teal-100 cursor-pointer"
                  >
                    Confirmar Movimentação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {isDeletingConfirmOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[32px] border border-gray-100 shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-gray-900">
                Excluir Item do Inventário?
              </h3>
              <p className="text-gray-400 text-xs font-semibold mt-2 max-w-sm mx-auto">
                Você tem certeza que deseja deletar do sistema o item{" "}
                <strong className="text-gray-700">"{itemToDelete.name}"</strong>
                ? Esta ação é irreversível e será gravada nos logs.
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
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-100 transition-all cursor-pointer"
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
