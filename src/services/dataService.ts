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
  InventoryItem
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
}

export const dataService = new DataService();
