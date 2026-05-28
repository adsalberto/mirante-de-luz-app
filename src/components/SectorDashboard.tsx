import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  LayoutDashboard,
  Zap,
  ArrowRight,
  Sparkles,
  Search,
  MessageSquare,
  Palette,
  Eye,
  FileText,
  Paperclip,
  UploadCloud,
  Download,
  Trash2,
  FileDown,
  CheckCircle2,
  Activity,
  Handshake,
  BookOpen,
  Baby,
  Shield,
  ListOrdered,
  Calendar,
  Pencil,
  DollarSign,
  CreditCard,
  QrCode,
  Coins,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  Truck,
  Store,
  Coffee,
  Tag,
  Barcode,
  Receipt,
  Laptop,
  Wrench,
  Cpu,
  MapPin,
  Target,
  ChevronRight,
  Info,
  X,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Sector, SectorDocument, formatSectorName, TechTicket, ConstructionProject, VisitorLog, CleaningChecklist, InventoryItem, TicketStatus, TicketPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SectorDashboardProps {
  sectorId: string;
  sectorName: string;
  initialTab?: 'overview' | 'finance' | 'pos_bazar';
}

// Financial Transaction Type
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
  receiptBase64?: string;
  receiptName?: string;
}

// Product Inventory Type
interface MarketProduct {
  id: string;
  name: string;
  category: 'LIVRARIA' | 'CANTINA' | 'BAZAR';
  price: number;
  stock: number;
  minLimit: number;
  expirationDate?: string;
}

interface GeneratedBoleto {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  barcode: string;
  status: 'Pendente' | 'Compensado';
}

interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  target?: string;
  mode: 'internal' | 'external';
  externalUrl?: string;
  goalAmount?: number;
  raisedAmount?: number;
}

interface OnlineDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  date: string;
  method: string;
  campaign: string;
  status: 'Pendente' | 'Aprovada';
}

function getSectorDescription(name: string): string {
  const normalized = (name || '').toLowerCase();
  
  if (normalized.includes('mediun') || normalized.includes('mediúnica')) {
    return 'Área dedicada aos trabalhos mediúnicos de amparo, desobsessão e passes magnéticos. Monitore atendimentos espirituais, equipe de médiuns e relatórios de assistência.';
  }
  if (normalized.includes('fraterno') || normalized.includes('atendimento') || normalized.includes('recep')) {
    return 'Espaço de acolhimento fraterno e diálogo consolar. Monitore a fila de triagem, agendamento de conversas, aconselhamentos e prontuários de assistência.';
  }
  if (normalized.includes('livraria') || normalized.includes('bazar') || normalized.includes('venda')) {
    return 'Gerenciamento do acervo de obras espíritas e bazar beneficente. Monitore o controle de estoque, fluxo de vendas de livros, arrecadação e faturamento.';
  }
  if (normalized.includes('cantina') || normalized.includes('evento') || normalized.includes('cozinha') || normalized.includes('artesanato')) {
    return 'Coordenação de eventos festivos, galinhadas beneficentes e cantina fraterna. Controle as arrecadações, venda de ingressos e custos operacionais.';
  }
  if (normalized.includes('financeiro') || normalized.includes('tesouraria') || normalized.includes('caixa')) {
    return 'Gestão contábil e de transparência de recursos da casa. Monitore o fluxo de caixa, boletos gerados para colaboradores, receitas de doações e despesas gerais.';
  }
  if (normalized.includes('patrimôn') || normalized.includes('manuten')) {
    return 'Conservação predial, instalações e obras de infraestrutura física. Planeje melhorias, registre despesas de manutenção física e acompanhe o fluxo patrimonial.';
  }
  if (normalized.includes('estudo') || normalized.includes('doutrin') || normalized.includes('palestra') || normalized.includes('escla')) {
    return 'Promoção do estudo doutrinário e palestras públicas. Acompanhe a escala de palestrantes, turmas do ESDE/EADE e frequência dos estudantes da doutrina.';
  }
  if (normalized.includes('infân') || normalized.includes('juven') || normalized.includes('evangeliz')) {
    return 'Evangelização infantil e juventude espírita. Monitore turmas de estudos, frequência dos alunos, atividades pedagógicas e coordenação das aulas.';
  }
  if (normalized.includes('social') || normalized.includes('assistênc')) {
    return 'Promoção social espírita e distribuição de cestas básicas. Monitore o cadastro de famílias assistidas, donativos recebidos e entregas de amparo social.';
  }
  if (normalized.includes('administrat') || normalized.includes('secretar')) {
    return 'Centro de operações administrativas, regulação de voluntários e segurança de dados. Monitore cadastros gerais, emissão de relatórios e documentações.';
  }

  // Fallback default
  return `Ambiente de controle para o setor de ${formatSectorName(name)}. Acompanhe as atividades operacionais, fluxo de pessoas, equipe de voluntários e documentações do setor.`;
}

const StatCard = ({ title, value, icon: Icon, color, bg, shadow, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={cn(
      "p-6 sm:p-8 bg-white rounded-[40px] border border-gray-50 shadow-xl overflow-hidden relative group transition-all",
      shadow
    )}
  >
    <div className={cn("absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.03] translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 transition-transform group-hover:scale-125 duration-700", color.replace('text', 'bg'))}>
      <Icon size={128} />
    </div>
    
    <div className="relative z-10 space-y-4">
      <div className={cn("inline-flex p-3 rounded-[20px]", bg, color)}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-4xl font-black text-gray-900 tracking-tight mt-1">{value}</h3>
      </div>
    </div>
  </motion.div>
);

const getSubSectorIcon = (name: string) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('patrimôn') || norm.includes('material')) return Package;
  if (norm.includes('tecnolog') || norm.includes('informát') || norm.includes('ti')) return Laptop;
  if (norm.includes('obra') || norm.includes('reforma') || norm.includes('manuten')) return Wrench;
  if (norm.includes('limpeza') || norm.includes('recep')) return Sparkles;
  return Shield;
};

