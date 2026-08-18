export type UserRole = 'ADMIN' | 'ADM' | 'COORDENADOR' | 'SECRETARIO' | 'RECEPCIONISTA' | 'ATENDENTE' | 'VOLUNTARIO' | 'PALESTRANTE';

export type LogCategory = 'RH' | 'ESTOQUE' | 'ATENDIMENTOS' | 'SISTEMA' | 'SEGURANÇA' | 'FINANCEIRO' | 'GERAL';
export type LogSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  category?: LogCategory;
  severity?: LogSeverity;
  targetId?: string;
  grantedBy?: string;
}

export type WorkerStatus = 'ATIVO' | 'EM_ANALISE' | 'EM_FORMACAO' | 'AFASTADO' | 'DESLIGADO';

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  ATIVO: 'Ativo',
  EM_ANALISE: 'Em Análise (Acolhimento)',
  EM_FORMACAO: 'Em Formação / Curso',
  AFASTADO: 'Afastado Temporariamente',
  DESLIGADO: 'Desligado / Inativo'
};

export interface WorkerSectorHistory {
  sectorId: string;
  sectorName: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  roleName?: string;
  notes?: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string; // NEW: Official position/title
  sectorId?: string; // Linked sector
  active: boolean;
  status?: WorkerStatus; // ATIVO, EM_ANALISE, EM_FORMACAO, AFASTADO, DESLIGADO
  photoUrl?: string; // NEW
  acceptedTerm?: boolean; // Confirmação do termo de voluntariado
  termAcceptedAt?: number;
  lgpdConsent?: boolean;
  lgpdDate?: number;
  phone?: string;
  observation?: string;
  interviewNotes?: string; // Anotações do acolhimento/entrevista inicial
  coursesCompleted?: string[]; // Ex: ['ESDE', 'EADE', 'Curso de Passe', 'Atendimento Fraterno']
  sectorHistory?: WorkerSectorHistory[];
  availabilityDays?: string[]; // Ex: ['Segunda-feira', 'Quarta-feira']
  createdAt: number;
  // Temporary Permissions fields
  tempRole?: UserRole;
  tempRoleExpiry?: number;
  grantedBy?: string;
  originalRole?: UserRole;
  loginCount?: number;
  mustChangePassword?: boolean;
  tempPassword?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContact?: string;
  cpf?: string;
  rg?: string;
  address?: string;
  cep?: string;
  neighborhood?: string;
  city?: string;
  profession?: string;
  nationality?: string;
}

export interface Speaker {
  id: string;
  name: string;
  phone: string;
  email: string;
  spiritistCenter: string;
  observations: string;
  city?: string;
  themes?: string;
  availability?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description: string;
  date: number;
  time: string;
  type: 'DOUTRINARIA' | 'ESTUDO' | 'FESTA' | 'OUTRO';
  speakerId?: string; // Link to Speaker if it's a Doutrinaria
  speakerName?: string; 
  location?: string;
  responsible?: string;
  expectedPublic?: number;
  streamUrl?: string;
}

export const AGENDA_EVENT_TYPE_LABELS: Record<'DOUTRINARIA' | 'ESTUDO' | 'FESTA' | 'OUTRO', string> = {
  DOUTRINARIA: 'Doutrinária',
  ESTUDO: 'Estudos',
  FESTA: 'Festa/Evento',
  OUTRO: 'Outro'
};

export type SectorType = 'FRATERNO' | 'PASSE' | 'ESTUDO' | 'INFANCIA' | 'SOCIAL' | 'ADMINISTRATIVO' | 'MEDIUNICO' | 'ARTE' | 'COMUNICACAO' | 'OUTROS';

export const SECTOR_TYPE_LABELS: Record<SectorType, string> = {
  FRATERNO: 'Atendimento Fraterno',
  PASSE: 'Passe & Fluidoterapia',
  ESTUDO: 'Estudos',
  INFANCIA: 'Infância & Juventude',
  SOCIAL: 'Ação Social',
  ADMINISTRATIVO: 'Administrativo',
  MEDIUNICO: 'Trabalho Mediúnico',
  ARTE: 'Arte Espírita (Coral & Teatro)',
  COMUNICACAO: 'Comunicação Social',
  OUTROS: 'Outros / Não Especificado'
};

export interface SectorDocument {
  id: string;
  name: string;
  uploadDate: number;
  url: string;
  size?: number;
  type: string;
  uploadedBy: string;
}

export interface Sector {
  id: string;
  name: string;
  type: SectorType;
  description: string;
  parentSectorId?: string; // ID of the parent sector (for sub-sectors)
  
  // Regiment/Organization Fields
  mission?: string;
  foundation?: string;
  location?: string;
  coordinator?: string;
  subcoordinator?: string;
  secretary?: string;
  workerProfile?: string;
  entryFlow?: string;
  mainActivities?: string;
  schedule?: string;
  meetingFrequency?: string;
  reportsTo?: string;
  interactions?: string;
  resources?: string;
  goals?: string;
  challenges?: string;

  // Document management
  documents?: SectorDocument[];
}

