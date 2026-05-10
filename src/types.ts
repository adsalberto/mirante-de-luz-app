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
}

export interface Speaker {
  id: string;
  name: string;
  phone: string;
  email: string;
  spiritistCenter: string;
  observations: string;
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
}

export type SectorType = 'FRATERNO' | 'PASSE' | 'ESTUDO' | 'INFANCIA' | 'SOCIAL' | 'ADMINISTRATIVO' | 'MEDIUNICO' | 'OUTROS';

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
}

export interface ScheduleAssignment {
  id: string;
  workerId: string;
  workerName: string; // denormalized for easier rendering
  days: ScheduleDay[]; // Multiple days with different shifts
}

export interface SectorSchedule {
  id: string;
  sectorId: string;
  sectorName: string;
  month: number; // 0-11
  year: number;
  assignments: ScheduleAssignment[];
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
