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
  SectorSchedule,
  InventoryItem,
  DoutrinarioMaterial,
  DoutrinarioReuniao,
  DoutrinarioTrabalhador,
  DoutrinarioApoio,
  DoutrinarioDiretriz,
  SocialImpactMetric,
  AnnouncementNotification,
  BookLoan,
  FinancialEntry,
  AttendanceCheckIn,
  ScheduleReminder
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class DataService {
  public async createLog(action: string, details?: string) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
      
      // We need the worker name
      const workerDoc = await getDoc(doc(db, 'trabalhadores', user.uid));
      const workerName = workerDoc.exists() ? workerDoc.data().name : user.email;

      const actionFormatted = `[${dateStr}] | [${timeStr}] | [${workerName}] | [${action}${details ? ': ' + details : ''}]`;

      const log: Omit<AuditLog, 'id'> = {
        timestamp: Date.now(),
        userId: user.uid,
        userName: workerName || 'Desconhecido',
        action: actionFormatted,
        details: details
      };

      await addDoc(collection(db, 'logs'), log);
    } catch (error) {
      console.error('Error creating log:', error);
    }
  }

  // --- LOGS ---
  async getLogs() {
    const path = 'logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'));
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
      
      // Update participant status
      await updateDoc(doc(db, 'atendidos', entry.participantId), { currentStatus: 'WAITING' });
      
      this.createLog('Encaminhamento para Fila', `Participante: ${entry.participantId}`);
      return { id: docRef.id, ...newEntry } as ServiceQueueEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
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
        
        // Update participant status
        const pStatus = status === 'IN_PROGRESS' ? 'IN_SERVICE' : status === 'FINISHED' ? 'COMPLETED' : 'IDLE';
        await updateDoc(doc(db, 'atendidos', entry.participantId), { currentStatus: pStatus });
        
        this.createLog('Alteração de Status na Fila', `ID: ${id}, Status: ${status}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  // --- EVOLUTIONS ---
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
      
      return {
        waitingCount: queue.filter(e => e.status === 'WAITING').length,
        inServiceCount: queue.filter(e => e.status === 'IN_PROGRESS').length,
        completedToday: queue.filter(e => e.status === 'FINISHED').length,
        activeVolunteers: workers.filter(w => w.active).length,
        pendingVolunteers: workers.filter(w => !w.active).length,
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
        { name: 'Comunicação', type: 'ADMINISTRATIVO' as const, description: 'Divulgação e mídias' },
        { name: 'Arte Espírita', type: 'OUTROS' as const, description: 'Atividades artísticas e culturais' }
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

        // Obras e Reformas under Administrativo
        await findOrCreateSector(
          'Obras e Reformas', 
          'ADMINISTRATIVO', 
          'Planejamento, acompanhamento de reformas e obras da estrutura física', 
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

      return true;
    } catch (error) {
      console.error("Error populating defaults:", error);
    }
    return false;
  }

  // --- DOUTRINÁRIO - BIBLIOTECA MATERIAIS ---
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

  async updateDoutrinarioMaterial(material: DoutrinarioMaterial) {
    try {
      await setDoc(doc(db, 'doutrinario_materiais', material.id), material);
      this.createLog('Atualização de Material Doutrinário', `Nome: ${material.name}`);
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

  // --- DOUTRINÁRIO - REUNIÕES ---
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
        const initialMetrics: Omit<SocialImpactMetric, 'id'>[] = [
          { category: 'CESTAS_BASICAS', title: 'Cestas Básicas Entregues', targetCount: 100, currentCount: 78, period: 'MENSAL', monthYear: '08/2026', updatedAt: Date.now() },
          { category: 'ATENDIMENTOS_FRATERNOS', title: 'Atendimentos Fraternos Realizados', targetCount: 150, currentCount: 132, period: 'MENSAL', monthYear: '08/2026', updatedAt: Date.now() },
          { category: 'PASSES_MINISTRADOS', title: 'Passes Energéticos Aplicados', targetCount: 500, currentCount: 410, period: 'MENSAL', monthYear: '08/2026', updatedAt: Date.now() },
          { category: 'REFEICOES_SOPAO', title: 'Refeições/Marmitas Doadas (Sopão)', targetCount: 300, currentCount: 280, period: 'MENSAL', monthYear: '08/2026', updatedAt: Date.now() },
          { category: 'HORAS_VOLUNTARIAS', title: 'Horas de Trabalho Voluntário', targetCount: 400, currentCount: 365, period: 'MENSAL', monthYear: '08/2026', updatedAt: Date.now() },
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
        list.sort((a, b) => b.createdAt - a.createdAt);
        callback(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      });
    } catch (error) {
      console.error("Error subscribing to announcements:", error);
      return () => {};
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
}

export const dataService = new DataService();