export interface Participant {
  id: string;
  name: string;
  birthDate: string;
  email?: string;
  phone: string;
  gender?: string;
  address: string;
  cep?: string;
  state?: string;
  cpf?: string;
  rg?: string;
  neighborhood?: string;
  city?: string;
  maritalStatus?: string;
  profession?: string;
  vulnerabilityLevel?: 'Baixa' | 'Média' | 'Alta' | 'Extrema';
  foodSecurity?: 'Seguro' | 'Insegurança Leve' | 'Insegurança Moderada' | 'Grave';
  monthlyIncome?: number;
  familyMembersCount?: number;
  socialNotes?: string;
  lastFoodBasketDate?: number;
  foodBasketsCount?: number;
  observation?: string;
  lgpdConsent: boolean;
  lgpdDate: number;
  registrationDate: number;
  currentStatus: 'IDLE' | 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'REFERRERED';
  photoUrl?: string;
  isWorker?: boolean;
  bloodType?: string;
  allergies?: string;
  emergencyContact?: string;
}

export interface ServiceQueueEntry {
  id: string;
  participantId: string;
  sectorId: string;
  arrivalDate: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  priority: boolean;
  notes?: string;
  assignedWorkerId?: string;
  ticketNumber?: string;
  participantName?: string;
  visitorType?: 'CADASTRO' | 'AVULSO' | 'PASSE_EXPRESSO' | 'PALESTRA';
  isAnonymous?: boolean;
  sectorType?: 'PASSE' | 'DOUTRINARIA' | 'FRATERNO' | string;
}

export interface PublicAttendanceCount {
  id: string;
  date: string; // YYYY-MM-DD
  doutrinariaCount: number;
  passeAvulsoCount: number;
  fraternoAvulsoCount: number;
  totalAttendees: number;
  lastUpdated: number;
}

export interface Evolution {
  id: string;
  participantId: string;
  workerId: string;
  sectorId: string;
  date: number;
  notesEncrypted: string; // To simulate sensitivity
  recommendations: string;
  nextStepSectorIds?: string[]; // Referral
  encaminhamento?: string; // NEW: Specific referral type/destination
  attachments?: SectorDocument[];
  emotionalStatus?: string;
  physicalHealth?: string;
  familyRelationship?: string;
  spirituality?: string;
  observations?: string;
  aspectsReports?: {
    emotionalStatus?: string;
    physicalHealth?: string;
    familyRelationship?: string;
    spirituality?: string;
  };
}

export interface Session {
  id: string;
  sectorId: string;
  date: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleDay {
  dayOfWeek: number;
  shift: string;
  specificDay?: number;
}

export interface ScheduleAssignment {
  id: string;
  workerId: string;
  workerName: string; // denormalized for easier rendering
  days: ScheduleDay[]; // Multiple days with different shifts
}

export interface SectorActivity {
  id: string;
  specificDay: number; // e.g. 16
  time: string; // e.g. '18:50 - 19:30'
  title: string; // e.g. 'Estudo do Evangelho - Cap V - Bem-aventurados os aflitos'
  dirigente?: string; // e.g. 'Altamir Arruda'
  passistas?: string[]; // list of passistas (string names)
  format?: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO'; // Format
  observations?: string; // Optional holiday/details
}

export interface SectorSchedule {
  id: string;
  sectorId: string;
  sectorName: string;
  month: number; // 0-11
  year: number;
  assignments: ScheduleAssignment[];
  activities?: SectorActivity[];
}

export type InventoryCategory = 'MOBILIARIO' | 'ELETRONICOS' | 'LIVRARIA' | 'COZINHA' | 'LIMPEZA' | 'SUPRIMENTOS' | 'MANUTENCAO' | 'FIGURINO' | 'ACESSORIOS' | 'OUTROS';

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  MOBILIARIO: 'Mobiliário & Cadeiras',
  ELETRONICOS: 'Eletrônicos & Som',
  LIVRARIA: 'Livraria & Doutrinários',
  COZINHA: 'Cozinha & Alimentação',
  LIMPEZA: 'Produtos de Limpeza',
  SUPRIMENTOS: 'Suprimentos / Escritório',
  MANUTENCAO: 'Materiais de Manutenção',
  FIGURINO: 'Figurino & Roupas',
  ACESSORIOS: 'Acessórios',
  OUTROS: 'Outros / Diversos'
};

export type InventoryItemStatus = 'BOM' | 'REGULAR' | 'RUIM' | 'EM_FALTA' | 'EM_MANUTENCAO';

export const INVENTORY_STATUS_LABELS: Record<InventoryItemStatus, string> = {
  BOM: 'Em Bom Estado',
  REGULAR: 'Regular / Desgastado',
  RUIM: 'Ruim',
  EM_FALTA: 'Em Falta / Acabou',
  EM_MANUTENCAO: 'Em Manutenção'
};

export type PatrimonioItemType = 'MATERIAL' | 'PATRIMONIO';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  itemType?: PatrimonioItemType;
  quantity: number;
  minQuantity: number; // for low stock alerts
  unit: string; // e.g., 'unidade(s)', 'kg', 'pacote(s)', 'litro(s)'
  location: string; // e.g., 'Cozinha', 'Livraria', 'Salão'
  sectorId?: string; // Linked sector of the center
  status: InventoryItemStatus;
  observation?: string;
  lastUpdated: number;
  updatedBy: string; // Worker's name
  patrimonyCode?: string; // Code for physical assets (e.g., PAT-2026-001)
  unitPrice?: number; // Estimated unit value for patrimonial calculation
}

