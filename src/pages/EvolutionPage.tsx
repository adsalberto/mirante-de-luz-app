import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Send, 
  ClipboardCheck, 
  ArrowRight, 
  Heart, 
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  Printer,
  X,
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
  
  // Note Form
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
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedP, isLoading]);

  useEffect(() => {
    if (currentUser?.role) {
      if (['RECEPCIONISTA', 'SECRETARIO', 'ATENDENTE', 'VOLUNTARIO'].includes(currentUser.role)) {
        setError('Ação não permitida: Seu perfil atual não possui privilégios para esta operação.');
      }
    }
    loadBaseData();
  }, [location.state, location.search, currentUser]);

  useEffect(() => {
    if (selectedP) {
      loadHistory(selectedP.id);
      loadActiveServices(selectedP.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedP]);

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
      setActiveServices(q || []);
    } catch (err) {
      console.error('Error loading active services:', err);
      setActiveServices([]);
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
    <div className="p-8 h-full flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Evolução & Encaminhamento</h1>
        <p className="text-gray-500 font-medium">Acompanhe a jornada espiritual e direcione os próximos passos.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[400px]">
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

          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
            {filteredParticipants.length > 0 ? filteredParticipants.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedP(p)}
                className={cn(
                  "w-full text-left p-5 rounded-3xl border-2 transition-all group relative overflow-hidden",
                  selectedP?.id === p.id 
                    ? "bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-100 text-white" 
                    : "bg-white border-gray-50 text-gray-900 hover:border-indigo-100 shadow-sm"
                )}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold border-2",
                    selectedP?.id === p.id ? "bg-white/10 border-white/20 text-white" : "bg-indigo-50 border-indigo-50 text-indigo-600"
                  )}>
                    {(p.name || '?').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{p.name}</p>
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded-md border",
                        (p.gender === 'Masculino' || p.gender === 'M') ? "bg-blue-50 text-blue-600 border-blue-100" : (p.gender === 'Feminino' || p.gender === 'F') ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-gray-50 text-gray-600 border-gray-100"
                      )}>
                        {(p.gender === 'Masculino' || p.gender === 'M') ? 'Masc' : (p.gender === 'Feminino' || p.gender === 'F') ? 'Fem' : p.gender || 'N/I'}
                      </span>
                    </div>
                    <p className={cn("text-[10px] font-black uppercase tracking-tighter", selectedP?.id === p.id ? "text-indigo-200" : "text-gray-400")}>
                      Reg: {String(p.id).includes('-') ? String(p.id).split('-')[1] : String(p.id).substring(0, 5)}
                    </p>
                  </div>
                </div>
              </button>
            )) : (
              <div className="bg-white/50 border-2 border-dashed border-gray-200 p-8 rounded-3xl text-center">
                <User className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm font-medium">Nenhum atendido<br/>encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Prontuário e Nova Evolução */}
        <div className="lg:col-span-8 overflow-y-auto no-scrollbar pb-10">
          {selectedP ? (
            <div
              key={selectedP.id}
              className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-black text-indigo-600">
                    {(selectedP?.name || '?').charAt(0)}
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{selectedP?.name}</h2>
                    {history.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-gray-400">Setores:</span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(history.map(e => e.sectorId))).map(sid => (
                            <span key={sid} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-bold border border-gray-100">
                              {sectors.find(s => s.id === sid)?.name || 'Setor'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2 print:hidden">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-gray-200">
                        <Calendar size={12} /> {safeFormat(selectedP?.birthDate, "dd/MM/yyyy")}
                      </span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-colors",
                        (selectedP?.gender === 'Masculino' || selectedP?.gender === 'M') ? "bg-blue-50 text-blue-600 border-blue-100" : (selectedP?.gender === 'Feminino' || selectedP?.gender === 'F') ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                      )}>
                        <User size={12} /> Sexo: {(selectedP?.gender === 'Masculino' || selectedP?.gender === 'M') ? 'Masculino' : (selectedP?.gender === 'Feminino' || selectedP?.gender === 'F') ? 'Feminino' : selectedP?.gender || 'N/I'}
                      </span>
                      <button 
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className={cn(
                          "bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-100 transition-all shadow-sm hover:bg-emerald-100",
                          isExporting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Printer size={12} /> 
                        {isExporting ? 'Processando...' : 'Imprimir Prontuário'}
                      </button>
                    </div>

                    {/* Print Header - Only visible when printing */}
                    <div className="hidden print:block border-b-2 border-indigo-900 pb-4 mb-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <h1 className="text-2xl font-black text-indigo-900">Centro Espírita Mirante de Luz</h1>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prontuário de Atendimento Espiritual</p>
                        </div>
                        <div className="text-right text-[10px] font-black text-gray-400">
                          DATA DE EMISSÃO: {new Date().toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-4 text-sm font-bold">
                        <p><span className="text-[10px] font-black text-gray-300 uppercase block">Atendido</span> {selectedP?.name}</p>
                        <p><span className="text-[10px] font-black text-gray-300 uppercase block">Nascimento</span> {safeFormat(selectedP?.birthDate, "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[10px] uppercase text-gray-300">Endereço:</span>
                          <span className="truncate">{selectedP?.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[10px] uppercase text-gray-300">Telefone:</span>
                          <span>{selectedP?.phone}</span>
                        </div>
                      </div>

                      {/* Intersectoral Status Indicators */}
                      {activeServices.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {activeServices.map((q, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 text-[10px] font-bold animate-pulse">
                              <AlertCircle size={14} />
                              Atendimento Ativo: {sectors.find(s => s.id === q.sectorId)?.name || 'Outro Setor'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={16} /> Linha do Tempo
                  </h3>
                  <div className="space-y-4">
                    {/* Participant Original Observation */}
                    {selectedP && selectedP.observation && (
                      <div className="relative pl-6 border-l-2 border-indigo-100 pb-2">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                        <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black tracking-tighter text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                              Cadastro Inicial
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {safeFormat(selectedP.registrationDate, "dd 'de' MMM, yyyy")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-emerald-400/70">Observação do Cadastro</p>
                            <p className="text-sm text-gray-700 font-medium italic">{selectedP.observation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {history.length > 0 ? history.map((evo, idx) => (
                      <div key={evo.id || idx} className="relative pl-6 border-l-2 border-indigo-100 pb-2 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                        <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black tracking-tighter text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                {sectors.find(s => s.id === evo.sectorId)?.name || 'Setor Indefinido'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">
                                {safeFormat(evo.date, "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isAdmin && (
                                <button 
                                  onClick={() => setEditingEvo(evo)}
                                  className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="Editar registro"
                                >
                                  <Pencil size={14} />
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
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir item"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-gray-400">Registro do Atendimento</p>
                                {isAdmin || (currentUser?.role === 'COORDENADOR' && evo.sectorId === currentUser?.sectorId) ? (
                                  <div 
                                    className="text-sm text-gray-700 font-medium leading-relaxed prose prose-sm max-w-none prose-indigo list-disc pl-4"
                                    dangerouslySetInnerHTML={{ __html: evo.notesEncrypted || '<i>Sem observações.</i>' }}
                                  />
                                ) : (
                                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 text-gray-400 italic text-xs">
                                    <Lock size={14} />
                                    <span>Conteúdo restrito ao setor de origem ou nível de acesso.</span>
                                    {currentUser?.role === 'COORDENADOR' && (
                                      <button 
                                        type="button"
                                        onClick={() => alert(`Acesso restrito: Você é coordenador do setor ${sectors.find(s => s.id === currentUser.sectorId)?.name || 'outro'}, mas este registro pertence ao setor ${sectors.find(s => s.id === evo.sectorId)?.name || 'outro'}.`)}
                                        className="ml-auto text-indigo-600 font-bold hover:underline"
                                      >
                                        Saber mais
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <p className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                                  <Heart size={10} /> Recomendações Terapêuticas
                                </p>
                                {isAdmin || (currentUser?.role === 'COORDENADOR' && evo.sectorId === currentUser?.sectorId) ? (
                                  <div 
                                    className="text-sm text-indigo-900 font-bold leading-relaxed prose prose-sm max-w-none prose-indigo italic"
                                    dangerouslySetInnerHTML={{ __html: evo.recommendations || '<i>Sem recomendações específicas.</i>' }}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 text-indigo-300 italic text-xs py-1">
                                    <Lock size={12} /> Conteúdo bloqueado
                                  </div>
                                )}
                              </div>
                            </div>
                          {evo.encaminhamento && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase border border-indigo-100">
                          <ClipboardCheck size={10} /> Encaminhamento: {evo.encaminhamento}
                        </div>
                      )}
                      {evo.nextStepSectorIds && evo.nextStepSectorIds.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-50">
                              <p className="text-[9px] font-black uppercase text-gray-300 mb-2">Encaminhado para:</p>
                              <div className="flex flex-wrap gap-2">
                                {evo.nextStepSectorIds.map(sid => (
                                  <div key={sid} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase border border-emerald-100">
                                    <CheckCircle2 size={10} /> {sectors.find(s => s.id === sid)?.name || 'Setor'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="bg-gray-50/50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-100">
                        <History size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-gray-400 text-sm font-medium">Nenhum registro anterior encontrado para este atendido.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Send size={16} /> {editingEvo ? 'Editar Evolução' : 'Nova Evolução'}
                  </h3>
                  <form id="evolution-form" onSubmit={handleSaveEvolution} className="bg-indigo-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-indigo-200 ring-4 ring-indigo-50 relative">
                    {editingEvo && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingEvo(null);
                          setFormData({ recordingSectorId: sectors[0].id, notes: '', recommendations: '', referralSectors: [], encaminhamento: '' });
                        }}
                        className="absolute right-8 top-8 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-indigo-300 ml-1">Registrar para o Setor:</label>
                       <select 
                         value={formData.recordingSectorId}
                         onChange={(e) => setFormData({...formData, recordingSectorId: e.target.value})}
                         disabled={currentUser?.role === 'COORDENADOR'}
                         className="w-full bg-white/10 border border-indigo-700/50 text-white rounded-2xl p-4 font-bold outline-none focus:bg-white/20 transition-all pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {sectors.map(s => (
                           <option key={s.id} value={s.id} className="bg-indigo-900 text-white">
                             {s.name}
                           </option>
                         ))}
                       </select>
                       {currentUser?.role === 'COORDENADOR' && (
                         <p className="text-[9px] text-indigo-300/60 mt-1 italic">* Restrito ao seu setor de coordenação.</p>
                       )}
                    </div>

                    <div className="space-y-2 relative group-textarea">
                      <label className="text-[10px] font-black uppercase text-indigo-300 ml-1">Observações Íntimas (Sigilosas)</label>
                      <div className="relative">
                        <textarea 
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          placeholder="Notas do atendimento fraterno..."
                          className="w-full min-h-[120px] bg-white rounded-2xl p-4 text-gray-900 border border-indigo-700/30 font-medium outline-none focus:ring-2 focus:ring-white transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => improveText('notes')}
                          disabled={isImprovingNotes || !formData.notes}
                          className={cn(
                            "absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                            isImprovingNotes ? "bg-gray-200 animate-pulse cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"
                          )}
                          title="Melhorar texto com IA"
                        >
                          <ArrowUp size={16} className={cn(isImprovingNotes && "animate-bounce")} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 relative group-textarea">
                      <label className="text-[10px] font-black uppercase text-indigo-300 ml-1">Recomendações e Terapias</label>
                      <div className="relative">
                        <textarea 
                          value={formData.recommendations || ''}
                          onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                          placeholder="Passe, Evangelho no Lar, etc..."
                          className="w-full min-h-[100px] bg-white rounded-2xl p-4 text-gray-900 border border-indigo-700/30 font-medium outline-none focus:ring-2 focus:ring-white transition-all pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => improveText('recommendations')}
                          disabled={isImprovingRecs || !formData.recommendations}
                          className={cn(
                            "absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95",
                            isImprovingRecs ? "bg-gray-200 animate-pulse cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"
                          )}
                          title="Melhorar texto com IA"
                        >
                          <ArrowUp size={16} className={cn(isImprovingRecs && "animate-bounce")} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-indigo-300 ml-1">Encaminhamento Geral (Sessão Doutrinária)</label>
                      <select 
                        value={formData.encaminhamento}
                        onChange={(e) => setFormData({...formData, encaminhamento: e.target.value})}
                        className="w-full bg-white/10 border border-indigo-700/50 text-white rounded-2xl p-4 font-bold outline-none focus:bg-white/20 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-indigo-900 text-white">Nenhum</option>
                        <option value="Doutrinária" className="bg-indigo-900 text-white">Doutrinária</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-indigo-300 ml-1 block">Encaminhamentos Específicos (Próximos Setores)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sectors.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSector(s.id)}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                              formData.referralSectors.includes(s.id)
                                ? "bg-white text-indigo-900 border-white shadow-lg"
                                : "bg-white/10 text-indigo-100 border-indigo-700/50 hover:bg-white/20"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                              formData.referralSectors.includes(s.id) ? "bg-indigo-600 border-indigo-600 text-white" : "border-indigo-400/50"
                            )}>
                              {formData.referralSectors.includes(s.id) && <CheckCircle2 size={12} />}
                            </div>
                            <span className="text-xs font-bold">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={cn(
                        "w-full font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95",
                        editingEvo ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-white text-indigo-900 hover:bg-indigo-50"
                      )}
                    >
                      {editingEvo ? <ClipboardCheck size={18} /> : <Send size={18} fill="currentColor" />}
                      <span>{editingEvo ? 'Salvar Alterações' : 'Confirmar & Enviar'}</span>
                    </button>
                  </form>
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
