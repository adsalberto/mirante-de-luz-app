import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  Timestamp,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Worker, 
  Participant, 
  ServiceQueueEntry, 
  Evolution, 
  Sector, 
  SectorDocument,
  DashboardStats,
  Speaker,
  AgendaEvent,
  AuditLog,
  LogCategory,
  LogSeverity,
  SectorSchedule,
  InventoryItem,
  InventoryItemStatus,
  InventoryMovement,
  PatrimonioLoan,
  DoutrinarioMaterial,
  DoutrinarioReuniao,
  DoutrinarioTrabalhador,
  DoutrinarioApoio,
  DoutrinarioDiretriz,
  DoutrinarioPalestra,
  DoutrinarioExpositor,
  DoutrinarioPergunta,
  DoutrinarioEmprestimoLivro,
  DoutrinarioRoteiro,
  SocialImpactMetric,
  AnnouncementNotification,
  BookLoan,
  FinancialEntry,
  AttendanceCheckIn,
  PublicAttendanceCount,
  ScheduleReminder,
  MarketProduct,
  CashSession,
  Audiobook,
  AudioPurchase,
  AudiobookProgress,
  MascotConfig,
  MascotScheduleActivity,
  VisitorLog,
  CleaningChecklist,
  ArteGroup,
  ArteSong,
  ArtePiece,
  ArteEnsaio,
  ArteEvento,
  ComunicacaoPost,
  ComunicacaoNotice,
  ComunicacaoEquipe,
  ComunicacaoCampanha,
  ComunicacaoMidia,
  TechTicket,
  TechInfraItem,
  TechKnowledgeItem,
  TechLiveStream,
  EvangelizacaoKid,
  EvangelizacaoRoom,
  EvangelizacaoAula,
  EvangelizacaoProjeto,
  EvangelizacaoFrequencia,
  PasseAtendimento,
  PassePassista,
  PasseSala,
  PasseEscala,
  PasseFluidoterapia,
  SocialAssistido,
  SocialAtendimento,
  SocialDoacao,
  SocialCestaEntrega,
  SocialVoluntario,
  SocialProjeto,
  SocialVisita,
  SocialKitCesta,
  AdminAssociado,
  AdminAta,
  AdminDocumento,
  AdminPatrimonioItem,
  AdminBalanceteMensal
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.warn('Firestore Warning/Error:', errInfo.error, 'Path:', path, 'Op:', operationType);
}

class DataService {
  public async createLog(
    action: string,
    details?: string,
    category?: LogCategory,
    severity?: LogSeverity,
    extra?: { targetId?: string; grantedBy?: string }
  ) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
      
      const workerDoc = await getDoc(doc(db, 'trabalhadores', user.uid));
      const workerName = workerDoc.exists() ? workerDoc.data().name : (user.displayName || user.email);

      let cat = category;
      if (!cat) {
        const lower = (action + ' ' + (details || '')).toLowerCase();
        if (lower.includes('trabalhador') || lower.includes('permissão') || lower.includes('acesso') || lower.includes('voluntário')) cat = 'RH';
        else if (lower.includes('estoque') || lower.includes('patrimônio') || lower.includes('item') || lower.includes('movimentação')) cat = 'ESTOQUE';
        else if (lower.includes('atendido') || lower.includes('frequência') || lower.includes('atendimento') || lower.includes('fila')) cat = 'ATENDIMENTOS';
        else if (lower.includes('financeiro') || lower.includes('caixa') || lower.includes('venda')) cat = 'FINANCEIRO';
        else if (lower.includes('segurança') || lower.includes('senha') || lower.includes('login')) cat = 'SEGURANÇA';
        else cat = 'SISTEMA';
      }

      let sev = severity;
      if (!sev) {
        const lower = (action + ' ' + (details || '')).toLowerCase();
        if (lower.includes('exclusão') || lower.includes('delet') || lower.includes('baixa') || lower.includes('remov')) sev = 'CRITICAL';
        else if (lower.includes('permissão') || lower.includes('ajuste') || lower.includes('alteraç') || lower.includes('atualizaç')) sev = 'WARN';
        else sev = 'INFO';
      }

      const actionFormatted = `[${dateStr}] | [${timeStr}] | [${workerName}] | [${action}${details ? ': ' + details : ''}]`;

      const logData: Record<string, any> = {
        timestamp: Date.now(),
        userId: user.uid,
        userName: workerName || 'Desconhecido',
        action: action,
        details: details || '',
        category: cat,
        severity: sev,
        actionFormatted: actionFormatted
      };

      if (extra?.targetId !== undefined) {
        logData.targetId = extra.targetId;
      }
      if (extra?.grantedBy !== undefined) {
        logData.grantedBy = extra.grantedBy;
      }