export type InventoryMovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'BAIXA';

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryMovementType;
  quantity: number; // Positive quantity moved
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  updatedBy: string;
  timestamp: number;
}

export interface PatrimonioLoan {
  id: string;
  itemId?: string;
  itemName: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  borrowerSector?: string;
  quantity: number;
  loanDate: string; // YYYY-MM-DD
  expectedReturnDate?: string; // YYYY-MM-DD
  actualReturnDate?: string;
  status: 'EMPRESTADO' | 'DEVOLVIDO' | 'ATRASADO';
  observation?: string;
  returnedBy?: string;
  returnedCondition?: InventoryItemStatus;
  authorizedBy: string;
  timestamp: number;
}

export interface DashboardStats {
  waitingCount: number;
  inServiceCount: number;
  completedToday: number;
  activeVolunteers: number;
  totalParticipants: number;
  pendingVolunteers: number;
  sectorCount: number;
}

export function formatSectorName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('estudo') || lower.includes('sistematizado')) {
    return 'Estudos';
  }
  return trimmed;
}

export type TicketStatus = 'ABERTO' | 'ATENDIMENTO' | 'CONCLUIDO' | 'AGUARDANDO_PECA';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface TechTicket {
  id: string;
  number: string;
  senderName: string;
  senderEmail: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  technicianName?: string;
  createdAt: number;
  completedAt?: number;
  category?: 'Redes e Wi-Fi' | 'Hardware e Computadores' | 'Software e Sistemas' | 'Som e Audiovisual' | 'Transmissão Ao Vivo' | 'Acessos e Senhas' | 'Outros';
  location?: string;
  assetTag?: string;
  resolutionNotes?: string;
}

export interface TechInfraItem {
  id: string;
  name: string;
  type: 'Roteador Wi-Fi' | 'Servidor' | 'Mesa de Som' | 'Projetor/TV' | 'Nobreak' | 'Link Internet';
  location: string;
  status: 'Online' | 'Alerta' | 'Offline' | 'Manutenção';
  ipOrDetails?: string;
  lastChecked: string;
  responsible?: string;
}

export interface TechKnowledgeItem {
  id: string;
  title: string;
  category: string;
  problem: string;
  solution: string;
  steps: string[];
  updatedAt: string;
}

export interface TechLiveStream {
  id: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  platform: 'YouTube' | 'Instagram' | 'Facebook' | 'Interno';
  operatorAudio: string;
  operatorVideo: string;
  status: 'Agendado' | 'Em Teste' | 'Ao Vivo' | 'Concluído';
  streamUrl?: string;
  checklist?: {
    audioOk: boolean;
    videoOk: boolean;
    networkOk: boolean;
    slidesOk: boolean;
  };
}

export interface EvangelizacaoKid {
  id: string;
  name: string;
  age: number;
  birthDate?: string;
  roomId: string;
  parentName: string;
  parentPhone: string;
  parentLocationInHouse?: string;
  allergiesOrMedicalInfo?: string;
  badges?: string[];
  presenceToday?: boolean;
}

export interface EvangelizacaoRoom {
  id: string;
  name: string;
  cycle: string;
  ageRange: string;
  evangelistaName: string;
  auxiliarName?: string;
  locationRoom: string;
}

export interface EvangelizacaoAula {
  id: string;
  roomId: string;
  date: string;
  theme: string;
  doctrineReference: string;
  objective: string;
  activities: string;
  materialNeeded?: string;
}

export interface EvangelizacaoProjeto {
  id: string;
  title: string;
  description: string;
  category: 'Ação Social' | 'Campanha do Quilo' | 'Teatro & Arte' | 'Mocidade Unida' | 'Visita Fraterna';
  date: string;
  responsible: string;
  status: 'Planejado' | 'Em Execução' | 'Concluído';
}

export interface EvangelizacaoFrequencia {
  id: string;
  kidId: string;
  roomId: string;
  date: string;
  present: boolean;
}

export interface ObraExpense {
  id: string;
  projectId: string;
  description: string;
  category: 'MATERIAL' | 'MAO_DE_OBRA' | 'LOCACAO' | 'LICENCAS' | 'OUTROS';
  supplier?: string;
  amount: number;
  date: string;
  registeredBy: string;
  receiptRef?: string;
}

export interface ObraSimulation {
  id?: string;
  category: 'PINTURA' | 'BANHEIRO_PCD' | 'TELHADO' | 'ELETRICA_LED' | 'SALAO_GERAL' | 'OUTRO';
  areaSqMeters: number;
  standard: 'ECONOMICO' | 'MEDIO' | 'ALTA_DURABILIDADE';
  hasVolunteers: boolean;
  estimatedCost: number;
  estimatedDays: number;
  estimatedVolunteerSavings: number;
  materials: { item: string; quantity: string; estimatedPrice: number }[];
}

export interface ConstructionProject {
  id: string;
  name: string;
  location: string;
  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'PAUSADO' | 'FINALIZADO' | 'CONCLUIDO';
  budgetPlanned: number;
  budgetActual: number;
  startDate: string;
  estimatedEndDate: string;
  percentage: number;
  coordinator: string;
  stages: {
    id?: string;
    name: string;
    status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
    duration: string;
    responsible: string;
  }[];
  volunteerHoursEst?: number;
  notes?: string;
}

