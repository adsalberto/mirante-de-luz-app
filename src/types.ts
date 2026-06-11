export type UserRole = 'ADMIN' | 'ADM' | 'COORDENADOR' | 'SECRETARIO' | 'RECEPCIONISTA' | 'ATENDENTE' | 'VOLUNTARIO' | 'PALESTRANTE';

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string; // NEW: Official position/title
  sectorId?: string; // Linked sector
  active: boolean;
  photoUrl?: string; // NEW
  acceptedTerm?: boolean; // Confirmação do termo de voluntariado
  termAcceptedAt?: number;
  lgpdConsent?: boolean;
  lgpdDate?: number;
  phone?: string;
  observation?: string;
  createdAt: number;
  // Temporary Permissions fields
  tempRole?: UserRole;
  tempRoleExpiry?: number;
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
}

export const AGENDA_EVENT_TYPE_LABELS: Record<'DOUTRINARIA' | 'ESTUDO' | 'FESTA' | 'OUTRO', string> = {
  DOUTRINARIA: 'Doutrinária',
  ESTUDO: 'Estudos',
  FESTA: 'Festa/Evento',
  OUTRO: 'Outro'
};

export type SectorType = 'FRATERNO' | 'PASSE' | 'ESTUDO' | 'INFANCIA' | 'SOCIAL' | 'ADMINISTRATIVO' | 'MEDIUNICO' | 'OUTROS';

export const SECTOR_TYPE_LABELS: Record<SectorType, string> = {
  FRATERNO: 'Atendimento Fraterno',
  PASSE: 'Passe & Fluidoterapia',
  ESTUDO: 'Estudos',
  INFANCIA: 'Infância & Juventude',
  SOCIAL: 'Ação Social',
  ADMINISTRATIVO: 'Administrativo',
  MEDIUNICO: 'Trabalho Mediúnico',
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

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  minQuantity: number; // for low stock alerts
  unit: string; // e.g., 'unidade(s)', 'kg', 'pacote(s)', 'litro(s)'
  location: string; // e.g., 'Cozinha', 'Livraria', 'Salão'
  sectorId?: string; // Linked sector of the center
  status: InventoryItemStatus;
  observation?: string;
  lastUpdated: number;
  updatedBy: string; // Worker's name
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

export type TicketStatus = 'ABERTO' | 'ATENDIMENTO' | 'CONCLUIDO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA';

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
}

export interface ConstructionProject {
  id: string;
  name: string;
  location: string;
  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'FINALIZADO';
  budgetPlanned: number;
  budgetActual: number;
  startDate: string;
  estimatedEndDate: string;
  percentage: number;
  coordinator: string;
  stages: {
    name: string;
    status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
    duration: string;
    responsible: string;
  }[];
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


