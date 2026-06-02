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
  Music,
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
  Printer,
  Lock,
  Award,
  Smile,
  ShieldAlert,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { dataService } from '../services/dataService';
import { ServiceQueueEntry, Sector, SectorDocument, formatSectorName, TechTicket, ConstructionProject, VisitorLog, CleaningChecklist, InventoryItem, TicketStatus, TicketPriority, Speaker, AgendaEvent, DoutrinarioMaterial, DoutrinarioReuniao, DoutrinarioTrabalhador, DoutrinarioApoio, DoutrinarioDiretriz } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";
import { DoutrinarioDashboard } from './DoutrinarioDashboard';

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

  const isPrivilegedUser = isAdmin;

  const defaultTab = (initialTab === 'finance' && !isAdmin) ? 'overview' : (initialTab || 'overview');
  const [adminTab, setAdminTab] = useState<string>(defaultTab);
  const [currentViewSectorId, setCurrentViewSectorId] = useState<string>(sectorId);
  const [subSectors, setSubSectors] = useState<Sector[]>([]);
  const [infoModalSector, setInfoModalSector] = useState<Sector | null>(null);

  // --- SUB-SECTOR ADVANCED METRICS & KEYS ---
  const activeSubSector = isAdministrativo && adminTab.startsWith('sub-')
    ? subSectors.find(s => `sub-${s.id}` === adminTab)
    : null;

  const subSectorKey = activeSubSector 
    ? activeSubSector.name
    : (sector?.name || sectorName || "");

  const isPatrimonio = subSectorKey.includes("Patrimônio") || subSectorKey.includes("Material");
  const isTecnologia = subSectorKey.includes("Tecnologia") || subSectorKey.includes("Informática");
  const isObras = subSectorKey.includes("Obras") || subSectorKey.includes("Reformas") || subSectorKey.includes("Construção");
  const isLimpeza = subSectorKey.includes("Recepção") || subSectorKey.includes("Limpeza") || subSectorKey.includes("Zelo");
  const isEstudos = subSectorKey.toLowerCase().includes("estudo") && !subSectorKey.toLowerCase().includes("doutrin");
  const isDoutrinario = subSectorKey.toLowerCase().includes("doutrin");
  const isEvangelizacao = subSectorKey.toLowerCase().includes("evangelização") || subSectorKey.toLowerCase().includes("infantil") || subSectorKey.toLowerCase().includes("juventude") || subSectorKey.toLowerCase().includes("mocidade");
  const isMediunica = subSectorKey.toLowerCase().includes("mediúnica") || subSectorKey.toLowerCase().includes("mediunidade");
  const isArte = subSectorKey.toLowerCase().includes("arte") || subSectorKey.toLowerCase().includes("música") || subSectorKey.toLowerCase().includes("coral") || subSectorKey.toLowerCase().includes("teatro") || subSectorKey.toLowerCase().includes("artesa");
  const isComunicacao = subSectorKey.toLowerCase().includes("comunicação") || subSectorKey.toLowerCase().includes("midia") || subSectorKey.toLowerCase().includes("mídia") || subSectorKey.toLowerCase().includes("redes") || subSectorKey.toLowerCase().includes("divulgação");
  const isPasse = subSectorKey.toLowerCase().includes("passe") || subSectorKey.toLowerCase().includes("fluidotera") || subSectorKey.toLowerCase().includes("harmonização") || subSectorKey.toLowerCase().includes("irradiação");
  const isSocial = subSectorKey.toLowerCase().includes("social") || subSectorKey.toLowerCase().includes("assistênc") || subSectorKey.toLowerCase().includes("cesta");

  const isAdvancedSubSector = (isAdministrativo && adminTab.startsWith('sub-') && (isPatrimonio || isTecnologia || isObras || isLimpeza || isEstudos || isDoutrinario || isEvangelizacao || isMediunica || isArte || isComunicacao || isPasse || isSocial)) ||
                              (!isAdministrativo && (isPatrimonio || isTecnologia || isObras || isLimpeza || isEstudos || isDoutrinario || isEvangelizacao || isMediunica || isArte || isComunicacao || isPasse || isSocial));

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
  const [patrimonioTypeTab, setPatrimonioTypeTab] = useState<'TODOS' | 'PATRIMONIO' | 'MATERIAL'>('TODOS');

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

  // --- SETOR DOUTRINÁRIO STATE VARIABLES ---
  const [doutrinarioExpositores, setDoutrinarioExpositores] = useState<Speaker[]>([]);
  const [doutrinarioPalestras, setDoutrinarioPalestras] = useState<AgendaEvent[]>([]);
  const [doutrinarioMateriais, setDoutrinarioMateriais] = useState<DoutrinarioMaterial[]>([]);
  const [doutrinarioReunioes, setDoutrinarioReunioes] = useState<DoutrinarioReuniao[]>([]);
  const [doutrinarioTrabalhadores, setDoutrinarioTrabalhadores] = useState<DoutrinarioTrabalhador[]>([]);
  const [doutrinarioApoios, setDoutrinarioApoios] = useState<DoutrinarioApoio[]>([]);
  const [doutrinarioDiretrizes, setDoutrinarioDiretrizes] = useState<DoutrinarioDiretriz[]>([]);

  // Form hooks/trackers for Expositores
  const [newExpName, setNewExpName] = useState('');
  const [newExpPhone, setNewExpPhone] = useState('');
  const [newExpEmail, setNewExpEmail] = useState('');
  const [newExpCenter, setNewExpCenter] = useState('');
  const [newExpCity, setNewExpCity] = useState('');
  const [newExpThemes, setNewExpThemes] = useState('');
  const [newExpAvailability, setNewExpAvailability] = useState('');
  const [newExpObservations, setNewExpObservations] = useState('');
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Form hooks/trackers for Palestras (AgendaEvent)
  const [newPalTitle, setNewPalTitle] = useState('');
  const [newPalDesc, setNewPalDesc] = useState('');
  const [newPalDate, setNewPalDate] = useState('');
  const [newPalTime, setNewPalTime] = useState('');
  const [newPalSpeakerId, setNewPalSpeakerId] = useState('');
  const [newPalLocation, setNewPalLocation] = useState('');
  const [newPalResponsible, setNewPalResponsible] = useState('');
  const [newPalExpectedPublic, setNewPalExpectedPublic] = useState('');
  const [editingPalId, setEditingPalId] = useState<string | null>(null);

  // Form hooks/trackers for Biblioteca Materiais
  const [newMatName, setNewMatName] = useState('');
  const [newMatType, setNewMatType] = useState<'LIVRO' | 'APOSTILA' | 'PDF' | 'AUDIO' | 'VIDEO'>('LIVRO');
  const [newMatAuthor, setNewMatAuthor] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<'OBRAS_BASICAS' | 'MEDIUNIDADE' | 'EVANGELIZACAO' | 'ESTUDOS' | 'REFORMA_INTIMA' | 'ATENDIMENTO_FRATERNO'>('OBRAS_BASICAS');
  const [newMatObservations, setNewMatObservations] = useState('');
  const [editingMatId, setEditingMatId] = useState<string | null>(null);

  // Form hooks/trackers for Reuniões
  const [newReuDate, setNewReuDate] = useState('');
  const [newReuParticipants, setNewReuParticipants] = useState('');
  const [newReuSubjects, setNewReuSubjects] = useState('');
  const [newReuDecisions, setNewReuDecisions] = useState('');
  const [newReuForwardings, setNewReuForwardings] = useState('');
  const [editingReuId, setEditingReuId] = useState<string | null>(null);

  // Form hooks/trackers for Trabalhadores Doutrinários
  const [newTrabName, setNewTrabName] = useState('');
  const [newTrabRole, setNewTrabRole] = useState<'EXPOSITOR' | 'REVISOR' | 'COORDENADOR' | 'APOIO_DOUTRINARIO'>('EXPOSITOR');
  const [newTrabArea, setNewTrabArea] = useState('');
  const [newTrabHouseTime, setNewTrabHouseTime] = useState('');
  const [newTrabAvailability, setNewTrabAvailability] = useState('');
  const [newTrabContact, setNewTrabContact] = useState('');
  const [editingTrabId, setEditingTrabId] = useState<string | null>(null);

  // Form hooks/trackers for Apoio Doutrinário (Solicitações)
  const [newApoFromSector, setNewApoFromSector] = useState('');
  const [newApoTitle, setNewApoTitle] = useState('');
  const [newApoDesc, setNewApoDesc] = useState('');
  const [newApoResponse, setNewApoResponse] = useState('');
  const [editingApoId, setEditingApoId] = useState<string | null>(null);

  // Form hooks/trackers for Diretrizes Internas
  const [newDirTitle, setNewDirTitle] = useState('');
  const [newDirCategory, setNewDirCategory] = useState('');
  const [newDirResponsible, setNewDirResponsible] = useState('');
  const [newDirObservations, setNewDirObservations] = useState('');
  const [editingDirId, setEditingDirId] = useState<string | null>(null);

  // Active inner tab for Doutrinário section
  const [doutrinarioSubTab, setDoutrinarioSubTab] = useState<'EXPOSITORES' | 'PALESTRAS' | 'BIBLIOTECA' | 'REUNIOES' | 'TRABALHADORES' | 'APOIO' | 'DIRETRIZES'>('EXPOSITORES');

  // --- ESTUDOS ESPÍRITAS STATE VARIABLES ---
  const [studyCourses, setStudyCourses] = useState<any[]>([]);
  const [studyCategories, setStudyCategories] = useState<any[]>([]);
  const [selectedCategoryWheelId, setSelectedCategoryWheelId] = useState<string | null>(null);
  const [hoveredCategoryWheelId, setHoveredCategoryWheelId] = useState<string | null>(null);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryID, setNewCategoryID] = useState('');
  const [studyClasses, setStudyClasses] = useState<any[]>([]);
  const [studyStudents, setStudyStudents] = useState<any[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  
  // Form states for adding courses/students
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('ESDE');
  const [newCourseHours, setNewCourseHours] = useState('40');
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');

  // Editing trackers for studies / evangelização / files
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [newKidAge, setNewKidAge] = useState<number>(6);

  // New room/ciclo form states (so they can add/edit registered study cycles / classes in Evangelização!)
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSchedule, setNewRoomSchedule] = useState('Sábados, 15:00');
  const [newRoomLocation, setNewRoomLocation] = useState('Sala Infantil A');
  const [newRoomLeaders, setNewRoomLeaders] = useState('');

  // --- EVANGELIZAÇÃO INFANTIL / JUVENTUDE STATE VARIABLES ---
  const [evangelizacaoRooms, setEvangelizacaoRooms] = useState<any[]>([]);
  const [evangelizacaoKids, setEvangelizacaoKids] = useState<any[]>([]);
  const [newKidName, setNewKidName] = useState('');
  const [newKidResponsible, setNewKidResponsible] = useState('');
  const [newKidPhone, setNewKidPhone] = useState(''); // Parent/responsible phone
  const [newKidPhoneType, setNewKidPhoneType] = useState<'whatsapp' | 'telefone'>('whatsapp');
  const [newKidPhone2, setNewKidPhone2] = useState(''); // Parent/responsible phone 2
  const [newKidPhoneType2, setNewKidPhoneType2] = useState<'whatsapp' | 'telefone'>('whatsapp');
  const [newKidRelationship, setNewKidRelationship] = useState<string>('Pai');
  const [newKidStudentPhone, setNewKidStudentPhone] = useState('');
  const [newKidStudentPhoneType, setNewKidStudentPhoneType] = useState<'whatsapp' | 'telefone'>('whatsapp');
  const [newKidAllergies, setNewKidAllergies] = useState('');
  const [newKidRoomId, setNewKidRoomId] = useState('');

  // --- ESTUDOS MEDIÚNICOS STATE VARIABLES ---
  const [mediunicaGroups, setMediunicaGroups] = useState<any[]>([]);
  const [mediunicaMembers, setMediunicaMembers] = useState<any[]>([]);
  const [newMediGroupTitle, setNewMediGroupTitle] = useState('');
  const [newMediGroupLeader, setNewMediGroupLeader] = useState('');
  const [newMediGroupSchedule, setNewMediGroupSchedule] = useState('');
  const [mediunicaActiveTab, setMediunicaActiveTab] = useState<'reunioes' | 'trabalhadores' | 'frequencia' | 'escalas' | 'estudos' | 'encaminhamentos' | 'salas' | 'biblioteca' | 'seguranca' | 'acolhimento'>('reunioes');
  
  // Custom Mediunica States
  const [mediunicaEscalas, setMediunicaEscalas] = useState<any[]>([]);
  const [mediunicaCursos, setMediunicaCursos] = useState<any[]>([]);
  const [mediunicaReferrals, setMediunicaReferrals] = useState<any[]>([]);
  const [mediunicaRooms, setMediunicaRooms] = useState<any[]>([]);
  const [mediunicaAcolhimento, setMediunicaAcolhimento] = useState<any[]>([]);
  const [mediunicaLogs, setMediunicaLogs] = useState<any[]>([]);
  
  // Forms for adding medi worker & items
  const [newMediWorkerName, setNewMediWorkerName] = useState('');
  const [newMediWorkerRole, setNewMediWorkerRole] = useState('Médium');
  const [newMediWorkerTime, setNewMediWorkerTime] = useState('1 ano');
  const [newMediWorkerFormacao, setNewMediWorkerFormacao] = useState('ESDE / Curso Mediúnico');
  const [newMediWorkerGroup, setNewMediWorkerGroup] = useState('mg1');
  const [newMediWorkerStatus, setNewMediWorkerStatus] = useState('Ativo');
  const [newMediWorkerNotes, setNewMediWorkerNotes] = useState('');

  const [newMediEscalaDate, setNewMediEscalaDate] = useState('');
  const [newMediEscalaGroup, setNewMediEscalaGroup] = useState('mg1');
  const [newMediEscalaWorkers, setNewMediEscalaWorkers] = useState<string[]>([]);
  const [newMediEscalaLeader, setNewMediEscalaLeader] = useState('');
  const [newMediEscalaNotes, setNewMediEscalaNotes] = useState('');

  const [newMediCursoName, setNewMediCursoName] = useState('');
  const [newMediCursoFacilitador, setNewMediCursoFacilitador] = useState('');
  const [newMediCursoHours, setNewMediCursoHours] = useState(40);
  const [newMediCursoMaterial, setNewMediCursoMaterial] = useState('');

  const [newMediReferralOrigem, setNewMediReferralOrigem] = useState('Atendimento Fraterno');
  const [newMediReferralDestino, setNewMediReferralDestino] = useState('mg1');
  const [newMediReferralMotivo, setNewMediReferralMotivo] = useState('Sensibilidade extrema');
  const [newMediReferralObs, setNewMediReferralObs] = useState('');
  const [newMediReferralName, setNewMediReferralName] = useState('');

  const [newMediRoomName, setNewMediRoomName] = useState('');
  const [newMediRoomType, setNewMediRoomType] = useState('Fluidoterapia / Desobsessão');
  const [newMediRoomCapacity, setNewMediRoomCapacity] = useState(15);
  const [newMediRoomResp, setNewMediRoomResp] = useState('');

  const [newMediAcolhimentoName, setNewMediAcolhimentoName] = useState('');
  const [newMediAcolhimentoNeed, setNewMediAcolhimentoNeed] = useState('Vulnerabilidade Emocional');
  const [newMediAcolhimentoStatus, setNewMediAcolhimentoStatus] = useState('Equilibrado');
  const [newMediAcolhimentoRec, setNewMediAcolhimentoRec] = useState('');

  const [simulatedEncryptionActive, setSimulatedEncryptionActive] = useState(true);

  // --- ARTE ESPÍRITA STATE VARIABLES ---
  const [arteGroups, setArteGroups] = useState<any[]>([]);
  const [arteMusicas, setArteMusicas] = useState<any[]>([]);
  const [artePecas, setArtePecas] = useState<any[]>([]);
  const [arteEnsaios, setArteEnsaios] = useState<any[]>([]);
  const [arteEventos, setArteEventos] = useState<any[]>([]);
  const [arteActiveTab, setArteActiveTab] = useState<'grupos' | 'musica' | 'teatro' | 'ensaios' | 'eventos'>('grupos');

  // --- COMUNICAÇÃO ESPÍRITA STATE VARIABLES ---
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [midias, setMidias] = useState<any[]>([]);
  const [equipeMembros, setEquipeMembros] = useState<any[]>([]);
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [comActiveTab, setComActiveTab] = useState<'comunicados' | 'redes' | 'midia' | 'equipe' | 'campanhas'>('comunicados');

  // Editing state trackers for Comunicação
  const [editingComunicadoId, setEditingComunicadoId] = useState<string | null>(null);
  const [editingSocialPostId, setEditingSocialPostId] = useState<string | null>(null);
  const [editingMidiaId, setEditingMidiaId] = useState<string | null>(null);
  const [editingEquipeId, setEditingEquipeId] = useState<string | null>(null);
  const [editingCampanhaId, setEditingCampanhaId] = useState<string | null>(null);

  // Form states for adding elements in Comunicação
  const [newComTitle, setNewComTitle] = useState('');
  const [newComCategory, setNewComCategory] = useState('Avisos');
  const [newComContent, setNewComContent] = useState('');
  const [newComAuthor, setNewComAuthor] = useState('');
  const [newComStatus, setNewComStatus] = useState('rascunho'); // rascunho / publicado
  const [newComTarget, setNewComTarget] = useState('Público Geral'); // Público Geral / Trabalhadores / Juventude / Médiuns
  const [newComSpiritObjective, setNewComSpiritObjective] = useState('');
  const [newComApprovedBy, setNewComApprovedBy] = useState('');

  // Form states for Social Posts
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState('Instagram'); // Instagram / Facebook / YouTube / WhatsApp / Telegram
  const [newPostDate, setNewPostDate] = useState('');
  const [newPostHashtags, setNewPostHashtags] = useState('');
  const [newPostStatus, setNewPostStatus] = useState('Planejado'); // Planejado / Em Produção / Agendado / Publicado
  const [newPostResponsible, setNewPostResponsible] = useState('');
  const [newPostSpiritObjective, setNewPostSpiritObjective] = useState('');
  const [newPostApprovedBy, setNewPostApprovedBy] = useState('');

  // Form states for Mídias & Criativos
  const [newMidiaName, setNewMidiaName] = useState('');
  const [newMidiaCategory, setNewMidiaCategory] = useState('Artes e Design'); // Artes e Design / Vídeos / Podcasts / Templates
  const [newMidiaDesigner, setNewMidiaDesigner] = useState('');
  const [newMidiaUrl, setNewMidiaUrl] = useState('');
  const [newMidiaStatus, setNewMidiaStatus] = useState('Aprovado'); // Em Desenvolvimento / Em Revisão Doutrinária / Aprovado
  const [newMidiaSpiritObjective, setNewMidiaSpiritObjective] = useState('');

  // Form states for Equipe de Comunicação
  const [newMembroName, setNewMembroName] = useState('');
  const [newMembroRole, setNewMembroRole] = useState('Social Media'); // Social Media / Designer / Fotógrafo / Videomaker / Redator / Revisor Doutrinário
  const [newMembroAvailability, setNewMembroAvailability] = useState('Sábados');
  const [newMembroEquipments, setNewMembroEquipments] = useState('');

  // Form states for Campanhas & Coberturas
  const [newCampanhaName, setNewCampanhaName] = useState('');
  const [newCampanhaObjective, setNewCampanhaObjective] = useState('');
  const [newCampanhaTarget, setNewCampanhaTarget] = useState('Público Geral');
  const [newCampanhaDate, setNewCampanhaDate] = useState('');
  const [newCampanhaResponsible, setNewCampanhaResponsible] = useState('');
  const [newCampanhaStatus, setNewCampanhaStatus] = useState('Planejada'); // Planejada / Em Execução / Concluída
  const [newCampanhaMedia, setNewCampanhaMedia] = useState('');
  const [newCampanhaResult, setNewCampanhaResult] = useState('');

  // Gemini AI Creative Studio helper states
  const [aiTheme, setAiTheme] = useState('Caridade Espírita');
  const [aiTarget, setAiTarget] = useState('Público Geral');
  const [aiType, setAiType] = useState('post'); // post / comunicado / frase
  const [aiResultText, setAiResultText] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- PASSE E FLUIDOTERAPIA STATE VARIABLES ---
  const [passeAtendimentos, setPasseAtendimentos] = useState<any[]>([]);
  const [passePassistas, setPassePassistas] = useState<any[]>([]);
  const [passeFluidoterapia, setPasseFluidoterapia] = useState<any[]>([]);
  const [passeSalas, setPasseSalas] = useState<any[]>([]);
  const [passeCampanhas, setPasseCampanhas] = useState<any[]>([]);
  const [passeMateriais, setPasseMateriais] = useState<any[]>([]);
  const [passeEscalas, setPasseEscalas] = useState<any[]>([]);
  const [passeActiveTab, setPasseActiveTab] = useState<'atendimentos' | 'passistas' | 'fluidoterapia' | 'salas' | 'escalas'>('atendimentos');

  // Editing state trackers for Passe
  const [editingPasseAtendimentoId, setEditingPasseAtendimentoId] = useState<string | null>(null);
  const [editingPassePassistaId, setEditingPassePassistaId] = useState<string | null>(null);
  const [editingPasseFluidoterapiaId, setEditingPasseFluidoterapiaId] = useState<string | null>(null);
  const [editingPasseSalaId, setEditingPasseSalaId] = useState<string | null>(null);
  const [editingPasseCampanhaId, setEditingPasseCampanhaId] = useState<string | null>(null);
  const [editingPasseMaterialId, setEditingPasseMaterialId] = useState<string | null>(null);
  const [editingPasseEscalaId, setEditingPasseEscalaId] = useState<string | null>(null);

  // Form states for Atendimentos
  const [newPasseAtendName, setNewPasseAtendName] = useState('');
  const [newPasseAtendType, setNewPasseAtendType] = useState('Passe simples'); // Passe simples / Passe magnético / Fluidoterapia / Irradiação / Atendimento fraterno / Evangelho terapêutico / Harmonização espiritual
  const [newPasseAtendSala, setNewPasseAtendSala] = useState('Sala 1 - Bezerra de Menezes');
  const [newPasseAtendPassista, setNewPasseAtendPassista] = useState('');
  const [newPasseAtendEncaminhamento, setNewPasseAtendEncaminhamento] = useState('Mantenha Prece Diária');
  const [newPasseAtendObs, setNewPasseAtendObs] = useState('');
  const [newPasseAtendStatus, setNewPasseAtendStatus] = useState('Aguardando'); // Aguardando / Em Atendimento / Concluído
  const [decryptedObsId, setDecryptedObsId] = useState<string | null>(null);

  // Form states for Passistas
  const [newPassistaName, setNewPassistaName] = useState('');
  const [newPassistaDateIngresso, setNewPassistaDateIngresso] = useState('');
  const [newPassistaDoutrinaria, setNewPassistaDoutrinaria] = useState('Concluída');
  const [newPassistaCursos, setNewPassistaCursos] = useState('');
  const [newPassistaDias, setNewPassistaDias] = useState('Sábados');
  const [newPassistaEscalaId, setNewPassistaEscalaId] = useState('');
  const [newPassistaSituacao, setNewPassistaSituacao] = useState('Ativo'); // Ativo / Licença / Afastado
  const [newPassistaTempo, setNewPassistaTempo] = useState('');

  // Form states for Fluidoterapia
  const [newFluidoType, setNewFluidoType] = useState('Água Geral'); // Água Geral / Água Individualizada / Fluido de Cura
  const [newFluidoResp, setNewFluidoResp] = useState('');
  const [newFluidoQty, setNewFluidoQty] = useState(10); // Litros ou garrafas
  const [newFluidoDest, setNewFluidoDest] = useState('Salão Principal');
  const [newFluidoObs, setNewFluidoObs] = useState('');

  // Form states for Salas
  const [newSalaName, setNewSalaName] = useState('');
  const [newSalaType, setNewSalaType] = useState('Sala de Passe Individual');
  const [newSalaCap, setNewSalaCap] = useState(5);
  const [newSalaResp, setNewSalaResp] = useState('');
  const [newSalaDisp, setNewSalaDisp] = useState('Disponível'); // Disponível / Ocupada / Manutenção

  // Form states for Campanhas Vibratórias
  const [newCampName, setNewCampName] = useState('');
  const [newCampMotivo, setNewCampMotivo] = useState('');
  const [newCampResp, setNewCampResp] = useState('');
  const [newCampStatus, setNewCampStatus] = useState('Ativo'); // Ativo / Concluído

  // Form states for Materiais
  const [newMaterialProduct, setNewMaterialProduct] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState(0);
  const [newMaterialMin, setNewMaterialMin] = useState(50);
  const [newMaterialResp, setNewMaterialResp] = useState('');

  // Form states for Escalas
  const [newEscDate, setNewEscDate] = useState('');
  const [newEscTime, setNewEscTime] = useState('');
  const [newEscEquipe, setNewEscEquipe] = useState('Equipe Fraternidade');
  const [newEscPassistas, setNewEscPassistas] = useState('');
  const [newEscCoord, setNewEscCoord] = useState('');

  // Editing state trackers
  const [editingArteGroupId, setEditingArteGroupId] = useState<string | null>(null);
  const [editingArteSongId, setEditingArteSongId] = useState<string | null>(null);
  const [editingArtePieceId, setEditingArtePieceId] = useState<string | null>(null);
  const [editingArteEnsaioId, setEditingArteEnsaioId] = useState<string | null>(null);
  const [editingArteEventoId, setEditingArteEventoId] = useState<string | null>(null);

  // Form states for adding elements in Arte Espírita
  const [newArteGroupName, setNewArteGroupName] = useState('');
  const [newArteGroupModality, setNewArteGroupModality] = useState('MÚSICA');
  const [newArteGroupLeader, setNewArteGroupLeader] = useState('');
  const [newArteGroupRehearsalDay, setNewArteGroupRehearsalDay] = useState('Sábados');

  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongAuthor, setNewSongAuthor] = useState('');
  const [newSongTheme, setNewSongTheme] = useState('');
  const [newSongKey, setNewSongKey] = useState('C');

  const [newPieceTitle, setNewPieceTitle] = useState('');
  const [newPieceTheme, setNewPieceTheme] = useState('');
  const [newPieceAuthor, setNewPieceAuthor] = useState('');

  const [newEnsaioGroupId, setNewEnsaioGroupId] = useState('');
  const [newEnsaioDate, setNewEnsaioDate] = useState('');
  const [newEnsaioTime, setNewEnsaioTime] = useState('');
  const [newEnsaioLocal, setNewEnsaioLocal] = useState('');
  const [newEnsaioActivity, setNewEnsaioActivity] = useState('');

  const [newEventoName, setNewEventoName] = useState('');
  const [newEventoTheme, setNewEventoTheme] = useState('');
  const [newEventoDate, setNewEventoDate] = useState('');
  const [newEventoLocal, setNewEventoLocal] = useState('');
  const [newEventoCoordinator, setNewEventoCoordinator] = useState('');
  const [newEventoEstimate, setNewEventoEstimate] = useState('');

  // --- AÇÃO SOCIAL ESPÍRITA STATE VARIABLES ---
  const [socialActiveTab, setSocialActiveTab] = useState<'painel' | 'assistidos' | 'atendimentos' | 'doacoes' | 'cestas' | 'voluntarios' | 'campanhas_projetos' | 'visitas'>('painel');
  const [socialAssistidos, setSocialAssistidos] = useState<any[]>([]);
  const [socialAtendimentos, setSocialAtendimentos] = useState<any[]>([]);
  const [socialDoacoes, setSocialDoacoes] = useState<any[]>([]);
  const [socialCestasEntregas, setSocialCestasEntregas] = useState<any[]>([]);
  const [socialVoluntarios, setSocialVoluntarios] = useState<any[]>([]);
  const [socialProjetos, setSocialProjetos] = useState<any[]>([]);
  const [socialVisitas, setSocialVisitas] = useState<any[]>([]);
  const [socialAuditLogs, setSocialAuditLogs] = useState<any[]>([]);
  
  // Decryption trackers for Social Sensitive fields
  const [unlockedSocialId, setUnlockedSocialId] = useState<string | null>(null);

  // Scanned assistido modal state
  const [scannedSocialAssistido, setScannedSocialAssistido] = useState<any | null>(null);
  const [scannedAssistidoModalOpen, setScannedAssistidoModalOpen] = useState(false);

  // Real camera states for QR scan in Social Assistant Sector
  const [socialIsScanningQr, setSocialIsScanningQr] = useState(false);
  const [socialScannedFamilyName, setSocialScannedFamilyName] = useState('');
  const [socialCameraActive, setSocialCameraActive] = useState(false);
  const [socialCameraError, setSocialCameraError] = useState<string | null>(null);
  const socialQrScannerRef = useRef<Html5Qrcode | null>(null);

  // Real Social individual QR card viewer states
  const [socialQrModalOpen, setSocialQrModalOpen] = useState(false);
  const [socialQrModalItem, setSocialQrModalItem] = useState<any | null>(null);

  const handleShowSocialQRCode = (item: any) => {
    setSocialQrModalItem(item);
    setSocialQrModalOpen(true);
  };

  const handleConfirmScannedCesta = (assistido: any) => {
    const itemData = {
      assistidoId: assistido.id,
      assistidoName: assistido.name,
      date: new Date().toISOString().split('T')[0],
      responsible: currentUser?.name || 'Clarice Lisbôa',
      type: 'Cesta básica',
      needIdentified: 'Check-in expresso via Carteirinha Social QR Code.',
      forwarding: 'Entrega imediata de mantimentos básicos mensal.',
      observations: 'Assistido apresentou a carteirinha contendo QR Code. Leitura homologada, cesta despachada.',
      nextFollowUp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const newAtend = {
      id: `sat_${Date.now()}`,
      ...itemData
    };

    const updated = [...socialAtendimentos, newAtend];
    setSocialAtendimentos(updated);
    localStorage.setItem('social_atendimentos', JSON.stringify(updated));

    // Register log
    const auditItem = {
      id: `aud_${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user: currentUser?.name || 'Sistema',
      action: 'Check-in & Cesta',
      details: `Despachou cesta básica expresso via QR Code para ${assistido.name}`
    };
    const updatedAudit = [auditItem, ...socialAuditLogs];
    setSocialAuditLogs(updatedAudit);
    localStorage.setItem('social_audit_logs', JSON.stringify(updatedAudit));

    alert(`✅ Cesta Básica despachada com sucesso para ${assistido.name}! O atendimento expresso foi devidamente catalogado e registrado.`);
    setScannedAssistidoModalOpen(false);
    setScannedSocialAssistido(null);
  };

  // Camera control loop for html5-qrcode in Social Assistant Scanner
  useEffect(() => {
    let scannerInstance: Html5Qrcode | null = null;

    if (socialIsScanningQr) {
      setSocialCameraError(null);
      setSocialCameraActive(false);

      const timeout = setTimeout(() => {
        try {
          const container = document.getElementById("social-qr-reader-viewport");
          if (!container) return;

          scannerInstance = new Html5Qrcode("social-qr-reader-viewport");
          socialQrScannerRef.current = scannerInstance;

          scannerInstance.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (w, h) => {
                const size = Math.min(w, h) * 0.70;
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              // Parse the scanned text
              let cleanText = (decodedText || '').trim();
              
              // Handle full deep links as well (e.g. if the QR code was printed using a deep link URL)
              try {
                if (cleanText.includes('?') || cleanText.includes('assetId=') || cleanText.includes('scan=')) {
                  const urlPart = cleanText.includes('?') ? cleanText.split('?')[1] : cleanText;
                  const urlParams = new URLSearchParams(urlPart);
                  const idFromUrl = urlParams.get('assetId') || urlParams.get('patId') || urlParams.get('scan');
                  if (idFromUrl) {
                    cleanText = idFromUrl;
                  }
                }
              } catch (e) {
                // Ignore parsing errors and treat as raw text
              }

              // Search for a matching assistido by ID, Name, or CPF
              const matched = socialAssistidos.find(a => 
                String(a.id || '').toLowerCase() === cleanText.toLowerCase() || 
                String(a.name || '').toLowerCase() === cleanText.toLowerCase() ||
                (a.cpf && a.cpf.replace(/\D/g, '') === cleanText.replace(/\D/g, ''))
              );

              if (matched) {
                // Check if user initiated scanning for a specific name and if it matches
                if (socialScannedFamilyName && socialScannedFamilyName !== matched.name) {
                  const proceed = window.confirm(`⚠️ Atenção: Você iniciou o scanner para "${socialScannedFamilyName}", mas escaneou a carteira de "${matched.name}". Deseja computar a entrega para "${matched.name}" mesmo assim?`);
                  if (!proceed) {
                    return;
                  }
                }

                // Open detailed scanned assistido modal with action options
                setScannedSocialAssistido(matched);
                setScannedAssistidoModalOpen(true);
                setSocialIsScanningQr(false);
              } else {
                alert(`❌ QR Code lido: "${decodedText}". Nenhuma família ou assistido com esse ID, Nome ou CPF correspondente foi localizado no sistema.`);
              }

              // Stop scanning
              if (scannerInstance && scannerInstance.isScanning) {
                scannerInstance.stop().then(() => {
                  setSocialCameraActive(false);
                }).catch(err => console.error("Error stopping social scanner on read:", err));
              }
            },
            () => {
              // Silent frames
            }
          ).then(() => {
            setSocialCameraActive(true);
          }).catch((err) => {
            console.error("Social camera start failed:", err);
            setSocialCameraActive(false);
            setSocialCameraError("Não foi possível acessar a câmera do aparelho. Permissão negada ou em uso.");
          });
        } catch (e: any) {
          console.error("Social QR initial setup failure:", e);
          setSocialCameraActive(false);
          setSocialCameraError(e.message || "Erro ao carregar o visualizador de câmera.");
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
        if (scannerInstance && scannerInstance.isScanning) {
          scannerInstance.stop()
            .then(() => setSocialCameraActive(false))
            .catch(err => console.error("Error stopping social camera stream:", err));
        }
      };
    } else {
      if (socialQrScannerRef.current && socialQrScannerRef.current.isScanning) {
        socialQrScannerRef.current.stop()
          .then(() => setSocialCameraActive(false))
          .catch(err => console.error("Error stopping social camera stream:", err));
      }
    }
  }, [socialIsScanningQr, socialAssistidos]);

  // Form states for Assistidos:
  const [editingAssistidoId, setEditingAssistidoId] = useState<string | null>(null);
  const [newAsName, setNewAsName] = useState('');
  const [newAsCpf, setNewAsCpf] = useState('');
  const [newAsBirthDate, setNewAsBirthDate] = useState('');
  const [newAsPhone, setNewAsPhone] = useState('');
  const [newAsAddress, setNewAsAddress] = useState('');
  const [newAsNeighborhood, setNewAsNeighborhood] = useState('');
  const [newAsCity, setNewAsCity] = useState('Mirante do Sul');
  const [newAsIsFamilyHead, setNewAsIsFamilyHead] = useState(true);
  const [newAsFamilyHeadName, setNewAsFamilyHeadName] = useState('');
  const [newAsMemberCount, setNewAsMemberCount] = useState(1);
  const [newAsHousingStatus, setNewAsHousingStatus] = useState('Alugada'); // Própria / Alugada / Cedida / Vulnerável
  const [newAsSchooling, setNewAsSchooling] = useState('Fundamental Incompleto');
  const [newAsOccupation, setNewAsOccupation] = useState('Desempregado');
  const [newAsFamilyIncome, setNewAsFamilyIncome] = useState(0);
  const [newAsSpecialNeeds, setNewAsSpecialNeeds] = useState('');
  const [newAsFraternalNotes, setNewAsFraternalNotes] = useState('');
  const [newAsEmploymentStatus, setNewAsEmploymentStatus] = useState('Desempregado');
  const [newAsSocialBenefits, setNewAsSocialBenefits] = useState('Nenhum'); // Bolsa Família / BPC / Outro / Nenhum
  const [newAsFoodSecurity, setNewAsFoodSecurity] = useState('Regular'); // Regular / Moderada / Grave
  const [newAsHealthStatus, setNewAsHealthStatus] = useState('Sadio'); // Sadio / Tratamento Contínuo / Grave
  const [newAsEmotionalStatus, setNewAsEmotionalStatus] = useState('Estável'); // Estável / Abalado / Crítico
  const [newAsVulnerabilityLevel, setNewAsVulnerabilityLevel] = useState('Média'); // Alta / Média / Baixa
  const [newAsHasChildrenUnder12, setNewAsHasChildrenUnder12] = useState(false);
  const [newAsHasElderly, setNewAsHasElderly] = useState(false);

  // Form states for Atendimentos:
  const [editingSocialAtendId, setEditingSocialAtendId] = useState<string | null>(null);
  const [newSoAtendAssistId, setNewSoAtendAssistId] = useState('');
  const [newSoAtendResp, setNewSoAtendResp] = useState('');
  const [newSoAtendType, setNewSoAtendType] = useState('Cesta básica'); // Cesta básica / Apoio psicológico / Orientação social / Encaminhamento médico / Apoio espiritual / Auxílio emergencial / Atendimento familiar
  const [newSoAtendNeed, setNewSoAtendNeed] = useState('');
  const [newSoAtendForward, setNewSoAtendForward] = useState('');
  const [newSoAtendObs, setNewSoAtendObs] = useState('');
  const [newSoAtendNextDate, setNewSoAtendNextDate] = useState('');

  // Form states for Doações / Estoque:
  const [editingSocialDoacaoId, setEditingSocialDoacaoId] = useState<string | null>(null);
  const [newSoDoacaoType, setNewSoDoacaoType] = useState('Alimentos'); // Alimentos / Roupas / Calçados / Material escolar / Higiene / Móveis / Outros
  const [newSoDoacaoDesc, setNewSoDoacaoDesc] = useState('');
  const [newSoDoacaoQty, setNewSoDoacaoQty] = useState(1);
  const [newSoDoacaoUnit, setNewSoDoacaoUnit] = useState('un'); // kg / un / fardos / caixas
  const [newSoDoacaoDonor, setNewSoDoacaoDonor] = useState('');
  const [newSoDoacaoEntryDate, setNewSoDoacaoEntryDate] = useState('');
  const [newSoDoacaoResponsible, setNewSoDoacaoResponsible] = useState('');
  const [newSoDoacaoExpiry, setNewSoDoacaoExpiry] = useState('');

  // Form states for Cestas Básicas:
  const [editingSocialCestaId, setEditingSocialCestaId] = useState<string | null>(null);
  const [newSoCestaAssistId, setNewSoCestaAssistId] = useState('');
  const [newSoCestaType, setNewSoCestaType] = useState('Padrão'); // Padrão / Especial / Infantil
  const [newSoCestaResp, setNewSoCestaResp] = useState('');

  // Form states for Voluntários:
  const [editingSocialVoluntarioId, setEditingSocialVoluntarioId] = useState<string | null>(null);
  const [newSoVolName, setNewSoVolName] = useState('');
  const [newSoVolRole, setNewSoVolRole] = useState('Triagem'); // Triagem / Visitas Fraternas / Distribuição / Captação / Logística
  const [newSoVolAvailability, setNewSoVolAvailability] = useState('Sábados');
  const [newSoVolContact, setNewSoVolContact] = useState('');

  // Form states for Projetos e Campanhas:
  const [editingSocialProjetoId, setEditingSocialProjetoId] = useState<string | null>(null);
  const [newSoProjName, setNewSoProjName] = useState('');
  const [newSoProjObjective, setNewSoProjObjective] = useState('');
  const [newSoProjTarget, setNewSoProjTarget] = useState('');
  const [newSoProjCoordinator, setNewSoProjCoordinator] = useState('');
  const [newSoProjSchedule, setNewSoProjSchedule] = useState('');
  const [newSoProjStatus, setNewSoProjStatus] = useState('Planejado'); // Ativo / Concluído / Planejado

  // Form states for Visitas Fraternas:
  const [editingSocialVisitaId, setEditingSocialVisitaId] = useState<string | null>(null);
  const [newSoVisitaAssistId, setNewSoVisitaAssistId] = useState('');
  const [newSoVisitaResp, setNewSoVisitaResp] = useState('');
  const [newSoVisitaSituation, setNewSoVisitaSituation] = useState('');
  const [newSoVisitaNeeds, setNewSoVisitaNeeds] = useState('');
  const [newSoVisitaForward, setNewSoVisitaForward] = useState('');

  // --- INICIALIZADOR DE DADOS SETOR DOUTRINÁRIO ---
  const loadDoutrinarioData = async () => {
    try {
      // 1. Load Speakers/Expositores
      let speakers = await dataService.getSpeakers();
      if (!speakers || speakers.length === 0) {
        const defaultSpeakers: Speaker[] = [
          {
            id: 'sp-1',
            name: 'Haroldo Dutra Dias',
            phone: '(31) 99888-7766',
            email: 'haroldo@doutrina.org',
            spiritistCenter: 'União Espírita Mineira',
            city: 'Belo Horizonte - MG',
            themes: 'O Novo Testamento, Espiritismo e Ciência',
            availability: 'Finais de semana e noites',
            observations: 'Expositor convidado de renome nacional.'
          },
          {
            id: 'sp-2',
            name: 'Suely Caldas Schubert',
            phone: '(21) 97766-5544',
            email: 'suely@mediunidade.com.br',
            spiritistCenter: 'Federação Espírita Brasileira',
            city: 'Juiz de Fora - MG',
            themes: 'Mediunidade, Obsessão e Desobsessão',
            availability: 'Sábados das 14h às 18h',
            observations: 'Voltado para reuniões mediúnicas e diretrizes.'
          },
          {
            id: 'sp-3',
            name: 'Divaldo Pereira Franco',
            phone: '(71) 99111-2233',
            email: 'divaldo@mansaodocaminho.org',
            spiritistCenter: 'Centro Espírita Caminho da Redenção',
            city: 'Salvador - BA',
            themes: 'Transição Planetária, Amor e Autocura',
            availability: 'Apenas sob agendamento prévio especial',
            observations: 'Fundador da Mansão do Caminho.'
          }
        ];
        speakers = defaultSpeakers;
      }
      setDoutrinarioExpositores(speakers);

      // 2. Load Public Lectures/Agenda Events
      let events = await dataService.getAgendaEvents();
      if (events) {
        events = events.filter(e => e.type === 'DOUTRINARIA');
      }
      if (!events || events.length === 0) {
        const defaultEvents: AgendaEvent[] = [
          {
            id: 'ev-1',
            title: 'Palestra: A Imortalidade da Alma',
            description: 'Estudo aprofundado sobre o destino e dor segundo O Livro dos Espíritos.',
            date: Date.now() + 86400 * 2 * 1000,
            time: '20:00',
            type: 'DOUTRINARIA',
            speakerId: 'sp-1',
            speakerName: 'Haroldo Dutra Dias',
            location: 'Salão de Conferências Principal',
            responsible: 'Gabriel Chaves',
            expectedPublic: 250
          },
          {
            id: 'ev-2',
            title: 'Palestra: Mediunidade e Jesus',
            description: 'Como o Cristo orientava o uso das faculdades no bem.',
            date: Date.now() + 86400 * 5 * 1000,
            time: '19:30',
            type: 'DOUTRINARIA',
            speakerId: 'sp-2',
            speakerName: 'Suely Caldas Schubert',
            location: 'Salão Auxiliar',
            responsible: 'Gabriel Chaves',
            expectedPublic: 120
          }
        ];
        events = defaultEvents;
      }
      setDoutrinarioPalestras(events);

      // 3. Load Library Books / Materials
      let materials = await dataService.getDoutrinarioMateriais();
      if (!materials || materials.length === 0) {
        const defaultMaterials: DoutrinarioMaterial[] = [
          {
            id: 'mat-1',
            name: 'O Livro dos Espíritos',
            type: 'LIVRO',
            author: 'Allan Kardec',
            category: 'OBRAS_BASICAS',
            observations: 'Edição comentada FEB. Disponível para consulta local e empréstimo.'
          },
          {
            id: 'mat-2',
            name: 'O Livro dos Médiuns',
            type: 'LIVRO',
            author: 'Allan Kardec',
            category: 'MEDIUNIDADE',
            observations: 'Controle de estudo prático de reuniões experimentais.'
          },
          {
            id: 'mat-3',
            name: 'Apostila Completa do ESDE (Tomo I)',
            type: 'APOSTILA',
            author: 'FEB',
            category: 'ESTUDOS',
            observations: 'Utilizado no ciclo de estudos básicos iniciante.'
          },
          {
            id: 'mat-4',
            name: 'Audiobook: Nosso Lar',
            type: 'AUDIO',
            author: 'Chico Xavier por André Luiz',
            category: 'ESTUDOS',
            observations: 'Excelente material de áudio para auxílio visual.'
          }
        ];
        materials = defaultMaterials;
      }
      setDoutrinarioMateriais(materials);

      // 4. Load Reuniões / Atas
      let meetings = await dataService.getDoutrinarioReunioes();
      if (!meetings || meetings.length === 0) {
        const defaultMeetings: DoutrinarioReuniao[] = [
          {
            id: 'mt-1',
            date: new Date().toISOString().split('T')[0],
            participants: ['Gabriel Chaves', 'Clarice Lisbôa', 'Haroldo Dutra'],
            subjects: 'Acolhimento de novos palestrantes de fora do centro / definição de calendário',
            decisions: 'Ampliar a rampa de divulgação em mídias digitais e definir rodízio quinzenal.',
            forwardings: 'Gabriel enviará e-mail com as diretrizes e calendário para os expositores.'
          }
        ];
        meetings = defaultMeetings;
      }
      setDoutrinarioReunioes(meetings);

      // 5. Load Workers
      let trabs = await dataService.getDoutrinarioTrabalhadores();
      if (!trabs || trabs.length === 0) {
        const defaultTrabs: DoutrinarioTrabalhador[] = [
          {
            id: 'dt-1',
            name: 'Roberto Shinyashiki',
            role: 'EXPOSITOR',
            area: 'Palestras Públicas de Segunda-Feira',
            houseTime: '5 anos',
            availability: 'Segundas-feiras, 19:00',
            contact: '(31) 98888-2222'
          },
          {
            id: 'dt-2',
            name: 'Ana Maria Braga',
            role: 'COORDENADOR',
            area: 'Livraria / Biblioteca Doutrinária',
            houseTime: '10 anos',
            availability: 'Quartas e Sábados',
            contact: '(31) 97777-1111'
          }
        ];
        trabs = defaultTrabs;
      }
      setDoutrinarioTrabalhadores(trabs);

      // 6. Load Apoios (Cross-sector requests)
      let apoios = await dataService.getDoutrinarioApoios();
      if (!apoios || apoios.length === 0) {
        const defaultApoios: DoutrinarioApoio[] = [
          {
            id: 'ap-1',
            fromSector: 'Comunicação e Mídias',
            title: 'Subsídio de material para série de posts de Kardec',
            description: 'Precisamos de indicação de trechos de O Livro dos Espíritos sobre a lei de progresso.',
            status: 'PENDENTE',
            date: new Date().toISOString().split('T')[0]
          }
        ];
        apoios = defaultApoios;
      }
      setDoutrinarioApoios(apoios);

      // 7. Load Diretrizes Internas
      let dirs = await dataService.getDoutrinarioDiretrizes();
      if (!dirs || dirs.length === 0) {
        const defaultDirs: DoutrinarioDiretriz[] = [
          {
            id: 'dir-1',
            title: 'Regulamento e Manual do Expositor de Mirante de Luz',
            category: 'Manuais',
            date: '2026-05-10',
            responsible: 'Gabriel Chaves',
            observations: 'Contém todas as diretrizes de postura, temas a evitar e acolhimento dos assistidos.'
          }
        ];
        dirs = defaultDirs;
      }
      setDoutrinarioDiretrizes(dirs);
    } catch (err) {
      console.error("Erro ao carregar dados do setor doutrinário:", err);
    }
  };

  // --- INICIALIZADOR DE DADOS AÇÃO SOCIAL ESPÍRITA ---
  const loadSocialData = () => {
    // 1. Audit Logs
    const cachedAudit = localStorage.getItem('social_audit_logs');
    if (cachedAudit) {
      try { setSocialAuditLogs(JSON.parse(cachedAudit)); } catch {}
    } else {
      const defaultAudit = [
        { id: 'aud_1', date: '2026-05-28 14:32', user: 'Clarice Lisbôa', action: 'Consulta Sensível', details: 'Acessou ficha socioeconômica de Maria das Dores Silva' },
        { id: 'aud_2', date: '2026-05-29 09:15', user: 'Clarice Lisbôa', action: 'Registro Social', details: 'Alterou o status de vulnerabilidade de João Batista dos Santos para Baixa' }
      ];
      localStorage.setItem('social_audit_logs', JSON.stringify(defaultAudit));
      setSocialAuditLogs(defaultAudit);
    }

    // 2. Assistidos / Famílias
    const cachedAssistidos = localStorage.getItem('social_assistidos');
    let loadedAssistidos: any[] = [];
    if (cachedAssistidos) {
      try {
        loadedAssistidos = JSON.parse(cachedAssistidos);
        setSocialAssistidos(loadedAssistidos);
      } catch {
        loadedAssistidos = [];
      }
    } else {
      const defaultAssistidos = [
        {
          id: 'as_1',
          name: 'Maria das Dores Silva',
          cpf: '123.456.789-00',
          birthDate: '1984-06-15',
          phone: '(11) 98877-6655',
          address: 'Rua das Flores, 104 - Quadra B',
          neighborhood: 'Vila da Paz',
          city: 'Mirante do Sul',
          isFamilyHead: true,
          familyHeadName: 'Própria',
          memberCount: 5,
          housingStatus: 'Cedida',
          schooling: 'Fundamental Incompleto',
          occupation: 'Diarista (Autônoma)',
          familyIncome: 450.00,
          specialNeeds: 'Filho mais novo (Mateus, 6 anos) possui asma crônica e necessita de nebulização regular.',
          fraternalNotes: 'Família em vulnerabilidade social e emocional severa. Demonstra muita fé e frequência nas palestras públicas das quartas-feiras. Recebe cesta básica regular.',
          employmentStatus: 'Autônoma',
          socialBenefits: 'Bolsa Família',
          foodSecurity: 'Grave',
          healthStatus: 'Tratamento Contínuo',
          emotionalStatus: 'Abalado',
          vulnerabilityLevel: 'Alta',
          hasChildrenUnder12: true,
          hasElderly: false
        },
        {
          id: 'as_2',
          name: 'João Batista dos Santos',
          cpf: '234.567.890-11',
          birthDate: '1952-11-23',
          phone: '(11) 97766-5544',
          address: 'Av. Principal, 89',
          neighborhood: 'Centro',
          city: 'Mirante do Sul',
          isFamilyHead: true,
          familyHeadName: 'Própria',
          memberCount: 1,
          housingStatus: 'Alugada',
          schooling: 'Lê e Escreve',
          occupation: 'Aposentado',
          familyIncome: 1412.00,
          specialNeeds: 'Dificuldade motora decorrente de AVC há 2 anos, reside sozinho.',
          fraternalNotes: 'Assistido expressa enorme solidão. Resgata livros espíritas na biblioteca móvel mensalmente. Solicita visitas fraternas frequentes.',
          employmentStatus: 'Aposentado',
          socialBenefits: 'Nenhum',
          foodSecurity: 'Regular',
          healthStatus: 'Tratamento Contínuo',
          emotionalStatus: 'Estável',
          vulnerabilityLevel: 'Média',
          hasChildrenUnder12: false,
          hasElderly: true
        },
        {
          id: 'as_3',
          name: 'Ana Paula Oliveira de Souza',
          cpf: '345.678.901-22',
          birthDate: '1991-03-04',
          phone: '(11) 96655-4433',
          address: 'Rua do Cruzeiro, s/n',
          neighborhood: 'Morro da Glória',
          city: 'Mirante do Sul',
          isFamilyHead: true,
          familyHeadName: 'Própria',
          memberCount: 4,
          housingStatus: 'Vulnerável',
          schooling: 'Médio Completo',
          occupation: 'Desempregado',
          familyIncome: 200.00,
          specialNeeds: 'Não há.',
          fraternalNotes: 'Desempregada após fechamento de confeecção têxtil de bairro. Inscrita nas oficinas de Costura Fraterna e Artesanato da casa para obter renda própria.',
          employmentStatus: 'Desempregada',
          socialBenefits: 'Bolsa Família',
          foodSecurity: 'Moderada',
          healthStatus: 'Sadio',
          emotionalStatus: 'Crítico',
          vulnerabilityLevel: 'Alta',
          hasChildrenUnder12: true,
          hasElderly: false
        }
      ];
      localStorage.setItem('social_assistidos', JSON.stringify(defaultAssistidos));
      loadedAssistidos = defaultAssistidos;
      setSocialAssistidos(defaultAssistidos);
    }

    // Process scanned deep-link QR code
    const params = new URLSearchParams(window.location.search);
    const assistidoIdParam = params.get('assistidoId') || params.get('scan');
    if (assistidoIdParam && (assistidoIdParam.startsWith('as_') || assistidoIdParam.startsWith('as-'))) {
      const match = loadedAssistidos.find(a => String(a.id).toLowerCase() === assistidoIdParam.toLowerCase());
      if (match) {
        setSocialActiveTab('assistidos');
        setScannedSocialAssistido(match);
        setScannedAssistidoModalOpen(true);
        
        // Clear query parameters from URL safely
        const urlWithoutParams = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: urlWithoutParams }, '', urlWithoutParams);
      }
    }

    // 3. Atendimentos Sociais
    const cachedAtendimentos = localStorage.getItem('social_atendimentos');
    if (cachedAtendimentos) {
      try { setSocialAtendimentos(JSON.parse(cachedAtendimentos)); } catch {}
    } else {
      const defaultAtendimentos = [
        {
          id: 'sat_1',
          assistidoId: 'as_1',
          assistidoName: 'Maria das Dores Silva',
          date: '2026-05-15',
          responsible: 'Clarice Lisbôa',
          type: 'Cesta básica',
          needIdentified: 'Extrema carência de mantimentos regulares devido ao desemprego informal.',
          forwarding: 'Encaminhamento para recebimento da Cesta Básica regular mensal. Indicação para Atendimento Fraterno espiritual.',
          observations: 'Assistida demonstrou profunda gratidão e preencheu ficha de preces pela sua família.',
          nextFollowUp: '2026-06-15'
        },
        {
          id: 'sat_2',
          assistidoId: 'as_2',
          assistidoName: 'João Batista dos Santos',
          date: '2026-05-20',
          responsible: 'Voluntário Francisco André',
          type: 'Apoio espiritual',
          needIdentified: 'Profunda melancolia por viver isolado da família biológica.',
          forwarding: 'Incluído na escala de Visitas Fraternas da equipe aos finais de semana.',
          observations: 'Emprestamos o livro "O Evangelho Segundo o Espiritismo" e realizamos prece conjunta no seu domicílio.',
          nextFollowUp: '2026-06-10'
        },
        {
          id: 'sat_3',
          assistidoId: 'as_3',
          assistidoName: 'Ana Paula Oliveira de Souza',
          date: '2026-05-25',
          responsible: 'Clarice Lisbôa',
          type: 'Orientação social',
          needIdentified: 'Falta de qualificação profissional para colocação rápida no mercado de trabalho.',
          forwarding: 'Encaminhada ao Curso de Panificação Fraterna que se inicia no próximo mês.',
          observations: 'Interessada, preencheu a ficha de inscrição cooperativa e demonstrou entusiasmo.',
          nextFollowUp: '2026-06-05'
        }
      ];
      localStorage.setItem('social_atendimentos', JSON.stringify(defaultAtendimentos));
      setSocialAtendimentos(defaultAtendimentos);
    }

    // 4. Doações / Estoque de Donativos
    const cachedDoacoes = localStorage.getItem('social_doacoes');
    if (cachedDoacoes) {
      try { setSocialDoacoes(JSON.parse(cachedDoacoes)); } catch {}
    } else {
      const defaultDoacoes = [
        { id: 'don_1', type: 'Alimentos', description: 'Arroz Tipo 1 (Sacos 5kg)', qty: 45, unit: 'un', donor: 'Supermercado Central', entryDate: '2026-05-10', responsible: 'Francisco André', expiryDate: '2026-11-20', status: 'Disponível' },
        { id: 'don_2', type: 'Alimentos', description: 'Óleo de Soja (Pet 900ml)', qty: 62, unit: 'un', donor: 'Comunidade (Campanha de Culto)', entryDate: '2026-05-15', responsible: 'Francisco André', expiryDate: '2027-01-15', status: 'Disponível' },
        { id: 'don_3', type: 'Roupas', description: 'Cobertores de Casal Novas / Semiusados', qty: 28, unit: 'un', donor: 'Campanha de Inverno', entryDate: '2026-05-24', responsible: 'Andréia Ramos', expiryDate: '', status: 'Disponível' },
        { id: 'don_4', type: 'Higiene', description: 'Pacotes de Fralda Infantil M/G', qty: 15, unit: 'un', donor: 'Clarice Lisbôa', entryDate: '2026-05-26', responsible: 'Clarice Lisbôa', expiryDate: '', status: 'Disponível' },
        { id: 'don_5', type: 'Recursos financeiros', description: 'Fundo para Auxílio Emergencial Social', qty: 2500, unit: 'R$', donor: 'Doadores Anônimos Portal', entryDate: '2026-05-28', responsible: 'Tesouraria Geral', expiryDate: '', status: 'Disponível' }
      ];
      localStorage.setItem('social_doacoes', JSON.stringify(defaultDoacoes));
      setSocialDoacoes(defaultDoacoes);
    }

    // 5. Cestas Básicas Entregas
    const cachedCestas = localStorage.getItem('social_cestas');
    if (cachedCestas) {
      try { setSocialCestasEntregas(JSON.parse(cachedCestas)); } catch {}
    } else {
      const defaultCestas = [
        { id: 'sc_1', assistidoId: 'as_1', assistidoName: 'Maria das Dores Silva', date: '2026-05-15', basketType: 'Padrão + Suplemento Infantil', responsible: 'Francisco André', signatureConfirmed: true, qrCodeScanned: true },
        { id: 'sc_2', assistidoId: 'as_3', assistidoName: 'Ana Paula Oliveira de Souza', date: '2026-05-26', basketType: 'Padrão', responsible: 'Carlos Roberto', signatureConfirmed: true, qrCodeScanned: false }
      ];
      localStorage.setItem('social_cestas', JSON.stringify(defaultCestas));
      setSocialCestasEntregas(defaultCestas);
    }

    // 6. Voluntários Ativos
    const cachedVoluntarios = localStorage.getItem('social_voluntarios');
    if (cachedVoluntarios) {
      try { setSocialVoluntarios(JSON.parse(cachedVoluntarios)); } catch {}
    } else {
      const defaultVoluntarios = [
        { id: 'sv_1', name: 'Clarice Lisbôa', role: 'Triagem e Avaliação', availability: 'Terças e Sábados', contact: '(11) 98111-2222', active: true },
        { id: 'sv_2', name: 'Francisco André dos Santos', role: 'Logística de Donativos', availability: 'Quartas e Sábados', contact: '(11) 98222-3333', active: true },
        { id: 'sv_3', name: 'Carlos Roberto Machado', role: 'Visitas Fraternas', availability: 'Finais de Semana', contact: '(11) 98333-4444', active: true },
        { id: 'sv_4', name: 'Dr. Humberto de Campos', role: 'Consultas / Orientação Médica', availability: 'Quintas e Sábados', contact: '(11) 91234-5678', active: true }
      ];
      localStorage.setItem('social_voluntarios', JSON.stringify(defaultVoluntarios));
      setSocialVoluntarios(defaultVoluntarios);
    }

    // 7. Projetos e Oficinas
    const cachedProjetos = localStorage.getItem('social_projetos');
    if (cachedProjetos) {
      try { setSocialProjetos(JSON.parse(cachedProjetos)); } catch {}
    } else {
      const defaultProjetos = [
        { id: 'sp_1', name: 'Curso de Panificação Comunitária', objective: 'Capacitar mães em vulnerabilidade para produção autônoma de pães e bolos visando autonomia financeira.', target: 'Mães e Chefes de Família da Vila da Paz', coordinator: 'Clarice Lisbôa', schedule: 'Terças às 14:00', participantsCount: 12, status: 'Ativo' },
        { id: 'sp_2', name: 'Reforço Escolar Fraterno', objective: 'Auxílio pedagógico infantil sintonizado com lições de afeto e respeito fraterno baseado no Evangelho.', target: 'Crianças matriculadas do Morro da Glória', coordinator: 'Professor Lucas', schedule: 'Sábados às 09:30', participantsCount: 18, status: 'Ativo' },
        { id: 'sp_3', name: 'Oficina de Costura Fraterna (Enxovais)', objective: 'Confecção de enxovais para gestantes carentes sob amparo espiritual das mães voluntárias.', target: 'Gestantes da Unidade Básica de Saúde Local', coordinator: 'Eunice Vasconcelos', schedule: 'Quintas às 13:30', participantsCount: 8, status: 'Ativo' }
      ];
      localStorage.setItem('social_projetos', JSON.stringify(defaultProjetos));
      setSocialProjetos(defaultProjetos);
    }

    // 8. Visitas Fraternas
    const cachedVisitas = localStorage.getItem('social_visitas');
    if (cachedVisitas) {
      try { setSocialVisitas(JSON.parse(cachedVisitas)); } catch {}
    } else {
      const defaultVisitas = [
        { id: 'svi_1', assistidoId: 'as_2', assistidoName: 'João Batista dos Santos', date: '2026-05-21', responsible: 'Carlos Roberto Machado', situationFound: 'Lúcido, porém frágil física e emocionalmente. Apresentou dores nas articulações.', needsObserved: 'Necessita de acompanhamento médico e remédios de hipertensão da farmácia popular.', forwarding: 'Encaminhado relato ao Dr. Humberto para avaliação de telessaúde. Programado novo envio de sopa no sábado.' },
        { id: 'svi_2', assistidoId: 'as_1', assistidoName: 'Maria das Dores Silva', date: '2026-05-25', responsible: 'Francisco André', situationFound: 'Alojada em cômodos rústicos cedidos. Muitas moscas e humidade no quarto de Mateus.', needsObserved: 'Alergia de Mateus atacada. Necessita de materiais de limpeza adicionais (cloro e repelente).', forwarding: 'Separado e enviado do estoque kit higiênico e cloro. Sintonizada prece pela saúde de Mateus.' }
      ];
      localStorage.setItem('social_visitas', JSON.stringify(defaultVisitas));
      setSocialVisitas(defaultVisitas);
    }
  };

  // --- AÇÃO SOCIAL ESPÍRITA HANDLERS ---
  const handleAddAssistido = () => {
    let updated;
    const newAssistido = {
      id: editingAssistidoId || `as_${Date.now()}`,
      name: newAsName,
      cpf: newAsCpf,
      birthDate: newAsBirthDate,
      phone: newAsPhone,
      address: newAsAddress,
      neighborhood: newAsNeighborhood,
      city: newAsCity,
      isFamilyHead: newAsIsFamilyHead,
      familyHeadName: newAsFamilyHeadName,
      memberCount: Number(newAsMemberCount),
      housingStatus: newAsHousingStatus,
      schooling: newAsSchooling,
      occupation: newAsOccupation,
      familyIncome: Number(newAsFamilyIncome),
      specialNeeds: newAsSpecialNeeds,
      fraternalNotes: newAsFraternalNotes,
      employmentStatus: newAsEmploymentStatus,
      socialBenefits: newAsSocialBenefits,
      foodSecurity: newAsFoodSecurity,
      healthStatus: newAsHealthStatus,
      emotionalStatus: newAsEmotionalStatus,
      vulnerabilityLevel: newAsVulnerabilityLevel,
      hasChildrenUnder12: newAsHasChildrenUnder12,
      hasElderly: newAsHasElderly
    };

    if (editingAssistidoId) {
      updated = socialAssistidos.map(a => a.id === editingAssistidoId ? newAssistido : a);
      setEditingAssistidoId(null);
    } else {
      updated = [...socialAssistidos, newAssistido];
    }

    setSocialAssistidos(updated);
    localStorage.setItem('social_assistidos', JSON.stringify(updated));
    clearAssistidoForm();
    alert('Ficha cadastral de assistido armazenada com absoluto sigilo (LGPD)!');
  };

  const clearAssistidoForm = () => {
    setNewAsName('');
    setNewAsCpf('');
    setNewAsBirthDate('');
    setNewAsPhone('');
    setNewAsAddress('');
    setNewAsNeighborhood('');
    setNewAsCity('Mirante do Sul');
    setNewAsIsFamilyHead(true);
    setNewAsFamilyHeadName('');
    setNewAsMemberCount(1);
    setNewAsHousingStatus('Alugada');
    setNewAsSchooling('Fundamental Incompleto');
    setNewAsOccupation('Desempregado');
    setNewAsFamilyIncome(0);
    setNewAsSpecialNeeds('');
    setNewAsFraternalNotes('');
    setNewAsEmploymentStatus('Desempregado');
    setNewAsSocialBenefits('Nenhum');
    setNewAsFoodSecurity('Regular');
    setNewAsHealthStatus('Sadio');
    setNewAsEmotionalStatus('Estável');
    setNewAsVulnerabilityLevel('Média');
    setNewAsHasChildrenUnder12(false);
    setNewAsHasElderly(false);
  };

  const handleDeleteAssistido = (id: string, name: string) => {
    if (confirm(`Remover permanentemente a ficha de ${name}? Esta ação é irreversível.`)) {
      const updated = socialAssistidos.filter(a => a.id !== id);
      setSocialAssistidos(updated);
      localStorage.setItem('social_assistidos', JSON.stringify(updated));
    }
  };

  const handleAuditAccess = (assistidoId: string, name: string) => {
    const timestamp = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5);
    const newAudit = {
      id: `aud_${Date.now()}`,
      date: timestamp,
      user: currentUser?.name || 'Operador Social',
      action: 'Acesso Autorizado',
      details: `Visualizou detalhes do assistido ${name} (Ficha Socioeconômica & Prontuário).`
    };
    const updated = [newAudit, ...socialAuditLogs];
    setSocialAuditLogs(updated);
    localStorage.setItem('social_audit_logs', JSON.stringify(updated));
    setUnlockedSocialId(assistidoId);
    alert(`🔐 Acesso auditado registrado para ${currentUser?.name || 'Operador'}. Informações confidenciais habilitadas.`);
  };

  const handleAddSocialAtendimento = () => {
    const matched = socialAssistidos.find(a => a.id === newSoAtendAssistId);
    let updated;
    const itemData = {
      assistidoId: newSoAtendAssistId,
      assistidoName: matched ? matched.name : 'Vários / Assistido Geral',
      date: new Date().toISOString().split('T')[0],
      responsible: newSoAtendResp || currentUser?.name || 'Clarice Lisbôa',
      type: newSoAtendType,
      needIdentified: newSoAtendNeed,
      forwarding: newSoAtendForward,
      observations: newSoAtendObs,
      nextFollowUp: newSoAtendNextDate
    };

    if (editingSocialAtendId) {
      updated = socialAtendimentos.map(x => x.id === editingSocialAtendId ? { ...x, ...itemData } : x);
      setEditingSocialAtendId(null);
      alert('Registro de atendimento social atualizado com sucesso!');
    } else {
      updated = [
        ...socialAtendimentos,
        {
          id: `sat_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Atendimento fraterno social catalogado!');
    }
    setSocialAtendimentos(updated);
    localStorage.setItem('social_atendimentos', JSON.stringify(updated));
    setNewSoAtendAssistId('');
    setNewSoAtendResp('');
    setNewSoAtendNeed('');
    setNewSoAtendForward('');
    setNewSoAtendObs('');
    setNewSoAtendNextDate('');
  };

  const handleDeleteSocialAtendimento = (id: string) => {
    if (confirm('Deseja excluir este registro de atendimento?')) {
      const updated = socialAtendimentos.filter(x => x.id !== id);
      setSocialAtendimentos(updated);
      localStorage.setItem('social_atendimentos', JSON.stringify(updated));
    }
  };

  const handleStartEditSocialAtendimento = (item: any) => {
    setEditingSocialAtendId(item.id);
    setNewSoAtendAssistId(item.assistidoId || '');
    setNewSoAtendResp(item.responsible || '');
    setNewSoAtendType(item.type || 'Cesta básica');
    setNewSoAtendNeed(item.needIdentified || '');
    setNewSoAtendForward(item.forwarding || '');
    setNewSoAtendObs(item.observations || '');
    setNewSoAtendNextDate(item.nextFollowUp || '');
  };

  const handleStartEditSocialDoacao = (item: any) => {
    setEditingSocialDoacaoId(item.id);
    setNewSoDoacaoType(item.type || 'Alimentos');
    setNewSoDoacaoDesc(item.description || '');
    setNewSoDoacaoQty(item.qty || 1);
    setNewSoDoacaoUnit(item.unit || 'un');
    setNewSoDoacaoDonor(item.donor || '');
    setNewSoDoacaoEntryDate(item.entryDate || '');
    setNewSoDoacaoResponsible(item.responsible || '');
    setNewSoDoacaoExpiry(item.expiryDate || '');
  };

  const handleStartEditSocialCesta = (item: any) => {
    setEditingSocialCestaId(item.id);
    setNewSoCestaAssistId(item.assistidoId || '');
    setNewSoCestaType(item.basketType || 'Padrão');
    setNewSoCestaResp(item.responsible || '');
  };

  const handleStartEditSocialVoluntario = (item: any) => {
    setEditingSocialVoluntarioId(item.id);
    setNewSoVolName(item.name || '');
    setNewSoVolRole(item.role || 'Triagem');
    setNewSoVolAvailability(item.availability || 'Sábados');
    setNewSoVolContact(item.contact || '');
  };

  const handleStartEditSocialProjeto = (item: any) => {
    setEditingSocialProjetoId(item.id);
    setNewSoProjName(item.name || '');
    setNewSoProjObjective(item.objective || '');
    setNewSoProjTarget(item.target || '');
    setNewSoProjCoordinator(item.coordinator || '');
    setNewSoProjSchedule(item.schedule || '');
    setNewSoProjStatus(item.status || 'Planejado');
  };

  const handleStartEditSocialVisita = (item: any) => {
    setEditingSocialVisitaId(item.id);
    setNewSoVisitaAssistId(item.assistidoId || '');
    setNewSoVisitaResp(item.responsible || '');
    setNewSoVisitaSituation(item.situationFound || '');
    setNewSoVisitaNeeds(item.needsObserved || '');
    setNewSoVisitaForward(item.forwarding || '');
  };

  const handleAddSocialDoacao = () => {
    let updated;
    const itemData = {
      type: newSoDoacaoType,
      description: newSoDoacaoDesc,
      qty: Number(newSoDoacaoQty),
      unit: newSoDoacaoUnit,
      donor: newSoDoacaoDonor || 'Doador Anônimo',
      entryDate: newSoDoacaoEntryDate || new Date().toISOString().split('T')[0],
      responsible: newSoDoacaoResponsible || currentUser?.name || 'Voluntário',
      expiryDate: newSoDoacaoExpiry,
      status: 'Disponível'
    };

    if (editingSocialDoacaoId) {
      updated = socialDoacoes.map(x => x.id === editingSocialDoacaoId ? { ...x, ...itemData } : x);
      setEditingSocialDoacaoId(null);
      alert('Doação / Estoque alterado com sucesso!');
    } else {
      updated = [
        ...socialDoacoes,
        {
          id: `don_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Doação incorporatória cadastrada com sucesso!');
    }
    setSocialDoacoes(updated);
    localStorage.setItem('social_doacoes', JSON.stringify(updated));
    setNewSoDoacaoDesc('');
    setNewSoDoacaoQty(1);
    setNewSoDoacaoDonor('');
    setNewSoDoacaoExpiry('');
    setNewSoDoacaoResponsible('');
  };

  const handleDeleteSocialDoacao = (id: string) => {
    if (confirm('Deseja excluir este lançamento de doação?')) {
      const updated = socialDoacoes.filter(x => x.id !== id);
      setSocialDoacoes(updated);
      localStorage.setItem('social_doacoes', JSON.stringify(updated));
    }
  };

  const handleAddSocialCestaEntrega = () => {
    const matched = socialAssistidos.find(a => a.id === newSoCestaAssistId);
    if (!newSoCestaAssistId) {
      alert('Selecione uma família ou assistido beneficente.');
      return;
    }
    let updated;
    const itemData = {
      assistidoId: newSoCestaAssistId,
      assistidoName: matched ? matched.name : 'Assistido Beneficiado',
      date: new Date().toISOString().split('T')[0],
      basketType: newSoCestaType,
      responsible: newSoCestaResp || currentUser?.name || 'Entregador Voluntário',
      signatureConfirmed: true,
      qrCodeScanned: false
    };

    if (editingSocialCestaId) {
      updated = socialCestasEntregas.map(x => x.id === editingSocialCestaId ? { ...x, ...itemData } : x);
      setEditingSocialCestaId(null);
      alert('Recibo de Cesta Básica atualizado com sucesso!');
    } else {
      updated = [
        ...socialCestasEntregas,
        {
          id: `sc_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Recibo de Cesta Básica registrado via assinatura digital da casa!');
    }
    setSocialCestasEntregas(updated);
    localStorage.setItem('social_cestas', JSON.stringify(updated));
    setNewSoCestaAssistId('');
    setNewSoCestaResp('');
  };

  const handleDeleteSocialCestaEntrega = (id: string) => {
    if (confirm('Deseja remover este recibo de cesta básica?')) {
      const updated = socialCestasEntregas.filter(x => x.id !== id);
      setSocialCestasEntregas(updated);
      localStorage.setItem('social_cestas', JSON.stringify(updated));
    }
  };

  const handleAddSocialVoluntario = () => {
    let updated;
    const itemData = {
      name: newSoVolName,
      role: newSoVolRole,
      availability: newSoVolAvailability,
      contact: newSoVolContact,
      active: true
    };

    if (editingSocialVoluntarioId) {
      updated = socialVoluntarios.map(x => x.id === editingSocialVoluntarioId ? { ...x, ...itemData } : x);
      setEditingSocialVoluntarioId(null);
      alert('Cadastro de trabalhador social atualizado!');
    } else {
      updated = [
        ...socialVoluntarios,
        {
          id: `sv_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Novo voluntário vinculado com carinho ao módulo social!');
    }
    setSocialVoluntarios(updated);
    localStorage.setItem('social_voluntarios', JSON.stringify(updated));
    setNewSoVolName('');
    setNewSoVolContact('');
    setNewSoVolAvailability('Sábados');
  };

  const handleDeleteSocialVoluntario = (id: string) => {
    if (confirm('Deseja desligar este trabalhador social?')) {
      const updated = socialVoluntarios.filter(x => x.id !== id);
      setSocialVoluntarios(updated);
      localStorage.setItem('social_voluntarios', JSON.stringify(updated));
    }
  };

  const handleAddSocialProjeto = () => {
    let updated;
    const itemData = {
      name: newSoProjName,
      objective: newSoProjObjective,
      target: newSoProjTarget,
      coordinator: newSoProjCoordinator || currentUser?.name || 'Coordenação',
      schedule: newSoProjSchedule,
      status: newSoProjStatus,
      participantsCount: 10
    };

    if (editingSocialProjetoId) {
      updated = socialProjetos.map(x => x.id === editingSocialProjetoId ? { ...x, ...itemData } : x);
      setEditingSocialProjetoId(null);
      alert('Iniciativa socioeducativa editada com sucesso!');
    } else {
      updated = [
        ...socialProjetos,
        {
          id: `sp_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Atendimento cooperativo/oficina criada!');
    }
    setSocialProjetos(updated);
    localStorage.setItem('social_projetos', JSON.stringify(updated));
    setNewSoProjName('');
    setNewSoProjObjective('');
    setNewSoProjTarget('');
    setNewSoProjSchedule('');
    setNewSoProjCoordinator('');
  };

  const handleDeleteSocialProjeto = (id: string) => {
    if (confirm('Remover esta iniciativa socioeducativa?')) {
      const updated = socialProjetos.filter(x => x.id !== id);
      setSocialProjetos(updated);
      localStorage.setItem('social_projetos', JSON.stringify(updated));
    }
  };

  const handleAddSocialVisita = () => {
    const matched = socialAssistidos.find(a => a.id === newSoVisitaAssistId);
    if (!newSoVisitaAssistId) {
      alert('Assinale a residência visitada.');
      return;
    }
    let updated;
    const itemData = {
      assistidoId: newSoVisitaAssistId,
      assistidoName: matched ? matched.name : 'Família Visitada',
      date: new Date().toLocaleDateString('pt-BR'),
      responsible: newSoVisitaResp || currentUser?.name || 'Visitador Voluntário',
      situationFound: newSoVisitaSituation,
      needsObserved: newSoVisitaNeeds,
      forwarding: newSoVisitaForward
    };

    if (editingSocialVisitaId) {
      updated = socialVisitas.map(x => x.id === editingSocialVisitaId ? { ...x, ...itemData } : x);
      setEditingSocialVisitaId(null);
      alert('Relatório de Visita Fraterna atualizado!');
    } else {
      updated = [
        ...socialVisitas,
        {
          id: `svi_${Date.now()}`,
          ...itemData
        }
      ];
      alert('Relatório de Visita Fraterna registrado e arquivado!');
    }
    setSocialVisitas(updated);
    localStorage.setItem('social_visitas', JSON.stringify(updated));
    setNewSoVisitaAssistId('');
    setNewSoVisitaResp('');
    setNewSoVisitaSituation('');
    setNewSoVisitaNeeds('');
    setNewSoVisitaForward('');
  };

  const handleDeleteSocialVisita = (id: string) => {
    if (confirm('Remover relatório de visita?')) {
      const updated = socialVisitas.filter(x => x.id !== id);
      setSocialVisitas(updated);
      localStorage.setItem('social_visitas', JSON.stringify(updated));
    }
  };

  // Generate jsPDF Report
  const generateSocialPdfReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // Rose theme
    doc.text('SETOR DE AÇÃO SOCIAL ESPÍRITA', 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('ASSOCIAÇÃO ESPÍRITA MIRANTE DE LUZ', 14, 26);
    doc.text(`Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} por ${currentUser?.name || 'Administrador'}`, 14, 32);

    doc.line(14, 36, 196, 36);

    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('FAMÍLIAS ASSISTIDAS & COBERTURA ATUAL (AGREGADO)', 14, 44);

    const tableRows = socialAssistidos.map((as, index) => [
      index + 1,
      as.name,
      as.neighborhood,
      `R$ ${as.familyIncome.toFixed(2)}`,
      `${as.memberCount} pessoas`,
      as.vulnerabilityLevel,
      as.socialBenefits
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['Nº', 'Nome Assistido', 'Bairro', 'Renda Familiar', 'Moradores', 'Vulnerabilidade', 'Benefícios']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.text('CONSOLIDAÇÃO OPERACIONAL SOCIAL', 14, finalY);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`- Total de Famílias em Acompanhamento Ativo: ${socialAssistidos.length}`, 14, finalY + 7);
    doc.text(`- Doações Estocadas: ${socialDoacoes.length} itens triados`, 14, finalY + 13);
    doc.text(`- Entregas de Cestas Básicas neste mês: ${socialCestasEntregas.length} famílias atendidas`, 14, finalY + 19);
    doc.text(`- Corpo de Voluntários Doutrinários Ativos: ${socialVoluntarios.length} trabalhadores`, 14, finalY + 25);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('O sigilo das informações e os relatórios psicológicos/médicos contidos nos prontuários individuais', 14, finalY + 36);
    doc.text('são integralmente salvaguardados conforme os preceitos de privacidade de dados (LGPD) e sigilo social.', 14, finalY + 41);

    doc.save(`Acao_Social_Mirante_Luz_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
    if (isAdministrativo || isAdvancedSubSector) {
      loadAdminData();
    }
    if (isSocial) {
      loadSocialData();
    }
    if (isDoutrinario) {
      loadDoutrinarioData();
    }
  }, [currentViewSectorId, isAdministrativo, isAdvancedSubSector, isSocial, isDoutrinario]);

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

    // 10. Estudos Espíritas Load
    const cachedStudyCategories = localStorage.getItem('study_categories');
    if (cachedStudyCategories) {
      try { setStudyCategories(JSON.parse(cachedStudyCategories)); } catch {}
    } else {
      const defaultCategories = [
        { id: 'ESDE', name: 'ESDE (Básico/Sistematizado)' },
        { id: 'AVANCADO', name: 'EADE / Estudo Avançado' },
        { id: 'MEDIUNICO', name: 'Desenvolvimento Mediúnico' },
        { id: 'PALESTRA', name: 'Palestras / Aperfeiçoamento' }
      ];
      localStorage.setItem('study_categories', JSON.stringify(defaultCategories));
      setStudyCategories(defaultCategories);
    }

    const cachedStudyCourses = localStorage.getItem('study_courses');
    if (cachedStudyCourses) {
      try { setStudyCourses(JSON.parse(cachedStudyCourses)); } catch {}
    } else {
      const defaultCourses = [
        { id: 'c1', name: 'ESDE - Estudo Sistematizado da Doutrina Espírita I', category: 'ESDE', hours: 40, coord: 'Roberto Dias', status: 'Ativo' },
        { id: 'c2', name: 'EADE - Estudo Aprofundado da Doutrina Espírita', category: 'ESDE', hours: 60, coord: 'Ana Maria', status: 'Ativo' },
        { id: 'c3', name: 'Estudo do Livro dos Espíritos', category: 'AVANCADO', hours: 30, coord: 'Mário Rezende', status: 'Ativo' },
        { id: 'c4', name: 'Estudos e Prática da Mediunidade I', category: 'MEDIUNICO', hours: 50, coord: 'Clara Nogueira', status: 'Ativo' }
      ];
      localStorage.setItem('study_courses', JSON.stringify(defaultCourses));
      setStudyCourses(defaultCourses);
    }

    const cachedStudyClasses = localStorage.getItem('study_classes');
    if (cachedStudyClasses) {
      try { setStudyClasses(JSON.parse(cachedStudyClasses)); } catch {}
    } else {
      const defaultClasses = [
        { id: 'cl1', courseId: 'c1', name: 'ESDE I - Segunda 19h30', facilitator: 'Roberto Dias', schedule: 'Segundas, 19:30', room: 'Sala de Aula 1', maxQty: 30, activeQty: 12 },
        { id: 'cl2', courseId: 'c2', name: 'EADE II - Sábado 14h00', facilitator: 'Ana Maria', schedule: 'Sábados, 14:00', room: 'Sala de Aula 2', maxQty: 25, activeQty: 8 },
        { id: 'cl3', courseId: 'c3', name: 'O Livro dos Espíritos - Quarta 20h00', facilitator: 'Mário Rezende', schedule: 'Quartas, 20:00', room: 'Biblioteca', maxQty: 20, activeQty: 10 }
      ];
      localStorage.setItem('study_classes', JSON.stringify(defaultClasses));
      setStudyClasses(defaultClasses);
    }

    const cachedStudyStudents = localStorage.getItem('study_students');
    if (cachedStudyStudents) {
      try { setStudyStudents(JSON.parse(cachedStudyStudents)); } catch {}
    } else {
      const defaultStudents = [
        { id: 'st1', name: 'Carlos Antunes Pinheiro', email: 'carlos@email.com', phone: '(11) 98212-3344', classId: 'cl1', presence: [true, true, false, true, true], warnings: 0, status: 'Ativo' },
        { id: 'st2', name: 'Fernanda Silveira', email: 'fernandinha@email.com', phone: '(11) 98451-2299', classId: 'cl1', presence: [true, true, true, true, true], warnings: 0, status: 'Ativo' },
        { id: 'st3', name: 'Mário José dos Santos', email: 'mario.s@email.com', phone: '(11) 99122-8877', classId: 'cl2', presence: [true, false, false, false, true], warnings: 1, status: 'Alerta (Frequência)' },
        { id: 'st4', name: 'Gisele Alves Ribeiro', email: 'gisele.a@email.com', phone: '(11) 98777-6632', classId: 'cl3', presence: [true, true, true, true, false], warnings: 0, status: 'Ativo' }
      ];
      localStorage.setItem('study_students', JSON.stringify(defaultStudents));
      setStudyStudents(defaultStudents);
    }

    const cachedStudyMaterials = localStorage.getItem('study_materials');
    if (cachedStudyMaterials) {
      try { setStudyMaterials(JSON.parse(cachedStudyMaterials)); } catch {}
    } else {
      const defaultMaterials = [
        { id: 'm1', name: 'Apostila ESDE Tomo Único - FEB (Completo)', type: 'PDF', author: 'FEB Editorial', size: '14.2 MB', courseId: 'c1' },
        { id: 'm2', name: 'O Livro dos Espíritos (Edição Comentada)', type: 'PDF', author: 'Allan Kardec / FEB', size: '4.8 MB', courseId: 'c3' },
        { id: 'm3', name: 'Planejamento Pedagógico e Dinâmicas de Aula', type: 'PDF', author: 'Área de Estudos Mirante', size: '1.2 MB', courseId: 'c1' },
        { id: 'm4', name: 'A Gênese - Vídeo Aula de Introdução', type: 'VÍDEO', author: 'Canal Doutrina & Luz', duration: '45 min', courseId: 'c3' }
      ];
      localStorage.setItem('study_materials', JSON.stringify(defaultMaterials));
      setStudyMaterials(defaultMaterials);
    }

    // 11. Evangelização Load
    const cachedEvaRooms = localStorage.getItem('eva_rooms');
    if (cachedEvaRooms) {
      try { setEvangelizacaoRooms(JSON.parse(cachedEvaRooms)); } catch {}
    } else {
      const defaultEvaRooms = [
        { id: 'er1', name: 'Maternal e Jardim (3 a 6 anos)', schedule: 'Sábados, 15:00', room: 'Sala Infantil A', leaders: 'Sandra & Helena', count: 12 },
        { id: 'er2', name: 'Primário I e II (7 a 10 anos)', schedule: 'Sábados, 15:00', room: 'Sala Infantil B', leaders: 'Júlio & Regina', count: 18 },
        { id: 'er3', name: 'Mocidade Espírita (11 a 15 anos)', schedule: 'Sábados, 16h30', room: 'Salão Mezanino', leaders: 'Fábio & Cris', count: 14 }
      ];
      localStorage.setItem('eva_rooms', JSON.stringify(defaultEvaRooms));
      setEvangelizacaoRooms(defaultEvaRooms);
    }

    const cachedEvaKids = localStorage.getItem('eva_kids');
    if (cachedEvaKids) {
      try { setEvangelizacaoKids(JSON.parse(cachedEvaKids)); } catch {}
    } else {
      const defaultEvaKids = [
        { id: 'k1', name: 'Arthur Dias Souza', age: 5, roomId: 'er1', responsible: 'Fernanda de Souza Santos', phone: '(11) 98124-5511', allergies: 'Glúten', authorized: true, presenceToday: true },
        { id: 'k2', name: 'Beatriz Neves', age: 8, roomId: 'er2', responsible: 'Wellington Silva Neves', phone: '(11) 99187-0099', allergies: 'Nenhuma', authorized: true, presenceToday: true },
        { id: 'k3', name: 'Mateus Cardoso', age: 14, roomId: 'er3', responsible: 'Amanda Cardoso', phone: '(11) 98444-1212', allergies: 'Lactose', authorized: true, presenceToday: false }
      ];
      localStorage.setItem('eva_kids', JSON.stringify(defaultEvaKids));
      setEvangelizacaoKids(defaultEvaKids);
    }

    // 12. Estudos Mediúnicos Load
    const cachedMediGroups = localStorage.getItem('medi_groups');
    if (cachedMediGroups) {
      try { setMediunicaGroups(JSON.parse(cachedMediGroups)); } catch {}
    } else {
      const defaultMediGroups = [
        { id: 'mg1', name: 'Grupo de Desobsessão Bezerra de Menezes', schedule: 'Quartas, 20h00', leader: 'Pr. Francisco Xavier', room: 'Sala de Fluídos B (Privada)', count: 12, security: 'RESTRICTED_DIRIGENTE' },
        { id: 'mg2', name: 'Grupo de Educação Mediúnica Prática', schedule: 'Sábados, 16h30', leader: 'Luiza Alves', room: 'Sala de Fluídos A (Privada)', count: 8, security: 'RESTRICTED_MEMBERS' }
      ];
      localStorage.setItem('medi_groups', JSON.stringify(defaultMediGroups));
      setMediunicaGroups(defaultMediGroups);
    }

    const cachedMediMembers = localStorage.getItem('medi_members');
    if (cachedMediMembers) {
      try { setMediunicaMembers(JSON.parse(cachedMediMembers)); } catch {}
    } else {
      const defaultMediMembers = [
        { id: 'mm1', name: 'Francisco Xavier', role: 'Dirigente', groupId: 'mg1', presence: [true, true, true], notes: 'Dirigindo com harmonia e passes fluídicos ativos.' },
        { id: 'mm2', name: 'Luísa Nogueira', role: 'Médium de Edificação', groupId: 'mg1', presence: [true, true, false], notes: 'Relato de sensibilidade auditiva na última seção.' },
        { id: 'mm3', name: 'Pedro Rezende', role: 'Médium de Edificação / Diálogo', groupId: 'mg1', presence: [true, false, true], notes: 'Facilitador de esclarecimento evangélico.' },
        { id: 'mm4', name: 'Marcos Ortiz', role: 'Médium de Passes', groupId: 'mg2', presence: [true, true, true], notes: 'Frequência perfeita nas reuniões de educação.' }
      ];
      localStorage.setItem('medi_members', JSON.stringify(defaultMediMembers));
      setMediunicaMembers(defaultMediMembers);
    }

    // Advanced Mediunica Module Loads
    const cachedMediEscalas = localStorage.getItem('medi_escalas');
    if (cachedMediEscalas) {
      try { setMediunicaEscalas(JSON.parse(cachedMediEscalas)); } catch {}
    } else {
      const defaultMediEscalas = [
        { id: 'me1', date: '2026-06-03', groupName: 'Grupo de Desobsessão Bezerra de Menezes', workers: ['Francisco Xavier', 'Luísa Nogueira', 'Pedro Rezende'], leader: 'Francisco Xavier', notes: 'Sustentação fluídica intensificada.' },
        { id: 'me2', date: '2026-06-06', groupName: 'Grupo de Educação Mediúnica Prática', workers: ['Marcos Ortiz', 'Clara Nogueira'], leader: 'Clara Nogueira', notes: 'Exercício prático de psicofonia e intuição.' }
      ];
      localStorage.setItem('medi_escalas', JSON.stringify(defaultMediEscalas));
      setMediunicaEscalas(defaultMediEscalas);
    }

    const cachedMediCursos = localStorage.getItem('medi_cursos');
    if (cachedMediCursos) {
      try { setMediunicaCursos(JSON.parse(cachedMediCursos)); } catch {}
    } else {
      const defaultMediCursos = [
        { id: 'mc1', name: 'Estudo Sistematizado do Livro dos Médiuns', facilitator: 'Julio Cezar', hours: 60, material: 'O Livro dos Médiuns (Allan Kardec)', active: true },
        { id: 'mc2', name: 'Curso de Dialogadores e Esclarecedores', facilitator: 'Marta Helena', hours: 40, material: 'Diálogo com as Sombras (Hermínio Miranda)', active: true },
        { id: 'mc3', name: 'Educação Mediúnica Teoria e Prática', facilitator: 'Clara Nogueira', hours: 80, material: 'Diretrizes de Segurança Mediúnica', active: true }
      ];
      localStorage.setItem('medi_cursos', JSON.stringify(defaultMediCursos));
      setMediunicaCursos(defaultMediCursos);
    }

    const cachedMediReferrals = localStorage.getItem('medi_referrals');
    if (cachedMediReferrals) {
      try { setMediunicaReferrals(JSON.parse(cachedMediReferrals)); } catch {}
    } else {
      const defaultMediReferrals = [
        { id: 'mr1', name: 'Roberto da Silva', origin: 'Atendimento Fraterno', destination: 'Grupo de Desobsessão Bezerra de Menezes', reason: 'Forte sensibilidade ostensiva e fobia recorrente', obs: 'Relato de perturbação durante o sono profunda.', isClosed: false, date: '2026-05-28' },
        { id: 'mr2', name: 'Mariana G. Couto', origin: 'Mocidade / Triagem', destination: 'Grupo de Educação Mediúnica Prática', reason: 'Desejo de educar mediunidade de intuição', obs: 'Sensações constantes de presença espiritual sem gravidade.', isClosed: false, date: '2026-05-29' }
      ];
      localStorage.setItem('medi_referrals', JSON.stringify(defaultMediReferrals));
      setMediunicaReferrals(defaultMediReferrals);
    }

    const cachedMediRooms = localStorage.getItem('medi_rooms');
    if (cachedMediRooms) {
      try { setMediunicaRooms(JSON.parse(cachedMediRooms)); } catch {}
    } else {
      const defaultMediRooms = [
        { id: 'mrm1', name: 'Sala Eurípedes Barsanulfo (Fluídos B)', type: 'Desobsessão e Fluidoterapia', capacity: 15, status: 'Livre', resp: 'Roberto de Sousa' },
        { id: 'mrm2', name: 'Sala Bezerra de Menezes (Fluídos A)', type: 'Atendimento e Passes', capacity: 20, status: 'Livre', resp: 'Elza Santos' }
      ];
      localStorage.setItem('medi_rooms', JSON.stringify(defaultMediRooms));
      setMediunicaRooms(defaultMediRooms);
    }

    const cachedMediAcolhimento = localStorage.getItem('medi_acolhimento');
    if (cachedMediAcolhimento) {
      try { setMediunicaAcolhimento(JSON.parse(cachedMediAcolhimento)); } catch {}
    } else {
      const defaultMediAcolhimento = [
        { id: 'mac1', workerName: 'Luísa Nogueira', need: 'Sobrecarga Emocional / Perda Familiar', status: 'Fragilizado', recommendation: 'Passe de sustentação individual antes do início do grupo e repouso de tarefas de psicofonia ativa se preferir.' },
        { id: 'mac2', workerName: 'Marcos Ortiz', need: 'Tratamento de Saúde em Família', status: 'Instável', recommendation: 'Manter na equipe de sustentação silenciosa por duas semanas para redução de carga mental.' }
      ];
      localStorage.setItem('medi_acolhimento', JSON.stringify(defaultMediAcolhimento));
      setMediunicaAcolhimento(defaultMediAcolhimento);
    }

    const cachedMediLogs = localStorage.getItem('medi_logs');
    if (cachedMediLogs) {
      try { setMediunicaLogs(JSON.parse(cachedMediLogs)); } catch {}
    } else {
      const defaultMediLogs = [
        { id: 'ml1', timestamp: '2026-05-30T10:15:00Z', user: 'carlostecal35@gmail.com', action: 'Visualização de Registros', details: 'Acessou prontuário de encaminhamentos espirituais restritos (Atendimento Fraterno).' },
        { id: 'ml2', timestamp: '2026-05-30T10:20:00Z', user: 'carlostecal35@gmail.com', action: 'Geração de Chave Privada', details: 'Renovação de token de criptografia de observações espirituais restritas (O Livro dos Médiuns, cap. XXVI).' },
        { id: 'ml3', timestamp: '2026-05-30T11:45:00Z', user: 'carlostecal35@gmail.com', action: 'Edição de Escala', details: 'Atualizou escala de obreiros para 03 de Junho.' }
      ];
      localStorage.setItem('medi_logs', JSON.stringify(defaultMediLogs));
      setMediunicaLogs(defaultMediLogs);
    }

    // 13. Arte Espírita Load
    const cachedArteGroups = localStorage.getItem('arte_groups');
    if (cachedArteGroups) {
      try { setArteGroups(JSON.parse(cachedArteGroups)); } catch {}
    } else {
      const defaultArteGroups = [
        { id: 'ag1', name: 'Coral Vozes de Luz', modality: 'MÚSICA', coordinator: 'Regina Vasconcelos', qty: 15, schedule: 'Sábados, 14:00', status: 'Ativo' },
        { id: 'ag2', name: 'Cia de Teatro Allan Kardec', modality: 'TEATRO', coordinator: 'Juliano Goulart', qty: 8, schedule: 'Sábados, 16h30', status: 'Ativo' },
        { id: 'ag3', name: 'Grupo de Poesia & Declamação Meimei', modality: 'POESIA', coordinator: 'Beatriz Ramos', qty: 5, schedule: 'Sextas, 19h30', status: 'Ativo' }
      ];
      localStorage.setItem('arte_groups', JSON.stringify(defaultArteGroups));
      setArteGroups(defaultArteGroups);
    }

    const cachedArteMusicas = localStorage.getItem('arte_musicas');
    if (cachedArteMusicas) {
      try { setArteMusicas(JSON.parse(cachedArteMusicas)); } catch {}
    } else {
      const defaultArteMusicas = [
        { id: 'am1', name: 'A Paz do Coração', author: 'Nando Cordel', theme: 'Paz Interior & Prece', category: 'Coral', key: 'G Major', duration: '3:45' },
        { id: 'am2', name: 'Canção do Infinito', author: 'Grupo Vocal Fraternidade', theme: 'Imortalidade da Alma', category: 'Vila Espírita', key: 'C Major', duration: '4:10' },
        { id: 'am3', name: 'Flores de Luz', author: 'Regina Vasconcelos', theme: 'Esperança e Reforma Íntima', category: 'Solista', key: 'F Major', duration: '3:20' }
      ];
      localStorage.setItem('arte_musicas', JSON.stringify(defaultArteMusicas));
      setArteMusicas(defaultArteMusicas);
    }

    const cachedArtePecas = localStorage.getItem('arte_pecas');
    if (cachedArtePecas) {
      try { setArtePecas(JSON.parse(cachedArtePecas)); } catch {}
    } else {
      const defaultArtePecas = [
        { id: 'ap1', name: 'O Despertar do Espírito', theme: 'Livre-Arbítrio e Escolhas', author: 'Juliano Goulart', duration: '45 min', message: 'Ilustração do arrependimento e reparação na vida espiritual.' },
        { id: 'ap2', name: 'O Pão do Caminho', theme: 'Caridade Cristã e Auxílio', author: 'Inspirada em Meimei', duration: '30 min', message: 'A beleza dos pequenos atos de amor cotidianos.' }
      ];
      localStorage.setItem('arte_pecas', JSON.stringify(defaultArtePecas));
      setArtePecas(defaultArtePecas);
    }

    const cachedArteEnsaios = localStorage.getItem('arte_ensaios');
    if (cachedArteEnsaios) {
      try { setArteEnsaios(JSON.parse(cachedArteEnsaios)); } catch {}
    } else {
      const defaultArteEnsaios = [
        { id: 'ae1', groupId: 'ag1', date: '2026-05-30', time: '14:00', local: 'Salão Principal', activity: 'Ensaio Geral da Cantata de Primavera', presentQty: 12, totalQty: 15 },
        { id: 'ae2', groupId: 'ag2', date: '2026-05-30', time: '16:30', local: 'Auditório Infantil', activity: 'Ajuste de Roteiro e Foco Cenográfico', presentQty: 7, totalQty: 8 }
      ];
      localStorage.setItem('arte_ensaios', JSON.stringify(defaultArteEnsaios));
      setArteEnsaios(defaultArteEnsaios);
    }

    const cachedArteEventos = localStorage.getItem('arte_eventos');
    if (cachedArteEventos) {
      try { setArteEventos(JSON.parse(cachedArteEventos)); } catch {}
    } else {
      const defaultArteEventos = [
        { id: 'aev1', name: 'V Sarau de Arte e Fraternidade', theme: 'A Luz que nos Guia', date: '2026-06-15', local: 'Salão Comunitário', coordinator: 'Regina Vasconcelos', estimate: '120 pessoas' },
        { id: 'aev2', name: 'Mostra Regional de Teatro Espírita', theme: 'A Vida no Invisível', date: '2026-07-04', local: 'Teatro Carlos Gomes', coordinator: 'Juliano Goulart', estimate: '250 pessoas' }
      ];
      localStorage.setItem('arte_eventos', JSON.stringify(defaultArteEventos));
      setArteEventos(defaultArteEventos);
    }

    // --- COMUNICAÇÃO ESPÍRITA INITIALIZERS ---
    const cachedComs = localStorage.getItem('com_comunicados');
    if (cachedComs) {
      try { setComunicados(JSON.parse(cachedComs)); } catch {}
    } else {
      const defaultComs = [
        { id: 'com1', title: 'Início da Campanha do Agasalho 2026', category: 'Campanhas', content: 'Conclamamos todos os irmãos a participarem da triagem e arrecadação de cobertores para as famílias assistidas pela nossa casa.', author: 'Coordenação Geral', date: '2026-05-20', target: 'Público Geral', status: 'publicado' },
        { id: 'com2', title: 'Nova Turma de Educação Mediúnica', category: 'Estudos', content: 'Estão abertas as fichas de matrícula para o ciclo prático intensivo do Livro dos Médiuns, aos sábados à tarde.', author: 'Coordenação de Estudos', date: '2026-05-22', target: 'Médiuns', status: 'publicado' },
        { id: 'com3', title: 'Plantão de Leitura Doutrinária', category: 'Reuniões', content: 'Pedimos atenção ao cronograma de escalas para a prece de abertura da palestra pública de Junho.', author: 'Área de Comunicação', date: '2026-05-25', target: 'Trabalhadores', status: 'rascunho' }
      ];
      localStorage.setItem('com_comunicados', JSON.stringify(defaultComs));
      setComunicados(defaultComs);
    }

    const cachedPosts = localStorage.getItem('com_social_posts');
    if (cachedPosts) {
      try { setSocialPosts(JSON.parse(cachedPosts)); } catch {}
    } else {
      const defaultPosts = [
        { id: 'sp1', title: 'Post: Mensagem de Emmanuel', text: 'A caridade é o amor em movimento. Lembremo-nos de auxiliar com alegria e sem preconceitos na jornada.', platform: 'Instagram', date: '2026-05-30', hashtags: '#emmanuel #espiritismo #caridade', status: 'Planejado', responsible: 'Andréia Ramos' },
        { id: 'sp2', title: 'Live: O Livro dos Espíritos - Q100', text: 'Transmissão ao vivo com estudo fraterno com base nas perguntas da escala espírita.', platform: 'YouTube', date: '2026-06-01', hashtags: '#livrodosespiritos #kardec #estudoespirita', status: 'Agendado', responsible: 'Gabriel Chaves' }
      ];
      localStorage.setItem('com_social_posts', JSON.stringify(defaultPosts));
      setSocialPosts(defaultPosts);
    }

    const cachedMidia = localStorage.getItem('com_midias');
    if (cachedMidia) {
      try { setMidias(JSON.parse(cachedMidia)); } catch {}
    } else {
      const defaultMidia = [
        { id: 'md1', name: 'Folder: Palestra de Sábado', category: 'Artes e Design', designer: 'Lívia Gimenes', url: 'https://img.example.com/banner-sabado.png', status: 'Aprovado', spiritObjective: 'Divulgar a palestra pública com foco no consolo aos corações aflitos.' },
        { id: 'md2', name: 'Podcast: Gotas de Prece - Eps 32', category: 'Podcasts', designer: 'Mateus Lima', url: 'https://audio.example.com/gotas-prece-32.mp3', status: 'Em Revisão Doutrinária', spiritObjective: 'Auxiliar na harmonização matinal diária por meio de pequenos pensamentos evangélicos.' }
      ];
      localStorage.setItem('com_midias', JSON.stringify(defaultMidia));
      setMidias(defaultMidia);
    }

    const cachedEquipe = localStorage.getItem('com_equipe');
    if (cachedEquipe) {
      try { setEquipeMembros(JSON.parse(cachedEquipe)); } catch {}
    } else {
      const defaultEquipe = [
        { id: 'eq1', name: 'Andréia Ramos', role: 'Social Media', availability: 'Sábados e Domingos', equipments: 'Celular Pessoal / Canva' },
        { id: 'eq2', name: 'Lívia Gimenes', role: 'Designer', availability: 'Sextas e Segundas', equipments: 'Notebook / Creative Cloud' },
        { id: 'eq3', name: 'Gabriel Chaves', role: 'Revisor Doutrinário', availability: 'Diária (Remoto)', equipments: 'Obras Básicas de Kardec' }
      ];
      localStorage.setItem('com_equipe', JSON.stringify(defaultEquipe));
      setEquipeMembros(defaultEquipe);
    }

    const cachedCampanhas = localStorage.getItem('com_campanhas');
    if (cachedCampanhas) {
      try { setCampanhas(JSON.parse(cachedCampanhas)); } catch {}
    } else {
      const defaultCampanhas = [
        { id: 'cam1', name: 'Alimentando Almas - Sopão Fraterno', objective: 'Amparo social e pregação do evangelho em bairros de vulnerabilidade.', target: 'Famílias Carentes', date: '2026-06-10', responsible: 'Andréia Ramos', status: 'Planejada', media: 'https://drive.google.com/drive/folders/sopao', result: 'Previsão de 100 refeições e folhetos de esclarecimento.' },
        { id: 'cam2', name: 'Feira do Livro de Kardec 2026', objective: 'Divulgação em praça pública das obras fundamentais espíritas a preços subsidiados.', target: 'Público Geral', date: '2026-04-18', responsible: 'Lívia Gimenes', status: 'Concluída', media: 'https://photos.app.goo.gl/feira-kardec', result: '143 livros vendidos e dezenas de esclarecimentos consoladores.' }
      ];
      localStorage.setItem('com_campanhas', JSON.stringify(defaultCampanhas));
      setCampanhas(defaultCampanhas);
    }

    // --- PASSE E FLUIDOTERAPIA INITIALIZERS ---
    const cachedPasseAtendimentos = localStorage.getItem('passe_atendimentos');
    if (cachedPasseAtendimentos) {
      try { setPasseAtendimentos(JSON.parse(cachedPasseAtendimentos)); } catch {}
    } else {
      const defaultPasseAtend = [
        { id: 'pa1', name: 'Alvaro Fontes', date: '2026-05-29', time: '19:30', type: 'Passe magnético', sala: 'Sala 1 - Bezerra de Menezes', passista: 'Claudio Ferreira', encaminhamento: 'Tratamento Espiritual Avançado', status: 'Aguardando', obs: 'Relatou forte estresse acumulado e insônia.' },
        { id: 'pa2', name: 'Maria da Penha', date: '2026-05-29', time: '19:35', type: 'Fluidoterapia', sala: 'Sala 2 - Meimei', passista: 'Denise Martins', encaminhamento: 'Evangelho no Lar Semanal', status: 'Em Atendimento', obs: 'Necessidade de harmonização familiar.' },
        { id: 'pa3', name: 'Carlos Eduardo', date: '2026-05-29', time: '19:40', type: 'Passe simples', sala: 'Sala 1 - Bezerra de Menezes', passista: 'Roberto Souza', encaminhamento: 'Leitura de O Evangelho Segundo o Espiritismo', status: 'Concluído', obs: 'Demonstrou-se mais calmo e grato após a recepção.' }
      ];
      localStorage.setItem('passe_atendimentos', JSON.stringify(defaultPasseAtend));
      setPasseAtendimentos(defaultPasseAtend);
    }

    const cachedPassePassistas = localStorage.getItem('passe_passistas');
    if (cachedPassePassistas) {
      try { setPassePassistas(JSON.parse(cachedPassePassistas)); } catch {}
    } else {
      const defaultPassePassistas = [
        { id: 'pps1', name: 'Claudio Ferreira', dateIngresso: '2022-03-10', doutrinaria: 'Concluída', cursos: 'Prática de Passes, Magnetismo Curativo', dias: 'Sábados', escalaId: 'es1', situacao: 'Ativo', tempo: '4 anos' },
        { id: 'pps2', name: 'Denise Martins', dateIngresso: '2024-01-15', doutrinaria: 'Concluída', cursos: 'Introdução ao Espiritismo, Passes e Fluidos', dias: 'Quartas, Sábados', escalaId: 'es1', situacao: 'Ativo', tempo: '2 anos' },
        { id: 'pps3', name: 'Roberto Souza', dateIngresso: '2021-06-20', doutrinaria: 'Concluída', cursos: 'Básico da Doutrina, Passes Avançados', dias: 'Segundas, Sábados', escalaId: 'es2', situacao: 'Ativo', tempo: '5 anos' }
      ];
      localStorage.setItem('passe_passistas', JSON.stringify(defaultPassePassistas));
      setPassePassistas(defaultPassePassistas);
    }

    const cachedPasseFluidoterapia = localStorage.getItem('passe_fluidoterapia');
    if (cachedPasseFluidoterapia) {
      try { setPasseFluidoterapia(JSON.parse(cachedPasseFluidoterapia)); } catch {}
    } else {
      const defaultPasseFluido = [
        { id: 'pf1', fluidoType: 'Água Geral', resp: 'Denise Martins', qty: 20, dest: 'Salão Principal', date: '2026-05-29', obs: 'Garrafões devidamente higienizados e fluidificados na câmara magnética.' },
        { id: 'pf2', fluidoType: 'Água Individualizada', resp: 'Roberto Souza', qty: 12, dest: 'Atendimento Fraterno', date: '2026-05-29', obs: 'Garrafas identificadas com o nome dos assistidos em tratamento.' }
      ];
      localStorage.setItem('passe_fluidoterapia', JSON.stringify(defaultPasseFluido));
      setPasseFluidoterapia(defaultPasseFluido);
    }

    const cachedPasseSalas = localStorage.getItem('passe_salas');
    if (cachedPasseSalas) {
      try { setPasseSalas(JSON.parse(cachedPasseSalas)); } catch {}
    } else {
      const defaultPasseSalas = [
        { id: 'sl1', name: 'Sala 1 - Bezerra de Menezes', type: 'Sala de Passe Coletivo', cap: 10, resp: 'Claudio Ferreira', disp: 'Disponível' },
        { id: 'sl2', name: 'Sala 2 - Meimei', type: 'Sala de Fluidoterapia / Passe Individual', cap: 4, resp: 'Denise Martins', disp: 'Disponível' }
      ];
      localStorage.setItem('passe_salas', JSON.stringify(defaultPasseSalas));
      setPasseSalas(defaultPasseSalas);
    }

    const cachedPasseCampanhas = localStorage.getItem('passe_campanhas');
    if (cachedPasseCampanhas) {
      try { setPasseCampanhas(JSON.parse(cachedPasseCampanhas)); } catch {}
    } else {
      const defaultPasseCampanhas = [
        { id: 'pc1', name: 'Vibração pelos Enfermos da Comunidade', motivo: 'Cura Espiritual e Amparo Fluídico', resp: 'Roberto Souza', date: '2026-05-28', status: 'Ativo' },
        { id: 'pc2', name: 'Irradiação Especial Fraterna', motivo: 'Harmonização Coletiva e Proteção Espiritual', resp: 'Denise Martins', date: '2026-05-29', status: 'Ativo' }
      ];
      localStorage.setItem('passe_campanhas', JSON.stringify(defaultPasseCampanhas));
      setPasseCampanhas(defaultPasseCampanhas);
    }

    const cachedPasseMateriais = localStorage.getItem('passe_materiais');
    if (cachedPasseMateriais) {
      try { setPasseMateriais(JSON.parse(cachedPasseMateriais)); } catch {}
    } else {
      const defaultPasseMateriais = [
        { id: 'pm1', product: 'Copos Plásticos Degradáveis (200ml)', qty: 600, min: 200, resp: 'Claudio Ferreira' },
        { id: 'pm2', product: 'Água Mineral Galão (20L)', qty: 8, min: 3, resp: 'Denise Martins' },
        { id: 'pm3', product: 'Garrafinhas transparentes (500ml)', qty: 120, min: 50, resp: 'Roberto Souza' }
      ];
      localStorage.setItem('passe_materiais', JSON.stringify(defaultPasseMateriais));
      setPasseMateriais(defaultPasseMateriais);
    }

    const cachedPasseEscalas = localStorage.getItem('passe_escalas');
    if (cachedPasseEscalas) {
      try { setPasseEscalas(JSON.parse(cachedPasseEscalas)); } catch {}
    } else {
      const defaultPasseEscalas = [
        { id: 'pe1', date: '2026-05-30', time: '19:30', equipe: 'Equipe Sábado Fraterno', passistas: 'Claudio Ferreira, Denise Martins', coord: 'Roberto Souza' },
        { id: 'pe2', date: '2026-06-03', time: '18:00', equipe: 'Equipe Meimei Quarta', passistas: 'Denise Martins, Roberto Souza', coord: 'Claudio Ferreira' }
      ];
      localStorage.setItem('passe_escalas', JSON.stringify(defaultPasseEscalas));
      setPasseEscalas(defaultPasseEscalas);
    }
  };

  // --- NEW WORKSPACE/STUDIES ACTION HANDLERS ---
  const handleAddCourseAndClass = (courseName: string, category: string, schedule: string) => {
    if (editingCourseId) {
      const isCourse = studyCourses.some(c => c.id === editingCourseId);
      if (isCourse) {
        const updatedCourses = studyCourses.map(c => {
          if (c.id === editingCourseId) {
            return { ...c, name: courseName, category, hours: Number(newCourseHours) || 40 };
          }
          return c;
        });
        setStudyCourses(updatedCourses);
        localStorage.setItem('study_courses', JSON.stringify(updatedCourses));

        const updatedClasses = studyClasses.map(cls => {
          if (cls.courseId === editingCourseId) {
            return { ...cls, name: courseName + ' - ' + cls.schedule };
          }
          return cls;
        });
        setStudyClasses(updatedClasses);
        localStorage.setItem('study_classes', JSON.stringify(updatedClasses));
      } else {
        const updatedClasses = studyClasses.map(cls => {
          if (cls.id === editingCourseId) {
            return { ...cls, name: courseName + ' - ' + cls.schedule };
          }
          return cls;
        });
        setStudyClasses(updatedClasses);
        localStorage.setItem('study_classes', JSON.stringify(updatedClasses));
      }

      setEditingCourseId(null);
      setNewCourseName('');
      setNewCourseCategory('ESDE');
      setNewCourseHours('40');
      return;
    }

    const courseId = 'course_' + Date.now();
    const newCourse = { id: courseId, name: courseName, category, hours: Number(newCourseHours) || 40, coord: currentUser?.name || 'Coordenador', status: 'Ativo' };
    const updatedCourses = [...studyCourses, newCourse];
    setStudyCourses(updatedCourses);
    localStorage.setItem('study_courses', JSON.stringify(updatedCourses));

    const classId = 'class_' + Date.now();
    const newClass = { id: classId, courseId, name: courseName + ' - ' + schedule, facilitator: currentUser?.name || 'Facilitador', schedule, room: 'Sala de Estudos', maxQty: 25, activeQty: 0 };
    const updatedClasses = [...studyClasses, newClass];
    setStudyClasses(updatedClasses);
    localStorage.setItem('study_classes', JSON.stringify(updatedClasses));
  };

  const handleAddStudyStudent = (name: string, phone: string, classId: string) => {
    if (editingStudentId) {
      const updated = studyStudents.map(st => {
        if (st.id === editingStudentId) {
          return { ...st, name, phone, classId };
        }
        return st;
      });
      setStudyStudents(updated);
      localStorage.setItem('study_students', JSON.stringify(updated));
      setEditingStudentId(null);
      setNewStudentName('');
      setNewStudentPhone('');
      setNewStudentClassId('');
      return;
    }

    const newStudent = { id: 'st_' + Date.now(), name, phone, classId, email: name.toLowerCase().replace(/\s/g, '') + '@email.com', presence: [true, true, true], warnings: 0, status: 'Ativo' };
    const updated = [...studyStudents, newStudent];
    setStudyStudents(updated);
    localStorage.setItem('study_students', JSON.stringify(updated));
  };

  const handleDeleteCourse = (courseId: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o curso "${name}"? Todas as turmas correspondentes também serão excluídas.`)) return;
    const updatedCourses = studyCourses.filter(c => c.id !== courseId);
    setStudyCourses(updatedCourses);
    localStorage.setItem('study_courses', JSON.stringify(updatedCourses));

    const updatedClasses = studyClasses.filter(cl => cl.courseId !== courseId);
    setStudyClasses(updatedClasses);
    localStorage.setItem('study_classes', JSON.stringify(updatedClasses));

    if (editingCourseId === courseId) {
      setEditingCourseId(null);
      setNewCourseName('');
    }
  };

  const handleDeleteStudyStudent = (studentId: string, name: string) => {
    if (!window.confirm(`Deseja realmente cancelar a matrícula do aluno "${name}"?`)) return;
    const updated = studyStudents.filter(st => st.id !== studentId);
    setStudyStudents(updated);
    localStorage.setItem('study_students', JSON.stringify(updated));

    if (editingStudentId === studentId) {
      setEditingStudentId(null);
      setNewStudentName('');
      setNewStudentClassId('');
    }
  };

  const handleToggleStudyPresence = (id: string, index: number) => {
    const updated = studyStudents.map(st => {
      if (st.id === id) {
        const nextPres = [...st.presence];
        nextPres[index] = !nextPres[index];
        return { ...st, presence: nextPres };
      }
      return st;
    });
    setStudyStudents(updated);
    localStorage.setItem('study_students', JSON.stringify(updated));
  };

  const handleAddCategory = (id: string, name: string) => {
    if (!id.trim() || !name.trim()) return;
    const cleanId = id.toUpperCase().replace(/\s+/g, '_');
    if (studyCategories.some(cat => cat.id === cleanId)) {
      alert("Já existe um ciclo com esta sigla/ID!");
      return;
    }
    const updated = [...studyCategories, { id: cleanId, name }];
    setStudyCategories(updated);
    localStorage.setItem('study_categories', JSON.stringify(updated));
    setNewCategoryID('');
    setNewCategoryName('');
  };

  const handleUpdateCategory = (id: string, newName: string) => {
    const updated = studyCategories.map(cat => {
      if (cat.id === id) {
        return { ...cat, name: newName };
      }
      return cat;
    });
    setStudyCategories(updated);
    localStorage.setItem('study_categories', JSON.stringify(updated));
  };

  const handleDeleteCategory = (id: string) => {
    if (studyCategories.length <= 1) {
      alert("É necessário manter pelo menos um ciclo curricular.");
      return;
    }
    if (!window.confirm("Deseja realmente remover este ciclo? Os cursos vinculados a ele continuarão existindo, mas sem a categoria correspondente.")) return;
    const updated = studyCategories.filter(cat => cat.id !== id);
    setStudyCategories(updated);
    localStorage.setItem('study_categories', JSON.stringify(updated));
  };

  const handleRegisterEvaKid = (
    name: string, 
    age: number, 
    roomId: string, 
    responsible: string, 
    phone: string, 
    phoneType: 'whatsapp' | 'telefone',
    phone2: string, 
    phoneType2: 'whatsapp' | 'telefone',
    relationship: string,
    studentPhone: string,
    studentPhoneType: 'whatsapp' | 'telefone',
    allergies: string
  ) => {
    if (editingKidId) {
      const updatedKids = evangelizacaoKids.map(k => {
        if (k.id === editingKidId) {
          return { 
            ...k, 
            name, 
            age, 
            roomId, 
            responsible, 
            phone, 
            phoneType,
            phone2,
            phoneType2,
            relationship,
            studentPhone,
            studentPhoneType,
            allergies: allergies || 'Nenhuma' 
          };
        }
        return k;
      });
      setEvangelizacaoKids(updatedKids);
      localStorage.setItem('eva_kids', JSON.stringify(updatedKids));

      setEditingKidId(null);
      setNewKidName('');
      setNewKidResponsible('');
      setNewKidRoomId('');
      setNewKidAllergies('');
      setNewKidAge(6);
      setNewKidPhone('');
      setNewKidPhoneType('whatsapp');
      setNewKidPhone2('');
      setNewKidPhoneType2('whatsapp');
      setNewKidRelationship('Pai');
      setNewKidStudentPhone('');
      setNewKidStudentPhoneType('whatsapp');
      return;
    }

    const newKid = { 
      id: 'kid_' + Date.now(), 
      name, 
      age, 
      roomId, 
      responsible, 
      phone, 
      phoneType,
      phone2,
      phoneType2,
      relationship,
      studentPhone,
      studentPhoneType,
      allergies: allergies || 'Nenhuma', 
      authorized: true, 
      presenceToday: true 
    };
    const updated = [...evangelizacaoKids, newKid];
    setEvangelizacaoKids(updated);
    localStorage.setItem('eva_kids', JSON.stringify(updated));

    setNewKidName('');
    setNewKidResponsible('');
    setNewKidRoomId('');
    setNewKidAllergies('');
    setNewKidAge(6);
    setNewKidPhone('');
    setNewKidPhoneType('whatsapp');
    setNewKidPhone2('');
    setNewKidPhoneType2('whatsapp');
    setNewKidRelationship('Pai');
    setNewKidStudentPhone('');
    setNewKidStudentPhoneType('whatsapp');
  };

  const handleDeleteEvaKid = (kidId: string, name: string) => {
    if (!window.confirm(`Deseja realmente cancelar a matrícula do evangelizando "${name}"?`)) return;
    const updatedKids = evangelizacaoKids.filter(k => k.id !== kidId);
    setEvangelizacaoKids(updatedKids);
    localStorage.setItem('eva_kids', JSON.stringify(updatedKids));

    if (editingKidId === kidId) {
      setEditingKidId(null);
      setNewKidName('');
      setNewKidResponsible('');
      setNewKidRoomId('');
      setNewKidAllergies('');
      setNewKidAge(6);
      setNewKidPhone('');
      setNewKidPhoneType('whatsapp');
      setNewKidPhone2('');
      setNewKidPhoneType2('whatsapp');
      setNewKidRelationship('Pai');
      setNewKidStudentPhone('');
      setNewKidStudentPhoneType('whatsapp');
    }
  };

  const handleAddEvaRoom = (name: string, schedule: string, room: string, leaders: string) => {
    if (editingRoomId) {
      const updatedRooms = evangelizacaoRooms.map(r => {
        if (r.id === editingRoomId) {
          return { ...r, name, schedule, room, leaders };
        }
        return r;
      });
      setEvangelizacaoRooms(updatedRooms);
      localStorage.setItem('eva_rooms', JSON.stringify(updatedRooms));

      setEditingRoomId(null);
      setNewRoomName('');
      setNewRoomLeaders('');
      setNewRoomLocation('Sala Infantil A');
      setNewRoomSchedule('Sábados, 15:00');
      return;
    }

    const newRoom = { id: 'er_' + Date.now(), name, schedule, room, leaders, count: 0 };
    const updatedRooms = [...evangelizacaoRooms, newRoom];
    setEvangelizacaoRooms(updatedRooms);
    localStorage.setItem('eva_rooms', JSON.stringify(updatedRooms));
  };

  const handleDeleteEvaRoom = (roomId: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir o ciclo/sala "${name}"?`)) return;
    const updatedRooms = evangelizacaoRooms.filter(r => r.id !== roomId);
    setEvangelizacaoRooms(updatedRooms);
    localStorage.setItem('eva_rooms', JSON.stringify(updatedRooms));

    if (editingRoomId === roomId) {
      setEditingRoomId(null);
      setNewRoomName('');
      setNewRoomLeaders('');
      setNewRoomLocation('Sala Infantil A');
      setNewRoomSchedule('Sábados, 15:00');
    }
  };

  // Document/Material uploader and handlers for Estudos
  const handleStudyMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
      : (file.size / 1024).toFixed(0) + ' KB';

    let fileType = 'OUTRO';
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      fileType = 'PDF';
    } else if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx') || file.type.includes('word') || file.type.includes('officedocument')) {
      fileType = 'DOC';
    } else if (file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('excel') || file.type.includes('spreadsheet')) {
      fileType = 'PLANILHA';
    } else if (file.type.startsWith('image/')) {
      fileType = 'IMAGEM';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'ÁUDIO';
    } else if (file.type.startsWith('video/')) {
      fileType = 'VÍDEO';
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const newMat = {
        id: 'mat_' + Date.now(),
        name: file.name,
        type: fileType,
        author: currentUser?.name || 'Apostilas Mirante',
        size: sizeFormatted,
        courseId: studyCourses[0]?.id || 'c1',
        url: fileUrl
      };
      
      const updated = [newMat, ...studyMaterials];
      setStudyMaterials(updated);
      localStorage.setItem('study_materials', JSON.stringify(updated));
      alert('Arquivo de material pedagógico carregado com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteStudyMaterial = (materialId: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o arquivo/material de estudo "${name}"?`)) return;
    const updated = studyMaterials.filter(m => m.id !== materialId);
    setStudyMaterials(updated);
    localStorage.setItem('study_materials', JSON.stringify(updated));
  };

  const handleToggleEvaPresence = (id: string) => {
    const updated = evangelizacaoKids.map(k => {
      if (k.id === id) {
        return { ...k, presenceToday: !k.presenceToday };
      }
      return k;
    });
    setEvangelizacaoKids(updated);
    localStorage.setItem('eva_kids', JSON.stringify(updated));
  };

  const handleAddMediGroup = (title: string, leader: string, schedule: string) => {
    const newGroup = { id: 'mg_' + Date.now(), name: title, schedule, leader, room: 'Sala Privativa', count: 1, security: 'RESTRICTED_DIRIGENTE' };
    const updated = [...mediunicaGroups, newGroup];
    setMediunicaGroups(updated);
    localStorage.setItem('medi_groups', JSON.stringify(updated));
  };

  const handleToggleMediPresence = (id: string, index: number) => {
    const updated = mediunicaMembers.map(m => {
      if (m.id === id) {
        const nextPres = [...m.presence];
        nextPres[index] = !nextPres[index];
        return { ...m, presence: nextPres };
      }
      return m;
    });
    setMediunicaMembers(updated);
    localStorage.setItem('medi_members', JSON.stringify(updated));
  };

  // --- ARTE ESPÍRITA ACTION HANDLERS ---
  const handleAddArteGroup = (name: string, modality: string, coordinator: string, schedule: string) => {
    if (editingArteGroupId) {
      const updated = arteGroups.map(g => {
        if (g.id === editingArteGroupId) {
          return {
            ...g,
            name,
            modality: modality.toUpperCase(),
            coordinator: coordinator || currentUser?.name || 'Coord. de Arte',
            schedule: schedule || 'Sábados'
          };
        }
        return g;
      });
      setArteGroups(updated);
      localStorage.setItem('arte_groups', JSON.stringify(updated));
      setEditingArteGroupId(null);
    } else {
      const newGroup = {
        id: 'ag_' + Date.now(),
        name,
        modality: modality.toUpperCase(),
        coordinator: coordinator || currentUser?.name || 'Coord. de Arte',
        qty: 1,
        schedule: schedule || 'Sábados',
        status: 'Ativo'
      };
      const updated = [...arteGroups, newGroup];
      setArteGroups(updated);
      localStorage.setItem('arte_groups', JSON.stringify(updated));
    }
  };

  const handleDeleteArteGroup = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o grupo artístico "${name}"? Esta ação é permanente.`)) {
      const updated = arteGroups.filter(g => g.id !== id);
      setArteGroups(updated);
      localStorage.setItem('arte_groups', JSON.stringify(updated));
      if (editingArteGroupId === id) {
        setEditingArteGroupId(null);
      }
    }
  };

  const handleAddArteSong = (name: string, author: string, theme: string, category: string, key: string, duration: string) => {
    if (editingArteSongId) {
      const updated = arteMusicas.map(s => {
        if (s.id === editingArteSongId) {
          return {
            ...s,
            name,
            author: author || 'Desconhecido',
            theme: theme || 'Tema Doutrinário',
            category: category || 'Solo / Coral',
            key: key || 'C Major',
            duration: duration || '3:00'
          };
        }
        return s;
      });
      setArteMusicas(updated);
      localStorage.setItem('arte_musicas', JSON.stringify(updated));
      setEditingArteSongId(null);
    } else {
      const newSong = {
        id: 'am_' + Date.now(),
        name,
        author: author || 'Desconhecido',
        theme: theme || 'Tema Doutrinário',
        category: category || 'Solo / Coral',
        key: key || 'C Major',
        duration: duration || '3:00'
      };
      const updated = [...arteMusicas, newSong];
      setArteMusicas(updated);
      localStorage.setItem('arte_musicas', JSON.stringify(updated));
    }
  };

  const handleDeleteArteSong = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a música "${name}"? Esta ação é permanente.`)) {
      const updated = arteMusicas.filter(s => s.id !== id);
      setArteMusicas(updated);
      localStorage.setItem('arte_musicas', JSON.stringify(updated));
      if (editingArteSongId === id) {
        setEditingArteSongId(null);
      }
    }
  };

  const handleAddArtePiece = (name: string, theme: string, author: string, duration: string, message: string) => {
    if (editingArtePieceId) {
      const updated = artePecas.map(p => {
        if (p.id === editingArtePieceId) {
          return {
            ...p,
            name,
            theme: theme || 'Tema Espírita',
            author: author || 'Autor Espírita',
            duration: duration || '30 min',
            message: message || 'Elevação moral'
          };
        }
        return p;
      });
      setArtePecas(updated);
      localStorage.setItem('arte_pecas', JSON.stringify(updated));
      setEditingArtePieceId(null);
    } else {
      const newPiece = {
        id: 'ap_' + Date.now(),
        name,
        theme: theme || 'Tema Espírita',
        author: author || 'Autor Espírita',
        duration: duration || '30 min',
        message: message || 'Elevação moral'
      };
      const updated = [...artePecas, newPiece];
      setArtePecas(updated);
      localStorage.setItem('arte_pecas', JSON.stringify(updated));
    }
  };

  const handleDeleteArtePiece = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a peça teatral/roteiro "${name}"? Esta ação é permanente.`)) {
      const updated = artePecas.filter(p => p.id !== id);
      setArtePecas(updated);
      localStorage.setItem('arte_pecas', JSON.stringify(updated));
      if (editingArtePieceId === id) {
        setEditingArtePieceId(null);
      }
    }
  };

  const handleAddArteEnsaio = (groupId: string, date: string, time: string, local: string, activity: string) => {
    const gr = arteGroups.find(g => g.id === groupId);
    if (editingArteEnsaioId) {
      const updated = arteEnsaios.map(e => {
        if (e.id === editingArteEnsaioId) {
          return {
            ...e,
            groupId,
            date: date || new Date().toISOString().split('T')[0],
            time: time || '15:00',
            local: local || 'Salão',
            activity: activity || 'Ensaio Geral',
            presentQty: gr ? gr.qty : 5,
            totalQty: gr ? gr.qty : 5
          };
        }
        return e;
      });
      setArteEnsaios(updated);
      localStorage.setItem('arte_ensaios', JSON.stringify(updated));
      setEditingArteEnsaioId(null);
    } else {
      const newEn = {
        id: 'ae_' + Date.now(),
        groupId,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '15:00',
        local: local || 'Salão',
        activity: activity || 'Ensaio Geral',
        presentQty: gr ? gr.qty : 5,
        totalQty: gr ? gr.qty : 5
      };
      const updated = [...arteEnsaios, newEn];
      setArteEnsaios(updated);
      localStorage.setItem('arte_ensaios', JSON.stringify(updated));
    }
  };

  const handleDeleteArteEnsaio = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o ensaio para "${name}"? Esta ação é permanente.`)) {
      const updated = arteEnsaios.filter(e => e.id !== id);
      setArteEnsaios(updated);
      localStorage.setItem('arte_ensaios', JSON.stringify(updated));
      if (editingArteEnsaioId === id) {
        setEditingArteEnsaioId(null);
      }
    }
  };

  const handleAddArteEvento = (name: string, theme: string, date: string, local: string, coordinator: string, estimate: string) => {
    if (editingArteEventoId) {
      const updated = arteEventos.map(ev => {
        if (ev.id === editingArteEventoId) {
          return {
            ...ev,
            name,
            theme,
            date: date || new Date().toISOString().split('T')[0],
            local: local || 'Salão da Casa',
            coordinator: coordinator || currentUser?.name || 'Coord. de Arte',
            estimate: estimate || '100 pessoas'
          };
        }
        return ev;
      });
      setArteEventos(updated);
      localStorage.setItem('arte_eventos', JSON.stringify(updated));
      setEditingArteEventoId(null);
    } else {
      const newEv = {
        id: 'aev_' + Date.now(),
        name,
        theme,
        date: date || new Date().toISOString().split('T')[0],
        local: local || 'Salão da Casa',
        coordinator: coordinator || currentUser?.name || 'Coord. de Arte',
        estimate: estimate || '100 pessoas'
      };
      const updated = [...arteEventos, newEv];
      setArteEventos(updated);
      localStorage.setItem('arte_eventos', JSON.stringify(updated));
    }
  };

  const handleDeleteArteEvento = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a apresentação/evento "${name}"? Esta ação é permanente.`)) {
      const updated = arteEventos.filter(ev => ev.id !== id);
      setArteEventos(updated);
      localStorage.setItem('arte_eventos', JSON.stringify(updated));
      if (editingArteEventoId === id) {
        setEditingArteEventoId(null);
      }
    }
  };

  // --- COMUNICAÇÃO ESPÍRITA ACTION HANDLERS ---
  const handleAddComunicado = (title: string, category: string, content: string, author: string, target: string, status: string, spiritObjective?: string, approvedBy?: string) => {
    if (editingComunicadoId) {
      const updated = comunicados.map(c => {
        if (c.id === editingComunicadoId) {
          return {
            ...c,
            title,
            category,
            content,
            author: author || currentUser?.name || 'Comunicação',
            target: target || 'Público Geral',
            status,
            spiritObjective: spiritObjective || '',
            approvedBy: approvedBy || '',
            date: new Date().toISOString().split('T')[0]
          };
        }
        return c;
      });
      setComunicados(updated);
      localStorage.setItem('com_comunicados', JSON.stringify(updated));
      setEditingComunicadoId(null);
    } else {
      const newCom = {
        id: 'com_' + Date.now(),
        title,
        category,
        content,
        author: author || currentUser?.name || 'Comunicação',
        target: target || 'Público Geral',
        status,
        spiritObjective: spiritObjective || '',
        approvedBy: approvedBy || '',
        date: new Date().toISOString().split('T')[0]
      };
      const updated = [...comunicados, newCom];
      setComunicados(updated);
      localStorage.setItem('com_comunicados', JSON.stringify(updated));
    }
  };

  const handleDeleteComunicado = (id: string, title: string) => {
    if (window.confirm(`Deseja realmente remover o comunicado "${title}"? Esta ação é permanente.`)) {
      const updated = comunicados.filter(c => c.id !== id);
      setComunicados(updated);
      localStorage.setItem('com_comunicados', JSON.stringify(updated));
      if (editingComunicadoId === id) {
        setEditingComunicadoId(null);
      }
    }
  };

  const handleAddSocialPost = (title: string, text: string, platform: string, date: string, hashtags: string, status: string, responsible: string, spiritObjective?: string, approvedBy?: string) => {
    if (editingSocialPostId) {
      const updated = socialPosts.map(p => {
        if (p.id === editingSocialPostId) {
          return {
            ...p,
            title,
            text,
            platform,
            date: date || new Date().toISOString().split('T')[0],
            hashtags,
            status,
            responsible: responsible || currentUser?.name || 'Social Media',
            spiritObjective: spiritObjective || '',
            approvedBy: approvedBy || ''
          };
        }
        return p;
      });
      setSocialPosts(updated);
      localStorage.setItem('com_social_posts', JSON.stringify(updated));
      setEditingSocialPostId(null);
    } else {
      const newPost = {
        id: 'sp_' + Date.now(),
        title,
        text,
        platform,
        date: date || new Date().toISOString().split('T')[0],
        hashtags,
        status,
        responsible: responsible || currentUser?.name || 'Social Media',
        spiritObjective: spiritObjective || '',
        approvedBy: approvedBy || ''
      };
      const updated = [...socialPosts, newPost];
      setSocialPosts(updated);
      localStorage.setItem('com_social_posts', JSON.stringify(updated));
    }
  };

  const handleDeleteSocialPost = (id: string, title: string) => {
    if (window.confirm(`Deseja realmente remover a postagem "${title}"? Esta ação é permanente.`)) {
      const updated = socialPosts.filter(p => p.id !== id);
      setSocialPosts(updated);
      localStorage.setItem('com_social_posts', JSON.stringify(updated));
      if (editingSocialPostId === id) {
        setEditingSocialPostId(null);
      }
    }
  };

  const handleAddCampanha = (name: string, objective: string, target: string, date: string, responsible: string, status: string, media: string, result: string) => {
    if (editingCampanhaId) {
      const updated = campanhas.map(c => {
        if (c.id === editingCampanhaId) {
          return {
            ...c,
            name,
            objective,
            target,
            date: date || new Date().toISOString().split('T')[0],
            responsible: responsible || currentUser?.name || 'Comunicação',
            status,
            media,
            result
          };
        }
        return c;
      });
      setCampanhas(updated);
      localStorage.setItem('com_campanhas', JSON.stringify(updated));
      setEditingCampanhaId(null);
    } else {
      const newCam = {
        id: 'cam_' + Date.now(),
        name,
        objective,
        target,
        date: date || new Date().toISOString().split('T')[0],
        responsible: responsible || currentUser?.name || 'Comunicação',
        status,
        media,
        result
      };
      const updated = [...campanhas, newCam];
      setCampanhas(updated);
      localStorage.setItem('com_campanhas', JSON.stringify(updated));
    }
  };

  const handleDeleteCampanha = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a campanha/cobertura "${name}"? Esta ação é permanente.`)) {
      const updated = campanhas.filter(c => c.id !== id);
      setCampanhas(updated);
      localStorage.setItem('com_campanhas', JSON.stringify(updated));
      if (editingCampanhaId === id) {
        setEditingCampanhaId(null);
      }
    }
  };

  const handleAddMidia = (name: string, category: string, designer: string, url: string, status: string, spiritObjective: string) => {
    if (editingMidiaId) {
      const updated = midias.map(m => {
        if (m.id === editingMidiaId) {
          return {
            ...m,
            name,
            category,
            designer: designer || 'Equipe de Criação',
            url: url || '',
            status,
            spiritObjective: spiritObjective || 'Esclarecimento e consolo espiritual.'
          };
        }
        return m;
      });
      setMidias(updated);
      localStorage.setItem('com_midias', JSON.stringify(updated));
      setEditingMidiaId(null);
    } else {
      const newMidia = {
        id: 'md_' + Date.now(),
        name,
        category,
        designer: designer || 'Equipe de Criação',
        url: url || '',
        status,
        spiritObjective: spiritObjective || 'Esclarecimento e consolo espiritual.'
      };
      const updated = [...midias, newMidia];
      setMidias(updated);
      localStorage.setItem('com_midias', JSON.stringify(updated));
    }
  };

  const handleDeleteMidia = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o material "${name}"? Esta ação é permanente.`)) {
      const updated = midias.filter(m => m.id !== id);
      setMidias(updated);
      localStorage.setItem('com_midias', JSON.stringify(updated));
      if (editingMidiaId === id) {
        setEditingMidiaId(null);
      }
    }
  };

  const handleAddEquipeMembro = (name: string, role: string, availability: string, equipments: string) => {
    if (editingEquipeId) {
      const updated = equipeMembros.map(m => {
        if (m.id === editingEquipeId) {
          return {
            ...m,
            name,
            role,
            availability: availability || 'Sob Demanda',
            equipments: equipments || 'Smartphone / Computador'
          };
        }
        return m;
      });
      setEquipeMembros(updated);
      localStorage.setItem('com_equipe', JSON.stringify(updated));
      setEditingEquipeId(null);
    } else {
      const newMembro = {
        id: 'eq_' + Date.now(),
        name,
        role,
        availability: availability || 'Sob Demanda',
        equipments: equipments || 'Smartphone / Computador'
      };
      const updated = [...equipeMembros, newMembro];
      setEquipeMembros(updated);
      localStorage.setItem('com_equipe', JSON.stringify(updated));
    }
  };

  const handleDeleteEquipeMembro = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o membro da equipe "${name}"? Esta ação é permanente.`)) {
      const updated = equipeMembros.filter(m => m.id !== id);
      setEquipeMembros(updated);
      localStorage.setItem('com_equipe', JSON.stringify(updated));
      if (editingEquipeId === id) {
        setEditingEquipeId(null);
      }
    }
  };

  const handleGenerateCreativeAi = async () => {
    setIsGeneratingAi(true);
    setAiResultText('');
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        setAiResultText('Aviso: Chave API do Gemini não está configurada no ambiente. Adicione-a na aba correspondente do painel.');
        setIsGeneratingAi(false);
        return;
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      let formatPrompt = "";
      if (aiType === 'post') {
        formatPrompt = "um post para redes sociais (Instagram/Facebook) com título inspiratório, legenda acolhedora e 4 hashtags doutrinárias.";
      } else if (aiType === 'comunicado') {
        formatPrompt = "um comunicado ou aviso fraterno estruturado para ser divulgado ou afixado nos painéis informativos da Casa Espírita.";
      } else {
        formatPrompt = "uma mensagem curta de luz, consolação e reflexão profunda (estilo Emmanuel ou André Luiz) para difusão fraterna.";
      }

      const prompt = `Você é um assistente sintonizado com a caridade e a Doutrina Espírita codificada por Allan Kardec.
Gere ${formatPrompt}.

Diretrizes de geração:
- Tema: ${aiTheme}
- Destinatário: ${aiTarget}
- Estilo: Linguagem serena, acolhedora, consoladora e fraterna. Livre de sensacionalismo ou termos de marketing corporativo corporativo de vendas.
- Foque em Jesus, Allan Kardec, caridade e prece de forma pura e edificante.

Retorne exclusivamente o texto final estruturado, pronto para uso.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        setAiResultText(response.text);
      } else {
        setAiResultText('O modelo retornou uma resposta sem texto. Clique em gerar novamente.');
      }
    } catch (err: any) {
      console.error(err);
      setAiResultText(`Houve um imprevisto na conexão com o Estúdio Inteligente: ${err?.message || err}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // --- PASSE E FLUIDOTERAPIA ACTION HANDLERS ---
  const handleAddPasseAtendimento = (name: string, type: string, sala: string, passista: string, encaminhamento: string, status: string, obs: string) => {
    let updated;
    if (editingPasseAtendimentoId) {
      updated = passeAtendimentos.map(item => {
        if (item.id === editingPasseAtendimentoId) {
          return { ...item, name, type, sala, passista, encaminhamento, status, obs };
        }
        return item;
      });
      setEditingPasseAtendimentoId(null);
    } else {
      const newItem = {
        id: `pa_${Date.now()}`,
        name,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString().slice(0, 5),
        type,
        sala,
        passista,
        encaminhamento,
        status,
        obs
      };
      updated = [newItem, ...passeAtendimentos];
    }
    setPasseAtendimentos(updated);
    localStorage.setItem('passe_atendimentos', JSON.stringify(updated));

    // Reset forms
    setNewPasseAtendName('');
    setNewPasseAtendPassista('');
    setNewPasseAtendObs('');
  };

  const handleDeletePasseAtendimento = (id: string, name: string) => {
    if (window.confirm(`Deseja remover o atendimento de "${name}"?`)) {
      const updated = passeAtendimentos.filter(item => item.id !== id);
      setPasseAtendimentos(updated);
      localStorage.setItem('passe_atendimentos', JSON.stringify(updated));
    }
  };

  const handleAddPassista = (name: string, dateIngresso: string, doutrinaria: string, cursos: string, dias: string, escalaId: string, situacao: string, tempo: string) => {
    let updated;
    if (editingPassePassistaId) {
      updated = passePassistas.map(item => {
        if (item.id === editingPassePassistaId) {
          return { ...item, name, dateIngresso, doutrinaria, cursos, dias, escalaId, situacao, tempo };
        }
        return item;
      });
      setEditingPassePassistaId(null);
    } else {
      const newItem = {
        id: `pps_${Date.now()}`,
        name,
        dateIngresso: dateIngresso || new Date().toISOString().slice(0, 10),
        doutrinaria,
        cursos,
        dias,
        escalaId,
        situacao,
        tempo: tempo || '1 ano'
      };
      updated = [...passePassistas, newItem];
    }
    setPassePassistas(updated);
    localStorage.setItem('passe_passistas', JSON.stringify(updated));

    // Reset forms
    setNewPassistaName('');
    setNewPassistaCursos('');
    setNewPassistaTempo('');
  };

  const handleDeletePassista = (id: string, name: string) => {
    if (window.confirm(`Deseja remover o passista "${name}" do cadastro?`)) {
      const updated = passePassistas.filter(item => item.id !== id);
      setPassePassistas(updated);
      localStorage.setItem('passe_passistas', JSON.stringify(updated));
    }
  };

  const handleAddFluidoterapia = (fluidoType: string, resp: string, qty: number, dest: string, obs: string) => {
    let updated;
    if (editingPasseFluidoterapiaId) {
      updated = passeFluidoterapia.map(item => {
        if (item.id === editingPasseFluidoterapiaId) {
          return { ...item, fluidoType, resp, qty, dest, obs };
        }
        return item;
      });
      setEditingPasseFluidoterapiaId(null);
    } else {
      const newItem = {
        id: `pf_${Date.now()}`,
        fluidoType,
        resp,
        qty: Number(qty) || 10,
        dest,
        date: new Date().toISOString().slice(0, 10),
        obs
      };
      updated = [newItem, ...passeFluidoterapia];
    }
    setPasseFluidoterapia(updated);
    localStorage.setItem('passe_fluidoterapia', JSON.stringify(updated));

    // Reset forms
    setNewFluidoResp('');
    setNewFluidoQty(10);
    setNewFluidoObs('');
  };

  const handleDeleteFluidoterapia = (id: string) => {
    if (window.confirm(`Deseja remover esse registro de fluidoterapia?`)) {
      const updated = passeFluidoterapia.filter(item => item.id !== id);
      setPasseFluidoterapia(updated);
      localStorage.setItem('passe_fluidoterapia', JSON.stringify(updated));
    }
  };

  const handleAddPasseSala = (name: string, type: string, cap: number, resp: string, disp: string) => {
    let updated;
    if (editingPasseSalaId) {
      updated = passeSalas.map(item => {
        if (item.id === editingPasseSalaId) {
          return { ...item, name, type, cap: Number(cap), resp, disp };
        }
        return item;
      });
      setEditingPasseSalaId(null);
    } else {
      const newItem = {
        id: `sl_${Date.now()}`,
        name,
        type,
        cap: Number(cap) || 5,
        resp,
        disp
      };
      updated = [...passeSalas, newItem];
    }
    setPasseSalas(updated);
    localStorage.setItem('passe_salas', JSON.stringify(updated));

    // Reset forms
    setNewSalaName('');
    setNewSalaResp('');
    setNewSalaCap(5);
  };

  const handleDeletePasseSala = (id: string, name: string) => {
    if (window.confirm(`Deseja remover a sala "${name}"?`)) {
      const updated = passeSalas.filter(item => item.id !== id);
      setPasseSalas(updated);
      localStorage.setItem('passe_salas', JSON.stringify(updated));
    }
  };

  const handleAddPasseCampanha = (name: string, motivo: string, resp: string, status: string) => {
    let updated;
    if (editingPasseCampanhaId) {
      updated = passeCampanhas.map(item => {
        if (item.id === editingPasseCampanhaId) {
          return { ...item, name, motivo, resp, status };
        }
        return item;
      });
      setEditingPasseCampanhaId(null);
    } else {
      const newItem = {
        id: `pc_${Date.now()}`,
        name,
        motivo,
        resp,
        date: new Date().toISOString().slice(0, 10),
        status
      };
      updated = [newItem, ...passeCampanhas];
    }
    setPasseCampanhas(updated);
    localStorage.setItem('passe_campanhas', JSON.stringify(updated));

    // Reset forms
    setNewCampName('');
    setNewCampMotivo('');
    setNewCampResp('');
  };

  const handleDeletePasseCampanha = (id: string, name: string) => {
    if (window.confirm(`Deseja remover a campanha de vibração "${name}"?`)) {
      const updated = passeCampanhas.filter(item => item.id !== id);
      setPasseCampanhas(updated);
      localStorage.setItem('passe_campanhas', JSON.stringify(updated));
    }
  };

  const handleAddPasseMaterial = (product: string, qty: number, min: number, resp: string) => {
    let updated;
    if (editingPasseMaterialId) {
      updated = passeMateriais.map(item => {
        if (item.id === editingPasseMaterialId) {
          return { ...item, product, qty: Number(qty), min: Number(min), resp };
        }
        return item;
      });
      setEditingPasseMaterialId(null);
    } else {
      const newItem = {
        id: `pm_${Date.now()}`,
        product,
        qty: Number(qty) || 0,
        min: Number(min) || 50,
        resp
      };
      updated = [...passeMateriais, newItem];
    }
    setPasseMateriais(updated);
    localStorage.setItem('passe_materiais', JSON.stringify(updated));

    // Reset forms
    setNewMaterialProduct('');
    setNewMaterialQty(0);
    setNewMaterialMin(50);
    setNewMaterialResp('');
  };

  const handleDeletePasseMaterial = (id: string, product: string) => {
    if (window.confirm(`Deseja remover o material "${product}"?`)) {
      const updated = passeMateriais.filter(item => item.id !== id);
      setPasseMateriais(updated);
      localStorage.setItem('passe_materiais', JSON.stringify(updated));
    }
  };

  const handleAddPasseEscala = (date: string, time: string, equipe: string, passistas: string, coord: string) => {
    let updated;
    if (editingPasseEscalaId) {
      updated = passeEscalas.map(item => {
        if (item.id === editingPasseEscalaId) {
          return { ...item, date, time, equipe, passistas, coord };
        }
        return item;
      });
      setEditingPasseEscalaId(null);
    } else {
      const newItem = {
        id: `pe_${Date.now()}`,
        date: date || new Date().toISOString().slice(0, 10),
        time: time || '19:30',
        equipe,
        passistas,
        coord
      };
      updated = [...passeEscalas, newItem];
    }
    setPasseEscalas(updated);
    localStorage.setItem('passe_escalas', JSON.stringify(updated));

    // Reset forms
    setNewEscDate('');
    setNewEscTime('');
    setNewEscPassistas('');
    setNewEscCoord('');
  };

  const handleDeletePasseEscala = (id: string) => {
    if (window.confirm(`Deseja remover esta escala de serviço?`)) {
      const updated = passeEscalas.filter(item => item.id !== id);
      setPasseEscalas(updated);
      localStorage.setItem('passe_escalas', JSON.stringify(updated));
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

    // Supported extensions: pdf, images, word, excel, ppt, txt, csv
    const fileNameLower = file.name.toLowerCase();
    const isSupported = 
      fileNameLower.endsWith('.pdf') ||
      fileNameLower.endsWith('.doc') ||
      fileNameLower.endsWith('.docx') ||
      fileNameLower.endsWith('.xls') ||
      fileNameLower.endsWith('.xlsx') ||
      fileNameLower.endsWith('.csv') ||
      fileNameLower.endsWith('.ppt') ||
      fileNameLower.endsWith('.pptx') ||
      fileNameLower.endsWith('.png') ||
      fileNameLower.endsWith('.jpg') ||
      fileNameLower.endsWith('.jpeg') ||
      fileNameLower.endsWith('.gif') ||
      fileNameLower.endsWith('.webp') ||
      fileNameLower.endsWith('.svg') ||
      fileNameLower.endsWith('.txt') ||
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('excel') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('ms-excel') ||
      file.type.includes('officedocument');

    if (!isSupported) {
      alert('Tipo de arquivo não suportado. Por favor, envie PDF, Imagens (PNG, JPG, WebP), Word (doc/docx), Excel (xls/xlsx), ou arquivos de texto.');
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const isTooLargeForFirestore = file.size > 800 * 1024; // 800KB safeguard
          const fileUrl = isTooLargeForFirestore ? '#' : (reader.result as string);
          
          if (isTooLargeForFirestore) {
            alert('Aviso: Devido ao tamanho do arquivo (>800KB), ele foi registrado como simulação para não ultrapassar os limites de integridade do banco de dados.');
          }

          await dataService.addSectorDocument(sectorId, {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            url: fileUrl,
            uploadedBy: currentUser.name || currentUser.email
          });
          loadData();
        } catch (err) {
          console.error('Erro ao processar e salvar arquivo:', err);
          alert('Erro ao salvar documento no servidor do setor.');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        alert('Erro ao ler o arquivo local.');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
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
  // Sub-sector metrics are lifted and calculated above

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

            {/* Visual Material vs Patrimonio Selector */}
            <div className="flex border-b border-gray-150 justify-start gap-4 pb-1 overflow-x-auto whitespace-nowrap scrollbar-none w-full">
              <button
                type="button"
                id="tab-pat-todos"
                onClick={() => setPatrimonioTypeTab('TODOS')}
                className={cn(
                  "flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                  patrimonioTypeTab === 'TODOS'
                    ? "border-indigo-600 text-indigo-600 font-black"
                    : "border-transparent text-gray-400 hover:text-gray-650"
                )}
              >
                Todos os Itens
              </button>
              <button
                type="button"
                id="tab-pat-material"
                onClick={() => setPatrimonioTypeTab('MATERIAL')}
                className={cn(
                  "flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                  patrimonioTypeTab === 'MATERIAL'
                    ? "border-indigo-600 text-indigo-600 font-black"
                    : "border-transparent text-gray-400 hover:text-gray-650"
                )}
              >
                <BookOpen size={13} />
                Materiais de Consumo
              </button>
              <button
                type="button"
                id="tab-pat-patrimonio"
                onClick={() => setPatrimonioTypeTab('PATRIMONIO')}
                className={cn(
                  "flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                  patrimonioTypeTab === 'PATRIMONIO'
                    ? "border-indigo-600 text-indigo-600 font-black"
                    : "border-transparent text-gray-400 hover:text-gray-650"
                )}
              >
                <Package size={13} />
                Patrimônio Permanente
              </button>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {patrimonioItems
                .filter(item => {
                  const matchesCategory = patrimonioCategory === 'ALL' || item.category === patrimonioCategory;
                  if (patrimonioTypeTab === 'PATRIMONIO') {
                    return matchesCategory && (item.category === 'ELETRONICOS' || item.category === 'MOBILIARIO');
                  }
                  if (patrimonioTypeTab === 'MATERIAL') {
                    return matchesCategory && (item.category === 'LIMPEZA' || item.category === 'LIVRARIA');
                  }
                  return matchesCategory;
                })
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
                  <div key={vl.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm text-gray-950 leading-none">{vl.name}</h5>
                      <span className="inline-block text-[9px] text-[#78716c] font-black uppercase tracking-wider mt-1">{vl.purpose} • {vl.phone}</span>
                      <p className="text-[9px] text-gray-400 mt-1">
                        Chegada: {new Date(vl.checkInTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {vl.checkOutTime && ` • Saída: ${new Date(vl.checkOutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>

                    {!vl.checkOutTime ? (
                      <button
                        onClick={() => handleCheckOutVisitor(vl.id)}
                        className="p-2 sm:p-2.5 bg-gray-950 hover:bg-red-600 hover:scale-105 transition-all text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer w-full sm:w-auto text-center whitespace-nowrap"
                      >
                        Registrar Saída (Check-out)
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-gray-200 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest w-full sm:w-auto text-center">
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
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic flex items-center gap-1.5 select-none text-[11px]">
                <Plus size={14} className="text-indigo-600" />
                Lançar Nova Atividade ou Ambiente
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Ambiente ou Tarefa</label>
                  <input
                    value={newChecklistRoomName}
                    onChange={(e) => setNewChecklistRoomName(e.target.value)}
                    placeholder="Ex: Refeitório Administrativo, Recepção, Banheiros"
                    className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Status de Conservação</label>
                  <select
                    value={newChecklistStatus}
                    onChange={(e) => setNewChecklistStatus(e.target.value as any)}
                    className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="LIMPO">🟢 LIMPO / CONSERVADO</option>
                    <option value="ATENCAO">🟡 ATENÇÃO / MENOR</option>
                    <option value="PENDENTE">🔴 URGENTE / PENDENTE</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Responsável Executor</label>
                  <input
                    value={newChecklistResponsibleName}
                    onChange={(e) => setNewChecklistResponsibleName(e.target.value)}
                    placeholder="Ex: Maria José (Voluntária)"
                    className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block">Observações e Detalhes</label>
                  <input
                    value={newChecklistObservations}
                    onChange={(e) => setNewChecklistObservations(e.target.value)}
                    placeholder="Ex: Sem observações relevantes"
                    className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddChecklistActivity}
                  className="sm:col-span-6 w-full h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-[0.99]"
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

  const renderDoutrinarioDashboard = () => {
    return <DoutrinarioDashboard />;
  };

  const renderEstudosDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 font-sans">
        {/* Left Column: Register Course or Class */}
        <div className="lg:col-span-6 space-y-6">
          {/* Círculo Curricular de Estudos Espíritas */}
          <div className="bg-white rounded-[40px] border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6 text-left">
            <div className="border-b border-gray-50 pb-5">
              <h3 className="text-lg font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Compass className="text-indigo-600" size={20} />
                Círculo Curricular de Estudos Espíritas
              </h3>
              <p className="text-xs text-slate-400 font-medium font-sans mt-1">
                Visualização dinâmica e edição imediata dos nossos ciclos e ramos de estudos doutrinários. Clique nas fatias para editar seus títulos.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Left Column: Interactive Wheel SVG */}
              <div className="relative shrink-0 flex items-center justify-center bg-gray-50/50 p-4 rounded-[32px] border border-gray-100">
                {studyCategories.length === 0 ? (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-gray-400 italic">
                    Nenhuma categoria registrada.
                  </div>
                ) : (
                  <div className="relative">
                    <svg width="240" height="240" viewBox="0 0 300 300" className="drop-shadow-sm select-none">
                      {/* Inner Circular holes background */}
                      <circle cx="150" cy="150" r="130" fill="transparent" stroke="#f1f5f9" strokeWidth="2" />
                      <circle cx="150" cy="150" r="62" fill="#ffffff" stroke="#f1f5f9" strokeWidth="2" />

                      {/* Render mathematical slice segments */}
                      {studyCategories.map((cat, i) => {
                        const total = studyCategories.length;
                        const cx = 150;
                        const cy = 150;
                        const r_out = 115;
                        const r_in = 66;

                        // Calculate angles start & end
                        const startAngle = -Math.PI / 2 + (i / total) * 2 * Math.PI;
                        const endAngle = -Math.PI / 2 + ((i + 1) / total) * 2 * Math.PI;

                        // Inner/Outer Arc Coordinates
                        const x1_out = cx + r_out * Math.cos(startAngle);
                        const y1_out = cy + r_out * Math.sin(startAngle);
                        const x2_out = cx + r_out * Math.cos(endAngle);
                        const y2_out = cy + r_out * Math.sin(endAngle);

                        const x1_in = cx + r_in * Math.cos(startAngle);
                        const y1_in = cy + r_in * Math.sin(startAngle);
                        const x2_in = cx + r_in * Math.cos(endAngle);
                        const y2_in = cy + r_in * Math.sin(endAngle);

                        const midAngle = (startAngle + endAngle) / 2;
                        const r_text = (r_out + r_in) / 2;
                        const x_text = cx + r_text * Math.cos(midAngle);
                        const y_text = cy + r_text * Math.sin(midAngle);

                        // Flags (since sectors are always < 180 degrees if total > 2)
                        const largeArcFlag = total === 1 ? 1 : 0;

                        // Generate path representation
                        let pathD = "";
                        if (total === 1) {
                          // Single cycle, render full donut
                          pathD = `
                            M ${cx} ${cy - r_out}
                            A ${r_out} ${r_out} 0 1 1 ${cx} ${cy + r_out}
                            A ${r_out} ${r_out} 0 1 1 ${cx} ${cy - r_out}
                            Z
                          `;
                        } else {
                          pathD = `
                            M ${x1_in} ${y1_in}
                            L ${x1_out} ${y1_out}
                            A ${r_out} ${r_out} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out}
                            L ${x2_in} ${y2_in}
                            A ${r_in} ${r_in} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}
                            Z
                          `;
                        }

                        // Colors palette rotation
                        const palettes = [
                          { fill: '#3b82f6', fillHover: '#2563eb', stroke: '#1e3a8a', labelColor: '#1d4ed8' }, // Blue
                          { fill: '#a855f7', fillHover: '#9333ea', stroke: '#581c87', labelColor: '#6b21a8' }, // Purple
                          { fill: '#10b981', fillHover: '#059669', stroke: '#064e3b', labelColor: '#047857' }, // Emerald
                          { fill: '#f59e0b', fillHover: '#d97706', stroke: '#78350f', labelColor: '#b45309' }, // Amber
                          { fill: '#ec4899', fillHover: '#db2777', stroke: '#701a75', labelColor: '#be185d' }, // Pink
                          { fill: '#14b8a6', fillHover: '#0d9488', stroke: '#115e59', labelColor: '#0f766e' }  // Teal
                        ];
                        const palette = palettes[i % palettes.length];

                        const isSelected = selectedCategoryWheelId === cat.id || (selectedCategoryWheelId === null && i === 0);
                        const isHovered = hoveredCategoryWheelId === cat.id;

                        return (
                          <g 
                            key={cat.id} 
                            className="cursor-pointer transition-all"
                            onClick={() => setSelectedCategoryWheelId(cat.id)}
                            onMouseEnter={() => setHoveredCategoryWheelId(cat.id)}
                            onMouseLeave={() => setHoveredCategoryWheelId(null)}
                          >
                            <path
                              d={pathD}
                              fill={isSelected ? palette.fillHover : isHovered ? palette.fill : palette.fill}
                              fillOpacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.45}
                              stroke={isSelected ? '#1e293b' : '#ffffff'}
                              strokeWidth={isSelected ? 3 : 1.5}
                              className="transition-all duration-200"
                            />
                            {/* Category code centered inside segment slice */}
                            <text
                              x={x_text}
                              y={y_text + 4}
                              textAnchor="middle"
                              fill={isSelected ? '#ffffff' : palette.labelColor}
                              className="text-[9.5px] font-black tracking-wider uppercase font-mono select-none pointer-events-none"
                            >
                              {cat.id}
                            </text>
                          </g>
                        );
                      })}

                      {/* Central Hole Details */}
                      <g className="pointer-events-none select-none">
                        <text x="150" y="142" textAnchor="middle" className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                          Ciclo Ativo
                        </text>
                        {(() => {
                          const activeId = selectedCategoryWheelId || studyCategories[0]?.id;
                          const activeCat = studyCategories.find(c => c.id === activeId);
                          return (
                            <>
                              <text x="150" y="162" textAnchor="middle" className="text-lg font-black text-slate-800 tracking-tight">
                                {activeId || "ESDE"}
                              </text>
                              <text x="150" y="178" textAnchor="middle" className="text-[8.5px] font-bold text-[#10b981] bg-emerald-50 px-1 py-0.5 rounded-full select-none">
                                {studyCourses.filter(c => c.category === activeId).length} Cursos
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    </svg>
                  </div>
                )}
              </div>

              {/* Right Column: Fast rename editor for the specific highlighted cycle */}
              <div className="flex-1 w-full space-y-4">
                {(() => {
                  const activeId = selectedCategoryWheelId || studyCategories[0]?.id;
                  const activeCat = studyCategories.find(c => c.id === activeId);
                  if (!activeCat) {
                    return <div className="text-xs text-gray-400 italic">Selecione uma fatia para ver e editar.</div>;
                  }

                  return (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-3.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded-lg text-[9px] font-mono font-black text-indigo-700">
                          ID DO CICLO: {activeCat.id}
                        </span>
                        <span className="text-[9.5px] text-gray-400 font-bold uppercase select-none">
                          Fatia Selecionada
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase text-gray-500 block">
                          Nome do Ciclo / Estudo Curricular
                        </label>
                        <input
                          type="text"
                          value={activeCat.name}
                          onChange={(e) => handleUpdateCategory(activeCat.id, e.target.value)}
                          placeholder="Informe o nome oficial deste ciclo"
                          className="w-full h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none transition-all block"
                        />
                      </div>

                      <p className="text-[10px] text-gray-450 leading-relaxed italic mt-1 font-sans">
                        💡 <strong>Edição Em Tempo Real:</strong> Todas as fatias do círculo curricular atualizam automaticamente na base de dados assim que você altera o título acima.
                      </p>
                    </div>
                  );
                })()}

                {/* Horizontal Quick-Click Badges for ease on desktop/mobile */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">Navegadores de Ciclo</span>
                  <div className="flex flex-wrap gap-1.5 font-sans">
                    {studyCategories.map((cat, idx) => {
                      const isActive = selectedCategoryWheelId === cat.id || (selectedCategoryWheelId === null && idx === 0);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategoryWheelId(cat.id)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl border font-bold text-[10.5px] transition-all cursor-pointer whitespace-nowrap",
                            isActive 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" 
                              : "bg-white border-gray-150 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          {cat.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={22} />
                Gestão de Cursos e Estudos
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Planejamento Pedagógico e Grade Curricular</p>
            </div>

            {/* Course Launch Form */}
            <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic flex items-center gap-1.5 select-none text-[11px]">
                <Plus size={14} className="text-indigo-600" />
                {editingCourseId ? 'Editar Curso / Grupo de Estudos' : 'Criar Novo Curso ou Grupo de Estudos'}
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Nome do Curso</label>
                  <input
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Ex: ESDE II - Estudo do Pensamento Espírita"
                    className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase text-gray-500 block">Ciclo Curricular</label>
                      <button
                        type="button"
                        onClick={() => setIsManagingCategories(!isManagingCategories)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                        title="Modificar as opções deste ciclo/círculo curricular"
                      >
                        {isManagingCategories ? "Fechar" : "Gerenciar"}
                      </button>
                    </div>
                    <select
                      value={newCourseCategory || (studyCategories[0]?.id || 'ESDE')}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
                    >
                      {studyCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-gray-500 block">Carga Horária (Sessões)</label>
                    <input
                      value={newCourseHours}
                      onChange={(e) => setNewCourseHours(e.target.value)}
                      placeholder="Ex: 40"
                      className="w-full mt-1.5 h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Inline Category Manager */}
                {isManagingCategories && (
                  <div className="bg-white p-4 rounded-2xl border border-indigo-150 space-y-3 shadow-inner">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center justify-between">
                      <span>Gerenciar Ciclos / Círculo Curricular</span>
                    </h5>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {studyCategories.map(cat => (
                        <div key={cat.id} className="flex gap-2 items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="font-mono font-black text-[9px] text-[#22c55e] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                            {cat.id}
                          </span>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleUpdateCategory(cat.id, e.target.value)}
                            className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none px-1 py-0.5 text-[11px] font-bold text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-gray-400 hover:text-red-650 cursor-pointer rounded hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-dashed border-gray-200 space-y-2">
                       <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Adicionar Novo Ciclo</p>
                       <div className="grid grid-cols-12 gap-2">
                         <input
                           type="text"
                           placeholder="Sigla/ID (Ex: EAE)"
                           value={newCategoryID}
                           onChange={(e) => setNewCategoryID(e.target.value.toUpperCase())}
                           className="col-span-4 h-8 bg-slate-50 border border-gray-200 rounded-lg px-2 text-[10.5px] font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
                         />
                         <input
                           type="text"
                           placeholder="Nome do Ciclo"
                           value={newCategoryName}
                           onChange={(e) => setNewCategoryName(e.target.value)}
                           className="col-span-8 h-8 bg-slate-50 border border-gray-200 rounded-lg px-2 text-[10.5px] font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
                         />
                       </div>
                       <button
                         type="button"
                         onClick={() => {
                           if (!newCategoryID.trim() || !newCategoryName.trim()) {
                             alert("Por favor, preencha a sigla e o nome da categoria.");
                             return;
                           }
                           handleAddCategory(newCategoryID, newCategoryName);
                         }}
                         className="w-full h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-black text-[9px] uppercase tracking-widest transition-colors cursor-pointer border border-indigo-100"
                       >
                         Incluir Ciclo Curricular
                       </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!newCourseName.trim()) {
                      alert("Por favor, preencha o nome do curso.");
                      return;
                    }
                    handleAddCourseAndClass(newCourseName, newCourseCategory, "Sábado, 15h00");
                    setNewCourseName('');
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  {editingCourseId ? 'Salvar Alterações' : 'Registrar e Gerar Turma Padrão'}
                </button>
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourseId(null);
                      setNewCourseName('');
                      setNewCourseCategory('ESDE');
                      setNewCourseHours('40');
                    }}
                    className="w-full py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </div>

            {/* Active Class Groups */}
            <div className="space-y-3 pt-4 border-t border-gray-50 text-left font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Grade Ativa de Turmas</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {studyClasses.map((cls) => {
                  const course = studyCourses.find(c => c.id === cls.courseId);
                  return (
                    <div key={cls.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex justify-between items-center hover:bg-gray-100/40 transition-all font-sans">
                      <div className="flex-1 min-w-0 pr-2">
                        <h5 className="font-extrabold text-sm text-gray-950 leading-none truncate">{cls.name}</h5>
                        <div className="flex flex-wrap gap-2 items-center text-[9px] font-black uppercase tracking-wider text-gray-400 mt-2">
                          <span>Facilitador: {cls.facilitator}</span>
                          <span>•</span>
                          <span>{cls.schedule}</span>
                          <span>•</span>
                          <span>{cls.room}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-xl font-mono text-xs font-black text-indigo-700 whitespace-nowrap">
                          {studyStudents.filter(st => st.classId === cls.id).length} / {cls.maxQty} Alunos
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (course) {
                                setEditingCourseId(course.id);
                                setNewCourseName(course.name);
                                setNewCourseCategory(course.category || 'ESDE');
                                setNewCourseHours(String(course.hours || 40));
                              } else {
                                setEditingCourseId(cls.id);
                                setNewCourseName(cls.name.split(' - ')[0]);
                                setNewCourseCategory('ESDE');
                                setNewCourseHours('40');
                              }
                            }}
                            className="p-1.5 bg-white border border-gray-150 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Editar Curso"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cid = course ? course.id : cls.courseId || cls.id;
                              const cname = course ? course.name : cls.name;
                              handleDeleteCourse(cid, cname);
                            }}
                            className="p-1.5 bg-white border border-gray-150 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Excluir Curso"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Students Profile and Attendance Logs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Users className="text-emerald-600" size={22} />
                Gestão de Alunos e Diário de Frequência
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Acompanhamento de Estudantes e Faltas</p>
            </div>

            {/* Add Student Quick Form */}
            <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100 text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800 italic flex items-center gap-1.5 select-none text-[11px]">
                <Plus size={14} className="text-emerald-600" />
                {editingStudentId ? 'Editar Matrícula de Aluno' : 'Matricular Aluno em Turma'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Nome do Aluno</label>
                  <input
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Ex: Clara Ribeiro Santos"
                    className="w-full mt-1.5 h-10 bg-white border border-emerald-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Vincular à Turma</label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full mt-1.5 h-10 bg-white border border-emerald-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer mr-2"
                  >
                    <option value="">Selecione...</option>
                    {studyClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newStudentName.trim() || !newStudentClassId) {
                      alert("Preencha o nome e selecione a turma!");
                      return;
                    }
                    handleAddStudyStudent(newStudentName, "(11) 99122-3344", newStudentClassId);
                    setNewStudentName('');
                  }}
                  className="sm:col-span-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  {editingStudentId ? 'Salvar Alterações' : 'Matricular Aluno'}
                </button>
                {editingStudentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudentId(null);
                      setNewStudentName('');
                      setNewStudentClassId('');
                      setNewStudentPhone('');
                    }}
                    className="sm:col-span-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer text-center"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
            </div>

            {/* Students list and attendance checker */}
            <div className="space-y-4 text-left font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Registro de Diário de Classe de Alunos</h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {studyStudents.map((st) => {
                  const targetClass = studyClasses.find(cl => cl.id === st.classId);
                  return (
                    <div key={st.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-bold text-[8px] uppercase tracking-wider block w-max">
                          {targetClass ? targetClass.name : 'Sem turma'}
                        </span>
                        <h5 className="font-extrabold text-sm text-gray-950 leading-none pt-1 truncate">{st.name}</h5>
                        <div className="flex gap-2 items-center text-[9px] font-bold text-gray-450 uppercase tracking-wider pt-1">
                          <span>Status: <strong className={st.status.includes('Alerta') ? 'text-rose-600' : 'text-emerald-600'}>{st.status}</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-3 shrink-0 self-end sm:self-auto font-sans">
                        {/* Attendance Grid Checklist */}
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[8.5px] font-black tracking-widest uppercase text-gray-400">Frequência</span>
                          <div className="flex gap-1 mt-0.5">
                            {st.presence.map((pres: boolean, index: number) => (
                              <button
                                key={index}
                                onClick={() => handleToggleStudyPresence(st.id, index)}
                                className={cn(
                                  "w-6 h-6 rounded-lg text-[9px] font-black flex items-center justify-center transition-all cursor-pointer border",
                                  pres 
                                    ? "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100" 
                                    : "bg-red-50 border-red-150 text-red-700 hover:bg-red-100"
                                )}
                                title={`Aula ${index + 1}: ${pres ? 'Presente' : 'Ausente'}`}
                              >
                                {pres ? 'P' : 'F'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 border-l border-gray-200 pl-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudentId(st.id);
                              setNewStudentName(st.name);
                              setNewStudentClassId(st.classId);
                              setNewStudentPhone(st.phone || '');
                            }}
                            className="p-1.5 bg-white border border-gray-150 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Editar Matrícula"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudyStudent(st.id, st.name)}
                            className="p-1.5 bg-white border border-gray-150 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Remover Aluno"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Educational Materials */}
            <div className="pt-6 border-t border-gray-50 text-left font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Apostilas e Arquivos de Apoio</h4>
                
                {/* Upload Section */}
                <div className="shrink-0">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer border border-indigo-150 transition-colors">
                    <UploadCloud size={13} />
                    Subir Arquivo / PDF
                    <input 
                      type="file" 
                      onChange={handleStudyMaterialUpload} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studyMaterials.map((mat) => (
                  <div key={mat.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between hover:bg-slate-100/40 transition-colors">
                    <div className="text-left select-none max-w-[80%]">
                      <p className="font-extrabold text-xs text-gray-900 leading-snug truncate" title={mat.name}>{mat.name}</p>
                      <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider block mt-1">
                        {mat.type} • {mat.author} {mat.size ? `• ${mat.size}` : ''} {mat.duration ? `• ${mat.duration}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={mat.url || '#'}
                        download={mat.name}
                        onClick={(e) => {
                          if (!mat.url) {
                            e.preventDefault();
                            alert(`Fazendo download do material simulado: ${mat.name}`);
                          }
                        }}
                        className="p-1.5 border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all cursor-pointer text-gray-500 inline-flex items-center justify-center"
                        title="Fazer download"
                      >
                        <Download size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudyMaterial(mat.id, mat.name)}
                        className="p-1.5 border border-slate-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Material"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvangelizacaoDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 font-sans">
        {/* Left Column: Register/Control Kids */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Smile className="text-purple-600" size={22} />
                Evangelização Infantil & Juventude
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Ficha de Frequência e Acolhimento de Menores</p>
            </div>

            {/* Register Kid Form */}
            <div className="bg-purple-50/50 rounded-[32px] p-6 border border-purple-100 text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-purple-800 italic flex items-center justify-between select-none text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Plus size={14} className="text-purple-600" />
                  {editingKidId ? 'Editar Matrícula de Evangelizando / Jovem' : 'Matricular Criança / Jovem (Evangelização e Juventude)'}
                </span>
                {editingKidId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingKidId(null);
                      setNewKidName('');
                      setNewKidResponsible('');
                      setNewKidRoomId('');
                      setNewKidAllergies('');
                      setNewKidAge(6);
                      setNewKidPhone('');
                      setNewKidPhoneType('whatsapp');
                      setNewKidPhone2('');
                      setNewKidPhoneType2('whatsapp');
                      setNewKidRelationship('Pai');
                      setNewKidStudentPhone('');
                      setNewKidStudentPhoneType('whatsapp');
                    }}
                    className="text-[9px] text-[#2563eb] hover:text-[#1d4ed8] uppercase tracking-wider font-bold italic hover:underline cursor-pointer"
                  >
                    cancelar
                  </button>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Nome do Aluno/Menor</label>
                  <input
                    value={newKidName}
                    onChange={(e) => setNewKidName(e.target.value)}
                    placeholder="Ex: Lucas Silva"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Idade</label>
                  <input
                    type="number"
                    value={newKidAge || ''}
                    onChange={(e) => setNewKidAge(Number(e.target.value) || 0)}
                    placeholder="Ex: 8"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Opção de Ciclo / Turma</label>
                  <select
                    value={newKidRoomId}
                    onChange={(e) => setNewKidRoomId(e.target.value)}
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="">Selecione a Turma...</option>
                    {evangelizacaoRooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Alergias ou Observações Médicas</label>
                  <input
                    value={newKidAllergies}
                    onChange={(e) => setNewKidAllergies(e.target.value)}
                    placeholder="Alergia, asma, etc., ou escreva Nenhuma"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-6 border-t border-purple-100 pt-3 mt-1">
                  <span className="text-[10px] font-black tracking-widest text-purple-750 uppercase">Informações do Responsável</span>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Nome do Responsável Legal</label>
                  <input
                    value={newKidResponsible}
                    onChange={(e) => setNewKidResponsible(e.target.value)}
                    placeholder="Ex: Fernanda Dias"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Grau de Parentesco do Resp.</label>
                  <select
                    value={newKidRelationship}
                    onChange={(e) => setNewKidRelationship(e.target.value)}
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avô / Avó">Avô / Avó</option>
                    <option value="Tio / Tia">Tio / Tia</option>
                    <option value="Responsável Legal">Responsável Legal</option>
                    <option value="Outro">Outro / Tutor</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Telefone do Responsável (Principal)</label>
                  <input
                    value={newKidPhone}
                    onChange={(e) => setNewKidPhone(e.target.value)}
                    placeholder="Ex: (11) 98124-5511"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Tipo do Telefone 1 (Resp.)</label>
                  <select
                    value={newKidPhoneType}
                    onChange={(e) => setNewKidPhoneType(e.target.value as 'whatsapp' | 'telefone')}
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="whatsapp">🟢 WhatsApp (Mensagens)</option>
                    <option value="telefone">📞 Apenas Telefone (Ligação)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Telefone do Responsável 2</label>
                  <input
                    value={newKidPhone2}
                    onChange={(e) => setNewKidPhone2(e.target.value)}
                    placeholder="Ex: (11) 98124-5522"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Tipo do Telefone 2 (Resp.)</label>
                  <select
                    value={newKidPhoneType2}
                    onChange={(e) => setNewKidPhoneType2(e.target.value as 'whatsapp' | 'telefone')}
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="whatsapp">🟢 WhatsApp (Mensagens)</option>
                    <option value="telefone">📞 Apenas Telefone (Ligação)</option>
                  </select>
                </div>

                <div className="sm:col-span-6 border-t border-purple-100 pt-3 mt-1">
                  <span className="text-[10px] font-black tracking-widest text-purple-750 uppercase">Contato do Estudante / Jovem</span>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Telefone do Aluno (Se houver)</label>
                  <input
                    value={newKidStudentPhone}
                    onChange={(e) => setNewKidStudentPhone(e.target.value)}
                    placeholder="Ex: (11) 97111-2233"
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-bold uppercase text-gray-500 block">Tipo do Telefone (Aluno)</label>
                  <select
                    value={newKidStudentPhoneType}
                    onChange={(e) => setNewKidStudentPhoneType(e.target.value as 'whatsapp' | 'telefone')}
                    className="w-full mt-1.5 h-10 bg-white border border-purple-200 rounded-xl px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                  >
                    <option value="whatsapp">🟢 WhatsApp (Mensagens)</option>
                    <option value="telefone">📞 Apenas Telefone (Ligação)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newKidName.trim() || !newKidRoomId) {
                      alert("Preencha o nome do menor/estudante e selecione o ciclo!");
                      return;
                    }
                    handleRegisterEvaKid(
                      newKidName, 
                      newKidAge, 
                      newKidRoomId, 
                      newKidResponsible, 
                      newKidPhone, 
                      newKidPhoneType,
                      newKidPhone2,
                      newKidPhoneType2,
                      newKidRelationship,
                      newKidStudentPhone,
                      newKidStudentPhoneType,
                      newKidAllergies
                    );
                  }}
                  className="sm:col-span-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-colors cursor-pointer mt-3"
                >
                  {editingKidId ? 'Salvar Edições' : 'Matricular Evangelizando / Jovem'}
                </button>
              </div>
            </div>

            {/* Kids list with dynamic presence check-in for the day */}
            <div className="space-y-4 text-left font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic">Presenças do Dia (Check-in Evangelização)</h4>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {evangelizacaoKids.map((kid) => {
                  const targetRoom = evangelizacaoRooms.find(r => r.id === kid.roomId);
                  return (
                    <div key={kid.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-100/40 transition-all font-sans">
                      <div className="flex-1 min-w-0">
                        <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-full font-bold text-[8px] uppercase tracking-wider block w-max">
                          {targetRoom ? targetRoom.name : 'Simulador Intermediário'}
                        </span>
                        <h5 className="font-extrabold text-sm text-gray-950 leading-none pt-1.5">{kid.name} ({kid.age} anos)</h5>
                        <p className="text-[10px] text-gray-400 mt-1 truncate" title={kid.responsible}>
                          Resp: <strong>{kid.responsible}</strong> ({kid.relationship || 'Pai'}) • Alergias: <strong className={kid.allergies !== 'Nenhuma' ? 'text-red-650 font-bold' : ''}>{kid.allergies}</strong>
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[9px]">
                          {kid.phone && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono font-bold select-all">
                              👤 Resp 1: {kid.phone} {kid.phoneType === 'whatsapp' ? '💬 [WhatsApp]' : '📞 [Ligação]'}
                            </span>
                          )}
                          {kid.phone2 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono font-bold select-all">
                              👤 Resp 2: {kid.phone2} {kid.phoneType2 === 'whatsapp' ? '💬 [WhatsApp]' : '📞 [Ligação]'}
                            </span>
                          )}
                          {kid.studentPhone && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono font-bold select-all">
                              🧑‍🎓 Aluno: {kid.studentPhone} {kid.studentPhoneType === 'whatsapp' ? '💬 [WhatsApp]' : '📞 [Ligação]'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEvaPresence(kid.id)}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border cursor-pointer font-sans whitespace-nowrap",
                            kid.presenceToday
                              ? "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 border-amber-150 text-amber-750 hover:bg-amber-100"
                          )}
                        >
                          {kid.presenceToday ? "Presente" : "Falta"}
                        </button>
                        <div className="flex gap-1 pl-1 border-l border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKidId(kid.id);
                              setNewKidName(kid.name);
                              setNewKidAge(kid.age || 6);
                              setNewKidRoomId(kid.roomId);
                              setNewKidResponsible(kid.responsible || '');
                              setNewKidAllergies(kid.allergies || '');
                              setNewKidPhone(kid.phone || '');
                              setNewKidPhoneType(kid.phoneType || 'whatsapp');
                              setNewKidPhone2(kid.phone2 || '');
                              setNewKidPhoneType2(kid.phoneType2 || 'whatsapp');
                              setNewKidRelationship(kid.relationship || 'Pai');
                              setNewKidStudentPhone(kid.studentPhone || '');
                              setNewKidStudentPhoneType(kid.studentPhoneType || 'whatsapp');
                            }}
                            className="p-1 px-1.5 bg-white border border-gray-150 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Editar Matrícula"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvaKid(kid.id, kid.name)}
                            className="p-1 px-1.5 bg-white border border-gray-150 hover:bg-red-50 hover:text-red-650 rounded-lg transition-colors cursor-pointer text-gray-500"
                            title="Remover Criança"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Evangelizacao Rooms and Gamification/Lessons */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-50 pb-6 text-left">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                <Award className="text-indigo-600" size={22} />
                Salas de Aula e Plano Pedagógico
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Evangelizadores e Programas de Estudo por Ciclo</p>
            </div>

            {/* Ciclos listing */}
            <div className="space-y-4 text-left">
              {evangelizacaoRooms.map((room) => (
                <div key={room.id} className="p-5 bg-gray-50 border border-gray-150 rounded-3xl flex justify-between items-center hover:bg-gray-100/40 transition-all font-sans">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-950 leading-none">{room.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                      Evangelizadores: <strong className="text-indigo-800">{room.leaders}</strong> • {room.schedule}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Sala: {room.room}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-[#5b21b6] font-mono shadow-sm">
                      {evangelizacaoKids.filter(k => k.roomId === room.id).length} Kid(s)
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoomId(room.id);
                          setNewRoomName(room.name);
                          setNewRoomLeaders(room.leaders);
                          setNewRoomLocation(room.room);
                          setNewRoomSchedule(room.schedule);
                        }}
                        className="p-1.5 bg-white border border-gray-150 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors cursor-pointer text-gray-500"
                        title="Editar Ciclo de Evangelização"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvaRoom(room.id, room.name)}
                        className="p-1.5 bg-white border border-gray-150 hover:bg-red-50 hover:text-red-650 rounded-lg transition-colors cursor-pointer text-gray-500"
                        title="Excluir Ciclo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Form to Add or Edit Evangelização Cycles / Rooms */}
            <div className="bg-purple-50/50 rounded-[32px] p-5 border border-purple-100 text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-purple-800 italic flex items-center justify-between select-none">
                <span>{editingRoomId ? 'Editar Ciclo / Faixa Etária' : 'Adicionar Novo Ciclo de Estudos'}</span>
                {editingRoomId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingRoomId(null);
                      setNewRoomName('');
                      setNewRoomLeaders('');
                      setNewRoomLocation('Sala Infantil A');
                      setNewRoomSchedule('Sábados, 15:00');
                    }}
                    className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold italic hover:underline cursor-pointer"
                  >
                    cancelar
                  </button>
                )}
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Nome do Ciclo</label>
                    <input
                      type="text"
                      placeholder="Ex: Maternal (3 a 5 anos)"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full mt-1 h-8 bg-white border border-purple-200 rounded-xl px-2.5 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Evangelizadores</label>
                    <input
                      type="text"
                      placeholder="Ex: Sandra & Helena"
                      value={newRoomLeaders}
                      onChange={(e) => setNewRoomLeaders(e.target.value)}
                      className="w-full mt-1 h-8 bg-white border border-purple-200 rounded-xl px-2.5 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Horário</label>
                    <input
                      type="text"
                      placeholder="Ex: Sábados, 15:00"
                      value={newRoomSchedule}
                      onChange={(e) => setNewRoomSchedule(e.target.value)}
                      className="w-full mt-1 h-8 bg-white border border-purple-200 rounded-xl px-2.5 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">Local / Sala de Aula</label>
                    <input
                      type="text"
                      placeholder="Ex: Sala Infantil A"
                      value={newRoomLocation}
                      onChange={(e) => setNewRoomLocation(e.target.value)}
                      className="w-full mt-1 h-8 bg-white border border-purple-200 rounded-xl px-2.5 text-xs font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newRoomName.trim()) {
                      alert("Por favor, preencha o nome do ciclo.");
                      return;
                    }
                    handleAddEvaRoom(newRoomName, newRoomSchedule, newRoomLocation, newRoomLeaders || 'Coordenador(a)');
                  }}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  {editingRoomId ? 'Salvar Edições do Ciclo' : 'Cadastrar Ciclo / Turma'}
                </button>
              </div>
            </div>

            {/* Row 3: Educational lessons dynamic plans */}
            <div className="pt-6 border-t border-gray-50 text-left font-sans">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#a8a29e] italic mb-4">Metodologia e Incentivos Fraternos (Selos de Caridade)</h4>
              <div className="p-5 bg-[#faf5ff] border border-[#f3e8ff] rounded-3xl space-y-3 font-sans">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">Educação com Carinho e Evangelização Dinâmica</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Distribuição simbólica de selos de dedicação, cooperação e amizade cristã.</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap pt-1 font-sans">
                  <span className="px-2.5 py-1 bg-white border border-purple-150 text-purple-700 font-bold text-[9px] uppercase tracking-wider rounded-lg">⭐ Estrela de Sintonia</span>
                  <span className="px-2.5 py-1 bg-white border border-purple-150 text-purple-700 font-bold text-[9px] uppercase tracking-wider rounded-lg">🤝 Cooperação Fraterna</span>
                  <span className="px-2.5 py-1 bg-white border border-purple-150 text-purple-700 font-bold text-[9px] uppercase tracking-wider rounded-lg">📖 Leitura Doce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMediunicaDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-sans">
        {/* Top Header: Sub-sector Banner */}
        <div className="bg-slate-950 rounded-[40px] border border-slate-800 p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-slate-800 opacity-20 pointer-events-none select-none">
            <Lock size={120} />
          </div>
          <div className="relative z-10 text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-950/40 border border-rose-900/30 text-rose-500 rounded-full font-black text-[10px] uppercase tracking-widest">
              <ShieldAlert size={14} className="text-rose-500 animate-pulse" />
              Setor Restrito & Destinado à Coordenação Mediúnica
            </div>
            <h2 className="text-3xl font-black italic tracking-tight text-slate-100 uppercase">
              Área de Gestão & Prática Mediúnica
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl font-medium leading-relaxed">
              Controle absoluto e sigiloso de reuniões desobsessivas, fluidoterapia, escalas de dialogadores e sustentadores, estudos especializados, diário fraterno e as diretrizes do Livro dos Médiuns.
            </p>
          </div>
        </div>

        {/* 10 tab buttons for a massive, multi-faceted layout */}
        <div className="flex border-b border-gray-150 pb-2.5 gap-2 overflow-x-auto scrollbar-none w-full whitespace-nowrap">
          {[
            { id: 'reunioes', label: 'Reuniões', icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'trabalhadores', label: 'Quadro de Médiuns', icon: Users, color: 'text-rose-600 bg-rose-50' },
            { id: 'frequencia', label: 'Assiduidade', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'escalas', label: 'Escalas', icon: Clock, color: 'text-purple-600 bg-purple-50' },
            { id: 'estudos', label: 'Formação', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
            { id: 'encaminhamentos', label: 'Encaminhamentos', icon: ShieldAlert, color: 'text-cyan-600 bg-cyan-50' },
            { id: 'salas', label: 'Ambientes', icon: MapPin, color: 'text-teal-600 bg-teal-50' },
            { id: 'biblioteca', label: 'Biblioteca', icon: FileText, color: 'text-sky-600 bg-sky-50' },
            { id: 'acolhimento', label: 'Acolhimento', icon: Smile, color: 'text-fuchsia-600 bg-fuchsia-50' },
            { id: 'seguranca', label: 'Segurança & Logs', icon: Lock, color: 'text-slate-600 bg-slate-50' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mediunicaActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMediunicaActiveTab(item.id as any);
                  // Log sub-tab access simulated
                  const newLog = {
                    id: 'ml_' + Date.now(),
                    timestamp: new Date().toISOString(),
                    user: currentUser?.email || 'carlostecal35@gmail.com',
                    action: 'Acesso à Aba: ' + item.label,
                    details: `Navegou para o subsetor de ${item.label.toLowerCase()} mediúnica.`
                  };
                  const updatedLogs = [newLog, ...mediunicaLogs];
                  setMediunicaLogs(updatedLogs);
                  localStorage.setItem('medi_logs', JSON.stringify(updatedLogs));
                }}
                className={cn(
                  "flex items-center gap-2.5 px-4.5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer border flex-shrink-0",
                  isActive 
                    ? "bg-slate-950 border-slate-950 text-white shadow-md duration-300"
                    : "bg-white hover:bg-gray-50 text-gray-500 border-gray-100 hover:text-gray-900 duration-300"
                )}
              >
                <div className={cn("p-1 rounded-md", isActive ? "bg-white/20 text-white" : item.color)}>
                  <Icon size={13} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content based on selected active tab */}
        {mediunicaActiveTab === 'reunioes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md">Atividade Crítica</span>
                <h3 className="text-xl font-black text-gray-950 mt-2">Reuniões Mediúnicas Ativas</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Portas fechadas, sigilo ético absoluto e harmonia espiritual.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaGroups.map((group) => (
                  <div key={group.id} className="p-5 bg-gray-50 hover:bg-white border border-gray-200/60 hover:border-gray-300 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-900/40 rounded-full font-black text-[8px] uppercase tracking-wider block w-max">
                          {group.id === 'mg1' ? 'MÁXIMO SIGILO' : 'RESTRITO A CONVIDADOS'}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {group.room || 'Fluídos B'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-2 leading-tight">{group.name}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Dirigente Geral: {group.leader}</p>
                      <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-1.5">{group.schedule}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="px-3.5 py-1.5 bg-slate-950 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-wide">
                        {group.count || 5} Obreiros Escalados
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Remover reunião "${group.name}"? Isso fechará os encaminhamentos espirituais associados.`)) {
                            const updated = mediunicaGroups.filter(g => g.id !== group.id);
                            setMediunicaGroups(updated);
                            localStorage.setItem('medi_groups', JSON.stringify(updated));
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-2 text-xs font-bold uppercase tracking-wider text-right self-end"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Cadastrar Reunião Mediúnica</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Definir critérios de segurança, requisitos e sala autorizada.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título de Reunião</label>
                  <input
                    value={newMediGroupTitle}
                    onChange={(e) => setNewMediGroupTitle(e.target.value)}
                    placeholder="Ex: Grupo Mediúnico Eurípedes"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Dirigente Responsável</label>
                    <input
                      value={newMediGroupLeader}
                      onChange={(e) => setNewMediGroupLeader(e.target.value)}
                      placeholder="Ex: Clara de Assis"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Horários / Dia</label>
                    <input
                      value={newMediGroupSchedule}
                      onChange={(e) => setNewMediGroupSchedule(e.target.value)}
                      placeholder="Ex: Terças, 19h30"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-gray-800"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!newMediGroupTitle.trim() || !newMediGroupLeader.trim()) {
                      alert("Insira título e dirigente responsável para prosseguir.");
                      return;
                    }
                    handleAddMediGroup(newMediGroupTitle, newMediGroupLeader, newMediGroupSchedule || "Quinta, 20h00");
                    setNewMediGroupTitle('');
                    setNewMediGroupLeader('');
                    setNewMediGroupSchedule('');
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Reunião (Regime Confidencial)
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'trabalhadores' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-950">Médiuns e Trabalhadores Integrantes</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Organização hierárquica por funções doutrinárias e formação espírita.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaMembers.map((mem) => {
                  const targetGroup = mediunicaGroups.find(g => g.id === mem.groupId);
                  return (
                    <div key={mem.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-100 transition-all">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 font-bold text-[8px] uppercase tracking-wider rounded-md",
                            mem.role === 'Dirigente' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            mem.role === 'Dialogador' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                            mem.role === 'Sustentador' ? 'bg-slate-100 text-slate-700' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          )}>
                            {mem.role}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                            mem.status === 'Inativo' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          )}>
                            {mem.status || 'Ativo'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900 mt-2">{mem.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-1 font-bold">Tempo de Trabalho: {mem.time || '2 anos'} • {mem.formacao || 'ESDE'}</p>
                        <p className="text-[10px] text-indigo-600 font-extrabold mt-1">Reunião: {targetGroup ? targetGroup.name : 'Sem Reunião Fixa'}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 mt-3 sm:mt-0">
                        <button
                          onClick={() => {
                            // Toggle active
                            const updated = mediunicaMembers.map(m => {
                              if (m.id === mem.id) {
                                return { ...m, status: m.status === 'Inativo' ? 'Ativo' : 'Inativo' };
                              }
                              return m;
                            });
                            setMediunicaMembers(updated);
                            localStorage.setItem('medi_members', JSON.stringify(updated));
                          }}
                          className="px-2 py-1.5 bg-white border border-gray-150 text-[9px] font-black uppercase text-gray-600 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          Alterar Status
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja desligar ${mem.name} da equipe mediúnica?`)) {
                              const updated = mediunicaMembers.filter(m => m.id !== mem.id);
                              setMediunicaMembers(updated);
                              localStorage.setItem('medi_members', JSON.stringify(updated));
                            }
                          }}
                          className="text-red-550 hover:text-red-700 p-2 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Inscrever Trabalhador</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Registrar qualificação doutrinária para escalonamento.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome Completo</label>
                  <input
                    value={newMediWorkerName}
                    onChange={(e) => setNewMediWorkerName(e.target.value)}
                    placeholder="Ex: Francisco de Assis Nogueira"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 transition-colors text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Função Principal</label>
                    <select
                      value={newMediWorkerRole}
                      onChange={(e) => setNewMediWorkerRole(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                    >
                      <option value="Médium de Psicofonia">Médium de Psicofonia</option>
                      <option value="Médium de Passes">Médium de Passes / Fluidoterapia</option>
                      <option value="Dialogador">Dialogador / Esclarecedor</option>
                      <option value="Sustentador">Sustentador Mental</option>
                      <option value="Coordenador">Coordenador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tempo de Atividade</label>
                    <input
                      value={newMediWorkerTime}
                      onChange={(e) => setNewMediWorkerTime(e.target.value)}
                      placeholder="Ex: 3 anos"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Formação Doutrinária e Cursos</label>
                  <input
                    value={newMediWorkerFormacao}
                    onChange={(e) => setNewMediWorkerFormacao(e.target.value)}
                    placeholder="Ex: ESDE Completo, Estudo do Livro do Médiuns"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vincular a Reunião</label>
                  <select
                    value={newMediWorkerGroup}
                    onChange={(e) => setNewMediWorkerGroup(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                  >
                    {mediunicaGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Observações / Compromisso Fraterno</label>
                  <textarea
                    value={newMediWorkerNotes}
                    onChange={(e) => setNewMediWorkerNotes(e.target.value)}
                    placeholder="Indique relatos de sensibilidade ou recomendações..."
                    className="w-full mt-1 min-h-[70px] bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediWorkerName.trim()) {
                      alert("O nome do trabalhador é obrigatório.");
                      return;
                    }
                    const newWorker = {
                      id: 'mm_' + Date.now(),
                      name: newMediWorkerName,
                      role: newMediWorkerRole,
                      groupId: newMediWorkerGroup,
                      time: newMediWorkerTime,
                      formacao: newMediWorkerFormacao,
                      status: 'Ativo',
                      presence: [true, true, true],
                      notes: newMediWorkerNotes || 'Inscrito na equipe ativa.'
                    };
                    const updated = [...mediunicaMembers, newWorker];
                    setMediunicaMembers(updated);
                    localStorage.setItem('medi_members', JSON.stringify(updated));

                    // Reset form
                    setNewMediWorkerName('');
                    setNewMediWorkerNotes('');
                    alert("Trabalhador registrado com sucesso!");
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Médium no Quadro
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'frequencia' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900">Diário de Presenças &amp; Frequência Individual</h3>
                <p className="text-xs text-gray-455 mt-1 font-semibold">Registro e acompanhamento assíduo das equipes para garantia da harmonia vibratória.</p>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-bold leading-relaxed max-w-sm">
                Nota: A ausência injustificada em mais de 2 reuniões requer acolhimento psicológico fraterno.
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex-1 min-w-[200px]">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Total de Membros Ativos</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{mediunicaMembers.length}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex-1 min-w-[200px]">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Média Geral de Assiduidade</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">91%</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex-1 min-w-[200px]">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Alertas de Ausência Ativos</span>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {mediunicaMembers.filter(m => m.presence?.filter((p: boolean) => !p).length >= 2).length} Trabalhadores
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[24px] border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white text-[10px] uppercase tracking-widest font-black">
                    <th className="p-4 pl-6">Nome do Trabalhador</th>
                    <th className="p-4">Função / Função Espírita</th>
                    <th className="p-4">Assiduidade Recente</th>
                    <th className="p-4 pr-6 text-center">Frequência (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                  {mediunicaMembers.map((mem) => {
                    const missed = mem.presence?.filter((p: boolean) => !p).length || 0;
                    const pct = Math.round(((mem.presence?.filter((p: boolean) => p).length || 3) / 3) * 100);
                    return (
                      <tr key={mem.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-extrabold text-gray-950 text-sm">{mem.name}</p>
                          {missed >= 2 && (
                            <span className="text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wider block w-max mt-1 animate-pulse">
                              Acolhimento Indicado
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 font-bold">{mem.role}</td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            {mem.presence?.map((pres: boolean, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleToggleMediPresence(mem.id, idx)}
                                className={cn(
                                  "w-7 h-7 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center justify-center",
                                  pres 
                                    ? "bg-emerald-50 border-emerald-150 text-emerald-800 hover:bg-emerald-100" 
                                    : "bg-rose-50 border-rose-150 text-rose-850 hover:bg-rose-100"
                                )}
                                title={`Sessão ${idx + 1}: Clique para alternar`}
                              >
                                {pres ? 'P' : 'F'}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-center text-sm font-bold text-gray-900">
                          <span className={pct < 70 ? 'text-red-650' : 'text-emerald-700'}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'escalas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-950">Escalas Ativas de Prática Mediúnica</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Programação de rodízio e atribuição de funções por datas regulamentadas.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaEscalas.map((esc) => (
                  <div key={esc.id} className="p-5 bg-gray-50 border border-gray-150 hover:border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md block w-max uppercase tracking-wider">
                        Data: {esc.date}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-2">{esc.groupName}</h4>
                      <p className="text-xs text-slate-500 mt-1">Dirigente Geral: <strong className="text-slate-700">{esc.leader}</strong></p>
                      
                      <div className="mt-3 space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Equipe Alocada:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {esc.workers?.map((w: string, idx: number) => (
                            <span key={idx} className="bg-white border border-gray-200 text-gray-700 font-extrabold text-[9px] px-2 py-0.5 rounded-md">
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>

                      {esc.notes && (
                        <p className="text-xs text-slate-500 font-semibold italic mt-3 bg-white p-2 border border-dashed rounded-xl">" {esc.notes} "</p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover escala de ${esc.date}?`)) {
                          const updated = mediunicaEscalas.filter(e => e.id !== esc.id);
                          setMediunicaEscalas(updated);
                          localStorage.setItem('medi_escalas', JSON.stringify(updated));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-2 text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Criar Nova Escala</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Definir escala específica por data e equipe.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data do Trabalho</label>
                  <input
                    type="date"
                    value={newMediEscalaDate}
                    onChange={(e) => setNewMediEscalaDate(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vincular Reunião</label>
                  <select
                    value={newMediEscalaGroup}
                    onChange={(e) => {
                      setNewMediEscalaGroup(e.target.value);
                      const selectedG = mediunicaGroups.find(g => g.id === e.target.value);
                      if (selectedG) {
                        setNewMediEscalaLeader(selectedG.leader);
                      }
                    }}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                  >
                    {mediunicaGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-extrabold text-purple-700">Obreiros Escalados</label>
                  <div className="max-h-[120px] overflow-y-auto p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1.5 mt-1">
                    {mediunicaMembers.map(m => (
                      <label key={m.id} className="flex items-center gap-2 font-bold cursor-pointer hover:bg-white p-1 rounded transition-all select-none">
                        <input
                          type="checkbox"
                          checked={newMediEscalaWorkers.includes(m.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMediEscalaWorkers([...newMediEscalaWorkers, m.name]);
                            } else {
                              setNewMediEscalaWorkers(newMediEscalaWorkers.filter(w => w !== m.name));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{m.name} ({m.role})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Observações da Escala</label>
                  <input
                    value={newMediEscalaNotes}
                    onChange={(e) => setNewMediEscalaNotes(e.target.value)}
                    placeholder="Instruções espirituais ou observações..."
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediEscalaDate || newMediEscalaWorkers.length === 0) {
                      alert("Insira a data e pelo menos um médium escalado.");
                      return;
                    }
                    const selectedG = mediunicaGroups.find(g => g.id === newMediEscalaGroup);
                    const newEsc = {
                      id: 'me_' + Date.now(),
                      date: newMediEscalaDate,
                      groupName: selectedG ? selectedG.name : 'Trabalho Mediúnico',
                      workers: newMediEscalaWorkers,
                      leader: newMediEscalaLeader || selectedG?.leader || 'Secretaria',
                      notes: newMediEscalaNotes
                    };
                    const updated = [...mediunicaEscalas, newEsc];
                    setMediunicaEscalas(updated);
                    localStorage.setItem('medi_escalas', JSON.stringify(updated));

                    // Reset form
                    setNewMediEscalaDate('');
                    setNewMediEscalaWorkers([]);
                    setNewMediEscalaNotes('');
                    alert("Escala salva com sucesso!");
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Escala no Calendário
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'estudos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-950">Formações &amp; Cursos Mediúnicos Regulares</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Capacitação teórica e prática com base rigorosa nas obras fundamentais de Allan Kardec.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaCursos.map((c) => (
                  <div key={c.id} className="p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-amber-200 transition-all">
                    <div>
                      <span className="text-[8.5px] font-black text-amber-850 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
                        {c.hours} Horas Classificados
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-base mt-2">{c.name}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Facilitador: {c.facilitator}</p>
                      <p className="text-[10px] text-gray-400 font-extrabold mt-1">Material de Estudo: {c.material}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover curso/formação "${c.name}"?`)) {
                          const updated = mediunicaCursos.filter(item => item.id !== c.id);
                          setMediunicaCursos(updated);
                          localStorage.setItem('medi_cursos', JSON.stringify(updated));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-2 text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Cadastrar Novo Curso</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Oferecer programa de preparação técnica.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título do Curso</label>
                  <input
                    value={newMediCursoName}
                    onChange={(e) => setNewMediCursoName(e.target.value)}
                    placeholder="Ex: Formação Doutrinária da Obsessão"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Facilitador de Aula</label>
                    <input
                      value={newMediCursoFacilitador}
                      onChange={(e) => setNewMediCursoFacilitador(e.target.value)}
                      placeholder="Ex: Marta de Oliveira"
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Carga Horária (Hrs)</label>
                    <input
                      type="number"
                      value={newMediCursoHours}
                      onChange={(e) => setNewMediCursoHours(Number(e.target.value))}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-850"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Principal Obra / Apostila Recomendada</label>
                  <input
                    value={newMediCursoMaterial}
                    onChange={(e) => setNewMediCursoMaterial(e.target.value)}
                    placeholder="Ex: Diálogo com as Sombras - Hermínio Miranda"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediCursoName.trim() || !newMediCursoFacilitador.trim()) {
                      alert("Entre com o título do curso e o facilitador.");
                      return;
                    }
                    const newC = {
                      id: 'mc_' + Date.now(),
                      name: newMediCursoName,
                      facilitator: newMediCursoFacilitador,
                      hours: newMediCursoHours || 40,
                      material: newMediCursoMaterial || 'Livros Espíritas de Allan Kardec',
                      active: true
                    };
                    const updated = [...mediunicaCursos, newC];
                    setMediunicaCursos(updated);
                    localStorage.setItem('medi_cursos', JSON.stringify(updated));

                    // Reset form
                    setNewMediCursoName('');
                    setNewMediCursoFacilitador('');
                    setNewMediCursoMaterial('');
                    alert("Programa de estudo inserido!");
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Formação Doutrinária
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'encaminhamentos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-950">Encaminhamentos Confidenciais</h3>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">Usuários encaminhados pelo Atendimento Fraterno para tratamento desobsessivo.</p>
                </div>
                
                {/* Simulated Encryption Key control button */}
                <button
                  onClick={() => {
                    setSimulatedEncryptionActive(!simulatedEncryptionActive);
                    // Log cryptographic activity simulated
                    const newLog = {
                      id: 'ml_' + Date.now(),
                      timestamp: new Date().toISOString(),
                      user: currentUser?.email || 'carlostecal35@gmail.com',
                      action: simulatedEncryptionActive ? 'Descriptografia Ativada' : 'Criptografia Ativada',
                      details: `Alternou chave de criptografia de prontuário espiritual.`
                    };
                    const updatedLogs = [newLog, ...mediunicaLogs];
                    setMediunicaLogs(updatedLogs);
                    localStorage.setItem('medi_logs', JSON.stringify(updatedLogs));
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer border transition-all flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center",
                    simulatedEncryptionActive
                      ? "bg-rose-50 text-rose-700 border-rose-150 animate-pulse"
                      : "bg-emerald-50 text-emerald-800 border-emerald-150"
                  )}
                >
                  <Lock size={12} />
                  {simulatedEncryptionActive ? 'Criptografado (Ativo)' : 'Modo Leitura / Ver Observações'}
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaReferrals.map((ref) => (
                  <div key={ref.id} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8.5px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded uppercase tracking-wider">
                          Origem: {ref.origin}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1.5">{ref.name}</h4>
                        <p className="text-xs text-indigo-700 font-extrabold mt-1">Indicação: {ref.destination}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          const updated = mediunicaReferrals.map(r => {
                            if (r.id === ref.id) {
                              return { ...r, isClosed: !r.isClosed };
                            }
                            return r;
                          });
                          setMediunicaReferrals(updated);
                          localStorage.setItem('medi_referrals', JSON.stringify(updated));
                        }}
                        className={cn(
                          "px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer",
                          ref.isClosed 
                            ? "bg-slate-200 text-slate-700 border-transparent" 
                            : "bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100"
                        )}
                      >
                        {ref.isClosed ? 'Concluído' : 'Concluir Tratamento'}
                      </button>
                    </div>

                    <div className="p-3 bg-white border border-gray-150 rounded-xl space-y-1 text-xs">
                      <p className="text-gray-500 font-bold">Motivação da Triagem:</p>
                      <p className="font-semibold text-gray-850 leading-relaxed">"{ref.reason}"</p>
                    </div>

                    {/* Highly confidential observations simulated encryption */}
                    <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1 text-xs relative overflow-hidden text-left">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5">
                        <span className="text-[8.5px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                          <Lock size={10} /> Relato do Atendimento Fraterno (Reservado)
                        </span>
                        {simulatedEncryptionActive && (
                          <span className="text-[7.5px] bg-rose-950/40 text-rose-300 font-black px-1 rounded border border-rose-900/30">AES-256</span>
                        )}
                      </div>
                      {simulatedEncryptionActive ? (
                        <p className="text-[10px] text-slate-400 break-all select-none font-mono">
                          [AES_ENCRYPTED_SHA256_HASH_D98F2312A09B8F77E623BD086B1... CLICK EM "VER OBSERVAÇÕES" PARA DESCRIPTOGRAFAR]
                        </p>
                      ) : (
                        <p className="text-xs text-slate-350 leading-relaxed italic">"{ref.obs || 'Nenhuma informação confidencial anotada.'}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Novo Encaminhamento</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Registrar usuário vindo de triagem confidencial externa.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Sensibilizado</label>
                  <input
                    value={newMediReferralName}
                    onChange={(e) => setNewMediReferralName(e.target.value)}
                    placeholder="Ex: André Luiz da Silva"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Origem do Cadastro</label>
                    <select
                      value={newMediReferralOrigem}
                      onChange={(e) => setNewMediReferralOrigem(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 font-bold"
                    >
                      <option value="Atendimento Fraterno">Atendimento Fraterno</option>
                      <option value="Palestras Públicas">Palestra / Evangelho</option>
                      <option value="Passes Longos">Setor de Passes</option>
                      <option value="Evolução de Prontuário">Passe Especial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-extrabold text-indigo-700">Grupo de Destino</label>
                    <select
                      value={newMediReferralDestino}
                      onChange={(e) => setNewMediReferralDestino(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-850"
                    >
                      {mediunicaGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Motivo / Sensibilidade Relatada na Triagem</label>
                  <input
                    value={newMediReferralMotivo}
                    onChange={(e) => setNewMediReferralMotivo(e.target.value)}
                    placeholder="Sensibilidade auditiva, cansaço extremo, sonhos aflitivos..."
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mt-1.5 font-bold">Observações Sigilosas (Criptografia AES-256)</label>
                  <textarea
                    value={newMediReferralObs}
                    onChange={(e) => setNewMediReferralObs(e.target.value)}
                    placeholder="Evite nomes de terceiros. Apenas dados espirituais ou obsessivos graves."
                    className="w-full mt-1 min-h-[90px] bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediReferralName.trim()) {
                      alert("O nome do sensibilizado é obrigatório.");
                      return;
                    }
                    const newR = {
                      id: 'mr_' + Date.now(),
                      name: newMediReferralName,
                      origin: newMediReferralOrigem,
                      destination: newMediReferralDestino,
                      reason: newMediReferralMotivo,
                      obs: newMediReferralObs,
                      isClosed: false,
                      date: new Date().toISOString().split('T')[0]
                    };
                    const updated = [...mediunicaReferrals, newR];
                    setMediunicaReferrals(updated);
                    localStorage.setItem('medi_referrals', JSON.stringify(updated));

                    // Reset form
                    setNewMediReferralName('');
                    setNewMediReferralObs('');
                    alert("Encaminhamento sob criptografia salvo!");
                  }}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Encaminhamento Sob Criptografia
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'salas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-950">Acomodações e Salas de Fluidoterapia</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Organização física das salas específicas de passes magnéticos e tratamento espiritual desobsessivo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediunicaRooms.map((room) => (
                  <div key={room.id} className="p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "px-2 py-0.5 rounded uppercase font-black text-[8px] tracking-wider block",
                          room.status === 'Livre' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          room.status === 'Em Atividade' ? 'bg-rose-50 text-rose-700 border border-rose-100 border-dashed animate-pulse' :
                          'bg-amber-50 text-amber-700'
                        )}>
                          Status: {room.status}
                        </span>
                        
                        <button
                          onClick={() => {
                            if (confirm(`Remover sala/ambiente "${room.name}"?`)) {
                              const updated = mediunicaRooms.filter(r => r.id !== room.id);
                              setMediunicaRooms(updated);
                              localStorage.setItem('medi_rooms', JSON.stringify(updated));
                            }
                          }}
                          className="text-red-500 hover:text-red-700 text-xs cursor-pointer font-extrabold uppercase tracking-wider"
                        >
                          Remover
                        </button>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base mt-2.5">{room.name}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">Função: {room.type}</p>
                      <p className="text-[10px] text-gray-400 font-extrabold mt-1">Capacidade Teórica: {room.capacity} Obreiros / Ouvintes</p>
                    </div>

                    <div className="border-t border-gray-200/55 pt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const updated = mediunicaRooms.map(r => {
                            if (r.id === room.id) {
                              return { ...r, status: r.status === 'Livre' ? 'Em Atividade' : r.status === 'Em Atividade' ? 'Preparação' : 'Livre' };
                            }
                            return r;
                          });
                          setMediunicaRooms(updated);
                          localStorage.setItem('medi_rooms', JSON.stringify(updated));
                        }}
                        className="px-2.5 py-1 text-[8.5px] font-black uppercase bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Activity size={10} /> Alternar Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Cadastrar Novo Ambiente</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Vincular espaços de sustentação energética.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Identificador da Sala</label>
                  <input
                    value={newMediRoomName}
                    onChange={(e) => setNewMediRoomName(e.target.value)}
                    placeholder="Ex: Sala Alan Kardec (Fluídos C)"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tipo de Atividade</label>
                    <select
                      value={newMediRoomType}
                      onChange={(e) => setNewMediRoomType(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                    >
                      <option value="Desobsessão e Fluidoterapia">Desobsessão</option>
                      <option value="Atendimento e Passes">Atendimento de Passes</option>
                      <option value="Estudo de Educação Mediúnica">Estudos / Testes</option>
                      <option value="Triagem Espiritual">Câmara de Irradiação</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Capacidade Teórica</label>
                    <input
                      type="number"
                      value={newMediRoomCapacity}
                      onChange={(e) => setNewMediRoomCapacity(Number(e.target.value))}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-850 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Responsável do Ambiente</label>
                  <input
                    value={newMediRoomResp}
                    onChange={(e) => setNewMediRoomResp(e.target.value)}
                    placeholder="Ex: Roberto Nogueira"
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-semibold"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediRoomName.trim()) {
                      alert("Insira a identificação da sala.");
                      return;
                    }
                    const newRm = {
                      id: 'mrm_' + Date.now(),
                      name: newMediRoomName,
                      type: newMediRoomType,
                      capacity: newMediRoomCapacity || 12,
                      status: 'Livre',
                      resp: newMediRoomResp || 'Equipe de Apoio'
                    };
                    const updated = [...mediunicaRooms, newRm];
                    setMediunicaRooms(updated);
                    localStorage.setItem('medi_rooms', JSON.stringify(updated));

                    // Reset form
                    setNewMediRoomName('');
                    setNewMediRoomResp('');
                    alert("Ambiente físico cadastrado!");
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Registrar Espaço Mediúnico
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'biblioteca' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-black text-gray-900">Biblioteca &amp; Acervo Doutrinário Recomendado</h3>
              <p className="text-xs text-gray-450 mt-1 font-semibold">Leituras complementares oficiais e compilações recomendadas para alinhamento metodológico das equipes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'O Livro dos Médiuns', author: 'Allan Kardec', year: '1861', importance: 'Guia Fundamental do Setor', description: 'Trata do ensino dos espíritos sobre a teoria de todos os gêneros de manifestações, meios de comunicação, educação da mediunidade e dificuldades.' },
                { title: 'Nos Domínios da Mediunidade', author: 'André Luiz / F. C. Xavier', year: '1955', importance: 'Estágios Clínicos e Obsessão', description: 'Estudo sutil e detalhado da psicofonia, passes magnéticos, desdobramento espiritual e as obsessões sob a ótica científica da fluidoterapia.' },
                { title: 'Missionários da Luz', author: 'André Luiz / F. C. Xavier', year: '1945', importance: 'Anatomia da Aura e Fluidos', description: 'Revela o papel espiritual da pineal, a química do fluidomagnetismo das equipes invisíveis nas reuniões e a extrema responsabilidade do obreiro.' },
                { title: 'Mecanismos da Mediunidade', author: 'André Luiz / Waldo Vieira / F. C. Xavier', year: '1960', importance: 'Vibrações e Física de Espíritos', description: 'Inter-relação entre ondas eletromagnéticas, o pensamento criador e os fenômenos mediúnicos de efeitos físicos e intelectuais.' }
              ].map((book, idx) => (
                <div key={idx} className="p-5 bg-[#F8FAFC] rounded-3xl border border-gray-150 flex flex-col justify-between space-y-4 hover:shadow-sm hover:border-gray-350 transition-all">
                  <div className="space-y-4 text-left">
                    <span className="text-[8.5px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded inline-block">
                      {book.importance}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-gray-950 text-base leading-tight">{book.title}</h4>
                      <p className="text-xs text-gray-400 font-bold mt-1">Autor: {book.author} ({book.year})</p>
                    </div>
                    <p className="text-xs text-gray-655 leading-relaxed font-semibold italic">"{book.description}"</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200/50">
                    <button
                      onClick={() => alert(`Material Digital "${book.title}" carregado com sucesso! Clique para baixar os resumos capitulados no centro de estudos espíritas.`)}
                      className="w-full text-center py-2 bg-white hover:bg-slate-900 border border-gray-200 text-gray-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Acessar Estudo de Caso
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'acolhimento' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-300">
            <div className="lg:col-span-12 xl:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-950">Acompanhamento &amp; Harmonização Fraterna de Obreiros</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Espaço dedicado exclusivamente ao amparo emocional das equipes mediúnicas frente a estresses individuais e familiares.</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {mediunicaAcolhimento.map((item) => (
                  <div key={item.id} className="p-5 bg-[#F8FAFC] border border-gray-150 rounded-2xl space-y-3 hover:border-fuchsia-200 transition-all text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-none">{item.workerName}</h4>
                        <span className={cn(
                          "inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-2.5",
                          item.status === 'Fragilizado' ? 'bg-fuchsia-100 text-fuchsia-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                        )}>
                          Grau de Alerta: {item.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Remover acolhimento de ${item.workerName}?`)) {
                            const updated = mediunicaAcolhimento.filter(a => a.id !== item.id);
                            setMediunicaAcolhimento(updated);
                            localStorage.setItem('medi_acolhimento', JSON.stringify(updated));
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Excluir
                      </button>
                    </div>

                    <div className="bg-white border border-gray-150 rounded-xl p-3 text-xs space-y-1 text-left">
                      <p className="text-gray-400 font-extrabold uppercase text-[9px]">Necessidade Observada:</p>
                      <p className="font-semibold text-gray-800 italic">" {item.need} "</p>
                    </div>

                    {item.recommendation && (
                      <div className="p-3.5 bg-fuchsia-50 border border-fuchsia-100/50 rounded-xl text-xs text-fuchsia-950 font-bold leading-relaxed text-left">
                        <p className="text-[10px] text-fuchsia-500 uppercase tracking-wider font-extrabold mb-1">Recomendações da Coordenação:</p>
                        {item.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-lg font-black text-gray-950 leading-none">Acolhimento Fraterno Ativo</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Registrar obreiro que precisa de amparo, prece de harmonização ou repouso temporário.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Trabalhador Atendido</label>
                  <select
                    value={newMediAcolhimentoName}
                    onChange={(e) => setNewMediAcolhimentoName(e.target.value)}
                    className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 font-bold"
                  >
                    <option value="">Selecione o trabalhador...</option>
                    {mediunicaMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Necessidade Clínica/Emocional</label>
                    <select
                      value={newMediAcolhimentoNeed}
                      onChange={(e) => setNewMediAcolhimentoNeed(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                    >
                      <option value="Vulnerabilidade Emocional">Estresse / Ansiedade</option>
                      <option value="Tratamento Físico">Tratamento Clínico</option>
                      <option value="Perda na Família">Luto / Problema Familiar</option>
                      <option value="Sobrecarga por Desobsessão">Fadiga Energética</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status de Alerta</label>
                    <select
                      value={newMediAcolhimentoStatus}
                      onChange={(e) => setNewMediAcolhimentoStatus(e.target.value)}
                      className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800"
                    >
                      <option value="Equilibrado">Equilibrado</option>
                      <option value="Instável">Instável</option>
                      <option value="Fragilizado">Extremamente Fragilizado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Ações de Amparo Recomendadas</label>
                  <textarea
                    value={newMediAcolhimentoRec}
                    onChange={(e) => setNewMediAcolhimentoRec(e.target.value)}
                    placeholder="Indique exaltação de prece, aplicação de fluidos magnéticos especiais de cura ou dispensa do trabalho prático por tempo determinado..."
                    className="w-full mt-1 min-h-[90px] bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!newMediAcolhimentoName) {
                      alert("Por favor, selecione o trabalhador atendido.");
                      return;
                    }
                    const newAc = {
                      id: 'mac_' + Date.now(),
                      workerName: newMediAcolhimentoName,
                      need: newMediAcolhimentoNeed,
                      status: newMediAcolhimentoStatus,
                      recommendation: newMediAcolhimentoRec || 'Harmonização na câmara silenciosa de prece.'
                    };
                    const updated = [...mediunicaAcolhimento, newAc];
                    setMediunicaAcolhimento(updated);
                    localStorage.setItem('medi_acolhimento', JSON.stringify(updated));

                    // Reset form
                    setNewMediAcolhimentoName('');
                    setNewMediAcolhimentoRec('');
                    alert("Acolhimento registrado na coordenação espiritual!");
                  }}
                  className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer block text-center"
                >
                  Confirmar Acolhimento Fraterno da Equipe
                </button>
              </div>
            </div>
          </div>
        )}

        {mediunicaActiveTab === 'seguranca' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm text-left space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-150">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Lock className="text-rose-600 animate-pulse" size={22} />
                  Criptografia Inteira de Dados &amp; Auditoria de Acesso
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Rastreamento sistêmico completo de quem lê, altera ou exporta dados espirituais confidenciais.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm("Deseja zerar os registros de auditoria mediúnica? Esta ação gerará um log eterno de redefinição.")) {
                      const newLog = {
                        id: 'ml_reset',
                        timestamp: new Date().toISOString(),
                        user: currentUser?.email || 'carlostecal35@gmail.com',
                        action: 'Limpeza de Auditoria',
                        details: 'O usuário administrador redefiniu os logs históricos de visualização de prontuários sob o cap. XXVI de O Livro dos Médiuns.'
                      };
                      setMediunicaLogs([newLog]);
                      localStorage.setItem('medi_logs', JSON.stringify([newLog]));
                    }
                  }}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors border border-red-100 cursor-pointer"
                >
                  Zerar Logs de Visitação
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-950 text-white rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-[10px] tracking-widest text-[#a8a29e] uppercase font-black font-mono">Chave Criptográfica AES-256</span>
                    <span className="text-[8px] font-black text-rose-500 font-mono">SEGURANÇA HIERÁRQUICA ATIVA</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 italic mt-3 text-left">
                    Em obediência ao sigilo moral recomendado na Doutrina Espírita, observações detalhadas de desobsessões estão protegidas por dispersores criptográficos. Apenas perfis associados à alta coordenação podem forçar desfragmentação AES.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-850 flex gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold flex items-center gap-1">
                    🟢 Algoritmo Ativo: PBKDF2 HMAC-SHA256
                  </span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-gray-150 rounded-3xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-[10px] tracking-widest text-gray-400 uppercase font-black">Controle de Permissões</span>
                    <span className="text-[8px] font-black bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">LGPD COMPLIANCE</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-550 italic mt-3 text-left">
                    O acesso a prontuários e diários fraternos do Setor Mediúnico registra permanentemente os identificadores digitais e IPs de tráfego de rede para garantir conformidade legal com a legislação civil e ética interna da federativa.
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <span className="text-[10px] font-mono text-indigo-700 font-extrabold">
                    🔑 Seu Cargo de Acesso: {currentUser?.role || 'Apoiador'} (Autorizado)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Trilha de Auditoria em Tempo Real de Dados Confidenciais</h4>
              <div className="overflow-x-auto rounded-[24px] border border-gray-150">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-950 text-white text-[9px] uppercase tracking-widest font-black">
                      <th className="p-3.5 pl-5">Timestamp</th>
                      <th className="p-3.5">Administrador / Usuário</th>
                      <th className="p-3.5">Ações Registradas</th>
                      <th className="p-3.5 pr-5">Detalhes da Execução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px] font-semibold text-gray-700">
                    {mediunicaLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/75">
                        <td className="p-3.5 pl-5 font-mono text-gray-400 text-[10px]">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 text-gray-900 font-extrabold">{log.user}</td>
                        <td className="p-3.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider",
                            log.action?.includes('Cripto') || log.action?.includes('Chave') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            log.action?.includes('Limpeza') ? 'bg-red-50 text-red-700 border border-red-100' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-gray-500 font-bold max-w-sm truncate whitespace-nowrap" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderArteDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 font-sans">
        {/* Navigation Tabs for Art Sub-modules */}
        <div className="flex border-b border-gray-100 pb-2 gap-2 overflow-x-auto scrollbar-none w-full whitespace-nowrap">
          {[
            { id: 'grupos', label: 'Grupos Artísticos', icon: Palette, color: 'text-pink-600 bg-pink-50' },
            { id: 'musica', label: 'Gestão Musical & Repertório', icon: Music, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'teatro', label: 'Teatro & Roteiros Espíritas', icon: FileText, color: 'text-sky-600 bg-sky-50' },
            { id: 'ensaios', label: 'Cronograma de Ensaios', icon: Clock, color: 'text-purple-600 bg-purple-50' },
            { id: 'eventos', label: 'Mostras e Festivais', icon: Calendar, color: 'text-amber-600 bg-amber-50' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = arteActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setArteActiveTab(item.id as any)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer border flex-shrink-0",
                  isActive 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10 block duration-300"
                    : "bg-white hover:bg-gray-50 text-gray-500 border-gray-100 hover:text-gray-900 duration-300"
                )}
              >
                <div className={cn("p-1 rounded-lg", isActive ? "bg-white/20 text-white" : item.color)}>
                  <Icon size={14} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel based on active tab */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List Section */}
          <div className="lg:col-span-8 space-y-6 text-left">
            {arteActiveTab === 'grupos' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Palette size={22} className="text-pink-500" />
                    Corporações e Coletivos Artísticos Espíritas
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Integração fraterna estimulando a arte edificante sob a ótica da Doutrina Consoladora
                  </p>
                </div>

                <div className="space-y-4">
                  {arteGroups.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhum grupo artístico cadastrado.</div>
                  ) : (
                    arteGroups.map((group) => (
                      <div key={group.id} className="p-3.5 sm:p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-200 transition-all">
                        <div className="space-y-1 w-full flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-pink-50 text-pink-650 border border-pink-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider break-all">
                            {group.modality}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight pt-1 break-words">{group.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Coordenador: <strong className="text-gray-650">{group.coordinator}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Agendamento: <strong className="text-gray-650">{group.schedule}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingArteGroupId(group.id);
                              setNewArteGroupName(group.name);
                              setNewArteGroupModality(group.modality);
                              setNewArteGroupLeader(group.coordinator);
                              setNewArteGroupRehearsalDay(group.schedule);
                            }}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Editar Coletivo"
                          >
                            <Pencil size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArteGroup(group.id, group.name)}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Remover Grupo"
                          >
                            <Trash2 size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {arteActiveTab === 'musica' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Music size={22} className="text-emerald-500" />
                    Biblioteca & Acervo de Música Espírita
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Gestão de repertórios autorais e clássicos doutrinários para coral, preces ou apresentações
                  </p>
                </div>

                <div className="space-y-4">
                  {arteMusicas.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhuma música cadastrada no repertório.</div>
                  ) : (
                    arteMusicas.map((song) => (
                      <div key={song.id} className="p-3.5 sm:p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-all">
                        <div className="space-y-1 w-full flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider break-all">
                            Tom: {song.key} • Categoria: {song.category}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight pt-1 break-words">{song.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Autor: <strong className="text-gray-650">{song.author}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Tema: <strong className="text-gray-650">{song.theme}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Tempo: <strong className="text-gray-650">{song.duration}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingArteSongId(song.id);
                              setNewSongTitle(song.name);
                              setNewSongAuthor(song.author);
                              setNewSongTheme(song.theme);
                              setNewSongKey(song.key);
                            }}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Editar Música"
                          >
                            <Pencil size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArteSong(song.id, song.name)}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Remover Música"
                          >
                            <Trash2 size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {arteActiveTab === 'teatro' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <FileText size={22} className="text-sky-500" />
                    Peças, Roteiros e Literatura Teatral
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Arrecadação e controle de scripts com o fito de divulgar a filosofia evangélica de forma sensível
                  </p>
                </div>

                <div className="space-y-4">
                  {artePecas.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhum script registrado.</div>
                  ) : (
                    artePecas.map((piece) => (
                      <div key={piece.id} className="p-3.5 sm:p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-all font-sans">
                        <div className="space-y-1 w-full flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-650 border border-sky-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider break-all">
                            Tempo: {piece.duration} • Autor: {piece.author}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight pt-1 break-words">{piece.name}</h4>
                          <span className="text-[11px] text-gray-500 italic font-semibold block break-words">Tema: {piece.theme}</span>
                          <p className="text-xs text-gray-400 max-w-lg mt-1 break-words"><strong>Mensagem Central:</strong> {piece.message}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingArtePieceId(piece.id);
                              setNewPieceTitle(piece.name);
                              setNewPieceAuthor(piece.author);
                              setNewPieceTheme(piece.theme);
                            }}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Editar Roteiro"
                          >
                            <Pencil size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArtePiece(piece.id, piece.name)}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Remover Script"
                          >
                            <Trash2 size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {arteActiveTab === 'ensaios' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Clock size={22} className="text-purple-500" />
                    Cronograma de Ensaios & Alinhamento Harmônico
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Prevenção de sobreposições de sala e acompanhamento da harmonia vibratória dos grupos
                  </p>
                </div>

                <div className="space-y-4">
                  {arteEnsaios.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Sem ensaios programados.</div>
                  ) : (
                    arteEnsaios.map((ensaio) => {
                      const associatedGroup = arteGroups.find(g => g.id === ensaio.groupId);
                      return (
                        <div key={ensaio.id} className="p-3.5 sm:p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-all">
                          <div className="space-y-1 w-full flex-1 min-w-0">
                            <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-650 border border-purple-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider break-words">
                              Grupo: {associatedGroup ? associatedGroup.name : 'Outro'}
                            </span>
                            <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight pt-1 break-words">Atividade: {ensaio.activity}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              <span>Horário: <strong className="text-gray-650">{ensaio.date} às {ensaio.time}</strong></span>
                              <span className="hidden sm:inline text-gray-300">•</span>
                              <span>Local: <strong className="text-gray-650">{ensaio.local}</strong></span>
                              <span className="hidden sm:inline text-gray-300">•</span>
                              <span>Frequência: <strong className="text-gray-650">{ensaio.presentQty} de {ensaio.totalQty}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => {
                                setEditingArteEnsaioId(ensaio.id);
                                setNewEnsaioGroupId(ensaio.groupId);
                                setNewEnsaioDate(ensaio.date);
                                setNewEnsaioTime(ensaio.time);
                                setNewEnsaioLocal(ensaio.local);
                                setNewEnsaioActivity(ensaio.activity);
                              }}
                              className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                              title="Editar Ensaio"
                            >
                              <Pencil size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteArteEnsaio(ensaio.id, ensaio.activity)}
                              className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                              title="Remover Ensaio"
                            >
                              <Trash2 size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Excluir</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {arteActiveTab === 'eventos' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <Calendar size={22} className="text-amber-500" />
                    Programação de Apresentações, Saraus e Festivais
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Eventos externos e mostras organizadas na instituição para edificação da comunidade
                  </p>
                </div>

                <div className="space-y-4">
                  {arteEventos.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic">Sem eventos planejados.</div>
                  ) : (
                    arteEventos.map((ev) => (
                      <div key={ev.id} className="p-3.5 sm:p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-all font-sans">
                        <div className="space-y-1 w-full flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-650 border border-amber-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider break-all">
                            Público: {ev.estimate}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-gray-950 leading-tight pt-1 break-words">{ev.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Data: <strong className="text-gray-650">{ev.date}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Local: <strong className="text-gray-650">{ev.local}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Tema: <strong className="text-gray-650">{ev.theme}</strong></span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span>Responsável: <strong className="text-gray-650">{ev.coordinator}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingArteEventoId(ev.id);
                              setNewEventoName(ev.name);
                              setNewEventoTheme(ev.theme);
                              setNewEventoDate(ev.date);
                              setNewEventoLocal(ev.local);
                              setNewEventoCoordinator(ev.coordinator);
                              setNewEventoEstimate(ev.estimate);
                            }}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Editar Evento"
                          >
                            <Pencil size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArteEvento(ev.id, ev.name)}
                            className="p-1.5 px-2.5 sm:p-2 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5"
                            title="Remover Evento"
                          >
                            <Trash2 size={12} /> <span className="sm:hidden font-bold uppercase tracking-wider text-[10px]">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Form Input area */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
              <div className="border-b border-gray-50 pb-5 mb-6">
                <h3 className="text-lg font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                  {(editingArteGroupId || editingArteSongId || editingArtePieceId || editingArteEnsaioId || editingArteEventoId) ? 'Editar Entrada' : 'Cadastrar Entrada'}
                </h3>
                <p className="text-xs text-gray-400">
                  {(editingArteGroupId || editingArteSongId || editingArtePieceId || editingArteEnsaioId || editingArteEventoId) ? 'Modifique os dados nos campos abaixo para atualizar' : 'Preencha o formulário para adicionar ao módulo ativo'}
                </p>
              </div>

              {arteActiveTab === 'grupos' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome do Grupo</label>
                    <input
                      type="text"
                      value={newArteGroupName}
                      onChange={(e) => setNewArteGroupName(e.target.value)}
                      placeholder="Ex: Vozes do Amor"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Modalidade</label>
                    <select
                      value={newArteGroupModality}
                      onChange={(e) => setNewArteGroupModality(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="MÚSICA">Música / Coral</option>
                      <option value="TEATRO">Teatro</option>
                      <option value="DANÇA">Dança / Coreografia</option>
                      <option value="POESIA">Poesia / Declamação</option>
                      <option value="AUDIOVISUAL">Audiovisual</option>
                      <option value="OUTROS">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Coordenador do Grupo</label>
                    <input
                      type="text"
                      value={newArteGroupLeader}
                      onChange={(e) => setNewArteGroupLeader(e.target.value)}
                      placeholder="Ex: Regina Goulart"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Dias e Horários de Ensaio</label>
                    <input
                      type="text"
                      value={newArteGroupRehearsalDay}
                      onChange={(e) => setNewArteGroupRehearsalDay(e.target.value)}
                      placeholder="Ex: Sábados às 14h00"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newArteGroupName.trim()) {
                        alert('Por favor, informe o nome do grupo artístico!');
                        return;
                      }
                      handleAddArteGroup(newArteGroupName, newArteGroupModality, newArteGroupLeader, newArteGroupRehearsalDay);
                      setNewArteGroupName('');
                      setNewArteGroupLeader('');
                      setNewArteGroupRehearsalDay('Sábados');
                    }}
                    className="w-full mt-3 h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingArteGroupId ? 'Salvar Alterações' : 'Adicionar Coletivo'}
                  </button>
                  {editingArteGroupId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArteGroupId(null);
                        setNewArteGroupName('');
                        setNewArteGroupLeader('');
                        setNewArteGroupRehearsalDay('Sábados');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {arteActiveTab === 'musica' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título da Música</label>
                    <input
                      type="text"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      placeholder="Ex: Luz da Alma"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Compositor / Autor</label>
                    <input
                      type="text"
                      value={newSongAuthor}
                      onChange={(e) => setNewSongAuthor(e.target.value)}
                      placeholder="Ex: Leopoldo Machado"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tema Espiritual / Doutrinário</label>
                    <input
                      type="text"
                      value={newSongTheme}
                      onChange={(e) => setNewSongTheme(e.target.value)}
                      placeholder="Ex: Reencarnação e Amor"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tom / Campo Harmônico</label>
                    <input
                      type="text"
                      value={newSongKey}
                      onChange={(e) => setNewSongKey(e.target.value)}
                      placeholder="Ex: G Major, C Minor"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSongTitle.trim()) {
                        alert('Informe o título da composição para o acervo!');
                        return;
                      }
                      handleAddArteSong(newSongTitle, newSongAuthor, newSongTheme, 'Coral', newSongKey, '3:30');
                      setNewSongTitle('');
                      setNewSongAuthor('');
                      setNewSongTheme('');
                      setNewSongKey('C');
                    }}
                    className="w-full mt-3 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingArteSongId ? 'Salvar Alterações' : 'Adicionar Música'}
                  </button>
                  {editingArteSongId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArteSongId(null);
                        setNewSongTitle('');
                        setNewSongAuthor('');
                        setNewSongTheme('');
                        setNewSongKey('C');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-705 border border-gray-150 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {arteActiveTab === 'teatro' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título da Peça ou Script</label>
                    <input
                      type="text"
                      value={newPieceTitle}
                      onChange={(e) => setNewPieceTitle(e.target.value)}
                      placeholder="Ex: O Passe da Fraternidade"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Autor / Adaptador</label>
                    <input
                      type="text"
                      value={newPieceAuthor}
                      onChange={(e) => setNewPieceAuthor(e.target.value)}
                      placeholder="Ex: Juliano Goulart"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Eixo Temático / Doutrinário</label>
                    <input
                      type="text"
                      value={newPieceTheme}
                      onChange={(e) => setNewPieceTheme(e.target.value)}
                      placeholder="Ex: Despertar Moral, Mediunidade"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPieceTitle.trim()) {
                        alert('Informe o título do script!');
                        return;
                      }
                      handleAddArtePiece(newPieceTitle, newPieceTheme, newPieceAuthor, '30 min', 'Moral edificante e ensinamentos celestes.');
                      setNewPieceTitle('');
                      setNewPieceAuthor('');
                      setNewPieceTheme('');
                    }}
                    className="w-full mt-3 h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingArtePieceId ? 'Salvar Alterações' : 'Adicionar Roteiro Espírita'}
                  </button>
                  {editingArtePieceId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArtePieceId(null);
                        setNewPieceTitle('');
                        setNewPieceAuthor('');
                        setNewPieceTheme('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-705 border border-gray-150 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {arteActiveTab === 'ensaios' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Grupo Responsável</label>
                    <select
                      value={newEnsaioGroupId}
                      onChange={(e) => setNewEnsaioGroupId(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="">-- Selecione o Grupo --</option>
                      {arteGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data do Ensaio</label>
                    <input
                      type="date"
                      value={newEnsaioDate}
                      onChange={(e) => setNewEnsaioDate(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Horário</label>
                    <input
                      type="text"
                      value={newEnsaioTime}
                      onChange={(e) => setNewEnsaioTime(e.target.value)}
                      placeholder="Ex: 14h00"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Sala / Instalação</label>
                    <input
                      type="text"
                      value={newEnsaioLocal}
                      onChange={(e) => setNewEnsaioLocal(e.target.value)}
                      placeholder="Ex: Salão de Estudos A, Biblioteca"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Atividade / Foco Pedagógico</label>
                    <input
                      type="text"
                      value={newEnsaioActivity}
                      onChange={(e) => setNewEnsaioActivity(e.target.value)}
                      placeholder="Ex: Vozes do Coral, Afinação"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newEnsaioGroupId) {
                        alert('Selecione primeiro qual o grupo responsável pelo ensaio!');
                        return;
                      }
                      handleAddArteEnsaio(newEnsaioGroupId, newEnsaioDate, newEnsaioTime, newEnsaioLocal, newEnsaioActivity);
                      setNewEnsaioGroupId('');
                      setNewEnsaioDate('');
                      setNewEnsaioTime('');
                      setNewEnsaioLocal('');
                      setNewEnsaioActivity('');
                    }}
                    className="w-full mt-3 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingArteEnsaioId ? 'Salvar Alterações' : 'Marcar Ensaio Geral'}
                  </button>
                  {editingArteEnsaioId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArteEnsaioId(null);
                        setNewEnsaioGroupId('');
                        setNewEnsaioDate('');
                        setNewEnsaioTime('');
                        setNewEnsaioLocal('');
                        setNewEnsaioActivity('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-705 border border-gray-150 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {arteActiveTab === 'eventos' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome da Mostra / Sarau</label>
                    <input
                      type="text"
                      value={newEventoName}
                      onChange={(e) => setNewEventoName(e.target.value)}
                      placeholder="Ex: VI Sarau Fraterno do Mirante"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Tema Principal / Mensagem</label>
                    <input
                      type="text"
                      value={newEventoTheme}
                      onChange={(e) => setNewEventoTheme(e.target.value)}
                      placeholder="Ex: Evangelização Pela Arte"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data do Evento</label>
                    <input
                      type="date"
                      value={newEventoDate}
                      onChange={(e) => setNewEventoDate(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Local / Estabelecimento</label>
                    <input
                      type="text"
                      value={newEventoLocal}
                      onChange={(e) => setNewEventoLocal(e.target.value)}
                      placeholder="Ex: Palco Comunitário, Auditório"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newEventoName.trim()) {
                        alert('Informe o nome do evento/sarau cultural!');
                        return;
                      }
                      handleAddArteEvento(newEventoName, newEventoTheme, newEventoDate, newEventoLocal, currentUser?.name || 'Coordenador de Comunicação', '100 pessoas');
                      setNewEventoName('');
                      setNewEventoTheme('');
                      setNewEventoDate('');
                      setNewEventoLocal('');
                    }}
                    className="w-full mt-3 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingArteEventoId ? 'Salvar Alterações' : 'Agendar Apresentação'}
                  </button>
                  {editingArteEventoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArteEventoId(null);
                        setNewEventoName('');
                        setNewEventoTheme('');
                        setNewEventoDate('');
                        setNewEventoLocal('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-705 border border-gray-150 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComunicacaoDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left">
        {/* Tab Selection */}
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 pb-2 border-b border-gray-100 scrollbar-none w-full">
          <button
            onClick={() => {
              setComActiveTab('comunicados');
              // Clear editing states across tabs to avoid UI confusion
              setEditingComunicadoId(null);
              setEditingSocialPostId(null);
              setEditingMidiaId(null);
              setEditingEquipeId(null);
            }}
            className={cn(
              "p-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              comActiveTab === 'comunicados'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-indigo-600 hover:border-gray-200"
            )}
          >
            <FileText size={14} />
            <span>Comunicados & Avisos</span>
          </button>

          <button
            onClick={() => {
              setComActiveTab('redes');
              setEditingComunicadoId(null);
              setEditingSocialPostId(null);
              setEditingMidiaId(null);
              setEditingEquipeId(null);
            }}
            className={cn(
              "p-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              comActiveTab === 'redes'
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-amber-650 hover:border-gray-200"
            )}
          >
            <Zap size={14} />
            <span>Redes Sociais</span>
          </button>

          <button
            onClick={() => {
              setComActiveTab('midia');
              setEditingComunicadoId(null);
              setEditingSocialPostId(null);
              setEditingMidiaId(null);
              setEditingEquipeId(null);
            }}
            className={cn(
              "p-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              comActiveTab === 'midia'
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-pink-600 hover:border-gray-200"
            )}
          >
            <Palette size={14} />
            <span>Criativos & Audiovisual</span>
          </button>

          <button
            onClick={() => {
              setComActiveTab('equipe');
              setEditingComunicadoId(null);
              setEditingSocialPostId(null);
              setEditingMidiaId(null);
              setEditingEquipeId(null);
              setEditingCampanhaId(null);
            }}
            className={cn(
              "p-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              comActiveTab === 'equipe'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-emerald-650 hover:border-gray-200"
            )}
          >
            <Users size={14} />
            <span>Equipe de Mídia</span>
          </button>

          <button
            onClick={() => {
              setComActiveTab('campanhas');
              setEditingComunicadoId(null);
              setEditingSocialPostId(null);
              setEditingMidiaId(null);
              setEditingEquipeId(null);
              setEditingCampanhaId(null);
            }}
            className={cn(
              "p-3 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              comActiveTab === 'campanhas'
                ? "bg-rose-550 text-white shadow-lg shadow-rose-500/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-rose-650 hover:border-gray-200"
            )}
          >
            <Activity size={14} />
            <span>Campanhas & Coberturas</span>
          </button>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: List Modules */}
          <div className="lg:col-span-8 space-y-6">
            
            {comActiveTab === 'comunicados' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                    <FileText size={22} className="text-indigo-500" />
                    Gestão de Comunicados e Notícias Diárias
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Notas oficiais, murais informativos, circulares doutrinárias e avisos aos trabalhadores e frequentadores.
                  </p>
                </div>

                <div className="space-y-4">
                  {comunicados.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhum comunicado cadastrado na casa espírita.</div>
                  ) : (
                    comunicados.map((item) => (
                      <div key={item.id} className="p-4 sm:p-6 bg-gray-50 border border-gray-150 rounded-xl flex flex-col justify-between gap-4 hover:border-gray-250 transition-all">
                        <div className="space-y-2 w-full flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              {item.category}
                            </span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              Alvo: {item.target}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-bold text-[8.5px] uppercase tracking-wider",
                              item.status === 'publicado' 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : "bg-gray-150 text-gray-500"
                            )}>
                              {item.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-base text-gray-950 leading-tight">{item.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">{item.content}</p>
                          
                          {item.spiritObjective && (
                            <div className="p-2.5 bg-indigo-50/40 rounded-lg text-xs text-indigo-900 border border-indigo-100/30 font-sans">
                              <span className="font-bold text-[9px] text-indigo-700 uppercase tracking-widest block mb-0.5">Objetivo Doutrinário:</span>
                              {item.spiritObjective}
                            </div>
                          )}

                          {item.approvedBy && (
                            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-sans">
                              <span>✓ Revisor Responsável:</span>
                              <span className="underline">{item.approvedBy}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                            <span>Por: <strong className="text-gray-650">{item.author}</strong></span>
                            <span>•</span>
                            <span>Data: <strong className="text-gray-650">{item.date}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 justify-end shrink-0">
                          {currentUser && !item.approvedBy && (
                            <button
                              onClick={() => {
                                const updated = comunicados.map(c => {
                                  if (c.id === item.id) {
                                    return { ...c, approvedBy: currentUser.name || 'Revisor Doutrinário', status: 'publicado' };
                                  }
                                  return c;
                                });
                                setComunicados(updated);
                                localStorage.setItem('com_comunicados', JSON.stringify(updated));
                              }}
                              className="p-1.5 px-3 bg-white border border-gray-150 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                              title="Aprovar Comunicação"
                            >
                              <CheckCircle2 size={12} /> <span>Aprovar</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingComunicadoId(item.id);
                              setNewComTitle(item.title);
                              setNewComCategory(item.category);
                              setNewComContent(item.content);
                              setNewComAuthor(item.author);
                              setNewComTarget(item.target);
                              setNewComStatus(item.status);
                              setNewComSpiritObjective(item.spiritObjective || '');
                              setNewComApprovedBy(item.approvedBy || '');
                            }}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Editar Comunicado"
                          >
                            <Pencil size={12} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteComunicado(item.id, item.title)}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Remover Comunicado"
                          >
                            <Trash2 size={12} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {comActiveTab === 'redes' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-950 italic tracking-tight flex items-center gap-2">
                    <Zap size={22} className="text-amber-500 animate-pulse" />
                    Calendário Editorial & Redes Sociais
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Planejamento de postagens evangélicas diárias, estudos kardequianos em vídeo, podcasts e campanhas fraternas.
                  </p>
                </div>

                <div className="space-y-4">
                  {socialPosts.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhuma postagem planejada no calendário.</div>
                  ) : (
                    socialPosts.map((post) => (
                      <div key={post.id} className="p-4 sm:p-6 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between gap-4 hover:border-gray-250 transition-all">
                        <div className="space-y-2 w-full flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-bold text-[8.5px] uppercase tracking-wider border",
                              post.platform === 'Instagram' ? "bg-pink-50 text-pink-650 border-pink-100" :
                              post.platform === 'YouTube' ? "bg-red-50 text-red-650 border-red-100" :
                              post.platform === 'WhatsApp' ? "bg-emerald-50 text-emerald-650 border-emerald-100" :
                              "bg-indigo-50 text-indigo-650 border-indigo-100"
                            )}>
                              {post.platform}
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-605 border border-stone-200 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              Status: {post.status}
                            </span>
                            {post.hashtags && (
                              <span className="text-[10px] font-mono text-indigo-500 font-bold">{post.hashtags}</span>
                            )}
                          </div>
                          
                          <h4 className="font-extrabold text-base text-gray-950 leading-tight">{post.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans italic">"{post.text}"</p>
                          
                          {post.spiritObjective && (
                            <div className="p-2.5 bg-amber-50/50 rounded-lg text-xs text-amber-900 border border-amber-100/30 font-sans">
                              <span className="font-black text-[9px] text-amber-700 uppercase tracking-widest block mb-0.5">Objetivo Doutrinário:</span>
                              {post.spiritObjective}
                            </div>
                          )}

                          {post.approvedBy ? (
                            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-sans">
                              <span>✓ Aprovado Doutrinariamente por:</span>
                              <span className="underline">{post.approvedBy}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 font-sans">
                              <span>⚠ Aguardando Revisão Editorial</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                            <span>Agendado para: <strong className="text-gray-650">{post.date}</strong></span>
                            <span>•</span>
                            <span>Responsável: <strong className="text-gray-650">{post.responsible}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 justify-end shrink-0">
                          {!post.approvedBy && (
                            <button
                              onClick={() => {
                                const updated = socialPosts.map(p => {
                                  if (p.id === post.id) {
                                    return { ...p, approvedBy: currentUser?.name || 'Gabriel Chaves', status: 'Agendado' };
                                  }
                                  return p;
                                });
                                setSocialPosts(updated);
                                localStorage.setItem('com_social_posts', JSON.stringify(updated));
                              }}
                              className="p-1.5 px-3 bg-white border border-gray-150 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                              title="Revisar e Aprovar Conteúdo"
                            >
                              <CheckCircle2 size={12} /> <span>Aprovar</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingSocialPostId(post.id);
                              setNewPostTitle(post.title);
                              setNewPostText(post.text);
                              setNewPostPlatform(post.platform);
                              setNewPostDate(post.date);
                              setNewPostHashtags(post.hashtags);
                              setNewPostStatus(post.status);
                              setNewPostResponsible(post.responsible);
                              setNewPostSpiritObjective(post.spiritObjective || '');
                              setNewPostApprovedBy(post.approvedBy || '');
                            }}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Editar Postagem"
                          >
                            <Pencil size={12} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSocialPost(post.id, post.title)}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Remover Postagem"
                          >
                            <Trash2 size={12} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Simulated Social Media Preview Container */}
                {socialPosts.length > 0 && (
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Eye size={16} className="text-amber-500" />
                      Visualizador de Publicação de Rede Social (Tempo Real)
                    </h4>
                    <div className="max-w-md mx-auto bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm font-sans">
                      {/* Header */}
                      <div className="p-3 bg-white border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-black tracking-tight shrink-0 shadow-sm">
                          ML
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs text-gray-950 block leading-tight">Mirante de Luz</span>
                          <span className="text-[9px] text-gray-400 font-medium">Bauru, SP • Divulgação Espírita</span>
                        </div>
                      </div>
                      {/* Visual content area */}
                      <div className="aspect-square bg-gradient-to-tr from-indigo-500 via-purple-600 to-amber-500 p-6 flex flex-col justify-between text-white relative">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-[9px] font-bold uppercase tracking-widest self-start">
                          ☆ DIÁLOGO DO BEM
                        </div>
                        <div className="my-auto text-center px-4">
                          <p className="font-extrabold text-base md:text-lg tracking-tight leading-snug break-words">
                            {newPostText || socialPosts[0]?.text || "Selecione ou rascunhe um post para visualizar..."}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] bg-black/25 backdrop-blur-sm p-2 rounded-xl border border-white/10 font-mono">
                          <span className="truncate max-w-[200px]">{newPostTitle || socialPosts[0]?.title || "Título do Post"}</span>
                          <span className="font-bold shrink-0">{newPostPlatform || socialPosts[0]?.platform || "Instagram"}</span>
                        </div>
                      </div>
                      {/* Interactivity details */}
                      <div className="p-3 bg-white space-y-1.5 text-xs text-left">
                        <div className="flex items-center gap-3 text-gray-700 py-1 font-sans">
                          <span>♥ <strong>54 curtidas</strong></span>
                          <span>💬 <strong>8 comentários</strong></span>
                        </div>
                        <p className="text-gray-700 leading-snug font-sans">
                          <strong className="text-gray-900 font-extrabold mr-1">mirantedeluz</strong>
                          {newPostText || socialPosts[0]?.text || "A caridade é o orvalho do amor..."}
                        </p>
                        <p className="text-indigo-600 font-bold font-mono text-[11px] uppercase tracking-wider block">
                          {newPostHashtags || socialPosts[0]?.hashtags || "#allankardec #espirita #caridade"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pre-filled comfort quotes list */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-500" />
                    Biblioteca Doutrinária: Mensagens Rápidas
                  </h4>
                  <p className="text-xs text-gray-400 mb-3 font-sans">
                    Arraste ou clique em uma das pílulas consoladoras para usá-la como base para a legenda da sua postagem:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { author: 'Emmanuel', text: 'A caridade é o amor em movimento. Lembremo-nos de auxiliar com alegria e sem preconceitos na jornada.' },
                      { author: 'Allan Kardec', text: 'Fora da caridade não há salvação.' },
                      { author: 'André Luiz', text: 'O bem que praticares, em qualquer lugar, será teu advogado em toda parte.' },
                      { author: 'Joanna de Ângelis', text: 'A prece é o orvalho do amor divino que restabelece as forças da nossa alma.' }
                    ].map((quote, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNewPostTitle(`Mensagem de ${quote.author}`);
                          setNewPostText(quote.text);
                          setNewPostHashtags(`#${quote.author.toLowerCase().replace(/\s+/g, '')} #kardec #amor #espiritismo`);
                          setNewPostSpiritObjective(`Divulgar pensamentos consoladores e fraternos de ${quote.author}.`);
                        }}
                        className="p-3 bg-gray-50 hover:bg-indigo-50/50 border border-gray-150 hover:border-indigo-200 rounded-xl transition-all text-left text-xs font-semibold select-none flex flex-col justify-between gap-1.5 cursor-pointer"
                      >
                        <span className="text-gray-600 leading-snug italic font-sans">"{quote.text}"</span>
                        <span className="text-[10px] font-black text-indigo-650 self-end uppercase font-sans">— {quote.author}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {comActiveTab === 'midia' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-905 italic tracking-tight flex items-center gap-2">
                    <Palette size={22} className="text-pink-500" />
                    Biblioteca & Produção de Criativos Doutrinários
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Biblioteca de recursos de artes, banners, fundos de projeção, vídeos de palestras e podcasts para divulgação.
                  </p>
                </div>

                <div className="space-y-4">
                  {midias.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhum criativo ou arquivo multimídia registrado.</div>
                  ) : (
                    midias.map((mid) => (
                      <div key={mid.id} className="p-4 sm:p-6 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between gap-4 hover:border-gray-250 transition-all">
                        <div className="space-y-2 w-full flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-pink-50 text-pink-650 border border-pink-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              {mid.category}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-bold text-[8.5px] uppercase tracking-wider",
                              mid.status === 'Aprovado' ? "bg-emerald-50 text-emerald-650 border border-emerald-100" : "bg-cream-100 text-amber-700"
                            )}>
                              {mid.status}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-base text-gray-950 leading-tight">{mid.name}</h4>
                          
                          {/* Rich spiritual verification rule container */}
                          {mid.spiritObjective && (
                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-xs text-indigo-900 font-medium font-sans flex items-start gap-2.5">
                              <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-black text-[10px] text-indigo-700 block uppercase tracking-wider">Objetivo Evangelizador / Doutrinário:</span>
                                {mid.spiritObjective}
                              </div>
                            </div>
                          )}
                          
                          {mid.url && (
                            <div className="text-xs text-indigo-650 font-bold font-sans break-all select-all flex items-center gap-1">
                              <Paperclip size={12} />
                              <span>Link do Material:</span>
                              <a href={mid.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-800 ml-1">{mid.url}</a>
                            </div>
                          )}

                          <div className="flex items-center gap-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                            <span>Criado por: <strong className="text-gray-650">{mid.designer}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 justify-end shrink-0">
                          <button
                            onClick={() => {
                              setEditingMidiaId(mid.id);
                              setNewMidiaName(mid.name);
                              setNewMidiaCategory(mid.category);
                              setNewMidiaDesigner(mid.designer);
                              setNewMidiaUrl(mid.url);
                              setNewMidiaStatus(mid.status);
                              setNewMidiaSpiritObjective(mid.spiritObjective);
                            }}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Editar Criativo"
                          >
                            <Pencil size={12} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMidia(mid.id, mid.name)}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Remover Criativo"
                          >
                            <Trash2 size={12} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {comActiveTab === 'equipe' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-gray-905 italic tracking-tight flex items-center gap-2">
                    <Users size={22} className="text-emerald-500" />
                    Voluntários da Equipe de Comunicação Espírita
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Cadastro de tarefas, voluntários, fotógrafos doutrinários, redatores fraternos e revisores autorizados.
                  </p>
                </div>

                <div className="space-y-4">
                  {equipeMembros.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhum voluntário cadastrado na comunicação.</div>
                  ) : (
                    equipeMembros.map((mb) => (
                      <div key={mb.id} className="p-4 sm:p-6 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-gray-250 transition-all text-left">
                        <div className="space-y-1.5 w-full flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              {mb.role}
                            </span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              Disponibilidade: {mb.availability}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-gray-800 text-sm">{mb.name}</h4>
                          <span className="text-[11px] text-gray-400 font-sans block">
                            <strong className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Equipamentos:</strong> {mb.equipments}
                          </span>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              setEditingEquipeId(mb.id);
                              setNewMembroName(mb.name);
                              setNewMembroRole(mb.role);
                              setNewMembroAvailability(mb.availability);
                              setNewMembroEquipments(mb.equipments);
                            }}
                            className="flex-1 sm:flex-initial p-1.5 px-3 bg-white border border-gray-150 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 font-bold"
                          >
                            <Pencil size={12} /> <span className="sr-only sm:not-sr-only">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEquipeMembro(mb.id, mb.name)}
                            className="flex-1 sm:flex-initial p-1.5 px-3 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 font-bold"
                            title="Remover Voluntário"
                          >
                            <Trash2 size={12} /> <span className="sr-only sm:not-sr-only">Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {comActiveTab === 'campanhas' && (
              <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
                <div className="border-b border-gray-50 pb-5 mb-6">
                  <h3 className="text-xl font-black text-rose-600 italic tracking-tight flex items-center gap-2">
                    <Activity size={22} className="text-rose-500 animate-pulse" />
                    Campanhas & Coberturas Fraternas
                  </h3>
                  <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                    Planejamento e cobertura fotográfica/audiovisual de campanhas assistenciais, feiras do livro e eventos doutrinários de rua.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  {campanhas.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic font-sans text-xs">Nenhuma campanha cadastrada.</div>
                  ) : (
                    campanhas.map((cam) => (
                      <div key={cam.id} className="p-4 sm:p-6 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col justify-between gap-4 hover:border-gray-250 transition-all">
                        <div className="space-y-2 w-full flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-bold text-[8.5px] uppercase tracking-wider border",
                              cam.status === 'Concluída' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              cam.status === 'Em Execução' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                              "bg-gray-100 text-gray-600 border-gray-200"
                            )}>
                              {cam.status}
                            </span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 rounded-md font-bold text-[8.5px] uppercase tracking-wider">
                              Alvo: {cam.target}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-base text-gray-950 leading-tight">{cam.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans font-medium"><strong className="text-gray-700 text-[10px] uppercase block tracking-wide">Objetivo da Campanha:</strong> {cam.objective}</p>
                          
                          {cam.result && (
                            <div className="p-2.5 bg-rose-50/40 rounded-lg text-xs text-rose-950 border border-rose-100/30 font-sans leading-relaxed">
                              <span className="font-bold text-[9px] text-rose-700 uppercase tracking-widest block mb-0.5">Resultados / Prestação de Contas:</span>
                              {cam.result}
                            </div>
                          )}

                          {cam.media && (
                            <div className="text-xs text-indigo-650 font-bold font-sans break-all select-all flex items-center gap-1">
                              <Paperclip size={12} className="text-rose-500" />
                              <span>Pasta de Cobertura (Fotos/Vídeos):</span>
                              <a href={cam.media} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-800 ml-1 truncate">{cam.media}</a>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                            <span>Data do Evento: <strong className="text-gray-650">{cam.date}</strong></span>
                            <span>•</span>
                            <span>Coordenador: <strong className="text-gray-650">{cam.responsible}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 justify-end shrink-0">
                          <button
                            onClick={() => {
                              setEditingCampanhaId(cam.id);
                              setNewCampanhaName(cam.name);
                              setNewCampanhaObjective(cam.objective);
                              setNewCampanhaTarget(cam.target);
                              setNewCampanhaDate(cam.date);
                              setNewCampanhaResponsible(cam.responsible);
                              setNewCampanhaStatus(cam.status);
                              setNewCampanhaMedia(cam.media);
                              setNewCampanhaResult(cam.result);
                            }}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-500 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Editar Dados e Cobertura"
                          >
                            <Pencil size={12} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCampanha(cam.id, cam.name)}
                            className="p-1.5 px-3 bg-white border border-gray-150 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold"
                            title="Excluir Registro"
                          >
                            <Trash2 size={12} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Right Column: Dynamic Form Management area */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="bg-white rounded-3xl sm:rounded-[40px] border border-gray-100 p-4 sm:p-8 shadow-sm">
              <div className="border-b border-gray-50 pb-5 mb-6">
                <h3 className="text-lg font-black text-gray-900 italic tracking-tight flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600 animate-pulse" />
                  {(editingComunicadoId || editingSocialPostId || editingMidiaId || editingEquipeId || editingCampanhaId) ? 'Editar Cadastro' : 'Nova Entrada'}
                </h3>
                <p className="text-xs text-gray-400 font-medium font-sans mt-1">
                  {(editingComunicadoId || editingSocialPostId || editingMidiaId || editingEquipeId || editingCampanhaId) ? 'Modifique os dados abaixo para salvar' : 'Cadastre novas informações no painel eletrônico.'}
                </p>
              </div>

              {comActiveTab === 'comunicados' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título do Comunicado</label>
                    <input
                      type="text"
                      value={newComTitle}
                      onChange={(e) => setNewComTitle(e.target.value)}
                      placeholder="Ex: Alerta de Palestra Especial"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Categoria</label>
                    <select
                      value={newComCategory}
                      onChange={(e) => setNewComCategory(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Avisos">Avisos de Rotina</option>
                      <option value="Campanhas">Campanhas Fraternas / Bazar</option>
                      <option value="Estudos">Estudos e Cursos</option>
                      <option value="Reuniões">Reuniões de Trabalhadores</option>
                      <option value="Eventos">Eventos e Festividades</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Público-Alvo</label>
                    <select
                      value={newComTarget}
                      onChange={(e) => setNewComTarget(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Público Geral">Público Geral</option>
                      <option value="Trabalhadores">Trabalhadores da Casa</option>
                      <option value="Médiuns">Médiuns e Apoio</option>
                      <option value="Juventude">Juventude / Evangelizandos</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Conteúdo da Notícia</label>
                    <textarea
                      value={newComContent}
                      onChange={(e) => setNewComContent(e.target.value)}
                      rows={4}
                      placeholder="Descreva a notícia ou aviso que será exposto no mural..."
                      className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Autor / Responsável</label>
                    <input
                      type="text"
                      value={newComAuthor}
                      onChange={(e) => setNewComAuthor(e.target.value)}
                      placeholder="Ex: Área Executiva"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status de Publicação</label>
                    <select
                      value={newComStatus}
                      onChange={(e) => setNewComStatus(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="publicado">Publicado (Visível)</option>
                      <option value="rascunho">Rascunho (Em Elaboração)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newComTitle.trim() || !newComContent.trim()) {
                        alert('Informe o título e conteúdo do comunicado!');
                        return;
                      }
                      handleAddComunicado(newComTitle, newComCategory, newComContent, newComAuthor, newComTarget, newComStatus);
                      setNewComTitle('');
                      setNewComContent('');
                      setNewComAuthor('');
                    }}
                    className="w-full mt-4 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingComunicadoId ? 'Salvar Alterações' : 'Gravar Comunicado'}
                  </button>
                  {editingComunicadoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComunicadoId(null);
                        setNewComTitle('');
                        setNewComContent('');
                        setNewComAuthor('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {comActiveTab === 'redes' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Título da Postagem / Campanha</label>
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Ex: Post - Escala de Caridade"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Rede / Plataforma</label>
                    <select
                      value={newPostPlatform}
                      onChange={(e) => setNewPostPlatform(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="WhatsApp">WhatsApp (Grupos/Disparos)</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Telegram">Telegram Channel</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Conteúdo Textual (Legenda)</label>
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={3}
                      placeholder="Legenda, link da biografia, ou texto explicativo do post..."
                      className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Hashtags Recomendadas</label>
                    <input
                      type="text"
                      value={newPostHashtags}
                      onChange={(e) => setNewPostHashtags(e.target.value)}
                      placeholder="Ex: #kardec #caridade #prece"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data de Postagem</label>
                    <input
                      type="date"
                      value={newPostDate}
                      onChange={(e) => setNewPostDate(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Responsável</label>
                    <input
                      type="text"
                      value={newPostResponsible}
                      onChange={(e) => setNewPostResponsible(e.target.value)}
                      placeholder="Ex: Andréia Ramos"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status Editorial</label>
                    <select
                      value={newPostStatus}
                      onChange={(e) => setNewPostStatus(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="Planejado">Planejado</option>
                      <option value="Em Produção">Em Produção</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Publicado">Publicado</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newPostTitle.trim() || !newPostText.trim()) {
                        alert('Informe o título e o texto de legenda!');
                        return;
                      }
                      handleAddSocialPost(newPostTitle, newPostText, newPostPlatform, newPostDate, newPostHashtags, newPostStatus, newPostResponsible);
                      setNewPostTitle('');
                      setNewPostText('');
                      setNewPostHashtags('');
                      setNewPostResponsible('');
                    }}
                    className="w-full mt-4 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingSocialPostId ? 'Salvar Alterações' : 'Planejar Postagem'}
                  </button>
                  {editingSocialPostId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSocialPostId(null);
                        setNewPostTitle('');
                        setNewPostText('');
                        setNewPostHashtags('');
                        setNewPostResponsible('');
                      }}
                      className="w-full mt-2 h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {comActiveTab === 'midia' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome da Arte / Mídia</label>
                    <input
                      type="text"
                      value={newMidiaName}
                      onChange={(e) => setNewMidiaName(e.target.value)}
                      placeholder="Ex: Arte - Palestra de Sábado"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tipo / Categoria de Produção</label>
                    <select
                      value={newMidiaCategory}
                      onChange={(e) => setNewMidiaCategory(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-155 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="Artes e Design">Artes & Design (Flyer, Imagem)</option>
                      <option value="Vídeos">Vídeos (Reels, Transmissão, Palestras)</option>
                      <option value="Podcasts">Podcasts / Audiolivros Espíritas</option>
                      <option value="Templates">Templates / Identidade Gráfica</option>
                    </select>
                  </div>
                  
                  {/* Specialized Doutrinario Field */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Objetivo de Promoção Espírita</label>
                    <input
                      type="text"
                      value={newMidiaSpiritObjective}
                      onChange={(e) => setNewMidiaSpiritObjective(e.target.value)}
                      placeholder="Ex: Divulgar e esclarecer sobre reencarnação."
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Link de Arquivo ou Pasta Nuvem (URL)</label>
                    <input
                      type="text"
                      value={newMidiaUrl}
                      onChange={(e) => setNewMidiaUrl(e.target.value)}
                      placeholder="Ex: https://drive.google.com/..."
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Designer / Autor</label>
                    <input
                      type="text"
                      value={newMidiaDesigner}
                      onChange={(e) => setNewMidiaDesigner(e.target.value)}
                      placeholder="Ex: Lívia Gimenes"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estado da Arte</label>
                    <select
                      value={newMidiaStatus}
                      onChange={(e) => setNewMidiaStatus(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="Em Desenvolvimento">Em Desenvolvimento</option>
                      <option value="Em Revisão Doutrinária">Em Revisão Doutrinária</option>
                      <option value="Aprovado">Aprovado (Pronto para Publicar)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newMidiaName.trim()) {
                        alert('Por favor, informe o nome da arte ou mídia!');
                        return;
                      }
                      handleAddMidia(newMidiaName, newMidiaCategory, newMidiaDesigner, newMidiaUrl, newMidiaStatus, newMidiaSpiritObjective);
                      setNewMidiaName('');
                      setNewMidiaDesigner('');
                      setNewMidiaUrl('');
                      setNewMidiaSpiritObjective('');
                    }}
                    className="w-full mt-4 h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingMidiaId ? 'Salvar Alterações' : 'Adicionar Criativo'}
                  </button>
                  {editingMidiaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMidiaId(null);
                        setNewMidiaName('');
                        setNewMidiaDesigner('');
                        setNewMidiaUrl('');
                        setNewMidiaSpiritObjective('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {comActiveTab === 'equipe' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome Completo</label>
                    <input
                      type="text"
                      value={newMembroName}
                      onChange={(e) => setNewMembroName(e.target.value)}
                      placeholder="Ex: Gabriel Chaves"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Função Principal</label>
                    <select
                      value={newMembroRole}
                      onChange={(e) => setNewMembroRole(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Social Media">Social Media</option>
                      <option value="Designer">Designer Gráfico</option>
                      <option value="Videomaker">Videomaker / Operador de Câmera</option>
                      <option value="Revisor Doutrinário">Revisor Doutrinário / Teólogo</option>
                      <option value="Fotógrafo">Fotógrafo de Reuniões</option>
                      <option value="Redator">Redator de Comunicados</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Disponibilidade</label>
                    <input
                      type="text"
                      value={newMembroAvailability}
                      onChange={(e) => setNewMembroAvailability(e.target.value)}
                      placeholder="Ex: Sábados e Domingos"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Equipamentos Utilizados / Autorizados</label>
                    <input
                      type="text"
                      value={newMembroEquipments}
                      onChange={(e) => setNewMembroEquipments(e.target.value)}
                      placeholder="Ex: Câmera Mirrorless / Canva PRO"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newMembroName.trim()) {
                        alert('Por favor, informe o nome do colaborador voluntário!');
                        return;
                      }
                      handleAddEquipeMembro(newMembroName, newMembroRole, newMembroAvailability, newMembroEquipments);
                      setNewMembroName('');
                      setNewMembroEquipments('');
                    }}
                    className="w-full mt-4 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {editingEquipeId ? 'Salvar Alterações' : 'Cadastrar Voluntário'}
                  </button>
                  {editingEquipeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEquipeId(null);
                        setNewMembroName('');
                        setNewMembroEquipments('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-755 border border-gray-150 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {comActiveTab === 'campanhas' && (
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Nome da Campanha / Evento</label>
                    <input
                      type="text"
                      value={newCampanhaName}
                      onChange={(e) => setNewCampanhaName(e.target.value)}
                      placeholder="Ex: Campanha do Agasalho Espírita 2026"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Objetivo Geral & Doutrinário</label>
                    <textarea
                      value={newCampanhaObjective}
                      onChange={(e) => setNewCampanhaObjective(e.target.value)}
                      placeholder="Ex: Arrecadação de cobertores guiada pelos princípios de fraternidade ativa, com divulgação paralela de mensagens consoladoras sobre a caridade espírita."
                      rows={3}
                      className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Canal / Alvo de Divulgação</label>
                    <input
                      type="text"
                      value={newCampanhaTarget}
                      onChange={(e) => setNewCampanhaTarget(e.target.value)}
                      placeholder="Ex: Cartazes de Rua e Redes Sociais"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Data Programada</label>
                    <input
                      type="text"
                      value={newCampanhaDate}
                      onChange={(e) => setNewCampanhaDate(e.target.value)}
                      placeholder="Ex: Julho/2026"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Coordenador / Responsável</label>
                    <input
                      type="text"
                      value={newCampanhaResponsible}
                      onChange={(e) => setNewCampanhaResponsible(e.target.value)}
                      placeholder="Ex: Emmanuel Vasconcelos"
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pasta de Cobertura / Mídia (Drive/Photos Link)</label>
                    <input
                      type="text"
                      value={newCampanhaMedia}
                      onChange={(e) => setNewCampanhaMedia(e.target.value)}
                      placeholder="Ex: https://drive.google.com/..."
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Resultados / Prestação de Contas</label>
                    <textarea
                      value={newCampanhaResult}
                      onChange={(e) => setNewCampanhaResult(e.target.value)}
                      placeholder="Ex: 450 cobertores arrecadados e 120 livros de Chico Xavier distribuídos para as famílias atendidas."
                      rows={2}
                      className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Status da Cobertura</label>
                    <select
                      value={newCampanhaStatus}
                      onChange={(e) => setNewCampanhaStatus(e.target.value)}
                      className="w-full mt-1.5 h-10 bg-gray-50 border border-gray-150 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                    >
                      <option value="Planejada">Planejada</option>
                      <option value="Em Execução">Em Execução</option>
                      <option value="Concluída">Concluída & Divulgada</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newCampanhaName.trim() || !newCampanhaObjective.trim()) {
                        alert('Informe o nome e o objetivo geral da campanha!');
                        return;
                      }
                      handleAddCampanha(
                        newCampanhaName,
                        newCampanhaObjective,
                        newCampanhaTarget,
                        newCampanhaDate,
                        newCampanhaResponsible,
                        newCampanhaStatus,
                        newCampanhaMedia,
                        newCampanhaResult
                      );
                      setNewCampanhaName('');
                      setNewCampanhaObjective('');
                      setNewCampanhaTarget('');
                      setNewCampanhaDate('');
                      setNewCampanhaResponsible('');
                      setNewCampanhaMedia('');
                      setNewCampanhaResult('');
                    }}
                    className="w-full mt-4 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer font-sans"
                  >
                    {editingCampanhaId ? 'Salvar Alterações' : 'Iniciar Campanha / Cobertura'}
                  </button>
                  {editingCampanhaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCampanhaId(null);
                        setNewCampanhaName('');
                        setNewCampanhaObjective('');
                        setNewCampanhaTarget('');
                        setNewCampanhaDate('');
                        setNewCampanhaResponsible('');
                        setNewCampanhaMedia('');
                        setNewCampanhaResult('');
                      }}
                      className="w-full mt-2 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center font-sans"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant card */}
            <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/25 font-sans">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wider text-indigo-100 uppercase">Estúdio de Redação IA</h4>
                  <p className="text-[10px] text-indigo-300">Gere inspirações espíritas com Gemini</p>
                </div>
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <label className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Tema Espiritual</label>
                  <select
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="w-full h-8.5 bg-indigo-950/60 border border-indigo-700/40 rounded-lg px-2 text-[11px] text-indigo-100 focus:outline-none focus:border-indigo-400 transition-all font-semibold"
                  >
                    <option value="Caridade Espírita">Caridade Espírita & Fraternidade</option>
                    <option value="Imortalidade da Alma">Imortalidade da Alma & Progresso</option>
                    <option value="Evangelho no Lar">Evangelho no Lar é Luz</option>
                    <option value="Prece e Prática do Bem">Prece & Prática do Bem</option>
                    <option value="Consolação e Fé">Consolação, Confiança e Paz</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Público-Alvo</label>
                    <select
                      value={aiTarget}
                      onChange={(e) => setAiTarget(e.target.value)}
                      className="w-full h-8.5 bg-indigo-950/60 border border-indigo-700/40 rounded-lg px-2 text-[11px] text-indigo-100 focus:outline-none focus:border-indigo-400 transition-all font-semibold"
                    >
                      <option value="Público Geral">Público Geral</option>
                      <option value="Jovens e Crianças">Mocidade & Infância</option>
                      <option value="Trabalhadores Voluntários">Trabalhadores</option>
                      <option value="Corações Aflitos">Corações Aflitos</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest block mb-1">Formato</label>
                    <select
                      value={aiType}
                      onChange={(e) => setAiType(e.target.value)}
                      className="w-full h-8.5 bg-indigo-950/60 border border-indigo-700/40 rounded-lg px-2 text-[11px] text-indigo-100 focus:outline-none focus:border-indigo-400 transition-all font-semibold"
                    >
                      <option value="post">Post de Rede Social</option>
                      <option value="comunicado">Comunicado Oficial</option>
                      <option value="frase">Mensagem Consolo</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCreativeAi}
                  disabled={isGeneratingAi}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-900/40"
                >
                  {isGeneratingAi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                      <span>Sintonizando Doutrina...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={11} />
                      <span>Gerar Inspiração</span>
                    </>
                  )}
                </button>

                {aiResultText && (
                  <div className="space-y-2 mt-3 animate-fade-in text-left">
                    <div className="p-3 bg-indigo-950/80 border border-indigo-800/60 rounded-xl max-h-[160px] overflow-y-auto text-[11px] leading-relaxed font-sans text-indigo-100 select-all whitespace-pre-wrap">
                      {aiResultText}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiResultText);
                          alert('Copiado para a área de transferência!');
                        }}
                        className="flex-1 h-7 bg-indigo-900/40 hover:bg-indigo-900/80 border border-indigo-700/30 text-indigo-200 text-[10px] font-semibold rounded-lg transition-all"
                      >
                        Copiar Conteúdo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (comActiveTab === 'comunicados') {
                            setNewComContent(aiResultText);
                            setNewComTitle(`Reflexão: ${aiTheme}`);
                          } else if (comActiveTab === 'redes') {
                            setNewPostText(aiResultText);
                            setNewPostTitle(`Reflexão de Hoje - ${aiTheme}`);
                          } else if (comActiveTab === 'midia') {
                            setNewMidiaSpiritObjective(`Arte inspirada: ${aiTheme}`);
                            setNewMidiaName(`Card - ${aiTheme}`);
                          } else if (comActiveTab === 'campanhas') {
                            setNewCampanhaObjective(`Objetivo Doutrinário: ${aiTheme}. ${aiResultText.slice(0, 150)}...`);
                            setNewCampanhaName(`Campanha ${aiTheme}`);
                          }
                          alert('Conteúdo inteligente inserido no formulário ativo!');
                        }}
                        className="flex-1 h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold rounded-lg transition-all"
                      >
                        Aplicar no Painel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderPasseDashboard = () => {
    // Call panel tracker
    const [callingPerson, setCallingPerson] = useState<any>(null);
    const [showCallBanner, setShowCallBanner] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState<any>(null);
    const [escaladorRecomendado, setEscaladorRecomendado] = useState<any[] | null>(null);

    // Load audit logs dynamically
    const getPasseAuditLogs = () => {
      try {
        const stored = localStorage.getItem('passe_audit_logs');
        return stored ? JSON.parse(stored) : [
          { id: 'aud1', date: '2026-05-29 14:15', user: 'Roberto Souza', action: 'Acesso Autorizado', details: 'Descriptografou observações de Alvaro Fontes' }
        ];
      } catch {
        return [];
      }
    };

    const playCallSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
        
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6
          gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.35);
        }, 200);
      } catch (e) {
        console.warn("AudioContext not supported or allowed", e);
      }
    };

    const triggerCall = (item: any) => {
      setCallingPerson(item);
      setShowCallBanner(true);
      playCallSound();
      
      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setShowCallBanner(false);
      }, 7000);
    };

    const handleDecryptObs = (id: string, assistidoName: string) => {
      const timestamp = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR').slice(0, 5);
      const newAudit = {
        id: `aud_${Date.now()}`,
        date: timestamp,
        user: currentUser?.name || 'Roberto Souza',
        action: 'Acesso Autorizado',
        details: `Descriptografou observações espirituais/médicas de ${assistidoName}.`
      };
      
      let logs = [];
      try {
        const stored = localStorage.getItem('passe_audit_logs');
        logs = stored ? JSON.parse(stored) : [
          { id: 'aud1', date: '2026-05-29 14:15', user: 'Roberto Souza', action: 'Acesso Autorizado', details: 'Descriptografou observações de Alvaro Fontes' }
        ];
      } catch {}
      
      const updatedLogs = [newAudit, ...logs];
      localStorage.setItem('passe_audit_logs', JSON.stringify(updatedLogs));
      
      setDecryptedObsId(id);
      alert(`🔐 Acesso auditado registrado para ${currentUser?.name || 'Operador'}! Detalhes revelados.`);
    };

    const runEscaladorAutomatico = () => {
      // Find passistas who are active and match escalador rules (e.g. have standard days like Sábados or available days)
      const matches = passePassistas.filter(p => p.situacao === 'Ativo');
      setEscaladorRecomendado(matches);
      alert('🤖 Escala Automática calculada de acordo com as necessidades e qualificações dos Trabalhadores!');
    };

    const generatePasseSummaryReport = () => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 116, 144); // Cyan/Teal
      doc.text('SETOR DE PASSE E FLUIDOTERAPIA', 14, 20);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('ASSOCIAÇÃO ESPÍRITA MIRANTE DE LUZ', 14, 26);
      doc.text(`Relatório Gerado em: ${new Date().toLocaleDateString('pt-BR')} por ${currentUser?.name || 'Administrador'}`, 14, 32);

      doc.line(14, 36, 196, 36);

      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('1. Atendimentos Espirituais e Fila Atual', 14, 46);

      let yPos = 56;
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      passeAtendimentos.forEach((at, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(`${index + 1}. Assistido: ${at.name} | Tipo: ${at.type} | Sala: ${at.sala} | Status: ${at.status}`, 16, yPos);
        yPos += 8;
      });

      yPos += 6;
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text('2. Cadastro e Escala Geral de Passistas', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      passePassistas.forEach((ps, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(`${index + 1}. Passista: ${ps.name} | Doutrinária: ${ps.doutrinaria} | Situação: ${ps.situacao} | Turno: ${ps.dias}`, 16, yPos);
        yPos += 8;
      });

      yPos += 6;
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text('3. Fluidoterapia (Litragem e Câmaras Preparadas)', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      passeFluidoterapia.forEach((fl, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.text(`${index + 1}. Tipo: ${fl.fluidoType} | Litros: ${fl.qty}L | Responsável: ${fl.resp} | Data: ${fl.date}`, 16, yPos);
        yPos += 8;
      });

      doc.save('Relatorio_Passe_Fluidoterapia_MiranteDeLuz.pdf');
      alert('📄 Relatório PDF Corporativo gerado com sucesso!');
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left">
        
        {/* Floating Call Panel Status */}
        {showCallBanner && callingPerson && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-cyan-600 text-white rounded-3xl p-5 shadow-2xl flex items-center justify-between border-2 border-cyan-300 gap-4 relative z-50 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl animate-ping shrink-0 text-white">
                <Compass size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 block">PAINEL DIGITAL CHAMA</span>
                <h4 className="text-xl font-bold tracking-tight">{callingPerson.name}</h4>
                <p className="text-xs text-cyan-100 mt-1">Por favor, dirija-se à <span className="font-extrabold text-white underline">{callingPerson.sala}</span> com o passista <span className="font-semibold text-white">{callingPerson.passista}</span>.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCallBanner(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-white shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}

        {/* Tab Selector */}
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 pb-2 border-b border-gray-100 scrollbar-none w-full">
          <button
            onClick={() => {
              setPasseActiveTab('atendimentos');
              setEditingPasseAtendimentoId(null);
            }}
            className={cn(
              "p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              passeActiveTab === 'atendimentos'
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-cyan-600 hover:border-cyan-200"
            )}
          >
            <Activity size={14} />
            <span>Atendimento & Fila</span>
          </button>

          <button
            onClick={() => {
              setPasseActiveTab('passistas');
              setEditingPassePassistaId(null);
            }}
            className={cn(
              "p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              passeActiveTab === 'passistas'
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-emerald-600 hover:border-emerald-200"
            )}
          >
            <Users size={14} />
            <span>Passistas & Cadastro</span>
          </button>

          <button
            onClick={() => {
              setPasseActiveTab('fluidoterapia');
              setEditingPasseFluidoterapiaId(null);
              setEditingPasseCampanhaId(null);
            }}
            className={cn(
              "p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              passeActiveTab === 'fluidoterapia'
                ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-sky-600 hover:border-sky-300"
            )}
          >
            <Sparkles size={14} />
            <span>Fluidoterapia & Vibrações</span>
          </button>

          <button
            onClick={() => {
              setPasseActiveTab('salas');
              setEditingPasseSalaId(null);
              setEditingPasseMaterialId(null);
            }}
            className={cn(
              "p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              passeActiveTab === 'salas'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-indigo-600 hover:border-indigo-300"
            )}
          >
            <MapPin size={14} />
            <span>Salas & Materiais</span>
          </button>

          <button
            onClick={() => {
              setPasseActiveTab('escalas');
              setEditingPasseEscalaId(null);
            }}
            className={cn(
              "p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 flex-shrink-0 whitespace-nowrap",
              passeActiveTab === 'escalas'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-102"
                : "bg-white border border-gray-100 text-gray-450 hover:text-purple-600 hover:border-purple-300"
            )}
          >
            <Calendar size={14} />
            <span>Escalas de Serviço</span>
          </button>

          {/* Quick PDF Report button */}
          <button
            onClick={generatePasseSummaryReport}
            className="md:ml-auto p-3 px-5 sm:p-3.5 sm:px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            <Download size={14} />
            <span>PDF Administrativo</span>
          </button>
        </div>

        {/* Content Columns split into list / forms */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main List view column */}
          <div className="lg:col-span-8 space-y-8 text-left">
            
            {/* ATENDIMENTOS & FILA SCREEN */}
            {passeActiveTab === 'atendimentos' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 italic">Controle de Atendimento e Fila de Espera</h3>
                    <p className="text-xs text-cyan-800 font-bold uppercase tracking-widest mt-1">Status em Tempo Real do Atendimento Fluídico</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {passeAtendimentos.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-3xl text-gray-400 font-medium">
                      Nenhum atendido registrado na fila hoje.
                    </div>
                  ) : (
                    passeAtendimentos.map(at => (
                      <div key={at.id} className="p-5 bg-white border border-gray-150 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-cyan-300 transition-all text-left">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-extrabold text-gray-950 text-base">{at.name}</h4>
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                              at.status === 'Aguardando' && "bg-amber-100 text-amber-800",
                              at.status === 'Em Atendimento' && "bg-cyan-100 text-cyan-800 animate-pulse",
                              at.status === 'Concluído' && "bg-emerald-100 text-emerald-800"
                            )}>
                              {at.status}
                            </span>
                            <span className="px-2 py-0.5 border border-cyan-100 text-cyan-700 bg-cyan-50 rounded-lg text-[9px] font-bold">
                              {at.type}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 font-medium">
                            Sala: <strong className="text-indigo-805">{at.sala}</strong> • Passista: <strong className="text-indigo-805">{at.passista || 'A definir'}</strong> • Horário: {at.time} ({at.date})
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Recomendação: <strong className="text-purple-700 italic">"{at.encaminhamento}"</strong>
                          </p>

                          {/* Encrypted Field Safeguard */}
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 max-w-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-amber-600 block uppercase tracking-widest flex items-center gap-1">
                                <Lock size={10} /> Notas Espirituais Reservadas
                              </span>
                              {decryptedObsId !== at.id ? (
                                <button 
                                  onClick={() => handleDecryptObs(at.id, at.name)}
                                  className="text-[9px] text-cyan-600 font-extrabold uppercase tracking-wider hover:underline hover:text-cyan-800 cursor-pointer"
                                >
                                  (Descriptografar com Auditoria)
                                </button>
                              ) : (
                                <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                  ✓ Autorizado
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-gray-650 tracking-tight">
                              {decryptedObsId === at.id ? at.obs : "••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-center">
                          {at.status !== 'Concluído' && (
                            <button
                              onClick={() => triggerCall(at)}
                              className="p-2 px-3 bg-cyan-600 text-white hover:bg-cyan-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                              title="Chamar e Notificar em Telão"
                            >
                              <Compass size={12} className="animate-spin" />
                              <span>Chamar</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setShowTicketModal(at);
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[11px] uppercase transition-all block"
                            title="Visualizar Ticket Térmico"
                          >
                            <Printer size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPasseAtendimentoId(at.id);
                              setNewPasseAtendName(at.name);
                              setNewPasseAtendType(at.type);
                              setNewPasseAtendSala(at.sala);
                              setNewPasseAtendPassista(at.passista);
                              setNewPasseAtendEncaminhamento(at.encaminhamento);
                              setNewPasseAtendObs(at.obs);
                              setNewPasseAtendStatus(at.status);
                            }}
                            className="p-2 bg-gray-50 border border-gray-150 hover:bg-indigo-100 rounded-xl text-gray-500 hover:text-indigo-700"
                            title="Editar Atendimento"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDeletePasseAtendimento(at.id, at.name)}
                            className="p-2 bg-gray-50 border border-gray-150 hover:bg-red-100 rounded-xl text-gray-500 hover:text-red-700"
                            title="Remover"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Secure Audit Trails log preview */}
                <div className="bg-gray-950 text-gray-100 p-5 rounded-3xl font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Log de Auditoria de Segurança do Setor (Criptografia)</span>
                    <span className="px-1 text-[8px] bg-red-650 text-white rounded">CONFIDENCIAL</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {getPasseAuditLogs().map((log: any) => (
                      <div key={log.id} className="text-left leading-relaxed">
                        <span className="text-gray-500">[{log.date}]</span> <strong className="text-cyan-300">{log.user}</strong>: {log.details}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASSISTAS CADASTRO SCREEN */}
            {passeActiveTab === 'passistas' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 italic">Árvore de Trabalhadores & Escudo de Voluntários</h3>
                    <p className="text-xs text-emerald-800 font-bold uppercase tracking-widest mt-1">Passistas Espíritas, Frequência e Qualificações</p>
                  </div>
                  <button 
                    onClick={runEscaladorAutomatico}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-102 transition-all cursor-pointer"
                  >
                    🤖 Escala Automática Inteligente
                  </button>
                </div>

                {escaladorRecomendado && (
                  <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-250 animate-in slide-in-from-top-2 duration-305 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-150 pb-2">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block font-sans">Resultado do Escalador por Conexão de Campo</span>
                      <button onClick={() => setEscaladorRecomendado(null)} className="text-[10px] text-emerald-650 font-bold hover:underline">Fechar</button>
                    </div>
                    <div className="space-y-2 font-sans">
                      <p className="text-xs text-gray-750">Trabalhadores escaláveis recomendados para o turno de harmonização:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {escaladorRecomendado.map(pps => (
                          <div key={pps.id} className="p-3 bg-white border border-emerald-150 rounded-xl text-xs flex items-center justify-between">
                            <div>
                              <strong className="text-emerald-950 block">{pps.name}</strong>
                              <span className="text-[9px] text-gray-400">Doutrinária e Passes Concluídos</span>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-700 font-extrabold">{pps.dias}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {passePassistas.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-3xl text-gray-400 font-medium col-span-2">
                      Nenhum passista cadastrado ainda. Use o painel lateral para registrar.
                    </div>
                  ) : (
                    passePassistas.map(ps => (
                      <div key={ps.id} className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm text-left flex flex-col justify-between hover:border-emerald-300 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-gray-950 text-sm leading-none">{ps.name}</h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              ps.situacao === 'Ativo' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            )}>
                              {ps.situacao}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                            Formação: <strong className="text-emerald-800">Doutrinária {ps.doutrinaria}</strong> <br />
                            Cursos Extra: <strong className="text-gray-700">{ps.cursos || 'Nenhum'}</strong> <br />
                            Dias que Pode: <strong className="text-indigo-800 font-mono">{ps.dias}</strong> <br />
                            Tempo na Casa: <strong className="text-gray-750 font-semibold">{ps.tempo || 'Não registrado'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 pt-3 mt-4 justify-end">
                          <button
                            onClick={() => {
                              setEditingPassePassistaId(ps.id);
                              setNewPassistaName(ps.name);
                              setNewPassistaDateIngresso(ps.dateIngresso);
                              setNewPassistaDoutrinaria(ps.doutrinaria);
                              setNewPassistaCursos(ps.cursos);
                              setNewPassistaDias(ps.dias);
                              setNewPassistaEscalaId(ps.escalaId);
                              setNewPassistaSituacao(ps.situacao);
                              setNewPassistaTempo(ps.tempo);
                            }}
                            className="p-1 px-2.5 bg-white border border-gray-150 text-xs font-bold text-gray-550 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={11} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeletePassista(ps.id, ps.name)}
                            className="p-1 px-2.5 bg-white border border-gray-150 text-xs font-bold text-gray-550 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* FLUIDOTERAPIA & VIBRAÇÕES SCREEN */}
            {passeActiveTab === 'fluidoterapia' && (
              <div className="space-y-8">
                {/* Liters Prepared */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 italic">Controle das Águas Fluidificadas</h3>
                    <p className="text-xs text-sky-800 font-bold uppercase tracking-widest mt-1">Câmaras de Fluidificação e Garrafas em Preparação</p>
                  </div>

                  <div className="space-y-2">
                    {passeFluidoterapia.length === 0 ? (
                      <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-3xl text-gray-400 font-medium">
                        Nenhum registro de água fluidificada hoje.
                      </div>
                    ) : (
                      passeFluidoterapia.map(fl => (
                        <div key={fl.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-sky-50 text-sky-650 rounded-full">
                                <Sparkles size={12} />
                              </span>
                              <strong className="text-sm font-extrabold text-gray-950">{fl.fluidoType}</strong>
                              <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-lg text-[9px] font-mono font-bold">
                                {fl.qty} Litros
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium mt-1 font-sans">
                              Preparador por: <strong className="text-gray-800">{fl.resp}</strong> • Destino: <strong className="text-indigo-800">{fl.dest}</strong> • Data: {fl.date}
                            </p>
                            <p className="text-xs text-gray-450 italic font-mono mt-1 mt-1 pr-4">"{fl.obs}"</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingPasseFluidoterapiaId(fl.id);
                                setNewFluidoType(fl.fluidoType);
                                setNewFluidoResp(fl.resp);
                                setNewFluidoQty(fl.qty);
                                setNewFluidoDest(fl.dest);
                                setNewFluidoObs(fl.obs);
                              }}
                              className="p-1.5 bg-gray-50 text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 border border-gray-150 rounded-lg cursor-pointer"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteFluidoterapia(fl.id)}
                              className="p-1.5 bg-gray-50 text-gray-500 hover:text-red-750 hover:bg-red-50 border border-gray-150 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Vibrational Campaigns */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 italic">Campanhas Vibratórias / Irradiação Conjugadas</h3>
                    <p className="text-xs text-indigo-800 font-bold uppercase tracking-widest mt-1">Preces, Orações e Emissão de Ectoplasma Curativo</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {passeCampanhas.map(cp => (
                      <div key={cp.id} className="p-5 bg-gradient-to-br from-indigo-50/50 to-sky-50/20 border border-indigo-100 rounded-3xl flex flex-col justify-between text-left">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm font-extrabold text-indigo-950 block">{cp.name}</strong>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black uppercase">
                              {cp.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-sans leading-relaxed">
                            Causa do Amparo: <span className="font-semibold text-indigo-905">{cp.motivo}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold font-sans uppercase">
                            Responsável: {cp.resp} • Data Início: {cp.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end mt-4 pt-3 border-t border-indigo-50">
                          <button
                            onClick={() => {
                              setEditingPasseCampanhaId(cp.id);
                              setNewCampName(cp.name);
                              setNewCampMotivo(cp.motivo);
                              setNewCampResp(cp.resp);
                              setNewCampStatus(cp.status);
                            }}
                            className="p-1 px-2 border border-indigo-150 bg-white hover:bg-indigo-100 rounded-lg text-xs font-bold text-gray-500 cursor-pointer"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDeletePasseCampanha(cp.id, cp.name)}
                            className="p-1 px-2 border border-indigo-150 bg-white hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SALAS & INVENTÁRIO SCREEN */}
            {passeActiveTab === 'salas' && (
              <div className="space-y-8">
                {/* Salas list */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-950 italic">Salas e Ambientes Regulados</h3>
                    <p className="text-xs text-indigo-800 font-bold uppercase tracking-widest mt-1">Áreas Físicas Blindadas de Tratamento de Fluidos</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {passeSalas.length === 0 ? (
                      <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-3xl text-gray-400 font-medium col-span-2">
                        Nenhuma sala cadastrada.
                      </div>
                    ) : (
                      passeSalas.map(sl => (
                        <div key={sl.id} className="p-5 bg-white border border-gray-150 rounded-3xl flex flex-col justify-between hover:border-indigo-300 transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-extrabold text-sm text-gray-950 flex items-center gap-1.5 leading-none">
                                <MapPin size={14} className="text-indigo-500" />
                                {sl.name}
                              </h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                                sl.disp === 'Disponível' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                              )}>
                                {sl.disp}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                              Tipo: <strong className="text-indigo-900">{sl.type}</strong> <br />
                              Capacidade Máxima: <strong className="text-gray-800">{sl.cap} Assistidos</strong> <br />
                              Coordenador: <strong className="text-purple-800">{sl.resp || 'Não escalado'}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end mt-4 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setEditingPasseSalaId(sl.id);
                                setNewSalaName(sl.name);
                                setNewSalaType(sl.type);
                                setNewSalaCap(sl.cap);
                                setNewSalaResp(sl.resp);
                                setNewSalaDisp(sl.disp);
                              }}
                              className="p-1 px-2 border border-gray-150 bg-white hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeletePasseSala(sl.id, sl.name)}
                              className="p-1 px-2 border border-gray-150 bg-white hover:bg-red-50 text-red-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Material Inventory levels */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 italic">Controle de Estoque e Apoio Operacional</h3>
                    <p className="text-xs text-amber-800 font-bold uppercase tracking-widest mt-1">Materiais Essenciais de Apoio Doutrinário (Copos, Garrafas e Galões)</p>
                  </div>

                  <div className="space-y-2">
                    {passeMateriais.map(mat => {
                      const isLowStock = mat.qty <= mat.min;
                      return (
                        <div key={mat.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-left">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-sm font-extrabold text-gray-900">{mat.product}</strong>
                              {isLowStock && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle size={10} /> Estoque Baixo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] mt-1 text-gray-500 font-sans">
                              Quantidade em Estoque: <strong className="text-indigo-800">{mat.qty} unidades</strong> • Nível de Alerta Mínimo: {mat.min} • Fiscal: {mat.resp || 'Casa Espírita'}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingPasseMaterialId(mat.id);
                                setNewMaterialProduct(mat.product);
                                setNewMaterialQty(mat.qty);
                                setNewMaterialMin(mat.min);
                                setNewMaterialResp(mat.resp);
                              }}
                              className="p-1.5 bg-white border border-gray-150 text-gray-500 hover:text-indigo-705 rounded-lg text-xs cursor-pointer"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeletePasseMaterial(mat.id, mat.product)}
                              className="p-1.5 bg-white border border-gray-150 text-gray-500 hover:text-red-750 rounded-lg text-xs cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ESCALAS DE SERVIÇO SCREEN */}
            {passeActiveTab === 'escalas' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-950 italic">Escalas Totais de Serviço Semanal</h3>
                  <p className="text-xs text-purple-800 font-bold uppercase tracking-widest mt-1">Escalas de Atendimento e Distribuição Harmoniosa de Turnos</p>
                </div>

                <div className="space-y-4">
                  {passeEscalas.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-3xl text-gray-400 font-medium">
                      Nenhuma escala cadastrada para transmissão de passes nesta semana.
                    </div>
                  ) : (
                    passeEscalas.map(esc => (
                      <div key={esc.id} className="p-5 bg-white border border-gray-150 rounded-3xl shadow-sm text-left flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-purple-300 transition-all">
                        <div className="space-y-1 bg-white">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-purple-50 text-purple-650 rounded-full">
                              <Calendar size={13} />
                            </span>
                            <strong className="text-base text-purple-950 font-black">{esc.equipe}</strong>
                          </div>
                          
                          <p className="text-xs text-gray-550 font-sans leading-relaxed mt-2 pt-1 pl-1">
                            Escalados: <strong className="text-gray-900">{esc.passistas}</strong> <br />
                            Coordenador Geral: <strong className="text-purple-800">{esc.coord}</strong> <br />
                            Horário Agendado: <strong className="text-indigo-800 font-mono">{esc.time}h</strong> ({esc.date})
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setEditingPasseEscalaId(esc.id);
                              setNewEscDate(esc.date);
                              setNewEscTime(esc.time);
                              setNewEscEquipe(esc.equipe);
                              setNewEscPassistas(esc.passistas);
                              setNewEscCoord(esc.coord);
                            }}
                            className="p-1.5 px-3 bg-white border border-gray-150 hover:bg-purple-50 rounded-xl text-gray-500 hover:text-purple-705 text-xs font-bold cursor-pointer"
                          >
                            <Pencil size={11} /> <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeletePasseEscala(esc.id)}
                            className="p-1.5 px-3 bg-white border border-gray-150 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            <Trash2 size={11} /> <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN: DYNAMIC FORM SUBMISSIONS */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="bg-white rounded-3xl sm:rounded-[36px] border border-gray-100 p-4 sm:p-6 shadow-sm">
              <div className="border-b border-gray-50 pb-4 mb-4">
                <h3 className="text-base font-extrabold text-gray-900 italic tracking-tight flex items-center gap-1.5">
                  <Sparkles size={16} className="text-cyan-600" />
                  {(editingPasseAtendimentoId || editingPassePassistaId || editingPasseFluidoterapiaId || editingPasseSalaId || editingPasseCampanhaId || editingPasseMaterialId || editingPasseEscalaId) ? 'Atualizar Registro' : 'Lançar Dados'}
                </h3>
                <p className="text-[11px] text-gray-450 mt-1 font-sans">
                  Preencha cuidadosamente os campos abaixo para sincronização local e auditoria de prontuário.
                </p>
              </div>

              {/* ATENDIMENTOS FORM */}
              {passeActiveTab === 'atendimentos' && (
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nome do Assistido</label>
                    <input
                      type="text"
                      value={newPasseAtendName}
                      onChange={(e) => setNewPasseAtendName(e.target.value)}
                      placeholder="Ex: Alvaro Fontes"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Tipo de Harmonização / Passe</label>
                    <select
                      value={newPasseAtendType}
                      onChange={(e) => setNewPasseAtendType(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                    >
                      <option value="Passe simples">Passe simples</option>
                      <option value="Passe magnético">Passe magnético (Cura)</option>
                      <option value="Fluidoterapia">Fluidoterapia (Tratamento Água)</option>
                      <option value="Atendimento fraterno">Encaminhamento do Atendimento Fraterno</option>
                      <option value="Harmonização espiritual">Harmonização e Tratamento Fluídico</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Sala Blindada Alocada</label>
                    <select
                      value={newPasseAtendSala}
                      onChange={(e) => setNewPasseAtendSala(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    >
                      {passeSalas.map(sl => (
                        <option key={sl.id} value={sl.name}>{sl.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Passista Responsável</label>
                    <select
                      value={newPasseAtendPassista}
                      onChange={(e) => setNewPasseAtendPassista(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    >
                      <option value="">A definir pelo Escalador</option>
                      {passePassistas.map(ps => (
                        <option key={ps.id} value={ps.name}>{ps.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Encaminhamento / Recomendação</label>
                    <input
                      type="text"
                      value={newPasseAtendEncaminhamento}
                      onChange={(e) => setNewPasseAtendEncaminhamento(e.target.value)}
                      placeholder="Ex: Prece Diária e Evangelho no Lar"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Ficha Confidencial (Prontuário de Passes)</label>
                    <textarea
                      value={newPasseAtendObs}
                      onChange={(e) => setNewPasseAtendObs(e.target.value)}
                      rows={3}
                      placeholder="Relate sentimentos de distonia ou observações curativas com absoluto sigilo..."
                      className="w-full p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs font-medium resize-none"
                    />
                    <span className="text-[9.5px] italic text-rose-500 mt-1 block">🔒 Dados sensíveis serão salvos sob criptografia no prontuário.</span>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Fila Status</label>
                    <select
                      value={newPasseAtendStatus}
                      onChange={(e) => setNewPasseAtendStatus(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    >
                      <option value="Aguardando">Aguardando na Fila</option>
                      <option value="Em Atendimento">Em Atendimento</option>
                      <option value="Concluído">Tratamento Concluído</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newPasseAtendName.trim()) { alert('Informe o nome do assistido!'); return; }
                      handleAddPasseAtendimento(newPasseAtendName, newPasseAtendType, newPasseAtendSala, newPasseAtendPassista, newPasseAtendEncaminhamento, newPasseAtendStatus, newPasseAtendObs);
                    }}
                    className="w-full h-10 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                  >
                    {editingPasseAtendimentoId ? 'Salvar Alterações' : 'Agendar na Fila'}
                  </button>
                  {editingPasseAtendimentoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPasseAtendimentoId(null);
                        setNewPasseAtendName('');
                        setNewPasseAtendObs('');
                      }}
                      className="w-full h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {/* PASSISTAS FORM */}
              {passeActiveTab === 'passistas' && (
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={newPassistaName}
                      onChange={(e) => setNewPassistaName(e.target.value)}
                      placeholder="Ex: Denise Martins"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Formação Doutrinária Espírita</label>
                    <select
                      value={newPassistaDoutrinaria}
                      onChange={(e) => setNewPassistaDoutrinaria(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    >
                      <option value="Concluída">Kardec Básica Concluída</option>
                      <option value="Em Andamento">Em Andamento (ESDE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Cursos Complementares de Fluidoterapia / Passes</label>
                    <input
                      type="text"
                      value={newPassistaCursos}
                      onChange={(e) => setNewPassistaCursos(e.target.value)}
                      placeholder="Ex: Passes e Fluidos, Passe Magnético Avançado"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Turno de Disponibilidade</label>
                    <input
                      type="text"
                      value={newPassistaDias}
                      onChange={(e) => setNewPassistaDias(e.target.value)}
                      placeholder="Ex: Quartas e Sábados"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Tempo na Casa Espírita</label>
                    <input
                      type="text"
                      value={newPassistaTempo}
                      onChange={(e) => setNewPassistaTempo(e.target.value)}
                      placeholder="Ex: 3 anos"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Situação de Escala</label>
                    <select
                      value={newPassistaSituacao}
                      onChange={(e) => setNewPassistaSituacao(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                    >
                      <option value="Ativo">Ativo e Escalado</option>
                      <option value="Licença">Licença Temporária</option>
                      <option value="Afastado">Afastado</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newPassistaName.trim()) { alert('Informe o nome do passista!'); return; }
                      handleAddPassista(newPassistaName, newPassistaDateIngresso, newPassistaDoutrinaria, newPassistaCursos, newPassistaDias, newPassistaEscalaId, newPassistaSituacao, newPassistaTempo);
                    }}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                  >
                    {editingPassePassistaId ? 'Gravar Alterações' : 'Cadastrar Passista'}
                  </button>
                  {editingPassePassistaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPassePassistaId(null);
                        setNewPassistaName('');
                      }}
                      className="w-full h-8 bg-gray-100 hover:bg-gray-200 text-gray-755 rounded-lg font-bold"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

              {/* FLUIDOTERAPIA & VIBRAÇÕES FORMS */}
              {passeActiveTab === 'fluidoterapia' && (
                <div className="space-y-4 font-sans text-xs">
                  {editingPasseCampanhaId ? (
                    // Campanha form
                    <div className="space-y-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block">Editando Campanha Especial</span>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nome da Campanha</label>
                        <input
                          type="text"
                          value={newCampName}
                          onChange={(e) => setNewCampName(e.target.value)}
                          placeholder="Ex: Vibração pelos Enfermos"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Causa Especial / Vibração</label>
                        <input
                          type="text"
                          value={newCampMotivo}
                          onChange={(e) => setNewCampMotivo(e.target.value)}
                          placeholder="Ex: Doentes da UTI de Hospitais"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Médium Coordenador</label>
                        <input
                          type="text"
                          value={newCampResp}
                          onChange={(e) => setNewCampResp(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Status</label>
                        <select
                          value={newCampStatus}
                          onChange={(e) => setNewCampStatus(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        >
                          <option value="Ativo">Vibrando Coletivamente</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPasseCampanha(newCampName, newCampMotivo, newCampResp, newCampStatus)}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Salvar Campanha
                      </button>
                    </div>
                  ) : (
                    // Agua Fluidificada Form
                    <div className="space-y-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block">Nova Fluidificação de Galões</span>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Tipo de Água Flutuante</label>
                        <select
                          value={newFluidoType}
                          onChange={(e) => setNewFluidoType(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        >
                          <option value="Água Geral">Água Geral para Assistidos</option>
                          <option value="Água Individualizada">Garrafa Fluídica de Cura Individual</option>
                          <option value="Fluido de Vibração Coletiva">Fluido de Vibração Coletiva</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Litragem / Garrafas Preparadas</label>
                        <input
                          type="number"
                          value={newFluidoQty}
                          onChange={(e) => setNewFluidoQty(Number(e.target.value))}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Médium Fluidificador Responsável</label>
                        <input
                          type="text"
                          value={newFluidoResp}
                          onChange={(e) => setNewFluidoResp(e.target.value)}
                          placeholder="Ex: Denise Martins"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Destinação na Casa Espírita</label>
                        <input
                          type="text"
                          value={newFluidoDest}
                          onChange={(e) => setNewFluidoDest(e.target.value)}
                          placeholder="Ex: Salão Principal / Atendimento Fraterno"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Notas e Sintonização Espiritual</label>
                        <textarea
                          value={newFluidoObs}
                          onChange={(e) => setNewFluidoObs(e.target.value)}
                          rows={2}
                          placeholder="Pense em Paz Doutrinária ao fluidificar..."
                          className="w-full p-2 bg-gray-50 border border-gray-155 rounded-lg text-xs font-medium resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFluidoResp.trim()) { alert('Informe o fluidificador responsável!'); return; }
                          handleAddFluidoterapia(newFluidoType, newFluidoResp, newFluidoQty, newFluidoDest, newFluidoObs);
                        }}
                        className="w-full h-10 bg-sky-600 hover:bg-sky-705 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                      >
                        {editingPasseFluidoterapiaId ? 'Salvar Água' : 'Registrar Água Concluída'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SALAS & INVENTÁRIO FORMS */}
              {passeActiveTab === 'salas' && (
                <div className="space-y-4 font-sans text-xs">
                  {editingPasseMaterialId ? (
                    // Edit material levels
                    <div className="space-y-4">
                      <span className="text-[9px] font-black uppercase text-amber-500 block">Editar Suprimentos Espíritas</span>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nome do Produto</label>
                        <input
                          type="text"
                          value={newMaterialProduct}
                          onChange={(e) => setNewMaterialProduct(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Quantidade em Unidades</label>
                        <input
                          type="number"
                          value={newMaterialQty}
                          onChange={(e) => setNewMaterialQty(Number(e.target.value))}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Quantidade Limite Alerta</label>
                        <input
                          type="number"
                          value={newMaterialMin}
                          onChange={(e) => setNewMaterialMin(Number(e.target.value))}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPasseMaterial(newMaterialProduct, newMaterialQty, newMaterialMin, newMaterialResp)}
                        className="w-full h-10 bg-amber-550 text-white hover:bg-amber-600 rounded-xl font-bold uppercase text-[10px]"
                      >
                        Salvar Estoque
                      </button>
                    </div>
                  ) : (
                    // Create and edit Salas
                    <div className="space-y-4">
                      <span className="text-[9px] font-black uppercase text-indigo-400 block">Nova Sala de Atendimento</span>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Nome da Sala</label>
                        <input
                          type="text"
                          value={newSalaName}
                          onChange={(e) => setNewSalaName(e.target.value)}
                          placeholder="Ex: Sala 3 - Emmanuel"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Modabilidade</label>
                        <select
                          value={newSalaType}
                          onChange={(e) => setNewSalaType(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        >
                          <option value="Sala de Passe Coletivo">Sala de Passe Coletivo / Magnetismo</option>
                          <option value="Sala de Passe Individual">Sala de Passe Individual</option>
                          <option value="Câmara de Fluidificação">Câmara de Fluidificação Dedicada</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Capacidade de Pessoas</label>
                        <input
                          type="number"
                          value={newSalaCap}
                          onChange={(e) => setNewSalaCap(Number(e.target.value))}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Médium Coordenador da Sala</label>
                        <input
                          type="text"
                          value={newSalaResp}
                          onChange={(e) => setNewSalaResp(e.target.value)}
                          placeholder="Ex: Claudio Ferreira"
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Mesa Coletiva Status</label>
                        <select
                          value={newSalaDisp}
                          onChange={(e) => setNewSalaDisp(e.target.value)}
                          className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 text-xs font-medium"
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Ocupada">Em Sessão Ativa</option>
                          <option value="Manutenção">Em Limpeza Fluídica / Fechada</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSalaName.trim()) { alert('Informe o nome da sala!'); return; }
                          handleAddPasseSala(newSalaName, newSalaType, newSalaCap, newSalaResp, newSalaDisp);
                        }}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                      >
                        {editingPasseSalaId ? 'Salvar Sala' : 'Alocar Sala Blindada'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ESCALAS DE SERVIÇO FORM */}
              {passeActiveTab === 'escalas' && (
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Grupo / Equipe de Apoio</label>
                    <input
                      type="text"
                      value={newEscEquipe}
                      onChange={(e) => setNewEscEquipe(e.target.value)}
                      placeholder="Ex: Equipe Allan Kardec Sábados"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Passistas Vinculados (Lista)</label>
                    <input
                      type="text"
                      value={newEscPassistas}
                      onChange={(e) => setNewEscPassistas(e.target.value)}
                      placeholder="Ex: Claudio Ferreira, Denise Martins"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Coordenador do Turno</label>
                    <input
                      type="text"
                      value={newEscCoord}
                      onChange={(e) => setNewEscCoord(e.target.value)}
                      placeholder="Ex: Roberto Souza"
                      className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Data</label>
                      <input
                        type="date"
                        value={newEscDate}
                        onChange={(e) => setNewEscDate(e.target.value)}
                        className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">Horário de Início</label>
                      <input
                        type="text"
                        value={newEscTime}
                        onChange={(e) => setNewEscTime(e.target.value)}
                        placeholder="19:30"
                        className="w-full h-9 bg-gray-50 border border-gray-150 rounded-lg px-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newEscEquipe.trim()) { alert('Informe o nome da equipe!'); return; }
                      handleAddPasseEscala(newEscDate, newEscTime, newEscEquipe, newEscPassistas, newEscCoord);
                    }}
                    className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                  >
                    {editingPasseEscalaId ? 'Gravar Transmissão' : 'Agendar Escala de Turno'}
                  </button>
                  {editingPasseEscalaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPasseEscalaId(null);
                        setNewEscEquipe('Equipe Fraternidade');
                      }}
                      className="w-full h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* PRINT TICKET MODAL OVERLAY */}
        {showTicketModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white text-slate-900 rounded-3xl sm:rounded-[32px] p-4 sm:p-8 max-w-sm w-full font-mono text-xs border border-slate-200 text-center shadow-2xl relative">
              <button 
                onClick={() => setShowTicketModal(null)}
                className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={16} />
              </button>
              
              <div className="space-y-4">
                <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full uppercase tracking-widest">
                  TICKET DE TRANSMISSÃO DE FLUIDOS
                </span>
                
                <h3 className="font-extrabold text-lg text-slate-950 tracking-tight mt-2">MIRANTE DE LUZ ESPÍRITA</h3>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 border-b border-b-slate-100 pb-3">
                  CNPJ: 14.238.112/0001-90 | Assistência e Passes
                </p>

                <div className="text-left py-4 pt-2 space-y-2 font-mono text-sm border-b border-slate-100 pb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Senha Fila:</span>
                    <strong className="text-cyan-700 font-black"># {showTicketModal.id.slice(-4).toUpperCase()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assistido:</span>
                    <strong className="text-slate-900">{showTicketModal.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tratamento:</span>
                    <strong className="text-slate-900">{showTicketModal.type}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sala Blindada:</span>
                    <strong className="text-slate-900">{showTicketModal.sala}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data e Hora:</span>
                    <strong className="text-slate-900 font-mono">{showTicketModal.date} {showTicketModal.time}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Responsável:</span>
                    <strong className="text-slate-950">{showTicketModal.passista || 'Equipe Cooperadores'}</strong>
                  </div>
                </div>

                <div className="py-2 flex justify-center flex-col items-center gap-1.5 font-sans">
                  <QrCode size={110} className="text-slate-800" />
                  <span className="text-[9.5px] italic text-slate-400 block tracking-tight">"Amai-vos e instruí-vos. Sintonize com o Evangelho ao adentrar a câmara."</span>
                </div>

                <div className="flex gap-2 font-sans pt-4">
                  <button 
                    onClick={() => {
                      alert('Simulação de Impressão de Cupom Térmico enviada para a porta USB COM3!');
                      setShowTicketModal(null);
                    }}
                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                  >
                    Imprimir Via Atendido
                  </button>
                  <button 
                    onClick={() => setShowTicketModal(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-bold text-[10px] uppercase"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderSocialDashboard = () => {
    // Audit search state
    const [searchQuery, setSearchQuery] = useState('');
    
    // Auto scanning trigger (Real camera-based)
    const triggerQrScanner = (asName: string) => {
      setSocialScannedFamilyName(asName);
      setSocialIsScanningQr(true);
    };

    // Filtered lists
    const filteredAssistidos = socialAssistidos.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.cpf.includes(searchQuery) ||
      a.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate dynamic aggregates
    const totalFamilies = socialAssistidos.length;
    const highVulnerabilityCount = socialAssistidos.filter(a => a.vulnerabilityLevel === 'Alta').length;
    const criticalFoodCount = socialAssistidos.filter(a => a.foodSecurity === 'Grave').length;
    const totalBasketsDelivered = socialCestasEntregas.length;
    const totalStockItems = socialDoacoes.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    return (
      <div className="space-y-8 font-sans">
        {/* SUBHEADER BLOCK */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-rose-100 pb-6">
          <div className="text-left">
            <h2 className="text-2xl font-black text-rose-800 italic flex items-center gap-2">
              <Handshake size={24} className="text-rose-600 animate-pulse" />
              Promoção Social & Caridade: Ação Social Espírita
            </h2>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-widest mt-1">
              "A caridade é o dever de todo homem que quer servir a Deus de coração." — Allan Kardec
            </p>
          </div>
          <button
            onClick={generateSocialPdfReport}
            className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-rose-100 transition-all cursor-pointer border border-transparent"
          >
            <Printer size={16} />
            <span>Emitir Relatório de Cobertura (PDF)</span>
          </button>
        </div>

        {/* PILLS NAVIGATION */}
        <div className="flex overflow-x-auto whitespace-nowrap gap-2 bg-rose-50/50 p-1.5 rounded-2xl border border-rose-100/50 scrollbar-none w-full">
          <button
            onClick={() => setSocialActiveTab('painel')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'painel' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Activity size={15} />
            <span>Painel Social</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('assistidos')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'assistidos' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Users size={15} />
            <span>Assistidos & Famílias</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('atendimentos')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'atendimentos' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Handshake size={15} />
            <span>Acolhimento & Atendimentos</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('doacoes')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'doacoes' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Package size={15} />
            <span>Estoque & Doações</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('cestas')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'cestas' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <QrCode size={15} />
            <span>Cestas Básicas</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('visitas')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'visitas' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <MapPin size={15} />
            <span>Visitas Fraternas</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('campanhas_projetos')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'campanhas_projetos' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Award size={15} />
            <span>Oficinas & Projetos</span>
          </button>
          <button
            onClick={() => setSocialActiveTab('voluntarios')}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 py-3 px-5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              socialActiveTab === 'voluntarios' ? "bg-rose-600 text-white shadow-sm" : "text-rose-700 hover:bg-rose-100/50"
            )}
          >
            <Users size={15} />
            <span>Equipe & Escalas</span>
          </button>
        </div>

        {/* --- MAIN TAB CONTENT RENDERERS --- */}

        {/* 1. PAINEL SOCIAL TAB */}
        {socialActiveTab === 'painel' && (
          <div className="space-y-6">
            {/* STAT CARDS BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm text-left">
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Famílias Ativas</span>
                <h3 className="text-3xl font-black text-rose-800 tracking-tight mt-1">{totalFamilies}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-2">Acompanhadas continuadamente</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm text-left">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Vulnerabilidade Alta</span>
                <h3 className="text-3xl font-black text-red-700 tracking-tight mt-1">{highVulnerabilityCount}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-2">Nível crítico de atendimento imediato</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm text-left">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Insegurança Alimentar</span>
                <h3 className="text-3xl font-black text-amber-600 tracking-tight mt-1">{criticalFoodCount}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-2">Famílias em situação de insegurança grave</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm text-left">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Cestas Entregues (Mês)</span>
                <h3 className="text-3xl font-black text-emerald-700 tracking-tight mt-1">{totalBasketsDelivered}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-2">Com recibo digital assinado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* INTERACTIVE SOCIAL MAP */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-rose-100 p-6 text-left">
                <div className="flex items-center justify-between border-b border-rose-50 pb-4 mb-4">
                  <h3 className="text-base font-black text-rose-800 tracking-tight flex items-center gap-2">
                    <MapPin size={18} />
                    Mapa Crítico e Distribuição Territorial de Vulnerabilidade
                  </h3>
                  <span className="text-[9px] bg-rose-550/10 text-rose-600 px-3 py-1 rounded-full font-black uppercase">Filtro: Bairros</span>
                </div>
                
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                  Mapeamento socioeconômico interativo representativo de Mirante do Sul para atuação das equipes de Visitas Fraternas da casa espírita.
                </p>

                {/* VISUAL CELL MATRIX MAP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-red-800">Vila da Paz</span>
                      <span className="px-2 py-0.5 bg-red-200/55 rounded-full text-[8.5px] font-black text-red-700 uppercase">Alta Crítica</span>
                    </div>
                    <h4 className="text-2xl font-black text-red-900 mt-2">
                      {socialAssistidos.filter(a => a.neighborhood === 'Vila da Paz').length} Famílias
                    </h4>
                    <p className="text-[9.5px] text-red-700 font-medium mt-2">Foco: Extracuidado médico e nebulizações. Renda média sub-salário.</p>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-150 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-amber-800">Morro da Glória</span>
                      <span className="px-2 py-0.5 bg-amber-200/55 rounded-full text-[8.5px] font-black text-amber-700 uppercase">Média Crítica</span>
                    </div>
                    <h4 className="text-2xl font-black text-amber-900 mt-2">
                      {socialAssistidos.filter(a => a.neighborhood === 'Morro da Glória').length} Famílias
                    </h4>
                    <p className="text-[9.5px] text-amber-700 font-medium mt-2">Foco: Inclusão em cursos fraternos e oficinas de capacitação de enxoval.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-800">Centro / Urbano</span>
                      <span className="px-2 py-0.5 bg-blue-200/55 rounded-full text-[8.5px] font-black text-blue-700 uppercase">Moderada</span>
                    </div>
                    <h4 className="text-2xl font-black text-blue-900 mt-2">
                      {socialAssistidos.filter(a => a.neighborhood === 'Centro').length} Famílias
                    </h4>
                    <p className="text-[9.5px] text-blue-700 font-medium mt-2">Foco: Combate à solidão de idosos, visitas fraternas semanais domiciliares.</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl border border-dashed border-rose-150 bg-rose-50/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-rose-800 block">Encaminhamento Geográfico Automatizado</span>
                    <span className="text-[10px] text-gray-500 font-medium block">Roteiro ideal otimizado para o mutirão de entrega de cobertores de sábado.</span>
                  </div>
                  <button 
                    onClick={() => alert('📍 Roteamento calculado! Visite Vila da Paz -> Morro da Glória sequencialmente para poupar custos.')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer"
                  >
                    Gerar Rota Otimizada
                  </button>
                </div>
              </div>

              {/* SECURITY & LGPD ACCESS AUDITING */}
              <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 text-left space-y-4">
                <div className="border-b border-rose-50 pb-4">
                  <h3 className="text-base font-black text-rose-800 tracking-tight flex items-center gap-2">
                    <Shield size={18} className="text-rose-600" />
                    LGPD: Segurança de Prontuários
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Conformidade rígida e sigilo profissional</p>
                </div>

                <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-150 flex items-start gap-2.5">
                  <Lock size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-rose-700 font-mediun leading-relaxed">
                    Toda consulta de dados sensíveis (Renda, Prontuário Médico Espírita, Observações de Foros Especiais) requer desbloqueio explícito com emissão de <strong>tráfego auditado inviolável</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Registro de Tráfego de Auditoria</span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none pr-1">
                    {socialAuditLogs.length === 0 ? (
                      <span className="text-xs text-gray-400 font-medium block italic text-center py-4">Nenhum log de acesso gerado.</span>
                    ) : (
                      socialAuditLogs.map(log => (
                        <div key={log.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-left text-[10px] relative font-sans">
                          <div className="flex justify-between font-black text-gray-700">
                            <span>{log.user}</span>
                            <span className="text-gray-400 font-normal">{log.date}</span>
                          </div>
                          <p className="text-rose-600 font-semibold mt-1">{log.action}</p>
                          <p className="text-gray-400 font-normal mt-0.5">{log.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ASSISTIDOS & FAMÍLIAS TAB */}
        {socialActiveTab === 'assistidos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            {/* CARDS LIST AREA */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 text-rose-555" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome, CPF ou bairro..."
                    className="w-full pl-9 h-10 bg-white border border-rose-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-450"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingAssistidoId(null);
                    clearAssistidoForm();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-150 rounded-xl font-bold text-xs uppercase"
                >
                  Limpar / Novo Formulário
                </button>
              </div>

              <div className="space-y-4">
                {filteredAssistidos.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 border border-dashed text-gray-405 border-gray-200 rounded-3xl">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <span className="text-xs font-bold block">Nenhuma ficha localizada com este critério de pesquisa.</span>
                  </div>
                ) : (
                  filteredAssistidos.map(as => {
                    const isUnlocked = unlockedSocialId === as.id;
                    return (
                      <div key={as.id} className="p-6 bg-white rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-3 max-w-xl">
                          <div className="flex gap-2 items-center flex-wrap">
                            <h4 className="text-base font-black text-rose-900">{as.name}</h4>
                            <span className={cn(
                              "text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                              as.vulnerabilityLevel === 'Alta' ? "bg-red-50 text-red-700 border-red-100" :
                              as.vulnerabilityLevel === 'Média' ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-emerald-50 text-emerald-700 border-emerald-100"
                            )}>
                              Vulnerabilidade {as.vulnerabilityLevel}
                            </span>
                            {as.hasChildrenUnder12 && (
                              <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[8.5px] font-black px-2 py-0.5 rounded-full">Possui Crianças</span>
                            )}
                            {as.hasElderly && (
                              <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[8.5px] font-black px-2 py-0.5 rounded-full">Possui Idosos Residente</span>
                            )}
                          </div>

                          {/* Grid indicators */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-[11px] text-gray-400 font-medium">
                            <span><strong>CPF:</strong> {as.cpf || "Não cadastrado"}</span>
                            <span><strong>Nascimento:</strong> {as.birthDate ? new Date(as.birthDate).toLocaleDateString('pt-BR') : '-'}</span>
                            <span><strong>Telefone:</strong> {as.phone || '-'}</span>
                            <span><strong>Bairro:</strong> {as.neighborhood}</span>
                            <span><strong>Residência:</strong> {as.housingStatus}</span>
                            <span><strong>Composição:</strong> {as.memberCount} integrantes</span>
                            <span><strong>Ocupação:</strong> {as.occupation}</span>
                            <span><strong>Social:</strong> {as.socialBenefits}</span>
                            <span><strong>Renda:</strong> R$ {as.familyIncome.toFixed(2)}</span>
                          </div>

                          {/* Locked Confidential Fields */}
                          <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100 text-left font-sans text-xs space-y-1.5 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest flex items-center gap-1">
                                <Lock size={12} /> Prontuário Médico-Fraterno Confidencial
                              </span>
                              {!isUnlocked && (
                                <button
                                  onClick={() => handleAuditAccess(as.id, as.name)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-[9px] uppercase cursor-pointer"
                                >
                                  🔐 Revelar Prontuário
                                </button>
                              )}
                            </div>

                            {isUnlocked ? (
                              <div className="space-y-2 mt-1 animate-in fade-in duration-300">
                                <p className="text-gray-600 leading-relaxed font-semibold">
                                  <strong>Necessidades Especiais / Saúde:</strong> {as.specialNeeds || "Sem observações adicionais."}
                                </p>
                                <p className="text-rose-800 leading-relaxed font-semibold border-t border-rose-100/50 pt-1.5">
                                  <strong>Parecer Social & Espiritual:</strong> {as.fraternalNotes || "Ficha sem notas fraternas."}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-300 italic font-medium mt-1 select-none pointer-events-none filter blur-[2px] tracking-widest">
                                Prontuário sob chaves de auditoria criptográfica e lei de proteção de sigilo social local.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col justify-end gap-2 pr-1 shrink-0">
                          <button
                            onClick={() => handleShowSocialQRCode(as)}
                            className="p-3.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-700 border border-emerald-100 cursor-pointer flex items-center justify-center"
                            title="Gerar / Ver Carteirinha QR"
                          >
                            <QrCode size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingAssistidoId(as.id);
                              setNewAsName(as.name);
                              setNewAsCpf(as.cpf);
                              setNewAsBirthDate(as.birthDate);
                              setNewAsPhone(as.phone);
                              setNewAsAddress(as.address);
                              setNewAsNeighborhood(as.neighborhood);
                              setNewAsCity(as.city);
                              setNewAsIsFamilyHead(as.isFamilyHead);
                              setNewAsFamilyHeadName(as.familyHeadName);
                              setNewAsMemberCount(as.memberCount);
                              setNewAsHousingStatus(as.housingStatus);
                              setNewAsSchooling(as.schooling);
                              setNewAsOccupation(as.occupation);
                              setNewAsFamilyIncome(as.familyIncome);
                              setNewAsSpecialNeeds(as.specialNeeds || '');
                              setNewAsFraternalNotes(as.fraternalNotes || '');
                              setNewAsEmploymentStatus(as.employmentStatus || 'Desempregado');
                              setNewAsSocialBenefits(as.socialBenefits || 'Nenhum');
                              setNewAsFoodSecurity(as.foodSecurity || 'Regular');
                              setNewAsHealthStatus(as.healthStatus || 'Sadio');
                              setNewAsEmotionalStatus(as.emotionalStatus || 'Estável');
                              setNewAsVulnerabilityLevel(as.vulnerabilityLevel || 'Média');
                              setNewAsHasChildrenUnder12(as.hasChildrenUnder12 || false);
                              setNewAsHasElderly(as.hasElderly || false);
                            }}
                            className="p-3.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-700 border border-rose-150 cursor-pointer"
                            title="Editar Ficha"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAssistido(as.id, as.name)}
                            className="p-3.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-650 cursor-pointer border border-red-100"
                            title="Excluir Ficha"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* FORM WRITING AREA */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <h3 className="text-base font-black text-rose-800 tracking-tight flex items-center gap-1.5 pb-2 border-b border-rose-50">
                <Sparkles size={16} className="text-rose-600" />
                {editingAssistidoId ? "Editar Cadastro Assistido" : "Nova Ficha Socioeconômica"}
              </h3>

              <div className="space-y-3 font-sans text-xs text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newAsName}
                    onChange={(e) => setNewAsName(e.target.value)}
                    placeholder="Ex: Maria das Dores Silva"
                    className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">CPF</label>
                    <input
                      type="text"
                      value={newAsCpf}
                      onChange={(e) => setNewAsCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data Nascimento</label>
                    <input
                      type="date"
                      value={newAsBirthDate}
                      onChange={(e) => setNewAsBirthDate(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Celular / Whats</label>
                    <input
                      type="text"
                      value={newAsPhone}
                      onChange={(e) => setNewAsPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Membros Residência</label>
                    <input
                      type="number"
                      value={newAsMemberCount}
                      onChange={(e) => setNewAsMemberCount(Number(e.target.value))}
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Bairro</label>
                    <input
                      type="text"
                      value={newAsNeighborhood}
                      onChange={(e) => setNewAsNeighborhood(e.target.value)}
                      placeholder="Vila da Paz"
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Renda Familiar</label>
                    <input
                      type="number"
                      value={newAsFamilyIncome}
                      onChange={(e) => setNewAsFamilyIncome(Number(e.target.value))}
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Vulnerabilidade</label>
                    <select
                      value={newAsVulnerabilityLevel}
                      onChange={(e) => setNewAsVulnerabilityLevel(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                    >
                      <option value="Alta">Alta Crítica</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Insegurança Alimento</label>
                    <select
                      value={newAsFoodSecurity}
                      onChange={(e) => setNewAsFoodSecurity(e.target.value)}
                      className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                    >
                      <option value="Grave">Grave (Sem mantimentos)</option>
                      <option value="Moderada">Moderada</option>
                      <option value="Regular">Regular / Segura</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Benefícios Recebidos</label>
                  <select
                    value={newAsSocialBenefits}
                    onChange={(e) => setNewAsSocialBenefits(e.target.value)}
                    className="w-full h-9 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Bolsa Família">Bolsa Família / Estadual</option>
                    <option value="BPC">BPC (Benefício Prestação Continuada)</option>
                    <option value="Nenhum">Nenhum auxílio ou benefício social</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAsHasChildrenUnder12}
                      onChange={(e) => setNewAsHasChildrenUnder12(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[10.5px] font-bold text-gray-600">Possui Crianças</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAsHasElderly}
                      onChange={(e) => setNewAsHasElderly(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[10.5px] font-bold text-gray-600">Possui Idosos</span>
                  </label>
                </div>

                {/* Secure Notes input */}
                <div>
                  <label className="text-[10px] font-black uppercase text-rose-800 block mb-1 flex items-center gap-1">
                     <Lock size={12} /> Parecer Médico-Fraterno Confidencial
                  </label>
                  <textarea
                    value={newAsFraternalNotes}
                    onChange={(e) => setNewAsFraternalNotes(e.target.value)}
                    rows={2}
                    placeholder="Reflexo espiritual, fragilidades emocionais internas identificadas ou preces especiais necessárias..."
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl font-semibold resize-none focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Doenças / Vulnerabilidade física</label>
                  <textarea
                    value={newAsSpecialNeeds}
                    onChange={(e) => setNewAsSpecialNeeds(e.target.value)}
                    rows={2}
                    placeholder="Mateus possui asma severa, necessita de bombinhas ou ajuda emergencial de higiene..."
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl font-semibold resize-none focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAddAssistido}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer mt-2"
                >
                  {editingAssistidoId ? "Salvar Alterações Ficha" : "Gravar Cadastro Criptografado"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. ACOLHIMENTO & ATENDIMENTOS TAB */}
        {socialActiveTab === 'atendimentos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">Histórico de Atendimentos Consolidado</span>
              <div className="space-y-3">
                {socialAtendimentos.map(at => (
                  <div key={at.id} className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm relative text-xs text-left">
                    <div className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2 font-black">
                      <div className="space-y-0.5">
                        <span className="text-rose-800 font-extrabold text-sm block">{at.assistidoName}</span>
                        <span className="text-[9.5px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">{at.type}</span>
                      </div>
                      <span className="text-gray-400 mt-1 font-semibold">{at.date}</span>
                    </div>
                    
                    <div className="space-y-1.5 font-medium text-gray-500">
                      <p><strong>Triagem de Necessidade:</strong> {at.needIdentified}</p>
                      <p><strong>Encaminhamento Efetuado:</strong> {at.forwarding}</p>
                      {at.observations && (
                        <p className="text-rose-700 bg-rose-50/10 p-2 rounded-xl border border-rose-100/30">
                          <strong>Preces & Acolhimento Fraterno:</strong> {at.observations}
                        </p>
                      )}
                      {at.nextFollowUp && <p className="text-[10.5px]"><strong>Próximo Acompanhamento Agendado:</strong> {at.nextFollowUp}</p>}
                    </div>

                    <div className="absolute right-4 bottom-4 flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEditSocialAtendimento(at)}
                        className="p-2.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer border border-transparent hover:border-rose-150 transition-colors"
                        title="Editar Registro"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSocialAtendimento(at.id)}
                        className="p-2.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer border border-transparent hover:border-red-150 transition-colors"
                        title="Excluir Registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialAtendId ? "✏️ Editar Acolhimento" : "Acolhimento Fraterno Social"}
              </span>
              <div className="space-y-3 text-xs text-left">
                {editingSocialAtendId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialAtendId(null);
                        setNewSoAtendAssistId('');
                        setNewSoAtendResp('');
                        setNewSoAtendNeed('');
                        setNewSoAtendForward('');
                        setNewSoAtendObs('');
                        setNewSoAtendNextDate('');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Selecionar Assistido</label>
                  <select
                    value={newSoAtendAssistId}
                    onChange={(e) => setNewSoAtendAssistId(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="">-- Escolha um assistido catalogado --</option>
                    {socialAssistidos.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Tipo de Acolhimento</label>
                  <select
                    value={newSoAtendType}
                    onChange={(e) => setNewSoAtendType(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Cesta básica">Assistência Alimentar (Cesta Básica)</option>
                    <option value="Apoio espiritual">Apoio Espiritual Fraterno</option>
                    <option value="Apoio psicológico">Triagem de Amparo Emocional</option>
                    <option value="Orientação social">Oficina de Capacitação / Costura</option>
                    <option value="Auxílio emergencial">Auxílio Vestuário / Enxoval Emergencial</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Responsável pelo Acolhimento</label>
                  <input
                    type="text"
                    value={newSoAtendResp}
                    onChange={(e) => setNewSoAtendResp(e.target.value)}
                    placeholder="Ex: Clarice Lisbôa"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Necessidade Primária Identificada</label>
                  <textarea
                    value={newSoAtendNeed}
                    onChange={(e) => setNewSoAtendNeed(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Encaminhamento Realizado</label>
                  <textarea
                    value={newSoAtendForward}
                    onChange={(e) => setNewSoAtendForward(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-rose-800 tracking-wide block mb-1">Acompanhamento de Amparo Emocional (Opcional)</label>
                  <textarea
                    value={newSoAtendObs}
                    onChange={(e) => setNewSoAtendObs(e.target.value)}
                    rows={2}
                    placeholder="Estado de espírito, prece consoladora oferecida na hora..."
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">Acompanhamento Social (Próxima Data)</label>
                  <input
                    type="date"
                    value={newSoAtendNextDate}
                    onChange={(e) => setNewSoAtendNextDate(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3"
                  />
                </div>

                <button
                  onClick={handleAddSocialAtendimento}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialAtendId ? "Salvar Alterações" : "Confirmar Acolhimento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. DONATIVOS & ESTOQUE TAB */}
        {socialActiveTab === 'doacoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 space-y-4 w-full overflow-hidden">
              <span className="text-[10px] font-black uppercase text-rose-800 block">Detalhamento Físico de Estoque de Amor</span>
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden text-xs text-left">
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-rose-50/50 border-b border-rose-100 font-black text-rose-800">
                        <th className="p-3 text-left">Categoria</th>
                        <th className="p-3 text-left">Especificação</th>
                        <th className="p-3 text-left">Qtd Disponível</th>
                        <th className="p-3 text-left">Doador / Origem</th>
                        <th className="p-3 text-left">Entrada em</th>
                        <th className="p-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-sans">
                      {socialDoacoes.map(don => (
                        <tr key={don.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-extrabold text-rose-800">{don.type}</td>
                          <td className="p-3 font-semibold text-gray-700">{don.description}</td>
                          <td className="p-3 font-black text-gray-900">{don.qty} {don.unit}</td>
                          <td className="p-3 text-gray-500 font-medium">{don.donor}</td>
                          <td className="p-3 text-gray-400">{don.entryDate}</td>
                          <td className="p-3 flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditSocialDoacao(don)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Editar Donativo"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSocialDoacao(don.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Descartar / Ajustar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialDoacaoId ? "✏️ Editar Donativo" : "Receber Donativo"}
              </span>
              <div className="space-y-3 text-xs text-left font-sans">
                {editingSocialDoacaoId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialDoacaoId(null);
                        setNewSoDoacaoDesc('');
                        setNewSoDoacaoQty(1);
                        setNewSoDoacaoDonor('');
                        setNewSoDoacaoExpiry('');
                        setNewSoDoacaoResponsible('');
                        setNewSoDoacaoEntryDate('');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Categoria do Donativo</label>
                  <select
                    value={newSoDoacaoType}
                    onChange={(e) => setNewSoDoacaoType(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Alimentos">Alimentos Cesta-básica</option>
                    <option value="Roupas">Cobertores / Agasalhos</option>
                    <option value="Calçados">Calçados de Triagem</option>
                    <option value="Higiene">Higiene / Fralda</option>
                    <option value="Recursos financeiros">Fundo de Financiamento Emergencial</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Especificação Física</label>
                  <input
                    type="text"
                    value={newSoDoacaoDesc}
                    onChange={(e) => setNewSoDoacaoDesc(e.target.value)}
                    placeholder="Arroz Tipo 5kg / Fralda Turma da Mônica M..."
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Quantidade</label>
                    <input
                      type="number"
                      value={newSoDoacaoQty}
                      onChange={(e) => setNewSoDoacaoQty(Number(e.target.value))}
                      className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Unidade</label>
                    <select
                      value={newSoDoacaoUnit}
                      onChange={(e) => setNewSoDoacaoUnit(e.target.value)}
                      className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                    >
                      <option value="kg">Quilos (kg)</option>
                      <option value="un">Unidades (un)</option>
                      <option value="fardos">Fardos fechados</option>
                      <option value="caixas">Caixas fechados</option>
                      <option value="R$">Recurso Monetário (R$)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Doador da Causa</label>
                  <input
                    type="text"
                    value={newSoDoacaoDonor}
                    onChange={(e) => setNewSoDoacaoDonor(e.target.value)}
                    placeholder="Ex: Comunidade Mirante de Luz"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Cadastrador / Voluntário</label>
                  <input
                    type="text"
                    value={newSoDoacaoResponsible}
                    onChange={(e) => setNewSoDoacaoResponsible(e.target.value)}
                    placeholder="Ex: Francisco André"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Data de Entrada</label>
                  <input
                    type="date"
                    value={newSoDoacaoEntryDate}
                    onChange={(e) => setNewSoDoacaoEntryDate(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3"
                  />
                </div>

                <button
                  onClick={handleAddSocialDoacao}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialDoacaoId ? "Salvar Alterações" : "Registrar Doação de Entrada"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. CESTAS BÁSICAS TAB */}
        {socialActiveTab === 'cestas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left relative">
            
            {/* REAL-TIME CAMERA SCANNER MODAL OUTLET */}
            {socialIsScanningQr && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-950 text-white p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4 relative text-center shadow-2xl">
                  
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3 font-sans">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <QrCode size={15} />
                      Scanner Geral de Carteiras
                    </h4>
                    <button
                      onClick={() => setSocialIsScanningQr(false)}
                      className="text-slate-400 hover:text-white text-xs font-black p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {socialScannedFamilyName ? (
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Aguardando leitura do QR Code de <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded">{socialScannedFamilyName}</strong>...
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Escale ou aproxime a carteirinha com o QR Code de <strong>qualquer assistido/família</strong> para computar o despacho automático da cesta!
                    </p>
                  )}
                  
                  {/* Real Camera Viewport */}
                  <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl bg-neutral-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-center p-1 shadow-inner max-w-sm mx-auto">
                    <div id="social-qr-reader-viewport" className="w-full h-full object-cover rounded-xl overflow-hidden" />

                    {socialCameraActive && (
                      <>
                        {/* Animated laser scan lines */}
                        <div className="absolute inset-x-0 h-0.5 bg-emerald-555 shadow-[0_0_8px_rgba(16,185,129,0.8)] top-1/4 animate-bounce duration-[2000ms] z-10 pointer-events-none" />
                        
                        {/* Target scan brackets */}
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-md z-10 pointer-events-none" />
                        <div className="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-md z-10 pointer-events-none" />
                        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-md z-10 pointer-events-none" />
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-md z-10 pointer-events-none" />
                      </>
                    )}

                    {!socialCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3 z-20">
                        {socialCameraError ? (
                          <>
                            <AlertTriangle size={32} className="text-amber-500 mx-auto" />
                            <p className="text-[11px] text-gray-200 font-extrabold uppercase tracking-widest max-w-xs">{socialCameraError}</p>
                          </>
                        ) : (
                          <>
                            <QrCode size={40} className="mx-auto text-emerald-400 animate-pulse" />
                            <p className="text-xs text-white font-extrabold uppercase tracking-widest animate-pulse">Iniciando câmera segura...</p>
                            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed px-4 mx-auto">
                              Aguardando permissão de câmera do navegador do celular.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual testing options (as an elegant backup just in case) */}
                  <div className="space-y-2 p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left font-sans">
                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Testar via ID / Nome direto (Local Sandbox)</span>
                    <p className="text-[9px] text-slate-400">Escolha uma família abaixo para simular o recebimento instantâneo:</p>
                    <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 text-left text-xs pt-1">
                      {socialAssistidos.length === 0 ? (
                        <p className="text-[10px] text-center text-slate-500 py-2 italic font-bold">Nenhum assistido cadastrado!</p>
                      ) : (
                        socialAssistidos.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              const updated = [
                                ...socialCestasEntregas,
                                {
                                  id: `sc_${Date.now()}`,
                                  assistidoId: a.id,
                                  assistidoName: a.name,
                                  date: new Date().toISOString().split('T')[0],
                                  basketType: 'Padrão (QR Código)',
                                  responsible: currentUser?.name || 'Distribuidor Voluntário',
                                  signatureConfirmed: true,
                                  qrCodeScanned: true
                                }
                              ];
                              setSocialCestasEntregas(updated);
                              localStorage.setItem('social_cestas', JSON.stringify(updated));
                              alert(`✅ QR Code de ${a.name} validado com sucesso! Recebimento de Cesta cadastrado!`);
                              setSocialIsScanningQr(false);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-lg text-left text-[11px] font-bold text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="truncate">{a.name}</span>
                            <span className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-bold shrink-0">Burlar Scan →</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSocialIsScanningQr(false)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Abortar Leitura e Fechar Câmera
                  </button>
                </div>
              </div>
            )}

            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="space-y-0.5 max-w-xl">
                  <span className="text-xs font-black text-emerald-800 block">Diferencial Tecnológico Social: Carteiras Sociais QR Code</span>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    Cada assistido cadastrado na casa recebe uma carteirinha impermeável com seu QR Code contendo chaves LGPD seguras. A validação por câmera elimina guias físicas de papel de recebimento!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerQrScanner('')}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md hover:shadow-emerald-100 transition-all cursor-pointer shrink-0"
                >
                  <QrCode size={14} />
                  📱 Abrir Leitor por Câmera
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden text-xs text-left">
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-rose-50/50 border-b border-rose-100 font-black text-rose-800">
                        <th className="p-3 text-left">Nº Ficha</th>
                        <th className="p-3 text-left">Assistido Beneficiário</th>
                        <th className="p-3 text-left">Tipo Cesta</th>
                        <th className="p-3 text-left">Data de Entrega</th>
                        <th className="p-3 text-left">Disparador / Recibo</th>
                        <th className="p-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {socialCestasEntregas.map(sc => (
                        <tr key={sc.id} className="hover:bg-gray-50/50">
                          <td className="p-3 text-gray-500 font-bold font-mono">{sc.id.slice(0, 8)}</td>
                          <td className="p-3 font-extrabold text-rose-800">{sc.assistidoName}</td>
                          <td className="p-3 font-semibold text-gray-750">{sc.basketType}</td>
                          <td className="p-3 text-gray-400">{sc.date}</td>
                          <td className="p-3 font-black">
                            {sc.qrCodeScanned ? (
                              <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-extrabold text-[9.5px]">📱 Validado via QR Scanner</span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 font-extrabold text-[9.5px]">✍️ Assinatura em Terminal</span>
                            )}
                          </td>
                          <td className="p-3 flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditSocialCesta(sc)}
                              className="p-1 px-2 hover:bg-rose-50 text-rose-650 rounded-lg cursor-pointer"
                              title="Editar Entrega"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSocialCestaEntrega(sc.id)}
                              className="p-1 px-2 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                              title="Remover Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIST OF REGISTERED ASSISTIDOS INTEGRATOR TO INITIATE QR SIMULATION */}
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-rose-100 text-left">
                <span className="text-xs font-black text-rose-800 block uppercase">Despacho de Cesta Básica por Família Ativa</span>
                <span className="text-[10px] text-gray-400 font-medium block">Inicie a validação rápida da entrega utilizando o simulação por QR Code.</span>
                <div className="space-y-2 mt-3 max-h-[220px] overflow-y-auto">
                  {socialAssistidos.map(a => (
                    <div key={a.id} className="p-3 rounded-xl border border-gray-150 flex items-center justify-between hover:bg-gray-50/50 font-sans text-xs">
                      <div>
                        <span className="font-extrabold text-gray-800 block">{a.name}</span>
                        <span className="text-[10px] text-gray-400">Bairro: {a.neighborhood} • Vulnerabilidade: {a.vulnerabilityLevel}</span>
                      </div>
                      <button
                        onClick={() => triggerQrScanner(a.name)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[9px] uppercase cursor-pointer"
                      >
                        <QrCode size={13} />
                        📱 Validar via QR-Code
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialCestaId ? "✏️ Editar Saída" : "Lançar Recibo Manual"}
              </span>
              <div className="space-y-3 text-xs text-left font-sans">
                {editingSocialCestaId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialCestaId(null);
                        setNewSoCestaAssistId('');
                        setNewSoCestaResp('');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Família Beneficiada</label>
                  <select
                    value={newSoCestaAssistId}
                    onChange={(e) => setNewSoCestaAssistId(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="">-- Assinale a Família --</option>
                    {socialAssistidos.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Composição Cesta</label>
                  <select
                    value={newSoCestaType}
                    onChange={(e) => setNewSoCestaType(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Padrão">Padrão Alimentar da Casa (12 Itens)</option>
                    <option value="Especial (Suplementada)">Cesta Especial (Com complementos)</option>
                    <option value="Infantil">Foco Alimentar Infantil (Leites / Cereais)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Responsável pela Entrega</label>
                  <input
                    type="text"
                    value={newSoCestaResp}
                    onChange={(e) => setNewSoCestaResp(e.target.value)}
                    placeholder="Ex: Francisco André"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <button
                  onClick={handleAddSocialCestaEntrega}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialCestaId ? "Salvar Alterações" : "Registrar Saída com Assinatura Digital"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. VISITAS FRATERNAS TAB */}
        {socialActiveTab === 'visitas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] font-black uppercase text-rose-800 block">Pareceres das Visitas Fraternas Concluídas</span>
              <div className="space-y-3">
                {socialVisitas.map(svi => (
                  <div key={svi.id} className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm relative text-xs text-left">
                    <div className="flex justify-between items-start border-b border-gray-50 pb-2 mb-2">
                      <div className="space-y-0.5">
                        <span className="text-rose-800 font-extrabold text-sm block">{svi.assistidoName}</span>
                        <span className="text-[10px] text-gray-400">Visitado por: {svi.responsible}</span>
                      </div>
                      <span className="text-gray-400 font-semibold">{svi.date}</span>
                    </div>

                    <div className="space-y-2 text-gray-600 font-medium leading-relaxed font-sans">
                      <p><strong>Situação Encontrada na Residência:</strong> {svi.situationFound}</p>
                      <p><strong>Necessidades Materiais / Espirituais Observadas:</strong> {svi.needsObserved}</p>
                      {svi.forwarding && (
                        <p className="text-rose-700 bg-rose-50/10 p-2.5 rounded-xl border border-rose-100/30">
                          <strong>Previdências / Encaminhamentos de Amparo:</strong> {svi.forwarding}
                        </p>
                      )}
                    </div>

                    <div className="absolute right-4 bottom-4 flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEditSocialVisita(svi)}
                        className="p-2.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer border border-transparent hover:border-rose-150 transition-colors"
                        title="Editar Parecer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSocialVisita(svi.id)}
                        className="p-2.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer border border-transparent hover:border-red-150 transition-colors"
                        title="Excluir Parecer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialVisitaId ? "✏️ Editar Visita" : "Planejar / Logar Visita"}
              </span>
              <div className="space-y-3 text-xs text-left font-sans">
                {editingSocialVisitaId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between font-sans">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialVisitaId(null);
                        setNewSoVisitaAssistId('');
                        setNewSoVisitaResp('');
                        setNewSoVisitaSituation('');
                        setNewSoVisitaNeeds('');
                        setNewSoVisitaForward('');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Residência do Assistido</label>
                  <select
                    value={newSoVisitaAssistId}
                    onChange={(e) => setNewSoVisitaAssistId(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="">-- Indique o assistido visitado --</option>
                    {socialAssistidos.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Membro Visitador Principal</label>
                  <input
                    type="text"
                    value={newSoVisitaResp}
                    onChange={(e) => setNewSoVisitaResp(e.target.value)}
                    placeholder="Ex: Carlos Roberto"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Situação / Condição Estrutural Encontrada</label>
                  <textarea
                    value={newSoVisitaSituation}
                    onChange={(e) => setNewSoVisitaSituation(e.target.value)}
                    placeholder="Ex: Alojado em rústica moradia. Sem forro higiênico, umidade aparente..."
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Necessidades Urgentes Diagnosticadas</label>
                  <textarea
                    value={newSoVisitaNeeds}
                    onChange={(e) => setNewSoVisitaNeeds(e.target.value)}
                    placeholder="Material de higiene escolar, repelente contra insetos, sabão..."
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Encaminhamento Solicitado</label>
                  <textarea
                    value={newSoVisitaForward}
                    onChange={(e) => setNewSoVisitaForward(e.target.value)}
                    placeholder="Indicação para tratamento médico espírita na Unidade de fluidoterapia espiritual..."
                    rows={2}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl"
                  />
                </div>

                <button
                  onClick={handleAddSocialVisita}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialVisitaId ? "Salvar Alterações" : "Registrar Ficha de Visita Concluída"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. OFICINAS & PROJETOS TAB */}
        {socialActiveTab === 'campanhas_projetos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] font-black uppercase text-rose-800 block">Projetos de Promoção e Desenvolvimento Humano Ativos</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-left">
                {socialProjetos.map(proj => (
                  <div key={proj.id} className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm relative flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                        <span className="font-extrabold text-rose-800 text-[13px] line-clamp-1">{proj.name}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[8.5px] font-black border border-emerald-100 uppercase">{proj.status}</span>
                      </div>
                      
                      <div className="space-y-1.5 leading-relaxed text-gray-500 font-medium font-sans">
                        <p><strong>Filosofia / Objetivo:</strong> {proj.objective}</p>
                        <p><strong>Público-Alvo:</strong> {proj.target}</p>
                        <p><strong>Professores / Coordenação:</strong> {proj.coordinator}</p>
                        <p><strong>Encontros / Horários:</strong> {proj.schedule}</p>
                        <p><strong>Alunos Matriculados:</strong> {proj.participantsCount} assistidos</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-2 shrink-0">
                      <button
                        onClick={() => alert(`Inscritos no projeto espírita ${proj.name} salvos em prontuários.`)}
                        className="text-[9.5px] font-black uppercase text-rose-700 hover:underline animate-none"
                      >
                        Visualizar Lista Presença
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditSocialProjeto(proj)}
                          className="text-rose-600 hover:text-rose-755 p-1 rounded cursor-pointer"
                          title="Editar Iniciativa"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteSocialProjeto(proj.id)}
                          className="text-red-500 hover:text-red-650 p-1 rounded cursor-pointer"
                          title="Encerrar Projeto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialProjetoId ? "✏️ Editar Iniciativa" : "Criar Nova Iniciativa"}
              </span>
              <div className="space-y-3 text-xs text-left font-sans">
                {editingSocialProjetoId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between font-sans">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialProjetoId(null);
                        setNewSoProjName('');
                        setNewSoProjObjective('');
                        setNewSoProjTarget('');
                        setNewSoProjCoordinator('');
                        setNewSoProjSchedule('');
                        setNewSoProjStatus('Planejado');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nome da Oficina / Curso</label>
                  <input
                    type="text"
                    value={newSoProjName}
                    onChange={(e) => setNewSoProjName(e.target.value)}
                    placeholder="Ex: Curso de Cooperativa de Panificação"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Objetivo de Promoção Social</label>
                  <textarea
                    value={newSoProjObjective}
                    onChange={(e) => setNewSoProjObjective(e.target.value)}
                    placeholder="Fomentar geração de renda e fortalecimento espiritual pelo trabalho cooperado..."
                    rows={3}
                    className="w-full p-2.5 bg-gray-50 border border-rose-100 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Público-Alvo Específico</label>
                  <input
                    type="text"
                    value={newSoProjTarget}
                    onChange={(e) => setNewSoProjTarget(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Coordenador Pedagógico</label>
                  <input
                    type="text"
                    value={newSoProjCoordinator}
                    onChange={(e) => setNewSoProjCoordinator(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Horário & Frequência</label>
                  <input
                    type="text"
                    value={newSoProjSchedule}
                    onChange={(e) => setNewSoProjSchedule(e.target.value)}
                    placeholder="Sábados às 14h"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Status Base</label>
                  <select
                    value={newSoProjStatus}
                    onChange={(e) => setNewSoProjStatus(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Ativo">Matrículas e Aulas Ativas</option>
                    <option value="Planejado">Planejado</option>
                    <option value="Concluído">Encerrado e Certificado</option>
                  </select>
                </div>

                <button
                  onClick={handleAddSocialProjeto}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialProjetoId ? "Salvar Alterações" : "Registrar Projeto Cooperativo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. EQUIPE & VOLUNTÁRIOS TAB */}
        {socialActiveTab === 'voluntarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">Trabalhadores e Especialistas Sociais Escalados</span>
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden text-xs text-left">
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-rose-50/50 border-b border-rose-100 font-black text-rose-800">
                        <th className="p-3 text-left">Nome Trabalhador Espírita</th>
                        <th className="p-3 text-left">Área de Atuação</th>
                        <th className="p-3 text-left">Gama Disponibilidade</th>
                        <th className="p-3 text-left">Contato Interno</th>
                        <th className="p-3 text-left">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-sans font-medium text-gray-700">
                      {socialVoluntarios.map(vol => (
                        <tr key={vol.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-extrabold text-rose-800">{vol.name}</td>
                          <td className="p-3 text-rose-700 font-semibold">{vol.role}</td>
                          <td className="p-3 text-gray-500">{vol.availability}</td>
                          <td className="p-3 text-gray-400 font-mono">{vol.contact}</td>
                          <td className="p-3 flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditSocialVoluntario(vol)}
                              className="p-1 px-2 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Editar Voluntário"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSocialVoluntario(vol.id)}
                              className="p-1 px-2 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                              title="Desvincular Voluntário"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-rose-100 p-6 space-y-4">
              <span className="text-base font-black text-rose-800 tracking-tight flex items-center justify-between pb-2 border-b border-rose-50 uppercase">
                {editingSocialVoluntarioId ? "✏️ Editar Vínculo" : "Vincular Trabalhador"}
              </span>
              <div className="space-y-3 text-xs text-left font-sans">
                {editingSocialVoluntarioId && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] font-bold text-amber-800 flex items-center justify-between font-sans">
                    <span>Modificando registro</span>
                    <button
                      onClick={() => {
                        setEditingSocialVoluntarioId(null);
                        setNewSoVolName('');
                        setNewSoVolRole('Triagem e Avaliação');
                        setNewSoVolAvailability('Sábados e Domingos');
                        setNewSoVolContact('');
                      }}
                      className="p-1 px-2 text-[9px] text-amber-900 bg-amber-100 rounded hover:bg-amber-200 cursor-pointer flex items-center gap-1 uppercase tracking-wider font-extrabold font-sans"
                    >
                      <X size={10} /> Cancelar
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={newSoVolName}
                    onChange={(e) => setNewSoVolName(e.target.value)}
                    placeholder="Ex: Carlos Roberto Machado"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Atuação Primária</label>
                  <select
                    value={newSoVolRole}
                    onChange={(e) => setNewSoVolRole(e.target.value)}
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-2.5 font-semibold"
                  >
                    <option value="Triagem e Avaliação">Triagem e Acolhimento Social (Clarificação)</option>
                    <option value="Visitas Fraternas">Visitas Fraternas / Amparo domiciliar</option>
                    <option value="Logística de Donativos">Distribuição / Depósito Triagem</option>
                    <option value="Captação e Campanhas">Captação / Organização Rifa / Campanhas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Telefone Celular</label>
                  <input
                    type="text"
                    value={newSoVolContact}
                    onChange={(e) => setNewSoVolContact(e.target.value)}
                    placeholder="(11) 98000-0000"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Dia / Turnos Disponíveis</label>
                  <input
                    type="text"
                    value={newSoVolAvailability}
                    onChange={(e) => setNewSoVolAvailability(e.target.value)}
                    placeholder="Sábados e Domingos"
                    className="w-full h-10 bg-gray-50 border border-rose-100 rounded-xl px-3 font-semibold"
                  />
                </div>

                <button
                  onClick={handleAddSocialVoluntario}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                >
                  {editingSocialVoluntarioId ? "Salvar Alterações" : "Confirmar Vínculo Fraterno"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                {isEstudos && (
                  <>
                    <StatCard 
                      title="Cursos Ativos" 
                      value={studyCourses.length} 
                      icon={BookOpen} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Turmas de Estudo" 
                      value={studyClasses.length} 
                      icon={Award} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                      shadow="shadow-amber-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Alunos Matriculados" 
                      value={studyStudents.length} 
                      icon={Users} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isDoutrinario && (
                  <>
                    <StatCard 
                      title="Expositores Cadastrados" 
                      value={doutrinarioExpositores.length} 
                      icon={Users} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Palestras Agendadas" 
                      value={doutrinarioPalestras.length} 
                      icon={Calendar} 
                      color="text-purple-600" 
                      bg="bg-purple-50" 
                      shadow="shadow-purple-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Diretrizes Ativas" 
                      value={doutrinarioDiretrizes.length} 
                      icon={Search} 
                      color="text-rose-600" 
                      bg="bg-rose-50" 
                      shadow="shadow-rose-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isEvangelizacao && (
                  <>
                    <StatCard 
                      title="Ciclos / Faixa Etária" 
                      value={evangelizacaoRooms.length} 
                      icon={Smile} 
                      color="text-purple-600" 
                      bg="bg-purple-50" 
                      shadow="shadow-purple-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Evangelizandos" 
                      value={evangelizacaoKids.length} 
                      icon={Baby} 
                      color="text-sky-600" 
                      bg="bg-sky-50" 
                      shadow="shadow-sky-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Presentes Hoje" 
                      value={evangelizacaoKids.filter(k => k.presenceToday).length} 
                      icon={CheckCircle2} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isMediunica && (
                  <>
                    <StatCard 
                      title="Reuniões Mediúnicas" 
                      value={mediunicaGroups.length} 
                      icon={ShieldAlert} 
                      color="text-red-600" 
                      bg="bg-red-50" 
                      shadow="shadow-red-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Membros Escalados" 
                      value={mediunicaMembers.length} 
                      icon={Users} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Nível de Sigilo" 
                      value="Máximo" 
                      icon={Lock} 
                      color="text-amber-600" 
                      bg="bg-amber-50" 
                      shadow="shadow-amber-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isArte && (
                  <>
                    <StatCard 
                      title="Grupos Artísticos" 
                      value={arteGroups.length} 
                      icon={Palette} 
                      color="text-pink-600" 
                      bg="bg-pink-50" 
                      shadow="shadow-pink-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Cronograma de Ensaios" 
                      value={arteEnsaios.length} 
                      icon={Calendar} 
                      color="text-purple-600" 
                      bg="bg-purple-50" 
                      shadow="shadow-purple-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Repertório & Músicas" 
                      value={arteMusicas.length} 
                      icon={Music} 
                      color="text-emerald-600" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.2}
                    />
                  </>
                )}
                {isPasse && (
                  <>
                    <StatCard 
                      title="Atendimentos Hoje" 
                      value={passeAtendimentos.length} 
                      icon={Activity} 
                      color="text-sky-600" 
                      bg="bg-sky-50" 
                      shadow="shadow-sky-500/10"
                      delay={0}
                    />
                    <StatCard 
                      title="Passistas Cadastrados" 
                      value={passePassistas.length} 
                      icon={Users} 
                      color="text-emerald-650" 
                      bg="bg-emerald-50" 
                      shadow="shadow-emerald-500/10"
                      delay={0.1}
                    />
                    <StatCard 
                      title="Água Fluidificada" 
                      value={`${passeFluidoterapia.reduce((sum, item) => sum + Number(item.qty || 0), 0)}L`} 
                      icon={Sparkles} 
                      color="text-indigo-600" 
                      bg="bg-indigo-50" 
                      shadow="shadow-indigo-500/10"
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
                {isEstudos && renderEstudosDashboard()}
                {isDoutrinario && renderDoutrinarioDashboard()}
                {isEvangelizacao && renderEvangelizacaoDashboard()}
                {isMediunica && renderMediunicaDashboard()}
                {isArte && renderArteDashboard()}
                {isComunicacao && renderComunicacaoDashboard()}
                {isPasse && renderPasseDashboard()}
                {isSocial && renderSocialDashboard()}
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
                      Biblioteca, Manuais & Arquivos
                    </h2>
                    {canManageDocuments && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 pr-6 pl-4 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95 group"
                      >
                        <div className="p-1 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                          <UploadCloud size={16} />
                        </div>
                        <span>Subir Arquivo</span>
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.xlsb,.csv,.ppt,.pptx,.txt" 
                      className="hidden" 
                    />
                  </div>

                  <div className="bg-white rounded-[48px] border border-gray-50 shadow-sm overflow-hidden group/docs">
                    {sector?.documents && sector.documents.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {sector.documents.map((doc, idx) => {
                          // Dynamic icon selection logic
                          const getDocInfo = (name: string, type: string) => {
                            const n = name.toLowerCase();
                            const t = type?.toLowerCase() || '';
                            if (n.endsWith('.pdf') || t.includes('pdf')) {
                              return {
                                Icon: FileText,
                                colorClass: 'text-rose-600 bg-rose-50 border-rose-100/50',
                                shadowClass: 'shadow-rose-500/5',
                                typeLabel: 'PDF'
                              };
                            }
                            if (n.endsWith('.xls') || n.endsWith('.xlsx') || n.endsWith('.csv') || t.includes('excel') || t.includes('spreadsheet') || t.includes('csv')) {
                              return {
                                Icon: FileSpreadsheet,
                                colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
                                shadowClass: 'shadow-emerald-500/5',
                                typeLabel: 'Planilha'
                              };
                            }
                            if (n.endsWith('.doc') || n.endsWith('.docx') || t.includes('word') || t.includes('msword') || t.includes('officedocument.wordprocessingml')) {
                              return {
                                Icon: FileText,
                                colorClass: 'text-blue-600 bg-blue-50 border-blue-100/50',
                                shadowClass: 'shadow-blue-500/5',
                                typeLabel: 'Doc Word'
                              };
                            }
                            if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.gif') || n.endsWith('.webp') || n.endsWith('.svg') || t.includes('image/')) {
                              return {
                                Icon: Palette,
                                colorClass: 'text-amber-600 bg-amber-50 border-amber-100/50',
                                shadowClass: 'shadow-amber-500/5',
                                typeLabel: 'Imagem'
                              };
                            }
                            return {
                              Icon: Paperclip,
                              colorClass: 'text-purple-600 bg-purple-50 border-purple-100/50',
                              shadowClass: 'shadow-purple-500/5',
                              typeLabel: 'Arquivo'
                            };
                          };

                          const docInfo = getDocInfo(doc.name, doc.type);
                          const DocIcon = docInfo.Icon;

                          return (
                            <motion.div 
                              key={doc.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group/doc"
                            >
                              <div className="flex items-center gap-6">
                                <div className={cn(
                                  "w-16 h-16 rounded-[24px] flex items-center justify-center group-hover/doc:scale-110 transition-transform shadow-lg border",
                                  docInfo.colorClass,
                                  docInfo.shadowClass
                                )}>
                                  <DocIcon size={28} strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-lg font-black text-gray-900 leading-none">{doc.name}</h4>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                                     <span className="px-2 py-0.5 bg-gray-150 text-gray-600 font-extrabold text-[8px] uppercase tracking-wider rounded-md">
                                        {docInfo.typeLabel}
                                     </span>
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
                                  download={doc.name}
                                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-gray-100"
                                >
                                  <Eye size={16} />
                                  <span>Visualizar / Baixar</span>
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
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-24 text-center text-gray-300 space-y-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto border-2 border-dashed border-gray-200 group-hover/docs:scale-110 transition-transform duration-700">
                            <FileDown size={48} className="text-gray-100" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <p className="font-black uppercase tracking-widest text-[11px] text-gray-400">Repositório Vazio</p>
                            <p className="text-sm font-medium text-gray-400 mt-2 italic leading-relaxed">Nenhum documento, PDF, planilha ou imagem foi catalogado para este setor dinâmico ainda.</p>
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
            <div className="overflow-x-auto w-full max-w-full rounded-2xl">
              <div className="border border-black text-[9px] font-mono leading-none bg-white font-sans text-gray-850 p-2 space-y-1.5 min-w-[650px]">
              
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

      {/* Individual Social QR Code & Carteirinho Card Modal */}
      <AnimatePresence>
        {socialQrModalOpen && socialQrModalItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative border border-rose-100 flex flex-col items-center text-center space-y-6"
            >
              {/* Card headers */}
              <div>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                  Carteira Digital de Assistido
                </span>
                <h3 className="text-base font-black text-rose-900 mt-3 truncate max-w-[285px]">
                  {socialQrModalItem.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest font-mono">
                  ID: {socialQrModalItem.id}
                </p>
              </div>

              {/* Print Sticker Frame */}
              <div id="printable-social-qr-label" className="p-5 bg-gradient-to-tr from-rose-50/20 to-white border-2 border-rose-200 rounded-3xl shadow-sm flex flex-col items-center w-full">
                <span className="text-[9px] font-black text-rose-700 tracking-wider uppercase mb-3">Portal da Luz • Assistência</span>
                
                <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-inner flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + socialQrModalItem.id)}`}
                    alt={`QR Code ${socialQrModalItem.name}`}
                    referrerPolicy="no-referrer"
                    className="w-36 h-36 object-contain block bg-white"
                  />
                </div>

                <div className="text-[10px] font-black uppercase tracking-widest mt-3 font-mono text-rose-900 select-all">
                  {socialQrModalItem.id}
                </div>

                {/* Card Footer tags */}
                <div className="border-t border-rose-100 border-dashed pt-2.5 mt-2.5 w-full text-[9px] font-black text-rose-800 uppercase tracking-wide flex justify-between gap-4 font-sans">
                  <span>Bairro: {socialQrModalItem.neighborhood}</span>
                  <span>Membros: {socialQrModalItem.memberCount} por ficha</span>
                </div>
              </div>

              {/* Instructions */}
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-[290px] uppercase tracking-wide">
                Esta carteira social permite o despacho expresso de cestas básicas via scanner por câmera rápida.
              </p>

              {/* Button row */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setSocialQrModalOpen(false);
                    setSocialQrModalItem(null);
                  }}
                  className="py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-650 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const appLink = `${window.location.origin}${window.location.pathname}?assistidoId=${encodeURIComponent(socialQrModalItem.id)}`;
                    const printwin = window.open("", "_blank");
                    if (printwin) {
                      printwin.document.write(`
                        <html>
                        <head>
                          <title>Imprimir Carteirinha Social - ${socialQrModalItem.name}</title>
                          <style>
                            body {
                              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              height: 100vh;
                              margin: 0;
                              background-color: #f8fafc;
                            }
                            .card {
                              width: 330px;
                              background: white;
                              border-radius: 20px;
                              box-shadow: 0 8px 30px rgba(0,0,0,0.06);
                              padding: 24px;
                              text-align: center;
                              border: 2px solid #fecdd3;
                            }
                            .header {
                              font-size: 11px;
                              color: #be123c;
                              text-transform: uppercase;
                              margin: 0 0 16px 0;
                              letter-spacing: 1.5px;
                              font-weight: 800;
                              border-bottom: 1px solid #ffe4e6;
                              padding-bottom: 8px;
                            }
                            h2 {
                              font-size: 17px;
                              color: #0f172a;
                              margin: 0 0 6px 0;
                              font-weight: 900;
                            }
                            .id {
                              font-family: monospace;
                              font-size: 11px;
                              color: #e11d48;
                              font-weight: bold;
                              margin-bottom: 16px;
                              background-color: #fff1f2;
                              padding: 3px 10px;
                              border-radius: 8px;
                              display: inline-block;
                            }
                            .qr {
                              margin: 16px auto;
                              display: block;
                              border: 1px solid #ffe4e6;
                              padding: 8px;
                              border-radius: 12px;
                            }
                            .meta {
                              font-size: 10px;
                              color: #4b5563;
                              text-transform: uppercase;
                              font-weight: 700;
                              display: flex;
                              justify-content: space-between;
                              border-top: 1px dashed #e5e7eb;
                              padding-top: 12px;
                            }
                            .footer-note {
                              font-size: 9px;
                              color: #e11d48;
                              margin-top: 16px;
                              text-transform: uppercase;
                              font-weight: 800;
                            }
                            @media print {
                              body { background: transparent; }
                              .card { border: 2px solid #e11d48; box-shadow: none; width: 330px; border-radius: 20px; margin: 0; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="header">Carteira Social de Beneficiário</div>
                            <h2>${socialQrModalItem.name}</h2>
                            <div class="id">ID: ${socialQrModalItem.id}</div>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appLink)}" class="qr" style="width: 140px; height: 140px;" />
                            <div class="meta">
                              <span>Bairro: ${socialQrModalItem.neighborhood || 'Portal'}</span>
                              <span>Membros: ${socialQrModalItem.memberCount || '1'}</span>
                            </div>
                            <div class="footer-note">Associação Beneficente Portal da Luz</div>
                          </div>
                          <script>
                            window.onload = function() {
                              window.print();
                            }
                          </script>
                        </body>
                        </html>
                      `);
                      printwin.document.close();
                    } else {
                      alert("Por favor habilite pop-ups para imprimir!");
                    }
                  }}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={12} />
                  Imprimir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanned Assistido deep link Details Modal */}
      <AnimatePresence>
        {scannedAssistidoModalOpen && scannedSocialAssistido && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[40px] max-w-2xl w-full p-8 md:p-10 shadow-2xl relative border border-rose-100 flex flex-col space-y-6 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-rose-55 pb-5">
                <div className="space-y-1.5 animate-in fade-in slide-in-from-left duration-305">
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                      <QrCode size={12} /> Carteirinha Escaneada com Sucesso
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border",
                      scannedSocialAssistido.vulnerabilityLevel === 'Alta' ? "bg-red-50 text-red-700 border-red-100" :
                      scannedSocialAssistido.vulnerabilityLevel === 'Média' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-emerald-50 text-emerald-700 border-emerald-100"
                    )}>
                      Vulnerabilidade {scannedSocialAssistido.vulnerabilityLevel}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-rose-900 font-serif italic leading-none pt-1">
                    {scannedSocialAssistido.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">
                    ID único: {scannedSocialAssistido.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScannedAssistidoModalOpen(false);
                    setScannedSocialAssistido(null);
                  }}
                  className="p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Data Grid info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div className="p-4 bg-slate-50/50 rounded-2xl space-y-2 border border-slate-100">
                  <p><span className="text-slate-400 text-[10px] uppercase font-black tracking-widest block leading-none mb-1">Qualificação Básica</span></p>
                  <p className="text-slate-800"><strong>CPF:</strong> {scannedSocialAssistido.cpf || "Não cadastrado"}</p>
                  <p className="text-slate-800"><strong>Data Nascimento:</strong> {scannedSocialAssistido.birthDate ? new Date(scannedSocialAssistido.birthDate).toLocaleDateString('pt-BR') : '-'}</p>
                  <p className="text-slate-800"><strong>Celular:</strong> {scannedSocialAssistido.phone || 'Sem registros'}</p>
                  <p className="text-slate-800"><strong>Trabalho:</strong> {scannedSocialAssistido.occupation}</p>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl space-y-2 border border-slate-100">
                  <p><span className="text-slate-400 text-[10px] uppercase font-black tracking-widest block leading-none mb-1">Ficha Socioeconômica</span></p>
                  <p className="text-slate-800"><strong>Composição Familiar:</strong> {scannedSocialAssistido.memberCount} integrantes</p>
                  <p className="text-slate-800"><strong>Bairro:</strong> {scannedSocialAssistido.neighborhood}</p>
                  <p className="text-slate-800"><strong>Moradia:</strong> {scannedSocialAssistido.housingStatus}</p>
                  <p className="text-slate-800"><strong>Renda Declarada:</strong> R$ {scannedSocialAssistido.familyIncome.toFixed(2)}</p>
                </div>
              </div>

              {/* Confidential clinical/fraternal segment */}
              <div className="p-5 bg-rose-50/30 rounded-3xl border border-rose-100 text-xs space-y-3.5">
                <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                  🔐 Prontuário Médico-Fraterno & Parecer (Acesso Autorizado por Carteirinha Física)
                </span>
                <div className="space-y-4 font-medium text-slate-600 leading-relaxed">
                  <div className="border-l-2 border-rose-200 pl-3">
                    <span className="text-[10px] font-black uppercase text-rose-700/70 tracking-widest block mb-0.5 leading-none">Saúde e Necessidades Especiais</span>
                    <p className="font-semibold text-slate-800">{scannedSocialAssistido.specialNeeds || "Sem observações adicionais."}</p>
                  </div>
                  <div className="border-l-2 border-rose-200 pl-3 pt-1">
                    <span className="text-[10px] font-black uppercase text-rose-700/70 tracking-widest block mb-0.5 leading-none">Parecer de Assistência Social e Espiritual</span>
                    <p className="font-semibold text-slate-800">{scannedSocialAssistido.fraternalNotes || "Ficha sem notas fraternas."}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmScannedCesta(scannedSocialAssistido)}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Despachar Cesta Básica
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Triggers edit form for this assistido!
                    setEditingAssistidoId(scannedSocialAssistido.id);
                    setNewAsName(scannedSocialAssistido.name);
                    setNewAsCpf(scannedSocialAssistido.cpf);
                    setNewAsBirthDate(scannedSocialAssistido.birthDate);
                    setNewAsPhone(scannedSocialAssistido.phone);
                    setNewAsAddress(scannedSocialAssistido.address);
                    setNewAsNeighborhood(scannedSocialAssistido.neighborhood);
                    setNewAsCity(scannedSocialAssistido.city);
                    setNewAsIsFamilyHead(scannedSocialAssistido.isFamilyHead);
                    setNewAsFamilyHeadName(scannedSocialAssistido.familyHeadName);
                    setNewAsMemberCount(scannedSocialAssistido.memberCount);
                    setNewAsHousingStatus(scannedSocialAssistido.housingStatus);
                    setNewAsSchooling(scannedSocialAssistido.schooling);
                    setNewAsOccupation(scannedSocialAssistido.occupation);
                    setNewAsFamilyIncome(scannedSocialAssistido.familyIncome);
                    setNewAsSpecialNeeds(scannedSocialAssistido.specialNeeds || '');
                    setNewAsFraternalNotes(scannedSocialAssistido.fraternalNotes || '');
                    setNewAsEmploymentStatus(scannedSocialAssistido.employmentStatus || 'Desempregado');
                    setNewAsSocialBenefits(scannedSocialAssistido.socialBenefits || 'Nenhum');
                    setNewAsFoodSecurity(scannedSocialAssistido.foodSecurity || 'Regular');
                    setNewAsHealthStatus(scannedSocialAssistido.healthStatus || 'Sadio');
                    setNewAsEmotionalStatus(scannedSocialAssistido.emotionalStatus || 'Estável');
                    setNewAsVulnerabilityLevel(scannedSocialAssistido.vulnerabilityLevel || 'Média');
                    setNewAsHasChildrenUnder12(scannedSocialAssistido.hasChildrenUnder12 || false);
                    setNewAsHasElderly(scannedSocialAssistido.hasElderly || false);

                    // Close the modal
                    setScannedAssistidoModalOpen(false);
                    setScannedSocialAssistido(null);
                  }}
                  className="py-4 px-6 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Pencil size={16} /> Ajustar Ficha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScannedAssistidoModalOpen(false);
                    setScannedSocialAssistido(null);
                  }}
                  className="py-4 px-6 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Fechar
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