export interface VisitorLog {
  id: string;
  name: string;
  phone: string;
  document?: string;
  purpose: string;
  checkInTime: number;
  checkOutTime?: number;
  notes?: string;
}

export interface CleaningChecklist {
  id: string;
  roomName: string;
  status: 'LIMPO' | 'ATENCAO' | 'PENDENTE';
  responsibleName: string;
  lastCleanedAt: number;
  observations?: string;
}

export interface DoutrinarioMaterial {
  id: string;
  name: string;
  type: 'LIVRO' | 'APOSTILA' | 'PDF' | 'AUDIO' | 'VIDEO';
  author: string;
  category: 'OBRAS_BASICAS' | 'MEDIUNIDADE' | 'EVANGELIZACAO' | 'ESTUDOS' | 'REFORMA_INTIMA' | 'ATENDIMENTO_FRATERNO';
  fileUrl?: string;
  observations?: string;
  availableCopies?: number;
  totalCopies?: number;
}

export interface DoutrinarioPalestra {
  id: string;
  title: string;
  bookReference: string;
  speakerId?: string;
  speakerName: string;
  speakerIsGuest: boolean;
  date: string;
  time: string;
  status: 'PREVISTA' | 'CONFIRMADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'SUBSTITUIDA';
  slidesUrl?: string;
  recordingUrl?: string;
  attendanceCount?: number;
  notes?: string;
  substituteSpeakerName?: string;
  dirigenteName?: string;
  leituraAbertura?: string;
  preceInicialResp?: string;
  vibracoesResp?: string;
  preceFinalResp?: string;
  passesAtivos?: boolean;
  themeCategory?: 'OBRAS_BASICAS' | 'EVANGELHO' | 'FAMILIA' | 'CIENCIA_ESPIRITISMO' | 'REFORMA_INTIMA' | 'TRANSICAO_PLANETARIA' | 'OUTRO';
  createdAt: number;
}

export interface DoutrinarioExpositor {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'INTERNO' | 'CONVIDADO_EXTERNO';
  centerOrigin?: string;
  status: 'ATIVO' | 'INDISPONIVEL' | 'PLANTAO_EMERGENCIA';
  specialtyThemes: string[];
  availabilities: string[];
  termAccepted: boolean;
  termAcceptedDate?: string;
  bio?: string;
  photoUrl?: string;
}

export interface DoutrinarioPergunta {
  id: string;
  meetingDate: string;
  palestraTitle?: string;
  questionText: string;
  askerName?: string;
  status: 'RECEBIDA' | 'EM_TRIAGEM' | 'RESPONDIDA' | 'ARQUIVADA';
  answerText?: string;
  answeredBy?: string;
  doctrinalRef?: string;
  createdAt: number;
}

export interface DoutrinarioEmprestimoLivro {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string;
  readerName: string;
  readerPhone: string;
  readerEmail?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'EMPRESTADO' | 'DEVOLVIDO' | 'ATRASADO' | 'RENOVADO';
  notes?: string;
}

export interface DoutrinarioRoteiro {
  id: string;
  title: string;
  category: 'MESA_DIRETORA' | 'PRECES_VIBRACOES' | 'PASSES' | 'EXPOSITOR' | 'GERAL' | string;
  content: string;
  estimatedMinutes?: number;
  steps?: {
    order: number;
    title: string;
    description: string;
    durationMinutes: number;
  }[];
  date?: string;
  time?: string;
  dirigenteName?: string;
  leituraAberturaLivro?: string;
  leituraAberturaCap?: string;
  leituraAberturaTexto?: string;
  preceInicialResp?: string;
  palestraTema?: string;
  palestranteNome?: string;
  vibracoesResp?: string;
  avisosFraternos?: string[];
  preceFinalResp?: string;
  passesColetivos?: boolean;
  createdAt?: number;
}

export interface DoutrinarioReuniao {
  id: string;
  date: string;
  participants: string[];
  subjects: string;
  decisions: string;
  forwardings: string;
}

export interface DoutrinarioTrabalhador {
  id: string;
  name: string;
  role: 'EXPOSITOR' | 'REVISOR' | 'COORDENADOR' | 'APOIO_DOUTRINARIO';
  area: string;
  houseTime?: string;
  availability: string;
  contact: string;
}

export interface DoutrinarioApoio {
  id: string;
  fromSector: string;
  title: string;
  description: string;
  status: 'PENDENTE' | 'ATENDIDO';
  response?: string;
  date: string;
}

export interface DoutrinarioDiretriz {
  id: string;
  title: string;
  category: string;
  documentUrl?: string;
  date: string;
  responsible: string;
  observations?: string;
}

export interface SocialImpactLog {
  id: string;
  timestamp: number;
  amount: number;
  addedBy: string;
  note?: string;
}

