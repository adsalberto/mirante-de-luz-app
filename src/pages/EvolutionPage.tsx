import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Send, 
  ClipboardCheck,
  ClipboardList,
  ArrowRight, 
  Heart, 
  ShieldAlert,
  Search,
  Users,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  Printer,
  Phone,
  MapPin,
  X,
  Activity,
  ArrowUp,
  Lock,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";
import { dataService } from '../services/dataService';
import { Participant, Sector, Evolution, Worker } from '../types';
import { cn } from '../lib/utils';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const EvolutionPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADM';
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedP, setSelectedP] = useState<Participant | null>(null);
  const [history, setHistory] = useState<Evolution[]>([]);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEvo, setEditingEvo] = useState<Evolution | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImprovingNotes, setIsImprovingNotes] = useState(false);
  const [isImprovingRecs, setIsImprovingRecs] = useState(false);
  const [isStartingService, setIsStartingService] = useState(false);
  
  const detailsRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    recordingSectorId: '',
    notes: '',
    recommendations: '',
    referralSectors: [] as string[],
    encaminhamento: ''
  });

  useEffect(() => {
    if (sectors.length > 0 && !formData.recordingSectorId) {
      const defaultSectorId = currentUser?.role === 'COORDENADOR' && currentUser.sectorId 
        ? currentUser.sectorId 
        : sectors[0].id;
      setFormData(prev => ({ ...prev, recordingSectorId: defaultSectorId }));
    }
  }, [sectors, currentUser]);

  useEffect(() => {
    if (selectedP) {
      loadHistory(selectedP.id);
      loadActiveServices(selectedP.id);
      
      // On desktop, scroll to top of page. On mobile, scroll to details.
      if (window.innerWidth < 1024) {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedP]);

  useEffect(() => {
    if (currentUser?.role) {
      if (['RECEPCIONISTA', 'SECRETARIO'].includes(currentUser.role)) {
        setError('Ação não permitida: Seu perfil atual não possui privilégios para esta operação.');
      }
    }
    loadBaseData();
  }, [location.state, location.search, currentUser]);

  useEffect(() => {
    if (editingEvo) {
      setFormData({
        recordingSectorId: editingEvo.sectorId,
        notes: editingEvo.notesEncrypted,
        recommendations: editingEvo.recommendations,
        referralSectors: editingEvo.nextStepSectorIds || [],
        encaminhamento: editingEvo.encaminhamento || ''
      });
      // Scroll to form
      const formElement = document.getElementById('evolution-form');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [editingEvo]);

  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'N/I';
      const d = new Date(date);
      if (!isValid(d)) return 'Data Inválida';
      return format(d, formatStr, { locale: ptBR });
    } catch (e) {
      return 'Erro na data';
    }
  };

  const loadBaseData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching base data for EvolutionPage...');
      const [p, s] = await Promise.all([dataService.getParticipants(), dataService.getSectors()]);
      const fetchedParticipants = p || [];
      const fetchedSectors = s || [];
      
      setParticipants(fetchedParticipants);
      setSectors(fetchedSectors);
      
      // Auto-select from navigation state
      const state = location.state as { participantId?: string };
      const searchParams = new URLSearchParams(location.search);
      const participantId = state?.participantId || searchParams.get('participantId');

      console.log('Detected participantId:', participantId);

      if (participantId && fetchedParticipants.length > 0) {
        const found = fetchedParticipants.find(x => x && String(x.id) === String(participantId));
        if (found) {
          console.log('Auto-selecting participant:', found.name);
          setSelectedP(found);
        } else {
          console.warn('Participant not found in list:', participantId);
        }
      }
    } catch (err) {
      console.error('Error loading EvolutionPage data:', err);
      setError("Erro ao carregar dados do prontuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (pid: string) => {
    try {
      console.log('Loading history for:', pid);
      const h = await dataService.getEvolutions(pid);
      if (h) {
        // Create a copy before sorting to avoid potential issues
        const sorted = [...h].sort((a,b) => (b.date || 0) - (a.date || 0));
        setHistory(sorted);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  const loadActiveServices = async (pid: string) => {
    try {
      const q = await dataService.getQueueByParticipant(pid);
      setActiveServices(q?.filter(i => i.status !== 'FINISHED' && i.status !== 'CANCELLED') || []);
    } catch (err) {
      console.error('Error loading active services:', err);
      setActiveServices([]);
    }
  };

  const handleStartAttendance = async (queueId: string) => {
    if (!currentUser) return;
    setIsStartingService(true);
    try {
      await dataService.updateQueueStatus(queueId, 'IN_PROGRESS', currentUser.id);
      if (selectedP) {
        await loadActiveServices(selectedP.id);
      }
      alert('Atendimento iniciado com sucesso!');
    } catch (err) {
      console.error('Erro ao iniciar atendimento:', err);
      alert('Erro ao iniciar atendimento.');
    } finally {
      setIsStartingService(false);
    }
  };

  const exportToPDF = async () => {
    if (!selectedP) return;
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const p = selectedP;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text("CENTRO ESPÍRITA MIRANTE DE LUZ", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("PRONTUÁRIO DE ATENDIMENTO ESPIRITUAL", 105, 26, { align: 'center' });
      
      // Patient Info Box
      doc.setDrawColor(240);
      doc.setFillColor(252, 252, 255);
      doc.roundedRect(14, 35, 182, 35, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(p.name.toUpperCase(), 20, 45);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Nascimento: ${safeFormat(p.birthDate, "dd/MM/yyyy")}`, 20, 52);
      doc.text(`Sexo: ${(p.gender === 'Masculino' || p.gender === 'M') ? 'Masculino' : (p.gender === 'Feminino' || p.gender === 'F') ? 'Feminino' : p.gender || 'N/I'}`, 80, 52);
      doc.text(`Telefone: ${p.phone || 'N/I'}`, 20, 58);
      doc.text(`Endereço: ${p.address || 'N/I'}`, 20, 64);
      
      doc.setTextColor(150);
      doc.text(`Registro: ${p.id}`, 190, 45, { align: 'right' });

      // History Table
      const tableData = history.map(evo => [
        safeFormat(evo.date, "dd/MM/yyyy HH:mm"),
        sectors.find(s => s.id === evo.sectorId)?.name || 'Setor',
        (evo.notesEncrypted || '').replace(/<[^>]*>?/gm, ''),
        (evo.recommendations || '').replace(/<[^>]*>?/gm, '')
      ]);

      if (tableData.length > 0) {
        autoTable(doc, {
          startY: 80,
          head: [['Data/Hora', 'Setor', 'Observações', 'Recomendações']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
          styles: { fontSize: 8, cellPadding: 5 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 30 },
            2: { cellWidth: 60 },
            3: { cellWidth: 62 }
          }
        });
      } else {
        doc.text("Nenhum registro de evolução encontrado.", 20, 85);
      }
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text(`Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
      }

      doc.save(`Prontuario_CEMIL_${p.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF do prontuário.');
    } finally {
      setIsExporting(false);
    }
  };

  const improveText = async (field: 'notes' | 'recommendations') => {
    const text = formData[field];
    if (!text || text.length < 5) return;

    const setter = field === 'notes' ? setIsImprovingNotes : setIsImprovingRecs;
    setter(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Você é um assistente de redação para um Centro Espírita. 
      Sua tarefa é corrigir e melhorar formalmente o texto a seguir, mantendo a fraternidade e clareza, mas removendo erros de português e gírias. 
      Retorne APENAS o texto corrigido, sem comentários adicionais.
      
      Texto: "${text}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response && response.text) {
        setFormData(prev => ({ ...prev, [field]: response.text?.trim() }));
      }
    } catch (err) {
      console.error('Erro ao melhorar texto:', err);
    } finally {
      setter(false);
    }
  };

  const handleSaveEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedP) return;

    try {
      if (editingEvo) {
        const updatedEvo = {
          ...editingEvo,
          sectorId: formData.recordingSectorId,
          notesEncrypted: formData.notes,
          recommendations: formData.recommendations,
          nextStepSectorIds: formData.referralSectors,
          encaminhamento: formData.encaminhamento
        };
        await dataService.updateEvolution(updatedEvo);
        await dataService.createLog('Edição de Prontuário', `ADM ${currentUser?.name || 'Admin'} editou o registro de atendimento do participante ${selectedP.id}`);
        setEditingEvo(null);
      } else {
        await dataService.addEvolution({
          participantId: selectedP.id,
          workerId: currentUser?.id || 'w-admin',
          sectorId: formData.recordingSectorId || 'sec-fraterno',
          notesEncrypted: formData.notes,
          recommendations: formData.recommendations,
          nextStepSectorIds: formData.referralSectors,
          encaminhamento: formData.encaminhamento
        });

        // CRITICAL: Add to Queue for each referral
        if (formData.referralSectors && formData.referralSectors.length > 0) {
          console.log("Processing queue referrals:", formData.referralSectors);
          for (const sectorId of formData.referralSectors) {
            await dataService.addToQueue({
              participantId: selectedP.id,
              sectorId: sectorId,
              priority: false // Default to false, can be improved later
            });
          }
        }
      }

      setFormData(prev => ({ 
        ...prev, 
        notes: '', 
        recommendations: '', 
        referralSectors: [],
        encaminhamento: ''
      }));
      await loadHistory(selectedP.id);
      alert(editingEvo ? 'Registro atualizado com sucesso!' : 'Registro salvo e encaminhamentos realizados com sucesso!');
    } catch (err) {
      console.error('Error saving evolution:', err);
      alert('Erro ao salvar evolução.');
    }
  };

  const toggleSector = (id: string) => {
    setFormData(prev => ({
      ...prev,
      referralSectors: prev.referralSectors.includes(id)
        ? prev.referralSectors.filter(x => x !== id)
        : [...prev.referralSectors, id]
    }));
  };

  const getAge = (birthDate: any) => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    } catch { return null; }
  };

  const getParticipantStatus = (pid: string) => {
    return activeServices.find(s => s.participantId === pid);
  };

  const filteredParticipants = (participants || []).filter(p => 
    p && p.name && p.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (isLoading && (!participants || participants.length === 0)) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-white/50 animate-pulse">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <p className="text-gray-500 font-bold tracking-tight">Preparando prontuário...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 text-center p-8 bg-white">
        <ShieldAlert size={48} className="text-red-500" />
        <h3 className="text-xl font-bold text-gray-900">{error}</h3>
        <p className="text-gray-500 max-w-md">Ocorreu um problema ao carregar os dados. Você pode tentar resetar o sistema nas configurações se o problema persistir.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Tentar Novamente</button>
      </div>
    );
  }

  if (!sectors || sectors.length === 0) {
     return (
       <div className="h-screen w-full flex flex-col items-center justify-center gap-4 text-center p-8 bg-white">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
         <p className="text-gray-500 font-medium tracking-tight">Carregando setores do sistema...</p>
       </div>
     );
  }

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col gap-4 sm:gap-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Evolução & Encaminhamento</h1>
        <p className="text-sm sm:text-base text-gray-500 font-medium">Acompanhe a jornada espiritual e direcione os próximos passos.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 min-h-[400px]">
        {/* Lado Esquerdo: Busca e Seleção */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Localizar atendido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10 px-2">
            {filteredParticipants.length > 0 ? filteredParticipants.map(p => {
              const age = getAge(p.birthDate);
              const isActive = getParticipantStatus(p.id);
              const isSelected = selectedP?.id === p.id;
              
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedP(p)}
                  className={cn(
                    "w-full text-left p-0 rounded-[32px] border-2 transition-all duration-300 group relative overflow-hidden",
                    isSelected 
                      ? "bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-200 translate-x-2" 
                      : "bg-white border-gray-100/80 text-gray-900 hover:border-indigo-200 shadow-sm hover:shadow-lg"
                  )}
                >
                  {/* Active Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white shadow-[2px_0_10px_rgba(255,255,255,0.5)]" />
                  )}

                  <div className="flex items-center gap-4 p-5 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 shrink-0 transition-all duration-500 group-hover:scale-105",
                      isSelected ? "bg-white/10 border-white/20 text-white" : "bg-indigo-50 border-indigo-50 text-indigo-600"
                    )}>
                      {(p.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={cn(
                          "font-black text-sm truncate uppercase tracking-tight",
                          isSelected ? "text-white" : "text-indigo-950"
                        )}>{p.name}</p>
                        {isActive && (
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "text-[7px] font-black uppercase tracking-widest",
                                isSelected ? "text-indigo-200" : "text-amber-600"
                            )}>Ativo</span>
                            <div className="animate-pulse w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 transition-colors",
                          isSelected 
                            ? "bg-white/20 border-white/20 text-white" 
                            : (p.gender === 'Masculino' || p.gender === 'M') ? "bg-blue-50 text-blue-600 border-blue-100" : (p.gender === 'Feminino' || p.gender === 'F') ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-gray-50 text-gray-600 border-gray-100"
                        )}>
                          {(p.gender === 'Masculino' || p.gender === 'M') ? 'MASC' : (p.gender === 'Feminino' || p.gender === 'F') ? 'FEM' : p.gender || 'N/I'}
                        </span>
                        {age !== null && (
                          <span className={cn(
                            "text-[10px] font-bold italic", 
                            isSelected ? "text-white/70" : "text-gray-400"
                          )}>
                            {age} anos
                          </span>
                        )}
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest opacity-50 ml-auto font-mono", 
                            isSelected ? "text-white" : "text-gray-300"
                        )}>
                          ID: {String(p.id).substring(0, 5)}
                        </span>
                      </div>
                      {isActive && (
                        <div className={cn(
                            "mt-2 py-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border flex items-center gap-2",
                            isSelected ? "bg-white/10 border-white/20 text-white" : "bg-amber-50 border-amber-100 text-amber-700"
                        )}>
                          <Activity size={10} />
                          <span className="truncate">Espera: {sectors.find(s => s.id === isActive.sectorId)?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            }) : (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 p-8 rounded-3xl text-center">
                <Users className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm font-medium">Nenhum atendido<br/>encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Prontuário e Nova Evolução */}
        <div ref={detailsRef} className="lg:col-span-8 overflow-y-auto no-scrollbar pb-10">
          {selectedP ? (
            <div
              key={selectedP.id}
              className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20"
            >
              {/* Main Dashboard Header for Participant - Enhanced Version */}
              <div className="bg-white rounded-[40px] border border-indigo-100 shadow-2xl shadow-indigo-500/5 overflow-hidden group relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="px-6 py-8 sm:px-10 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    {/* Avatar - More prominent */}
                    <div className="relative group/avatar">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-4xl sm:text-5xl font-black text-white border-4 border-white shadow-2xl shadow-indigo-200 shrink-0 leading-none group-hover/avatar:scale-105 transition-transform duration-500">
                        {(selectedP?.name || '?').charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-indigo-50">
                        <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                          <div className="min-w-0 space-y-1">
                            <h2 className="text-3xl sm:text-4xl font-black text-indigo-950 tracking-tight leading-tight truncate">{selectedP?.name}</h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                              <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-xs border border-indigo-100/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                <Calendar size={14} className="opacity-70" />
                                {getAge(selectedP?.birthDate)} anos
                              </span>
                              <span className="flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-xs border border-indigo-100/50 shadow-sm transition-all hover:bg-white hover:shadow-md">
                                <User size={14} className="opacity-70" />
                                {selectedP?.gender}
                              </span>
                              <span className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">
                                <Search size={12} strokeWidth={3} />
                                #{String(selectedP?.id).substring(0, 5)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center gap-3">
                            <AnimatePresence mode="wait">
                              {activeServices.find(s => s.status === 'WAITING') && (
                                <motion.button 
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  onClick={() => handleStartAttendance(activeServices.find(s => s.status === 'WAITING').id)}
                                  disabled={isStartingService}
                                  className={cn(
                                    "flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-[22px] font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-95 animate-bounce ring-8 ring-emerald-50/50",
                                    isStartingService && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <Sparkles size={18} className="fill-white/20" /> 
                                  {isStartingService ? 'Iniciando...' : 'Iniciar Atendimento'}
                                </motion.button>
                              )}
                            </AnimatePresence>

                            {activeServices.find(s => s.status === 'IN_PROGRESS') && (
                              <div className="flex items-center gap-3 bg-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-indigo-200 shadow-inner">
                                <Activity size={16} className="animate-pulse" />
                                Em Atendimento
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={exportToPDF}
                                disabled={isExporting}
                                className={cn(
                                  "flex items-center justify-center w-12 h-12 bg-white text-indigo-600 border-2 border-indigo-50 rounded-2xl font-black text-[10px] uppercase transition-all shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-90 group",
                                  isExporting && "opacity-50 cursor-not-allowed"
                                )}
                                title="Exportar PDF"
                              >
                                <Printer size={20} className="group-hover:scale-110 transition-transform" /> 
                              </button>
                              {isAdmin && (
                                <button className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-white border-2 border-gray-100 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-90 group" title="Mais Opções">
                                  <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                                </button>
                              )}
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-[28px] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group/item">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-400 group-hover/item:text-indigo-600 transition-colors">
                              <Phone size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1 opacity-60">Contato Principal</p>
                              <p className="text-sm font-bold text-indigo-950 truncate whitespace-nowrap">{selectedP?.phone || 'Não Informado'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-[28px] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group/item">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-400 group-hover/item:text-indigo-600 transition-colors">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1 opacity-60">Endereço Residencial</p>
                              <p className="text-sm font-bold text-indigo-950 truncate" title={selectedP?.address}>{selectedP?.address || 'Não Informado'}</p>
                            </div>
                          </div>

                          <div className={cn(
                            "flex items-center gap-4 p-4 rounded-[28px] border-2 transition-all duration-500",
                            activeServices.length > 0 
                              ? "bg-amber-50 border-amber-100 text-amber-900 shadow-lg shadow-amber-200/20" 
                              : "bg-emerald-50 border-emerald-100 text-emerald-900"
                          )}>
                            <div className={cn(
                              "p-3 rounded-2xl shadow-sm",
                              activeServices.length > 0 ? "bg-white text-amber-600" : "bg-white text-emerald-600"
                            )}>
                              {activeServices.length > 0 ? <Activity size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Status Atual</p>
                              <p className="text-sm font-black uppercase italic whitespace-nowrap">
                                {activeServices.length > 0 ? 'Fluxo de Atendimento' : 'Jornada Concluída'}
                              </p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Timeline Column */}
                <div className="xl:col-span-7 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={18} className="text-indigo-400" /> Histórico Evolutivo
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner border border-indigo-100">
                         {history.length} Registros
                       </span>
                    </div>
                  </div>
                    {/* Participant Original Observation */}
                    {selectedP && selectedP.observation && (
                      <div className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-md z-10" />
                        <div className="bg-gradient-to-br from-emerald-50/50 to-white p-6 rounded-[32px] border border-emerald-100 shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                              <Sparkles size={16} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase block mb-0.5">
                                Início da Jornada
                              </span>
                              <span className="text-xs text-emerald-600/60 font-bold italic">
                                {safeFormat(selectedP.registrationDate, "dd 'de' MMMM 'de' yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest pl-1">Motivo do Comparecimento</p>
                            <div className="bg-white/60 p-4 rounded-2xl border border-emerald-50 text-base text-gray-800 font-medium leading-relaxed italic shadow-inner">
                                "{selectedP.observation}"
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {history.length > 0 ? (
                      [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((evo, idx) => (
                        <div key={evo.id || idx} className="relative pl-8 group/timeline">
                          <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-md z-10 group-hover/timeline:scale-125 transition-transform" />
                          
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group/card overflow-hidden relative"
                          >
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full translate-x-12 -translate-y-12 blur-2xl group-hover/card:scale-150 transition-transform duration-700" />
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-[20px] bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 group-hover/card:scale-110 transition-transform">
                                  {sectors.find(s => s.id === evo.sectorId)?.name?.charAt(0) || 'S'}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[10px] font-black tracking-[0.25em] text-indigo-600 uppercase block mb-1 truncate">
                                    {sectors.find(s => s.id === evo.sectorId)?.name || 'Setor Indefinido'}
                                  </span>
                                  <span className="text-sm text-gray-400 font-bold flex items-center gap-2">
                                    <Calendar size={14} />
                                    {safeFormat(evo.date, "dd 'de' MMMM 'às' HH:mm")}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {isAdmin && (
                                  <button 
                                    onClick={() => setEditingEvo(evo)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Excluir este registro permanentemente?')) {
                                      try {
                                        await dataService.deleteEvolution(evo.id);
                                        if (selectedP) loadHistory(selectedP.id);
                                      } catch (err) {
                                        console.error('Error deleting evolution:', err);
                                      }
                                    }
                                  }}
                                  className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1 pl-1">
                                  <div className="w-1 h-3 bg-indigo-200 rounded-full" />
                                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Registro Evolutivo</p>
                                </div>
                                {isAdmin || (currentUser?.role === 'COORDENADOR' && evo.sectorId === currentUser?.sectorId) ? (
                                  <div 
                                    className="text-lg text-indigo-950 font-medium leading-relaxed prose prose-indigo max-w-none pl-1"
                                    dangerouslySetInnerHTML={{ __html: evo.notesEncrypted || '<i>Sem observações detalhadas.</i>' }}
                                  />
                                ) : (
                                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4 text-gray-400 italic text-sm shadow-inner">
                                    <Lock size={20} className="shrink-0 opacity-50" />
                                    <span className="leading-tight">Conteúdo restrito ao setor de origem ou nível de acesso superior.</span>
                                  </div>
                                )}
                              </div>

                              <div className="p-8 bg-indigo-50/40 rounded-[32px] border border-indigo-100/50 relative group/evo hover:bg-indigo-50/60 transition-colors">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
                                    <Heart size={14} className="fill-white/30" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-indigo-700 tracking-[0.2em]">
                                    Recomendações Fraternas
                                  </p>
                                </div>
                                {isAdmin || (currentUser?.role === 'COORDENADOR' && evo.sectorId === currentUser?.sectorId) ? (
                                  <div 
                                    className="text-lg text-indigo-900 font-bold leading-relaxed prose prose-indigo italic pl-1"
                                    dangerouslySetInnerHTML={{ __html: evo.recommendations || '<i>Nenhuma recomendação específica para este momento.</i>' }}
                                  />
                                ) : (
                                  <div className="flex items-center gap-3 text-indigo-300 italic text-sm py-2">
                                    <Lock size={16} /> Conteúdo sob sigilo fraternal.
                                  </div>
                                )}
                              </div>

                              {(evo.encaminhamento || (evo.nextStepSectorIds && evo.nextStepSectorIds.length > 0)) && (
                                <div className="pt-8 border-t border-indigo-50 space-y-4">
                                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.25em] pl-1">Destinos e Encaminhamentos</p>
                                  
                                  <div className="flex flex-wrap gap-3">
                                    {evo.encaminhamento && (
                                      <div className="flex items-center gap-3 text-[11px] font-black text-indigo-700 bg-white px-5 py-2.5 rounded-2xl uppercase border-2 border-indigo-50 shadow-sm transition-all hover:border-indigo-200">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        {evo.encaminhamento}
                                      </div>
                                    )}
                                    {evo.nextStepSectorIds && evo.nextStepSectorIds.map(sid => (
                                      <div key={sid} className="flex items-center gap-3 text-[11px] font-black text-emerald-700 bg-emerald-50 px-5 py-2.5 rounded-2xl uppercase border-2 border-emerald-100 shadow-sm transition-all hover:border-emerald-200">
                                        <CheckCircle2 size={16} strokeWidth={3} /> {sectors.find(s => s.id === sid)?.name || 'Setor'}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50/50 rounded-[48px] p-16 text-center border-2 border-dashed border-gray-100">
                        <History size={48} className="mx-auto text-gray-200 mb-4 opacity-50" />
                        <h4 className="text-gray-400 font-bold text-lg mb-1">Caminhada Silenciosa</h4>
                        <p className="text-gray-400 text-sm italic">Nenhum registro anterior encontrado para este atendido.</p>
                      </div>
                    )}
                  </div>

                {/* Recording / Form Column */}
                <div className="xl:col-span-5 space-y-6">
                  <div className="sticky top-8">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4 px-2">
                      <Send size={18} className="text-indigo-400" /> Registro de Atendimento
                    </h3>

                    <form id="evolution-form" onSubmit={handleSaveEvolution} className="bg-white p-8 sm:p-10 rounded-[48px] border-2 border-indigo-50 text-indigo-900 space-y-6 shadow-2xl shadow-indigo-100 relative group overflow-hidden">
                       {/* Form Background Accent */}
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

                      {editingEvo && (
                        <div className="flex items-center justify-between mb-2">
                           <span className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase italic border border-amber-200">
                             Modo Edição Ativo
                           </span>
                           <button 
                             type="button"
                             onClick={() => {
                               setEditingEvo(null);
                               setFormData({ recordingSectorId: sectors[0].id, notes: '', recommendations: '', referralSectors: [], encaminhamento: '' });
                             }}
                             className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all active:scale-90"
                           >
                             <X size={16} />
                           </button>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-indigo-300 ml-1 tracking-widest">Setor Responsável</label>
                         <select 
                           value={formData.recordingSectorId}
                           onChange={(e) => setFormData({...formData, recordingSectorId: e.target.value})}
                           disabled={currentUser?.role === 'COORDENADOR'}
                           className="w-full bg-gray-50/50 border border-indigo-50 text-indigo-900 rounded-2xl p-4 font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           {sectors.map(s => (
                             <option key={s.id} value={s.id} className="bg-white text-indigo-900">
                               {s.name}
                             </option>
                           ))}
                         </select>
                      </div>

                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase text-indigo-300 ml-1 tracking-widest flex items-center justify-between">
                           Observações (Sigilosas)
                           <Lock size={10} className="opacity-40" />
                        </label>
                        <div className="relative group/textarea">
                          <textarea 
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Notas detalhadas do atendimento..."
                            className="w-full min-h-[160px] bg-gray-50/50 rounded-3xl p-5 text-gray-800 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-medium transition-all pr-12 shadow-inner leading-relaxed"
                          />
                          <button
                            type="button"
                            onClick={() => improveText('notes')}
                            disabled={isImprovingNotes || !formData.notes}
                            className={cn(
                              "absolute right-4 bottom-4 w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 group/btn",
                              isImprovingNotes ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
                            )}
                            title="Refinar com IA"
                          >
                            <Sparkles size={18} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-300 ml-1 tracking-widest flex items-center justify-between">
                           Orientações para o Atendido
                           <Heart size={10} className="opacity-40" />
                        </label>
                        <div className="relative">
                          <textarea 
                            value={formData.recommendations || ''}
                            onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                            placeholder="Prescrições fluídicas, orações, leituras..."
                            className="w-full min-h-[120px] bg-indigo-50/20 rounded-3xl p-5 text-indigo-900 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none font-bold italic transition-all pr-12 shadow-sm leading-relaxed"
                          />
                          <button
                            type="button"
                            onClick={() => improveText('recommendations')}
                            disabled={isImprovingRecs || !formData.recommendations}
                            className={cn(
                              "absolute right-4 bottom-4 w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95",
                              isImprovingRecs ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
                            )}
                            title="Refinar com IA"
                          >
                            <Sparkles size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-indigo-50">
                        <label className="text-[10px] font-black uppercase text-indigo-300 ml-1 tracking-widest">Encaminhamentos</label>
                        
                        <div className="grid grid-cols-1 gap-3">
                           <div className="relative">
                              <select 
                                value={formData.encaminhamento}
                                onChange={(e) => setFormData({...formData, encaminhamento: e.target.value})}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl px-5 py-3 outline-none text-xs font-bold transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Sem conclusão específica</option>
                                <option value="Doutrinária">Assistência Espiritual / Doutrinária</option>
                                <option value="Tratamento">Tratamento de Desobsessão</option>
                                <option value="Cursos">Cursos / Escola de Aprendizes</option>
                                <option value="Evangelização">Evangelização Infantil/Juvenil</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Encaminhar para novos Setores:</p>
                           <div className="grid grid-cols-2 gap-2">
                             {sectors.map(sector => (
                               <button
                                 key={sector.id}
                                 type="button"
                                 onClick={() => toggleSector(sector.id)}
                                 className={cn(
                                   "p-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border-2",
                                   formData.referralSectors.includes(sector.id)
                                     ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                     : "bg-gray-50 border-gray-50 text-gray-400 hover:bg-white hover:border-indigo-200"
                                 )}
                               >
                                 <div className={cn(
                                   "w-3 h-3 rounded-sm border flex items-center justify-center",
                                   formData.referralSectors.includes(sector.id) ? "bg-white border-white text-indigo-600" : "border-gray-300"
                                 )}>
                                   {formData.referralSectors.includes(sector.id) && <CheckCircle2 size={8} />}
                                 </div>
                                 <span className="truncate">{sector.name}</span>
                               </button>
                             ))}
                           </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={cn(
                          "w-full py-5 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95",
                          editingEvo ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                        )}
                      >
                        {editingEvo ? <ClipboardCheck size={20} /> : <Send size={20} />}
                        <span>{editingEvo ? 'Salvar Edição' : 'Confirmar Registro'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <User className="text-gray-300" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-400">Nenhum Atendido Selecionado</h3>
                <p className="text-gray-400 max-w-xs mx-auto mt-2">Selecione um irmão na lista à esquerda para ver seu histórico ou realizar um novo encaminhamento.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