      await addDoc(collection(db, 'logs'), logData);
    } catch (error) {
      console.error('Error creating log:', error);
    }
  }

  // --- LOGS ---
  subscribeToLogs(callback: (logs: AuditLog[]) => void, limitCount = 150) {
    const path = 'logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
        callback(list);
      }, (error) => {
        console.error("Error listening to logs:", error);
      });
    } catch (error) {
      console.error("Error setting up logs listener:", error);
      return () => {};
    }
  }

  async getLogs(limitCount = 150) {
    const path = 'logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  // --- WORKERS ---
  async getWorkers() {
    const path = 'trabalhadores';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async updateWorker(worker: Worker) {
    const path = `trabalhadores/${worker.id}`;
    try {
      await setDoc(doc(db, 'trabalhadores', worker.id), worker);
      this.createLog('Atualização de Trabalhador', `Nome: ${worker.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteWorker(id: string) {
    const path = `trabalhadores/${id}`;
    try {
      const workerDoc = await getDoc(doc(db, 'trabalhadores', id));
      const workerData = workerDoc.exists() ? workerDoc.data() : null;
      
      await deleteDoc(doc(db, 'trabalhadores', id));
      
      this.createLog('Exclusão de Trabalhador', 
        workerData ? `Nome: ${workerData.name} (ID: ${id})` : `ID: ${id}`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- SECTORS ---
  async getSectors() {
    const path = 'setores';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addSector(sector: Omit<Sector, 'id'>) {
    const path = 'setores';
    try {
      const docRef = await addDoc(collection(db, path), sector);
      const newSector = { id: docRef.id, ...sector };
      await updateDoc(docRef, { id: docRef.id }); // Ensure ID is inside
      this.createLog('Adição de Setor', `Nome: ${sector.name}`);
      return newSector;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateSector(sector: Sector) {
    const path = `setores/${sector.id}`;
    try {
      await setDoc(doc(db, 'setores', sector.id), sector);
      this.createLog('Atualização de Setor', `Nome: ${sector.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSector(id: string) {
    const path = `setores/${id}`;
    try {
      await deleteDoc(doc(db, 'setores', id));
      this.createLog('Exclusão de Setor', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async addSectorDocument(sectorId: string, docData: Omit<SectorDocument, 'id' | 'uploadDate'>) {
    const path = `setores/${sectorId}`;
    try {
      const sectorRef = doc(db, 'setores', sectorId);
      const sectorSnap = await getDoc(sectorRef);
      
      if (!sectorSnap.exists()) throw new Error('Setor não encontrado');
      
      const sector = sectorSnap.data() as Sector;
      const newDoc: SectorDocument = {
        ...docData,
        id: Math.random().toString(36).substring(7),
        uploadDate: Date.now()
      };
      
      const updatedDocs = [...(sector.documents || []), newDoc];
      await updateDoc(sectorRef, { documents: updatedDocs });
      
      this.createLog('Documento Adicionado ao Setor', `Setor: ${sector.name}, Documento: ${docData.name}`);
      return newDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  async deleteSectorDocument(sectorId: string, documentId: string) {
    const path = `setores/${sectorId}`;
    try {
      const sectorRef = doc(db, 'setores', sectorId);
      const sectorSnap = await getDoc(sectorRef);
      
      if (!sectorSnap.exists()) throw new Error('Setor não encontrado');
      
      const sector = sectorSnap.data() as Sector;
      const updatedDocs = (sector.documents || []).filter(d => d.id !== documentId);
      
      await updateDoc(sectorRef, { documents: updatedDocs });
      this.createLog('Documento Removido do Setor', `Setor: ${sector.name}, DocID: ${documentId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // --- PARTICIPANTS ---
  async getParticipants() {
    const path = 'atendidos';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addParticipant(p: Omit<Participant, 'id' | 'registrationDate' | 'currentStatus'>) {
    const path = 'atendidos';
    try {
      const newP = {
        ...p,
        registrationDate: Date.now(),
        currentStatus: 'IDLE' as const
      };
      const docRef = await addDoc(collection(db, path), newP);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Novo Cadastro de Atendido', `Nome: ${p.name}`);
      return { id: docRef.id, ...newP } as Participant;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateParticipant(p: Participant) {
    const path = `atendidos/${p.id}`;
    try {
      await setDoc(doc(db, 'atendidos', p.id), p);
      this.createLog('Atualização de Cadastro', `Nome: ${p.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteParticipant(id: string) {
    const path = `atendidos/${id}`;
    try {
      await deleteDoc(doc(db, 'atendidos', id));
      this.createLog('Exclusão de Cadastro', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- QUEUE ---
  subscribeToQueue(callback: (queue: ServiceQueueEntry[]) => void) {
    const path = 'fila';
    try {
      const q = collection(db, path);
      return onSnapshot(q, (snap) => {
        const queue = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceQueueEntry));
        callback(queue);
      }, (error) => {
        console.error("Queue listener error:", error);
      });
    } catch (error) {
      console.error("Error setting up queue listener:", error);
      return () => {};
    }
  }

  async getQueue() {
    const path = 'fila';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceQueueEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addToQueue(entry: Omit<ServiceQueueEntry, 'id' | 'status' | 'arrivalDate'>) {
    const path = 'fila';
    try {
      const newEntry = {
        ...entry,
        status: 'WAITING' as const,
        arrivalDate: Date.now()
      };
      const docRef = await addDoc(collection(db, path), newEntry);
      await updateDoc(docRef, { id: docRef.id });
      
      // Update participant status only if registered
      if (entry.participantId && !entry.participantId.startsWith('anon_')) {
        try {
          await updateDoc(doc(db, 'atendidos', entry.participantId), { currentStatus: 'WAITING' });
        } catch (e) {
          // Non-blocking if participant not found
        }
      }
      
      this.createLog('Encaminhamento para Fila', `Participante: ${entry.participantName || entry.participantId}`);
      return { id: docRef.id, ...newEntry } as ServiceQueueEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // --- ENTRADA EXPRESSA / VISITANTE ANÔNIMO NA FILA (Sem cadastro prévio) ---
  async addExpressQueueEntry(params: {
    name?: string;
    sectorType: 'PASSE' | 'FRATERNO' | 'DOUTRINARIA' | 'OUTROS';
    sectorId?: string;
    priority?: boolean;
    notes?: string;
    visitorType?: 'AVULSO' | 'PASSE_EXPRESSO' | 'PALESTRA';
  }): Promise<ServiceQueueEntry | undefined> {
    const path = 'fila';
    try {
      // 1. Resolve Sector ID
      let resolvedSectorId = params.sectorId;
      if (!resolvedSectorId) {
        const sectors = await this.getSectors();
        if (params.sectorType === 'PASSE') {
          const s = (sectors || []).find(sec => sec.type === 'PASSE' || sec.name.toLowerCase().includes('passe') || sec.name.toLowerCase().includes('fluidotera'));
          resolvedSectorId = s ? s.id : 'sec-passe';
        } else if (params.sectorType === 'FRATERNO') {
          const s = (sectors || []).find(sec => sec.type === 'FRATERNO' || sec.name.toLowerCase().includes('fraterno'));
          resolvedSectorId = s ? s.id : 'sec-fraterno';
        } else if (params.sectorType === 'DOUTRINARIA') {
          const s = (sectors || []).find(sec => sec.type === 'ESTUDO' || sec.name.toLowerCase().includes('doutrin'));
          resolvedSectorId = s ? s.id : 'sec-doutrina';
        } else {
          resolvedSectorId = sectors && sectors.length > 0 ? sectors[0].id : 'sec-geral';
        }
      }

      // 2. Count today's items to generate a sequential ticket (e.g., P-01, F-01, D-01)
      const prefix = params.sectorType === 'PASSE' ? 'P' : params.sectorType === 'FRATERNO' ? 'F' : params.sectorType === 'DOUTRINARIA' ? 'D' : 'A';
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const queueList = await this.getQueue();
      const todayCount = (queueList || []).filter(q => q.arrivalDate >= todayStart).length + 1;
      const ticketNumber = `${prefix}-${String(todayCount).padStart(3, '0')}`;

      // 3. Format Display Name
      const cleanName = params.name && params.name.trim() 
        ? params.name.trim() 
        : params.sectorType === 'PASSE' 
          ? (params.priority ? 'Frequentador (Passe Preferencial)' : 'Frequentador (Passe Geral)')
          : params.sectorType === 'DOUTRINARIA'
            ? 'Frequentador (Palestra Doutrinária)'
            : 'Frequentador Avulso';

      const anonId = 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5);

      const newEntry: Omit<ServiceQueueEntry, 'id'> = {
        participantId: anonId,
        participantName: cleanName,
        ticketNumber: ticketNumber,
        sectorId: resolvedSectorId || 'sec-passe',
        arrivalDate: Date.now(),
        status: 'WAITING' as const,
        priority: params.priority || false,
        notes: params.notes || (params.name ? `Check-in Expresso: ${cleanName}` : 'Frequentador Avulso sem cadastro'),
        isAnonymous: true,
        visitorType: params.visitorType || (params.sectorType === 'PASSE' ? 'PASSE_EXPRESSO' : params.sectorType === 'DOUTRINARIA' ? 'PALESTRA' : 'AVULSO')
      };

      const docRef = await addDoc(collection(db, path), newEntry);
      await updateDoc(docRef, { id: docRef.id });

      // If Passe, record in PasseAtendimentos so passistas see it immediately in their tab
      if (params.sectorType === 'PASSE') {
        const passeItem: PasseAtendimento = {
          id: 'pa_' + Date.now().toString(36),
          patientName: cleanName,
          codeOrTicket: ticketNumber,
          typePasse: 'Passe Geral',
          status: 'Aguardando',
          roomName: 'Sala de Passe Coletivo 1',
          hasFraternalReferral: false,
          createdAt: Date.now(),
          observations: params.notes || 'Entrada Expressa via Recepção (Sem Cadastro Obrigatório)'
        };
        await this.savePasseAtendimento(passeItem);
      }

      // 4. Increment daily public metrics
      await this.recordPublicAttendance(
        params.sectorType === 'PASSE' ? 'PASSE_AVULSO' : params.sectorType === 'DOUTRINARIA' ? 'PALESTRA_PUBLICA' : 'VISITANTE',
        1
      );

      this.createLog('Entrada Expressa / Visitante', `Senha: ${ticketNumber} - ${cleanName} (${params.sectorType})`);
      return { id: docRef.id, ...newEntry } as ServiceQueueEntry;
    } catch (error) {
      console.error("Error in addExpressQueueEntry:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // --- CONTABILIZAÇÃO DE PRESENÇA PÚBLICA DIÁRIA (Doutrinária e Passe sem cadastro) ---
  async recordPublicAttendance(type: 'PALESTRA_PUBLICA' | 'PASSE_AVULSO' | 'FRATERNO_AVULSO' | 'VISITANTE', count = 1): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'presenca_publica', todayStr);
    try {
      const snap = await getDoc(docRef);
      const incField = type === 'PALESTRA_PUBLICA' ? 'doutrinariaCount' : type === 'PASSE_AVULSO' ? 'passeAvulsoCount' : 'fraternoAvulsoCount';
      
      if (!snap.exists()) {
        await setDoc(docRef, {
          id: todayStr,
          date: todayStr,
          doutrinariaCount: type === 'PALESTRA_PUBLICA' ? count : 0,
          passeAvulsoCount: type === 'PASSE_AVULSO' ? count : 0,
          fraternoAvulsoCount: type === 'FRATERNO_AVULSO' || type === 'VISITANTE' ? count : 0,
          totalAttendees: count,
          lastUpdated: Date.now()
        });
      } else {
        await updateDoc(docRef, {
          [incField]: increment(count),
          totalAttendees: increment(count),
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error("Error recording public attendance:", error);
    }
  }

  subscribePublicAttendanceToday(callback: (stats: PublicAttendanceCount | null) => void) {
    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'presenca_publica', todayStr);
    try {
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          callback({ id: snap.id, ...snap.data() } as PublicAttendanceCount);
        } else {
          callback({
            id: todayStr,
            date: todayStr,
            doutrinariaCount: 0,
            passeAvulsoCount: 0,
            fraternoAvulsoCount: 0,
            totalAttendees: 0,
            lastUpdated: Date.now()
          });
        }
      }, (err) => {
        console.error("Error listening to public attendance:", err);
      });
    } catch (error) {
      console.error("Error setting up public attendance listener:", error);
      return () => {};
    }
  }

  async getPublicAttendanceToday(): Promise<PublicAttendanceCount> {
    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'presenca_publica', todayStr);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PublicAttendanceCount;
      }
      return {
        id: todayStr,
        date: todayStr,
        doutrinariaCount: 0,
        passeAvulsoCount: 0,
        fraternoAvulsoCount: 0,
        totalAttendees: 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      return {
        id: todayStr,
        date: todayStr,
        doutrinariaCount: 0,
        passeAvulsoCount: 0,
        fraternoAvulsoCount: 0,
        totalAttendees: 0,
        lastUpdated: Date.now()
      };
    }
  }

  async updateQueueStatus(id: string, status: ServiceQueueEntry['status'], workerId?: string) {
    const path = `fila/${id}`;
    try {
      const updates: any = { status };
      if (workerId) updates.assignedWorkerId = workerId;
      
      const docRef = doc(db, 'fila', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const entry = snap.data() as ServiceQueueEntry;
        await updateDoc(docRef, updates);
        
        // Update participant status if registered
        if (entry.participantId && !entry.participantId.startsWith('anon_')) {
          try {
            const pStatus = status === 'IN_PROGRESS' ? 'IN_SERVICE' : status === 'FINISHED' ? 'COMPLETED' : 'IDLE';
            await updateDoc(doc(db, 'atendidos', entry.participantId), { currentStatus: pStatus });
          } catch (e) {}
        }
        
        this.createLog('Alteração de Status na Fila', `ID: ${id}, Status: ${status}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // --- EVOLUTIONS ---
  subscribeToEvolutions(participantId: string, callback: (evolutions: Evolution[]) => void) {
    const path = 'atendimentos';
    try {
      const q = query(collection(db, path), where('participantId', '==', participantId), orderBy('date', 'desc'));
      return onSnapshot(q, (snap) => {
        const evos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Evolution));
        callback(evos);
      }, (error) => {
        console.error("Error listening to evolutions:", error);
      });
    } catch (error) {
      console.error("Error setting up evolutions listener:", error);
      return () => {};
    }
  }

  async getEvolutions(participantId: string) {
    const path = 'atendimentos';
    try {
      const q = query(collection(db, path), where('participantId', '==', participantId), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Evolution));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async getAllEvolutions() {
    const path = 'atendimentos';
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Evolution));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addEvolution(evo: Omit<Evolution, 'id' | 'date'>) {
    const path = 'atendimentos';
    try {
      const newEvo = {
        ...evo,
        date: Date.now()
      };
      const docRef = await addDoc(collection(db, path), newEvo);
      await updateDoc(docRef, { id: docRef.id });
      
      this.createLog('Novo Registro de Prontuário', `Participante: ${evo.participantId}`);
      return { id: docRef.id, ...newEvo } as Evolution;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateEvolution(evo: Evolution) {
    const path = `atendimentos/${evo.id}`;
    try {
      await setDoc(doc(db, 'atendimentos', evo.id), evo);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // --- SCHEDULES ---
  async getSchedules(): Promise<SectorSchedule[]> {
    const path = 'escalas';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SectorSchedule));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async getSchedulesByMonth(month: number, year: number) {
    const path = 'escalas';
    try {
      const q = query(collection(db, path), where('month', '==', month), where('year', '==', year));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SectorSchedule));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  subscribeToSchedulesByMonth(month: number, year: number, callback: (schedules: SectorSchedule[]) => void) {
    const path = 'escalas';
    try {
      const q = query(collection(db, path), where('month', '==', month), where('year', '==', year));
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SectorSchedule));
        callback(list);
      }, (error) => {
        console.error("Error listening to schedules by month:", error);
      });
    } catch (error) {
      console.error("Error setting up schedules listener:", error);
      return () => {};
    }
  }

  async updateSectorSchedule(schedule: SectorSchedule) {
    const path = `escalas/${schedule.id}`;
    try {
      await setDoc(doc(db, 'escalas', schedule.id), schedule);
      this.createLog('Atualização de Escala', `Setor: ${schedule.sectorName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async addSectorSchedule(sectorName: string, sectorId: string, month: number, year: number) {
    const path = 'escalas';
    try {
      const newSchedule: Omit<SectorSchedule, 'id'> = {
        sectorId,
        sectorName,
        month,
        year,
        assignments: []
      };
      const docRef = await addDoc(collection(db, path), newSchedule);
      await updateDoc(docRef, { id: docRef.id });
      return { id: docRef.id, ...newSchedule } as SectorSchedule;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async deleteSectorSchedule(id: string) {
    const path = `escalas/${id}`;
    try {
      await deleteDoc(doc(db, 'escalas', id));
      this.createLog('Exclusão de Escala Semanal', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async copySchedules(fromMonth: number, fromYear: number, toMonth: number, toYear: number) {
    try {
      const q = query(collection(db, 'escalas'), where('month', '==', fromMonth), where('year', '==', fromYear));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as SectorSchedule;
        const newSchedule: Omit<SectorSchedule, 'id'> = {
          ...data,
          month: toMonth,
          year: toYear
        };
        const docRef = await addDoc(collection(db, 'escalas'), newSchedule);
        await updateDoc(docRef, { id: docRef.id });
      }
      this.createLog('Importação de Escalas', `De ${fromMonth}/${fromYear} Para ${toMonth}/${toYear}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'escalas');
    }
  }

  // --- SPEAKERS ---
  subscribeToSpeakers(callback: (speakers: Speaker[]) => void) {
    const path = 'palestrantes';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Speaker));
        callback(list);
      }, (error) => {
        console.error("Error listening to speakers:", error);
      });
    } catch (error) {
      console.error("Error setting up speakers listener:", error);
      return () => {};
    }
  }

  async getSpeakers() {
    const path = 'palestrantes';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Speaker));
    } catch (error) {
       handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addSpeaker(speaker: Omit<Speaker, 'id'>) {
    const path = 'palestrantes';
    try {
      const docRef = await addDoc(collection(db, path), speaker);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Palestrante', `Nome: ${speaker.name}`);
      return { id: docRef.id, ...speaker } as Speaker;
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateSpeaker(speaker: Speaker) {
    const path = `palestrantes/${speaker.id}`;
    try {
      await setDoc(doc(db, 'palestrantes', speaker.id), speaker);
      this.createLog('Atualização de Palestrante', `Nome: ${speaker.name}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSpeaker(id: string) {
    const path = `palestrantes/${id}`;
    try {
      await deleteDoc(doc(db, 'palestrantes', id));
      this.createLog('Exclusão de Palestrante', `ID: ${id}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- AGENDA ---
  subscribeToAgendaEvents(callback: (events: AgendaEvent[]) => void) {
    const path = 'agenda';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaEvent));
        callback(list);
      }, (error) => {
        console.error("Error listening to agenda events:", error);
      });
    } catch (error) {
      console.error("Error setting up agenda events listener:", error);
      return () => {};
    }
  }

  async getAgendaEvents() {
    const path = 'agenda';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaEvent));
    } catch (error) {
       handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addAgendaEvent(event: Omit<AgendaEvent, 'id'>) {
    const path = 'agenda';
    try {
      const docRef = await addDoc(collection(db, path), event);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Novo Evento na Agenda', `Título: ${event.title}`);
      return { id: docRef.id, ...event } as AgendaEvent;
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateAgendaEvent(event: AgendaEvent) {
    const path = `agenda/${event.id}`;
    try {
      await setDoc(doc(db, 'agenda', event.id), event);
      this.createLog('Atualização de Evento na Agenda', `Título: ${event.title}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAgendaEvent(id: string) {
    const path = `agenda/${id}`;
    try {
      await deleteDoc(doc(db, 'agenda', id));
      this.createLog('Exclusão de Evento na Agenda', `ID: ${id}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- STATS ---
  subscribeToStats(callback: (stats: DashboardStats) => void) {
    let queueList: ServiceQueueEntry[] = [];
    let workerList: Worker[] = [];
    let totalParticipants = 0;
    let sectorCount = 0;

    const isTodayDate = (timestamp?: number) => {
      if (!timestamp) return false;
      const d = new Date(timestamp);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    };

    const emit = () => {
      callback({
        waitingCount: queueList.filter(e => e.status === 'WAITING').length,
        inServiceCount: queueList.filter(e => e.status === 'IN_PROGRESS').length,
        completedToday: queueList.filter(e => e.status === 'FINISHED' && isTodayDate(e.arrivalDate)).length,
        activeVolunteers: workerList.filter(w => w.active).length,
        pendingVolunteers: workerList.filter(w => !w.active || (w.status as string) === 'EM_ANALISE').length,
        totalParticipants,
        sectorCount
      });
    };

    const unsubQueue = onSnapshot(collection(db, 'fila'), (snap) => {
      queueList = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceQueueEntry));
      emit();
    }, err => console.error("Stats queue listener error:", err));

    const unsubWorkers = onSnapshot(collection(db, 'trabalhadores'), (snap) => {
      workerList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
      emit();
    }, err => console.error("Stats workers listener error:", err));

    const unsubParticipants = onSnapshot(collection(db, 'atendidos'), (snap) => {
      totalParticipants = snap.docs.length;
      emit();
    }, err => console.error("Stats participants listener error:", err));

    const unsubSectors = onSnapshot(collection(db, 'setores'), (snap) => {
      sectorCount = snap.docs.length;
      emit();
    }, err => console.error("Stats sectors listener error:", err));

    return () => {
      unsubQueue();
      unsubWorkers();
      unsubParticipants();
      unsubSectors();
    };
  }

  subscribeToWeeklyAttendanceChart(callback: (data: { name: string; total: number; dateStr: string }[]) => void) {
    return onSnapshot(collection(db, 'fila'), (snap) => {
      const queueEntries = snap.docs.map(d => d.data() as ServiceQueueEntry);

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Dom, 1 = Seg, ...
      const daysFromMon = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMon);
      monday.setHours(0, 0, 0, 0);

      const daysOfWeek = [
        { name: 'Seg', offset: 0 },
        { name: 'Ter', offset: 1 },
        { name: 'Qua', offset: 2 },
        { name: 'Qui', offset: 3 },
        { name: 'Sex', offset: 4 },
        { name: 'Sáb', offset: 5 },
        { name: 'Dom', offset: 6 }
      ];

      const chartData = daysOfWeek.map(day => {
        const dayStart = new Date(monday.getTime() + day.offset * 86400000).getTime();
        const dayEnd = dayStart + 86400000;

        const count = queueEntries.filter(e => {
          const time = e.arrivalDate || 0;
          return time >= dayStart && time < dayEnd;
        }).length;

        const dateObj = new Date(dayStart);
        const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

        return {
          name: day.name,
          total: count,
          dateStr
        };
      });

      callback(chartData);
    }, err => console.error("Weekly chart listener error:", err));
  }

  async getStats(): Promise<DashboardStats> {
    try {
      const [qList, pList, wList, sList] = await Promise.all([
        getDocs(collection(db, 'fila')),
        getDocs(collection(db, 'atendidos')),
        getDocs(collection(db, 'trabalhadores')),
        getDocs(collection(db, 'setores'))
      ]);

      const queue = qList.docs.map(d => d.data() as ServiceQueueEntry);
      const workers = wList.docs.map(d => d.data() as Worker);
      
      const isTodayDate = (timestamp?: number) => {
        if (!timestamp) return false;
        const d = new Date(timestamp);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      };

      return {
        waitingCount: queue.filter(e => e.status === 'WAITING').length,
        inServiceCount: queue.filter(e => e.status === 'IN_PROGRESS').length,
        completedToday: queue.filter(e => e.status === 'FINISHED' && isTodayDate(e.arrivalDate)).length,
        activeVolunteers: workers.filter(w => w.active).length,
        pendingVolunteers: workers.filter(w => !w.active || (w.status as string) === 'EM_ANALISE').length,
        totalParticipants: pList.docs.length,
        sectorCount: sList.docs.length
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        waitingCount: 0,
        inServiceCount: 0,
        completedToday: 0,
        activeVolunteers: 0,
        totalParticipants: 0,
        pendingVolunteers: 0,
        sectorCount: 0
      };
    }
  }

  async getQueueByParticipant(participantId: string) {
    const path = 'fila';
    try {
      const q = query(collection(db, path), where('participantId', '==', participantId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceQueueEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async deleteEvolution(id: string) {
     const path = `atendimentos/${id}`;
     try {
       await deleteDoc(doc(db, 'atendimentos', id));
       this.createLog('Exclusão de Evolução', `ID: ${id}`);
     } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, path);
     }
  }

  async addWorkerManual(worker: Omit<Worker, 'id'>) {
    const path = 'trabalhadores';
    try {
      const docRef = await addDoc(collection(db, path), worker);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Perfil Manual', `Nome: ${worker.name} (E-mail vinculado)`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async addWorker(worker: Omit<Worker, 'id'> & { id: string }) {
    const path = `trabalhadores/${worker.id}`;
    try {
      await setDoc(doc(db, 'trabalhadores', worker.id), worker);
      this.createLog('Cadastro Manual de Trabalhador', `Nome: ${worker.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // --- INVENTORY ---
  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    const path = 'inventario';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
        callback(list);
      }, (error) => {
        console.error("Error listening to inventory:", error);
      });
    } catch (error) {
      console.error("Error setting up inventory listener:", error);
      return () => {};
    }
  }

  subscribeToInventoryMovements(callback: (movements: InventoryMovement[]) => void) {
    const path = 'movimentacoes_inventario';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(list);
      }, (error) => {
        console.error("Error listening to inventory movements:", error);
      });
    } catch (error) {
      console.error("Error setting up inventory movements listener:", error);
      return () => {};
    }
  }

  async getInventoryItems() {
    const path = 'inventario';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id'>) {
    const path = 'inventario';
    try {
      const docRef = await addDoc(collection(db, path), item);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Adição de Item ao Inventário', `Nome: ${item.name}, Qte: ${item.quantity}`);
      
      // Also record initial movement
      await this.addInventoryMovement({
        itemId: docRef.id,
        itemName: item.name,
        type: 'ENTRADA',
        quantity: item.quantity,
        previousQuantity: 0,
        newQuantity: item.quantity,
        reason: 'Cadastro Inicial de Item',
        updatedBy: item.updatedBy || 'Sistema',
        timestamp: Date.now()
      });

      return { id: docRef.id, ...item } as InventoryItem;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateInventoryItem(item: InventoryItem) {
    const path = `inventario/${item.id}`;
    try {
      await setDoc(doc(db, 'inventario', item.id), item);
      this.createLog('Atualização no Inventário', `Item: ${item.name}, Qte: ${item.quantity}, Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateInventoryQuantityAtomic(itemId: string, delta: number, updatedBy: string, reason: string = 'Ajuste Rápido de Estoque') {
    const path = `inventario/${itemId}`;
    try {
      const itemRef = doc(db, 'inventario', itemId);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) return;
      const current = snap.data() as InventoryItem;
      const prevQty = current.quantity || 0;
      const newQty = Math.max(0, prevQty + delta);

      await updateDoc(itemRef, {
        quantity: increment(delta),
        lastUpdated: Date.now(),
        updatedBy
      });

      const mType = delta > 0 ? 'ENTRADA' : (reason.toLowerCase().includes('baixa') || reason.toLowerCase().includes('quebra') ? 'BAIXA' : 'SAIDA');
      await this.addInventoryMovement({
        itemId,
        itemName: current.name,
        type: mType,
        quantity: Math.abs(delta),
        previousQuantity: prevQty,
        newQuantity: newQty,
        reason,
        updatedBy,
        timestamp: Date.now()
      });

      this.createLog('Ajuste de Estoque', `Item: ${current.name}, Variacao: ${delta > 0 ? '+' + delta : delta}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async addInventoryMovement(movement: Omit<InventoryMovement, 'id'>) {
    const path = 'movimentacoes_inventario';
    try {
      const docRef = await addDoc(collection(db, path), movement);
      await updateDoc(docRef, { id: docRef.id });
    } catch (error) {
      console.error("Error adding inventory movement:", error);
    }
  }

  async deleteInventoryItem(id: string) {
    const path = `inventario/${id}`;
    try {
      const docSnap = await getDoc(doc(db, 'inventario', id));
      const itemName = docSnap.exists() ? (docSnap.data() as InventoryItem).name : id;
      await deleteDoc(doc(db, 'inventario', id));
      this.createLog('Exclusão de Item do Inventário', `Item: ${itemName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- PATRIMONIO LOANS / EMPRÉSTIMOS ---
  subscribeToInventoryLoans(callback: (loans: PatrimonioLoan[]) => void) {
    const path = 'emprestimos_patrimonio';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PatrimonioLoan));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(list);
      }, (error) => {
        console.error("Error listening to patrimonio loans:", error);
      });
    } catch (error) {
      console.error("Error setting up patrimonio loans listener:", error);
      return () => {};
    }
  }

  async addInventoryLoan(loan: Omit<PatrimonioLoan, 'id'>) {
    const path = 'emprestimos_patrimonio';
    try {
      const docRef = await addDoc(collection(db, path), loan);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Empréstimo de Patrimônio', `Item: ${loan.itemName}, Retirado por: ${loan.borrowerName}, Qte: ${loan.quantity}`);

      // If tied to an inventory item ID, deduct quantity automatically
      if (loan.itemId) {
        await this.updateInventoryQuantityAtomic(
          loan.itemId,
          -Math.abs(loan.quantity),
          loan.authorizedBy || 'Sistema',
          `Empréstimo registrado para ${loan.borrowerName}`
        );
      }

      return { id: docRef.id, ...loan } as PatrimonioLoan;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async returnInventoryLoan(loanId: string, returnCondition: InventoryItemStatus = 'BOM', returnedBy: string = 'Sistema') {
    const path = `emprestimos_patrimonio/${loanId}`;
    try {
      const loanRef = doc(db, 'emprestimos_patrimonio', loanId);
      const snap = await getDoc(loanRef);
      if (!snap.exists()) return;

      const loan = snap.data() as PatrimonioLoan;
      const today = new Date().toISOString().split('T')[0];

      await updateDoc(loanRef, {
        status: 'DEVOLVIDO',
        actualReturnDate: today,
        returnedCondition: returnCondition,
        returnedBy
      });

      this.createLog('Devolução de Patrimônio', `Item: ${loan.itemName}, Devolvido por: ${loan.borrowerName}, Estado: ${returnCondition}`);

      // Restock item quantity if linked
      if (loan.itemId) {
        await this.updateInventoryQuantityAtomic(
          loan.itemId,
          Math.abs(loan.quantity),
          returnedBy,
          `Devolução de empréstimo por ${loan.borrowerName}`
        );

        // Optionally update item conservation condition
        if (returnCondition && returnCondition !== 'BOM') {
          const itemRef = doc(db, 'inventario', loan.itemId);
          await updateDoc(itemRef, { status: returnCondition });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteInventoryLoan(id: string) {
    const path = `emprestimos_patrimonio/${id}`;
    try {
      await deleteDoc(doc(db, 'emprestimos_patrimonio', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async resetToDefaults() {
    await this.populateDefaults();
  }

  // --- MOCK INITIAL DATA POPULATION ---
  async populateDefaults() {
    try {
      // Use raw collection access to avoid recursion if getSectors is used
      let snap = await getDocs(collection(db, 'setores'));
      let existingSectors = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector));
      let existingNames = existingSectors.map(s => s.name);
      
      console.log("Checking for missing default sectors...");
      const defaultSectors = [
        { name: 'Atendimento Fraterno', type: 'FRATERNO' as const, description: 'Recepção e primeiro contato' },
        { name: 'Passe / Fluidoterapia', type: 'PASSE' as const, description: 'Transmissão de energias' },
        { name: 'Evangelização Infantil', type: 'INFANCIA' as const, description: 'Educação para crianças' },
        { name: 'Mocidade / Juventude', type: 'INFANCIA' as const, description: 'Educação para jovens' },
        { name: 'Estudos', type: 'ESTUDO' as const, description: 'Estudo da Doutrina' },
        { name: 'Ação Social', type: 'SOCIAL' as const, description: 'Assistência a famílias' },
        { name: 'Mediúnica', type: 'MEDIUNICO' as const, description: 'Trabalhos práticos' },
        { name: 'Doutrinária', type: 'ESTUDO' as const, description: 'Palestras e ensinamentos' },
        { name: 'Administrativo', type: 'ADMINISTRATIVO' as const, description: 'Gestão da casa' },
        { name: 'Comunicação', type: 'COMUNICACAO' as const, description: 'Divulgação e mídias' },
        { name: 'Arte Espírita', type: 'ARTE' as const, description: 'Atividades artísticas, coral e teatro' }
      ];

      let addedCount = 0;
      for (const s of defaultSectors) {
        if (!existingNames.includes(s.name)) {
          await this.addSector(s as any);
          addedCount++;
        }
      }
      
      // Reload sectors to get their generated IDs
      snap = await getDocs(collection(db, 'setores'));
      existingSectors = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector));

      const findOrCreateSector = async (name: string, type: Sector['type'], description: string, parentSectorId?: string): Promise<string> => {
        const found = existingSectors.find(s => s.name.toLowerCase().trim() === name.toLowerCase().trim());
        if (found) {
          // If parent is not set, or is different, update it
          if (parentSectorId && found.parentSectorId !== parentSectorId) {
            found.parentSectorId = parentSectorId;
            await this.updateSector(found);
          }
          return found.id;
        } else {
          const newS = await this.addSector({
            name,
            type,
            description,
            parentSectorId
          } as any);
          return newS?.id || '';
        }
      };

      // Ensure Administrativo acts as the top-level parent
      const adminId = await findOrCreateSector('Administrativo', 'ADMINISTRATIVO', 'Gestão geral e administrativa da casa');
      
      if (adminId) {
        // Material e Patrimônio under Administrativo
        await findOrCreateSector(
          'Material e Patrimônio', 
          'ADMINISTRATIVO', 
          'Gestão de materiais, infraestrutura e patrimônio físico', 
          adminId
        );

        // Tecnologia e Informática under Administrativo
        await findOrCreateSector(
          'Tecnologia e Informática', 
          'ADMINISTRATIVO', 
          'Suporte a computadores, rede, sistemas e recursos tecnológicos', 
          adminId
        );

        // Manutenções, Reformas & Obras under Administrativo
        await findOrCreateSector(
          'Manutenções, Reformas & Obras', 
          'ADMINISTRATIVO', 
          'Planejamento, manutenções preventivas, reformas e obras da estrutura física', 
          adminId
        );

        // Recepção e Limpeza under Administrativo
        await findOrCreateSector(
          'Recepção e Limpeza', 
          'ADMINISTRATIVO', 
          'Manutenção da limpeza, organização interna e acolhimento inicial', 
          adminId
        );
      }

      if (addedCount > 0) {
        console.log(`${addedCount} new default sectors added or updated.`);
      }

      // Seed initial inventory items if empty
      const invSnap = await getDocs(collection(db, 'inventario'));
      if (invSnap.empty) {
        const defaultItems = [
          { name: 'Projetor Epson PowerLite LCD (Salão Principal)', category: 'ELETRONICOS', itemType: 'PATRIMONIO', quantity: 1, minQuantity: 1, unit: 'unidade(s)', location: 'Salão Principal', status: 'BOM', patrimonyCode: 'PAT-2026-001', unitPrice: 3200, lastUpdated: Date.now(), updatedBy: 'Carlos Alberto' },
          { name: 'Notebook Dell Latitude Core i5 (Livraria)', category: 'ELETRONICOS', itemType: 'PATRIMONIO', quantity: 1, minQuantity: 1, unit: 'unidade(s)', location: 'Livraria', status: 'BOM', patrimonyCode: 'PAT-2026-002', unitPrice: 4500, lastUpdated: Date.now(), updatedBy: 'Carlos Alberto' },
          { name: 'Cadeiras de PVC Brancas Altas', category: 'MOBILIARIO', itemType: 'PATRIMONIO', quantity: 120, minQuantity: 100, unit: 'unidade(s)', location: 'Auditório', status: 'BOM', patrimonyCode: 'PAT-2026-003', unitPrice: 85, lastUpdated: Date.now(), updatedBy: 'Roberto Silva' },
          { name: 'Detergente Neutro Limpol (Caixa de 24 un)', category: 'LIMPEZA', itemType: 'MATERIAL', quantity: 2, minQuantity: 3, unit: 'caixa(s)', location: 'Almoxarifado', status: 'REGULAR', lastUpdated: Date.now(), updatedBy: 'Vera Lúcia' },
          { name: 'Apostilas ESDE Tomo Único (FEB)', category: 'LIVRARIA', itemType: 'MATERIAL', quantity: 15, minQuantity: 5, unit: 'unidade(s)', location: 'Livraria', status: 'BOM', lastUpdated: Date.now(), updatedBy: 'Maria Helena' }
        ];
        for (const item of defaultItems) {
          await this.addInventoryItem(item as any);
        }
      }

      return true;
    } catch (error) {
      console.error("Error populating defaults:", error);
    }
    return false;
  }

  // --- DOUTRINÁRIO - BIBLIOTECA MATERIAIS ---
  subscribeDoutrinarioMateriais(callback: (items: DoutrinarioMaterial[]) => void) {
    const path = 'doutrinario_materiais';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioMaterial));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioMateriais() {
    const path = 'doutrinario_materiais';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioMaterial));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioMaterial(material: Omit<DoutrinarioMaterial, 'id'>) {
    const path = 'doutrinario_materiais';
    try {
      const docRef = await addDoc(collection(db, path), material);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Material Doutrinário', `Nome: ${material.name}`);
      return { id: docRef.id, ...material } as DoutrinarioMaterial;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioMaterial(idOrObj: string | DoutrinarioMaterial, partial?: Partial<DoutrinarioMaterial>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_materiais', idOrObj), partial || {});
        this.createLog('Atualização de Material Doutrinário', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_materiais', idOrObj.id), idOrObj);
        this.createLog('Atualização de Material Doutrinário', `Nome: ${idOrObj.name}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_materiais');
    }
  }

  async deleteDoutrinarioMaterial(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_materiais', id));
      this.createLog('Exclusão de Material Doutrinário', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_materiais');
    }
  }

  // --- DOUTRINÁRIO - PALESTRAS & CRONOGRAMA ---
  subscribeDoutrinarioPalestras(callback: (items: DoutrinarioPalestra[]) => void) {
    const path = 'doutrinario_palestras';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioPalestra));
      list.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioPalestras() {
    const path = 'doutrinario_palestras';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioPalestra));
      return list.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioPalestra(palestra: Omit<DoutrinarioPalestra, 'id'>) {
    const path = 'doutrinario_palestras';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...palestra,
        createdAt: palestra.createdAt || Date.now()
      });
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Nova Reunião/Palestra Doutrinária', `Tema: ${palestra.title} - Expositor: ${palestra.speakerName}`);
      return { id: docRef.id, ...palestra } as DoutrinarioPalestra;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioPalestra(idOrObj: string | DoutrinarioPalestra, partial?: Partial<DoutrinarioPalestra>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_palestras', idOrObj), partial || {});
        this.createLog('Atualização de Palestra Doutrinária', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_palestras', idOrObj.id), idOrObj);
        this.createLog('Atualização de Palestra Doutrinária', `Tema: ${idOrObj.title}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_palestras');
    }
  }

  async deleteDoutrinarioPalestra(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_palestras', id));
      this.createLog('Exclusão de Palestra Doutrinária', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_palestras');
    }
  }

  // --- DOUTRINÁRIO - EXPOSITORES ---
  subscribeDoutrinarioExpositores(callback: (items: DoutrinarioExpositor[]) => void) {
    const path = 'doutrinario_expositores';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioExpositor));
      list.sort((a, b) => a.name.localeCompare(b.name));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioExpositores() {
    const path = 'doutrinario_expositores';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioExpositor));
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioExpositor(expositor: Omit<DoutrinarioExpositor, 'id'>) {
    const path = 'doutrinario_expositores';
    try {
      const docRef = await addDoc(collection(db, path), expositor);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Expositor Doutrinário', `Nome: ${expositor.name}`);
      return { id: docRef.id, ...expositor } as DoutrinarioExpositor;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioExpositor(idOrObj: string | DoutrinarioExpositor, partial?: Partial<DoutrinarioExpositor>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_expositores', idOrObj), partial || {});
        this.createLog('Atualização de Expositor', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_expositores', idOrObj.id), idOrObj);
        this.createLog('Atualização de Expositor', `Nome: ${idOrObj.name}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_expositores');
    }
  }

  async deleteDoutrinarioExpositor(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_expositores', id));
      this.createLog('Exclusão de Expositor', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_expositores');
    }
  }

  // --- DOUTRINÁRIO - PERGUNTAS DO PÚBLICO (FAQ) ---
  subscribeDoutrinarioPerguntas(callback: (items: DoutrinarioPergunta[]) => void) {
    const path = 'doutrinario_perguntas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioPergunta));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioPerguntas() {
    const path = 'doutrinario_perguntas';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioPergunta));
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioPergunta(pergunta: Omit<DoutrinarioPergunta, 'id'>) {
    const path = 'doutrinario_perguntas';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...pergunta,
        createdAt: pergunta.createdAt || Date.now()
      });
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Pergunta do Público Doutrinário', `Texto: ${pergunta.questionText.slice(0, 40)}...`);
      return { id: docRef.id, ...pergunta } as DoutrinarioPergunta;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioPergunta(idOrObj: string | DoutrinarioPergunta, partial?: Partial<DoutrinarioPergunta>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_perguntas', idOrObj), partial || {});
        this.createLog('Atualização de Pergunta Doutrinária', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_perguntas', idOrObj.id), idOrObj);
        this.createLog('Atualização de Pergunta Doutrinária', `Status: ${idOrObj.status}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_perguntas');
    }
  }

  async deleteDoutrinarioPergunta(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_perguntas', id));
      this.createLog('Exclusão de Pergunta', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_perguntas');
    }
  }

  // --- DOUTRINÁRIO - BIBLIOTECA EMPRÉSTIMOS ---
  subscribeDoutrinarioEmprestimos(callback: (items: DoutrinarioEmprestimoLivro[]) => void) {
    const path = 'doutrinario_emprestimos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioEmprestimoLivro));
      list.sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioEmprestimos() {
    const path = 'doutrinario_emprestimos';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioEmprestimoLivro));
      return list.sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioEmprestimo(emp: Omit<DoutrinarioEmprestimoLivro, 'id'>) {
    const path = 'doutrinario_emprestimos';
    try {
      const docRef = await addDoc(collection(db, path), emp);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Novo Empréstimo de Livro', `Livro: ${emp.bookTitle} - Leitor: ${emp.readerName}`);
      return { id: docRef.id, ...emp } as DoutrinarioEmprestimoLivro;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioEmprestimo(idOrObj: string | DoutrinarioEmprestimoLivro, partial?: Partial<DoutrinarioEmprestimoLivro>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_emprestimos', idOrObj), partial || {});
        this.createLog('Atualização de Empréstimo', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_emprestimos', idOrObj.id), idOrObj);
        this.createLog('Atualização de Empréstimo', `Status: ${idOrObj.status}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_emprestimos');
    }
  }

  async deleteDoutrinarioEmprestimo(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_emprestimos', id));
      this.createLog('Exclusão de Empréstimo', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_emprestimos');
    }
  }

  // --- DOUTRINÁRIO - ROTEIROS DO DIRIGENTE ---
  subscribeDoutrinarioRoteiros(callback: (items: DoutrinarioRoteiro[]) => void) {
    const path = 'doutrinario_roteiros';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioRoteiro));
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioRoteiros() {
    const path = 'doutrinario_roteiros';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioRoteiro));
      return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioRoteiro(roteiro: Omit<DoutrinarioRoteiro, 'id'>) {
    const path = 'doutrinario_roteiros';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...roteiro,
        createdAt: roteiro.createdAt || Date.now()
      });
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Roteiro de Reunião Doutrinária', `Título: ${roteiro.title || 'Sem título'}`);
      return { id: docRef.id, ...roteiro } as DoutrinarioRoteiro;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioRoteiro(idOrObj: string | DoutrinarioRoteiro, partial?: Partial<DoutrinarioRoteiro>) {
    try {
      if (typeof idOrObj === 'string') {
        await updateDoc(doc(db, 'doutrinario_roteiros', idOrObj), partial || {});
        this.createLog('Atualização de Roteiro', `ID: ${idOrObj}`);
      } else {
        await setDoc(doc(db, 'doutrinario_roteiros', idOrObj.id), idOrObj);
        this.createLog('Atualização de Roteiro', `Título: ${idOrObj.title}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_roteiros');
    }
  }

  async deleteDoutrinarioRoteiro(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_roteiros', id));
      this.createLog('Exclusão de Roteiro', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_roteiros');
    }
  }

  // --- DOUTRINÁRIO - REUNIÕES ADMINISTRATIVAS/ATAS ---
  subscribeDoutrinarioReunioes(callback: (items: DoutrinarioReuniao[]) => void) {
    const path = 'doutrinario_reunioes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioReuniao));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioReunioes() {
    const path = 'doutrinario_reunioes';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioReuniao));
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioReuniao(reuniao: Omit<DoutrinarioReuniao, 'id'>) {
    const path = 'doutrinario_reunioes';
    try {
      const docRef = await addDoc(collection(db, path), reuniao);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Ata de Reunião Doutrinária', `Data: ${reuniao.date}`);
      return { id: docRef.id, ...reuniao } as DoutrinarioReuniao;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioReuniao(reuniao: DoutrinarioReuniao) {
    try {
      await setDoc(doc(db, 'doutrinario_reunioes', reuniao.id), reuniao);
      this.createLog('Atualização de Ata de Reunião Doutrinária', `Data: ${reuniao.date}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_reunioes');
    }
  }

  async deleteDoutrinarioReuniao(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_reunioes', id));
      this.createLog('Exclusão de Reunião Doutrinária', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_reunioes');
    }
  }

  // --- DOUTRINÁRIO - TRABALHADORES ---
  subscribeDoutrinarioTrabalhadores(callback: (items: DoutrinarioTrabalhador[]) => void) {
    const path = 'doutrinario_trabalhadores';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioTrabalhador));
      list.sort((a, b) => a.name.localeCompare(b.name));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioTrabalhadores() {
    const path = 'doutrinario_trabalhadores';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioTrabalhador));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioTrabalhador(trabalhador: Omit<DoutrinarioTrabalhador, 'id'>) {
    const path = 'doutrinario_trabalhadores';
    try {
      const docRef = await addDoc(collection(db, path), trabalhador);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Trabalhador Doutrinário', `Nome: ${trabalhador.name}`);
      return { id: docRef.id, ...trabalhador } as DoutrinarioTrabalhador;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioTrabalhador(trabalhador: DoutrinarioTrabalhador) {
    try {
      await setDoc(doc(db, 'doutrinario_trabalhadores', trabalhador.id), trabalhador);
      this.createLog('Atualização de Trabalhador Doutrinário', `Nome: ${trabalhador.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_trabalhadores');
    }
  }

  async deleteDoutrinarioTrabalhador(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_trabalhadores', id));
      this.createLog('Exclusão de Trabalhador Doutrinário', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_trabalhadores');
    }
  }

  // --- DOUTRINÁRIO - APOIO/SOLICITAÇÕES ---
  subscribeDoutrinarioApoios(callback: (items: DoutrinarioApoio[]) => void) {
    const path = 'doutrinario_apoio';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioApoio));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioApoios() {
    const path = 'doutrinario_apoio';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioApoio));
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioApoio(apoio: Omit<DoutrinarioApoio, 'id'>) {
    const path = 'doutrinario_apoio';
    try {
      const docRef = await addDoc(collection(db, path), apoio);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Nova Solicitação de Apoio Doutrinário', `De: ${apoio.fromSector}`);
      return { id: docRef.id, ...apoio } as DoutrinarioApoio;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioApoio(apoio: DoutrinarioApoio) {
    try {
      await setDoc(doc(db, 'doutrinario_apoio', apoio.id), apoio);
      this.createLog('Atualização de Apoio Doutrinário', `Setor: ${apoio.fromSector}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_apoio');
    }
  }

  async deleteDoutrinarioApoio(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_apoio', id));
      this.createLog('Exclusão de Solicitação de Apoio', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_apoio');
    }
  }

  // --- DOUTRINÁRIO - DIRETRIZES INTERNAS ---
  subscribeDoutrinarioDiretrizes(callback: (items: DoutrinarioDiretriz[]) => void) {
    const path = 'doutrinario_diretrizes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioDiretriz));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }

  async getDoutrinarioDiretrizes() {
    const path = 'doutrinario_diretrizes';
    try {
      const snap = await getDocs(collection(db, path));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DoutrinarioDiretriz));
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async addDoutrinarioDiretriz(diretriz: Omit<DoutrinarioDiretriz, 'id'>) {
    const path = 'doutrinario_diretrizes';
    try {
      const docRef = await addDoc(collection(db, path), diretriz);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Nova Diretriz Doutrinária', `Título: ${diretriz.title}`);
      return { id: docRef.id, ...diretriz } as DoutrinarioDiretriz;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateDoutrinarioDiretriz(diretriz: DoutrinarioDiretriz) {
    try {
      await setDoc(doc(db, 'doutrinario_diretrizes', diretriz.id), diretriz);
      this.createLog('Atualização de Diretriz Doutrinária', `Título: ${diretriz.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'doutrinario_diretrizes');
    }
  }

  async deleteDoutrinarioDiretriz(id: string) {
    try {
      await deleteDoc(doc(db, 'doutrinario_diretrizes', id));
      this.createLog('Exclusão de Diretriz', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'doutrinario_diretrizes');
    }
  }

  // --- IMPACTO SOCIAL & METAS DA CASA ---
  async getSocialMetrics(): Promise<SocialImpactMetric[]> {
    const path = 'social_metrics';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        // Default initial metrics if none exist
        const nowMonthYear = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
        const initialMetrics: Omit<SocialImpactMetric, 'id'>[] = [
          { category: 'CESTAS_BASICAS', title: 'Cestas Básicas Entregues', targetCount: 100, currentCount: 78, unit: 'UNIDADES', period: 'MENSAL', monthYear: nowMonthYear, updatedAt: Date.now() },
          { category: 'ATENDIMENTOS_FRATERNOS', title: 'Atendimentos Fraternos Realizados', targetCount: 150, currentCount: 132, unit: 'UNIDADES', period: 'MENSAL', monthYear: nowMonthYear, updatedAt: Date.now() },
          { category: 'PASSES_MINISTRADOS', title: 'Passes Energéticos Aplicados', targetCount: 500, currentCount: 410, unit: 'UNIDADES', period: 'MENSAL', monthYear: nowMonthYear, updatedAt: Date.now() },
          { category: 'REFEICOES_SOPAO', title: 'Refeições/Marmitas Doadas (Sopão)', targetCount: 300, currentCount: 280, unit: 'UNIDADES', period: 'MENSAL', monthYear: nowMonthYear, updatedAt: Date.now() },
          { category: 'HORAS_VOLUNTARIAS', title: 'Horas de Trabalho Voluntário', targetCount: 400, currentCount: 365, unit: 'HORAS', period: 'MENSAL', monthYear: nowMonthYear, updatedAt: Date.now() },
        ];
        const created: SocialImpactMetric[] = [];
        for (const item of initialMetrics) {
          const docRef = await addDoc(collection(db, path), item);
          await updateDoc(docRef, { id: docRef.id });
          created.push({ id: docRef.id, ...item });
        }
        return created;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialImpactMetric));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  subscribeSocialMetrics(callback: (metrics: SocialImpactMetric[]) => void) {
    const path = 'social_metrics';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        if (snap.empty) {
          this.getSocialMetrics().then(callback);
          return;
        }
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialImpactMetric));
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        callback(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return () => {};
    }
  }

  async addSocialMetric(metric: Omit<SocialImpactMetric, 'id'>) {
    const path = 'social_metrics';
    try {
      const docRef = await addDoc(collection(db, path), metric);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Nova Meta Social Criada', `Título: ${metric.title}`);
      return { id: docRef.id, ...metric } as SocialImpactMetric;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateSocialMetric(metric: SocialImpactMetric) {
    try {
      await setDoc(doc(db, 'social_metrics', metric.id), metric);
      this.createLog('Atualização de Meta Social', `Título: ${metric.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'social_metrics');
    }
  }

  async addContributionLog(metricId: string, amount: number, addedBy: string, note?: string) {
    try {
      const docRef = doc(db, 'social_metrics', metricId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const metric = snap.data() as SocialImpactMetric;
        const currentLogs = metric.logs || [];
        const newLog = {
          id: 'log_' + Date.now(),
          timestamp: Date.now(),
          amount,
          addedBy,
          note: note || ''
        };
        const newCount = (metric.currentCount || 0) + amount;
        await updateDoc(docRef, {
          currentCount: newCount,
          logs: [newLog, ...currentLogs],
          updatedAt: Date.now()
        });
        this.createLog('Aporte em Meta Social', `+${amount} em ${metric.title} por ${addedBy}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'social_metrics');
    }
  }

  async deleteSocialMetric(id: string) {
    try {
      await deleteDoc(doc(db, 'social_metrics', id));
      this.createLog('Exclusão de Meta Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'social_metrics');
    }
  }

  // --- CENTRAL DE AVISOS E MURAL INTELIGENTE ---
  async getAnnouncements(): Promise<AnnouncementNotification[]> {
    const path = 'announcements';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const defaultAvisos: Omit<AnnouncementNotification, 'id'>[] = [
          { title: 'Reunião Geral de Voluntários', content: 'Lembrete: neste sábado às 15h teremos o encontro mensal de alinhamento das equipes de passe e recepção.', category: 'GERAL', priority: 'ALTA', targetAudience: 'VOLUNTARIOS', displayOnMascotProjection: true, active: true, createdAt: Date.now() - 3600000 * 2, authorName: 'Secretaria Geral' },
          { title: 'Campanha do Agasalho e Cestas', content: 'Estamos arrecadando mantas, cobertores e alimentos não perecíveis no balcão da recepção.', category: 'EVENTO', priority: 'MEDIA', targetAudience: 'TODOS', displayOnMascotProjection: true, active: true, createdAt: Date.now() - 3600000 * 10, authorName: 'Setor de Assistência Social' },
        ];
        const list: AnnouncementNotification[] = [];
        for (const av of defaultAvisos) {
          const ref = await addDoc(collection(db, path), av);
          await updateDoc(ref, { id: ref.id });
          list.push({ id: ref.id, ...av });
        }
        return list;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AnnouncementNotification)).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async addAnnouncement(announcement: Omit<AnnouncementNotification, 'id'>) {
    const path = 'announcements';
    try {
      const docRef = await addDoc(collection(db, path), announcement);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Novo Aviso/Notificação', `Título: ${announcement.title}`);
      return { id: docRef.id, ...announcement } as AnnouncementNotification;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateAnnouncement(announcement: AnnouncementNotification) {
    try {
      await setDoc(doc(db, 'announcements', announcement.id), announcement);
      this.createLog('Atualização de Aviso', `Título: ${announcement.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'announcements');
    }
  }

  async deleteAnnouncement(id: string) {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      this.createLog('Exclusão de Aviso', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'announcements');
    }
  }

  subscribeAnnouncements(callback: (announcements: AnnouncementNotification[]) => void) {
    const path = 'announcements';
    try {
      return onSnapshot(collection(db, path), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AnnouncementNotification));
        // Sort: pinned first, then by createdAt desc
        list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.createdAt - a.createdAt;
        });
        callback(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      console.error("Error subscribing to announcements:", error);
      return () => {};
    }
  }

  async togglePinAnnouncement(id: string, isPinned: boolean) {
    try {
      await updateDoc(doc(db, 'announcements', id), { isPinned });
      this.createLog('Atualização de Destaque', `Aviso ID: ${id} fixado: ${isPinned}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'announcements');
    }
  }

  async acknowledgeAnnouncement(id: string, userEmail: string) {
    if (!userEmail) return;
    try {
      const docRef = doc(db, 'announcements', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AnnouncementNotification;
        const currentReadBy = data.readBy || [];
        if (!currentReadBy.includes(userEmail)) {
          const updated = [...currentReadBy, userEmail];
          await updateDoc(docRef, { readBy: updated });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'announcements');
    }
  }

  // --- BIBLIOTECA & EMPRÉSTIMO DE LIVROS ---
  async getBookLoans(): Promise<BookLoan[]> {
    const path = 'book_loans';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const defaults: Omit<BookLoan, 'id'>[] = [
          { bookTitle: 'O Livro dos Espíritos - Allan Kardec', borrowerName: 'Maria das Graças Silva', borrowerContact: '(11) 98888-7711', loanDate: '2026-08-01', dueDate: '2026-08-15', status: 'EMPRESTADO', notes: 'Obra de estudo do ESDE' },
          { bookTitle: 'Nosso Lar - Chico Xavier / André Luiz', borrowerName: 'João Carlos Mendes', borrowerContact: '(11) 97777-6622', loanDate: '2026-07-20', dueDate: '2026-08-03', status: 'ATRASADO', notes: 'Enviado lembrete por mensagem' },
          { bookTitle: 'O Evangelho Segundo o Espiritismo', borrowerName: 'Ana Beatriz Souza', borrowerContact: '(11) 96666-5533', loanDate: '2026-07-10', dueDate: '2026-07-24', returnDate: '2026-07-22', status: 'DEVOLVIDO' },
        ];
        const list: BookLoan[] = [];
        for (const item of defaults) {
          const docRef = await addDoc(collection(db, path), item);
          await updateDoc(docRef, { id: docRef.id });
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BookLoan));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async addBookLoan(loan: Omit<BookLoan, 'id'>) {
    const path = 'book_loans';
    try {
      const docRef = await addDoc(collection(db, path), loan);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Novo Empréstimo de Livro', `Livro: ${loan.bookTitle} | Leitor: ${loan.borrowerName}`);
      return { id: docRef.id, ...loan } as BookLoan;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateBookLoan(loan: BookLoan) {
    try {
      await setDoc(doc(db, 'book_loans', loan.id), loan);
      this.createLog('Atualização de Empréstimo', `Livro: ${loan.bookTitle} | Status: ${loan.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'book_loans');
    }
  }

  async deleteBookLoan(id: string) {
    try {
      await deleteDoc(doc(db, 'book_loans', id));
      this.createLog('Exclusão de Registro de Empréstimo', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'book_loans');
    }
  }

  // --- GESTÃO FINANCEIRA & DRE ---
  async getFinancialEntries(): Promise<FinancialEntry[]> {
    const path = 'financial_entries';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const defaults: Omit<FinancialEntry, 'id'>[] = [
          { description: 'Doações via PIX - Bazar Beneficente', amount: 1450.00, type: 'RECEITA', category: 'DOACAO', date: '2026-08-05', paymentMethod: 'PIX', createdBy: 'Tesouraria' },
          { description: 'Vendas da Livraria Espiritual', amount: 890.50, type: 'RECEITA', category: 'LIVRARIA_BAZAR', date: '2026-08-08', paymentMethod: 'DINHEIRO', createdBy: 'Recepção' },
          { description: 'Conta de Energia Elétrica - Sede', amount: 620.40, type: 'DESPESA', category: 'CONTAS_CONSUMO', date: '2026-08-02', paymentMethod: 'PIX', createdBy: 'Administração' },
          { description: 'Aquisição de Cestas Básicas para Sopão', amount: 1100.00, type: 'DESPESA', category: 'ASSISTENCIA_SOCIAL', date: '2026-08-06', paymentMethod: 'PIX', createdBy: 'Setor Social' },
        ];
        const list: FinancialEntry[] = [];
        for (const item of defaults) {
          const docRef = await addDoc(collection(db, path), item);
          await updateDoc(docRef, { id: docRef.id });
          list.push({ id: docRef.id, ...item });
        }
        return list;
      }
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async addFinancialEntry(entry: Omit<FinancialEntry, 'id'>) {
    const path = 'financial_entries';
    try {
      const docRef = await addDoc(collection(db, path), entry);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog(`Lançamento Financeiro (${entry.type})`, `${entry.description} - R$ ${entry.amount}`);
      return { id: docRef.id, ...entry } as FinancialEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async deleteFinancialEntry(id: string) {
    try {
      await deleteDoc(doc(db, 'financial_entries', id));
      this.createLog('Exclusão de Lançamento Financeiro', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'financial_entries');
    }
  }

  // --- FREQUÊNCIA INTELIGENTE POR QR CODE / CÓDIGO ---
  async getAttendanceCheckIns(): Promise<AttendanceCheckIn[]> {
    const path = 'attendance_checkins';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceCheckIn)).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async recordCheckIn(checkIn: Omit<AttendanceCheckIn, 'id'>) {
    const path = 'attendance_checkins';
    try {
      const docRef = await addDoc(collection(db, path), checkIn);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Check-in de Frequência', `${checkIn.participantName} - ${checkIn.sectorOrActivity} (${checkIn.method})`);
      return { id: docRef.id, ...checkIn } as AttendanceCheckIn;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // --- CENTRAL DE LEMBRETES & NOTIFICAÇÕES DE ESCALA ---
  async getScheduleReminders(): Promise<ScheduleReminder[]> {
    const path = 'schedule_reminders';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleReminder));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }

  async addScheduleReminder(reminder: Omit<ScheduleReminder, 'id'>) {
    const path = 'schedule_reminders';
    try {
      const docRef = await addDoc(collection(db, path), reminder);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Lembrete de Escala Agendado', `${reminder.workerName} - ${reminder.sectorName} (${reminder.date})`);
      return { id: docRef.id, ...reminder } as ScheduleReminder;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateScheduleReminderStatus(id: string, status: ScheduleReminder['status']) {
    try {
      await updateDoc(doc(db, 'schedule_reminders', id), { status, sentAt: Date.now() });
      this.createLog('Status do Lembrete de Escala Atualizado', `ID: ${id} | Status: ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'schedule_reminders');
    }
  }

  // --- FILA DE IMPRESSÃO DE CREDENCIAIS (SHARED QUEUE) ---
  async getPrintQueue(): Promise<any[]> {
    const path = 'print_queue';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty) {
        const local = localStorage.getItem('cemil-print-queue');
        return local ? JSON.parse(local) : [];
      }
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (error) {
      console.warn("Firestore print queue read warning, falling back to localStorage:", error);
      const local = localStorage.getItem('cemil-print-queue');
      return local ? JSON.parse(local) : [];
    }
  }

  async savePrintQueue(queueItems: any[]) {
    localStorage.setItem('cemil-print-queue', JSON.stringify(queueItems));
    const path = 'print_queue';
    try {
      // Clear existing batch items and save current list
      const snap = await getDocs(collection(db, path));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, path, d.id));
      }
      for (const item of queueItems) {
        const itemDocId = item.printId || `${item.memberId}-${Date.now()}`;
        await setDoc(doc(db, path, itemDocId), item);
      }
    } catch (error) {
      console.warn("Error syncing print queue to Firestore:", error);
    }
  }

  // --- VENDAS & PRODUTOS DO PDV (FIRESTORE) ---
  subscribeMarketProducts(callback: (products: MarketProduct[]) => void): () => void {
    const path = 'produtos';
    const unsub = onSnapshot(collection(db, path), async (snap) => {
      if (snap.empty) {
        try {
          const defaults: Omit<MarketProduct, 'id'>[] = [
            { name: 'Livro: O Livro dos Espíritos (Edição Histórica FEB)', category: 'LIVRARIA', price: 45.00, promoPrice: 39.90, stock: 12, minLimit: 5, barcode: '78910001' },
            { name: 'Livro: O Evangelho Segundo o Espiritismo', category: 'LIVRARIA', price: 45.00, stock: 8, minLimit: 5, barcode: '78910002' },
            { name: 'Livro: O Livro dos Médiuns', category: 'LIVRARIA', price: 45.00, stock: 6, minLimit: 5, barcode: '78910003' },
            { name: 'Pão de Queijo Assado (Fornada do Dia)', category: 'CANTINA', price: 5.50, stock: 25, minLimit: 8, expirationDate: '2026-08-15', barcode: '78910004' },
            { name: 'Suco Natural Polpa 300ml (Uva/Laranja)', category: 'CANTINA', price: 6.00, stock: 15, minLimit: 5, expirationDate: '2026-08-20', barcode: '78910005' },
            { name: 'Bolo Caseiro de Cenoura (Fatia)', category: 'CANTINA', price: 4.50, stock: 4, minLimit: 5, expirationDate: '2026-08-12', barcode: '78910006' },
            { name: 'Camiseta Infantil Estampa Mirante', category: 'BAZAR', price: 35.00, promoPrice: 24.90, stock: 8, minLimit: 3, barcode: '78910007' },
            { name: 'Artesanato em Gesso Decorado', category: 'BAZAR', price: 25.00, stock: 2, minLimit: 3, barcode: '78910008' }
          ];
          for (const item of defaults) {
            const docRef = await addDoc(collection(db, path), item);
            await updateDoc(docRef, { id: docRef.id });
          }
        } catch (err) {
          console.warn('Failed to seed default market products:', err);
        }
        return;
      }
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketProduct));
      callback(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async addMarketProduct(prod: Omit<MarketProduct, 'id'>): Promise<MarketProduct | undefined> {
    const path = 'produtos';
    try {
      const docRef = await addDoc(collection(db, path), prod);
      await updateDoc(docRef, { id: docRef.id });
      this.createLog('Cadastro de Produto no PDV', `Nome: ${prod.name}, Preço: R$ ${prod.price}`);
      return { id: docRef.id, ...prod } as MarketProduct;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  async updateMarketProduct(prod: MarketProduct): Promise<void> {
    const path = `produtos/${prod.id}`;
    try {
      await setDoc(doc(db, 'produtos', prod.id), prod);
      this.createLog('Atualização de Produto no PDV', `Produto: ${prod.name}, Estoque: ${prod.stock}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteMarketProduct(id: string): Promise<void> {
    const path = `produtos/${id}`;
    try {
      await deleteDoc(doc(db, 'produtos', id));
      this.createLog('Exclusão de Produto no PDV', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- SESSÃO DE CAIXA DO PDV (FIRESTORE) ---
  subscribeActiveCashSession(callback: (session: CashSession | null) => void): () => void {
    const path = 'sessoes_caixa';
    const unsub = onSnapshot(collection(db, path), (snap) => {
      const activeDoc = snap.docs.find(d => d.data().isOpen === true);
      if (activeDoc) {
        callback({ id: activeDoc.id, ...activeDoc.data() } as CashSession);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async saveActiveCashSession(session: CashSession): Promise<void> {
    const path = 'sessoes_caixa';
    try {
      const docId = session.id || 'current_session';
      await setDoc(doc(db, path, docId), { ...session, id: docId });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async closeActiveCashSession(finalSession: CashSession): Promise<void> {
    const path = 'sessoes_caixa';
    try {
      const docId = finalSession.id || 'current_session';
      await setDoc(doc(db, path, docId), { ...finalSession, isOpen: false, id: docId });
      this.createLog('Caixa Fechado no PDV', `Operador: ${finalSession.openedBy}, Diferença: R$ ${finalSession.difference}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  subscribeFinancialEntries(callback: (entries: FinancialEntry[]) => void): () => void {
    const path = 'financial_entries';
    const unsub = onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialEntry));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  // --- AUDIOBOOKS & COMPRAS (FIRESTORE) ---
  subscribeAudiobooks(callback: (audiobooks: Audiobook[]) => void): () => void {
    const path = 'audiobooks';
    const unsub = onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Audiobook));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async saveAudiobook(audiobook: Audiobook): Promise<void> {
    const path = 'audiobooks';
    try {
      const docRef = doc(db, path, audiobook.id);
      await setDoc(docRef, audiobook);
      this.createLog('Cadastro/Edição de Audiobook', `Título: ${audiobook.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAudiobook(id: string): Promise<void> {
    const path = 'audiobooks';
    try {
      await deleteDoc(doc(db, path, id));
      this.createLog('Exclusão de Audiobook', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeAudioPurchases(callback: (purchases: AudioPurchase[]) => void): () => void {
    const path = 'audiobook_purchases';
    const unsub = onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AudioPurchase));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async createAudioPurchase(purchase: AudioPurchase): Promise<void> {
    const path = 'audiobook_purchases';
    try {
      const docRef = doc(db, path, purchase.id);
      await setDoc(docRef, purchase);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateAudioPurchaseStatus(purchaseId: string, status: 'APROVADO' | 'CANCELADO', purchaseData?: AudioPurchase, audiobookTitle?: string): Promise<void> {
    const path = 'audiobook_purchases';
    try {
      const docRef = doc(db, path, purchaseId);
      await updateDoc(docRef, { status });

      if (status === 'APROVADO' && purchaseData) {
        // Automatically launch financial entry in Tesouraria!
        const finPath = 'financial_entries';
        const finDoc: Omit<FinancialEntry, 'id'> = {
          description: `Venda de Audiobook: ${audiobookTitle || 'Audiobook'} (${purchaseData.userEmail})`,
          amount: purchaseData.amountPaid,
          type: 'RECEITA',
          category: 'LIVRARIA_BAZAR',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: purchaseData.paymentMethod === 'PIX' ? 'PIX' : 'CARTAO',
          createdBy: purchaseData.userEmail || 'Sistema Audiobook'
        };
        const finRef = await addDoc(collection(db, finPath), finDoc);
        await updateDoc(finRef, { id: finRef.id });

        this.createLog('Compra de Audiobook Aprovada', `Livro: ${audiobookTitle}, Usuário: ${purchaseData.userEmail}, R$ ${purchaseData.amountPaid}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  subscribeAudiobookProgress(userEmail: string, callback: (progressList: AudiobookProgress[]) => void): () => void {
    const path = 'audiobook_progress';
    const q = query(collection(db, path), where('userEmail', '==', userEmail));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AudiobookProgress));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async saveAudiobookProgress(progress: AudiobookProgress): Promise<void> {
    const path = 'audiobook_progress';
    try {
      const docId = `prog_${progress.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${progress.audiobookId}`;
      const docRef = doc(db, path, docId);
      await setDoc(docRef, { ...progress, id: docId });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Mascot Config & Schedule Realtime Sync
  subscribeMascotConfig(callback: (config: MascotConfig | null) => void): () => void {
    const path = 'mascot_config';
    const docRef = doc(db, path, 'settings');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as MascotConfig);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async saveMascotConfig(config: MascotConfig): Promise<void> {
    const path = 'mascot_config';
    try {
      const docRef = doc(db, path, 'settings');
      await setDoc(docRef, { ...config, updatedAt: Date.now() });
      this.createLog('Atualização do Mascote', `Nome: ${config.mascotName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  subscribeMascotSchedule(callback: (activities: MascotScheduleActivity[]) => void): () => void {
    const path = 'mascot_schedule';
    const unsub = onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MascotScheduleActivity));
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }

  async saveMascotScheduleActivity(activity: MascotScheduleActivity): Promise<void> {
    const path = 'mascot_schedule';
    try {
      const docRef = doc(db, path, activity.id);
      await setDoc(docRef, activity);
      this.createLog('Atividade no Cronograma do Mascote', `Título: ${activity.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteMascotScheduleActivity(id: string): Promise<void> {
    const path = 'mascot_schedule';
    try {
      await deleteDoc(doc(db, path, id));
      this.createLog('Exclusão de Atividade do Cronograma do Mascote', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeToWorkers(callback: (workers: Worker[]) => void): () => void {
    const path = 'trabalhadores';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Worker));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  subscribeToParticipants(callback: (participants: Participant[]) => void): () => void {
    const path = 'atendidos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  subscribeToSectors(callback: (sectors: Sector[]) => void): () => void {
    const path = 'setores';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sector));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  subscribeToAllEvolutions(callback: (evolutions: Evolution[]) => void): () => void {
    const path = 'atendimentos';
    const q = query(collection(db, path), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Evolution));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  // --- RECEPÇÃO: VISITANTES E ZELO/LIMPEZA ---
  subscribeVisitorLogs(callback: (logs: VisitorLog[]) => void): () => void {
    const path = 'visitantes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VisitorLog));
      list.sort((a, b) => (b.checkInTime || 0) - (a.checkInTime || 0));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async addVisitorLog(visitor: VisitorLog): Promise<void> {
    const path = 'visitantes';
    try {
      const docRef = doc(db, path, visitor.id);
      await setDoc(docRef, visitor);
      this.createLog('Registro de Visitante', `Visitante: ${visitor.name} - Motivo: ${visitor.purpose}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async checkOutVisitorLog(id: string): Promise<void> {
    const path = 'visitantes';
    try {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, { checkOutTime: Date.now() });
      this.createLog('Saída de Visitante Registrada', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  subscribeCleaningChecklists(callback: (checklists: CleaningChecklist[]) => void): () => void {
    const path = 'limpeza_checklist';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningChecklist));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveCleaningChecklist(item: CleaningChecklist): Promise<void> {
    const path = 'limpeza_checklist';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Atualização de Checklist de Zelo', `Ambiente: ${item.roomName} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteCleaningChecklistActivity(id: string): Promise<void> {
    const path = 'limpeza_checklist';
    try {
      await deleteDoc(doc(db, path, id));
      this.createLog('Exclusão de Ambiente/Checklist de Zelo', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- ARTE ESPÍRITA ---
  subscribeArteGroups(callback: (groups: ArteGroup[]) => void): () => void {
    const path = 'arte_grupos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArteGroup));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveArteGroup(group: ArteGroup): Promise<void> {
    const path = 'arte_grupos';
    try {
      const docRef = doc(db, path, group.id);
      await setDoc(docRef, group);
      this.createLog('Atualização/Cadastro de Coletivo Artístico', `Grupo: ${group.name} (${group.modality})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteArteGroup(id: string): Promise<void> {
    const path = `arte_grupos/${id}`;
    try {
      await deleteDoc(doc(db, 'arte_grupos', id));
      this.createLog('Exclusão de Coletivo Artístico', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeArteSongs(callback: (songs: ArteSong[]) => void): () => void {
    const path = 'arte_musicas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArteSong));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveArteSong(song: ArteSong): Promise<void> {
    const path = 'arte_musicas';
    try {
      const docRef = doc(db, path, song.id);
      await setDoc(docRef, song);
      this.createLog('Atualização/Cadastro no Acervo Musical', `Música: ${song.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteArteSong(id: string): Promise<void> {
    const path = `arte_musicas/${id}`;
    try {
      await deleteDoc(doc(db, 'arte_musicas', id));
      this.createLog('Exclusão do Acervo Musical', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeArtePieces(callback: (pieces: ArtePiece[]) => void): () => void {
    const path = 'arte_pecas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArtePiece));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveArtePiece(piece: ArtePiece): Promise<void> {
    const path = 'arte_pecas';
    try {
      const docRef = doc(db, path, piece.id);
      await setDoc(docRef, piece);
      this.createLog('Atualização/Cadastro de Peça Teatral', `Peça: ${piece.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteArtePiece(id: string): Promise<void> {
    const path = `arte_pecas/${id}`;
    try {
      await deleteDoc(doc(db, 'arte_pecas', id));
      this.createLog('Exclusão de Roteiro Teatral', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeArteEnsaios(callback: (ensaios: ArteEnsaio[]) => void): () => void {
    const path = 'arte_ensaios';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArteEnsaio));
      list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveArteEnsaio(ensaio: ArteEnsaio): Promise<void> {
    const path = 'arte_ensaios';
    try {
      const docRef = doc(db, path, ensaio.id);
      await setDoc(docRef, ensaio);
      this.createLog('Agendamento/Ajuste de Ensaio', `Atividade: ${ensaio.activity} em ${ensaio.date}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteArteEnsaio(id: string): Promise<void> {
    const path = `arte_ensaios/${id}`;
    try {
      await deleteDoc(doc(db, 'arte_ensaios', id));
      this.createLog('Exclusão de Ensaio Agendado', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeArteEventos(callback: (eventos: ArteEvento[]) => void): () => void {
    const path = 'arte_eventos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ArteEvento));
      list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveArteEvento(evento: ArteEvento): Promise<void> {
    const path = 'arte_eventos';
    try {
      const docRef = doc(db, path, evento.id);
      await setDoc(docRef, evento);
      this.createLog('Apresentação ou Sarau Registrado', `Evento: ${evento.name} em ${evento.date}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteArteEvento(id: string): Promise<void> {
    const path = `arte_eventos/${id}`;
    try {
      await deleteDoc(doc(db, 'arte_eventos', id));
      this.createLog('Exclusão de Evento Artístico', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- COMUNICAÇÃO ESPÍRITA ---
  subscribeComunicados(callback: (list: ComunicacaoNotice[]) => void): () => void {
    const path = 'com_comunicados';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComunicacaoNotice));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveComunicado(item: ComunicacaoNotice): Promise<void> {
    const path = 'com_comunicados';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Comunicado Criado/Atualizado', `Título: ${item.title} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteComunicado(id: string): Promise<void> {
    const path = `com_comunicados/${id}`;
    try {
      await deleteDoc(doc(db, 'com_comunicados', id));
      this.createLog('Exclusão de Comunicado', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialPosts(callback: (list: ComunicacaoPost[]) => void): () => void {
    const path = 'com_social_posts';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComunicacaoPost));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialPost(item: ComunicacaoPost): Promise<void> {
    const path = 'com_social_posts';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Post Criado/Atualizado', `Título: ${item.title} - Plataforma: ${item.platform} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialPost(id: string): Promise<void> {
    const path = `com_social_posts/${id}`;
    try {
      await deleteDoc(doc(db, 'com_social_posts', id));
      this.createLog('Exclusão de Post Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeComMidias(callback: (list: ComunicacaoMidia[]) => void): () => void {
    const path = 'com_midias';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComunicacaoMidia));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveComMidia(item: ComunicacaoMidia): Promise<void> {
    const path = 'com_midias';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Mídia de Comunicação Salva', `Nome: ${item.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteComMidia(id: string): Promise<void> {
    const path = `com_midias/${id}`;
    try {
      await deleteDoc(doc(db, 'com_midias', id));
      this.createLog('Exclusão de Mídia', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeComEquipe(callback: (list: ComunicacaoEquipe[]) => void): () => void {
    const path = 'com_equipe';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComunicacaoEquipe));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveComEquipe(item: ComunicacaoEquipe): Promise<void> {
    const path = 'com_equipe';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Membro da Equipe de Comunicação Salvo', `Nome: ${item.name} - Função: ${item.role}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteComEquipe(id: string): Promise<void> {
    const path = `com_equipe/${id}`;
    try {
      await deleteDoc(doc(db, 'com_equipe', id));
      this.createLog('Exclusão de Membro da Equipe', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeComCampanhas(callback: (list: ComunicacaoCampanha[]) => void): () => void {
    const path = 'com_campanhas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComunicacaoCampanha));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveComCampanha(item: ComunicacaoCampanha): Promise<void> {
    const path = 'com_campanhas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Campanha de Comunicação Salva', `Nome: ${item.name} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteComCampanha(id: string): Promise<void> {
    const path = `com_campanhas/${id}`;
    try {
      await deleteDoc(doc(db, 'com_campanhas', id));
      this.createLog('Exclusão de Campanha', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- TECNOLOGIA E INFORMÁTICA (TI) ---
  subscribeTechTickets(callback: (list: TechTicket[]) => void): () => void {
    const path = 'ti_tickets';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TechTicket));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveTechTicket(item: TechTicket): Promise<void> {
    const path = 'ti_tickets';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Chamado de TI Salvo/Atualizado', `ID: ${item.id} - Título: ${item.title} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteTechTicket(id: string): Promise<void> {
    const path = `ti_tickets/${id}`;
    try {
      await deleteDoc(doc(db, 'ti_tickets', id));
      this.createLog('Exclusão de Chamado de TI', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeTechInfra(callback: (list: TechInfraItem[]) => void): () => void {
    const path = 'ti_infra';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TechInfraItem));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveTechInfra(item: TechInfraItem): Promise<void> {
    const path = 'ti_infra';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Equipamento de Infra TI Salvo', `Nome: ${item.name} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteTechInfra(id: string): Promise<void> {
    const path = `ti_infra/${id}`;
    try {
      await deleteDoc(doc(db, 'ti_infra', id));
      this.createLog('Exclusão de Item Infra TI', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeTechKnowledge(callback: (list: TechKnowledgeItem[]) => void): () => void {
    const path = 'ti_knowledge';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TechKnowledgeItem));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveTechKnowledge(item: TechKnowledgeItem): Promise<void> {
    const path = 'ti_knowledge';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Base de Conhecimento TI Salva', `Título: ${item.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteTechKnowledge(id: string): Promise<void> {
    const path = `ti_knowledge/${id}`;
    try {
      await deleteDoc(doc(db, 'ti_knowledge', id));
      this.createLog('Exclusão de Item Base Conhecimento', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeTechLiveStreams(callback: (list: TechLiveStream[]) => void): () => void {
    const path = 'ti_transmissoes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TechLiveStream));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveTechLiveStream(item: TechLiveStream): Promise<void> {
    const path = 'ti_transmissoes';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Transmissão de TI Salva', `Título: ${item.title} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteTechLiveStream(id: string): Promise<void> {
    const path = `ti_transmissoes/${id}`;
    try {
      await deleteDoc(doc(db, 'ti_transmissoes', id));
      this.createLog('Exclusão de Transmissão TI', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- EVANGELIZAÇÃO INFANTIL & JUVENTUDE ---
  subscribeEvangelizacaoKids(callback: (list: EvangelizacaoKid[]) => void): () => void {
    const path = 'evangelizacao_kids';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvangelizacaoKid));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveEvangelizacaoKid(item: EvangelizacaoKid): Promise<void> {
    const path = 'evangelizacao_kids';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Evangelizando Salvo', `ID: ${item.id} - Nome: ${item.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteEvangelizacaoKid(id: string): Promise<void> {
    const path = `evangelizacao_kids/${id}`;
    try {
      await deleteDoc(doc(db, 'evangelizacao_kids', id));
      this.createLog('Exclusão de Evangelizando', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeEvangelizacaoRooms(callback: (list: EvangelizacaoRoom[]) => void): () => void {
    const path = 'evangelizacao_rooms';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvangelizacaoRoom));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveEvangelizacaoRoom(item: EvangelizacaoRoom): Promise<void> {
    const path = 'evangelizacao_rooms';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Sala de Evangelização Salva', `ID: ${item.id} - Nome: ${item.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteEvangelizacaoRoom(id: string): Promise<void> {
    const path = `evangelizacao_rooms/${id}`;
    try {
      await deleteDoc(doc(db, 'evangelizacao_rooms', id));
      this.createLog('Exclusão de Sala Evangelização', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeEvangelizacaoAulas(callback: (list: EvangelizacaoAula[]) => void): () => void {
    const path = 'evangelizacao_aulas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvangelizacaoAula));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveEvangelizacaoAula(item: EvangelizacaoAula): Promise<void> {
    const path = 'evangelizacao_aulas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Aula de Evangelização Salva', `ID: ${item.id} - Tema: ${item.theme}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteEvangelizacaoAula(id: string): Promise<void> {
    const path = `evangelizacao_aulas/${id}`;
    try {
      await deleteDoc(doc(db, 'evangelizacao_aulas', id));
      this.createLog('Exclusão de Aula Evangelização', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeEvangelizacaoProjetos(callback: (list: EvangelizacaoProjeto[]) => void): () => void {
    const path = 'evangelizacao_projetos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvangelizacaoProjeto));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveEvangelizacaoProjeto(item: EvangelizacaoProjeto): Promise<void> {
    const path = 'evangelizacao_projetos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Projeto Juventude Salvo', `ID: ${item.id} - Título: ${item.title}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteEvangelizacaoProjeto(id: string): Promise<void> {
    const path = `evangelizacao_projetos/${id}`;
    try {
      await deleteDoc(doc(db, 'evangelizacao_projetos', id));
      this.createLog('Exclusão de Projeto Juventude', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeEvangelizacaoFrequencia(callback: (list: EvangelizacaoFrequencia[]) => void): () => void {
    const path = 'evangelizacao_frequencia';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as EvangelizacaoFrequencia));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveEvangelizacaoFrequencia(item: EvangelizacaoFrequencia): Promise<void> {
    const path = 'evangelizacao_frequencia';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Registro Frequência Evangelização', `KidID: ${item.kidId} - Data: ${item.date} - Presente: ${item.present}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // --- PASSE & FLUIDOTERAPIA ESPIRITUAL ---
  subscribePasseAtendimentos(callback: (list: PasseAtendimento[]) => void): () => void {
    const path = 'passe_atendimentos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasseAtendimento));
      list.sort((a, b) => b.createdAt - a.createdAt);
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async savePasseAtendimento(item: PasseAtendimento): Promise<void> {
    const path = 'passe_atendimentos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Atendimento de Passe Salvo', `ID: ${item.id} - Assistido: ${item.patientName} - Tipo: ${item.typePasse}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePasseAtendimento(id: string): Promise<void> {
    const path = `passe_atendimentos/${id}`;
    try {
      await deleteDoc(doc(db, 'passe_atendimentos', id));
      this.createLog('Exclusão de Atendimento Passe', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribePassePassistas(callback: (list: PassePassista[]) => void): () => void {
    const path = 'passe_passistas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PassePassista));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async savePassePassista(item: PassePassista): Promise<void> {
    const path = 'passe_passistas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Cadastro de Passista Salvo', `ID: ${item.id} - Nome: ${item.name} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePassePassista(id: string): Promise<void> {
    const path = `passe_passistas/${id}`;
    try {
      await deleteDoc(doc(db, 'passe_passistas', id));
      this.createLog('Exclusão de Passista', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribePasseSalas(callback: (list: PasseSala[]) => void): () => void {
    const path = 'passe_salas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasseSala));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async savePasseSala(item: PasseSala): Promise<void> {
    const path = 'passe_salas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Sala de Passe Salva', `ID: ${item.id} - Nome: ${item.name} - Status: ${item.activeStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePasseSala(id: string): Promise<void> {
    const path = `passe_salas/${id}`;
    try {
      await deleteDoc(doc(db, 'passe_salas', id));
      this.createLog('Exclusão de Sala de Passe', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribePasseEscalas(callback: (list: PasseEscala[]) => void): () => void {
    const path = 'passe_escalas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasseEscala));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async savePasseEscala(item: PasseEscala): Promise<void> {
    const path = 'passe_escalas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Escala de Passe Salva', `ID: ${item.id} - Equipe: ${item.teamName} - Data: ${item.date}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePasseEscala(id: string): Promise<void> {
    const path = `passe_escalas/${id}`;
    try {
      await deleteDoc(doc(db, 'passe_escalas', id));
      this.createLog('Exclusão de Escala de Passe', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribePasseFluidoterapia(callback: (list: PasseFluidoterapia[]) => void): () => void {
    const path = 'passe_fluidoterapia';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasseFluidoterapia));
      list.sort((a, b) => b.createdAt - a.createdAt);
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async savePasseFluidoterapia(item: PasseFluidoterapia): Promise<void> {
    const path = 'passe_fluidoterapia';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Fluidoterapia Salva', `ID: ${item.id} - Assistido: ${item.patientName} - Vol: ${item.bottleVolumeLiters}L`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deletePasseFluidoterapia(id: string): Promise<void> {
    const path = `passe_fluidoterapia/${id}`;
    try {
      await deleteDoc(doc(db, 'passe_fluidoterapia', id));
      this.createLog('Exclusão de Fluidoterapia', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- AÇÃO SOCIAL ESPÍRITA (SAPSE) FIRESTORE REALTIME SYNC ---

  subscribeSocialAssistidos(callback: (list: SocialAssistido[]) => void): () => void {
    const path = 'social_assistidos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialAssistido));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialAssistido(item: SocialAssistido): Promise<void> {
    const path = 'social_assistidos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Assistido Social Salvo', `ID: ${item.id} - Nome: ${item.name} - Vuln: ${item.vulnerabilityLevel}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialAssistido(id: string): Promise<void> {
    const path = `social_assistidos/${id}`;
    try {
      await deleteDoc(doc(db, 'social_assistidos', id));
      this.createLog('Exclusão de Assistido Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialAtendimentos(callback: (list: SocialAtendimento[]) => void): () => void {
    const path = 'social_atendimentos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialAtendimento));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialAtendimento(item: SocialAtendimento): Promise<void> {
    const path = 'social_atendimentos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Atendimento Social Salvo', `ID: ${item.id} - Assistido: ${item.assistidoName} - Tipo: ${item.type}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialAtendimento(id: string): Promise<void> {
    const path = `social_atendimentos/${id}`;
    try {
      await deleteDoc(doc(db, 'social_atendimentos', id));
      this.createLog('Exclusão de Atendimento Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialDoacoes(callback: (list: SocialDoacao[]) => void): () => void {
    const path = 'social_doacoes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialDoacao));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialDoacao(item: SocialDoacao): Promise<void> {
    const path = 'social_doacoes';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Doação Social / Estoque Salvo', `ID: ${item.id} - Desc: ${item.description} - Qtd: ${item.qty} ${item.unit}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialDoacao(id: string): Promise<void> {
    const path = `social_doacoes/${id}`;
    try {
      await deleteDoc(doc(db, 'social_doacoes', id));
      this.createLog('Exclusão de Doação Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialCestas(callback: (list: SocialCestaEntrega[]) => void): () => void {
    const path = 'social_cestas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialCestaEntrega));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialCesta(item: SocialCestaEntrega): Promise<void> {
    const path = 'social_cestas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Entrega de Cesta Básica Registrada', `ID: ${item.id} - Assistido: ${item.assistidoName} - Tipo: ${item.basketType}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialCesta(id: string): Promise<void> {
    const path = `social_cestas/${id}`;
    try {
      await deleteDoc(doc(db, 'social_cestas', id));
      this.createLog('Exclusão de Registro de Cesta', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialVoluntarios(callback: (list: SocialVoluntario[]) => void): () => void {
    const path = 'social_voluntarios';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialVoluntario));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialVoluntario(item: SocialVoluntario): Promise<void> {
    const path = 'social_voluntarios';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Voluntário Social Salvo', `ID: ${item.id} - Nome: ${item.name} - Função: ${item.role}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialVoluntario(id: string): Promise<void> {
    const path = `social_voluntarios/${id}`;
    try {
      await deleteDoc(doc(db, 'social_voluntarios', id));
      this.createLog('Exclusão de Voluntário Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialProjetos(callback: (list: SocialProjeto[]) => void): () => void {
    const path = 'social_projetos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialProjeto));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialProjeto(item: SocialProjeto): Promise<void> {
    const path = 'social_projetos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Projeto Social Salvo', `ID: ${item.id} - Nome: ${item.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialProjeto(id: string): Promise<void> {
    const path = `social_projetos/${id}`;
    try {
      await deleteDoc(doc(db, 'social_projetos', id));
      this.createLog('Exclusão de Projeto Social', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialVisitas(callback: (list: SocialVisita[]) => void): () => void {
    const path = 'social_visitas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialVisita));
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialVisita(item: SocialVisita): Promise<void> {
    const path = 'social_visitas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Visita Fraterna Social Salva', `ID: ${item.id} - Assistido: ${item.assistidoName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialVisita(id: string): Promise<void> {
    const path = `social_visitas/${id}`;
    try {
      await deleteDoc(doc(db, 'social_visitas', id));
      this.createLog('Exclusão de Visita Fraterna', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeSocialKits(callback: (list: SocialKitCesta[]) => void): () => void {
    const path = 'social_kits';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialKitCesta));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveSocialKit(item: SocialKitCesta): Promise<void> {
    const path = 'social_kits';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Kit de Cesta Salvo', `ID: ${item.id} - Nome: ${item.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteSocialKit(id: string): Promise<void> {
    const path = `social_kits/${id}`;
    try {
      await deleteDoc(doc(db, 'social_kits', id));
      this.createLog('Exclusão de Kit de Cesta', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // ====================================================
  // SECRETARIA, GOVERNANÇA, DIRETORIA & PATRIMÔNIO (FEB)
  // ====================================================

  subscribeAdminAssociados(callback: (list: AdminAssociado[]) => void): () => void {
    const path = 'admin_associados';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminAssociado));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveAdminAssociado(item: AdminAssociado): Promise<void> {
    const path = 'admin_associados';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Associado Salvo no Quadro Social', `ID: ${item.id} - Nome: ${item.nome} (${item.categoria})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAdminAssociado(id: string): Promise<void> {
    const path = `admin_associados/${id}`;
    try {
      await deleteDoc(doc(db, 'admin_associados', id));
      this.createLog('Exclusão de Associado do Quadro', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeAdminAtas(callback: (list: AdminAta[]) => void): () => void {
    const path = 'admin_atas';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminAta));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveAdminAta(item: AdminAta): Promise<void> {
    const path = 'admin_atas';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Livro de Atas Atualizado', `Ata Nº: ${item.numero} - Tipo: ${item.tipo}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAdminAta(id: string): Promise<void> {
    const path = `admin_atas/${id}`;
    try {
      await deleteDoc(doc(db, 'admin_atas', id));
      this.createLog('Exclusão de Ata', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeAdminDocumentos(callback: (list: AdminDocumento[]) => void): () => void {
    const path = 'admin_documentos';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminDocumento));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveAdminDocumento(item: AdminDocumento): Promise<void> {
    const path = 'admin_documentos';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Documento Oficial Expedido/Salvo', `ID: ${item.id} - ${item.titulo}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAdminDocumento(id: string): Promise<void> {
    const path = `admin_documentos/${id}`;
    try {
      await deleteDoc(doc(db, 'admin_documentos', id));
      this.createLog('Exclusão de Documento Oficial', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeAdminPatrimonio(callback: (list: AdminPatrimonioItem[]) => void): () => void {
    const path = 'admin_patrimonio';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminPatrimonioItem));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveAdminPatrimonioItem(item: AdminPatrimonioItem): Promise<void> {
    const path = 'admin_patrimonio';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Tombamento de Patrimônio Salvo', `Tombo: ${item.numeroTombamento} - ${item.denominacao}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAdminPatrimonioItem(id: string): Promise<void> {
    const path = `admin_patrimonio/${id}`;
    try {
      await deleteDoc(doc(db, 'admin_patrimonio', id));
      this.createLog('Exclusão de Item de Patrimônio', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  subscribeAdminBalancetes(callback: (list: AdminBalanceteMensal[]) => void): () => void {
    const path = 'admin_balancetes';
    return onSnapshot(collection(db, path), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminBalanceteMensal));
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  async saveAdminBalancete(item: AdminBalanceteMensal): Promise<void> {
    const path = 'admin_balancetes';
    try {
      const docRef = doc(db, path, item.id);
      await setDoc(docRef, item);
      this.createLog('Balancete Mensal Salvo', `Mês/Ano: ${item.mesAno} - Status: ${item.status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteAdminBalancete(id: string): Promise<void> {
    const path = `admin_balancetes/${id}`;
    try {
      await deleteDoc(doc(db, 'admin_balancetes', id));
      this.createLog('Exclusão de Balancete', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // ====================================================
  // LIMPEZA E PREPARAÇÃO PARA USO REAL / PRODUÇÃO
  // ====================================================
  async cleanSystemForProduction(): Promise<{
    clearedCollections: string[];
    preservedWorkers: string[];
    removedWorkersCount: number;
    audiobooksPreservedCount: number;
    productsPreservedCount: number;
  }> {
    console.log("Iniciando limpeza de dados de teste para produção...");
    
    // 1. FILTRAR E PRESERVAR TRABALHADORES (Carlos Alberto & Cleiton Airon)
    const workersSnap = await getDocs(collection(db, 'trabalhadores'));
    const preservedWorkers: string[] = [];
    let removedWorkersCount = 0;

    const isPreservedWorker = (w: any) => {
      const email = (w.email || '').toLowerCase().trim();
      const name = (w.name || '').toLowerCase().trim();
      return (
        email === 'carlostecal35@gmail.com' ||
        email.includes('cleiton') ||
        email.includes('carlos') ||
        name.includes('carlos alberto') ||
        name.includes('cleiton airon') ||
        name.includes('cleiton') ||
        name.includes('carlos')
      );
    };

    for (const d of workersSnap.docs) {
      const data = d.data();
      if (isPreservedWorker(data)) {
        preservedWorkers.push(`${data.name || 'Trabalhador'} (${data.email || d.id})`);
      } else {
        await deleteDoc(doc(db, 'trabalhadores', d.id));
        removedWorkersCount++;
      }
    }

    // 2. CONTAGEM DO QUE FOI PRESERVADO (Audiobooks e Produtos)
    let audiobooksPreservedCount = 0;
    try {
      const audioSnap = await getDocs(collection(db, 'audiobooks'));
      audiobooksPreservedCount = audioSnap.size;
    } catch (e) {
      console.warn("Audiobooks check:", e);
    }

    let productsPreservedCount = 0;
    try {
      const prodSnap = await getDocs(collection(db, 'produtos'));
      productsPreservedCount = prodSnap.size;
    } catch (e) {
      console.warn("Produtos check:", e);
    }

    // 3. COLEÇÕES QUE SERÃO ZERADAS (DADOS DE TESTE)
    const collectionsToClear = [
      'fila',                     // Senhas e fila de atendimento
      'atendidos',                 // Participantes / assistidos de teste
      'atendimentos',              // Prontuários e evoluções de teste
      'financial_entries',         // Histórico de vendas do PDV
      'sessoes_caixa',             // Sessões e aberturas de caixa de teste
      'print_queue',               // Fila temporária de impressão de crachás
      'visitas_recepcao',          // Logs de visitas da recepção de teste
      'cleaning_checklists',       // Checklists de limpeza de teste
      'public_attendance',         // Contagens de público de teste
      'schedule_reminders',        // Lembretes de escala de teste
      'passe_atendimentos',        // Fila de passes de teste
      'evangelizacao_frequencia',  // Chamadas de teste
      'arte_ensaios',              // Ensaios de teste
      'ti_tickets',                // Chamados técnicos de teste
      'logs'                       // Logs de auditoria de testes
    ];

    const clearedCollections: string[] = [];

    for (const colName of collectionsToClear) {
      try {
        const colSnap = await getDocs(collection(db, colName));
        for (const docItem of colSnap.docs) {
          await deleteDoc(doc(db, colName, docItem.id));
        }
        clearedCollections.push(colName);
      } catch (err) {
        console.warn(`Aviso ao limpar coleção ${colName}:`, err);
      }
    }

    // Limpar armazenamento local transitório
    try {
      localStorage.removeItem('cemil-print-queue');
      localStorage.removeItem('cemil_local_queue');
      localStorage.removeItem('cemil_cart');
    } catch (e) {
      console.warn("LocalStorage clear check:", e);
    }

    // 4. CRIAR LOG INICIAL LIMPO DE PRODUÇÃO
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
      const actionFormatted = `[${dateStr}] | [${timeStr}] | [Sistema] | [Sistema Inicializado em Modo Produção]`;

      await addDoc(collection(db, 'logs'), {
        timestamp: Date.now(),
        userId: 'system',
        userName: 'Sistema CEMIL',
        action: actionFormatted,
        details: `Limpeza para produção concluída. Trabalhadores preservados: ${preservedWorkers.join(', ') || 'Carlos Alberto & Cleiton Airon'}. Catálogo de livros (${productsPreservedCount} itens) e acervo de audiobooks (${audiobooksPreservedCount} títulos) mantidos 100% intactos.`,
        category: 'SISTEMA',
        severity: 'INFO'
      });
    } catch (logErr) {
      console.warn("Erro ao gerar log de inicialização:", logErr);
    }

    return {
      clearedCollections,
      preservedWorkers,
      removedWorkersCount,
      audiobooksPreservedCount,
      productsPreservedCount
    };
  }
}

export const dataService = new DataService();