export interface SocialImpactMetric {
  id: string;
  category: 'CESTAS_BASICAS' | 'ATENDIMENTOS_FRATERNOS' | 'PASSES_MINISTRADOS' | 'REFEICOES_SOPAO' | 'LIVROS_DOADOS' | 'HORAS_VOLUNTARIAS' | 'ARRECADACAO_FINANCEIRA';
  title: string;
  targetCount: number;
  currentCount: number;
  unit?: 'UNIDADES' | 'REAIS_BRL' | 'KILOS' | 'HORAS';
  period: 'MENSAL' | 'ANUAL';
  monthYear: string; // e.g. "08/2026"
  notes?: string;
  logs?: SocialImpactLog[];
  updatedAt: number;
}

export interface AnnouncementNotification {
  id: string;
  title: string;
  content: string;
  category: 'GERAL' | 'URGENTE' | 'ESCALA' | 'EVENTO' | 'ESPIRITUAL';
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  targetAudience: 'TODOS' | 'VOLUNTARIOS' | 'FREQUENTADORES' | 'COORDENADORES';
  displayOnMascotProjection: boolean;
  active: boolean;
  createdAt: number;
  authorName: string;
  isPinned?: boolean;
  expiresAt?: string;
  imageUrl?: string;
  readBy?: string[];
}

export interface MascotConfig {
  mascotName: string;
  customHouseName?: string;
  selectedVoiceIndex: number;
  voicePitch: number;
  voiceRate: number;
  autoSpeak: boolean;
  updatedAt: number;
  mascotType?: 'logos_robot' | 'custom_image';
  customImageUrl?: string;
  customAudioUrl?: string;
  customAudioName?: string;
  motto?: string;
  themeColor?: string;
}

export interface MascotScheduleActivity {
  id: string;
  time: string;
  title: string;
  speakerOrWorker: string;
  type: 'PALESTRA' | 'PASSE' | 'ESTUDO' | 'EVANGELIZACAO' | 'HARMONIZACAO';
  location: string;
  notes?: string;
}

export interface BookLoan {
  id: string;
  bookTitle: string;
  bookIsbnOrCode?: string;
  borrowerName: string;
  borrowerContact: string;
  loanDate: string; // YYYY-MM-DD
  dueDate: string;  // YYYY-MM-DD
  returnDate?: string;
  status: 'EMPRESTADO' | 'DEVOLVIDO' | 'ATRASADO';
  notes?: string;
}

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  category: 'DOACAO' | 'LIVRARIA_BAZAR' | 'EVENTO' | 'MANUTENCAO' | 'CONTAS_CONSUMO' | 'ASSISTENCIA_SOCIAL' | 'OUTROS' | string;
  date: string; // YYYY-MM-DD
  paymentMethod: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'TRANSFERENCIA' | string;
  proofUrl?: string;
  createdBy: string;
  sectorId?: string;
}

export interface AttendanceCheckIn {
  id: string;
  participantId: string;
  participantName: string;
  role: 'VOLUNTARIO' | 'FREQUENTADOR' | 'ATENDIDO' | 'PALESTRANTE';
  sectorOrActivity: string;
  timestamp: number;
  method: 'QR_CODE' | 'CODIGO_BARRAS' | 'MANUAL';
  status: 'PRESENTE' | 'JUSTIFICADO';
}

export interface ScheduleReminder {
  id: string;
  workerName: string;
  workerPhone: string;
  sectorName: string;
  date: string;
  shift: string;
  sentAt?: number;
  status: 'PENDENTE' | 'ENVIADO' | 'CONFIRMADO' | 'CANCELADO';
}

export interface MarketProduct {
  id: string;
  name: string;
  category: 'LIVRARIA' | 'CANTINA' | 'BAZAR';
  price: number;
  promoPrice?: number;
  stock: number;
  minLimit: number;
  expirationDate?: string;
  barcode?: string;
}

export interface CashSession {
  id?: string;
  isOpen: boolean;
  openedAt: string;
  openedBy: string;
  initialCash: number;
  closedAt?: string;
  transactionsCount: number;
  pixTotal: number;
  cashTotal: number;
  cardTotal: number;
  finalCashExpected?: number;
  finalCashRecorded?: number;
  difference?: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  duration: string; // e.g. "12:34"
  audioUrl: string;
}

export interface Audiobook {
  id: string;
  title: string;
  author: string;
  description: string;
  narrator: string;
  coverUrl: string;
  price: number;
  category: 'Espiritualidade' | 'Filosofia' | 'Autoconhecimento' | 'Meditação' | 'Infantil';
  duration: string;
  rating: number;
  tracks: AudioTrack[];
}

export interface AudioPurchase {
  id: string;
  audiobookId: string;
  userEmail: string;
  purchaseDate: string;
  amountPaid: number;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  status: 'PENDENTE' | 'APROVADO' | 'CANCELADO';
  pixCode?: string;
  pixQrCode?: string;
}

export interface AudiobookProgress {
  id?: string;
  userEmail: string;
  audiobookId: string;
  currentTrackIndex: number;
  currentSeconds: number;
  lastListenedAt: string;
  completedPercent: number;
}

export interface ArteGroup {
  id: string;
  name: string;
  modality: 'MÚSICA' | 'TEATRO' | 'POESIA' | 'DANÇA' | 'ARTES_VISUAIS' | string;
  coordinator: string;
  qty: number;
  schedule: string;
  status: 'Ativo' | 'Em Recesso' | 'Inativo' | string;
  description?: string;
  membersList?: string[];
  notes?: string;
}