export default function SectorDashboard({ sectorId, sectorName, initialTab }: SectorDashboardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentsRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState<Sector | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<(ServiceQueueEntry & { participantName?: string })[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    inProgress: 0,
    completedToday: 0
  });

  // Check if current sector is Administrative
  const isAdministrativo = formatSectorName(sectorName).toLowerCase().includes('administrat') ||
                           formatSectorName(sectorName).toLowerCase().includes('secretar');

  const isAdmin = 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'ADM' || 
    currentUser?.email === 'carlostecal35@gmail.com' ||
    (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  const defaultTab = (initialTab === 'finance' && !isAdmin) ? 'overview' : (initialTab || 'overview');
  const [adminTab, setAdminTab] = useState<string>(defaultTab);
  const [currentViewSectorId, setCurrentViewSectorId] = useState<string>(sectorId);
  const [subSectors, setSubSectors] = useState<Sector[]>([]);
  const [infoModalSector, setInfoModalSector] = useState<Sector | null>(null);

  // --- ADMIN FINANCE STATES ---
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [newTxType, setNewTxType] = useState<'ENTRADA' | 'SAÍDA'>('ENTRADA');
  const [newTxCategory, setNewTxCategory] = useState('Doação');
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  
  // Custom estimated & realized amounts matching spreadsheet columns
  const [newTxAmountEst, setNewTxAmountEst] = useState('');
  const [newTxAmountReal, setNewTxAmountReal] = useState('');
  const [newTxCustomStatus, setNewTxCustomStatus] = useState<string>('Recebido');
  const [newTxAccountType, setNewTxAccountType] = useState<string>('Luz');
  const [newTxPaymentMethod, setNewTxPaymentMethod] = useState<string>('Pix');

  const [newTxDate, setNewTxDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [txSearch, setTxSearch] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txToDelete, setTxToDelete] = useState<FinancialTransaction | null>(null);
  
  // Receipts uploaded attachments
  const [newTxReceiptBase64, setNewTxReceiptBase64] = useState<string>('');
  const [newTxReceiptName, setNewTxReceiptName] = useState<string>('');

  // Payment Sim States
  const [paymentType, setPaymentType] = useState<'pix' | 'boleto' | 'donation'>('pix');
  const [pixName, setPixName] = useState('');
  const [pixAmount, setPixAmount] = useState('');
  const [pixActive, setPixActive] = useState(false);
  const [generatedPixKey, setGeneratedPixKey] = useState('');
  
  const [boletoName, setBoletoName] = useState('');
  const [boletoAmount, setBoletoAmount] = useState('');
  const [boletoDue, setBoletoDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [generatedBoletoBarcode, setGeneratedBoletoBarcode] = useState('');
  const [boletoActive, setBoletoActive] = useState(false);
  const [generatedBoletos, setGeneratedBoletos] = useState<GeneratedBoleto[]>([]);
  const [viewingBoleto, setViewingBoleto] = useState<GeneratedBoleto | null>(null);

  // Institution Pix Customize States
  const [pixConfig, setPixConfig] = useState(() => {
    return {
      key: 'carlostecal35@gmail.com',
      name: 'ASSOC ESPIRITA MIRANTE DE LUZ',
      city: 'MONTES CLAROS',
      showConfig: false
    };
  });

  // Campaigns & Online Donations States
  const [donationCampaigns, setDonationCampaigns] = useState<DonationCampaign[]>([]);
  const [onlineDonations, setOnlineDonations] = useState<OnlineDonation[]>([]);

  // --- ADMIN STOCK & POS STATES ---
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [cart, setCart] = useState<{ product: MarketProduct; quantity: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState<'ALL' | 'LIVRARIA' | 'CANTINA' | 'BAZAR'>('ALL');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'PIX' | 'DINHEIRO' | 'CARTÃO'>('PIX');
  
  // Product Creation
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdMin, setNewProdMin] = useState('5');
  const [newProdExp, setNewProdExp] = useState('');

  // Procurement (Supplier Management)
  const [suppliers, setSuppliers] = useState([
    { name: 'Editora FEB', contact: 'comercial@febnet.org.br', location: 'Brasília - DF' },
    { name: 'FEAL - André Luiz', contact: 'vendas@feal.com.br', location: 'São Paulo - SP' },
    { name: 'Distribuidora União Espírita', contact: 'contato@distribuidorauniao.com', location: 'Belo Horizonte - MG' },
    { name: 'Cesta Básica Atacadista', contact: 'sac@cestabaasica.com', location: 'Local' }
  ]);
  const [supplierHistory, setSupplierHistory] = useState<{ id: string; supplier: string; product: string; quantity: number; cost: number; date: string }[]>([]);
  const [buySupplier, setBuySupplier] = useState('Editora FEB');
  const [buyProdName, setBuyProdName] = useState('');
  const [buyCategory, setBuyCategory] = useState<'LIVRARIA' | 'CANTINA' | 'BAZAR'>('LIVRARIA');
  const [buyQty, setBuyQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // --- SUBSECTOR ADVANCED STATES ---
  // 1. Material e Patrimônio
  const [patrimonioItems, setPatrimonioItems] = useState<any[]>([]);
  const [patLoans, setPatLoans] = useState<any[]>([]);
  const [patrimonioCategory, setPatrimonioCategory] = useState<string>('ALL');

  // New QR States for Asset Tracking
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<any | null>(null);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannedItemDetail, setScannedItemDetail] = useState<any | null>(null);
  const [tempConservationStatus, setTempConservationStatus] = useState<string>('BOM');
  const [tempObservation, setTempObservation] = useState<string>('');

  // Active Camera states for phone browser QR scan
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Effect 1: Deep links for QR codes on page load (e.g. scanning with the phone's default camera application)
  useEffect(() => {
    if (patrimonioItems.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const assetIdParam = params.get('assetId') || params.get('patId') || params.get('scan');
      if (assetIdParam) {
        const item = patrimonioItems.find(i => String(i.id).toLowerCase() === assetIdParam.toLowerCase() || String(i.name).toLowerCase().includes(assetIdParam.toLowerCase()));
        if (item) {
          setScannedItemDetail(item);
          setTempConservationStatus(item.status || 'BOM');
          setTempObservation(item.observation || '');
          setScannerModalOpen(true);
          
          // Clear query params from active address bar so refreshes are clean
          const urlWithoutParams = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: urlWithoutParams }, '', urlWithoutParams);
        }
      }
    }
  }, [patrimonioItems]);

  // Effect 2: Camera control loop for html5-qrcode inside the interactive scan view
  useEffect(() => {
    let scannerInstance: Html5Qrcode | null = null;

    if (scannerModalOpen && !scannedItemDetail) {
      setCameraError(null);
      setCameraActive(false);

      // Brief delay to allow the modal's animation to finish and container DOM node to render
      const timeout = setTimeout(() => {
        try {
          const container = document.getElementById("qr-reader-viewport");
          if (!container) return;

          scannerInstance = new Html5Qrcode("qr-reader-viewport");
          qrScannerRef.current = scannerInstance;

          scannerInstance.start(
            { facingMode: "environment" }, // Prioritize the device's back-facing camera
            {
              fps: 15,
              qrbox: (w, h) => {
                const size = Math.min(w, h) * 0.70;
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              // Successfully decoded QR pattern
              handleProcessScannedId(decodedText);
              
              // Automatically turn off camera stream to save battery and resource lock
              if (scannerInstance && scannerInstance.isScanning) {
                scannerInstance.stop().then(() => {
                  setCameraActive(false);
                }).catch(err => console.error("Error stopping qr reader after read:", err));
              }
            },
            () => {
              // Ignore normal frame decoding failures (reduces log pollution)
            }
          ).then(() => {
            setCameraActive(true);
          }).catch((err) => {
            console.error("Camera permissions / trigger failed:", err);
            setCameraActive(false);
            setCameraError("Não foi possível acessar a câmera do celular. Permissão negada ou em uso. Use os simuladores abaixo!");
          });
        } catch (e: any) {
          console.error("Scanner setup failed:", e);
          setCameraActive(false);
          setCameraError(e.message || "Não foi possível carregar o componente de câmera.");
        }
      }, 600);

      return () => {
        clearTimeout(timeout);
        if (scannerInstance && scannerInstance.isScanning) {
          scannerInstance.stop()
            .then(() => setCameraActive(false))
            .catch(err => console.error("Error stopping camera scan session:", err));
        }
      };
    } else {
      // Force shutdown if modal closed or item scanned
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop()
          .then(() => setCameraActive(false))
          .catch(err => console.error("Error stopping camera scan session:", err));
      }
    }
  }, [scannerModalOpen, scannedItemDetail]);

  // Daily Cash States for Treasury Overview
  const [treasuryCashSession, setTreasuryCashSession] = useState<any | null>(null);
  const [closedSessionsHistory, setClosedSessionsHistory] = useState<any[]>([]);
  
  // 2. Tecnologia e Informática
  const [techTickets, setTechTickets] = useState<TechTicket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  
  // 3. Obras e Reformas
  const [obraProjects, setObraProjects] = useState<ConstructionProject[]>([]);
  const [newObraName, setNewObraName] = useState('');
  const [newObraBudget, setNewObraBudget] = useState('');
  const [newObraLocation, setNewObraLocation] = useState('');
  
  // 4. Recepção e Limpeza
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorPurpose, setNewVisitorPurpose] = useState('');
  
  const [cleaningChecklists, setCleaningChecklists] = useState<CleaningChecklist[]>([]);
  const [newChecklistRoomName, setNewChecklistRoomName] = useState('');
  const [newChecklistStatus, setNewChecklistStatus] = useState<'LIMPO' | 'ATENCAO' | 'PENDENTE'>('LIMPO');
  const [newChecklistResponsibleName, setNewChecklistResponsibleName] = useState('');
  const [newChecklistObservations, setNewChecklistObservations] = useState('');

  useEffect(() => {
    setCurrentViewSectorId(sectorId);
    setAdminTab(defaultTab);
  }, [sectorId, defaultTab]);

  useEffect(() => {
    const fetchSubSectors = async () => {
      if (isAdministrativo) {
        try {
          const allSectors = await dataService.getSectors();
          if (allSectors) {
            const list = allSectors.filter(s => s.parentSectorId === sectorId);
            setSubSectors(list);
          }
        } catch (err) {
          console.error("Error loading subsectors in dashboard:", err);
        }
      }
    };
    fetchSubSectors();
  }, [sectorId, isAdministrativo]);

  useEffect(() => {
    loadData();
    if (isAdministrativo) {
      loadAdminData();
    }
  }, [currentViewSectorId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allQueue, allParticipants, allSectors] = await Promise.all([
        dataService.getQueue(),
        dataService.getParticipants(),
        dataService.getSectors()
      ]);
      
      const currentSector = allSectors?.find(s => s.id === currentViewSectorId);
      if (currentSector) setSector(currentSector);

      const sectorQueue = (allQueue || []).filter(item => item.sectorId === currentViewSectorId);
      
      const waiting = sectorQueue
        .filter(item => item.status === 'WAITING')
        .map(item => ({
          ...item,
          participantName: (allParticipants || []).find(p => p.id === item.participantId)?.name || 'Participante'
        }));

      setWaitingQueue(waiting);
      setStats({
        waiting: waiting.length,
        inProgress: sectorQueue.filter(item => item.status === 'IN_PROGRESS').length,
        completedToday: sectorQueue.filter(item => item.status === 'FINISHED').length
      });
    } catch (err) {
      console.error(`Error loading stats for ${currentViewSectorId}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = () => {
    // 1. Load Transactions
    const cachedTx = localStorage.getItem('admin_transactions');
    if (cachedTx) {
      try {
        setTransactions(JSON.parse(cachedTx));
      } catch {
        initializeDefaultTransactions();
      }
    } else {
      initializeDefaultTransactions();
    }

    // 2. Load Products
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

    // 3. Load Supplier Logs
    const cachedSupplierLogs = localStorage.getItem('admin_supplier_logs');
    if (cachedSupplierLogs) {
      try {
        setSupplierHistory(JSON.parse(cachedSupplierLogs));
      } catch {
        setSupplierHistory([]);
      }
    }

    // 4. Load Generated Boletos
    const cachedBoletos = localStorage.getItem('admin_generated_boletos');
    if (cachedBoletos) {
      try {
        setGeneratedBoletos(JSON.parse(cachedBoletos));
      } catch {
        setGeneratedBoletos([]);
      }
    } else {
      const defaultBoletos: GeneratedBoleto[] = [
        { id: '1', name: 'Carlos Alberto Teixeira', amount: 80.00, dueDate: '2026-06-05', barcode: '34191.75124 01241.912542 90124.615121 5 99420000008000', status: 'Pendente' },
        { id: '2', name: 'Maria Helena Souza', amount: 50.00, dueDate: '2026-06-10', barcode: '34191.75124 09841.912542 90124.615121 2 99420000005000', status: 'Pendente' },
        { id: '3', name: 'João Carlos de Oliveira', amount: 120.00, dueDate: '2026-05-20', barcode: '34191.75124 11241.912542 90124.615121 1 99380000012000', status: 'Compensado' }
      ];
      localStorage.setItem('admin_generated_boletos', JSON.stringify(defaultBoletos));
      setGeneratedBoletos(defaultBoletos);
    }

    // 5. Load Pix Settings
    const cachedPix = localStorage.getItem('admin_pix_config');
    if (cachedPix) {
      try {
        setPixConfig(JSON.parse(cachedPix));
      } catch {}
    }

    // 6. Load Campaigns
    const cachedCampaigns = localStorage.getItem('admin_donation_campaigns');
    if (cachedCampaigns) {
      try {
        setDonationCampaigns(JSON.parse(cachedCampaigns));
      } catch {}
    } else {
      const defaultCampaigns: DonationCampaign[] = [
        { id: 'obrassociais', title: 'Obras Sociais & Assistência Médica', description: 'Manutenção das cestas básicas, enxovais, sopão fraterno e consultas aos necessitados.', target: 'Manutenção Geral', mode: 'internal' },
        { id: 'reforma', title: 'Campanha de Manutenção Predial e Reforma', description: 'Contribua para as obras de melhoria e expansão da nossa sede física.', target: 'Cozinha Comunitária', mode: 'internal' }
      ];
      localStorage.setItem('admin_donation_campaigns', JSON.stringify(defaultCampaigns));
      setDonationCampaigns(defaultCampaigns);
    }

    // 7. Load Pending Donations from Public portal
    const cachedPending = localStorage.getItem('admin_pending_donations');
    if (cachedPending) {
      try {
        setOnlineDonations(JSON.parse(cachedPending));
      } catch {}
    }

    // 8. Load Advanced Sub-sector states
    // A. Material e Patrimônio
    const cachedPatItems = localStorage.getItem('admin_patrimonio_items');
    if (cachedPatItems) {
      try { setPatrimonioItems(JSON.parse(cachedPatItems)); } catch {}
    } else {
      const defaultPat = [
        { id: 'pat1', name: 'Projetor Epson PowerLite LCD (Salão Principal)', category: 'ELETRONICOS', quantity: 1, minQuantity: 1, unit: 'unidade(s)', location: 'Salão Principal', status: 'BOM', lastUpdated: Date.now(), updatedBy: 'Carlos Alberto' },
        { id: 'pat2', name: 'Notebook Dell Latitude Core i5 (Livraria)', category: 'ELETRONICOS', quantity: 1, minQuantity: 1, unit: 'unidade(s)', location: 'Livraria', status: 'BOM', lastUpdated: Date.now(), updatedBy: 'Carlos Alberto' },
        { id: 'pat3', name: 'Cadeiras de PVC Brancas Altas', category: 'MOBILIARIO', quantity: 120, minQuantity: 100, unit: 'unidade(s)', location: 'Auditório', status: 'BOM', lastUpdated: Date.now(), updatedBy: 'Roberto Silva' },
        { id: 'pat4', name: 'Detergente Neutro Limpol (Caixa de 24 un)', category: 'LIMPEZA', quantity: 2, minQuantity: 3, unit: 'caixa(s)', location: 'Almoxarifado', status: 'REGULAR', lastUpdated: Date.now(), updatedBy: 'Vera Lúcia' },
        { id: 'pat5', name: 'Apostilas ESDE Tomo Único (FEB)', category: 'LIVRARIA', quantity: 0, minQuantity: 5, unit: 'unidade(s)', location: 'Livraria', status: 'EM_FALTA', lastUpdated: Date.now(), updatedBy: 'Maria Helena' }
      ];
      localStorage.setItem('admin_patrimonio_items', JSON.stringify(defaultPat));
      setPatrimonioItems(defaultPat);
    }

    const cachedLoans = localStorage.getItem('admin_pat_loans');
    if (cachedLoans) {
      try { setPatLoans(JSON.parse(cachedLoans)); } catch {}
    } else {
      const defaultLoans = [
        { id: 'loan1', itemName: 'Projetor Epson PowerLite LCD', borrowerName: 'Paulo Roberto (Estudos)', loanDate: '2026-05-28', returnDate: '2026-05-28', status: 'Retirado' }
      ];
      localStorage.setItem('admin_pat_loans', JSON.stringify(defaultLoans));
      setPatLoans(defaultLoans);
    }

    // B. Tecnologia e Informática
    const cachedTickets = localStorage.getItem('admin_tech_tickets');
    if (cachedTickets) {
      try { setTechTickets(JSON.parse(cachedTickets)); } catch {}
    } else {
      const defaultTickets: TechTicket[] = [
        { id: 'tk1', number: 'TI-0012', senderName: 'Dra. Ana Paula', senderEmail: 'anapaula@mirante.org', title: 'Wi-Fi oscilando no Mezanino', description: 'A conexão cai intermitentemente durante o atendimento fraterno aos sábados de manhã.', priority: 'ALTA', status: 'ABERTO', createdAt: Date.now() - 259200000 },
        { id: 'tk2', number: 'TI-0013', senderName: 'Sr. Carlos Alberto', senderEmail: 'carlos@mirante.org', title: 'Impressora de Etiquetas Off-line', description: 'O computador da Livraria não se comunica com a impressora Brother térmica via USB.', priority: 'MEDIA', status: 'ATENDIMENTO', technicianName: 'Guilherme Santos', createdAt: Date.now() - 86400000 },
        { id: 'tk3', number: 'TI-0014', senderName: 'Evangelizador Júlio', senderEmail: 'julio@mirante.org', title: 'Sincronização do projetor secundário', description: 'O cabo HDMI do projetor da sala 3 de evangelização está com mau contato.', priority: 'BAIXA', status: 'CONCLUIDO', technicianName: 'Guilherme Santos', createdAt: Date.now() - 3600000, completedAt: Date.now() }
      ];
      localStorage.setItem('admin_tech_tickets', JSON.stringify(defaultTickets));
      setTechTickets(defaultTickets);
    }

    // C. Obras e Reformas
    const cachedObras = localStorage.getItem('admin_obra_projects');
    if (cachedObras) {
      try { setObraProjects(JSON.parse(cachedObras)); } catch {}
    } else {
      const defaultObras: ConstructionProject[] = [
        {
          id: 'ob1',
          name: 'Ampliação e Modernização da Cozinha Comunitária',
          location: 'Anexo B (Fundos)',
          status: 'EM_ANDAMENTO',
          budgetPlanned: 45000,
          budgetActual: 38200,
          startDate: '2026-04-10',
          estimatedEndDate: '2026-07-20',
          percentage: 75,
          coordinator: 'Eng. Pedro Rezende',
          stages: [
            { name: 'Rede elétrica trifásica reforçada', status: 'CONCLUIDO', duration: '10 dias', responsible: 'Instaladora Luz' },
            { name: 'Revestimento cerâmico e piso antiderrapante', status: 'EM_ANDAMENTO', duration: '12 dias', responsible: 'Mestre Assis' },
            { name: 'Instalação de exaustores e bancadas de inox', status: 'PLANEJADO', duration: '5 dias', responsible: 'Serralheria União' }
          ],
          notes: 'Preparação para aumento de 60% na produção de sopas semanais para o atendimento social.'
        }
      ];
      localStorage.setItem('admin_obra_projects', JSON.stringify(defaultObras));
      setObraProjects(defaultObras);
    }

    // D. Recepção e Limpeza
    const cachedVisitors = localStorage.getItem('admin_visitor_logs');
    if (cachedVisitors) {
      try { setVisitorLogs(JSON.parse(cachedVisitors)); } catch {}
    } else {
      const defaultVisitors: VisitorLog[] = [
        { id: 'v1', name: 'Fernanda de Souza Santos', phone: '(11) 98124-5511', purpose: 'Atendimento Fraterno Inicial', checkInTime: Date.now() - 10800000, checkOutTime: Date.now() - 7200000 },
        { id: 'v2', name: 'Wellington Silva Neves', phone: '(11) 99187-0099', purpose: 'Assistente social (Triagem)', checkInTime: Date.now() - 5400000 }
      ];
      localStorage.setItem('admin_visitor_logs', JSON.stringify(defaultVisitors));
      setVisitorLogs(defaultVisitors);
    }

    const cachedChecklists = localStorage.getItem('admin_cleaning_checklists');
    if (cachedChecklists) {
      try { setCleaningChecklists(JSON.parse(cachedChecklists)); } catch {}
    } else {
      const defaultChecklists: CleaningChecklist[] = [
        { id: 'cl1', roomName: 'Banheiros Masculinos (Térreo)', status: 'LIMPO', responsibleName: 'Marta (Voluntária)', lastCleanedAt: Date.now() - 7200000 },
        { id: 'cl2', roomName: 'Salas de Passe e Fluidoterapia', status: 'ATENCAO', responsibleName: 'Claudio (Voluntário)', lastCleanedAt: Date.now() - 14400000, observations: 'Reabastecer galão de álcool em gel na entrada' },
        { id: 'cl3', roomName: 'Salão de Palestras Doutrinárias', status: 'PENDENTE', responsibleName: 'Vera Lúcia (Voluntária)', lastCleanedAt: Date.now() - 43200000 }
      ];
      localStorage.setItem('admin_cleaning_checklists', JSON.stringify(defaultChecklists));
      setCleaningChecklists(defaultChecklists);
    }

    // 9. Load Cash sessions and history
    const cachedSession = localStorage.getItem('admin_cash_session');
    if (cachedSession) {
      try { setTreasuryCashSession(JSON.parse(cachedSession)); } catch {}
    } else {
      setTreasuryCashSession(null);
    }

    const cachedHist = localStorage.getItem('admin_closed_cash_sessions');
    if (cachedHist) {
      try { setClosedSessionsHistory(JSON.parse(cachedHist)); } catch {}
    } else {
      setClosedSessionsHistory([]);
    }
  };

  // --- SUBSECTOR ACTION CONTROLLERS ---
  const handleAddPatrimonio = (item: any) => {
    const updated = [...patrimonioItems, { id: 'pat_' + Date.now(), ...item, lastUpdated: Date.now(), updatedBy: currentUser?.name || 'Administrador' }];
    setPatrimonioItems(updated);
    localStorage.setItem('admin_patrimonio_items', JSON.stringify(updated));
  };
  
  const handleUpdatePatQuantity = (id: string, diff: number) => {
    const updated = patrimonioItems.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(0, item.quantity + diff);
        const nextStatus = nextQty === 0 ? 'EM_FALTA' : (nextQty <= item.minQuantity ? 'REGULAR' : 'BOM');
        return { ...item, quantity: nextQty, status: nextStatus, lastUpdated: Date.now() };
      }
      return item;
    });
    setPatrimonioItems(updated);
    localStorage.setItem('admin_patrimonio_items', JSON.stringify(updated));
  };

  const handleDeletePatrimonio = (id: string) => {
    const updated = patrimonioItems.filter(item => item.id !== id);
    setPatrimonioItems(updated);
    localStorage.setItem('admin_patrimonio_items', JSON.stringify(updated));
  };

  const handleShowItemQRCode = (item: any) => {
    setQrModalItem(item);
    setQrModalOpen(true);
  };

  const handlePrintAllQRCodes = () => {
    if (patrimonioItems.length === 0) {
      alert("Nenhum item patrimonial registrado para gerar etiquetas.");
      return;
    }

    const printwin = window.open("", "_blank");
    if (printwin) {
      const itemsHtml = patrimonioItems.map(item => {
        const appLink = `${window.location.origin}${window.location.pathname}?assetId=${encodeURIComponent(item.id)}`;
        return `
          <div class="sticker">
            <h2>${item.name}</h2>
            <div class="id">ID: ${item.id}</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appLink)}" style="max-width: 120px; margin: 4px auto; display: block;" />
            <div class="meta">
              <span>Local: ${item.location || 'N/A'}</span>
              <span>Cat: ${item.category || 'N/A'}</span>
            </div>
          </div>
        `;
      }).join('');

      printwin.document.write(`
        <html>
        <head>
          <title>Imprimir Todas as Etiquetas de Ativos</title>
          <style>
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              padding: 20px; 
              margin: 0; 
              background-color: #fff;
            }
            .header-banner {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header-banner h1 {
              margin: 0;
              font-size: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header-banner p {
              margin: 5px 0 0 0;
              font-size: 11px;
              color: #666;
            }
            .grid-container { 
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .sticker { 
              border: 1px dashed #999; 
              padding: 12px; 
              text-align: center;
              background-color: #fff;
              page-break-inside: avoid;
              border-radius: 8px;
            }
            h2 { 
              margin: 0 0 4px 0; 
              font-size: 11px; 
              font-weight: 800; 
              text-transform: uppercase;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .id { 
              font-size: 8px; 
              font-family: monospace;
              letter-spacing: 0.5px; 
              margin-bottom: 6px; 
              color: #555;
            }
            .meta { 
              font-size: 8px; 
              border-top: 1px dashed #ccc; 
              padding-top: 5px; 
              margin-top: 5px; 
              display: flex; 
              justify-content: space-between; 
              text-transform: uppercase;
              color: #444;
              font-weight: bold;
            }
            @media print {
              .header-banner { display: none; }
              body { padding: 0; }
              .grid-container { gap: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>Folha de Etiquetas Patrimoniais</h1>
            <p>Grade gerada automaticamente com ${patrimonioItems.length} ativos — Pronto para impressão (Papel Adesivo A4 ou Carta)</p>
          </div>
          <div class="grid-container">
            ${itemsHtml}
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
              }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printwin.document.close();
    } else {
      alert("Por favor, ative a permissão de pop-up no navegador para abrir a folha de impressão!");
    }
  };

  const handleStartScanner = () => {
    setScannerModalOpen(true);
    setScannedItemDetail(null);
  };

  const handleProcessScannedId = (id: string) => {
    let cleanId = (id || '').trim();
    // Smart URL parsing in case scanned text is a full deep-link QR Code (e.g. https://.../?assetId=pat1)
    try {
      if (cleanId.includes('?') || cleanId.includes('assetId=') || cleanId.includes('scan=')) {
        const urlPart = cleanId.includes('?') ? cleanId.split('?')[1] : cleanId;
        const urlParams = new URLSearchParams(urlPart);
        const idFromUrl = urlParams.get('assetId') || urlParams.get('patId') || urlParams.get('scan');
        if (idFromUrl) {
          cleanId = idFromUrl;
        }
      }
    } catch (e) {
      // Treat as plain ID if any parsing errors occur
    }

    const item = patrimonioItems.find(i => String(i.id).toLowerCase() === cleanId.toLowerCase());
    if (item) {
      setScannedItemDetail(item);
      setTempConservationStatus(item.status || 'BOM');
      setTempObservation(item.observation || '');
    } else {
      alert("QR Code ou ID de ativo patrimonial não cadastrado: " + cleanId);
    }
  };

  const handleUpdateScannedItemQty = (diff: number) => {
    if (!scannedItemDetail) return;
    const nextQty = Math.max(0, scannedItemDetail.quantity + diff);
    setScannedItemDetail({
      ...scannedItemDetail,
      quantity: nextQty
    });
    const updated = patrimonioItems.map(item => {
      if (item.id === scannedItemDetail.id) {
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    setPatrimonioItems(updated);
    localStorage.setItem('admin_patrimonio_items', JSON.stringify(updated));
  };

  const handleSaveConservationStatus = () => {
    if (!scannedItemDetail) return;
    const updated = patrimonioItems.map(item => {
      if (item.id === scannedItemDetail.id) {
        return {
          ...item,
          status: tempConservationStatus,
          observation: tempObservation,
          lastUpdated: Date.now(),
          updatedBy: currentUser?.name || 'Administrador'
        };
      }
      return item;
    });
    setPatrimonioItems(updated);
    localStorage.setItem('admin_patrimonio_items', JSON.stringify(updated));
    alert("Ficha de Estado de Conservação gravada com sucesso!");
    setScannerModalOpen(false);
    setScannedItemDetail(null);
  };

  const handleAddLoan = (loan: any) => {
    const updated = [...patLoans, { id: 'loan_' + Date.now(), ...loan, status: 'Retirado' }];
    setPatLoans(updated);
    localStorage.setItem('admin_pat_loans', JSON.stringify(updated));
  };

  const handleReturnLoan = (id: string) => {
    const updated = patLoans.filter(l => l.id !== id);
    setPatLoans(updated);
    localStorage.setItem('admin_pat_loans', JSON.stringify(updated));
  };

  const handleCreateTicket = () => {
    if (!newTicketTitle.trim() || !newTicketDesc.trim()) return;
    const ticketNo = 'TI-00' + (techTickets.length + 12);
    const newTk: TechTicket = {
      id: 'tk_' + Date.now(),
      number: ticketNo,
      senderName: currentUser?.name || 'Voluntário da Casa',
      senderEmail: currentUser?.email || 'contato@mirante.org',
      title: newTicketTitle,
      description: newTicketDesc,
      priority: newTicketPriority,
      status: 'ABERTO',
      createdAt: Date.now()
    };
    const updated = [newTk, ...techTickets];
    setTechTickets(updated);
    localStorage.setItem('admin_tech_tickets', JSON.stringify(updated));
    setNewTicketTitle('');
    setNewTicketDesc('');
  };

  const handleStartTicketAtendimento = (id: string) => {
    const updated = techTickets.map(tk => {
      if (tk.id === id) {
        return { ...tk, status: 'ATENDIMENTO' as TicketStatus, technicianName: currentUser?.name || 'Administrador' };
      }
      return tk;
    });
    setTechTickets(updated);
    localStorage.setItem('admin_tech_tickets', JSON.stringify(updated));
  };

  const handleCloseTicket = (id: string) => {
    const updated = techTickets.map(tk => {
      if (tk.id === id) {
        return { ...tk, status: 'CONCLUIDO' as TicketStatus, completedAt: Date.now(), technicianName: tk.technicianName || currentUser?.name || 'Administrador' };
      }
      return tk;
    });
    setTechTickets(updated);
    localStorage.setItem('admin_tech_tickets', JSON.stringify(updated));
  };

  const handleDeleteTicket = (id: string) => {
    const updated = techTickets.filter(tk => tk.id !== id);
    setTechTickets(updated);
    localStorage.setItem('admin_tech_tickets', JSON.stringify(updated));
  };

  const handleCreateObra = () => {
    if (!newObraName.trim()) return;
    const newOb: ConstructionProject = {
      id: 'ob_' + Date.now(),
      name: newObraName,
      location: newObraLocation || 'Sede Geral',
      status: 'EM_ANDAMENTO',
      budgetPlanned: Number(newObraBudget) || 12000,
      budgetActual: 0,
      startDate: new Date().toISOString().split('T')[0],
      estimatedEndDate: '2026-09-30',
      percentage: 15,
      coordinator: currentUser?.name || 'Pedro Rezende',
      stages: [
        { name: 'Cotação de materiais e autorização interna', status: 'CONCLUIDO', duration: '4 dias', responsible: 'Coordenação Administrativa' },
        { name: 'Contratação e início dos serviços de campo', status: 'EM_ANDAMENTO', duration: '14 dias', responsible: 'Mestre da Obra' },
        { name: 'Auditoria de entrega e conformidade civil', status: 'PLANEJADO', duration: '3 dias', responsible: 'Engenheiro Responsável' }
      ]
    };
    const updated = [...obraProjects, newOb];
    setObraProjects(updated);
    localStorage.setItem('admin_obra_projects', JSON.stringify(updated));
    setNewObraName('');
    setNewObraLocation('');
    setNewObraBudget('');
  };

  const handleToggleStageStatus = (projId: string, stageIndex: number) => {
    const updated: ConstructionProject[] = obraProjects.map(ob => {
      if (ob.id === projId) {
        const nextStages = ob.stages.map((st, sidx) => {
          if (sidx === stageIndex) {
            const nextStatus: 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' = st.status === 'PLANEJADO' ? 'EM_ANDAMENTO' : st.status === 'EM_ANDAMENTO' ? 'CONCLUIDO' : 'PLANEJADO';
            return { ...st, status: nextStatus };
          }
          return st;
        });
        
        // Auto-calculate percentage based on completed stages
        const doneStages = nextStages.filter(s => s.status === 'CONCLUIDO').length;
        const calcPercent = Math.round((doneStages / nextStages.length) * 100);

        return { ...ob, stages: nextStages, percentage: calcPercent };
      }
      return ob;
    });
    setObraProjects(updated);
    localStorage.setItem('admin_obra_projects', JSON.stringify(updated));
  };
  
  const handleUpdateObraBudget = (id: string, addedSpend: number) => {
    const updated = obraProjects.map(ob => {
      if (ob.id === id) {
        return { ...ob, budgetActual: ob.budgetActual + addedSpend };
      }
      return ob;
    });
    setObraProjects(updated);
    localStorage.setItem('admin_obra_projects', JSON.stringify(updated));
  };

  const handleRegisterVisitor = () => {
    if (!newVisitorName.trim()) return;
    const newV: VisitorLog = {
      id: 'v_' + Date.now(),
      name: newVisitorName,
      phone: newVisitorPhone || '(11) 90000-0000',
      purpose: newVisitorPurpose || 'Atendimento Fraterno',
      checkInTime: Date.now()
    };
    const updated = [newV, ...visitorLogs];
    setVisitorLogs(updated);
    localStorage.setItem('admin_visitor_logs', JSON.stringify(updated));
    setNewVisitorName('');
    setNewVisitorPhone('');
    setNewVisitorPurpose('');
  };

  const handleCheckOutVisitor = (id: string) => {
    const updated = visitorLogs.map(v => {
      if (v.id === id) {
        return { ...v, checkOutTime: Date.now() };
      }
      return v;
    });
    setVisitorLogs(updated);
    localStorage.setItem('admin_visitor_logs', JSON.stringify(updated));
  };

  const handleUpdateChecklistStatus = (id: string, newStatus: 'LIMPO' | 'ATENCAO' | 'PENDENTE', obs?: string) => {
    const updated = cleaningChecklists.map(cl => {
      if (cl.id === id) {
        return {
          ...cl,
          status: newStatus,
          responsibleName: currentUser?.name || 'Voluntário da Casa',
          lastCleanedAt: Date.now(),
          observations: obs !== undefined ? obs : cl.observations
        };
      }
      return cl;
    });
    setCleaningChecklists(updated);
    localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));
  };

  const handleAddChecklistActivity = () => {
    if (!newChecklistRoomName.trim()) {
      alert("Por favor, informe o nome do ambiente ou a tarefa de conservação.");
      return;
    }
    const newItem: CleaningChecklist = {
      id: "cl_" + Date.now().toString(36),
      roomName: newChecklistRoomName.trim(),
      status: newChecklistStatus,
      responsibleName: newChecklistResponsibleName.trim() || currentUser?.name || 'Voluntário da Casa',
      lastCleanedAt: Date.now(),
      observations: newChecklistObservations.trim()
    };

    const updated = [newItem, ...cleaningChecklists];
    setCleaningChecklists(updated);
    localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));

    // Cleanup state
    setNewChecklistRoomName('');
    setNewChecklistStatus('LIMPO');
    setNewChecklistResponsibleName('');
    setNewChecklistObservations('');
  };

  const handleDeleteChecklistActivity = (id: string) => {
    if (confirm("Tem certeza que deseja remover este ambiente/atividade do checklist?")) {
      const updated = cleaningChecklists.filter(cl => cl.id !== id);
      setCleaningChecklists(updated);
      localStorage.setItem('admin_cleaning_checklists', JSON.stringify(updated));
    }
  };

  const initializeDefaultTransactions = () => {
    const defaults: FinancialTransaction[] = [
      { id: '1', date: '2026-05-20', type: 'ENTRADA', category: 'Doação', description: 'Coleta de donativos de voluntários', amount: 1200.00, amountEstimated: 1000.00, amountRealized: 1200.00, status: 'Recebido' },
      { id: '2', date: '2026-05-19', type: 'ENTRADA', category: 'Contribuição', description: 'Contribuições sócios fundadores', amount: 850.00, amountEstimated: 850.00, amountRealized: 850.00, status: 'Recebido' },
      { id: '3', date: '2026-05-18', type: 'ENTRADA', category: 'Contribuição', description: 'Mensalidades sócios ativos', amount: 450.00, amountEstimated: 500.00, amountRealized: 450.00, status: 'Recebido' },
      { id: '4', date: '2026-05-17', type: 'ENTRADA', category: 'Doação', description: 'Coletas caixinhas do salão de passes', amount: 230.00, amountEstimated: 200.00, amountRealized: 230.00, status: 'Recebido' },
      { id: '5', date: '2026-05-16', type: 'SAÍDA', category: 'Pago', accountType: 'Luz', paymentMethod: 'Boleto', description: 'Conta de Energia Elétrica Enel', amount: 380.00, amountEstimated: 400.00, amountRealized: 380.00, status: 'Pago' },
      { id: '6', date: '2026-05-15', type: 'SAÍDA', category: 'Pago', accountType: 'Outros', paymentMethod: 'Pix', description: 'Reparo hidráulico banheiros masculinos', amount: 750.00, amountEstimated: 750.00, amountRealized: 750.00, status: 'Pago' },
      { id: '7', date: '2026-05-15', type: 'SAÍDA', category: 'Pago', accountType: 'Diversos', paymentMethod: 'Dinheiro', description: 'Aquisição alimentos de apoio sopão fraterno', amount: 1100.00, amountEstimated: 1200.00, amountRealized: 1100.00, status: 'Pago' },
      { id: '8', date: '2026-05-10', type: 'ENTRADA', category: 'Recebimento', description: 'Balanço parcial bazar beneficente das mães', amount: 480.00, amountEstimated: 500.00, amountRealized: 480.00, status: 'Recebido' },
      { id: '9', date: '2026-05-21', type: 'ENTRADA', category: 'Contribuição', description: 'Repasse pendente mensalidade sócios benfeitores', amount: 0.00, amountEstimated: 350.00, amountRealized: 0.00, status: 'Pendente' },
      { id: '10', date: '2026-05-22', type: 'SAÍDA', category: 'Devedor', accountType: 'Outros', paymentMethod: 'Pix', description: 'Pendente: Troca de lâmpadas do salão principal', amount: 0.00, amountEstimated: 120.00, amountRealized: 0.00, status: 'Pendente' },
      { id: '11', date: '2026-05-22', type: 'SAÍDA', category: 'Pago', accountType: 'Água', paymentMethod: 'Boleto', description: 'Conta de água SABESP', amount: 180.00, amountEstimated: 180.00, amountRealized: 180.00, status: 'Pago' },
      { id: '12', date: '2026-05-22', type: 'SAÍDA', category: 'Pago', accountType: 'Internet', paymentMethod: 'Pix', description: 'Mensalidade internet banda larga', amount: 119.90, amountEstimated: 120.00, amountRealized: 119.90, status: 'Pago' }
    ];
    localStorage.setItem('admin_transactions', JSON.stringify(defaults));
    setTransactions(defaults);
  };

  const initializeDefaultProducts = () => {
    const defaults: MarketProduct[] = [
      { id: 'p1', name: 'Livro: O Livro dos Espíritos (Edição Histórica FEB)', category: 'LIVRARIA', price: 45.00, stock: 12, minLimit: 5 },
      { id: 'p2', name: 'Livro: O Evangelho Segundo o Espiritismo', category: 'LIVRARIA', price: 45.00, stock: 3, minLimit: 5 }, // Low stock !
      { id: 'p3', name: 'Livro: O Livro dos Médiuns', category: 'LIVRARIA', price: 45.00, stock: 6, minLimit: 5 },
      { id: 'p4', name: 'Pão de Queijo Assado (Fornada do Dia)', category: 'CANTINA', price: 5.50, stock: 25, minLimit: 8, expirationDate: '2026-05-22' },
      { id: 'p5', name: 'Suco Natural Polpa 300ml (Uva/Laranja)', category: 'CANTINA', price: 6.00, stock: 15, minLimit: 5, expirationDate: '2026-06-10' },
      { id: 'p6', name: 'Bolo Caseiro de Cenoura (Fatia)', category: 'CANTINA', price: 4.50, stock: 4, minLimit: 5, expirationDate: '2026-05-18' }, // Expired !
      { id: 'p7', name: 'Camiseta Infantil Estampa Mirante', category: 'BAZAR', price: 35.00, stock: 8, minLimit: 3 },
      { id: 'p8', name: 'Artesanato em Gesso Decorado', category: 'BAZAR', price: 25.00, stock: 2, minLimit: 3 } // Low stock !
    ];
    localStorage.setItem('admin_products', JSON.stringify(defaults));
    setProducts(defaults);
  };

  // --- TRANS ACTION CONTROLLER FUNCTIONS ---
  const saveTransactionsToStorage = (list: FinancialTransaction[]) => {
    localStorage.setItem('admin_transactions', JSON.stringify(list));
    setTransactions(list);
  };

  const handleToggleTransactionStatus = (id: string, nextStatus: string) => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        const estVal = t.amountEstimated !== undefined ? t.amountEstimated : t.amount;
        let realVal = t.amountRealized !== undefined ? t.amountRealized : t.amount;
        
        if (nextStatus !== 'Pendente' && nextStatus !== 'Devedor' && (realVal === 0 || !realVal)) {
          realVal = estVal;
        } else if (nextStatus === 'Pendente' || nextStatus === 'Devedor') {
          realVal = 0;
        }

        return {
          ...t,
          status: nextStatus,
          amountEstimated: estVal,
          amountRealized: realVal,
          amount: (nextStatus === 'Pendente' || nextStatus === 'Devedor') ? 0 : realVal
        };
      }
      return t;
    });
    saveTransactionsToStorage(updated);
  };

  const handleStartEditTransaction = (t: FinancialTransaction) => {
    setEditingTxId(t.id);
    setNewTxType(t.type);
    setNewTxDate(t.date);
    setNewTxCategory(t.category);
    setNewTxDesc(t.description);
    setNewTxCustomStatus(t.status || (t.type === 'ENTRADA' ? 'Recebido' : 'Pago'));
    setNewTxAccountType(t.accountType || 'Luz');
    setNewTxPaymentMethod(t.paymentMethod || 'Pix');
    setNewTxReceiptBase64(t.receiptBase64 || '');
    setNewTxReceiptName(t.receiptName || '');
    
    const estVal = t.amountEstimated !== undefined ? t.amountEstimated : t.amount;
    const realVal = t.amountRealized !== undefined ? t.amountRealized : t.amount;
    setNewTxAmount(String(realVal));
    setNewTxAmountEst(String(estVal));
    setNewTxAmountReal(String(realVal));

    const formEl = document.getElementById('transaction-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditTransaction = () => {
    setEditingTxId(null);
    setNewTxDesc('');
    setNewTxAmount('');
    setNewTxAmountEst('');
    setNewTxAmountReal('');
    setNewTxReceiptBase64('');
    setNewTxReceiptName('');
    setNewTxCustomStatus(newTxType === 'ENTRADA' ? 'Recebido' : 'Pago');
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxDesc) {
      alert('Por favor, preencha a descrição.');
      return;
    }
    
    // Leverage either the new estimated/realized fields or fallback to standard amount field
    const valEst = parseFloat(newTxAmountEst || newTxAmount || '0');
    const valReal = parseFloat(newTxAmountReal || ((newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') ? '0' : (newTxAmount || '0')));
    
    if (isNaN(valEst) || valEst < 0 || isNaN(valReal) || valReal < 0) {
      alert('Os valores das transações devem ser numéricos e não-negativos.');
      return;
    }

    if (valEst === 0 && valReal === 0) {
      alert('Por favor, defina um valor estimado ou realizado maior que zero.');
      return;
    }

    if (editingTxId) {
      const updated = transactions.map(t => {
        if (t.id === editingTxId) {
          return {
            ...t,
            date: newTxDate,
            type: newTxType,
            category: newTxCategory,
            description: newTxDesc.trim(),
            amount: (newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') ? 0 : valReal,
            amountEstimated: valEst,
            amountRealized: valReal,
            status: newTxCustomStatus,
            accountType: newTxType === 'SAÍDA' ? newTxAccountType : undefined,
            paymentMethod: newTxType === 'SAÍDA' ? newTxPaymentMethod : undefined,
            receiptBase64: newTxReceiptBase64 || t.receiptBase64,
            receiptName: newTxReceiptName || t.receiptName
          };
        }
        return t;
      });
      saveTransactionsToStorage(updated);
      setEditingTxId(null);
      dataService.createLog('Atualização Livro Caixa', `Lançamento ID [${editingTxId}] de [${newTxType}] na categoria [${newTxCategory}] atualizado com sucesso. V. Realizado: R$ ${valReal.toFixed(2)}, Descrição: ${newTxDesc.trim()}`);
      alert('Lançamento atualizado no Fluxo de Caixa com sucesso!');
    } else {
      const tx: FinancialTransaction = {
        id: `TX:${Date.now()}`,
        date: newTxDate,
        type: newTxType,
        category: newTxCategory,
        description: newTxDesc.trim(),
        amount: (newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') ? 0 : valReal,
        amountEstimated: valEst,
        amountRealized: valReal,
        status: newTxCustomStatus,
        accountType: newTxType === 'SAÍDA' ? newTxAccountType : undefined,
        paymentMethod: newTxType === 'SAÍDA' ? newTxPaymentMethod : undefined,
        receiptBase64: newTxReceiptBase64 || undefined,
        receiptName: newTxReceiptName || undefined
      };

      const updated = [tx, ...transactions];
      saveTransactionsToStorage(updated);
      dataService.createLog('Inclusão Livro Caixa', `Novo lançamento de [${newTxType}] na categoria [${newTxCategory}] realizado com sucesso. V. Realizado: R$ ${valReal.toFixed(2)}, Descrição: ${newTxDesc.trim()}`);
      alert('Transação lançada no Fluxo de Caixa com sucesso!');
    }

    // Reset fields
    setNewTxDesc('');
    setNewTxAmount('');
    setNewTxAmountEst('');
    setNewTxAmountReal('');
    setNewTxReceiptBase64('');
    setNewTxReceiptName('');
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    setTxToDelete(tx);
  };

  const confirmDeleteTransaction = () => {
    if (!txToDelete) return;
    
    const id = txToDelete.id;
    if (editingTxId === id) {
      setEditingTxId(null);
    }
    const filtered = transactions.filter(t => t.id !== id);
    saveTransactionsToStorage(filtered);
    
    const valNumeric = parseFloat(String(txToDelete.amountRealized ?? txToDelete.amount ?? 0));
    dataService.createLog(
      'Exclusão Livro Caixa', 
      `Lançamento ID [${txToDelete.id}] de [${txToDelete.type}] no valor de R$ ${isNaN(valNumeric) ? '0.00' : valNumeric.toFixed(2)} ("${txToDelete.description}") excluído do caixa.`
    );

    setTxToDelete(null);
    alert('Lançamento removido do Fluxo de Caixa com sucesso!');
  };

  // Generate simulated gateways
  // CRC16 CCITT for Pix
  const crc16ccitt = (str: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      let x = ((crc >> 8) ^ charCode) & 0xFF;
      x ^= x >> 4;
      crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  // Generate genuine EMV static Pix BR Code
  const generateRealPixPayload = (key: string, name: string, city: string, value: number, txId: string) => {
    const cleanKey = key.trim();
    const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 25);
    const cleanCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 15);
    const cleanTxId = txId.substring(0, 25);

    const f = (id: string, val: string) => {
      return id + String(val.length).padStart(2, '0') + val;
    };

    const gui = '0014BR.GOV.BCB.PIX';
    const keyField = f('01', cleanKey);
    const merchantAccountInfo = f('26', gui + keyField);

    let payload = '';
    payload += f('00', '01'); // Format Indicator
    payload += merchantAccountInfo;
    payload += f('52', '040000'); // Category Code
    payload += f('53', '986'); // BRL Currency
    
    if (value > 0) {
      payload += f('54', value.toFixed(2)); // Value
    }
    
    payload += f('58', 'BR'); // Country Code
    payload += f('59', cleanName); // Merchant Name
    payload += f('60', cleanCity); // Merchant City
    
    const referenceField = f('05', cleanTxId);
    payload += f('62', referenceField); // Additional Data

    payload += '6304'; // CRC
    const crc = crc16ccitt(payload);
    return payload + crc;
  };

  const handleGeneratePixSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixName || !pixAmount) {
      alert('Preencha os dados do doador para gerar.');
      return;
    }
    const val = parseFloat(pixAmount);
    if (!val || val <= 0) {
      alert('Insira um valor válido maior que zero.');
      return;
    }
    const txId = `PIX${Date.now().toString().slice(-6)}`;
    const payload = generateRealPixPayload(pixConfig.key, pixConfig.name, pixConfig.city, val, txId);
    setGeneratedPixKey(payload);
    setPixActive(true);
  };

  const handleGenerateBoletoSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boletoName || !boletoAmount) {
      alert('Preencha os dados do sócio para gerar.');
      return;
    }
    const val = parseFloat(boletoAmount);
    if (!val || val <= 0) {
      alert('Insira um valor de mensalidade válido.');
      return;
    }

    const bcode = `34191.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 90000000000000 + 10000000000000)}`;
    
    const newBoleto: GeneratedBoleto = {
      id: `BOL:${Date.now()}`,
      name: boletoName.trim(),
      amount: val,
      dueDate: boletoDue,
      barcode: bcode,
      status: 'Pendente'
    };

    const updated = [newBoleto, ...generatedBoletos];
    setGeneratedBoletos(updated);
    localStorage.setItem('admin_generated_boletos', JSON.stringify(updated));

    setGeneratedBoletoBarcode(bcode);
    setBoletoActive(true);
    alert('Boleto gerado com sucesso e adicionado ao controle de cobrança de sócios!');
  };

  const handleDeleteBoleto = (id: string) => {
    if (!window.confirm('Deseja realmente apagar este boleto gerado?')) return;
    const filtered = generatedBoletos.filter(b => b.id !== id);
    setGeneratedBoletos(filtered);
    localStorage.setItem('admin_generated_boletos', JSON.stringify(filtered));
    alert('Boleto removido!');
  };

  const handleEfetivarBoleto = (b: GeneratedBoleto) => {
    if (!window.confirm(`Deseja liquidar/compensar o boleto de R$ ${b.amount.toFixed(2)} do sócio ${b.name} e lançar como entrada realizada no Fluxo de Caixa?`)) return;

    const newTx: FinancialTransaction = {
      id: `TX:${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      category: 'Contribuição',
      description: `Boleto compensado - Mensalidade de ${b.name}`,
      amount: b.amount,
      amountEstimated: b.amount,
      amountRealized: b.amount,
      status: 'Recebido',
      paymentMethod: 'Boleto'
    };

    const updatedTx = [newTx, ...transactions];
    saveTransactionsToStorage(updatedTx);

    const updatedBoletos = generatedBoletos.map(item => {
      if (item.id === b.id) {
        return { ...item, status: 'Compensado' as const };
      }
      return item;
    });
    setGeneratedBoletos(updatedBoletos);
    localStorage.setItem('admin_generated_boletos', JSON.stringify(updatedBoletos));

    alert('Boleto compensado com sucesso! Receita registrada na planilha do Fluxo de Caixa.');
  };

  // Automatic accountability balancing PDF generator (Transparência legal)
  const generateAccountabilityReport = (type: 'DRE' | 'BALANÇO') => {
    const doc = new jsPDF();
    const isDRE = type === 'DRE';

    // Corporate Heading
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Charcoal
    doc.text('ASSOCIACAO ESPIRITA MIRANTE DE LUZ', 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate
    doc.text('CNPJ: 14.238.112/0001-90 | Utilidade Pública Organizada', 14, 25);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 34, 196, 34);

    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(isDRE ? 'DEMONSTRATIVO DE RESULTADOS DO EXERCÍCIO (DRE SIMULADO)' : 'BALANÇO PATRIMONIAL CONSOLIDADO (SIMULADO)', 14, 43);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Relatório emitido para transparência perante a Assembleia Geral e o Conselho Fiscal.', 14, 49);

    if (isDRE) {
      // DRE logic using realized values
      const totalIn = transactions
        .filter(t => t.type === 'ENTRADA' && (t.status?.toUpperCase() === 'RECEBIDO' || !t.status))
        .reduce((a, b) => a + (b.amountRealized !== undefined ? b.amountRealized : b.amount), 0);
      
      const totalOut = transactions
        .filter(t => t.type === 'SAÍDA' && (t.status?.toUpperCase() === 'PAGO' || !t.status))
        .reduce((a, b) => a + (b.amountRealized !== undefined ? b.amountRealized : b.amount), 0);
      
      const groupIn: Record<string, number> = {};
      const groupOut: Record<string, number> = {};

      transactions.forEach(t => {
        if (t.status?.toUpperCase() === 'PENDENTE' || t.status?.toUpperCase() === 'CANCELADO' || t.status?.toUpperCase() === 'DEVOLVIDO' || t.status?.toUpperCase() === 'AGENDADO' || t.status?.toUpperCase() === 'DEVEDOR') return; // Skip non-finalized entries
        const val = t.amountRealized !== undefined ? t.amountRealized : t.amount;
        if (t.type === 'ENTRADA') {
          groupIn[t.category] = (groupIn[t.category] || 0) + val;
        } else {
          groupOut[t.category] = (groupOut[t.category] || 0) + val;
        }
      });

      const body: any[] = [
        ['RECEITAS OPERACIONAIS (ENTRADAS)', '', ''],
        ...Object.entries(groupIn).map(([cat, total]) => [`   (+) ${cat}`, `R$ ${total.toFixed(2)}`, '']),
        ['TOTAL DE RECEITAS BRUTAS (A)', '', `R$ ${totalIn.toFixed(2)}`],
        ['', '', ''],
        ['DESPESAS OPERACIONAIS (SAÍDAS)', '', ''],
        ...Object.entries(groupOut).map(([cat, total]) => [`   (-) ${cat}`, '', `R$ ${total.toFixed(2)}`]),
        ['TOTAL DE DESPESAS OPERACIONAIS (B)', '', `R$ ${totalOut.toFixed(2)}`],
        ['', '', ''],
        ['SUPERÁVIT / DEFICIT LÍQUIDO DO PERÍODO (A - B)', '', `R$ ${(totalIn - totalOut).toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: 56,
        head: [['Especificação das Contas', 'Parcial', 'Consolidado']],
        body: body,
        theme: 'striped',
        styles: { font: 'Helvetica', fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        didParseCell: (data) => {
          if (data.row.raw[0] && (data.row.raw[0].toString().includes('TOTAL') || data.row.raw[0].toString().includes('RECEITAS OPERACIONAIS') || data.row.raw[0].toString().includes('DESPESAS OPERACIONAIS') || data.row.raw[0].toString().includes('SUPERÁVIT'))) {
            data.cell.styles.fontStyle = 'bold';
            if (data.row.raw[0].toString().includes('SUPERÁVIT')) {
              data.cell.styles.textColor = (totalIn - totalOut >= 0) ? [16, 185, 129] : [239, 68, 68];
              data.cell.styles.fontSize = 10;
            }
          }
        }
      });
    } else {
      // Balanço logic utilizing realized amounts
      const cashIn = transactions
        .filter(t => t.type === 'ENTRADA' && (t.status?.toUpperCase() === 'RECEBIDO' || !t.status))
        .reduce((a, b) => a + (b.amountRealized !== undefined ? b.amountRealized : b.amount), 0);
      
      const cashOut = transactions
        .filter(t => t.type === 'SAÍDA' && (t.status?.toUpperCase() === 'PAGO' || !t.status))
        .reduce((a, b) => a + (b.amountRealized !== undefined ? b.amountRealized : b.amount), 0);
      const cashBalance = cashIn - cashOut;

      const bookStockTotalValue = products.filter(p => p.category === 'LIVRARIA').reduce((acc, p) => acc + (p.price * p.stock), 0);
      const barStockTotalValue = products.filter(p => p.category === 'BAZAR').reduce((acc, p) => acc + (p.price * p.stock), 0);
      const canteenStockTotalValue = products.filter(p => p.category === 'CANTINA').reduce((acc, p) => acc + (p.price * p.stock), 0);

      const totalActive = cashBalance + bookStockTotalValue + barStockTotalValue + canteenStockTotalValue;

      const body: any[] = [
        ['ATIVO (DIREITOS E BENS)', '', ''],
        ['   Disponibilidades (Saldo de Caixa)', `R$ ${cashBalance.toFixed(2)}`, ''],
        ['   Estoque Livraria Doutrinária', `R$ ${bookStockTotalValue.toFixed(2)}`, ''],
        ['   Estoque Cantina Fraterna', `R$ ${canteenStockTotalValue.toFixed(2)}`, ''],
        ['   Estoque Bazar Beneficente', `R$ ${barStockTotalValue.toFixed(2)}`, ''],
        ['TOTAL DO ATIVO CONSOLIDADO', '', `R$ ${totalActive.toFixed(2)}`],
        ['', '', ''],
        ['PASSIVO (DEVERES E PATRIMÔNIO LÍQUIDO)', '', ''],
        ['   Fornecedores a Pagar', `R$ 0,00`, ''],
        ['   Patrimônio Social Líquido', `R$ ${totalActive.toFixed(2)}`, ''],
        ['TOTAL DO PASSIVO + PATRIMÔNIO', '', `R$ ${totalActive.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: 56,
        head: [['Contas Ativas & Passivas', 'Saldo Parcial', 'Saldo de Grupo']],
        body: body,
        theme: 'striped',
        styles: { font: 'Helvetica', fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        didParseCell: (data) => {
          if (data.row.raw[0] && (data.row.raw[0].toString().includes('TOTAL') || data.row.raw[0].toString().includes('ATIVO') || data.row.raw[0].toString().includes('PASSIVO'))) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    
    doc.line(20, finalY, 80, finalY);
    doc.text('COORDENAÇÃO ADMINISTRATIVA', 22, finalY + 4);
    doc.text('Assinatura Responsável', 31, finalY + 8);

    doc.line(120, finalY, 180, finalY);
    doc.text('CONSELHO FISCAL MIRANTE', 123, finalY + 4);
    doc.text('Validação de Contas', 132, finalY + 8);

    doc.save(`MIRANTE-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- POS STOCK & checkout FUNCTIONS ---
  const saveProductsToStorage = (list: MarketProduct[]) => {
    localStorage.setItem('admin_products', JSON.stringify(list));
    setProducts(list);
  };

  const saveSupplierHistory = (list: any[]) => {
    localStorage.setItem('admin_supplier_logs', JSON.stringify(list));
    setSupplierHistory(list);
  };

  // Cart Handlers
  const addToCart = (p: MarketProduct) => {
    if (p.stock <= 0) {
      alert('Produto esgotado no estoque!');
      return;
    }
    const existing = cart.find(item => item.product.id === p.id);
    if (existing) {
      if (existing.quantity >= p.stock) {
        alert('Você já adicionou o limite do estoque disponível!');
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

  const handlePOSCheckout = () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho primeiro.');
      return;
    }

    // Step 1: Reduce stock & check validity
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });

    saveProductsToStorage(updatedProducts);

    // Step 2: Compute revenue & log into Finance
    const cartTotal = cart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0);
    const itemsDescription = cart.map(c => `${c.quantity}x ${c.product.name.split(':')[0]}`).join(', ');

    const tx: FinancialTransaction = {
      id: `TX:${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'ENTRADA',
      category: 'Venda de Eventos/Bazar',
      description: `[Venda PDV - ${posPaymentMethod}] ${itemsDescription}`,
      amount: cartTotal
    };

    const updatedTx = [tx, ...transactions];
    saveTransactionsToStorage(updatedTx);

    // Reset Cart
    setCart([]);
    alert(`Venda finalizada com sucesso! \nTotal: R$ ${cartTotal.toFixed(2)} registrado via ${posPaymentMethod}.`);
  };

  // Direct manual stock increment
  const handleAjustarEstoque = (id: string, qty: number) => {
    const list = products.map(p => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock + qty) };
      }
      return p;
    });
    saveProductsToStorage(list);
  };

  // Add custom new product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) {
      alert('Preencha os dados necessários do produto.');
      return;
    }
    const price = parseFloat(newProdPrice);
    const stock = parseInt(newProdStock);
    const min = parseInt(newProdMin);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      alert('Valores numéricos de preço e estoque inválidos.');
      return;
    }

    const item: MarketProduct = {
      id: `P:${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      price: price,
      stock: stock,
      minLimit: min || 5,
      expirationDate: newProdExp ? newProdExp : undefined
    };

    saveProductsToStorage([...products, item]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdStock('');
    setNewProdExp('');
    alert('Produto catalogado no estoque com sucesso!');
  };

  // Supplier Procurement execution
  const handleBuyFromSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyProdName || !buyQty || !buyPrice) {
      alert('Preencha as informações de compra de materiais.');
      return;
    }

    const qty = parseInt(buyQty);
    const price = parseFloat(buyPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      alert('Selecione quantidades e custos inteiros positivos.');
      return;
    }

    const totalCost = qty * price;

    // Step 1: Reduce cash in flow
    const tx: FinancialTransaction = {
      id: `TX:${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'SAÍDA',
      category: 'Compra de Mantimentos',
      description: `[Fornecedor: ${buySupplier}] Compra de estoque: ${qty}x ${buyProdName}`,
      amount: totalCost
    };
    saveTransactionsToStorage([tx, ...transactions]);

    // Step 2: Increase Product stock or create it
    const existing = products.find(p => p.name.toLowerCase().includes(buyProdName.toLowerCase()));
    if (existing) {
      const list = products.map(p => {
        if (p.id === existing.id) {
          return { ...p, stock: p.stock + qty, price: p.price || (price * 1.5) };
        }
        return p;
      });
      saveProductsToStorage(list);
    } else {
      const item: MarketProduct = {
        id: `P:${Date.now()}`,
        name: buyProdName,
        category: buyCategory,
        price: price * 1.5, // Suggested default retail price
        stock: qty,
        minLimit: 5
      };
      saveProductsToStorage([...products, item]);
    }

    // Log supplier transaction
    const log = {
      id: `SL:${Date.now()}`,
      supplier: buySupplier,
      product: buyProdName,
      quantity: qty,
      cost: totalCost,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedHistory = [log, ...supplierHistory];
    saveSupplierHistory(updatedHistory);

    // Reset fields
    setBuyProdName('');
    setBuyQty('');
    setBuyPrice('');
    alert(`Compra confirmada junto à editora/fornecedora! Foram adicionadas ${qty} unidades e descontados R$ ${totalCost.toFixed(2)} do fluxo de caixa.`);
  };

  const handleStartService = async (id: string) => {
    if (!currentUser) return;
    try {
      await dataService.updateQueueStatus(id, 'IN_PROGRESS', currentUser.id);
      loadData();
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
    }
  };

  const canManageDocuments = currentUser && (
    ['ADMIN', 'ADM'].includes(currentUser.role) || 
    (currentUser.role === 'COORDENADOR' && currentUser.sectorId === sectorId)
  );

  const canEditSector = currentUser && (
    ['ADMIN', 'ADM'].includes(currentUser.role) || 
    (currentUser.role === 'COORDENADOR' && currentUser.sectorId === sectorId)
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    try {
      setLoading(true);
      await dataService.addSectorDocument(sectorId, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: '#',
        uploadedBy: currentUser.name || currentUser.email
      });
      loadData();
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      setLoading(true);
      await dataService.deleteSectorDocument(sectorId, docId);
      loadData();
      alert('Documento excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      alert('Erro ao excluir documento. Por favor, verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const getSectorIcon = () => {
    const name = sectorName.toLowerCase();
    if (name.includes('comunicação')) return MessageSquare;
    if (name.includes('arte')) return Palette;
    if (name.includes('fraterno') || name.includes('atendimento')) return Users;
    if (name.includes('passe')) return Zap;
    if (name.includes('estudo') || name.includes('doutrinária')) return BookOpen;
    if (name.includes('infantil') || name.includes('mocidade')) return Baby;
    if (name.includes('social')) return Handshake;
    if (name.includes('mediúnica')) return Activity;
    if (name.includes('administrativo') || name.includes('secretaria')) return Shield;
    return Sparkles;
  };

  const SectorIcon = getSectorIcon();

  const quickActions = [
    {
      title: 'Chamar Próximo',
      desc: `Fila de espera: ${stats.waiting} aguardando`,
      icon: Clock,
      color: 'bg-amber-500',
      action: () => {
        if (waitingQueue.length > 0) handleStartService(waitingQueue[0].id);
        else navigate('/fila');
      }
    },
    {
      title: 'Novo Atendimento',
      desc: 'Encaminhar para este setor',
      icon: Users,
      color: 'bg-indigo-500',
      action: () => navigate(`/fila?sectorId=${sectorId}`)
    },
    {
      title: 'Documentação',
      desc: 'Manuais e arquivos do setor',
      icon: FileText,
      color: 'bg-emerald-500',
      action: () => documentsRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      title: 'Relatórios Históricos',
      desc: 'Produtividade e métricas',
      icon: Activity,
      color: 'bg-indigo-500',
      action: () => navigate('/relatorios')
    }
  ];

  if (canEditSector) {
    quickActions.push({
      title: 'Editar Setor',
      desc: 'Regimento e informações',
      icon: Pencil,
      color: 'bg-purple-500',
      action: () => navigate(`/setores/${sectorId}`)
    });
  }

  // Calculate totals for rendering KPIs supporting spreadsheet integration (Est. vs Real. and Status)
  const totalIncome = transactions
    .filter(t => t.type === 'ENTRADA' && (t.status?.toLowerCase() === 'recebido' || !t.status))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const currentCashBalance = totalIncome - totalExpense;

  // Specific metrics matching the custom spreadsheet structure
  const totalInRealized = totalIncome;
  const totalOutRealized = totalExpense;
  const saldoRecebidoTotal = currentCashBalance;

  const totalInPending = transactions
    .filter(t => t.type === 'ENTRADA' && t.status?.toLowerCase() === 'pendente')
    .reduce((acc, t) => acc + (t.amountEstimated !== undefined ? t.amountEstimated : t.amount), 0);

  const totalOutPending = transactions
    .filter(t => t.type === 'SAÍDA' && t.status?.toLowerCase() === 'pendente')
    .reduce((acc, t) => acc + (t.amountEstimated !== undefined ? t.amountEstimated : t.amount), 0);

  const totalPendingTotal = totalInPending - totalOutPending;

  const totalInEstimated = transactions
    .filter(t => t.type === 'ENTRADA')
    .reduce((acc, t) => acc + (t.amountEstimated !== undefined ? t.amountEstimated : t.amount), 0);

  const totalOutEstimated = transactions
    .filter(t => t.type === 'SAÍDA')
    .reduce((acc, t) => acc + (t.amountEstimated !== undefined ? t.amountEstimated : t.amount), 0);

  const estimativaTotalLiquida = totalInEstimated - totalOutEstimated;

  // Sum of paid values by Account Type (Tipos de Contas)
  const totalPaidAgua = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status) && (t.accountType === 'Água' || t.accountType?.toLowerCase() === 'agua' || t.accountType?.toLowerCase() === 'água'))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const totalPaidLuz = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status) && (t.accountType === 'Luz' || t.accountType?.toLowerCase() === 'luz'))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const totalPaidInternet = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status) && (t.accountType === 'Internet' || t.accountType?.toLowerCase() === 'internet'))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const totalPaidDiversos = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status) && (t.accountType === 'Diversos' || t.accountType?.toLowerCase() === 'diversos'))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  const totalPaidOutros = transactions
    .filter(t => t.type === 'SAÍDA' && (t.status?.toLowerCase() === 'pago' || !t.status) && (t.accountType === 'Outros' || t.accountType?.toLowerCase() === 'outros'))
    .reduce((acc, t) => acc + (t.amountRealized !== undefined ? t.amountRealized : t.amount), 0);

  // --- SUB-SECTOR ADVANCED METRICS ---
  const subSectorKey = sector?.name?.trim() || sectorName || "";
  const isPatrimonio = subSectorKey.includes("Patrimônio") || subSectorKey.includes("Material");
  const isTecnologia = subSectorKey.includes("Tecnologia") || subSectorKey.includes("Informática");
  const isObras = subSectorKey.includes("Obras") || subSectorKey.includes("Reformas") || subSectorKey.includes("Construção");
  const isLimpeza = subSectorKey.includes("Recepção") || subSectorKey.includes("Limpeza") || subSectorKey.includes("Zelo");
  const isAdvancedSubSector = isAdministrativo && adminTab.startsWith('sub-') && (isPatrimonio || isTecnologia || isObras || isLimpeza);

  // --- SUB-SECTOR DASHBOARD WORKSPACE BUILDERS ---
  const renderPatrimonioDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        {/* Left Column: Inventory Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-6">
              <div className="text-left">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 italic">
                  <Package className="text-indigo-600" size={22} />
                  Inventário e Controle de Ativos
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Materiais de consumo e patrimônio físico</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleStartScanner()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-150 active:scale-95"
                >
                  <QrCode size={13} />
                  Escanear Ativo
                </button>

                <button
                  type="button"
                  onClick={handlePrintAllQRCodes}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-slate-150 active:scale-95"
                  title="Gerar cartela com todas as etiquetas de QR Code prontas para imprimir"
                >
                  <Printer size={13} />
                  Imprimir Lote de QRs
                </button>

                <span className="text-xs font-bold text-gray-400 ml-2">Filtrar:</span>
                <select
                  value={patrimonioCategory}
                  onChange={(e) => setPatrimonioCategory(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-black text-gray-700 focus:outline-none"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="ELETRONICOS">Eletrônicos & Som</option>
                  <option value="MOBILIARIO">Mobiliário</option>
                  <option value="LIVRARIA">Livraria</option>
                  <option value="LIMPEZA">Limpeza</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {patrimonioItems
                .filter(item => patrimonioCategory === 'ALL' || item.category === patrimonioCategory)
                .map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            item.status === 'BOM' ? 'bg-emerald-500' : item.status === 'EM_FALTA' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                          )} />
                          <h4 className="font-extrabold text-gray-900 text-sm">{item.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <span>Categoria: {item.category}</span>
                          <span>•</span>
                          <span>Local: {item.location}</span>
                          <span>•</span>
                          <span className={cn(isLow ? "text-amber-600 font-black animate-pulse" : "")}>Estoque Mínimo: {item.minQuantity} {item.unit}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePatQuantity(item.id, -1)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-mono text-xs font-black text-gray-900 w-8 text-center bg-gray-50 rounded py-0.5">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePatQuantity(item.id, 1)}
                            className="p-1 text-gray-400 hover:text-emerald-500 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        {/* Qr Code Generator label */}
                        <button
                          type="button"
                          onClick={() => handleShowItemQRCode(item)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-indigo-100"
                          title="Gerar etiqueta QR Code"
                        >
                          <QrCode size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePatrimonio(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('pName') as string;
                const cat = fd.get('pCat') as string;
                const qty = Number(fd.get('pQty') || 1);
                const minQty = Number(fd.get('pMin') || 1);
                const loc = fd.get('pLoc') as string;
                if (!name) return;
                handleAddPatrimonio({ name, category: cat, quantity: qty, minQuantity: minQty, unit: 'unidade(s)', location: loc, status: qty === 0 ? 'EM_FALTA' : 'BOM' });
                e.currentTarget.reset();
              }}
              className="mt-6 p-6 bg-indigo-50/35 rounded-3xl border border-indigo-100/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-sans"
            >
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome da Peça / Ativo</label>
                <input required name="pName" placeholder="Ex: Microfone Sem Fio Shure" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Categoria</label>
                <select name="pCat" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none">
                  <option value="ELETRONICOS">Eletrônicos & Som</option>
                  <option value="MOBILIARIO">Mobiliário</option>
                  <option value="LIVRARIA">Livraria & Doutrinários</option>
                  <option value="LIMPEZA">Produtos de Limpeza</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Localização Física</label>
                <input name="pLoc" placeholder="Ex: Salão de Doutrinária" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estoque Atual</label>
                <input required name="pQty" type="number" defaultValue="1" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Quantidade Mínima</label>
                <input required name="pMin" type="number" defaultValue="1" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <button type="submit" className="sm:col-span-2 w-full mt-2 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors cursor-pointer">
                Catalogar Ativo
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Loans / Borrow Tracker */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="text-left">
              <h3 className="text-lg font-black text-gray-900 tracking-tight italic flex items-center gap-2">
                <Users size={18} className="text-amber-600" />
                Controle de Retiradas (Empréstimos)
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Materiais retirados para uso temporário</p>
            </div>

            <div className="space-y-3">
              {patLoans.length > 0 ? (
                patLoans.map((loan) => (
                  <div key={loan.id} className="p-4 bg-amber-50/40 border border-amber-100/50 rounded-2xl text-left space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-black text-amber-900">{loan.itemName}</h4>
                      <button
                        onClick={() => handleReturnLoan(loan.id)}
                        className="text-[9px] font-black uppercase text-amber-700 hover:text-white hover:bg-amber-600 px-2 py-1 border border-amber-300 rounded-lg transition-all cursor-pointer"
                      >
                        Devolver
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-500 font-semibold space-y-1">
                      <p>Retirado por: <strong>{loan.borrowerName}</strong></p>
                      <p>Data: {loan.loanDate}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-300 italic text-xs">Nenhum empréstimo ativo registrado.</div>
              )}
            </div>

            {/* Quick Loan Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const itemName = fd.get('lItem') as string;
                const borrowerName = fd.get('lName') as string;
                if (!itemName || !borrowerName) return;
                handleAddLoan({ itemName, borrowerName, loanDate: new Date().toLocaleDateString('pt-BR') });
                e.currentTarget.reset();
              }}
              className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 text-left font-sans"
            >
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 italic">Registrar Nova Retirada</h4>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Item Retirado</label>
                <input required name="lItem" placeholder="Ex: Notebook Dell" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Nome do Responsável / Voluntário</label>
                <input required name="lName" placeholder="Ex: Eduardo Santos" className="w-full mt-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-2 bg-gray-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors cursor-pointer">
                Autorizar Retirada
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderTecnologiaDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        {/* Left Column: Form Helpdesk */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm text-left space-y-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight italic flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={22} />
                Abertura de Chamado
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Solicitar suporte de TI para a casa espírita</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Assunto / Título do Problema</label>
                <input
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  placeholder="Ex: Wi-Fi desconectando no Auditório"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Descrição Detalhada do Incidente</label>
                <textarea
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  placeholder="Descreva em poucas palavras o problema, as luzes indicadoras do aparelho, ou o comportamento observado..."
                  rows={4}
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-sans"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nível de Urgência</label>
                <div className="grid grid-cols-3 gap-2 mt-1 font-sans">
                  {(['BAIXA', 'MEDIA', 'ALTA'] as const).map((pr) => (
                    <button
                      type="button"
                      key={pr}
                      onClick={() => setNewTicketPriority(pr)}
                      className={cn(
                        "py-2 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer",
                        newTicketPriority === pr
                          ? (pr === 'ALTA' ? "bg-red-500 border-transparent text-white shadow-lg shadow-red-500/10 hover:bg-red-600" : pr === 'MEDIA' ? "bg-amber-500 border-transparent text-white shadow-lg shadow-amber-500/10 hover:bg-amber-600" : "bg-gray-700 border-transparent text-white hover:bg-gray-800")
                          : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateTicket}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-98 transition-all shadow-lg cursor-pointer"
              >
                Abrir Solicitação
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Tickets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6 text-left">
              <div>
                <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                  <Cpu className="text-purple-600" size={22} />
                  Fila de Chamados Ativos
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Controle operacional de infraestrutura log-TI</p>
              </div>
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-black text-gray-700 focus:outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="ABERTO">Abertos</option>
                <option value="ATENDIMENTO">Em Atendimento</option>
                <option value="CONCLUIDO">Resolvidos</option>
              </select>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 text-left">
              {techTickets
                .filter(tk => ticketStatusFilter === 'ALL' || tk.status === ticketStatusFilter)
                .map((tk) => (
                  <div key={tk.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-4 font-sans">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                            {tk.number}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm",
                            tk.priority === 'ALTA' ? 'bg-red-500 shadow-red-200' : tk.priority === 'MEDIA' ? 'bg-amber-500 shadow-amber-200' : 'bg-gray-500 shadow-gray-200'
                          )}>
                            {tk.priority}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-sm mt-1">{tk.title}</h4>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{tk.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {tk.status === 'ABERTO' && (
                          <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" title="Chamado pendente" />
                        )}
                        {tk.status === 'ATENDIMENTO' && (
                          <span className="w-3 h-3 rounded-full bg-amber-500 animate-spin" title="Atendimento iniciado" />
                        )}
                        {tk.status === 'CONCLUIDO' && (
                          <span className="w-3 h-3 rounded-full bg-emerald-500" title="Chamado concluído" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {tk.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-100 pt-4 flex-wrap text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <div>
                        <span>Aberto por: <strong>{tk.senderName}</strong></span>
                        {tk.technicianName && <span className="ml-3 text-indigo-600">• Técnico: {tk.technicianName}</span>}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {tk.status === 'ABERTO' && (
                          <button
                            type="button"
                            onClick={() => handleStartTicketAtendimento(tk.id)}
                            className="px-4 py-2 bg-purple-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
                          >
                            Assumir Chamado
                          </button>
                        )}
                        {tk.status === 'ATENDIMENTO' && (
                          <button
                            type="button"
                            onClick={() => handleCloseTicket(tk.id)}
                            className="px-4 py-2 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Marcar Resolvido
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(tk.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderObrasDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        {/* Left Column: Projects timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Wrench className="text-indigo-600" size={22} />
                Gestão e Expansores de Infraestrutura Física
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Construções, reformas e adequação civil estrutural</p>
            </div>

            <div className="space-y-8 text-left">
              {obraProjects.length > 0 ? (
                obraProjects.map((ob) => (
                  <div key={ob.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6 font-sans">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-150">
                          {ob.location}
                        </span>
                        <h4 className="font-extrabold text-gray-950 text-lg mt-2 leading-none">{ob.name}</h4>
                        {ob.notes && <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{ob.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#a8a29e]">Prazo Estimado</span>
                        <span className="text-xs font-black text-indigo-900 mt-1">{ob.estimatedEndDate}</span>
                      </div>
                    </div>

                    {/* Progress slider */}
                    <div className="space-y-2 col-span-2">
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                        <span className="text-gray-400">Progresso Geral</span>
                        <span className="text-indigo-600">{ob.percentage}% Concluído</span>
                      </div>
                      <div className="w-full bg-gray-200/60 h-3 rounded-full overflow-hidden relative">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-700" style={{ width: `${ob.percentage}%` }} />
                      </div>
                    </div>

                    {/* Financial Gauge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
                      <div className="p-4 bg-white border border-gray-150 rounded-2xl flex justify-between items-center shadow-inner">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#a8a29e]">Orçamento Planejado</p>
                          <p className="font-extrabold text-gray-700 text-sm mt-1">R$ {ob.budgetPlanned.toLocaleString('pt-BR')}</p>
                        </div>
                        <Coins className="text-gray-300" size={24} />
                      </div>
                      <div className={cn(
                        "p-4 border rounded-2xl flex justify-between items-center shadow-inner",
                        ob.budgetActual > ob.budgetPlanned ? "bg-red-50 border-red-100" : "bg-white border-gray-150"
                      )}>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#a8a29e]">Despesa Executada</p>
                          <p className={cn("font-black text-sm mt-1", ob.budgetActual > ob.budgetPlanned ? "text-red-600" : "text-emerald-600")}>
                            R$ {ob.budgetActual.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <DollarSign className={cn(ob.budgetActual > ob.budgetPlanned ? "text-red-300 animate-bounce" : "text-emerald-300")} size={24} />
                      </div>
                    </div>

                    {/* Stages list */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Etapas do Planejamento</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {ob.stages.map((st, sidx) => (
                          <div 
                            key={sidx}
                            onClick={() => handleToggleStageStatus(ob.id, sidx)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer select-none text-left relative overflow-hidden group/stage",
                              st.status === 'CONCLUIDO' 
                                ? "bg-emerald-50/40 border-emerald-100 text-emerald-950" 
                                : st.status === 'EM_ANDAMENTO' 
                                  ? "bg-amber-50/40 border-amber-100 text-amber-950" 
                                  : "bg-white border-gray-150 text-gray-400 hover:border-indigo-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {st.status === 'CONCLUIDO' ? (
                                <CheckCircle2 size={14} className="text-emerald-600" />
                              ) : st.status === 'EM_ANDAMENTO' ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                              ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300" />
                              )}
                              <span className="font-extrabold text-[11px] leading-tight truncate">{st.name}</span>
                            </div>
                            <div className="mt-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 flex justify-between">
                              <span>Prazo: {st.duration}</span>
                              <span className="italic">@{st.responsible.split(' ')[0]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add cost input directly */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = Number(new FormData(e.currentTarget).get('addedVal'));
                        if (!val) return;
                        handleUpdateObraBudget(ob.id, val);
                        e.currentTarget.reset();
                      }}
                      className="p-4 bg-white border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"
                    >
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Lançar Nova Fatura / Nota Técnica:</span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input name="addedVal" type="number" required placeholder="Valor R$ (Ex: 850)" className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none w-full sm:w-36" />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-colors shrink-0 cursor-pointer">
                          Confirmar Gasto
                        </button>
                      </div>
                    </form>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-300 italic text-xs">Nenhum projeto de reforma em andamento.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Register construction */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm text-left space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight italic flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" />
                Novo Projeto Estrutural
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Registrar uma nova obra para controle administrativo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Identificador / Nome da Obra</label>
                <input
                  value={newObraName}
                  onChange={(e) => setNewObraName(e.target.value)}
                  placeholder="Ex: Reforma da Calçada Externa"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none font-sans"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Localização Física / Anexo</label>
                <input
                  value={newObraLocation}
                  onChange={(e) => setNewObraLocation(e.target.value)}
                  placeholder="Ex: Anexo B (Entrada Externa)"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none font-sans"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Orçamento Estimado (R$)</label>
                <input
                  value={newObraBudget}
                  onChange={(e) => setNewObraBudget(e.target.value)}
                  placeholder="Ex: 5000"
                  type="number"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none font-sans"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateObra}
                className="w-full py-3 bg-gray-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors cursor-pointer"
              >
                Lançar Projeto
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLimpezaDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
        {/* Left Column: Visitor Registry */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Users className="text-indigo-600" size={22} />
                Controle de Visitas e Recepção
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Registro de Acolhimento e Acesso ao Prédio</p>
            </div>

            {/* Registry Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left font-sans">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Irmão / Visitante</label>
                <input
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  placeholder="Ex: Amanda Ferreira Silva"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Telefone</label>
                <input
                  value={newVisitorPhone}
                  onChange={(e) => setNewVisitorPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Finalidade do Acesso / Encaminhamento</label>
                <input
                  value={newVisitorPurpose}
                  onChange={(e) => setNewVisitorPurpose(e.target.value)}
                  placeholder="Ex: Assistência Sopa / Atendimento Fraterno"
                  className="w-full mt-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRegisterVisitor}
                className="sm:col-span-3 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Registrar Entrada de Visitante
              </button>
            </div>

            {/* Visitors list */}
            <div className="space-y-3 pt-4 border-t border-gray-50 text-left font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Fluxo de Visitantes Hoje</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {visitorLogs.map((vl) => (
                  <div key={vl.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex justify-between items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                    <div>
                      <h5 className="font-extrabold text-sm text-gray-950 leading-none">{vl.name}</h5>
                      <span className="inline-flex text-[9px] text-[#78716c] font-black uppercase tracking-wider mt-1">{vl.purpose} • {vl.phone}</span>
                      <p className="text-[9px] text-gray-400 mt-1">
                        Chegada: {new Date(vl.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {vl.checkOutTime && ` • Saída: ${new Date(vl.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>

                    {!vl.checkOutTime ? (
                      <button
                        onClick={() => handleCheckOutVisitor(vl.id)}
                        className="p-2.5 bg-gray-950 hover:bg-red-600 hover:scale-105 transition-all text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer whitespace-nowrap"
                      >
                        Registrar Saída (Check-out)
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        Saída Concluída
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checklists */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={22} />
                Zelo de Ambientes (Limpeza e Conservação)
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Checklists e Ocorrências Prediais</p>
            </div>

            {/* Form to Launch New Cleaning Checklist or Area */}
            <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 text-left space-y-4 font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic flex items-center gap-1.5">
                <Plus size={14} className="text-indigo-600" />
                Lançar Nova Atividade ou Ambiente
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Ambiente / Atividade</label>
                  <input
                    value={newChecklistRoomName}
                    onChange={(e) => setNewChecklistRoomName(e.target.value)}
                    placeholder="Ex: Refeitório Administrativo, Entrada Principal"
                    className="w-full mt-1 bg-white border border-gray-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status de Conservação Inicial</label>
                  <select
                    value={newChecklistStatus}
                    onChange={(e) => setNewChecklistStatus(e.target.value as any)}
                    className="w-full mt-1 bg-white border border-gray-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="LIMPO">🟢 LIMPO / CONSERVADO</option>
                    <option value="ATENCAO">🟡 ATENÇÃO / MENOR</option>
                    <option value="PENDENTE">🔴 URGENTE / PENDENTE</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Responsável pela Inspeção / Limpeza</label>
                  <input
                    value={newChecklistResponsibleName}
                    onChange={(e) => setNewChecklistResponsibleName(e.target.value)}
                    placeholder="Ex: Maria José (Voluntária)"
                    className="w-full mt-1 bg-white border border-gray-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Observações / Falta de Materiais</label>
                  <input
                    value={newChecklistObservations}
                    onChange={(e) => setNewChecklistObservations(e.target.value)}
                    placeholder="Ex: Sem observações / Repor papel de mão"
                    className="w-full mt-1 bg-white border border-gray-150 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddChecklistActivity}
                  className="sm:col-span-6 w-full py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Registrar Nova Atividade / Ambiente
                </button>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {cleaningChecklists.map((cl) => (
                <div key={cl.id} className="p-5 bg-gray-50 border border-gray-150 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all font-sans">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        cl.status === 'LIMPO' ? "bg-emerald-500" : cl.status === 'ATENCAO' ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"
                      )} />
                      <h4 className="font-extrabold text-sm text-gray-950 leading-none">{cl.roomName}</h4>
                    </div>
                    {cl.observations && (
                      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-150 px-3 py-1.5 rounded-xl font-medium mt-2 leading-relaxed font-sans">
                        ⚠️ Alerta: {cl.observations}
                      </p>
                    )}
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider !mt-2 font-sans">
                      Última Inspeção por: <strong>{cl.responsibleName}</strong> • {new Date(cl.lastCleanedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap">
                    {cl.status !== 'LIMPO' ? (
                      <button
                        onClick={() => handleUpdateChecklistStatus(cl.id, 'LIMPO', '')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Marcar como Limpo / Resolvido
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const obs = prompt("Informe a ocorrência ou falta de materiais observada na sala:");
                          if (obs !== null) {
                            handleUpdateChecklistStatus(cl.id, 'ATENCAO', obs);
                          }
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer font-sans"
                      >
                        Sinalizar Alerta / Falta
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteChecklistActivity(cl.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-500 rounded-xl transition-all cursor-pointer"
                      title="Excluir Atividade / Ambiente"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Hero Section */}
      <div className="bg-indigo-900 rounded-[50px] p-8 md:p-14 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-1000">
          <SectorIcon size={350} />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] border border-white/10">
            <Sparkles size={14} className="text-indigo-300" />
            <span>Simulador de Setor: {formatSectorName(sector?.name || sectorName)}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
            Gestão <span className="text-indigo-400">Dinâmica</span> do Setor
          </h1>
          
          <p className="text-lg text-indigo-100 font-medium max-w-xl">
            {getSectorDescription(sector?.name || sectorName)}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={loadData}
              className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-900 rounded-[24px] font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              <Zap size={18} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar Painel</span>
            </button>
            <div className="flex items-center gap-4 px-6 py-4 bg-indigo-800/50 rounded-[24px] border border-indigo-700/50">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Setor Operante</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditionally add custom tabs for administrativ sector */}
      {isAdministrativo && (
        <div className="flex overflow-x-auto md:flex-wrap p-2 bg-gray-100 rounded-3xl w-full gap-2 font-bold text-sm scrollbar-none">
          <button
            onClick={() => {
              setAdminTab('overview');
              setCurrentViewSectorId(sectorId);
            }}
            className={cn(
              "flex-shrink-0 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl transition-all font-black text-xs uppercase tracking-widest",
              adminTab === 'overview'
                ? "bg-white text-indigo-600 shadow-md"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <LayoutDashboard size={16} />
            <span>Painel e Documentos</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => {
                setAdminTab('finance');
                setCurrentViewSectorId(sectorId);
              }}
              className={cn(
                "flex-shrink-0 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl transition-all font-black text-xs uppercase tracking-widest",
                adminTab === 'finance'
                  ? "bg-white text-indigo-600 shadow-md"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Coins size={16} />
              <span>Financeiro & Tesouraria</span>
            </button>
          )}

          <button
            onClick={() => {
              setAdminTab('pos_bazar');
              setCurrentViewSectorId(sectorId);
            }}
            className={cn(
              "flex-shrink-0 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl transition-all font-black text-xs uppercase tracking-widest",
              adminTab === 'pos_bazar'
                ? "bg-white text-indigo-600 shadow-md"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Store size={16} />
            <span>Livraria, Cantina & Bazar</span>
          </button>

          {/* Dynamic sub-sectors rendered as tabs inside the Administrative view */}
          {subSectors.map((sub) => {
            const SubIcon = getSubSectorIcon(sub.name);
            const active = adminTab === `sub-${sub.id}`;
            return (
              <div
                key={sub.id}
                className={cn(
                  "flex-shrink-0 flex items-center rounded-2xl transition-all border",
                  active
                    ? "bg-white border-transparent shadow-md"
                    : "bg-transparent border-transparent hover:bg-gray-200"
                )}
              >
                <button
                  onClick={() => {
                    setAdminTab(`sub-${sub.id}`);
                    setCurrentViewSectorId(sub.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 py-4 pl-5 pr-2 rounded-l-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer",
                    active ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <SubIcon size={16} />
                  <span>{sub.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoModalSector(sub);
                  }}
                  className="p-4 rounded-r-2xl hover:bg-indigo-50/50 transition-all flex items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer border-l border-gray-100"
                  title={`Abrir Janela de Informações de ${sub.name}`}
                >
                  <Eye size={14} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ANIMATED ROUTER PAGES SIMULATOR */}
      <AnimatePresence mode="wait">
        {(!isAdministrativo || adminTab === 'overview' || adminTab.startsWith('sub-')) && (
          <motion.div
            key="overview-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            {/* Banner do Regimento Interno do Setor */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white rounded-[32px] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group select-none border border-white/5">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-125 transition-transform duration-750" />
              <div className="space-y-2 relative z-10 text-left">
                <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  <Sparkles size={11} className="text-indigo-300" />
                  Regimento Interno & Ficha de Trabalho
                </span>
                <h3 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase">
                  {formatSectorName(sector?.name || sectorName)}
                </h3>
                <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-xl leading-relaxed line-clamp-2">
                  {sector?.mission || sector?.description || "Consulte as diretrizes regulamentares da casa, fundamentação espírita, perfil do voluntário e fluxos de ingresso."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoModalSector(sector)}
                className="w-full md:w-auto px-6 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 hover:scale-103 transition-all shadow-lg active:scale-97 shrink-0 relative z-10 cursor-pointer flex items-center justify-center gap-2 border border-transparent"
              >
                <Eye size={16} className="text-indigo-900" />
                <span>Abrir Janela de Informações</span>
              </button>
            </div>

            {/* Polish Stats matching Master Dash */}
            {isAdvancedSubSector ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {isPatrimonio && (
                  <>
                    <StatCard 
                      title="Ativos Catalogados" 
                      value={patrimonioItems.length} 
                      icon={Package} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Alertas / Críticos" 
                      value={patrimonioItems.filter(p => p.status === 'EM_FALTA' || p.quantity <= p.minQuantity).length} 
                      icon={AlertTriangle} 
                      color="text-red-600" 
                      bg="bg-red-50" 
                      shadow="shadow-red-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Empréstimos Ativos" 
                      value={patLoans.length} 
                      icon={Users} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                      shadow="shadow-amber-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isTecnologia && (
                  <>
                    <StatCard 
                      title="Chamados Abertos" 
                      value={techTickets.filter(tk => tk.status === 'ABERTO').length} 
                      icon={Cpu} 
                      color="text-purple-600" 
                      bg="bg-purple-50" 
                      shadow="shadow-purple-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Em Atendimento" 
                      value={techTickets.filter(tk => tk.status === 'ATENDIMENTO').length} 
                      icon={Activity} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                      shadow="shadow-amber-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Total Solucionado" 
                      value={techTickets.filter(tk => tk.status === 'CONCLUIDO').length} 
                      icon={CheckCircle2} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isObras && (
                  <>
                    <StatCard 
                      title="Projetos de Reforma" 
                      value={obraProjects.filter(ob => ob.status === 'EM_ANDAMENTO').length} 
                      icon={Wrench} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Custo Acumulado" 
                      value={`R$ ${obraProjects.reduce((acc, ob) => acc + ob.budgetActual, 0).toLocaleString('pt-BR')}`} 
                      icon={DollarSign} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Média de Conclusão" 
                      value={`${obraProjects.length ? Math.round(obraProjects.reduce((acc, ob) => acc + ob.percentage, 0) / obraProjects.length) : 0}%`} 
                      icon={TrendingUp} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                      shadow="shadow-amber-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isLimpeza && (
                  <>
                    <StatCard 
                      title="Acolhidos Hoje" 
                      value={visitorLogs.filter(v => !v.checkOutTime).length} 
                      icon={Users} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Zelo: Áreas Limpas" 
                      value={cleaningChecklists.filter(cl => cl.status === 'LIMPO').length} 
                      icon={CheckCircle2} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Avisos de Reposição" 
                      value={cleaningChecklists.filter(cl => cl.status !== 'LIMPO').length} 
                      icon={AlertTriangle} 
                      color="text-red-600" 
                      bg="bg-red-50" 
                      shadow="shadow-red-500/10"
                      delay={0.2}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard 
                  title="Aguardando Agora" 
                  value={stats.waiting} 
                  icon={Clock} 
                  color="text-amber-600" 
                  bg="bg-amber-50" 
                  shadow="shadow-amber-500/10"
                  delay={0}
                />
                <StatCard 
                  title="Atendimento Ativo" 
                  value={stats.inProgress} 
                  icon={Activity} 
                  color="text-indigo-600" 
                  bg="bg-indigo-50" 
                  shadow="shadow-indigo-500/10"
                  delay={0.1}
                />
                <StatCard 
                  title="Concluídos Hoje" 
                  value={stats.completedToday} 
                  icon={CheckCircle2} 
                  color="text-emerald-600" 
                  bg="bg-emerald-50" 
                  shadow="shadow-emerald-500/10"
                  delay={0.2}
                />
              </div>
            )}

            {isAdvancedSubSector ? (
              <div className="space-y-6">
                {isPatrimonio && renderPatrimonioDashboard()}
                {isTecnologia && renderTecnologiaDashboard()}
                {isObras && renderObrasDashboard()}
                {isLimpeza && renderLimpezaDashboard()}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-10">
                {/* Fila Real-time */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 italic flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                        <ListOrdered size={20} strokeWidth={3} />
                      </div>
                      Fila de Espera Atual
                    </h2>
                  </div>

                  <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 hover:shadow-indigo-500/5">
                    {waitingQueue.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {waitingQueue.map((item, idx) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all cursor-pointer group/row"
                          >
                            <div className="flex items-center gap-6 flex-1" onClick={() => navigate(`/atendimentos?participantId=${item.participantId}`)}>
                              <div className={cn(
                                "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all group-hover/row:scale-110",
                                item.priority ? "bg-amber-50 text-amber-600 shadow-lg shadow-amber-500/10" : "bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-500/10"
                              )}>
                                <Users size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-gray-900 group-hover/row:text-indigo-600 transition-colors leading-none">{item.participantName}</h4>
                                <div className="flex items-center gap-3 mt-2">
                                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                      <Clock size={12} strokeWidth={3} />
                                      <span>Desde há 12 min</span>
                                   </div>
                                  {item.priority && (
                                      <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 animate-pulse">Prioridade</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               <div className="hidden sm:flex flex-col items-end mr-4">
                                  <span className="text-[10px] font-black text-gray-300 uppercase italic">Posição</span>
                                  <span className="text-2xl font-black text-gray-100 italic group-hover/row:text-indigo-100 transition-colors">#0{idx + 1}</span>
                               </div>
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleStartService(item.id);
                                 }}
                                 className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-indigo-100"
                               >
                                 Iniciar Atendimento
                               </button>
                               <ArrowRight size={20} className="text-gray-200 group-hover/row:text-indigo-500 group-hover:translate-x-2 transition-all" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-24 text-center text-gray-300 space-y-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles size={48} className="text-gray-100" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <p className="font-black uppercase tracking-widest text-[11px] text-gray-500 italic">Harmonia Alcançada</p>
                            <p className="text-sm font-medium text-gray-400 mt-2 italic leading-relaxed">Nenhum irmão aguardando no momento. Este é um instante de paz para o seu setor.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Section Refined */}
                <div ref={documentsRef} className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 italic flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <FileText size={20} strokeWidth={3} />
                      </div>
                      Biblioteca & Manuais
                    </h2>
                    {canManageDocuments && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 pr-6 pl-4 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95 group"
                      >
                        <div className="p-1 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                          <UploadCloud size={16} />
                        </div>
                        <span>Catalogar PDF</span>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                  </div>

                  <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden group/docs">
                    {sector?.documents && sector.documents.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {sector.documents.map((doc, idx) => (
                          <motion.div 
                            key={doc.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group/doc"
                          >
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center group-hover/doc:scale-110 transition-transform shadow-lg shadow-red-500/5 border border-red-100/50">
                                <FileText size={28} strokeWidth={2.5} />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-gray-900 leading-none">{doc.name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                      <Calendar size={12} />
                                      <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                                   </div>
                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider font-mono">
                                      <Zap size={12} />
                                      <span>{doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                                   </div>
                                   <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                   <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic group-hover/doc:text-indigo-600 transition-colors">
                                      Autorizado por @{doc.uploadedBy.split('@')[0]}
                                   </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-0 group-hover/doc:opacity-100 transition-all translate-x-4 group-hover/doc:translate-x-0">
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-gray-100"
                              >
                                <Eye size={16} />
                                <span>Luz</span>
                              </a>
                              {canManageDocuments && (
                                <button 
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                >
                                  <Trash2 size={20} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-24 text-center text-gray-300 space-y-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 group-hover/docs:scale-110 transition-transform duration-700">
                            <FileDown size={48} className="text-gray-100" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <p className="font-black uppercase tracking-widest text-[11px] text-gray-400">Repositório Vazio</p>
                            <p className="text-sm font-medium text-gray-400 mt-2 italic leading-relaxed">Nenhum manual de instrução ou PDF foi catalogado para este setor dinâmico ainda.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Sidebar Actions */}
              <div className="lg:col-span-4 space-y-10">
                {/* Ações Rápidas Grid */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-gray-900 italic flex items-center gap-3 px-2">
                    <Zap size={20} className="text-indigo-600" />
                    Ações de Comando
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {quickActions.map((action, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        whileHover={{ x: 8, scale: 1.02 }}
                        onClick={action.action}
                        className="w-full p-6 bg-white rounded-[40px] border border-gray-50 shadow-sm flex items-center gap-5 text-left hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group"
                      >
                        <div className={`w-14 h-14 ${action.color} rounded-[22px] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:shadow-2xl duration-500`}>
                          <action.icon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight italic leading-none">{action.title}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{action.desc}</p>
                        </div>
                        <ArrowRight size={20} className="text-gray-100 group-hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Activity Mini Stats Card */}
                <div className="bg-gray-900 rounded-[48px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-gray-200">
                   <div className="absolute -bottom-10 -left-10 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                      <SectorIcon size={250} />
                   </div>
                   <div className="relative z-10 space-y-8">
                      <div>
                          <h3 className="text-2xl font-black italic tracking-tight italic">Relatório Express</h3>
                          <p className="text-indigo-300/60 text-sm font-medium mt-1">Visão imediata do fluxo de atendimentos.</p>
                      </div>
                      <div className="space-y-3">
                          <div className="flex items-center justify-between p-5 bg-white/5 rounded-[28px] border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Carga Horária</span>
                                 <span className="text-xs font-bold text-white/40">Hoje</span>
                              </div>
                              <span className="text-2xl font-black italic">6.2h</span>
                          </div>
                      </div>
                      <button 
                        onClick={() => navigate('/relatorios')}
                        className="w-full py-5 bg-indigo-600 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-indigo-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/50 group/rel"
                      >
                          <Activity size={18} className="group-hover/rel:animate-pulse" />
                          Exportar Métricas
                      </button>
                   </div>
                </div>
              </div>
            </div>
            )}
          </motion.div>
        )}

        {isAdministrativo && adminTab === 'finance' && isAdmin && (
          <motion.div
            key="finance-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            {/* Real Stats for Finance matching Spreadsheet layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Saldo Recebido Total (Caixa)" 
                value={`R$ ${saldoRecebidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={DollarSign} 
                color="text-emerald-650 font-extrabold" 
                bg="bg-emerald-50/70" 
                shadow="shadow-emerald-500/10"
                delay={0}
              />
              <StatCard 
                title="Total Pendente (Superávit)" 
                value={`R$ ${totalPendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={Clock} 
                color={totalPendingTotal >= 0 ? "text-amber-600" : "text-rose-600"} 
                bg="bg-amber-50" 
                shadow="shadow-amber-500/10"
                delay={0.1}
              />
              <StatCard 
                title="A Receber (Custos Est.)" 
                value={`R$ ${totalInPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={TrendingUp} 
                color="text-indigo-600 animate-pulse-slow" 
                bg="bg-indigo-50" 
                shadow="shadow-indigo-500/10"
                delay={0.2}
              />
              <StatCard 
                title="A Pagar (Custos Est.)" 
                value={`R$ ${totalOutPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                icon={TrendingDown} 
                color="text-rose-600" 
                bg="bg-rose-50" 
                shadow="shadow-rose-500/10"
                delay={0.3}
              />
            </div>

            {/* Real-time Operator Cash sessions supervisory area */}
            <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 italic">
                    <Store className="text-indigo-600" size={18} />
                    Supervisão de Caixa Diário (Cantina / Livraria / Bazar)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Acompanhamento em tempo real das sessões abertas pelos operadores de balcão e auditoria de sangria/fechamentos.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Manual reload from localStorage
                      const cachedSession = localStorage.getItem('admin_cash_session');
                      setTreasuryCashSession(cachedSession ? JSON.parse(cachedSession) : null);
                      const cachedHist = localStorage.getItem('admin_closed_cash_sessions');
                      setClosedSessionsHistory(cachedHist ? JSON.parse(cachedHist) : []);
                      alert("Dados de operadores sincronizados com sucesso!");
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-650 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                  >
                    Sincronizar Dados
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Cash session */}
                <div className="lg:col-span-4 p-6 rounded-[24px] bg-slate-50 border border-slate-100/50 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Turno PDV Atual</span>
                      {treasuryCashSession ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest uppercase animate-pulse border border-emerald-100">
                          ● EM ANDAMENTO
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest uppercase border border-gray-200">
                          OFF-LINE
                        </span>
                      )}
                    </div>

                    {treasuryCashSession ? (
                      <div className="space-y-3 font-sans">
                        <div className="text-xs font-medium text-gray-850 space-y-2">
                          <p>Operador: <strong className="text-gray-950 font-extrabold">{treasuryCashSession.openedBy || 'Carlos Alberto'}</strong></p>
                          <p>Início: <span className="font-mono">{new Date(treasuryCashSession.openedAt).toLocaleString('pt-BR')}</span></p>
                          <p>Fundo Inicial: <span className="font-mono text-gray-950 font-bold">R$ {parseFloat(treasuryCashSession.initialCash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                        </div>
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500">
                          <div>
                            <span className="block text-[8px] uppercase text-gray-400">Total Pix</span>
                            <span className="text-xs font-black font-mono text-gray-905">R$ {(treasuryCashSession.pixTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase text-gray-400">Total Dinheiro</span>
                            <span className="text-xs font-black font-mono text-gray-905 font-extrabold">R$ {(treasuryCashSession.cashTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-1">
                        <p className="text-xs text-gray-400 font-bold">Nenhum caixa ativo</p>
                        <p className="text-[10px] text-gray-400 leading-normal">Os operadores podem abrir o caixa diário diretamente na tela de Vendas (PDV) antes de faturar pedidos.</p>
                      </div>
                    )}
                  </div>
                  {treasuryCashSession && (
                    <div className="pt-4 border-t border-gray-150 mt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold font-mono">
                      <span>Vendas: {treasuryCashSession.transactionsCount || 0}</span>
                      <span className="text-indigo-600">Fundo + Dinheiro: R$ {(parseFloat(treasuryCashSession.initialCash || 0) + (treasuryCashSession.cashTotal || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Closed Sessions history log list */}
                <div className="lg:col-span-8 p-4 rounded-[24px] bg-gray-50/50 border border-gray-100 space-y-3">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Histórico Recente de Fechamentos</span>
                  
                  <div className="overflow-x-auto max-h-[175px] overflow-y-auto pr-1">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="text-gray-400 font-black uppercase border-b border-gray-100 text-[9px] tracking-wider pb-1">
                          <th className="py-1.5 px-3">Encerramento</th>
                          <th className="py-1.5 px-3">Operador</th>
                          <th className="py-1.5 px-3 text-right">Esp. Caixa</th>
                          <th className="py-1.5 px-3 text-right">Contado</th>
                          <th className="py-1.5 px-3 text-center">Diferença</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {closedSessionsHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[11.5px] text-gray-400 font-semibold font-sans italic">
                              Nenhuma sessão de fechamento arquivada anteriormente.
                            </td>
                          </tr>
                        ) : (
                          [...closedSessionsHistory].reverse().map((sess: any, index: number) => {
                            const diff = sess.difference || 0;
                            const diffColor = diff === 0 
                              ? "text-emerald-600 bg-emerald-50" 
                              : diff > 0 
                                ? "text-blue-600 bg-blue-50" 
                                : "text-rose-600 bg-rose-50";

                            return (
                              <tr key={index} className="hover:bg-white/60 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                                  {new Date(sess.closedAt).toLocaleDateString('pt-BR')} {new Date(sess.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-gray-800">{sess.openedBy || 'Carlos Alberto'}</td>
                                <td className="py-2.5 px-3 text-right font-mono text-gray-650">R$ {parseFloat(sess.finalCashExpected || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-gray-800">R$ {parseFloat(sess.finalCashRecorded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold whitespace-nowrap">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black leading-none",
                                    diffColor
                                  )}>
                                    R$ {diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Account Type Paid Totals Panels matching spreadsheet tabs */}
            <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  Consolidação de Despesas Pagas (Tipos de Contas)
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">
                  Somatório de valores realizados exclusivamente com status <strong>Pago</strong> para cada tipo de conta da planilha.
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-4 rounded-[20px] bg-blue-50/70 border border-blue-100">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider block">Total de Água</span>
                  <span className="text-lg font-black text-blue-900 block mt-1">
                    R$ {totalPaidAgua.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="p-4 rounded-[20px] bg-amber-50/70 border border-amber-100">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">Total de Luz</span>
                  <span className="text-lg font-black text-amber-900 block mt-1">
                    R$ {totalPaidLuz.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="p-4 rounded-[20px] bg-indigo-50/70 border border-indigo-100">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider block">Total de Internet</span>
                  <span className="text-lg font-black text-indigo-900 block mt-1">
                    R$ {totalPaidInternet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="p-4 rounded-[20px] bg-purple-50/70 border border-purple-100">
                  <span className="text-[9px] font-black text-purple-600 uppercase tracking-wider block">Total Diversos</span>
                  <span className="text-lg font-black text-purple-950 block mt-1">
                    R$ {totalPaidDiversos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Total de Outros</span>
                  <span className="text-lg font-black text-slate-900 block mt-1">
                    R$ {totalPaidOutros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Split: Flow of Cash and Gateway Simulators */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Cash Flow Ledger Block (Col-8) */}
              <div className="lg:col-span-8 space-y-8">
                
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Coins className="text-indigo-600" size={20} />
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
                          Livro Caixa & Prestação de Contas
                        </h2>
                      </div>
                      <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wide">
                        Estimativa do Orçamento vs. Valores Efetivos Recebidos/Pagos (Planilha do Caixa)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                      <Search size={14} className="text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar registro..." 
                        value={txSearch}
                        onChange={e => setTxSearch(e.target.value)}
                        className="bg-transparent text-xs font-bold outline-none w-36" 
                      />
                    </div>
                  </div>

                  {/* Cash list of integrated spreadsheet columns */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-black uppercase tracking-wider text-[9px]">
                          <th className="py-4 px-2">Data</th>
                          <th className="py-4 px-2">Tipo</th>
                          <th className="py-4 px-2">Categoria</th>
                          <th className="py-4 px-2">Descrição</th>
                          <th className="py-4 px-2 text-right">V. Est. (R$)</th>
                          <th className="py-4 px-2 text-right">V. Real. (R$)</th>
                          <th className="py-4 px-2 text-center">Status</th>
                          <th className="py-4 px-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {transactions
                          .filter(t => t.description.toLowerCase().includes(txSearch.toLowerCase()) || t.category.toLowerCase().includes(txSearch.toLowerCase()))
                          .map(t => {
                            const estVal = t.amountEstimated !== undefined ? t.amountEstimated : t.amount;
                            const realVal = t.amountRealized !== undefined ? t.amountRealized : t.amount;
                            const currentStatus = t.status || (t.type === 'ENTRADA' ? 'Recebido' : 'Pago');

                            return (
                              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-2 font-black text-gray-900">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td className="py-4 px-2">
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest",
                                    t.type === 'ENTRADA' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                  )}>
                                    {t.type}
                                  </span>
                                </td>
                                <td className="py-4 px-2 text-[11px]">
                                  <div className="font-bold text-gray-650">{t.category}</div>
                                  {t.type === 'SAÍDA' && t.accountType && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[8px] tracking-wide border border-blue-105">
                                        💧 {t.accountType}
                                      </span>
                                      {t.paymentMethod && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-extrabold text-[8px] tracking-wide border border-indigo-105">
                                          💳 {t.paymentMethod}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-2 text-xs font-normal text-gray-550 max-w-[155px]" title={t.description}>
                                  <div className="truncate font-medium text-gray-700">{t.description}</div>
                                  {t.receiptBase64 && (
                                    <div className="mt-1 flex">
                                      <a
                                        href={t.receiptBase64}
                                        download={t.receiptName || 'comprovante.png'}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/80 text-[8px] font-black tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer"
                                        title={`Baixar Comprovante: ${t.receiptName}`}
                                      >
                                        <Paperclip size={9} />
                                        <span>Anexo Comprovante</span>
                                      </a>
                                    </div>
                                  )}
                                </td>
                                
                                {/* Estimated values */}
                                <td className="py-4 px-2 text-right font-bold text-slate-500">
                                  R$ {estVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                
                                {/* Realized values */}
                                <td className={cn(
                                  "py-4 px-2 text-right font-black text-xs",
                                  (currentStatus.toLowerCase() === 'pendente' || currentStatus.toLowerCase() === 'devedor') ? "text-amber-500/70 select-none italic" :
                                  t.type === 'ENTRADA' ? "text-emerald-700 animate-pulse-slow" : "text-rose-600"
                                )}>
                                  {(currentStatus.toLowerCase() === 'pendente' || currentStatus.toLowerCase() === 'devedor') ? 'R$ 0,00' : `R$ ${realVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </td>
                                
                                {/* Spreadsheet Interactive Quick Toggle Badge */}
                                <td className="py-4 px-2 text-center">
                                  <div className="relative group/status inline-block text-left">
                                    <button 
                                      className={cn(
                                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 transition-all shadow-sm border focus:outline-none hover:scale-105 active:scale-95",
                                        (currentStatus.toLowerCase() === 'recebido' || currentStatus.toLowerCase() === 'pago') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                        currentStatus.toLowerCase() === 'pendente' ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse-slow" :
                                        currentStatus.toLowerCase() === 'agendado' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                        "bg-gray-100 text-gray-400 border-gray-200 line-through"
                                      )}
                                    >
                                      <span>{currentStatus}</span>
                                      <span className="text-[7px] opacity-60">▼</span>
                                    </button>
                                    
                                    {/* Tooltip select menu list */}
                                    <div className="absolute right-0 mt-1.5 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl py-2.5 hidden group-hover/status:block hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <div className="px-3 pb-1 mb-1 border-b border-gray-50 text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Mudar Status</div>
                                      {t.type === 'ENTRADA' ? (
                                        <>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Recebido')}
                                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            💚 Recebido
                                          </button>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Pendente')}
                                            className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            🟡 Pendente
                                          </button>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Devolvido')}
                                            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-500 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            🔴 Devolvido
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Pago')}
                                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            💚 Pago
                                          </button>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Pendente')}
                                            className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            🟡 Pendente
                                          </button>
                                          <button 
                                            onClick={() => handleToggleTransactionStatus(t.id, 'Agendado')}
                                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider block text-xs"
                                          >
                                            💙 Agendado
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleStartEditTransaction(t)}
                                      className={cn(
                                        "p-1.5 px-2.5 rounded-xl transition-colors border border-transparent cursor-pointer",
                                        editingTxId === t.id 
                                          ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm scale-105" 
                                          : "text-gray-300 hover:text-indigo-600 hover:bg-indigo-50"
                                      )}
                                      title="Editar Lançamento"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="p-1.5 px-2.5 hover:bg-rose-50 text-gray-300 hover:text-rose-600 rounded-xl transition-colors border border-transparent cursor-pointer"
                                      title="Excluir Lançamento"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Advanced spreadsheet transaction form */}
                  <form id="transaction-form" onSubmit={handleAddTransaction} className="pt-6 border-t border-gray-100 space-y-5">
                    <div className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] italic flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {editingTxId ? (
                          <>
                            <Pencil size={14} className="text-indigo-500" strokeWidth={3} />
                            Editar Lançamento (Editando Registro)
                          </>
                        ) : (
                          <>
                            <Plus size={14} className="text-indigo-500" strokeWidth={3} />
                            Novo Lançamento (Orçamento & Prestação Planilha)
                          </>
                        )}
                      </div>
                      
                      {editingTxId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTransaction}
                          className="px-3 py-1 text-[9px] font-black uppercase bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      
                      {/* Tipo */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Lote Tipo</label>
                        <select 
                          value={newTxType} 
                          onChange={e => {
                            const nextType = e.target.value as 'ENTRADA' | 'SAÍDA';
                            setNewTxType(nextType);
                            setNewTxCategory(nextType === 'ENTRADA' ? 'Doação' : 'Pago');
                            setNewTxCustomStatus(nextType === 'ENTRADA' ? 'Recebido' : 'Pago');
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                        >
                          <option value="ENTRADA">ENTRADA (Receita)</option>
                          <option value="SAÍDA">SAÍDA (Despesa)</option>
                        </select>
                      </div>

                      {/* Classificação */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Classificação (Categoria)</label>
                        <select 
                          value={newTxCategory} 
                          onChange={e => setNewTxCategory(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                        >
                          {newTxType === 'ENTRADA' ? (
                            <>
                              <option value="Doação">Doação</option>
                              <option value="Recebimento">Recebimento</option>
                              <option value="Pagamentos">Pagamentos</option>
                              <option value="Contribuição">Contribuição</option>
                            </>
                          ) : (
                            <>
                              <option value="Pago">Pago</option>
                              <option value="Devedor">Devedor</option>
                              <option value="Pag. Atrasado">Pag. Atrasado</option>
                              <option value="Pag. Por terceiro">Pag. Por terceiro</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Data */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Data do Lançamento</label>
                        <input 
                          type="date"
                          value={newTxDate}
                          onChange={e => setNewTxDate(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all" 
                        />
                      </div>

                      {/* Status */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Status da Transação</label>
                        <select 
                          value={newTxCustomStatus} 
                          onChange={e => {
                            const valS = e.target.value;
                            setNewTxCustomStatus(valS);
                            if (valS === 'Pendente' || valS === 'Devedor') {
                              setNewTxAmountReal('0'); // Force realized to zero
                            } else {
                              setNewTxAmountReal(newTxAmountEst || newTxAmount || '');
                            }
                          }}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                        >
                          {newTxType === 'ENTRADA' ? (
                            <>
                              <option value="Recebido">🟢 Recebido</option>
                              <option value="Pendente">🟡 Pendente</option>
                              <option value="Devolvido">🔴 Devolvido</option>
                            </>
                          ) : (
                            <>
                              <option value="Pago">🟢 Pago</option>
                              <option value="Pendente">🟡 Pendente</option>
                              <option value="Agendado">💙 Agendado</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Conditional Fields for Despesas only */}
                    {newTxType === 'SAÍDA' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                        <div>
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Tipo de Conta (Tipos de contas)</label>
                          <select 
                            value={newTxAccountType} 
                            onChange={e => setNewTxAccountType(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                          >
                            <option value="Água">Água💧</option>
                            <option value="Luz">Luz⚡</option>
                            <option value="Internet">Internet🌐</option>
                            <option value="Diversos">Diversos🧩</option>
                            <option value="Outros">Outros⚙️</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Tipo de Pagamento (Meio)</label>
                          <select 
                            value={newTxPaymentMethod} 
                            onChange={e => setNewTxPaymentMethod(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                          >
                            <option value="Pix">Pix</option>
                            <option value="Cartão de crédito">Cartão de Crédito</option>
                            <option value="Cartão de débito">Cartão de Débito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Boleto">Boleto</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      
                      {/* Estimated Value */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">V. Estimado (R$)</label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2 text-[10px] text-gray-400 font-bold">R$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            required
                            placeholder="0,00" 
                            value={newTxAmountEst}
                            onChange={e => {
                              setNewTxAmountEst(e.target.value);
                              if (newTxCustomStatus !== 'Pendente' && newTxCustomStatus !== 'Devedor') {
                                setNewTxAmountReal(e.target.value);
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Realized Value */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">V. Realizado (R$)</label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2 text-[10px] text-gray-400 font-bold">R$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            disabled={newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor'}
                            placeholder={(newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') ? '0,00 (Pendente)' : '0,00'} 
                            value={(newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') ? '0' : newTxAmountReal}
                            onChange={e => setNewTxAmountReal(e.target.value)}
                            className={cn(
                              "w-full pl-9 pr-3 py-2 rounded-xl outline-none font-bold text-[11px] text-gray-750 transition-all border",
                              (newTxCustomStatus === 'Pendente' || newTxCustomStatus === 'Devedor') 
                                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                : "bg-gray-50 border-gray-100 focus:bg-white focus:border-indigo-500"
                            )}
                          />
                        </div>
                      </div>

                      {/* Descricao */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Descrição dos Valores</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Conta mensal luz salão de passes..." 
                          value={newTxDesc}
                          onChange={e => setNewTxDesc(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-[11px] text-gray-700 focus:bg-white focus:border-indigo-500 transition-all"
                        />
                      </div>

                      {/* Anexar Comprovante Digital (Receipt file upload) */}
                      <div className="sm:col-span-3">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center justify-between">
                          <span>Comprovante (PDF/Imagem)</span>
                          {newTxReceiptName && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewTxReceiptBase64('');
                                setNewTxReceiptName('');
                              }}
                              className="text-[8px] text-red-500 hover:underline uppercase font-extrabold cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </label>
                        <div className="relative mt-1">
                          <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            id="tx-receipt-upload"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Limite de 2MB por comprovante!");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setNewTxReceiptBase64(reader.result as string);
                                  setNewTxReceiptName(file.name);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="tx-receipt-upload"
                            className={cn(
                              "w-full px-3 py-1.5 border rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold cursor-pointer transition-all truncate",
                              newTxReceiptName 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50" 
                                : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-500 hover:border-gray-300"
                            )}
                          >
                            <Paperclip size={12} className={newTxReceiptName ? "text-emerald-500 shrink-0" : "text-gray-400 shrink-0"} />
                            <span className="truncate">{newTxReceiptName || "Anexar arquivo"}</span>
                          </label>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="sm:col-span-2 flex items-end">
                        <button 
                          type="submit"
                          className={cn(
                            "w-full py-2 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer",
                            editingTxId 
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-105" 
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-105"
                          )}
                        >
                          {editingTxId ? 'Salvar Lançamento' : 'Lançar Lote'}
                        </button>
                      </div>

                    </div>
                  </form>
                </div>
              </div>

              {/* Legal accountability & Gateway Integration widget (Col-4) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* PDF Account Reports (Transparência) */}
                <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 shadow-xl shadow-slate-100">
                  <div>
                    <h3 className="text-lg font-black italic flex items-center gap-2">
                      <FileSpreadsheet className="text-emerald-400 animate-bounce" size={18} />
                      Prestação de Contas
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">Geração sob demanda de balancetes de acordo com as exigências fiscais.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => generateAccountabilityReport('BALANÇO')}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between text-left transition-all group"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white">Balanço Patrimonial</h4>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Bens, Direitos e Estoques</p>
                      </div>
                      <Download size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      onClick={() => generateAccountabilityReport('DRE')}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl flex items-center justify-between text-left transition-all group"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white">DRE Consolidado</h4>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Superávit & Receitas reais</p>
                      </div>
                      <Download size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Gateway simulated panels */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Gateway de Cobranças</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Automatize doações e controle mensalidades de sócios ativos.</p>
                  </div>

                  <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 text-[10px] font-black">
                    <button 
                      onClick={() => { setPaymentType('pix'); setPixActive(false); }}
                      className={cn("flex-1 py-2 px-3 rounded-xl transition-all uppercase", paymentType === 'pix' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500")}
                    >
                      Pix Recorrente
                    </button>
                    <button 
                      onClick={() => { setPaymentType('boleto'); setBoletoActive(false); }}
                      className={cn("flex-1 py-2 px-3 rounded-xl transition-all uppercase", paymentType === 'boleto' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500")}
                    >
                      Boletos Sócios
                    </button>
                    <button 
                      onClick={() => setPaymentType('donation')}
                      className={cn("flex-1 py-2 px-3 rounded-xl transition-all uppercase", paymentType === 'donation' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500")}
                    >
                      Link Doar
                    </button>
                  </div>

                  {/* Rendering dynamic gateway views */}
                  {paymentType === 'pix' && (
                    <div className="space-y-4">
                      {pixActive ? (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-3xl text-center space-y-4">
                          <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Pix Assinatura Gerado</p>
                          <div className="w-32 h-32 bg-white rounded-2xl mx-auto flex items-center justify-center border border-indigo-100 relative overflow-hidden p-2">
                            {/* Uses the dynamic scannable QR Code image using public API linked with our generated EMV payload */}
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedPixKey)}`} 
                              alt="Pix QR Code" 
                              className="w-28 h-28"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 truncate">Doador: {pixName}</h4>
                            <p className="text-[11px] font-black text-indigo-600 mt-1">Mensal: R$ {parseFloat(pixAmount).toFixed(2)}</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-indigo-100">
                            <input 
                              type="text" 
                              readOnly 
                              value={generatedPixKey} 
                              className="w-full text-[8px] font-mono text-gray-400 bg-transparent outline-none truncate text-center"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(generatedPixKey);
                                alert('Código Copia-Cola Pix copiado com sucesso!');
                              }}
                              className="text-[9px] font-black text-indigo-600 mt-1 border-t border-indigo-50/50 pt-1 block mx-auto uppercase cursor-pointer hover:underline"
                            >
                              Copiar Chave Copia-Cola
                            </button>
                          </div>
                          <button 
                            onClick={() => { setPixActive(false); setPixName(''); setPixAmount(''); }}
                            className="text-[10px] text-gray-400 underline font-semibold hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            Gerar Nova Assinatura
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <form onSubmit={handleGeneratePixSimulation} className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nome do Doador Beneficiário</label>
                                <button
                                  type="button"
                                  onClick={() => setPixConfig(prev => ({ ...prev, showConfig: !prev.showConfig }))}
                                  className="text-[9px] font-black text-indigo-600 hover:underline uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  ⚙️ Configure Chave Pix
                                </button>
                              </div>
                              <input 
                                type="text" 
                                required 
                                placeholder="Filiado ou Doador" 
                                value={pixName}
                                onChange={e => setPixName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Valor Recorrente Mensal (R$)</label>
                              <input 
                                type="number" 
                                required 
                                placeholder="Ex: 50.00" 
                                value={pixAmount}
                                onChange={e => setPixAmount(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" 
                              />
                            </div>
                            <button 
                              type="submit"
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Gerar Pix Recorrente
                            </button>
                          </form>

                          {/* Collapsible Institutional Pix Key Setup */}
                          {pixConfig.showConfig && (
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">⚙️ Dados Bancários Pix da Instituição</h4>
                              <p className="text-[9px] text-gray-400 leading-relaxed">Para que o QR code e a chave copia-e-cola gerem transações reais de recebimento direto na conta da Associação, insira os dados oficiais abaixo:</p>
                              
                              <div className="space-y-2 text-[10px] font-bold text-gray-700">
                                <div>
                                  <label className="text-[8px] uppercase text-gray-400 block mb-0.5">Chave Pix (E-mail, CNPJ, Celular ou Aleatória)</label>
                                  <input 
                                    type="text"
                                    value={pixConfig.key}
                                    onChange={e => setPixConfig(prev => ({ ...prev, key: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] uppercase text-gray-400 block mb-0.5">Nome do Recebedor (Sem acentos, máx. 25 carac.)</label>
                                  <input 
                                    type="text"
                                    value={pixConfig.name}
                                    onChange={e => setPixConfig(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8px] uppercase text-gray-400 block mb-0.5">Cidade (Ex: Montes Claros)</label>
                                    <input 
                                      type="text"
                                      value={pixConfig.city}
                                      onChange={e => setPixConfig(prev => ({ ...prev, city: e.target.value }))}
                                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-xs"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        localStorage.setItem('admin_pix_config', JSON.stringify(pixConfig));
                                        alert('Configuração Pix da casa espírita atualizada e salva!');
                                        setPixConfig(prev => ({ ...prev, showConfig: false }));
                                      }}
                                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase font-black rounded-lg transition-colors cursor-pointer"
                                    >
                                      Salvar Chave
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {paymentType === 'boleto' && (
                    <div className="space-y-6">
                      
                      {/* Flex grid containing Form on left, and List of generated boletos on right */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        
                        {/* Form area: col-5 */}
                        <div className="md:col-span-5 bg-gray-50/55 p-5 rounded-3xl border border-gray-100 space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Emitir Novo Boleto</h4>
                          <p className="text-[9px] text-gray-400 leading-normal">Crie uma cobrança bancária para o sócio. Ela ficará registrada na listagem de notas geradas.</p>
                          
                          <form onSubmit={handleGenerateBoletoSimulation} className="space-y-3">
                            <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Identificação do Sócio Beneficiado</label>
                              <input 
                                type="text" 
                                required 
                                placeholder="Nome completo do Sócio" 
                                value={boletoName}
                                onChange={e => setBoletoName(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none text-xs font-bold text-gray-700" 
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Mensalidade (R$)</label>
                                <input 
                                  type="number" 
                                  required 
                                  placeholder="80.00" 
                                  value={boletoAmount}
                                  onChange={e => setBoletoAmount(e.target.value)}
                                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none text-xs font-bold text-gray-700" 
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Vencimento</label>
                                <input 
                                  type="date" 
                                  required 
                                  value={boletoDue}
                                  onChange={e => setBoletoDue(e.target.value)}
                                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none text-[10px] font-bold text-gray-700" 
                                />
                              </div>
                            </div>
                            <button 
                              type="submit"
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              ⚙️ Registrar Cobrança Bancária
                            </button>
                          </form>
                        </div>

                        {/* List area: col-7 */}
                        <div className="md:col-span-7 space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center justify-between">
                            <span>Boletos Registrados / Cobranças Emitidas</span>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] lowercase font-semibold font-mono">
                              {generatedBoletos.length} cobranças
                            </span>
                          </h4>

                          <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-100 custom-scrollbar">
                            {generatedBoletos.length === 0 ? (
                              <div className="p-8 text-center text-[11px] text-gray-400">
                                Nenhum boleto emitido atualmente nesta sessão.
                              </div>
                            ) : (
                              generatedBoletos.map((b) => (
                                <div key={b.id} className="p-3 bg-white hover:bg-gray-50 flex items-center justify-between text-xs transition-colors">
                                  <div className="space-y-0.5 truncate pr-2">
                                    <h5 className="font-bold text-gray-800 truncate">{b.name}</h5>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold font-mono">
                                      <span>R$ {b.amount.toFixed(2)}</span>
                                      <span>•</span>
                                      <span>Venc: {new Date(b.dueDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {b.status === 'Compensado' ? (
                                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                        Compensado
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleEfetivarBoleto(b)}
                                        className="bg-indigo-50 hover:bg-emerald-500 hover:text-white text-indigo-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer"
                                        title="Liquidado do caixa / Recebido de fato"
                                      >
                                        Compensar
                                      </button>
                                    )}

                                    <button 
                                      onClick={() => setViewingBoleto(b)}
                                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                                      title="Visualizar boleto real"
                                    >
                                      <Eye size={12} />
                                    </button>

                                    <button 
                                      onClick={() => handleDeleteBoleto(b.id)}
                                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                      title="Apagar boleto"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {paymentType === 'donation' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 leading-relaxed">Campanhas de Amor e Manutenção Predial para incentivar contribuições do público geral:</p>
                        <p className="text-[9px] text-indigo-500 uppercase tracking-widest font-black italic">⚙️ Configuração Dinâmica de Checkout</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Obras Sociais Campaign block */}
                        {donationCampaigns.map((c, i) => {
                          const isObras = c.id === 'obrassociais';
                          const campaignUrl = `${window.location.origin}/doar/${c.id}`;
                          
                          // Default values if undefined
                          const currentGoal = c.goalAmount ?? (isObras ? 10000 : 25000);
                          const currentRaised = c.raisedAmount ?? (isObras ? 6250 : 18400);
                          const percentage = Math.min(100, Math.round((currentRaised / currentGoal) * 100));

                          return (
                            <div key={c.id} className={cn(
                              "p-5 rounded-3xl space-y-4 border transition-all relative flex flex-col justify-between",
                              isObras 
                                ? "bg-emerald-50/40 border-emerald-100/70 shadow-sm" 
                                : "bg-indigo-50/40 border-indigo-100/70 shadow-sm"
                            )}>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider",
                                    isObras ? "text-emerald-600" : "text-indigo-600"
                                  )}>
                                    Campanha Ativa: {c.title}
                                  </span>
                                  <span className="bg-white/85 px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase shadow-sm border border-gray-100">
                                    {c.mode === 'internal' ? 'Portal Interno' : 'Redirect'}
                                  </span>
                                </div>

                                <h5 className="font-bold text-xs text-gray-800 leading-snug">{c.description}</h5>

                                {/* Campaign Thermometer progress bar bar */}
                                <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-gray-150/40">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-gray-500">Meta Arrecadada:</span>
                                    <span className={cn(
                                      "font-black text-xs font-mono",
                                      isObras ? "text-emerald-600" : "text-indigo-600"
                                    )}>
                                      {percentage}%
                                    </span>
                                  </div>
                                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-150 flex">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        isObras ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                                      )}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[9px] font-mono text-gray-500 leading-none">
                                    <span>Obtido: <strong>R$ {currentRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                                    <span>Alvo: R$ {currentGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                                  </div>
                                </div>
                                
                                <div className="bg-white/85 p-2 rounded-2xl flex items-center justify-between border border-gray-100">
                                  <span className="text-[9px] font-mono text-gray-400 truncate select-all">{campaignUrl}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(campaignUrl);
                                      alert(`Link da Campanha ${c.title} copiado com sucesso!`);
                                    }}
                                    className="text-[9px] font-black text-indigo-600 uppercase hover:underline ml-2 cursor-pointer shrink-0"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                              {/* Edit details form */}
                              <div className="pt-3 border-t border-gray-100 space-y-2 text-[10px] font-bold text-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] text-gray-400 capitalize shrink-0 font-black">Link Mode:</span>
                                  <button
                                    onClick={() => {
                                      const updated: DonationCampaign[] = donationCampaigns.map((camp, idx) => 
                                        idx === i ? { ...camp, mode: (camp.mode === 'internal' ? 'external' : 'internal') as 'internal' | 'external' } : camp
                                      );
                                      setDonationCampaigns(updated);
                                      localStorage.setItem('admin_donation_campaigns', JSON.stringify(updated));
                                    }}
                                    className="bg-white px-2 py-0.5 rounded border border-gray-250 text-[8px] cursor-pointer hover:bg-gray-50 uppercase"
                                  >
                                    Mudar para {c.mode === 'internal' ? 'Link Externo' : 'Página Segura'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[8px] text-gray-400 block mb-0.5 font-bold uppercase">Meta (R$)</label>
                                    <input 
                                      type="number"
                                      value={c.goalAmount ?? (isObras ? 10000 : 25000)}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const updated: DonationCampaign[] = donationCampaigns.map((camp, idx) => 
                                          idx === i ? { ...camp, goalAmount: val } : camp
                                        );
                                        setDonationCampaigns(updated);
                                        localStorage.setItem('admin_donation_campaigns', JSON.stringify(updated));
                                      }}
                                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] outline-none font-semibold text-gray-700 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-gray-400 block mb-0.5 font-bold uppercase">Arrecadado (R$)</label>
                                    <input 
                                      type="number"
                                      value={c.raisedAmount ?? (isObras ? 6250 : 18400)}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        const updated: DonationCampaign[] = donationCampaigns.map((camp, idx) => 
                                          idx === i ? { ...camp, raisedAmount: val } : camp
                                        );
                                        setDonationCampaigns(updated);
                                        localStorage.setItem('admin_donation_campaigns', JSON.stringify(updated));
                                      }}
                                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] outline-none font-semibold text-gray-700 font-mono"
                                    />
                                  </div>
                                </div>

                                {c.mode === 'external' ? (
                                  <div>
                                    <label className="text-[8px] text-gray-400 block mb-0.5 font-bold">Checkout Externo (Stripe/PayPal):</label>
                                    <input 
                                      type="text"
                                      placeholder="https://checkout.stripe.com/..."
                                      value={c.externalUrl || ''}
                                      onChange={(e) => {
                                        const updated: DonationCampaign[] = donationCampaigns.map((camp, idx) => 
                                          idx === i ? { ...camp, externalUrl: e.target.value } : camp
                                        );
                                        setDonationCampaigns(updated);
                                        localStorage.setItem('admin_donation_campaigns', JSON.stringify(updated));
                                      }}
                                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-gray-400 leading-normal">
                                    🟢 Integrada ao caixa. Doações online auditadas e aprovadas entram instantaneamente neste termômetro.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      </div>

                      {/* Pending Public donation notifications list */}
                      <div className="pt-4 border-t border-gray-150 space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center justify-between">
                          <span>Avisos de Doações Recebidas via Portal Público</span>
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[9px] font-mono lowercase">
                            {onlineDonations.length} notificações
                          </span>
                        </h4>

                        <div className="border border-gray-100 rounded-3xl overflow-hidden divide-y divide-gray-100">
                          {onlineDonations.length === 0 ? (
                            <div className="p-6 text-center text-[11px] text-gray-400 bg-gray-50/20">
                              Nenhuma pendência de auditoria de doações recebidas pelo site. 
                            </div>
                          ) : (
                            onlineDonations.map((d: any) => (
                              <div key={d.id} className={cn(
                                "p-3.5 flex items-center justify-between text-xs transition-colors",
                                d.status === 'Aprovada' ? 'bg-gray-50/30' : 'bg-emerald-50/15'
                              )}>
                                <div className="space-y-1 truncate pr-2">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-black text-gray-800 truncate">{d.donorName}</h5>
                                    <span className="text-[8px] text-gray-400 font-semibold truncate font-mono">({d.donorEmail})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold font-mono">
                                    <span className="text-emerald-600 font-bold">R$ {parseFloat(d.amount).toFixed(2)}</span>
                                    <span>•</span>
                                    <span>Campanha: {d.campaign}</span>
                                    <span>•</span>
                                    <span>{d.method}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {d.status === 'Aprovada' ? (
                                    <span className="text-emerald-600 bg-emerald-50 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                      ✓ Aprovada
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          if (!window.confirm(`Deseja aprovar e efetivar essa doação voluntária de R$ ${parseFloat(d.amount).toFixed(2)} no fluxo de caixa real?`)) return;

                                          // 1. Add as transaction
                                          const newTx: FinancialTransaction = {
                                            id: `TX:${Date.now()}`,
                                            date: new Date().toISOString().split('T')[0],
                                            type: 'ENTRADA',
                                            category: 'Doação',
                                            description: `Doação Portal - ${d.donorName} (${d.campaign})`,
                                            amount: parseFloat(d.amount),
                                            amountEstimated: parseFloat(d.amount),
                                            amountRealized: parseFloat(d.amount),
                                            status: 'Recebido',
                                            paymentMethod: d.method === 'PIX' ? 'Pix' : 'Boleto'
                                          };

                                          const updatedTx = [newTx, ...transactions];
                                          saveTransactionsToStorage(updatedTx);

                                          // 2. Mark donation as Approved
                                          const updatedList = onlineDonations.map((item: any) => {
                                            if (item.id === d.id) {
                                              return { ...item, status: 'Aprovada' };
                                            }
                                            return item;
                                          });
                                          setOnlineDonations(updatedList);
                                          localStorage.setItem('admin_pending_donations', JSON.stringify(updatedList));

                                          // 3. Update corresponding Campaign Raised Thermometer balance
                                          const isReforma = (d.campaign || '').toLowerCase().includes('reforma') || (d.campaign || '').toLowerCase().includes('manutenção');
                                          const matchedCampaignId = isReforma ? 'reforma' : 'obrassociais';
                                          const updatedCampaigns = donationCampaigns.map(camp => {
                                            if (camp.id === matchedCampaignId) {
                                              const defaultGoal = camp.id === 'obrassociais' ? 10000 : 25000;
                                              const defaultRaised = camp.id === 'obrassociais' ? 6250 : 18400;
                                              const updatedRaised = (camp.raisedAmount ?? defaultRaised) + parseFloat(d.amount);
                                              return { ...camp, raisedAmount: updatedRaised };
                                            }
                                            return camp;
                                          });
                                          setDonationCampaigns(updatedCampaigns);
                                          localStorage.setItem('admin_donation_campaigns', JSON.stringify(updatedCampaigns));

                                          alert('Doação auditada e lançada com sucesso no Fluxo de Caixa real! O termômetro da campanha correspondente foi atualizado.');
                                        }}
                                        className="bg-indigo-600 hover:bg-emerald-600 text-white text-[9px] px-2 py-1 rounded-lg font-black uppercase uppercase transition-all cursor-pointer"
                                      >
                                        Aprovar & Lançar
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          if (!window.confirm('Excluir aviso de doação? Realizada sem compensação.')) return;
                                          const filtered = onlineDonations.filter((item: any) => item.id !== d.id);
                                          setOnlineDonations(filtered);
                                          localStorage.setItem('admin_pending_donations', JSON.stringify(filtered));
                                        }}
                                        className="p-1 px-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isAdministrativo && adminTab === 'pos_bazar' && (
          <motion.div
            key="pos-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            {/* Split screen: left col-8 with POS/Stock, right col-4 with shopping checkout cart & suppliers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* POS and Stock Lists (Col-8) */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Frente de Caixa (PDV) Register Interface */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  {/* Banner CTA para o PDV Simplificado */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-5 border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-indigo-950 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-base">⚡</span> Tela Operacional de Vendas Otimizada
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-550 font-medium">
                        Criamos uma frente de caixa dedicada em tela cheia, ideal para quem opera as vendas diárias da livraria, bazar ou cantina com rapidez máxima.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/vendas')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      <ShoppingCart size={14} />
                      <span>Ir para Frente de Caixa (PDV)</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-50 pt-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600" size={20} />
                        Frente de Caixa (PDV)
                      </h2>
                      <p className="text-xs text-gray-400 font-medium">Faturamento imediato de lanches, livros e peças do bazar beneficente.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-black">
                        <button 
                          onClick={() => setPosCategory('ALL')} 
                          className={cn("px-2.5 py-1 rounded-lg uppercase", posCategory === 'ALL' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                        >
                          Tudo
                        </button>
                        <button 
                          onClick={() => setPosCategory('LIVRARIA')} 
                          className={cn("px-2.5 py-1 rounded-lg uppercase", posCategory === 'LIVRARIA' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                        >
                          Livros
                        </button>
                        <button 
                          onClick={() => setPosCategory('CANTINA')} 
                          className={cn("px-2.5 py-1 rounded-lg uppercase", posCategory === 'CANTINA' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                        >
                          Cantina
                        </button>
                        <button 
                          onClick={() => setPosCategory('BAZAR')} 
                          className={cn("px-2.5 py-1 rounded-lg uppercase", posCategory === 'BAZAR' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400")}
                        >
                          Bazar
                        </button>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Search size={12} className="text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Pesquisar item..." 
                          value={posSearch}
                          onChange={e => setPosSearch(e.target.value)}
                          className="bg-transparent text-[10px] font-bold outline-none w-28" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Products visual grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products
                      .filter(p => posCategory === 'ALL' || p.category === posCategory)
                      .filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()))
                      .map(p => {
                        const lowStock = p.stock <= p.minLimit;
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => addToCart(p)}
                            className={cn(
                              "p-4 bg-gray-50 border border-transparent rounded-3xl hover:border-indigo-500/20 hover:bg-indigo-50/20 transition-all cursor-pointer group flex flex-col justify-between h-40",
                              p.stock === 0 ? "opacity-60 pointer-events-none" : ""
                            )}
                          >
                            <div className="space-y-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                p.category === 'LIVRARIA' ? "bg-indigo-50 text-indigo-600" :
                                p.category === 'CANTINA' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {p.category}
                              </span>
                              <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 mt-2 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                            </div>

                            <div className="flex items-end justify-between mt-2 border-t border-gray-100/50 pt-2">
                              <div>
                                <p className="text-[10px] font-medium text-gray-400">Preço Venda</p>
                                <p className="font-black text-gray-900 text-sm">R$ {p.price.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <span className={cn(
                                  "text-[10px] font-black uppercase",
                                  lowStock ? "text-amber-600 animate-pulse" : "text-gray-400"
                                )}>
                                  Estoque: {p.stock} UNI
                                </span>
                              </div>
                            </div>
                          </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extended Inventory Stock Administration List (transparência de Kardec) */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic flex items-center gap-2">
                      <Package className="text-indigo-600" size={20} />
                      Controle Consolidado de Estoque
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">Controle de limites mínimos para Obras Básicas de Allan Kardec e validades da cantina.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-black uppercase tracking-wider text-[9px]">
                          <th className="py-4 px-2">Produto / Item</th>
                          <th className="py-4 px-2">Categoria</th>
                          <th className="py-4 px-2">Preço Un.</th>
                          <th className="py-4 px-2 text-center">Quant.</th>
                          <th className="py-4 px-2 text-center">Lim. Mín.</th>
                          <th className="py-4 px-2 text-center">Status Alerta</th>
                          <th className="py-4 px-2 text-center">Ajustar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                        {products.map(p => {
                          const isLowStock = p.stock <= p.minLimit;
                          let expiredStatus = '';
                          if (p.expirationDate && p.category === 'CANTINA') {
                            const exp = new Date(p.expirationDate);
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            if (exp < today) expiredStatus = 'EXPIRED';
                            else {
                              const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays <= 3) expiredStatus = 'WARNING';
                            }
                          }

                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-2 font-bold text-gray-900 max-w-[180px] truncate" title={p.name}>{p.name}</td>
                              <td className="py-4 px-2 font-semibold text-gray-500">{p.category}</td>
                              <td className="py-4 px-2 font-extrabold text-indigo-600">R$ {p.price.toFixed(2)}</td>
                              <td className="py-4 px-2 text-center font-black">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-xs",
                                  isLowStock ? "bg-amber-50 text-amber-700 font-extrabold" : "bg-gray-50 text-gray-800"
                                )}>
                                  {p.stock}
                                </span>
                              </td>
                              <td className="py-4 px-2 text-center font-semibold text-gray-400">{p.minLimit}</td>
                              <td className="py-4 px-2 text-center">
                                {/* Warnings badges */}
                                <div className="flex flex-col items-center gap-1 justify-center">
                                  {isLowStock && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse-slow">
                                      {p.stock === 0 ? 'ZEB/ESGOTADO' : 'BAIXO ESTOQUE'}
                                    </span>
                                  )}
                                  {expiredStatus === 'EXPIRED' && (
                                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">
                                      VENCIDO (Retirar)
                                    </span>
                                  )}
                                  {expiredStatus === 'WARNING' && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest leading-none">
                                      Vencimento Próximo
                                    </span>
                                  )}
                                  {!isLowStock && !expiredStatus && (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                                      Estável
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2 text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  <button 
                                    onClick={() => handleAjustarEstoque(p.id, -1)}
                                    className="p-1 hover:bg-gray-150 text-gray-400 hover:text-gray-900 rounded-lg border border-gray-100 bg-white shadow-sm"
                                  >
                                    <Minus size={11} />
                                  </button>
                                  <button 
                                    onClick={() => handleAjustarEstoque(p.id, 1)}
                                    className="p-1 hover:bg-gray-150 text-gray-400 hover:text-gray-900 rounded-lg border border-gray-100 bg-white shadow-sm"
                                  >
                                    <Plus size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add manual product form */}
                  <form onSubmit={handleCreateProduct} className="pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome Completo do Item</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Livro Nosso Lar (Chico)" 
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Gênero</label>
                      <select 
                        value={newProdCategory} 
                        onChange={e => setNewProdCategory(e.target.value as 'LIVRARIA' | 'CANTINA' | 'BAZAR')}
                        className="w-full mt-1.5 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700"
                      >
                        <option value="LIVRARIA">Livraria</option>
                        <option value="CANTINA">Cantina</option>
                        <option value="BAZAR">Bazar</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Unidade Preço</label>
                      <input 
                        type="number" 
                        step="0.05" 
                        required 
                        placeholder="R$ 15.00" 
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estoq. In.</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="10" 
                        value={newProdStock}
                        onChange={e => setNewProdStock(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" 
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Alerta Mín</label>
                      <input 
                        type="number" 
                        required 
                        value={newProdMin}
                        onChange={e => setNewProdMin(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" 
                      />
                    </div>

                    {newProdCategory === 'CANTINA' && (
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data de Vencimento</label>
                        <input 
                          type="date"
                          value={newProdExp}
                          onChange={e => setNewProdExp(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none text-xs font-bold text-gray-700" 
                        />
                      </div>
                    )}

                    <div className={cn("sm:col-span-3 flex items-end", newProdCategory === 'CANTINA' ? "" : "sm:col-span-12")}>
                      <button 
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md"
                      >
                        Salvar Item
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* POS Cart Sidebar and Supplier Management (Col-4) */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Active Checkout Basket */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <h3 className="font-black text-gray-900 uppercase text-sm italic flex items-center gap-2">
                      <ShoppingCart className="text-emerald-500" size={16} />
                      Sacola do Atendido
                    </h3>
                    <span className="px-2.5 py-1 bg-gray-50 rounded-full font-black text-[10px] uppercase tracking-wider text-gray-400">
                      {cart.reduce((acc, c) => acc + c.quantity, 0)} Itens
                    </span>
                  </div>

                  {cart.length > 0 ? (
                    <div className="space-y-4">
                      {/* Cart grid list */}
                      <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                        {cart.map(c => (
                          <div key={c.product.id} className="py-3 flex items-center justify-between gap-3 text-xs font-medium">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate leading-snug">{c.product.name.split(':')[0]}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">R$ {c.product.price.toFixed(2)} cada</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                <button 
                                  onClick={() => updateCartQty(c.product.id, -1)}
                                  className="p-0.5 hover:bg-gray-150 rounded"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="font-extrabold text-[11px] px-1 text-gray-800">{c.quantity}</span>
                                <button 
                                  onClick={() => updateCartQty(c.product.id, 1)}
                                  className="p-0.5 hover:bg-gray-150 rounded"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>

                              <button 
                                onClick={() => removeFromCart(c.product.id)}
                                className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment and Checkout summary */}
                      <div className="bg-gray-50 p-4 rounded-3xl space-y-3 font-bold text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Subtotal dos Itens:</span>
                          <span className="text-gray-900">R$ {cart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0).toFixed(2)}</span>
                        </div>

                        <div className="h-px bg-gray-100 w-full" />

                        {/* Payment method */}
                        <div>
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Canal de Recebimento</label>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] font-black">
                            <button 
                              type="button"
                              onClick={() => setPosPaymentMethod('PIX')}
                              className={cn("py-1.5 rounded-lg border text-center transition-all", posPaymentMethod === 'PIX' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200")}
                            >
                              PIX
                            </button>
                            <button 
                              type="button"
                              onClick={() => setPosPaymentMethod('DINHEIRO')}
                              className={cn("py-1.5 rounded-lg border text-center transition-all", posPaymentMethod === 'DINHEIRO' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200")}
                            >
                              DINHEIRO
                            </button>
                            <button 
                              type="button"
                              onClick={() => setPosPaymentMethod('CARTÃO')}
                              className={cn("py-1.5 rounded-lg border text-center transition-all", posPaymentMethod === 'CARTÃO' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200")}
                            >
                              CARTÃO
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-gray-400 font-black text-[13px] uppercase italic">Total Líquido:</span>
                          <span className="text-xl font-black text-indigo-600">
                            R$ {cart.reduce((acc, c) => acc + (c.product.price * c.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handlePOSCheckout}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase font-black tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-50"
                      >
                        Confirmar e Emitir Recibo
                      </button>
                      <button 
                        onClick={() => setCart([])}
                        className="w-full text-center text-gray-400 font-bold text-[10px] underline uppercase hover:text-rose-600 transition-colors"
                      >
                        Esvaziar Sacola
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-300 space-y-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-100">
                        <ShoppingCart size={28} className="text-gray-100" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 leading-snug">Seu caixa está livre para faturamento.</p>
                    </div>
                  )}
                </div>

                {/* Supplier Purchasing panel (Logistics / Editoras) */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider italic flex items-center gap-1.5">
                      <Truck className="text-indigo-600" size={16} />
                      Reposição & Fornecedores
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">Lançamento de mercadorias adquiridas diretamente junto às editoras espíritas.</p>
                  </div>

                  <form onSubmit={handleBuyFromSupplier} className="space-y-3 text-xs">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Editora / Fornecedor</label>
                      <select 
                        value={buySupplier} 
                        onChange={e => setBuySupplier(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-gray-50 rounded-xl outline-none font-bold text-gray-700"
                      >
                        {suppliers.map((s, idx) => (
                          <option key={idx} value={s.name}>{s.name} ({s.location})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nome do Livro ou Produto</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Livro O Céu e o Inferno" 
                        value={buyProdName}
                        onChange={e => setBuyProdName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none font-bold text-gray-700" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Quant.</label>
                        <input 
                          type="number" 
                          required 
                          placeholder="Comp. 20" 
                          value={buyQty}
                          onChange={e => setBuyQty(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none font-bold text-gray-700" 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Custo Un (R$)</label>
                        <input 
                          type="number" 
                          step="0.05" 
                          required 
                          placeholder="R$ 20.00" 
                          value={buyPrice}
                          onChange={e => setBuyPrice(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl outline-none font-bold text-gray-700" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Categoria de Estoque</label>
                      <select 
                        value={buyCategory} 
                        onChange={e => setBuyCategory(e.target.value as 'LIVRARIA' | 'CANTINA' | 'BAZAR')}
                        className="w-full mt-1.5 px-3 py-2 bg-gray-50 rounded-xl outline-none font-bold text-gray-700"
                      >
                        <option value="LIVRARIA">Livraria</option>
                        <option value="CANTINA">Cantina</option>
                        <option value="BAZAR">Bazar</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest rounded-2xl transition-all"
                    >
                      Processar Nota de Compra
                    </button>
                  </form>

                  {/* Procurement History list */}
                  {supplierHistory.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Últimos Pedidos</span>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {supplierHistory.map(log => (
                          <div key={log.id} className="p-2.5 bg-gray-50 rounded-xl text-[10px] leading-relaxed">
                            <p className="font-bold text-gray-800">{log.supplier} &rarr; {log.quantity}x {log.product}</p>
                            <div className="flex justify-between text-[8.5px] text-gray-400 font-semibold mt-1">
                              <span>Total: R$ {log.cost.toFixed(2)}</span>
                              <span>{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Banco do Brasil Official Boleto Slip Modal Rendering */}
      {viewingBoleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-3xl w-full p-8 shadow-2xl space-y-6 relative border border-gray-105 my-8 animate-in zoom-in-95 duration-250">
            
            {/* Header Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Barcode size={24} className="text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Ficha de Compensação Bancária</h3>
                  <p className="text-[9.5px] text-gray-400 font-semibold uppercase tracking-wider">Associação Espírita Mirante de Luz</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingBoleto.barcode);
                    alert('Código de Barras Copiado para Área de Transferência!');
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase cursor-pointer"
                >
                  Copiar Linha Digitável
                </button>
                <button
                  onClick={() => setViewingBoleto(null)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  ← Voltar
                </button>
              </div>
            </div>

            {/* Simulated Official Boleto Form */}
            <div className="border border-black text-[9px] font-mono leading-none bg-white font-sans text-gray-850 p-2 space-y-1.5">
              
              {/* Slip Row 1: Bank Logo and Code */}
              <div className="flex items-center border-b-2 border-black pb-1">
                <div className="pr-4 border-r-2 border-black flex items-center font-bold text-sm tracking-tighter">
                  <span className="text-indigo-600 mr-1 font-black italic">BB</span>
                  <span>BANCO DO BRASIL S.A.</span>
                </div>
                <div className="px-3 pr-4 border-r-2 border-black font-black text-xs leading-none">
                  001-9
                </div>
                <div className="pl-4 font-bold text-[11px] leading-none text-gray-800 tracking-wider flex-1 text-right">
                  {viewingBoleto.barcode}
                </div>
              </div>

              {/* Slip Row 2: Local de pagamento vs Vencimento */}
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-9 border-r border-black p-1 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Local de Pagamento</span>
                  <span className="font-bold text-gray-800 text-[10px]">PAGÁVEL EM QUALQUER BANCO OU CASA LOTÉRICA ATÉ O VENCIMENTO.</span>
                </div>
                <div className="col-span-3 p-1 bg-gray-50 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Vencimento</span>
                  <span className="font-black text-gray-900 text-[10px] block text-right">
                    {new Date(viewingBoleto.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Slip Row 3: Beneficiário vs Agência/Código */}
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-9 border-r border-black p-1 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Beneficiário</span>
                  <span className="font-bold text-gray-800 text-[9.5px]">
                    ASSOCIACAO ESPIRITA MIRANTE DE LUZ - CNPJ: 14.238.112/0001-90
                  </span>
                </div>
                <div className="col-span-3 p-1 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Agência/Código Beneficiário</span>
                  <span className="font-bold text-gray-800 text-[9.5px] block text-right">0984-1 / 18526-9</span>
                </div>
              </div>

              {/* Slip Row 4: Datas and document identification */}
              <div className="grid grid-cols-12 border-b border-black text-[8px]">
                <div className="col-span-2 border-r border-black p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Data Doc.</span>
                  <span className="font-semibold text-gray-800">22/05/2026</span>
                </div>
                <div className="col-span-3 border-r border-black p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Nº Documento</span>
                  <span className="font-bold text-gray-800">BOL-{viewingBoleto.id.split(':')[1] || '0825'}</span>
                </div>
                <div className="col-span-1 border-r border-black p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Espécie</span>
                  <span className="font-semibold text-gray-800">DS</span>
                </div>
                <div className="col-span-1 border-r border-black p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Aceite</span>
                  <span className="font-semibold text-gray-800">N</span>
                </div>
                <div className="col-span-2 border-r border-black p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Data Proc.</span>
                  <span className="font-semibold text-gray-800">22/05/2026</span>
                </div>
                <div className="col-span-3 p-1.5 space-y-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Nosso Número</span>
                  <span className="font-bold text-gray-800 block text-right">17/1852694-1</span>
                </div>
              </div>

              {/* Slip Row 5: Cards / Financial metrics */}
              <div className="grid grid-cols-12 border-b border-black text-[8px]">
                <div className="col-span-3 border-r border-black p-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Uso do Banco</span>
                </div>
                <div className="col-span-2 border-r border-black p-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Carteira</span>
                  <span className="font-bold">17</span>
                </div>
                <div className="col-span-1 border-r border-black p-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Espécie</span>
                  <span className="font-bold">R$</span>
                </div>
                <div className="col-span-3 border-r border-black p-1">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Quantidade</span>
                  <span className="font-semibold">1</span>
                </div>
                <div className="col-span-3 bg-gray-50 p-1 space-y-0.5">
                  <span className="text-[7.5px] font-bold text-gray-400 block uppercase">(=) Valor do Documento</span>
                  <span className="font-black text-gray-900 text-[10px] block text-right">
                    R$ {viewingBoleto.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Slip Row 6: Instructions to Box Cashier */}
              <div className="grid grid-cols-12 border-b border-black">
                <div className="col-span-9 border-r border-black p-2 space-y-2 text-[8.5px] leading-relaxed">
                  <div>
                    <span className="text-[7.5px] font-bold text-gray-400 block uppercase">Instruções de Responsabilidade</span>
                    <p className="font-bold text-gray-800">
                      I - CONTRIBUIÇÃO DE MEMBRO COOPERADOR - PROPÓSITO ASSISTENCIAL SEM FINS LUCRATIVOS
                    </p>
                    <p className="text-gray-605">
                      • Não cobrar multa de mora após o vencimento. Permitido o recebimento em atraso sem acréscimos.
                    </p>
                    <p className="text-gray-605">
                      • Isento de protesto cartorário conforme disposições estatutárias da casa Mirante de Luz.
                    </p>
                  </div>
                  <p className="italic text-gray-500 font-bold border-t border-gray-100 pt-1">
                    "Fora da caridade não há salvação." - Allan Kardec
                  </p>
                </div>
                
                <div className="col-span-3 divide-y divide-black">
                  <div className="p-1 space-y-0.5">
                    <span className="text-[7.5px] font-bold text-gray-400 block uppercase">(-) Descontos</span>
                  </div>
                  <div className="p-1 space-y-0.5">
                    <span className="text-[7.5px] font-bold text-gray-400 block uppercase">(=) Valor Cobrado</span>
                  </div>
                </div>
              </div>

              {/* Slip Row 7: Sacado (Donor Person Info) */}
              <div className="p-2 space-y-1">
                <div className="flex justify-between font-bold text-gray-800 text-[9px]">
                  <span>PAGADOR: {viewingBoleto.name}</span>
                  <span>CPF/CNPJ: ***.***.***-**</span>
                </div>
                <p className="text-gray-500 text-[8.2px]">RUA DA FRATERNIDADE, 120 - CENTRO - MONTES CLAROS/MG - CEP: 39400-000</p>
                <div className="flex justify-between text-[7.5px] font-bold text-gray-400 pt-1">
                  <span>SACADOR/AVALISTA: ASSOCIAÇÃO ESPÍRITA MIRANTE DE LUZ</span>
                  <span>Autenticação Mecânica - Ficha de Compensação</span>
                </div>
              </div>

              {/* Symmetrical lines representing an official Febraban barcode layout */}
              <div className="pt-3 pb-1 border-t border-dashed border-gray-300">
                <div className="flex gap-0.5 items-stretch h-11 bg-white">
                  {/* Visual simulated representation of physical bank bar bands */}
                  {Array.from({ length: 90 }).map((_, i) => {
                    const widthClass = i % 7 === 0 ? 'w-1.5' : i % 4 === 0 ? 'w-1' : i % 3 === 0 ? 'w-[0.5px]' : 'w-[2px]';
                    const colorClass = i % 5 === 0 ? 'bg-transparent' : 'bg-black';
                    return <div key={i} className={cn("h-full", widthClass, colorClass)} />;
                  })}
                </div>
                <div className="text-center font-bold text-[8.5px] font-mono text-gray-700 mt-1 uppercase tracking-widest">
                  Código de Barras Febraban para Leitura Óptica
                </div>
              </div>

            </div>

            {/* Note to operator */}
            <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 text-[11px] leading-relaxed text-amber-800">
              <span className="text-base">ℹ️</span>
              <div>
                <span className="font-bold block">Status do Boleto: {viewingBoleto.status === 'Compensado' ? '🟢 LIQUIDADO / COMPENSADO' : '🟡 PENDENTE'}</span>
                {viewingBoleto.status === 'Pendente' ? (
                  <p>Este boleto está aguardando pagamento do sócio. Se o sócio pagar em mãos ou via PIX, clique em <strong className="underline">COMPENSAR</strong> na listagem para lançar como dinheiro real do caixa.</p>
                ) : (
                  <p>O boleto já está compensado! O valor correspondente de <strong>R$ {viewingBoleto.amount.toFixed(2)}</strong> foi somado e creditado na planilha de lançamentos contábeis.</p>
                )}
              </div>
            </div>

            {/* Bottom Back Button */}
            <div className="flex items-center justify-end border-t border-gray-100 pt-4">
              <button
                onClick={() => setViewingBoleto(null)}
                className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-[18px] transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                ← Voltar para Painel de Cobranças
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modern animated transaction delete confirmation modal */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-6 relative border border-gray-100"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Confirmar Exclusão</h3>
                  <p className="text-xs text-gray-400 font-semibold uppercase mt-0.5 tracking-wider">Lançamento de Livro Caixa</p>
                </div>
              </div>

              {/* Transaction details card */}
              <div className="bg-gray-50 rounded-2xl p-4.5 border border-gray-100 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-b border-gray-100 pb-3 text-left">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Data</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {txToDelete.date ? new Date(txToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block text-right">Natureza</span>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase mt-0.5 ${
                        txToDelete.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-650'
                      }`}>
                        {txToDelete.type}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Descrição</span>
                    <span className="font-bold text-gray-850">{txToDelete.description}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Categoria</span>
                    <span className="font-semibold text-gray-800">{txToDelete.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Valor</span>
                    <span className="font-extrabold text-indigo-650 text-sm">
                      R$ {parseFloat(String(txToDelete.amountRealized ?? txToDelete.amount ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-500 font-semibold text-[10px] leading-relaxed text-center">
                  Atenção: Ao excluir este lançamento contábil, ele será removido permanentemente de todas as prestações de contas e relatórios financeiros associados. Esta operação não poderá ser desfeita.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTransaction}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-750 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-100 hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Pop-up Window for Sub-Sector/Sector Information */}
      <AnimatePresence>
        {infoModalSector && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoModalSector(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl bg-[#F8FAFC] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 z-10"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4.5">
                  <div className="w-14 h-14 bg-white/10 rounded-[22px] flex items-center justify-center text-indigo-200">
                    {(() => {
                      const SubIcon = getSubSectorIcon(infoModalSector.name);
                      return <SubIcon size={28} />;
                    })()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/5">
                        Ficha do Regimento Interno
                      </span>
                      {infoModalSector.parentSectorId && (
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/5">
                          Sub-setor Vinculado
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight">{formatSectorName(infoModalSector.name)}</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoModalSector(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors group cursor-pointer"
                >
                  <X size={24} className="text-gray-300 group-hover:text-white" />
                </button>
              </div>

              {/* Scrollable Container with Ficha Details */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-8 select-none">
                
                {/* 1. Direção e Organização Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4 text-left">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Users size={14} className="text-indigo-500" /> Coordenação e Gestão
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Coordenador(a)</span>
                        <p className="font-bold text-gray-800 text-sm">{infoModalSector.coordinator || 'A definir'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Subcoordenador(a)</span>
                        <p className="font-bold text-gray-800 text-sm">{infoModalSector.subcoordinator || 'Não definido'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Secretário(a)</span>
                        <p className="font-bold text-gray-800 text-sm">{infoModalSector.secretary || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4 text-left">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Clock size={14} className="text-indigo-500" /> Horários e Frequência
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Dia / Horário de Escala</span>
                        <p className="font-bold text-gray-800 text-sm">{infoModalSector.schedule || 'A acordar nas reuniões'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Periodicidade de Reuniões</span>
                        <p className="font-bold text-gray-800 text-sm">{infoModalSector.meetingFrequency || 'Mensal / Bimestral'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4 text-left">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                       <MapPin size={14} className="text-indigo-500" /> Espaço e Hierarquia
                    </h3>
                    <div className="space-y-3 text-xs">
                       <div>
                         <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Localização Física</span>
                         <p className="font-bold text-gray-800 text-sm">{infoModalSector.location || 'Consultar Diretoria'}</p>
                       </div>
                       <div>
                         <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Filiação / Reporta-se a</span>
                         <p className="font-bold text-gray-800 text-sm">
                           {infoModalSector.parentSectorId ? 'Setor Administrativo Principal' : infoModalSector.reportsTo || 'Diretoria Executiva'}
                         </p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* 2. Diretrizes e Base Doutrinária */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 flex items-center gap-2.5 border-b border-gray-50 pb-3">
                      <BookOpen size={18} className="text-indigo-500" />
                      1. Missão e Fundamentação
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Missão / Objetivo Geral</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.mission || infoModalSector.description || 'Cumprir as metas de apoio, zelo e organização conforme a caridade.'}
                        </p>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Base Doutrinária / Normas</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.foundation || 'Obras básicas e postulados doutrinários espíritas que orientam as atividades da Casa de modo fraterno.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 flex items-center gap-2.5 border-b border-gray-50 pb-3">
                      <Users size={18} className="text-indigo-500" />
                      2. Equipe e Perfil do Trabalhador
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Perfil Recomendado</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.workerProfile || 'Comprometimento, tolerância, respeito mútuo, simpatia com a causa, discrição e assiduidade.'}
                        </p>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Fluxo / Requisitos de Ingresso</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.entryFlow || 'Treinamento específico prévio, preenchimento do termo de voluntariado e entrevista com a coordenação.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Atividades e Planejamento */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 flex items-center gap-2.5 border-b border-gray-50 pb-3">
                    <Activity size={18} className="text-indigo-500" />
                    3. Atividades Principais e Cooperação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Principais Atividades Atribuídas</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.mainActivities || 'Acompanhamento de rotinas operacionais, relatórios periódicos e acolhimento geral dos frequentadores.'}
                        </p>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Apoio e Recursos Necessários</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.resources || 'Sistemas integrados do Mirante, infraestrutura e cooperação direta com os demais coordenadores.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Integrações / Relação Intersetorial</span>
                        <p className="text-xs sm:text-sm text-gray-650 leading-relaxed font-semibold">
                          {infoModalSector.interactions || 'Trabalho mútuo e canal direto de comunicação com todos os setores da Instituição.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                            <Target size={10} className="text-emerald-500" /> Metas Principais
                          </span>
                          <p className="text-xs text-gray-600 font-semibold leading-normal">
                            {infoModalSector.goals || 'Excelência nas rotinas administrativas e bem-estar geral.'}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                            <AlertTriangle size={10} className="text-amber-500" /> Desafios Regulares
                          </span>
                          <p className="text-xs text-gray-600 font-semibold leading-normal">
                            {infoModalSector.challenges || 'Gerenciamento de voluntários assíduos e recursos.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Documentos Digitais Relacionados */}
                <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4 text-left">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                     <FileText size={14} className="text-indigo-500" /> Documentação e Arquivos Catalogados ({infoModalSector.documents?.length || 0})
                  </h3>
                  
                  {infoModalSector.documents && infoModalSector.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {infoModalSector.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 uppercase text-[10px]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white text-indigo-600 rounded-xl">
                              <FileText size={16} />
                            </div>
                            <div className="text-left">
                              <span className="font-extrabold text-gray-805 block truncate max-w-[200px]">{doc.name}</span>
                              <span className="font-sans font-medium text-[8px] text-gray-450 block tracking-wider mt-px">Por {doc.uploadedBy}</span>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-950 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                          >
                            <Download size={14} />
                            <span>Abrir</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-2xl text-center text-xs text-gray-400 font-bold uppercase italic tracking-wider">
                      Sem documentos PDF anexados a este regimento.
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Action Footer */}
              <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-sans font-bold text-[10px] text-indigo-400 uppercase tracking-widest">
                  Mirante de Luz — Gestão Organizacional
                </span>
                <button
                  type="button"
                  onClick={() => setInfoModalSector(null)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Detail View Modal */}
      <AnimatePresence>
        {qrModalOpen && qrModalItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative border border-gray-100 flex flex-col items-center text-center space-y-6"
            >
              {/* Outer header details */}
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                  Etiqueta de Ativo Patrimonial
                </span>
                <h3 className="text-base font-black text-gray-900 mt-3 truncate max-w-[280px]">
                  {qrModalItem.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                  ID: {qrModalItem.id}
                </p>
              </div>

              {/* QR Container Frame */}
              <div id="printable-qr-label" className="p-4 bg-white border-2 border-indigo-150 rounded-2xl shadow-inner flex flex-col items-center bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assetId=" + qrModalItem.id)}`}
                  alt={`QR Code ${qrModalItem.name}`}
                  referrerPolicy="no-referrer"
                  className="w-40 h-40 object-contain block bg-white"
                />
                <div className="text-[9px] font-black uppercase tracking-widest mt-2 select-all font-mono text-indigo-900">
                  {qrModalItem.id}
                </div>
                {/* Meta block for thermal or adhesive printable sticker */}
                <div className="border-t border-gray-150 border-dashed pt-1.5 mt-1.5 w-full text-[8px] font-bold text-gray-550 uppercase tracking-widest flex justify-between gap-4 font-sans">
                  <span>Local: {qrModalItem.location}</span>
                  <span>Cat: {qrModalItem.category}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[280px]">
                Imprima esta etiqueta e cole no ativo patrimonial. Qualquer trabalhador poderá escanear a etiqueta para consultar ou atualizar a conservação.
              </p>

              {/* Simple action row */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalOpen(false);
                    setQrModalItem(null);
                  }}
                  className="py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Quick thermal simulated stickers print trigger
                    const singleAppLink = `${window.location.origin}${window.location.pathname}?assetId=${encodeURIComponent(qrModalItem.id)}`;
                    const printwin = window.open("", "_blank");
                    if (printwin) {
                      printwin.document.write(`
                        <html>
                        <head>
                          <title>Imprimir Etiqueta Patrimonial - ${qrModalItem.name}</title>
                          <style>
                            body { font-family: 'Courier New', Courier, monospace; text-align: center; padding: 25px; margin: 0; }
                            .sticker { border: 2px dashed #000; padding: 15px; width: 280px; margin: auto; display: inline-block; page-break-inside: avoid; }
                            h2 { margin: 5px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
                            .id { font-size: 11px; letter-spacing: 1px; margin-bottom: 12px; font-weight: bold; }
                            .meta { font-size: 8px; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between; text-transform: uppercase; }
                          </style>
                        </head>
                        <body>
                          <div class="sticker">
                            <h2>${qrModalItem.name}</h2>
                            <div class="id">ID: ${qrModalItem.id}</div>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(singleAppLink)}" style="max-width: 140px; margin: auto; display: block;" />
                            <div class="meta">
                              <span>Local: ${qrModalItem.location}</span>
                              <span>Cat: ${qrModalItem.category}</span>
                            </div>
                          </div>
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                        </html>
                      `);
                      printwin.document.close();
                    } else {
                      alert("Por favor libere pop-ups para imprimir etiquetas thermal!");
                    }
                  }}
                  className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={12} />
                  Imprimir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Patrimonial Scanner & Conservation Sheet Modal */}
      <AnimatePresence>
        {scannerModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F8FAFC] rounded-[36px] max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-[#F8FAFC] z-10 font-sans">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <QrCode size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider text-left">Leitor QR de Ativos</h3>
                    <p className="text-[9px] text-gray-450 font-black uppercase mt-0.5 tracking-widest text-left">Leitura de etiquetas em tempo real</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScannerModalOpen(false);
                    setScannedItemDetail(null);
                  }}
                  className="p-1 px-2.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* No item scanned yet: show camera simulator layout */}
              {!scannedItemDetail ? (
                <div className="space-y-5 pt-4">
                  {/* Real camera view finder */}
                  <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-900 overflow-hidden flex flex-col items-center justify-center text-center p-1 shadow-inner">
                    {/* The real HTML5 Qr Code reader container */}
                    <div id="qr-reader-viewport" className="w-full h-full object-cover rounded-xl overflow-hidden" />

                    {cameraActive && (
                      <>
                        {/* Animated laser scan lines */}
                        <div className="absolute inset-x-0 h-0.5 bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.8)] top-1/4 animate-bounce duration-[2000ms] z-10 pointer-events-none" />
                        
                        {/* Target scan brackets */}
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-md z-10 pointer-events-none" />
                        <div className="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-md z-10 pointer-events-none" />
                        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-md z-10 pointer-events-none" />
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-md z-10 pointer-events-none" />
                      </>
                    )}

                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3 z-20">
                        {cameraError ? (
                          <>
                            <AlertTriangle size={32} className="text-amber-500 mx-auto" />
                            <p className="text-[11px] text-gray-200 font-extrabold uppercase tracking-widest max-w-xs">{cameraError}</p>
                            <p className="text-[9.5px] text-gray-400 max-w-xs px-2 leading-relaxed mx-auto">
                              Por favor, use a simulação de ativos abaixo para testar diretamente.
                            </p>
                          </>
                        ) : (
                          <>
                            <QrCode size={40} className="mx-auto text-indigo-400 animate-pulse" />
                            <p className="text-xs text-white font-extrabold uppercase tracking-widest animate-pulse">Iniciando câmera...</p>
                            <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed px-4 mx-auto">
                              Aguardando permissão de câmera do navegador do celular.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Interactive manual or mock lists to trigger test scanning */}
                  <div className="space-y-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Simular Leitura QR (Protótipo local)</span>
                    <p className="text-[9.5px] text-gray-400">Como estamos rodando na sandbox do navegador, escolha um ativo abaixo para simular a leitura do QR Code:</p>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 pt-1 text-left">
                      {patrimonioItems.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-4 font-bold uppercase italic">Cadastre ativos no inventário primeiro!</p>
                      ) : (
                        patrimonioItems.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleProcessScannedId(item.id)}
                            className="w-full px-3 py-2 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 hover:border-indigo-200 rounded-xl text-left text-xs font-bold text-indigo-950 flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="truncate">{item.name}</span>
                            <span className="text-[8.5px] bg-[#EEF2F6] px-1.5 py-0.5 rounded text-gray-500 font-mono italic shrink-0">Scan Code →</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Item is Scanned: Show Ficha de Conservacao details sheet */
                <div className="space-y-5 pt-4 font-sans text-left">
                  <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/40 text-xs space-y-2 text-left">
                    <p className="font-sans text-[10px] uppercase font-black tracking-widest text-indigo-600">Ficha de Conservação Técnica</p>
                    <h4 className="text-sm font-black text-gray-900">{scannedItemDetail.name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-550 font-sans uppercase mt-2 text-left">
                      <p>Local: <span className="text-gray-900 font-black">{scannedItemDetail.location}</span></p>
                      <p>Categoria: <span className="text-gray-900 font-black">{scannedItemDetail.category}</span></p>
                      <p className="col-span-2 text-left text-[10px]">Código Ativo: <span className="text-indigo-800 font-mono tracking-wider font-black">{scannedItemDetail.id}</span></p>
                    </div>
                  </div>

                  {/* Conservation status selectors */}
                  <div className="space-y-4 text-left">
                    {/* Quantity modifier inside sheet */}
                    <div className="space-y-1.5 col-span-2 text-left">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider text-left">Quantidade Atual Registrada</label>
                      <div className="flex items-center gap-4 text-left">
                        <button
                          type="button"
                          onClick={() => handleUpdateScannedItemQty(-1)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-650 rounded-xl hover:bg-gray-200 text-xs font-black transition-colors cursor-pointer"
                        >
                          - Reduzir
                        </button>
                        <span className="font-mono text-sm font-black text-gray-900 w-12 text-center bg-gray-50 border border-gray-100 rounded-xl py-1 font-extrabold">
                          {scannedItemDetail.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateScannedItemQty(1)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 text-xs font-black transition-colors cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-extrabold">Estado Geral do Item</label>
                      <select
                        value={tempConservationStatus}
                        onChange={(e) => setTempConservationStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-105 rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 transition-all text-gray-750"
                      >
                        <option value="BOM">🟢 Estado Bom (Plena Conservação)</option>
                        <option value="REGULAR">🟡 Estado Regular (Desgastes Naturais)</option>
                        <option value="EM_FALTA">🔴 Esgotado / Retirado</option>
                        <option value="PRECISANDO_REPARO">🟠 Precisando Conserto / Reparo Técnico</option>
                        <option value="DANIFICADO">💀 Danificado Irreparável (Descarte)</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider text-left">Observações Técnicas / Danos</label>
                      <textarea
                        value={tempObservation}
                        onChange={(e) => setTempObservation(e.target.value)}
                        placeholder="Ex: Cabos desgastados ou chiado canais auxiliares..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-gray-750 font-sans"
                      />
                    </div>
                  </div>

                  {/* Audit information */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left font-sans space-y-1">
                    <p>Atualizado por: <span className="text-gray-800 font-black">{scannedItemDetail.updatedBy || 'Administrador Geral'}</span></p>
                    <p>Último Visto: <span className="text-gray-800 font-black">{new Date(scannedItemDetail.lastUpdated || Date.now()).toLocaleString('pt-BR')}</span></p>
                  </div>

                  {/* Footer custom row */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setScannedItemDetail(null)}
                      className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-650 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveConservationStatus}
                      className="py-1 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-150 active:scale-95 cursor-pointer text-center flex items-center justify-center font-sans uppercase font-black"
                    >
                      Gravar Ficha
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

