import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Handshake, Package, QrCode, MapPin, Award, Activity, 
  Search, Plus, Printer, Shield, Lock, Unlock, CheckCircle2, 
  AlertTriangle, Calendar, Heart, ArrowRight, Sparkles, TrendingUp,
  FileText, Download, UserPlus, HeartHandshake, Zap, Edit2, Trash2,
  Phone, Home, DollarSign, X, Check, ShoppingBag, Eye, RefreshCw,
  Clock, AlertCircle, Share2, CornerDownRight, CheckSquare, Layers,
  ChevronRight, ArrowDownToLine, UserCheck, Info, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../../services/dataService';
import { 
  SocialAssistido, 
  SocialAtendimento, 
  SocialDoacao, 
  SocialCestaEntrega, 
  SocialVoluntario, 
  SocialProjeto, 
  SocialVisita, 
  SocialKitCesta,
  SocialImpactMetric,
  Participant
} from '../../types';
import { cn } from '../../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { CepField, PhoneField, CpfField, RgField } from '../common/BrazilFormFields';
import { validateCPF, validatePhone, validateRG } from '../../utils/brazilValidation';

interface SocialDashboardProps {
  userRole?: string;
  userName?: string;
}

export function SocialDashboard({ userRole, userName }: SocialDashboardProps) {
  const navigate = useNavigate();
  const currentUserName = userName || 'Voluntário Fraterno';
  const currentUserRole = userRole || 'VOLUNTARIO';

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'painel' | 'assistidos' | 'atendimentos' | 'doacoes' | 'cestas' | 'kits' | 'visitas' | 'oficinas' | 'voluntarios' | 'indicadores'
  >('painel');

  // Firestore Live States
  const [assistidos, setAssistidos] = useState<SocialAssistido[]>([]);
  const [atendimentos, setAtendimentos] = useState<SocialAtendimento[]>([]);
  const [doacoes, setDoacoes] = useState<SocialDoacao[]>([]);
  const [cestas, setCestas] = useState<SocialCestaEntrega[]>([]);
  const [visitas, setVisitas] = useState<SocialVisita[]>([]);
  const [projetos, setProjetos] = useState<SocialProjeto[]>([]);
  const [voluntarios, setVoluntarios] = useState<SocialVoluntario[]>([]);
  const [kits, setKits] = useState<SocialKitCesta[]>([]);
  const [metrics, setMetrics] = useState<SocialImpactMetric[]>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; date: string; user: string; action: string; details: string }>>([]);

  // Frequentadores from General Reception / Triagem (Cross-Sector Read Only & Import)
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSearch, setImportSearch] = useState('');
  const [importFilter, setImportFilter] = useState<'TODOS' | 'NAO_CADASTRADOS' | 'JA_CADASTRADOS'>('TODOS');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'TODOS' | 'Alta' | 'Média' | 'Baixa'>('TODOS');
  const [foodFilter, setFoodFilter] = useState<string>('TODOS');

  // Modals & Selections
  const [selectedAssistido, setSelectedAssistido] = useState<SocialAssistido | null>(null);
  const [isAssistidoModalOpen, setIsAssistidoModalOpen] = useState(false);
  const [isAtendimentoModalOpen, setIsAtendimentoModalOpen] = useState(false);
  const [isDoacaoModalOpen, setIsDoacaoModalOpen] = useState(false);
  const [isCestaModalOpen, setIsCestaModalOpen] = useState(false);
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false);
  const [isOficinaModalOpen, setIsOficinaModalOpen] = useState(false);
  const [isVoluntarioModalOpen, setIsVoluntarioModalOpen] = useState(false);

  // Controlled Form State for Assistido Registration
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    cpf: string;
    birthDate: string;
    phone: string;
    cep?: string;
    address: string;
    neighborhood: string;
    city: string;
    state?: string;
    memberCount: number;
    housingStatus: string;
    schooling: string;
    occupation: string;
    familyIncome: number;
    specialNeeds: string;
    fraternalNotes: string;
    employmentStatus: string;
    socialBenefits: string;
    foodSecurity: 'Grave' | 'Moderada' | 'Leve' | 'Regular';
    healthStatus: string;
    emotionalStatus: string;
    vulnerabilityLevel: 'Alta' | 'Média' | 'Baixa';
    hasChildrenUnder12: boolean;
    hasElderly: boolean;
  }>({
    name: '',
    cpf: '',
    birthDate: '',
    phone: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: 'Mirante do Sul',
    state: 'BA',
    memberCount: 1,
    housingStatus: 'Alugada',
    schooling: 'Fundamental',
    occupation: '',
    familyIncome: 0,
    specialNeeds: '',
    fraternalNotes: '',
    employmentStatus: 'Autônomo',
    socialBenefits: '',
    foodSecurity: 'Grave',
    healthStatus: 'Estável',
    emotionalStatus: 'Estável',
    vulnerabilityLevel: 'Alta',
    hasChildrenUnder12: true,
    hasElderly: false
  });
  
  // QR & Signature Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrTargetAssistido, setQrTargetAssistido] = useState<SocialAssistido | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerResult, setScannerResult] = useState<string | null>(null);

  // Digital Signature Modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureAssistido, setSignatureAssistido] = useState<SocialAssistido | null>(null);
  const [signatureBasketType, setSignatureBasketType] = useState('Padrão FEB');
  const [signatureResponsible, setSignatureResponsible] = useState(currentUserName);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Spiritual Forwarding Modal
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardAssistido, setForwardAssistido] = useState<SocialAssistido | null>(null);
  const [forwardTarget, setForwardTarget] = useState<'FRATERNO' | 'PASSE' | 'DOUTRI' | 'INFANCIA'>('FRATERNO');
  const [forwardNotes, setForwardNotes] = useState('');

  // Unlocked LGPD Records
  const [unlockedRecords, setUnlockedRecords] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // --- INITIAL DATA SUBSCRIPTION & AUTO-MIGRATION ---
  useEffect(() => {
    // 1. Assistidos
    const unsubAssistidos = dataService.subscribeSocialAssistidos((list) => {
      if (list.length === 0) {
        // Check localStorage migration
        const local = localStorage.getItem('social_assistidos');
        if (local) {
          try {
            const parsed: SocialAssistido[] = JSON.parse(local);
            parsed.forEach(item => dataService.saveSocialAssistido(item));
          } catch {}
        } else {
          // Seed initial FEB canonical defaults
          const defaults: SocialAssistido[] = [
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
              fraternalNotes: 'Família em vulnerabilidade social e emocional severa. Frequenta as reuniões públicas. Recebe cesta básica regular.',
              employmentStatus: 'Autônoma',
              socialBenefits: 'Bolsa Família',
              foodSecurity: 'Grave',
              healthStatus: 'Tratamento Contínuo',
              emotionalStatus: 'Abalado',
              vulnerabilityLevel: 'Alta',
              hasChildrenUnder12: true,
              hasElderly: false,
              registeredAt: Date.now() - 3600000 * 24 * 30
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
              fraternalNotes: 'Assistido expressa carência afetiva e solidão. Solicita visitas fraternas frequentes.',
              employmentStatus: 'Aposentado',
              socialBenefits: 'Nenhum',
              foodSecurity: 'Regular',
              healthStatus: 'Tratamento Contínuo',
              emotionalStatus: 'Estável',
              vulnerabilityLevel: 'Média',
              hasChildrenUnder12: false,
              hasElderly: true,
              registeredAt: Date.now() - 3600000 * 24 * 60
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
              fraternalNotes: 'Inscrita nas oficinas de Costura Fraterna e Artesanato da casa para obter renda própria.',
              employmentStatus: 'Desempregada',
              socialBenefits: 'Bolsa Família',
              foodSecurity: 'Moderada',
              healthStatus: 'Sadio',
              emotionalStatus: 'Crítico',
              vulnerabilityLevel: 'Alta',
              hasChildrenUnder12: true,
              hasElderly: false,
              registeredAt: Date.now() - 3600000 * 24 * 15
            }
          ];
          defaults.forEach(item => dataService.saveSocialAssistido(item));
        }
      }
      setAssistidos(list);
    });

    // 2. Atendimentos
    const unsubAtendimentos = dataService.subscribeSocialAtendimentos((list) => {
      if (list.length === 0) {
        const defaults: SocialAtendimento[] = [
          {
            id: 'sat_1',
            assistidoId: 'as_1',
            assistidoName: 'Maria das Dores Silva',
            date: '2026-05-15',
            responsible: 'Clarice Lisbôa',
            type: 'Cesta básica & Acolhimento',
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
            responsible: 'Francisco André',
            type: 'Apoio espiritual & Visita',
            needIdentified: 'Profunda melancolia por viver isolado da família biológica.',
            forwarding: 'Incluído na escala de Visitas Fraternas da equipe aos finais de semana.',
            observations: 'Emprestamos o livro "O Evangelho Segundo o Espiritismo" e realizamos prece conjunta no seu domicílio.',
            nextFollowUp: '2026-06-10'
          }
        ];
        defaults.forEach(item => dataService.saveSocialAtendimento(item));
      }
      setAtendimentos(list);
    });

    // 3. Doações
    const unsubDoacoes = dataService.subscribeSocialDoacoes((list) => {
      if (list.length === 0) {
        const defaults: SocialDoacao[] = [
          { id: 'don_1', type: 'Alimentos', description: 'Arroz Tipo 1 (Sacos 5kg)', qty: 45, unit: 'un', donor: 'Supermercado Central', entryDate: '2026-05-10', responsible: 'Francisco André', expiryDate: '2026-11-20', status: 'Disponível' },
          { id: 'don_2', type: 'Alimentos', description: 'Feijão Carioca 1kg', qty: 50, unit: 'un', donor: 'Campanha Culto do Lar', entryDate: '2026-05-12', responsible: 'Francisco André', expiryDate: '2026-12-10', status: 'Disponível' },
          { id: 'don_3', type: 'Alimentos', description: 'Óleo de Soja 900ml', qty: 62, unit: 'un', donor: 'Comunidade (Campanha de Culto)', entryDate: '2026-05-15', responsible: 'Francisco André', expiryDate: '2027-01-15', status: 'Disponível' },
          { id: 'don_4', type: 'Alimentos', description: 'Macarrão Espaguete 500g', qty: 70, unit: 'un', donor: 'Arrecadação Doutrinária', entryDate: '2026-05-15', responsible: 'Francisco André', expiryDate: '2027-03-01', status: 'Disponível' },
          { id: 'don_5', type: 'Alimentos', description: 'Açúcar Refinado 1kg', qty: 40, unit: 'un', donor: 'Doadores Anônimos', entryDate: '2026-05-18', responsible: 'Francisco André', expiryDate: '2027-02-01', status: 'Disponível' },
          { id: 'don_6', type: 'Alimentos', description: 'Leite Integral 1L', qty: 35, unit: 'un', donor: 'Campanha do Leite', entryDate: '2026-05-20', responsible: 'Clarice Lisbôa', expiryDate: '2026-09-15', status: 'Disponível' },
          { id: 'don_7', type: 'Roupas', description: 'Cobertores de Casal Novas / Semiusados', qty: 28, unit: 'un', donor: 'Campanha de Inverno', entryDate: '2026-05-24', responsible: 'Andréia Ramos', expiryDate: '', status: 'Disponível' },
          { id: 'don_8', type: 'Higiene', description: 'Pacotes de Fralda Infantil M/G', qty: 15, unit: 'un', donor: 'Clarice Lisbôa', entryDate: '2026-05-26', responsible: 'Clarice Lisbôa', expiryDate: '', status: 'Disponível' },
          { id: 'don_9', type: 'Recursos financeiros', description: 'Fundo para Auxílio Emergencial Social', qty: 2500, unit: 'R$', donor: 'Doadores Anônimos Portal', entryDate: '2026-05-28', responsible: 'Tesouraria Geral', expiryDate: '', status: 'Disponível' }
        ];
        defaults.forEach(item => dataService.saveSocialDoacao(item));
      }
      setDoacoes(list);
    });

    // 4. Cestas
    const unsubCestas = dataService.subscribeSocialCestas((list) => {
      if (list.length === 0) {
        const defaults: SocialCestaEntrega[] = [
          { id: 'sc_1', assistidoId: 'as_1', assistidoName: 'Maria das Dores Silva', date: '2026-05-15', basketType: 'Padrão + Suplemento Infantil', responsible: 'Francisco André', signatureConfirmed: true, qrCodeScanned: true, notes: 'Entregue com pacote de fraldas e nebulizador emprestado.' },
          { id: 'sc_2', assistidoId: 'as_3', assistidoName: 'Ana Paula Oliveira de Souza', date: '2026-05-26', basketType: 'Padrão FEB', responsible: 'Carlos Roberto', signatureConfirmed: true, qrCodeScanned: false, notes: 'Assistida compareceu ao centro para retirada.' }
        ];
        defaults.forEach(item => dataService.saveSocialCesta(item));
      }
      setCestas(list);
    });

    // 5. Kits de Composição Inteligente
    const unsubKits = dataService.subscribeSocialKits((list) => {
      if (list.length === 0) {
        const defaults: SocialKitCesta[] = [
          {
            id: 'kit_1',
            name: 'Cesta Básica Padrão FEB',
            description: 'Composição canônica balanceada para sustento mensal de família de até 4 pessoas.',
            targetCategory: 'Padrão',
            createdAt: Date.now(),
            items: [
              { itemName: 'Arroz Tipo 1 (Sacos 5kg)', requiredQty: 1, unit: 'un' },
              { itemName: 'Feijão Carioca 1kg', requiredQty: 2, unit: 'un' },
              { itemName: 'Óleo de Soja 900ml', requiredQty: 2, unit: 'un' },
              { itemName: 'Macarrão Espaguete 500g', requiredQty: 2, unit: 'un' },
              { itemName: 'Açúcar Refinado 1kg', requiredQty: 1, unit: 'un' }
            ]
          },
          {
            id: 'kit_2',
            name: 'Cesta Nutricional Infantil / Gestante',
            description: 'Cesta reforçada com suplementação láctea e itens para primeira infância.',
            targetCategory: 'Gestante/Bebê',
            createdAt: Date.now(),
            items: [
              { itemName: 'Arroz Tipo 1 (Sacos 5kg)', requiredQty: 1, unit: 'un' },
              { itemName: 'Feijão Carioca 1kg', requiredQty: 2, unit: 'un' },
              { itemName: 'Leite Integral 1L', requiredQty: 4, unit: 'un' },
              { itemName: 'Açúcar Refinado 1kg', requiredQty: 1, unit: 'un' }
            ]
          }
        ];
        defaults.forEach(item => dataService.saveSocialKit(item));
      }
      setKits(list);
    });

    // 6. Visitas
    const unsubVisitas = dataService.subscribeSocialVisitas((list) => {
      if (list.length === 0) {
        const defaults: SocialVisita[] = [
          { id: 'svi_1', assistidoId: 'as_2', assistidoName: 'João Batista dos Santos', date: '2026-05-21', responsible: 'Carlos Roberto Machado', situationFound: 'Lúcido, porém frágil física e emocionalmente. Apresentou dores nas articulações.', needsObserved: 'Necessita de acompanhamento médico e remédios de hipertensão da farmácia popular.', forwarding: 'Encaminhado relato ao atendimento fraterno de saúde. Programado novo envio de sopa no sábado.' },
          { id: 'svi_2', assistidoId: 'as_1', assistidoName: 'Maria das Dores Silva', date: '2026-05-25', responsible: 'Francisco André', situationFound: 'Alojada em cômodos rústicos cedidos. Muitas moscas e humidade no quarto de Mateus.', needsObserved: 'Alergia de Mateus atacada. Necessita de materiais de limpeza adicionais (cloro e repelente).', forwarding: 'Separado e enviado do estoque kit higiênico e cloro. Sintonizada prece pela saúde de Mateus.' }
        ];
        defaults.forEach(item => dataService.saveSocialVisita(item));
      }
      setVisitas(list);
    });

    // 7. Projetos & Oficinas
    const unsubProjetos = dataService.subscribeSocialProjetos((list) => {
      if (list.length === 0) {
        const defaults: SocialProjeto[] = [
          { id: 'sp_1', name: 'Curso de Panificação Comunitária', objective: 'Capacitar mães em vulnerabilidade para produção autônoma de pães e bolos visando autonomia financeira.', target: 'Mães e Chefes de Família da Vila da Paz', coordinator: 'Clarice Lisbôa', schedule: 'Terças às 14:00', participantsCount: 12, status: 'Ativo' },
          { id: 'sp_2', name: 'Reforço Escolar Fraterno', objective: 'Auxílio pedagógico infantil sintonizado com lições de afeto e respeito fraterno baseado no Evangelho.', target: 'Crianças matriculadas do Morro da Glória', coordinator: 'Professor Lucas', schedule: 'Sábados às 09:30', participantsCount: 18, status: 'Ativo' },
          { id: 'sp_3', name: 'Oficina de Costura Fraterna (Enxovais)', objective: 'Confecção de enxovais para gestantes carentes sob amparo espiritual das mães voluntárias.', target: 'Gestantes da Unidade Básica de Saúde Local', coordinator: 'Eunice Vasconcelos', schedule: 'Quintas às 13:30', participantsCount: 8, status: 'Ativo' }
        ];
        defaults.forEach(item => dataService.saveSocialProjeto(item));
      }
      setProjetos(list);
    });

    // 8. Voluntários
    const unsubVoluntarios = dataService.subscribeSocialVoluntarios((list) => {
      if (list.length === 0) {
        const defaults: SocialVoluntario[] = [
          { id: 'sv_1', name: 'Clarice Lisbôa', role: 'Triagem e Avaliação Social', availability: 'Terças e Sábados', contact: '(11) 98111-2222', active: true },
          { id: 'sv_2', name: 'Francisco André dos Santos', role: 'Logística & Montagem de Cestas', availability: 'Quartas e Sábados', contact: '(11) 98222-3333', active: true },
          { id: 'sv_3', name: 'Carlos Roberto Machado', role: 'Visitas Fraternas aos Lares', availability: 'Finais de Semana', contact: '(11) 98333-4444', active: true },
          { id: 'sv_4', name: 'Dra. Luísa Mendonça', role: 'Orientação Médica & Higiênica', availability: 'Quintas às 15h', contact: '(11) 91234-5678', active: true }
        ];
        defaults.forEach(item => dataService.saveSocialVoluntario(item));
      }
      setVoluntarios(list);
    });

    // 9. Metas de Impacto Social
    const unsubMetrics = dataService.subscribeSocialMetrics((list) => {
      setMetrics(list);
    });

    // 10. Frequentadores da Recepção Geral (Consulta & Importação Segura)
    const unsubParticipants = dataService.subscribeToParticipants((list) => {
      setParticipants(list);
    });

    // Load audit logs from localStorage or memory
    const cachedAudit = localStorage.getItem('social_audit_logs');
    if (cachedAudit) {
      try { setAuditLogs(JSON.parse(cachedAudit)); } catch {}
    }

    return () => {
      unsubAssistidos();
      unsubAtendimentos();
      unsubDoacoes();
      unsubCestas();
      unsubKits();
      unsubVisitas();
      unsubProjetos();
      unsubVoluntarios();
      unsubMetrics();
      unsubParticipants();
    };
  }, []);

  // Helper to open assistido modal with proper state
  const handleOpenAssistidoModal = (as?: SocialAssistido | null) => {
    if (as) {
      setSelectedAssistido(as);
      setFormData({
        id: as.id,
        name: as.name || '',
        cpf: as.cpf || '',
        birthDate: as.birthDate || '',
        phone: as.phone || '',
        cep: as.cep || '',
        address: as.address || '',
        neighborhood: as.neighborhood || '',
        city: as.city || 'Mirante do Sul',
        state: as.state || 'BA',
        memberCount: as.memberCount || 1,
        housingStatus: as.housingStatus || 'Alugada',
        schooling: as.schooling || 'Fundamental',
        occupation: as.occupation || '',
        familyIncome: as.familyIncome || 0,
        specialNeeds: as.specialNeeds || '',
        fraternalNotes: as.fraternalNotes || '',
        employmentStatus: as.employmentStatus || 'Autônomo',
        socialBenefits: as.socialBenefits || '',
        foodSecurity: (as.foodSecurity as any) || 'Grave',
        healthStatus: as.healthStatus || 'Estável',
        emotionalStatus: as.emotionalStatus || 'Estável',
        vulnerabilityLevel: as.vulnerabilityLevel || 'Alta',
        hasChildrenUnder12: as.hasChildrenUnder12 ?? true,
        hasElderly: as.hasElderly ?? false
      });
    } else {
      setSelectedAssistido(null);
      setFormData({
        name: '',
        cpf: '',
        birthDate: '',
        phone: '',
        cep: '',
        address: '',
        neighborhood: '',
        city: 'Mirante do Sul',
        state: 'BA',
        memberCount: 1,
        housingStatus: 'Alugada',
        schooling: 'Fundamental',
        occupation: '',
        familyIncome: 0,
        specialNeeds: '',
        fraternalNotes: '',
        employmentStatus: 'Autônomo',
        socialBenefits: '',
        foodSecurity: 'Grave',
        healthStatus: 'Estável',
        emotionalStatus: 'Estável',
        vulnerabilityLevel: 'Alta',
        hasChildrenUnder12: true,
        hasElderly: false
      });
    }
    setIsAssistidoModalOpen(true);
  };

  // Helper to import a participant from Reception to Social Assistidos
  const handleImportParticipant = (participant: Participant) => {
    // Check if this participant is already registered as an assistido by CPF or name
    const existingAs = assistidos.find(
      (a) => (participant.cpf && a.cpf === participant.cpf) || 
             a.id === participant.id ||
             (a.name && participant.name && a.name.trim().toLowerCase() === participant.name.trim().toLowerCase())
    );

    if (existingAs) {
      showToast(`Frequentador "${participant.name}" já possui prontuário no SAPSE. Abrindo edição...`);
      handleOpenAssistidoModal(existingAs);
      setIsImportModalOpen(false);
      return;
    }

    // Map vulnerability
    let vuln: 'Alta' | 'Média' | 'Baixa' = 'Média';
    if (participant.vulnerabilityLevel === 'Alta' || participant.vulnerabilityLevel === 'Extrema') vuln = 'Alta';
    else if (participant.vulnerabilityLevel === 'Baixa') vuln = 'Baixa';

    // Map food security
    let foodSec: 'Grave' | 'Moderada' | 'Leve' | 'Regular' = 'Grave';
    if (participant.foodSecurity === 'Seguro') foodSec = 'Regular';
    else if (participant.foodSecurity === 'Insegurança Leve') foodSec = 'Leve';
    else if (participant.foodSecurity === 'Insegurança Moderada') foodSec = 'Moderada';

    setSelectedAssistido(null);
    setFormData({
      id: `as_${Date.now()}`,
      name: participant.name || '',
      cpf: participant.cpf || '',
      birthDate: participant.birthDate || '',
      phone: participant.phone || '',
      cep: participant.cep || '',
      address: participant.address || '',
      neighborhood: participant.neighborhood || '',
      city: participant.city || 'Mirante do Sul',
      state: participant.state || 'BA',
      memberCount: participant.familyMembersCount || 1,
      housingStatus: 'Alugada',
      schooling: 'Fundamental',
      occupation: participant.profession || '',
      familyIncome: participant.monthlyIncome || 0,
      specialNeeds: participant.observation || '',
      fraternalNotes: participant.socialNotes ? `[Triagem Recepção] ${participant.socialNotes}` : '',
      employmentStatus: 'Autônomo',
      socialBenefits: '',
      foodSecurity: foodSec,
      healthStatus: 'Estável',
      emotionalStatus: 'Estável',
      vulnerabilityLevel: vuln,
      hasChildrenUnder12: true,
      hasElderly: false
    });

    setIsImportModalOpen(false);
    setIsAssistidoModalOpen(true);
    showToast(`⚡ Dados de "${participant.name}" importados da Recepção! Complete as informações socioeconômicas.`);
  };

  // Helper to log LGPD access
  const logLgpdAudit = (action: string, details: string) => {
    const newLog = {
      id: `aud_${Date.now()}`,
      date: new Date().toLocaleString('pt-BR'),
      user: currentUserName,
      action,
      details
    };
    const updated = [newLog, ...auditLogs.slice(0, 49)];
    setAuditLogs(updated);
    localStorage.setItem('social_audit_logs', JSON.stringify(updated));
  };

  // Toggle sensitive record view
  const toggleUnlockRecord = (id: string, name: string) => {
    setUnlockedRecords(prev => {
      const nextState = !prev[id];
      if (nextState) {
        logLgpdAudit('Consulta Prontuário Sensível', `Acessou dados socioeconômicos e espirituais de ${name}`);
        showToast(`Acesso registrado para auditoria LGPD: ${name}`);
      }
      return { ...prev, [id]: nextState };
    });
  };

  // --- KIT INVENTORY CALCULATOR ---
  // Calculates how many complete baskets can be assembled with current stock
  const kitYieldCalculations = useMemo(() => {
    return kits.map(kit => {
      let maxPossible = Infinity;
      const breakdown = kit.items.map(item => {
        const matchingStock = doacoes.find(d => 
          d.description.toLowerCase().trim() === item.itemName.toLowerCase().trim() &&
          d.status === 'Disponível'
        );
        const currentQty = matchingStock ? Number(matchingStock.qty) : 0;
        const possibleWithItem = item.requiredQty > 0 ? Math.floor(currentQty / item.requiredQty) : 0;
        if (possibleWithItem < maxPossible) {
          maxPossible = possibleWithItem;
        }
        return {
          itemName: item.itemName,
          required: item.requiredQty,
          available: currentQty,
          unit: item.unit,
          limitingFactor: false
        };
      });

      if (maxPossible === Infinity) maxPossible = 0;

      // Mark limiting factors
      breakdown.forEach(b => {
        if (Math.floor(b.available / (b.required || 1)) === maxPossible) {
          b.limitingFactor = true;
        }
      });

      return {
        kitId: kit.id,
        kitName: kit.name,
        targetCategory: kit.targetCategory,
        maxPossibleBaskets: maxPossible,
        itemsBreakdown: breakdown
      };
    });
  }, [kits, doacoes]);

  // Execute Kit Batch Assembly (Atomic Stock Deduction)
  const handleAssembleBaskets = async (kitId: string, quantityToAssemble: number) => {
    const kit = kits.find(k => k.id === kitId);
    if (!kit || quantityToAssemble <= 0) return;

    // Check availability
    for (const item of kit.items) {
      const matchingStock = doacoes.find(d => 
        d.description.toLowerCase().trim() === item.itemName.toLowerCase().trim() &&
        d.status === 'Disponível'
      );
      const totalNeeded = item.requiredQty * quantityToAssemble;
      if (!matchingStock || Number(matchingStock.qty) < totalNeeded) {
        showToast(`Estoque insuficiente de "${item.itemName}". Necessário: ${totalNeeded}, Disponível: ${matchingStock ? matchingStock.qty : 0}`);
        return;
      }
    }

    // Deduct stock
    for (const item of kit.items) {
      const matchingStock = doacoes.find(d => 
        d.description.toLowerCase().trim() === item.itemName.toLowerCase().trim() &&
        d.status === 'Disponível'
      );
      if (matchingStock) {
        const newQty = Number(matchingStock.qty) - (item.requiredQty * quantityToAssemble);
        await dataService.saveSocialDoacao({
          ...matchingStock,
          qty: newQty
        });
      }
    }

    logLgpdAudit('Montagem de Lote de Cestas', `Montadas ${quantityToAssemble}x "${kit.name}". Estoque de insumos baixado atomicamente.`);
    showToast(`✅ ${quantityToAssemble}x "${kit.name}" montadas com sucesso! Insumos baixados no estoque.`);
  };

  // --- QR CODE GENERATION ---
  const handleOpenQrModal = async (assistido: SocialAssistido) => {
    setQrTargetAssistido(assistido);
    try {
      const qrData = JSON.stringify({
        type: 'SAPSE_ASSISTIDO',
        id: assistido.id,
        name: assistido.name,
        cpf: assistido.cpf,
        memberCount: assistido.memberCount,
        vulnerability: assistido.vulnerabilityLevel
      });
      const url = await QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#881337', light: '#ffffff' } });
      setQrCodeDataUrl(url);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar QR Code');
    }
  };

  // --- DIGITAL SIGNATURE & CANVAS ---
  const handleOpenSignatureModal = (assistido: SocialAssistido) => {
    setSignatureAssistido(assistido);
    setSignatureResponsible(currentUserName);
    setHasSignature(false);
    setIsSignatureModalOpen(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#1e1b4b';
        }
      }
    }, 150);
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleConfirmSignatureDelivery = async () => {
    if (!signatureAssistido) return;
    const canvas = canvasRef.current;
    const signatureBase64 = canvas ? canvas.toDataURL('image/png') : undefined;

    const newEntrega: SocialCestaEntrega = {
      id: `sc_${Date.now()}`,
      assistidoId: signatureAssistido.id,
      assistidoName: signatureAssistido.name,
      date: new Date().toISOString().split('T')[0],
      basketType: signatureBasketType,
      responsible: signatureResponsible,
      signatureConfirmed: hasSignature,
      qrCodeScanned: false,
      notes: `Entrega com confirmação de assinatura digital de ${signatureAssistido.name}.`
    };

    await dataService.saveSocialCesta(newEntrega);
    logLgpdAudit('Recibo de Cesta Emitido', `Entrega de ${signatureBasketType} assinada por ${signatureAssistido.name}`);
    setIsSignatureModalOpen(false);
    showToast(`✅ Entrega de Cesta Básica registrada com recibo assinado!`);
  };

  // --- SPIRITUAL FORWARDING TO FRATERNO / PASSE ---
  const handleOpenForwardModal = (assistido: SocialAssistido) => {
    setForwardAssistido(assistido);
    setForwardNotes(`Assistido da Ação Social Espírita (${assistido.vulnerabilityLevel} vulnerabilidade) solicitou acolhimento fraterno e passe.`);
    setIsForwardModalOpen(true);
  };

  const handleExecuteForwarding = async () => {
    if (!forwardAssistido) return;

    if (forwardTarget === 'FRATERNO') {
      await dataService.updateParticipant({
        id: forwardAssistido.id,
        name: forwardAssistido.name,
        birthDate: forwardAssistido.birthDate || '1990-01-01',
        phone: forwardAssistido.phone || '',
        address: forwardAssistido.address || '',
        currentStatus: 'WAITING',
        lgpdConsent: true,
        lgpdDate: Date.now(),
        registrationDate: Date.now()
      });
      await dataService.addToQueue({
        participantId: forwardAssistido.id,
        sectorId: 'fraterno',
        priority: forwardAssistido.vulnerabilityLevel === 'Alta',
        notes: `[Encaminhado pela Ação Social SAPSE] ${forwardNotes}`
      });
    } else if (forwardTarget === 'PASSE') {
      await dataService.savePasseAtendimento({
        id: `passe_soc_${Date.now()}`,
        patientName: forwardAssistido.name,
        codeOrTicket: `PASSE-SOC-${Date.now().toString().slice(-4)}`,
        typePasse: 'Passe Geral',
        status: 'Aguardando',
        hasFraternalReferral: true,
        referralNotes: `[Encaminhado pela Ação Social SAPSE] ${forwardNotes}`,
        createdAt: Date.now()
      });
    }

    // Register also in social atendimentos
    const newAtendimento: SocialAtendimento = {
      id: `sat_${Date.now()}`,
      assistidoId: forwardAssistido.id,
      assistidoName: forwardAssistido.name,
      date: new Date().toISOString().split('T')[0],
      responsible: currentUserName,
      type: forwardTarget === 'FRATERNO' ? 'Encaminhamento Atendimento Fraterno' : 'Encaminhamento Passe & Fluidoterapia',
      needIdentified: forwardAssistido.specialNeeds || 'Acolhimento moral e espiritual.',
      forwarding: `Encaminhado ao setor de ${forwardTarget === 'FRATERNO' ? 'Atendimento Fraterno' : 'Passe'} com prioridade fraterna.`,
      observations: forwardNotes
    };
    await dataService.saveSocialAtendimento(newAtendimento);

    logLgpdAudit('Encaminhamento Espiritual', `Encaminhou ${forwardAssistido.name} para ${forwardTarget}`);
    setIsForwardModalOpen(false);
    showToast(`🕊️ Assistido ${forwardAssistido.name} encaminhado com sucesso para ${forwardTarget}!`);
  };

  // --- PDF REPORT GENERATOR ---
  const handleGeneratePdfReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(136, 19, 55); // Rose 900
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRO ESPÍRITA MIRANTE DE LUZ - SAPSE', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório Integrado de Ação e Promoção Social Espírita (Diretrizes FEB)', 14, 18);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} | Responsável: ${currentUserName}`, 14, 32);

    // Summary statistics table
    autoTable(doc, {
      startY: 36,
      head: [['Indicador de Cobertura Social', 'Quantidade Registrada', 'Parâmetro de Atendimento']],
      body: [
        ['Famílias Cadastradas no Prontuário', String(assistidos.length), 'Acompanhamento contínuo'],
        ['Famílias em Alta Vulnerabilidade', String(assistidos.filter(a => a.vulnerabilityLevel === 'Alta').length), 'Prioridade máxima de amparo'],
        ['Cestas Básicas Entregues no Período', String(cestas.length), 'Com comprovante e assinatura'],
        ['Atendimentos / Escutas Fraternas', String(atendimentos.length), 'Acolhimento socioespiritual'],
        ['Itens em Estoque de Donativos', String(doacoes.reduce((acc, d) => acc + Number(d.qty || 0), 0)), 'Alimentos, roupas e higiene'],
        ['Oficinas e Cursos de Autonomia Ativos', String(projetos.filter(p => p.status === 'Ativo').length), 'Promoção e emancipação do ser']
      ],
      theme: 'grid',
      headStyles: { fillColor: [159, 18, 57], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 }
    });

    // Assistidos List table
    const currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(136, 19, 55);
    doc.text('Relação de Assistidos e Famílias Acompanhadas', 14, currentY);

    const assistidosRows = assistidos.map(a => [
      a.name,
      a.neighborhood,
      `${a.memberCount} pessoas`,
      a.vulnerabilityLevel,
      a.foodSecurity,
      a.socialBenefits || 'Nenhum'
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Nome do Assistido', 'Bairro / Localidade', 'Composição', 'Vulnerabilidade', 'Segurança Alimentar', 'Benefício']],
      body: assistidosRows,
      theme: 'striped',
      headStyles: { fillColor: [76, 29, 149], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 7.5 }
    });

    doc.save(`Relatorio_Acao_Social_Mirante_Luz_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('📄 Relatório de Ação Social gerado em PDF com sucesso!');
  };

  // Filtered Assistidos List
  const filteredAssistidos = useMemo(() => {
    return assistidos.filter(a => {
      const matchSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.cpf.includes(searchQuery) ||
        a.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchVuln = vulnerabilityFilter === 'TODOS' || a.vulnerabilityLevel === vulnerabilityFilter;
      const matchFood = foodFilter === 'TODOS' || a.foodSecurity === foodFilter;

      return matchSearch && matchVuln && matchFood;
    });
  }, [assistidos, searchQuery, vulnerabilityFilter, foodFilter]);

  // Filtered Participants from Reception / Triagem
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const q = importSearch.toLowerCase().trim();
      const matchSearch = 
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.cpf && p.cpf.includes(q)) ||
        (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q));
      
      const isAlreadyInSocial = assistidos.some(
        a => (p.cpf && a.cpf === p.cpf) || 
             a.id === p.id || 
             (a.name && p.name && a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );

      if (importFilter === 'NAO_CADASTRADOS') return matchSearch && !isAlreadyInSocial;
      if (importFilter === 'JA_CADASTRADOS') return matchSearch && isAlreadyInSocial;
      return matchSearch;
    });
  }, [participants, assistidos, importSearch, importFilter]);

  return (
    <div className="space-y-8 font-sans">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center gap-3"
          >
            <Sparkles size={16} className="text-rose-400" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBHEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-rose-100 pb-6">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-800">
              SAPSE • Promoção Social Espírita
            </span>
            <span className="text-xs text-rose-500 font-bold">• Mirante de Luz</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-rose-950 italic flex items-center gap-2.5">
            <Handshake size={28} className="text-rose-600 animate-pulse" />
            Ação Social & Promoção do Ser
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            "A verdadeira caridade não consiste apenas na esmola que se dá, mas no afeto, no respeito e na elevação moral do assistido."
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/impacto-social')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-800 hover:to-pink-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <TrendingUp size={15} />
            <span>Metas de Impacto Social</span>
          </button>

          <button
            onClick={handleGeneratePdfReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span>Emitir PDF (FEB)</span>
          </button>
        </div>
      </div>

      {/* PILLS NAVIGATION */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-2 bg-rose-50/60 p-1.5 rounded-2xl border border-rose-100/70 scrollbar-none w-full">
        {[
          { id: 'painel', label: 'Painel Geral', icon: Activity },
          { id: 'assistidos', label: `Assistidos & Famílias (${assistidos.length})`, icon: Users },
          { id: 'atendimentos', label: `Acolhimento & Escutas (${atendimentos.length})`, icon: Handshake },
          { id: 'cestas', label: `Cestas Básicas (${cestas.length})`, icon: ShoppingBag },
          { id: 'kits', label: `Estoque Inteligente & Kits (${kits.length})`, icon: Layers },
          { id: 'doacoes', label: `Estoque de Donativos (${doacoes.length})`, icon: Package },
          { id: 'visitas', label: `Visitas Fraternas (${visitas.length})`, icon: MapPin },
          { id: 'oficinas', label: `Oficinas & Projetos (${projetos.length})`, icon: Award },
          { id: 'voluntarios', label: `Equipe Voluntária (${voluntarios.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                isActive 
                  ? "bg-rose-700 text-white shadow-md shadow-rose-200 scale-[1.02]" 
                  : "text-rose-800 hover:bg-rose-100/70"
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. PAINEL GERAL */}
      {activeTab === 'painel' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* STATS HIGHLIGHT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-rose-50 to-white rounded-3xl border border-rose-100 shadow-sm text-left">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Famílias em Acompanhamento</span>
              <p className="text-3xl font-black text-rose-950 mt-1">{assistidos.length}</p>
              <span className="text-[10px] text-gray-400 font-medium mt-1 block">Prontuários ativos no SAPSE</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-50 to-white rounded-3xl border border-amber-100 shadow-sm text-left">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Alta Vulnerabilidade</span>
              <p className="text-3xl font-black text-amber-950 mt-1">
                {assistidos.filter(a => a.vulnerabilityLevel === 'Alta').length}
              </p>
              <span className="text-[10px] text-amber-600/70 font-medium mt-1 block">Prioridade em cestas e visitas</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-sm text-left">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Cestas Entregues (Mês)</span>
              <p className="text-3xl font-black text-emerald-950 mt-1">{cestas.length}</p>
              <span className="text-[10px] text-emerald-600/70 font-medium mt-1 block">Com recibos e assinaturas</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-3xl border border-purple-100 shadow-sm text-left">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">Oficinas de Emancipação</span>
              <p className="text-3xl font-black text-purple-950 mt-1">
                {projetos.filter(p => p.status === 'Ativo').length}
              </p>
              <span className="text-[10px] text-purple-600/70 font-medium mt-1 block">Panificação, costura e apoio</span>
            </div>
          </div>

          {/* QUICK SUMMARY BENTO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LATEST ATENDIMENTOS & ESCUTAS */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-rose-100 p-6 text-left space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-rose-50 pb-3">
                <div>
                  <h3 className="text-base font-black text-rose-900 tracking-tight flex items-center gap-2">
                    <Handshake size={18} className="text-rose-600" />
                    Últimos Acolhimentos e Escutas Fraternas
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">Registros socioemocionais das famílias atendidas</p>
                </div>
                <button
                  onClick={() => setActiveTab('atendimentos')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todos ({atendimentos.length})</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {atendimentos.slice(0, 4).map((at) => (
                  <div key={at.id} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100/60 hover:bg-rose-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-rose-950">{at.assistidoName}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-rose-100">
                        {at.date}
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 font-semibold mt-1">Motivo / Tipo: {at.type}</p>
                    <p className="text-[11px] text-gray-600 font-normal mt-0.5">{at.forwarding}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-rose-100/40 text-[10px] text-gray-400 font-medium">
                      <span>Responsável: {at.responsible}</span>
                      {at.nextFollowUp && <span>Próximo Retorno: {at.nextFollowUp}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LGPD & SECURITY AUDIT TRAIL */}
            <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-rose-400" />
                  <h3 className="text-sm font-black tracking-tight text-white">LGPD & Sigilo Social</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  Auditoria Ativa
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Todas as consultas a prontuários sensíveis (renda, vulnerabilidade, saúde emocional) geram trilha imutável.
              </p>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Nenhum registro de auditoria gravado no momento.
                  </div>
                ) : (
                  auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-slate-300 font-bold">
                        <span>{log.user}</span>
                        <span className="text-slate-500">{log.date}</span>
                      </div>
                      <p className="text-rose-300 font-medium">{log.action}</p>
                      <p className="text-slate-400">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ASSISTIDOS & FAMÍLIAS */}
      {activeTab === 'assistidos' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3 text-rose-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, CPF ou bairro..."
                className="w-full pl-10 pr-4 py-2.5 bg-rose-50/40 border border-rose-100 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={vulnerabilityFilter}
                onChange={(e) => setVulnerabilityFilter(e.target.value as any)}
                className="px-3 py-2 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-rose-900 focus:outline-none"
              >
                <option value="TODOS">Todas as Vulnerabilidades</option>
                <option value="Alta">Vulnerabilidade Alta</option>
                <option value="Média">Vulnerabilidade Média</option>
                <option value="Baixa">Vulnerabilidade Baixa</option>
              </select>

              <button
                onClick={() => {
                  setImportSearch('');
                  setImportFilter('TODOS');
                  setIsImportModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                title="Importar pessoas cadastradas na Recepção Geral ou Triagem"
              >
                <ArrowDownToLine size={15} className="text-rose-600" />
                <span>Importar da Recepção</span>
                {participants.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full text-[10px] font-black">
                    {participants.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleOpenAssistidoModal(null)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer ml-auto md:ml-0"
              >
                <UserPlus size={15} />
                <span>Novo Assistido</span>
              </button>
            </div>
          </div>

          {/* ASSISTIDOS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssistidos.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-gray-400">
                <Users size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-bold">Nenhum assistido localizado com os filtros selecionados.</p>
              </div>
            ) : (
              filteredAssistidos.map((as) => {
                const isUnlocked = !!unlockedRecords[as.id];
                return (
                  <div 
                    key={as.id} 
                    className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                            as.vulnerabilityLevel === 'Alta' ? "bg-rose-100 text-rose-800" :
                            as.vulnerabilityLevel === 'Média' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          )}>
                            Vulnerabilidade {as.vulnerabilityLevel}
                          </span>
                          <h4 className="text-base font-black text-rose-950 mt-1">{as.name}</h4>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-rose-400 shrink-0" />
                            <span>{as.neighborhood} • {as.city}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenQrModal(as)}
                          title="Gerar Cartão Digital / QR Code do Assistido"
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <QrCode size={18} />
                        </button>
                      </div>

                      {/* Summary Tags */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md">Família: {as.memberCount} pessoas</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md">Segurança: {as.foodSecurity}</span>
                        {as.hasChildrenUnder12 && <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-md">Crianças &lt; 12</span>}
                        {as.hasElderly && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">Idoso no Lar</span>}
                      </div>

                      {/* LGPD Sensitive Data Section */}
                      <div className="p-3 bg-rose-50/40 rounded-2xl border border-rose-100/60 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
                            <Shield size={12} />
                            Prontuário Socioeconômico
                          </span>
                          <button
                            onClick={() => toggleUnlockRecord(as.id, as.name)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                          >
                            {isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                            <span>{isUnlocked ? 'Ocultar' : 'Desbloquear (Sigilo)'}</span>
                          </button>
                        </div>

                        {isUnlocked ? (
                          <div className="space-y-1 text-[11px] text-gray-700 animate-in fade-in duration-200">
                            <p><strong>CPF:</strong> {as.cpf || 'Não informado'}</p>
                            <p><strong>Renda Familiar:</strong> R$ {Number(as.familyIncome || 0).toFixed(2)}</p>
                            <p><strong>Benefício:</strong> {as.socialBenefits || 'Nenhum'}</p>
                            <p><strong>Ocupação:</strong> {as.occupation || 'Não informado'}</p>
                            {as.specialNeeds && (
                              <p className="text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-100 mt-1">
                                <strong>Necessidade Especial:</strong> {as.specialNeeds}
                              </p>
                            )}
                            {as.fraternalNotes && (
                              <p className="text-indigo-900 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 mt-1 italic">
                                "{as.fraternalNotes}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic">
                            Dados confidenciais protegidos pela LGPD. Clique para consultar.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-rose-50 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenSignatureModal(as)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckSquare size={13} />
                        <span>Entregar Cesta</span>
                      </button>

                      <button
                        onClick={() => handleOpenForwardModal(as)}
                        title="Encaminhar para Atendimento Fraterno ou Passe"
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <HeartHandshake size={16} />
                      </button>

                      <button
                        onClick={() => handleOpenAssistidoModal(as)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                        title="Editar Prontuário"
                      >
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ESTOQUE INTELIGENTE & KITS */}
      {activeTab === 'kits' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-3xl shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers size={20} className="text-purple-300" />
                <h3 className="text-lg font-black tracking-tight">Estoque Inteligente & Rendimento de Cestas</h3>
              </div>
              <p className="text-xs text-purple-200">
                Cálculo automático de montagem de cestas com base nos insumos atualmente disponíveis no estoque de donativos.
              </p>
            </div>

            <button
              onClick={() => setIsKitModalOpen(true)}
              className="px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
            >
              + Novo Modelo de Kit
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {kitYieldCalculations.map((calc) => {
              const isAvailableToAssemble = calc.maxPossibleBaskets > 0;
              return (
                <div key={calc.kitId} className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                          {calc.targetCategory}
                        </span>
                        <h4 className="text-lg font-black text-slate-900 mt-1">{calc.kitName}</h4>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Rendimento Possível</span>
                        <span className={cn(
                          "text-2xl font-black",
                          calc.maxPossibleBaskets > 10 ? "text-emerald-600" :
                          calc.maxPossibleBaskets > 0 ? "text-amber-600" : "text-rose-600"
                        )}>
                          {calc.maxPossibleBaskets} cestas
                        </span>
                      </div>
                    </div>

                    {/* Breakdown of items */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
                        Composição do Kit e Disponibilidade de Insumos:
                      </span>
                      <div className="space-y-1.5">
                        {calc.itemsBreakdown.map((item, idx) => {
                          const percent = Math.min(100, Math.floor((item.available / (item.required * (calc.maxPossibleBaskets || 1))) * 100));
                          return (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800 block">{item.itemName}</span>
                                <span className="text-[10px] text-gray-400">
                                  Requer: {item.required} {item.unit} por cesta • Em Estoque: <strong>{item.available} {item.unit}</strong>
                                </span>
                              </div>

                              {item.limitingFactor && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md uppercase">
                                  Fator Limitante
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Batch Assembly Action Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 font-medium">
                      {isAvailableToAssemble ? 'Pronto para montagem física' : 'Insumos insuficientes para novo lote'}
                    </span>

                    <button
                      disabled={!isAvailableToAssemble}
                      onClick={() => handleAssembleBaskets(calc.kitId, 1)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                        isAvailableToAssemble 
                          ? "bg-purple-700 hover:bg-purple-800 text-white shadow-md" 
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Package size={14} />
                      <span>Baixar Insumos (Montar 1 Cesta)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. CESTAS BÁSICAS (ENTREGAS) */}
      {activeTab === 'cestas' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-rose-950">Histórico de Entregas de Cestas Básicas</h3>
              <p className="text-xs text-gray-400 font-medium">Registro de recebimentos com confirmação de assinatura e QR code</p>
            </div>

            <button
              onClick={() => {
                if (assistidos.length > 0) {
                  handleOpenSignatureModal(assistidos[0]);
                } else {
                  showToast('Cadastre primeiro um assistido para registrar a entrega.');
                }
              }}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              + Nova Entrega com Recibo
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-rose-50/70 border-b border-rose-100 text-rose-900 font-black text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Assistido Beneficiário</th>
                    <th className="p-4">Data da Entrega</th>
                    <th className="p-4">Tipo da Cesta</th>
                    <th className="p-4">Responsável da Casa</th>
                    <th className="p-4 text-center">Assinatura Digital</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {cestas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        Nenhum registro de entrega de cesta cadastrado.
                      </td>
                    </tr>
                  ) : (
                    cestas.map((c) => (
                      <tr key={c.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="p-4 font-bold text-rose-950">{c.assistidoName}</td>
                        <td className="p-4 text-gray-600 font-medium">{c.date}</td>
                        <td className="p-4 font-semibold text-rose-800">{c.basketType}</td>
                        <td className="p-4 text-gray-600">{c.responsible}</td>
                        <td className="p-4 text-center">
                          {c.signatureConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Confirmada
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={handleGeneratePdfReport}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir Comprovante"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. ESTOQUE DE DOAÇÕES */}
      {activeTab === 'doacoes' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-rose-950">Estoque de Alimentos & Donativos Recebidos</h3>
              <p className="text-xs text-gray-400 font-medium">Controle de entradas de campanhas, cultos do lar e doadores fraternos</p>
            </div>

            <button
              onClick={() => setIsDoacaoModalOpen(true)}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              + Registrar Doação Recebida
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doacoes.map((d) => (
              <div key={d.id} className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                      {d.type}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{d.entryDate}</span>
                  </div>
                  <h4 className="text-sm font-black text-rose-950">{d.description}</h4>
                  <p className="text-xs text-gray-500 font-medium">Doador: <strong>{d.donor}</strong></p>
                  {d.expiryDate && (
                    <p className="text-[10px] text-amber-700 font-bold">Validade: {d.expiryDate}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-rose-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Disponível</span>
                    <span className="text-xl font-black text-rose-900">{d.qty} {d.unit}</span>
                  </div>

                  <button
                    onClick={() => {
                      dataService.deleteSocialDoacao(d.id);
                      showToast(`Item ${d.description} removido.`);
                    }}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. VISITAS FRATERNAS */}
      {activeTab === 'visitas' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-rose-950">Visitas Fraternas aos Lares</h3>
              <p className="text-xs text-gray-400 font-medium">Acompanhamento in loco das condições de moradia e acolhimento espiritual</p>
            </div>

            <button
              onClick={() => setIsVisitaModalOpen(true)}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              + Novo Relatório de Visita
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visitas.map((v) => (
              <div key={v.id} className="p-6 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-rose-950">{v.assistidoName}</h4>
                  <span className="text-xs font-bold text-gray-400 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                    {v.date}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">Situação Encontrada</span>
                    <p className="text-gray-700 font-medium mt-0.5">{v.situationFound}</p>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <span className="text-[10px] font-black uppercase text-rose-800 block">Necessidades Observadas</span>
                    <p className="text-rose-900 font-medium mt-0.5">{v.needsObserved}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <span className="text-[10px] font-black uppercase text-indigo-800 block">Encaminhamento Realizado</span>
                    <p className="text-indigo-950 font-medium mt-0.5">{v.forwarding}</p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 font-bold pt-2 border-t border-rose-50">
                  Voluntário Visitador: {v.responsible}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. OFICINAS & PROJETOS */}
      {activeTab === 'oficinas' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-rose-950">Oficinas Profissionalizantes & Emancipação</h3>
              <p className="text-xs text-gray-400 font-medium">Projetos de capacitação para dignidade e renda própria das famílias</p>
            </div>

            <button
              onClick={() => setIsOficinaModalOpen(true)}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              + Nova Oficina / Projeto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projetos.map((p) => (
              <div key={p.id} className="p-6 bg-white rounded-3xl border border-purple-100 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{p.participantsCount} inscritos</span>
                  </div>

                  <h4 className="text-base font-black text-purple-950">{p.name}</h4>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{p.objective}</p>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-[11px] space-y-1">
                  <p><strong>Público-Alvo:</strong> {p.target}</p>
                  <p><strong>Horário:</strong> {p.schedule}</p>
                  <p><strong>Coordenação:</strong> {p.coordinator}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. VOLUNTÁRIOS */}
      {activeTab === 'voluntarios' && (
        <div className="space-y-6 text-left animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-sm">
            <div>
              <h3 className="text-base font-black text-rose-950">Equipe de Voluntários da Ação Social</h3>
              <p className="text-xs text-gray-400 font-medium">Trabalhadores dedicados à triagem, visitas e montagem de cestas</p>
            </div>

            <button
              onClick={() => setIsVoluntarioModalOpen(true)}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              + Adicionar Voluntário
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {voluntarios.map((vol) => (
              <div key={vol.id} className="p-5 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                    {vol.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-950">{vol.name}</h4>
                    <p className="text-[11px] text-rose-600 font-bold">{vol.role}</p>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-gray-600 pt-2 border-t border-rose-50">
                  <p><strong>Disponibilidade:</strong> {vol.availability}</p>
                  <p><strong>Contato:</strong> {vol.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL: QR CODE CARD --- */}
      <AnimatePresence>
        {isQrModalOpen && qrTargetAssistido && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-sm w-full space-y-4 text-center border border-rose-100 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Cartão Digital do Assistido</span>
                <button onClick={() => setIsQrModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex justify-center">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl shadow-sm" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">Gerando...</div>
                )}
              </div>

              <div className="text-left space-y-1">
                <h4 className="text-base font-black text-rose-950">{qrTargetAssistido.name}</h4>
                <p className="text-xs text-gray-500 font-medium">Bairro: {qrTargetAssistido.neighborhood}</p>
                <p className="text-xs text-gray-500 font-medium">Composição: {qrTargetAssistido.memberCount} pessoas</p>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                Imprimir Cartão de Identificação
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DIGITAL SIGNATURE FOR CESTA DELIVERY --- */}
      <AnimatePresence>
        {isSignatureModalOpen && signatureAssistido && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-md w-full space-y-4 text-left border border-rose-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Recibo de Cesta Básica</span>
                  <h4 className="text-base font-black text-slate-900">{signatureAssistido.name}</h4>
                </div>
                <button onClick={() => setIsSignatureModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Tipo da Cesta</label>
                  <select
                    value={signatureBasketType}
                    onChange={(e) => setSignatureBasketType(e.target.value)}
                    className="w-full p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Padrão FEB">Cesta Básica Padrão FEB</option>
                    <option value="Gestante & Primeira Infância">Cesta Nutricional Infantil / Gestante</option>
                    <option value="Emergencial">Cesta Emergencial</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Responsável da Casa</label>
                  <input
                    type="text"
                    value={signatureResponsible}
                    onChange={(e) => setSignatureResponsible(e.target.value)}
                    className="w-full p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Signature Canvas Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase text-gray-500">
                      Assinatura Digital do Beneficiário (Desenhe na tela)
                    </label>
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={120}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleEndDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleEndDraw}
                    className="w-full h-28 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl cursor-crosshair touch-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignatureDelivery}
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Confirmar & Salvar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: SPIRITUAL FORWARDING TO FRATERNO / PASSE --- */}
      <AnimatePresence>
        {isForwardModalOpen && forwardAssistido && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-md w-full space-y-4 text-left border border-indigo-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake size={20} className="text-indigo-600" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Integração Espiritual</span>
                    <h4 className="text-base font-black text-slate-900">Encaminhar {forwardAssistido.name}</h4>
                  </div>
                </div>
                <button onClick={() => setIsForwardModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Destino Espiritual</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForwardTarget('FRATERNO')}
                      className={cn(
                        "p-3 rounded-2xl font-black text-xs text-left border transition-all cursor-pointer",
                        forwardTarget === 'FRATERNO' 
                          ? "bg-indigo-700 text-white border-indigo-700 shadow-md" 
                          : "bg-indigo-50/50 text-indigo-900 border-indigo-100 hover:bg-indigo-50"
                      )}
                    >
                      <Users size={16} className="mb-1" />
                      <div>Atendimento Fraterno</div>
                      <span className="text-[9px] font-normal opacity-80 block">Escuta & Orientação</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForwardTarget('PASSE')}
                      className={cn(
                        "p-3 rounded-2xl font-black text-xs text-left border transition-all cursor-pointer",
                        forwardTarget === 'PASSE' 
                          ? "bg-indigo-700 text-white border-indigo-700 shadow-md" 
                          : "bg-indigo-50/50 text-indigo-900 border-indigo-100 hover:bg-indigo-50"
                      )}
                    >
                      <Zap size={16} className="mb-1" />
                      <div>Passe & Fluidoterapia</div>
                      <span className="text-[9px] font-normal opacity-80 block">Renovação Magnética</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                    Observações Confidenciais para o Atendente
                  </label>
                  <textarea
                    rows={3}
                    value={forwardNotes}
                    onChange={(e) => setForwardNotes(e.target.value)}
                    className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-xs font-medium focus:outline-none"
                    placeholder="Descreva o motivo do encaminhamento fraterno..."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(false)}
                  className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteForwarding}
                  className="w-2/3 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Enviar Encaminhamento</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: CADASTRO / EDIÇÃO DE ASSISTIDO --- */}
      <AnimatePresence>
        {isAssistidoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-2xl w-full space-y-4 text-left border border-rose-100 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="space-y-0.5">
                  <h4 className="text-lg font-black text-rose-950">
                    {selectedAssistido ? 'Editar Prontuário de Assistido' : 'Novo Cadastro Socioeconômico (LGPD)'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Ação e Promoção Social Espírita (SAPSE) • Dados confidenciais e isolados
                  </p>
                </div>
                <button onClick={() => setIsAssistidoModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* QUICK RECEPTION PICKER (IF NEW RECORD) */}
              {!selectedAssistido && participants.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-950">
                    <Zap size={16} className="text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">⚡ Puxar Dados da Recepção / Triagem:</span>
                      <p className="text-[10px] text-rose-800">
                        Preencha instantaneamente nome, CPF, telefone e endereço sem conflitos.
                      </p>
                    </div>
                  </div>
                  <select
                    className="w-full sm:w-auto px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                    onChange={(e) => {
                      const p = participants.find(part => part.id === e.target.value);
                      if (p) {
                        handleImportParticipant(p);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um frequentador...</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.cpf ? `(${p.cpf})` : ''} {p.neighborhood ? `• ${p.neighborhood}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  // Validações de CPF, Telefone e CEP
                  if (formData.cpf) {
                    const cpfCheck = validateCPF(formData.cpf);
                    if (!cpfCheck.valid) {
                      alert(`⚠️ CPF inválido: ${cpfCheck.error}`);
                      return;
                    }
                  }

                  if (formData.phone) {
                    const phoneCheck = validatePhone(formData.phone);
                    if (!phoneCheck.valid) {
                      alert(`⚠️ Telefone inválido: ${phoneCheck.error}`);
                      return;
                    }
                  }

                  if (formData.cep) {
                    const cleanCep = formData.cep.replace(/\D/g, '');
                    if (cleanCep.length > 0 && cleanCep.length !== 8) {
                      alert('⚠️ CEP inválido: O CEP deve conter 8 dígitos.');
                      return;
                    }
                  }

                  const targetId = formData.id || selectedAssistido?.id || `as_${Date.now()}`;
                  const newAs: SocialAssistido = {
                    id: targetId,
                    name: formData.name,
                    cpf: formData.cpf,
                    birthDate: formData.birthDate,
                    phone: formData.phone,
                    cep: formData.cep,
                    address: formData.address,
                    neighborhood: formData.neighborhood,
                    city: formData.city || 'Mirante do Sul',
                    state: formData.state || 'BA',
                    isFamilyHead: true,
                    memberCount: Number(formData.memberCount || 1),
                    housingStatus: formData.housingStatus,
                    schooling: formData.schooling,
                    occupation: formData.occupation,
                    familyIncome: Number(formData.familyIncome || 0),
                    specialNeeds: formData.specialNeeds,
                    fraternalNotes: formData.fraternalNotes,
                    employmentStatus: formData.employmentStatus,
                    socialBenefits: formData.socialBenefits,
                    foodSecurity: formData.foodSecurity,
                    healthStatus: formData.healthStatus,
                    emotionalStatus: formData.emotionalStatus,
                    vulnerabilityLevel: formData.vulnerabilityLevel,
                    hasChildrenUnder12: formData.hasChildrenUnder12,
                    hasElderly: formData.hasElderly,
                    registeredAt: selectedAssistido?.registeredAt || Date.now()
                  };

                  await dataService.saveSocialAssistido(newAs);
                  logLgpdAudit(
                    selectedAssistido ? 'Edição de Prontuário' : 'Novo Cadastro Social',
                    `Gravou ficha de ${newAs.name}`
                  );
                  setIsAssistidoModalOpen(false);
                  showToast('✅ Ficha cadastral salva com sucesso no Firestore!');
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Nome Completo *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Ex: Maria das Dores Silva"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <CpfField
                      id="sapse-cpf-field"
                      value={formData.cpf}
                      onChange={(cpf) => setFormData(prev => ({ ...prev, cpf }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <PhoneField
                      id="sapse-phone-field"
                      value={formData.phone}
                      onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Pessoas no Lar</label>
                    <input
                      type="number"
                      value={formData.memberCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, memberCount: Number(e.target.value) || 1 }))}
                      min={1}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <CepField
                      id="sapse-cep-field"
                      value={formData.cep || ''}
                      onChange={(cep) => setFormData(prev => ({ ...prev, cep }))}
                      onAddressFound={(data) => {
                        setFormData((prev) => ({
                          ...prev,
                          cep: data.cep,
                          city: data.fullCityState || data.city,
                          state: data.state,
                          neighborhood: data.neighborhood || prev.neighborhood,
                          address: data.address ? (prev.address ? `${data.address}, ${prev.address}` : data.address) : prev.address
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Bairro</label>
                    <input
                      value={formData.neighborhood}
                      onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Bairro"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Cidade / UF (Auto pelo CEP)</label>
                    <input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Cidade / UF"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Endereço Completo (Rua, Número, Complemento)</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, complemento"
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Vulnerabilidade Social</label>
                    <select
                      value={formData.vulnerabilityLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, vulnerabilityLevel: e.target.value as any }))}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    >
                      <option value="Alta">Alta Vulnerabilidade</option>
                      <option value="Média">Média Vulnerabilidade</option>
                      <option value="Baixa">Baixa Vulnerabilidade</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Segurança Alimentar</label>
                    <select
                      value={formData.foodSecurity}
                      onChange={(e) => setFormData(prev => ({ ...prev, foodSecurity: e.target.value as any }))}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    >
                      <option value="Grave">Insegurança Grave</option>
                      <option value="Moderada">Insegurança Moderada</option>
                      <option value="Leve">Insegurança Leve</option>
                      <option value="Regular">Regular / Segura</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Renda Familiar Estimada (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.familyIncome}
                      onChange={(e) => setFormData(prev => ({ ...prev, familyIncome: Number(e.target.value) || 0 }))}
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Ocupação / Trabalho</label>
                    <input
                      value={formData.occupation}
                      onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="Ex: Diarista, Desempregado, Aposentado"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Benefícios Sociais</label>
                    <input
                      value={formData.socialBenefits}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialBenefits: e.target.value }))}
                      placeholder="Ex: Bolsa Família, BPC, Vale Gás"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 items-center flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={formData.hasChildrenUnder12}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasChildrenUnder12: e.target.checked }))}
                      className="rounded text-rose-600"
                    />
                    <span>Possui Crianças &lt; 12 anos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={formData.hasElderly}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasElderly: e.target.checked }))}
                      className="rounded text-rose-600"
                    />
                    <span>Possui Idosos no Lar</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Necessidades Especiais / Saúde</label>
                  <textarea
                    rows={2}
                    value={formData.specialNeeds}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialNeeds: e.target.value }))}
                    placeholder="Medicamentos contínuos, deficiências ou alergias da família..."
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Observações do Acolhimento Fraterno</label>
                  <textarea
                    rows={2}
                    value={formData.fraternalNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, fraternalNotes: e.target.value }))}
                    placeholder="Histórico moral, apoio espiritual e receptividade doutrinária..."
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                  />
                </div>

                {/* LGPD GUARANTEE NOTICE */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Segurança de Dados:</strong> Este prontuário é armazenado de forma independente na coleção do SAPSE, garantindo sigilo doutrinário e sem risco de duplicidade com a Recepção ou outros setores.
                  </span>
                </div>

                <div className="pt-3 border-t border-rose-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAssistidoModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    Salvar Prontuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: IMPORTAR FREQUENTADOR DA RECEPÇÃO GERAL --- */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-3xl w-full space-y-4 text-left border border-rose-100 shadow-2xl max-h-[90vh] flex flex-col justify-between">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine size={20} className="text-rose-700" />
                      <h4 className="text-lg font-black text-rose-950">
                        Importar Frequentador da Recepção Geral / Triagem
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Vincule e copie cadastros existentes na casa espírita para o prontuário da Ação Social (SAPSE)
                    </p>
                  </div>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 text-rose-400" size={16} />
                    <input
                      type="text"
                      value={importSearch}
                      onChange={(e) => setImportSearch(e.target.value)}
                      placeholder="Pesquisar por nome, CPF, bairro ou telefone..."
                      className="w-full pl-9 pr-4 py-2 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold self-stretch sm:self-auto">
                    <button
                      onClick={() => setImportFilter('TODOS')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all text-[11px]",
                        importFilter === 'TODOS' ? "bg-white text-rose-900 shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      Todos ({participants.length})
                    </button>
                    <button
                      onClick={() => setImportFilter('NAO_CADASTRADOS')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all text-[11px]",
                        importFilter === 'NAO_CADASTRADOS' ? "bg-white text-rose-900 shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      Disponíveis para Importar
                    </button>
                    <button
                      onClick={() => setImportFilter('JA_CADASTRADOS')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all text-[11px]",
                        importFilter === 'JA_CADASTRADOS' ? "bg-white text-rose-900 shadow-xs font-black" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      Já no SAPSE
                    </button>
                  </div>
                </div>

                {/* Explanatory Info Box */}
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-rose-900 flex items-start gap-2.5">
                  <Info size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Integração Segura e Respeitosa:</strong> A importação transfere dados cadastrais (nome, telefone, endereço, data de nascimento e notas iniciais) diretamente para a coleção do SAPSE, permitindo o enriquecimento socioeconômico sem interferir na fila de atendimento da Recepção ou de outros departamentos.
                  </div>
                </div>

                {/* List of Participants */}
                <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                  {filteredParticipants.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold">Nenhum frequentador localizado com o termo de busca.</p>
                    </div>
                  ) : (
                    filteredParticipants.map((p) => {
                      const isAlreadyInSocial = assistidos.some(
                        a => (p.cpf && a.cpf === p.cpf) || 
                             a.id === p.id || 
                             (a.name && p.name && a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
                      );
                      const matchingAssistido = assistidos.find(
                        a => (p.cpf && a.cpf === p.cpf) || 
                             a.id === p.id || 
                             (a.name && p.name && a.name.trim().toLowerCase() === p.name.trim().toLowerCase())
                      );

                      return (
                        <div
                          key={p.id}
                          className="p-3.5 bg-white border border-rose-100/80 rounded-2xl hover:border-rose-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-rose-950">{p.name}</span>
                              {p.vulnerabilityLevel && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                                  p.vulnerabilityLevel === 'Alta' || p.vulnerabilityLevel === 'Extrema' 
                                    ? "bg-rose-100 text-rose-800" 
                                    : "bg-amber-100 text-amber-800"
                                )}>
                                  Vulnerabilidade {p.vulnerabilityLevel}
                                </span>
                              )}
                              {isAlreadyInSocial ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase flex items-center gap-1">
                                  <CheckCircle2 size={10} />
                                  Já no SAPSE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">
                                  Disponível
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-medium">
                              {p.cpf && <span>CPF: <strong>{p.cpf}</strong></span>}
                              {p.phone && <span>Tel: {p.phone}</span>}
                              {p.neighborhood && <span>Bairro: {p.neighborhood}</span>}
                              {p.familyMembersCount && <span>Família: {p.familyMembersCount} pessoas</span>}
                            </div>

                            {(p.socialNotes || p.observation) && (
                              <p className="text-[10px] text-indigo-900 bg-indigo-50/60 px-2 py-0.5 rounded-md italic max-w-xl">
                                "{p.socialNotes || p.observation}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isAlreadyInSocial ? (
                              <button
                                onClick={() => {
                                  if (matchingAssistido) {
                                    handleOpenAssistidoModal(matchingAssistido);
                                    setIsImportModalOpen(false);
                                  }
                                }}
                                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                                <span>Ver Prontuário</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleImportParticipant(p)}
                                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <UserCheck size={14} />
                                <span>Importar para SAPSE</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-bold">
                  Total de Frequentadores: {participants.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: REGISTRAR DOAÇÃO --- */}
      <AnimatePresence>
        {isDoacaoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[32px] p-6 max-w-md w-full space-y-4 text-left border border-rose-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <h4 className="text-base font-black text-rose-950">Registrar Entrada de Doação / Insumo</h4>
                <button onClick={() => setIsDoacaoModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const newDon: SocialDoacao = {
                    id: `don_${Date.now()}`,
                    type: target.type.value,
                    description: target.description.value,
                    qty: Number(target.qty.value || 1),
                    unit: target.unit.value || 'un',
                    donor: target.donor.value || 'Anônimo',
                    entryDate: new Date().toISOString().split('T')[0],
                    responsible: currentUserName,
                    expiryDate: target.expiryDate.value || '',
                    status: 'Disponível'
                  };
                  await dataService.saveSocialDoacao(newDon);
                  setIsDoacaoModalOpen(false);
                  showToast('✅ Doação registrada com sucesso no estoque!');
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Categoria</label>
                  <select
                    name="type"
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Alimentos">Alimentos Não Perecíveis</option>
                    <option value="Roupas">Roupas / Cobertores / Calçados</option>
                    <option value="Higiene">Higiene & Fraldas</option>
                    <option value="Móveis">Móveis / Utensílios</option>
                    <option value="Recursos financeiros">Recursos Financeiros</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Descrição do Item</label>
                  <input
                    name="description"
                    required
                    placeholder="Ex: Arroz Tipo 1 (Sacos 5kg)"
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Quantidade</label>
                    <input
                      type="number"
                      name="qty"
                      defaultValue={1}
                      min={1}
                      required
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Unidade</label>
                    <select
                      name="unit"
                      className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="un">un (unidades)</option>
                      <option value="kg">kg (quilos)</option>
                      <option value="L">L (litros)</option>
                      <option value="pacotes">pacotes</option>
                      <option value="R$">R$ (reais)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Doador / Origem</label>
                  <input
                    name="donor"
                    placeholder="Ex: Campanha do Culto do Lar, Supermercado Central"
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Data de Validade (Se perecível)</label>
                  <input
                    type="date"
                    name="expiryDate"
                    className="w-full p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDoacaoModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Salvar Entrada
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