export interface ArteSong {
  id: string;
  name: string;
  author: string;
  theme: string;
  category: 'Coral' | 'Vila Espírita' | 'Solista' | 'Infantil' | 'Instrumental' | string;
  key: string;
  duration: string;
  lyrics?: string;
  sheetMusicUrl?: string;
  audioDemoUrl?: string;
  observations?: string;
}

export interface ArtePiece {
  id: string;
  name: string;
  theme: string;
  author: string;
  duration: string;
  message: string;
  fullScript?: string;
  castRoles?: string;
  costumesNotes?: string;
}

export interface ArteEnsaio {
  id: string;
  groupId: string;
  groupName?: string;
  date: string;
  time: string;
  local: string;
  activity: string;
  presentQty?: number;
  totalQty?: number;
  attendeesList?: string[];
  technicalNotes?: string;
}

export interface ArteEvento {
  id: string;
  name: string;
  theme: string;
  date: string;
  local: string;
  coordinator: string;
  estimate: string;
  programSchedule?: string;
  participatingGroups?: string[];
  observations?: string;
}

export type JuventudeCycleCategory = 
  | 'INFANTIL_MATERNAL'
  | 'INFANTIL_JARDIM'
  | 'INFANTIL_PRIMARIO'
  | 'PRE_MOCIDADE'
  | 'MOCIDADE_I'
  | 'MOCIDADE_II'
  | 'JUVENTUDE_ADULTA';

export interface JuventudeAluno {
  id: string;
  name: string;
  age: number;
  cycleCategory?: JuventudeCycleCategory | string;
  roomId: string;
  responsibleName?: string;
  relationship?: string;
  phone?: string;
  phoneType?: 'whatsapp' | 'telefone';
  phone2?: string;
  phoneType2?: 'whatsapp' | 'telefone';
  studentPhone?: string;
  studentPhoneType?: 'whatsapp' | 'telefone';
  studentEmail?: string;
  allergies?: string;
  interests?: string[]; // e.g. ['Música / Canto', 'Teatro / Arte', 'Passe', 'Atendimento Fraterno', 'Ação Social', 'Acolhimento']
  schoolOrUniversity?: string;
  observations?: string;
  status?: 'ATIVO' | 'INATIVO' | 'AFASTADO' | string;
  presenceToday?: boolean;
}

export interface JuventudeSala {
  id: string;
  name: string;
  cycleCategory: 'INFANTIL' | 'MOCIDADE' | string;
  schedule: string;
  room: string;
  leaders: string;
  capacity?: number;
  count?: number;
}

export interface JuventudeAula {
  id: string;
  roomId: string;
  roomName?: string;
  date: string; // YYYY-MM-DD
  topic: string;
  evangelizador: string;
  doctrinalReference: string; // e.g. "O Livro dos Espíritos - Q. 776"
  summary: string;
  dynamicOrActivity?: string;
}

export interface JuventudeFrequencia {
  id: string;
  date: string; // YYYY-MM-DD
  roomId: string;
  studentId: string;
  studentName: string;
  present: boolean;
  notes?: string;
}


export interface MediunicoReuniao {
  id: string;
  name: string;
  type: 'DESOBSESSAO_PRIVATIVA' | 'ESTUDO_EDUCACAO_MEDIUNICA' | 'DOUTRINACAO_DIALOGO' | 'IRRADIACAO_SUSTENTACAO' | 'FLUIDOTERAPIA_PASSE';
  schedule: string; // e.g. "Sextas-feiras, 19h30"
  leader: string; // Dirigente / Coordenador Mediúnico
  room: string;
  memberIds?: string[];
  maxCapacity?: number;
  securityLevel: 'PRIVATIVA_FECHADA' | 'RESTRITA_MEMBROS' | 'ESTUDO_ORIENTADO';
  notes?: string;
  active: boolean;
}

export interface MediunicoTrabalhador {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // Multiple roles & faculties in mediumship
  roles: string[]; // e.g. ["Dirigente / Coordenador Mediúnico", "Esclarecedor / Dialogador", "Médium de Psicofonia", "Passista", "Sustentador Vibracional / Apoio"]
  faculties?: string[]; // e.g. ["Psicofonia", "Psicografia", "Vidência / Audiência", "Intuição", "Efeitos Físicos", "Passes"]
  formations: {
    eemStatus: 'CONCLUIDO' | 'EM_ANDAMENTO' | 'NAO_INICIADO'; // Estudo e Prática da Mediunidade
    esdeStatus: 'CONCLUIDO' | 'EM_ANDAMENTO' | 'NAO_INICIADO'; // Estudo Sistematizado da Doutrina Espírita
    livroDosMediums: boolean;
    otherCourses?: string;
  };
  availableDays: string[]; // e.g. ["Terça", "Sexta", "Sábado"]
  status: 'ATIVO' | 'AFASTADO_TEMPORARIO' | 'EM_OBSERVACAO' | 'DESLIGADO';
  entryDate: string;
  privateNotes?: string; // Informações confidenciais visíveis apenas à Coordenação Mediúnica
}

export interface MediunicoEscala {
  id: string;
  date: string; // YYYY-MM-DD
  reuniaoId: string;
  reuniaoName: string;
  leader: string; // Dirigente
  assignments: {
    trabalhadorId: string;
    trabalhadorName: string;
    assignedRoles: string[]; // Múltiplas funções ativas na sessão específica
  }[];
  notes?: string;
}

export interface MediunicoEncaminhamento {
  id: string;
  anonymousCode: string; // Ex: MED-2026-042
  anonymousInitials: string; // Ex: A.M.S.
  fullName?: string; // Nome civil completo (Visível exclusivamente para Coordenador Mediúnico e Admin)
  phone?: string;
  origin: string; // Ex: Atendimento Fraterno / Recepção
  spiritualNeed: string; // Ex: Processo obsessivo simples, harmonização fluídica, irradiação
  targetReuniaoId?: string;
  targetReuniaoName?: string;
  status: 'AGUARDANDO_ALOCACAO' | 'EM_TRATAMENTO' | 'ALTA_ESPIRITUAL' | 'ENCAMINHADO_OUTRO';
  date: string;
  observationConfidential?: string; // Resumo resguardado por sigilo
}

export interface MediunicoAuditLog {
  id: string;
  timestamp: number;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface ComunicacaoPost {
  id: string;
  title: string;
  text: string;
  platform: 'Instagram' | 'Facebook' | 'YouTube' | 'WhatsApp' | 'Telegram';
  date: string;
  hashtags?: string;
  status: 'Planejado' | 'Aguardando Revisão' | 'Aprovado' | 'Publicado';
  responsible: string;
  spiritObjective?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewNotes?: string;
  linkedEventId?: string;
  linkedEventTitle?: string;
}

export interface ComunicacaoNotice {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  date: string;
  target: string;
  status: 'rascunho' | 'publicado';
  spiritObjective?: string;
  approvedBy?: string;
}

export interface ComunicacaoEquipe {
  id: string;
  name: string;
  role: string;
  availability: string;
  equipments: string;
}

export interface ComunicacaoCampanha {
  id: string;
  name: string;
  objective: string;
  target: string;
  date: string;
  responsible: string;
  status: string;
  media: string;
  result?: string;
}

export interface ComunicacaoMidia {
  id: string;
  name: string;
  category: string;
  designer: string;
  url: string;
  status: string;
  spiritObjective?: string;
}

export interface PasseAtendimento {
  id: string;
  patientName: string;
  codeOrTicket?: string;
  typePasse: 'Passe Geral' | 'Passe Magnético / Específico' | 'Passe Domiciliar / Enfermo' | 'Passe de Infância';
  status: 'Aguardando' | 'Em Atendimento' | 'Concluído' | 'Cancelado';
  roomId?: string;
  roomName?: string;
  referralNotes?: string;
  hasFraternalReferral?: boolean;
  createdAt: number;
  attendedAt?: number;
  passistaName?: string;
  observations?: string;
}

export interface PassePassista {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'Ativo' | 'Em Descanso' | 'Afastado' | 'Em Formação';
  roomAssigned?: string;
  shift?: string;
  coursesCompleted: string[]; // e.g. ['Passe e Fluidoterapia', 'Atendimento Fraterno', 'EEM']
  harmonizationDoneToday?: boolean;
  notes?: string;
}

export interface PasseSala {
  id: string;
  name: string;
  type: 'Sala de Passe Coletivo' | 'Cabine de Passe Individual' | 'Câmara Fluídica';
  capacity: number;
  leaderName: string;
  activeStatus: 'Disponível' | 'Em Sessão' | 'Manutenção' | 'Higienizando';
  locationRoom?: string;
}

export interface PasseEscala {
  id: string;
  date: string; // YYYY-MM-DD
  timeShift: string; // e.g. "Quarta 19h30" or "Sábado 16h"
  teamName: string;
  passistasList: string[];
  coordinatorName: string;
  notes?: string;
}

export interface PasseFluidoterapia {
  id: string;
  patientName: string;
  bottleVolumeLiters: number;
  prescriptionDays: number; // 7, 14, 21 dias
  posologyNotes: string; // "1 cálice ao acordar e ao deitar após prece"
  status: 'Aguardando Fluidificação' | 'Fluidificada & Pronta' | 'Entregue';
  responsiblePassista?: string;
  createdAt: number;
  preparedAt?: number;
}

export interface SocialAssistido {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  birthDate: string;
  phone: string;
  cep?: string;
  address: string;
  neighborhood: string;
  city: string;
  state?: string;
  isFamilyHead: boolean;
  familyHeadName?: string;
  memberCount: number;
  housingStatus: string;
  schooling: string;
  occupation: string;
  familyIncome: number;
  specialNeeds?: string;
  fraternalNotes?: string;
  employmentStatus: string;
  socialBenefits: string;
  foodSecurity: 'Grave' | 'Moderada' | 'Leve' | 'Segura' | 'Regular';
  healthStatus: string;
  emotionalStatus: string;
  vulnerabilityLevel: 'Alta' | 'Média' | 'Baixa';
  hasChildrenUnder12: boolean;
  hasElderly: boolean;
  registeredAt?: number;
  qrCode?: string;
}

export interface SocialAtendimento {
  id: string;
  assistidoId: string;
  assistidoName: string;
  date: string;
  responsible: string;
  type: string;
  needIdentified: string;
  forwarding: string;
  observations: string;
  nextFollowUp?: string;
}

export interface SocialDoacao {
  id: string;
  type: 'Alimentos' | 'Roupas' | 'Higiene' | 'Móveis' | 'Recursos financeiros' | 'Outros';
  description: string;
  qty: number;
  unit: string;
  donor: string;
  entryDate: string;
  responsible: string;
  expiryDate?: string;
  status: 'Disponível' | 'Reservado' | 'Entregue';
}

export interface SocialCestaEntrega {
  id: string;
  assistidoId: string;
  assistidoName: string;
  date: string;
  basketType: string;
  responsible: string;
  signatureConfirmed: boolean;
  qrCodeScanned: boolean;
  notes?: string;
}

export interface SocialVoluntario {
  id: string;
  name: string;
  role: string;
  availability: string;
  contact: string;
  active: boolean;
}

export interface SocialProjeto {
  id: string;
  name: string;
  objective: string;
  target: string;
  coordinator: string;
  schedule: string;
  participantsCount: number;
  status: 'Ativo' | 'Em Planejamento' | 'Concluído';
}

export interface SocialVisita {
  id: string;
  assistidoId: string;
  assistidoName: string;
  date: string;
  responsible: string;
  situationFound: string;
  needsObserved: string;
  forwarding: string;
}

export interface SocialKitItem {
  itemName: string;
  requiredQty: number;
  unit: string;
}

export interface SocialKitCesta {
  id: string;
  name: string;
  description: string;
  targetCategory: string; // Ex: Padrão, Gestante/Bebê, Emergencial
  items: SocialKitItem[];
  createdAt: number;
}

// ==========================================
// SECRETARIA, GOVERNANÇA & DIRETORIA (ADMIN)
// ==========================================

export type AssociadoCategoria = 'EFETIVO' | 'CONTRIBUINTE' | 'BENEMERITO' | 'HONORARIO';
export type AssociadoStatus = 'ATIVO' | 'LICENCIADO' | 'DESLIGADO';

export interface AdminAssociado {
  id: string;
  nome: string;
  cpf?: string;
  email: string;
  telefone: string;
  endereco?: string;
  categoria: AssociadoCategoria;
  dataAdmissao: string;
  status: AssociadoStatus;
  mensalidadeValor?: number;
  diaVencimento?: number;
  ultimoPagamento?: string;
  adimplente: boolean;
  aptoVotoAssembleia: boolean;
  observacoes?: string;
  createdAt: number;
  updatedAt?: number;
}

export type AtaTipo = 'REUNIAO_DIRETORIA' | 'ASSEMBLEIA_ORDINARIA' | 'ASSEMBLEIA_EXTRAORDINARIA' | 'CONSELHO_FISCAL';
export type AtaStatus = 'RASCUNHO' | 'APROVADA' | 'REGISTRADA_CARTORIO';

export interface AdminAta {
  id: string;
  numero: string;
  tipo: AtaTipo;
  data: string;
  horaInicio: string;
  horaFim?: string;
  local: string;
  presidenteMesa: string;
  secretarioMesa: string;
  presentes: string[];
  pauta: string;
  deliberacoes: string;
  status: AtaStatus;
  livroNumero?: string;
  folhaNumero?: string;
  createdAt: number;
  updatedAt?: number;
}

export type DocumentoOficialTipo = 
  | 'TERMO_VOLUNTARIADO_LEI_9608'
  | 'TERMO_LGPD'
  | 'DECLARACAO_FREQUENCIA'
  | 'OFICIO_EXPEDIDO'
  | 'OFICIO_RECEBIDO'
  | 'CERTIFICADO_ESTUDOS';

export type DocumentoOficialStatus = 'EMITIDO' | 'ASSINADO' | 'ARQUIVADO';

export interface AdminDocumento {
  id: string;
  titulo: string;
  tipo: DocumentoOficialTipo;
  destinatarioOuBeneficiario: string;
  cpfOuDocumento?: string;
  dataEmissao: string;
  conteudo: string;
  status: DocumentoOficialStatus;
  codigoVerificacao?: string;
  responsavelEmissao: string;
  createdAt: number;
}

export type PatrimonioCategoria = 
  | 'EQUIPAMENTO_AUDIOVISUAL'
  | 'MOBILIARIO'
  | 'INFORMATICA'
  | 'INSTRUMENTO_MUSICAL'
  | 'ELETRODOMESTICO'
  | 'IMOVEL'
  | 'OUTROS';

export type PatrimonioEstado = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'NECESSITA_MANUTENCAO' | 'INSERVIVEL';

export interface AdminPatrimonioItem {
  id: string;
  numeroTombamento: string;
  denominacao: string;
  categoria: PatrimonioCategoria;
  localizacaoSala: string;
  estadoConservacao: PatrimonioEstado;
  dataAquisicao: string;
  formaAquisicao: 'DOACAO' | 'COMPRA' | 'COMODATO';
  valorEstimado?: number;
  doadorOuFornecedor?: string;
  responsavelGuarda?: string;
  observacoes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface AdminBalanceteMensal {
  id: string;
  mesAno: string;
  saldoAnterior: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoAtual: number;
  status: 'ABERTO' | 'FECHADO' | 'APROVADO_CONSELHO_FISCAL';
  parecerConselhoFiscal?: string;
  dataAprovacao?: string;
  createdAt: number;
}









