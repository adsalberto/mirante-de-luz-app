import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  X,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Pencil,
  Trash2,
  History,
  AlertCircle,
  Lock,
  ClipboardCheck,
  Filter,
  ArrowLeft,
  QrCode,
  Printer,
  Camera,
  CreditCard,
  Tag,
  Contact,
  Upload,
  Sparkles,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { dataService } from "../services/dataService";
import {
  Participant,
  Worker,
  Sector,
  Evolution,
  formatSectorName,
} from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ParticipantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeQueues, setActiveQueues] = useState<any[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "participants" | "workers" | "referrals"
  >("participants");
  const [sectorsLoaded, setSectorsLoaded] = useState(false);

  const isCoordenadorMediunico =
    currentUser?.role === "COORDENADOR" &&
    sectors.some(
      (s) => s.id === currentUser.sectorId && s.type === "MEDIUNICO",
    );
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ADM";
  const canAccessWorkers = isAdmin || isCoordenadorMediunico;

  useEffect(() => {
    if (sectorsLoaded && activeTab === "workers" && !canAccessWorkers) {
      setActiveTab("participants");
    }
  }, [activeTab, canAccessWorkers, sectorsLoaded]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [encaminhamentoFilter, setEncaminhamentoFilter] = useState("all");
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinParticipant, setCheckinParticipant] =
    useState<Participant | null>(null);
  const [selectedCheckinSectors, setSelectedCheckinSectors] = useState<
    string[]
  >([]);
  const [isCheckinPriority, setIsCheckinPriority] = useState(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);

  // --- MEMBER CREDENTIALS & BADGE SCAN STATES ---
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const [credentialParticipant, setCredentialParticipant] = useState<Participant | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [activeCredentialTab, setActiveCredentialTab] = useState<'carteira' | 'cracha'>('carteira');
  
  // Customizations
  const [customRole, setCustomRole] = useState('Trabalhador Voluntário');
  const [customAccessLevel, setCustomAccessLevel] = useState('Geral / Multi-Setores');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [customEventName, setCustomEventName] = useState('Seminário Espírita CEMIL 2026');
  const [customEventDate, setCustomEventDate] = useState('Maio de 2026');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [themeColorPreset, setThemeColorPreset] = useState<'emerald' | 'indigo' | 'amber' | 'rose'>('emerald');

  // Photo alignment and zoom edit states
  const [photoScale, setPhotoScale] = useState(100); // percentage (100 to 300)
  const [photoShiftX, setPhotoShiftX] = useState(0);  // pixels (-80 to 80)
  const [photoShiftY, setPhotoShiftY] = useState(0);  // pixels (-80 to 80)
  const [photoRotate, setPhotoRotate] = useState(0);  // degrees (-180 to 180)

  const [immediateSectorIds, setImmediateSectorIds] = useState<string[]>([]);
  const [immediatePriority, setImmediatePriority] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setIsModalOpen(true);
    }
  }, []);

  // Set default expiry date when component mounts
  useEffect(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setCustomExpiryDate(nextYear.toLocaleDateString('pt-BR'));
  }, []);

  // QR Code camera controller loop
  useEffect(() => {
    let scannerInstance: Html5Qrcode | null = null;

    if (isScanningQr) {
      setCameraError(null);
      setCameraActive(false);

      const timeout = setTimeout(() => {
        try {
          const container = document.getElementById("page-qr-reader-viewport");
          if (!container) return;

          scannerInstance = new Html5Qrcode("page-qr-reader-viewport");
          qrScannerRef.current = scannerInstance;

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
              let pId = (decodedText || "").trim();
              
              // Handle deep link URL structures
              try {
                if (pId.includes("?")) {
                  const urlParams = new URLSearchParams(pId.split("?")[1]);
                  pId = urlParams.get("assistidoId") || urlParams.get("scan") || pId;
                }
              } catch (e) {
                console.error("Qr deep-link parse error:", e);
              }

              // Match scanned ID in database
              const matched = participants.find(
                (p) =>
                  String(p.id).toLowerCase() === pId.toLowerCase() ||
                  String(p.name).toLowerCase() === pId.toLowerCase()
              );

              if (matched) {
                // Initialize credentials customizations
                setCredentialParticipant(matched);
                setThemeColorPreset(matched.isWorker ? 'emerald' : 'indigo');
                setCustomRole(matched.isWorker ? 'Trabalhador Voluntário' : 'Frequentador Assistido');
                setCustomAccessLevel(matched.isWorker ? 'Geral / Multi-Setores' : 'Passe & Atendimento');
                setCustomPhoto(null);
                setIsCredentialModalOpen(true);
                setIsScanningQr(false);

                if (scannerInstance && scannerInstance.isScanning) {
                  scannerInstance.stop().then(() => {
                    setCameraActive(false);
                  }).catch(console.error);
                }
              } else {
                alert(`⚠️ Código lido: "${pId}"\nNenhum membro ou participante correspondente foi localizado no sistema.`);
              }
            },
            () => {} // normal frame failure ignore
          ).then(() => {
            setCameraActive(true);
          }).catch((err) => {
            console.error("Camera startup error:", err);
            setCameraError("Acesso à câmera negado ou indisponível. Para testar sem câmera física, utilize o simulador manual abaixo.");
          });
        } catch (err) {
          console.error("Scanner exception:", err);
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
        if (scannerInstance && scannerInstance.isScanning) {
          scannerInstance.stop().catch((e) => console.error("Error stopping scanning in cleanup:", e));
        }
      };
    }
  }, [isScanningQr, participants]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    gender: "Masculino",
    address: "",
    lgpdConsent: false,
  });

  useEffect(() => {
    loadParticipants();
    loadSectors();
    if (activeTab === "referrals") {
      loadEvolutions();
    }
  }, [activeTab]);

  const loadEvolutions = async () => {
    const evos = await dataService.getAllEvolutions();
    setEvolutions(evos || []);
  };

  const loadSectors = async () => {
    const s = await dataService.getSectors();
    const uniqueS: Sector[] = [];
    const seenNames = new Set<string>();
    s?.forEach((item) => {
      const normName = formatSectorName(item.name);
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        uniqueS.push({ ...item, name: normName });
      }
    });
    setSectors(uniqueS);
    setSectorsLoaded(true);
  };

  const loadParticipants = async () => {
    const [p, q] = await Promise.all([
      dataService.getParticipants(),
      dataService.getQueue(),
    ]);
    setParticipants(p);
    setActiveQueues(
      q.filter(
        (entry) => entry.status !== "FINISHED" && entry.status !== "CANCELLED",
      ),
    );
  };

  const handleEdit = (p: Participant) => {
    if (
      ["RECEPCIONISTA", "ATENDENTE", "VOLUNTARIO"].includes(
        currentUser?.role || "",
      )
    ) {
      alert(
        "Ação não permitida: Seu perfil atual não possui privilégios para esta operação.",
      );
      return;
    }
    setEditingParticipant(p);
    setFormData({
      name: p.name || "",
      phone: p.phone || "",
      birthDate: p.birthDate || "",
      gender: p.gender || "Masculino",
      address: p.address || "",
      lgpdConsent: !!p.lgpdConsent,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      ["RECEPCIONISTA", "ATENDENTE", "VOLUNTARIO"].includes(
        currentUser?.role || "",
      )
    ) {
      alert(
        "Ação não permitida: Seu perfil atual não possui privilégios para esta operação.",
      );
      return;
    }
    if (deletingId === id) {
      try {
        await dataService.deleteParticipant(id);
        setDeletingId(null);
        loadParticipants();
        alert("Cadastro excluído com sucesso!");
      } catch (err: any) {
        console.error("Erro ao excluir participante:", err);
        alert("Erro ao excluir cadastro. Por favor, verifique suas permissões.");
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lgpdConsent) {
      alert("É necessário aceitar os termos da LGPD para continuar.");
      return;
    }

    try {
      if (editingParticipant) {
        await dataService.updateParticipant({
          ...editingParticipant,
          ...formData,
          isWorker: editingParticipant.isWorker,
        });
        alert(
          editingParticipant.isWorker
            ? "Dados do trabalhador atualizados com sucesso!"
            : "Dados do atendido atualizados com sucesso!",
        );
      } else {
        const created = await dataService.addParticipant({
          ...formData,
          isWorker: activeTab === "workers",
          lgpdDate: Date.now(),
        });

        if (created && !created.isWorker && immediateSectorIds.length > 0) {
          await Promise.all(
            immediateSectorIds.map((sectorId) =>
              dataService.addToQueue({
                participantId: created.id,
                sectorId: sectorId,
                priority: immediatePriority,
              }),
            ),
          );
          alert(
            `Novo atendido cadastrado e incluído em ${immediateSectorIds.length} fila(s) de espera com sucesso!`,
          );
        } else {
          alert(
            activeTab === "workers"
              ? "Trabalhador cadastrado no setor mediúnico com sucesso!"
              : "Novo atendido cadastrado com sucesso!",
          );
        }
      }

      setFormData({
        name: "",
        phone: "",
        birthDate: "",
        gender: "Masculino",
        address: "",
        lgpdConsent: false,
      });
      setImmediateSectorIds([]);
      setImmediatePriority(false);
      setEditingParticipant(null);
      setIsModalOpen(false);
      await loadParticipants();
    } catch (err: any) {
      console.error("Erro ao salvar atendido:", err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar: ${errObj.error || "Sem permissão"}`);
      } catch {
        alert("Ocorreu um erro ao salvar os dados.");
      }
    }
  };

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (activeTab === "workers") {
      return p.isWorker === true;
    } else if (activeTab === "participants") {
      return !p.isWorker;
    }
    return true; // referrals shows all or does something else
  });

  return (
    <div className="p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {activeTab === "workers" && (
            <button
              onClick={() => setActiveTab("participants")}
              className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-2"
            >
              <ArrowLeft size={16} /> Voltar para Atendidos
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === "participants"
              ? "Atendidos"
              : activeTab === "workers"
                ? "Trabalhadores"
                : "Visão de Encaminhamentos"}
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            {activeTab === "participants"
              ? "Gerenciamento de irmãos e irmãs assistidos."
              : activeTab === "workers"
                ? "Gerenciamento de trabalhadores em atendimento do setor mediúnico."
                : "Lista consolidada de todas as recomendações e destinos."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab("participants")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                activeTab === "participants"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              Atendidos
            </button>
            {canAccessWorkers && (
              <button
                onClick={() => setActiveTab("workers")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                  activeTab === "workers"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Trabalhadores
              </button>
            )}
            {(currentUser?.role === "ADMIN" ||
              currentUser?.role === "ADM" ||
              (currentUser?.position &&
                [
                  "Presidente(s)",
                  "Vice-presidente(s)",
                  "1º Secretário(a)",
                  "Secretário(a) de Planejamento",
                ].includes(currentUser.position))) && (
              <button
                onClick={() => setActiveTab("referrals")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                  activeTab === "referrals"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Encaminhamentos
              </button>
            )}
          </div>
          {(currentUser?.role === "ADMIN" ||
            currentUser?.role === "ADM" ||
            currentUser?.role === "COORDENADOR" ||
            currentUser?.role === "RECEPCIONISTA" ||
            currentUser?.role === "SECRETARIO") &&
            (activeTab === "participants" ||
              (activeTab === "workers" && canAccessWorkers)) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsScanningQr(true)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer"
                >
                  <QrCode size={20} />
                  <span>Escanear QR Code</span>
                </button>
                <button
                  id="open-register-modal"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <UserPlus size={20} />
                  <span>Novo Cadastro</span>
                </button>
              </div>
            )}
        </div>
      </header>

      {activeTab === "participants" || activeTab === "workers" ? (
        <>
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
              size={20}
            />
            <input
              id="participant-search"
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100">
                        {(p.name || "?").charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                              p.currentStatus === "IDLE"
                                ? "bg-gray-50 text-gray-400 border-gray-100"
                                : p.currentStatus === "WAITING"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : p.currentStatus === "IN_SERVICE"
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                    : p.currentStatus === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                      : "bg-blue-50 text-blue-600 border-blue-100",
                            )}
                          >
                            {p.currentStatus === "IDLE"
                              ? "Livre"
                              : p.currentStatus === "WAITING"
                                ? "Em Espera"
                                : p.currentStatus === "IN_SERVICE"
                                  ? "Em Atendimento"
                                  : p.currentStatus === "COMPLETED"
                                    ? "Concluído"
                                    : p.currentStatus === "REFERRERED"
                                      ? "Encaminhado"
                                      : p.currentStatus}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                              p.gender === "Masculino" || p.gender === "M"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : p.gender === "Feminino" || p.gender === "F"
                                  ? "bg-pink-50 text-pink-600 border-pink-100"
                                  : "bg-gray-50 text-gray-400 border-gray-100",
                            )}
                          >
                            {p.gender === "Masculino" || p.gender === "M"
                              ? "Masc"
                              : p.gender === "Feminino" || p.gender === "F"
                                ? "Fem"
                                : p.gender || "N/I"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentUser?.role !== "RECEPCIONISTA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/atendimentos?participantId=${p.id}`);
                          }}
                          title="Abrir Prontuário"
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <History size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckinParticipant(p);
                          setIsCheckinModalOpen(true);
                          setSelectedCheckinSectors([]);
                        }}
                        title="Entrar na Fila"
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <ClipboardCheck size={18} />
                      </button>
                      {currentUser?.role !== "RECEPCIONISTA" &&
                        currentUser?.role !== "ATENDENTE" &&
                        currentUser?.role !== "VOLUNTARIO" && (
                          <>
                            {p.isWorker && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCredentialParticipant(p);
                                  setThemeColorPreset('emerald');
                                  setCustomRole('Trabalhador Voluntário');
                                  setCustomAccessLevel('Geral / Multi-Setores');
                                  setCustomPhoto(null);
                                  setPhotoScale(100);
                                  setPhotoShiftX(0);
                                  setPhotoShiftY(0);
                                  setPhotoRotate(0);
                                  setIsCredentialModalOpen(true);
                                }}
                                title="Gerar Carteirinha / Crachá"
                                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <CreditCard size={18} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(p);
                              }}
                              title="Editar Trabalhador"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className={cn(
                                "p-2 transition-all rounded-lg flex items-center gap-1",
                                deletingId === p.id
                                  ? "bg-red-500 text-white text-[10px] font-bold px-3 py-1"
                                  : "text-gray-400 hover:text-red-500",
                              )}
                            >
                              {deletingId === p.id ? (
                                "Confirma?"
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-300" />
                      <span>{p.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-300" />
                      <span>Nascimento: {p.birthDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-300" />
                      <span className="truncate">{p.address}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-[10px]">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-emerald-600 font-bold uppercase tracking-tight">
                        LGPD: Aceito em {format(p.lgpdDate, "dd/MM/yyyy")}
                      </span>
                    </div>

                    {/* Active Service Notification Area */}
                    {activeQueues.filter((q) => q.participantId === p.id)
                      .length > 0 && (
                      <div className="pt-2">
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-tighter">
                          <AlertCircle size={12} />
                          Atendimento Ativo:{" "}
                          {activeQueues
                            .filter((aq) => aq.participantId === p.id)
                            .map(
                              (aq) =>
                                sectors.find((s) => s.id === aq.sectorId)?.name,
                            )
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  </div>

                  {currentUser?.role !== "RECEPCIONISTA" && (
                    <button
                      onClick={() =>
                        navigate(`/atendimentos?participantId=${p.id}`)
                      }
                      className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 font-bold rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                    >
                      <span>Ver Prontuário</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <Search className="text-gray-300" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-400">
                    Nenhum resultado
                  </h3>
                  <p className="text-gray-400">
                    Tente buscar por outro termo ou cadastre um novo atendido.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEncaminhamentoFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  encaminhamentoFilter === "all"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-100",
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setEncaminhamentoFilter("Doutrinária")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  encaminhamentoFilter === "Doutrinária"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-100",
                )}
              >
                Doutrinária
              </button>
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Total:{" "}
              {
                evolutions.filter(
                  (e) =>
                    encaminhamentoFilter === "all" ||
                    e.encaminhamento === encaminhamentoFilter,
                ).length
              }{" "}
              registros
            </div>
          </div>

             {/* Mobile View: Custom Card List (shows on small screens only) */}
          <div className="md:hidden space-y-4">
            {evolutions
              .filter(
                (e) =>
                  encaminhamentoFilter === "all" ||
                  e.encaminhamento === encaminhamentoFilter,
              )
              .map((evo) => {
                const participant = participants.find(
                  (p) => p.id === evo.participantId,
                );
                const sector = sectors.find((s) => s.id === evo.sectorId);
                return (
                  <div
                    key={evo.id}
                    className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 leading-tight">
                          {participant?.name || "Não identificado"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">
                          ID: {evo.participantId.substring(0, 8)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-gray-700">
                          {format(evo.date, "dd/MM/yyyy")}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {format(evo.date, "HH:mm")}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-16">Origem:</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                          {sector?.name || "Outro"}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-16 pt-0.5">Destino:</span>
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {currentUser?.role !== "RECEPCIONISTA" &&
                            evo.encaminhamento && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                                {evo.encaminhamento}
                              </span>
                            )}
                          {(evo.nextStepSectorIds || []).map((sid) => {
                            const targetSector = sectors.find(
                              (s) => s.id === sid,
                            );
                            return (
                              <span
                                key={sid}
                                className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100"
                              >
                                {targetSector?.name || "Setor"}
                              </span>
                            );
                          })}
                          {currentUser?.role === "RECEPCIONISTA" &&
                            (!evo.nextStepSectorIds ||
                              evo.nextStepSectorIds.length === 0) && (
                              <span className="text-[10px] text-gray-400 italic">
                                Dispensado
                              </span>
                            )}
                          {currentUser?.role !== "RECEPCIONISTA" &&
                            !evo.encaminhamento &&
                            (!evo.nextStepSectorIds ||
                              evo.nextStepSectorIds.length === 0) && (
                              <span className="text-[10px] text-gray-400 italic font-medium">
                                Nenhum
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {currentUser?.role !== "RECEPCIONISTA" && (
                      <div className="pt-2 border-t border-gray-50 flex justify-end">
                        <button
                          onClick={() =>
                            navigate(
                              `/atendimentos?participantId=${evo.participantId}`,
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                        >
                          <History size={14} />
                          <span>Ver Prontuário</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Desktop View: Responsive Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Atendido</th>
                    <th className="px-6 py-4">Origem</th>
                    <th className="px-6 py-4">Encaminhamento</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {evolutions
                    .filter(
                      (e) =>
                        encaminhamentoFilter === "all" ||
                        e.encaminhamento === encaminhamentoFilter,
                    )
                    .map((evo) => {
                      const participant = participants.find(
                        (p) => p.id === evo.participantId,
                      );
                      const sector = sectors.find((s) => s.id === evo.sectorId);
                      return (
                        <tr
                          key={evo.id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-gray-700">
                              {format(evo.date, "dd/MM/yyyy")}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {format(evo.date, "HH:mm")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {participant?.name || "Não identificado"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                              ID: {evo.participantId.substring(0, 8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                              {sector?.name || "Outro"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {currentUser?.role !== "RECEPCIONISTA" &&
                                evo.encaminhamento && (
                                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                                    {evo.encaminhamento}
                                  </span>
                                )}
                              {(evo.nextStepSectorIds || []).map((sid) => {
                                const targetSector = sectors.find(
                                  (s) => s.id === sid,
                                );
                                return (
                                  <span
                                    key={sid}
                                    className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100"
                                  >
                                    {targetSector?.name || "Setor"}
                                  </span>
                                );
                              })}
                              {currentUser?.role === "RECEPCIONISTA" &&
                                (!evo.nextStepSectorIds ||
                                  evo.nextStepSectorIds.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Dispensado
                                  </span>
                                )}
                              {currentUser?.role !== "RECEPCIONISTA" &&
                                !evo.encaminhamento &&
                                (!evo.nextStepSectorIds ||
                                  evo.nextStepSectorIds.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Nenhum
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {currentUser?.role !== "RECEPCIONISTA" && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/atendimentos?participantId=${evo.participantId}`,
                                  )
                                }
                                className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                              >
                                <History size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {evolutions.filter(
            (e) =>
              encaminhamentoFilter === "all" ||
              e.encaminhamento === encaminhamentoFilter,
          ).length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-50 p-20 text-center text-gray-400 font-medium italic shadow-sm w-full">
              Nenhum encaminhamento encontrado no período.
            </div>
          )}
        </div>
      )}

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {isCheckinModalOpen && checkinParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckinModalOpen(false)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">
                    Check-in na Fila
                  </h2>
                  <p className="text-sm font-medium text-gray-500">
                    Encaminhar {checkinParticipant.name} para atendimento.
                  </p>
                </div>
                <button
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (selectedCheckinSectors.length === 0) {
                    alert(
                      "Por favor, selecione pelo menos um setor de destino.",
                    );
                    return;
                  }
                  setIsCheckinLoading(true);
                  try {
                    await Promise.all(
                      selectedCheckinSectors.map((sectorId) =>
                        dataService.addToQueue({
                          participantId: checkinParticipant.id,
                          sectorId: sectorId,
                          priority: isCheckinPriority,
                        }),
                      ),
                    );
                    alert(
                      `Encaminhado para as filas (${selectedCheckinSectors.length} setores) com sucesso!`,
                    );
                    setIsCheckinModalOpen(false);
                    loadParticipants();
                  } catch (err) {
                    console.error("Erro ao fazer check-in:", err);
                    alert("Erro ao encaminhar para as filas.");
                  } finally {
                    setIsCheckinLoading(false);
                  }
                }}
                className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-indigo-600 tracking-wider ml-1">
                    Selecionar Setores de Destino (Marque um ou mais)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                    {sectors
                      .filter((s) => s.type !== "ADMINISTRATIVO")
                      .map((s) => {
                        const isChecked = selectedCheckinSectors.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedCheckinSectors(
                                  selectedCheckinSectors.filter(
                                    (id) => id !== s.id,
                                  ),
                                );
                              } else {
                                setSelectedCheckinSectors([
                                  ...selectedCheckinSectors,
                                  s.id,
                                ]);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer bg-white active:scale-95 select-none",
                              isChecked
                                ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                                : "border-gray-200 hover:border-indigo-150",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                isChecked
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-gray-300",
                              )}
                            >
                              {isChecked && <ClipboardCheck size={12} />}
                            </div>
                            <span className="text-xs font-bold text-gray-800 leading-tight">
                              {s.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div
                  className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 group cursor-pointer"
                  onClick={() => setIsCheckinPriority(!isCheckinPriority)}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      isCheckinPriority
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-amber-200",
                    )}
                  >
                    {isCheckinPriority && <ClipboardCheck size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">
                      Atendimento Prioritário
                    </p>
                    <p className="text-[10px] text-amber-700/70 font-medium">
                      Idosos, gestantes, pessoas com deficiência ou crianças.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCheckinModalOpen(false)}
                    className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckinLoading}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckinLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Confirmar</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden shadow-indigo-900/20 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingParticipant ? "Editar Cadastro" : "Novo Cadastro"}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Preencha os dados com fraternidade e atenção.
                  </p>
                </div>
                <button
                  id="close-modal-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingParticipant(null);
                  }}
                  className="p-2 hover:bg-white rounded-full transition-colors active:scale-90"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Nome Completo
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Alan Kardec de Moraes"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="(71) 90000-0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Data de Nascimento
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Sexo
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Endereço de Residência
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
                      placeholder="Rua, Número, Bairro e CEP"
                    />
                  </div>
                </div>

                {!editingParticipant && activeTab === "participants" && (
                  <div className="space-y-4 p-6 bg-gray-50 rounded-[28px] border border-gray-100/50">
                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        className="text-indigo-600 animate-pulse"
                      />
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                        Direcionamento de Chegada (Opcional)
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                      Direcione a pessoa que chegou à casa imediatamente para
                      assistir palestra doutrinária, tomar passe, ou atendimento
                      fraterno.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                          Setores de Destino (Marque um ou mais)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 bg-white rounded-xl border border-gray-200">
                          {sectors
                            .filter((s) => s.type !== "ADMINISTRATIVO")
                            .map((s) => {
                              const isChecked = immediateSectorIds.includes(
                                s.id,
                              );
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setImmediateSectorIds(
                                        immediateSectorIds.filter(
                                          (id) => id !== s.id,
                                        ),
                                      );
                                    } else {
                                      setImmediateSectorIds([
                                        ...immediateSectorIds,
                                        s.id,
                                      ]);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer bg-white active:scale-98 select-none",
                                    isChecked
                                      ? "border-indigo-600 bg-indigo-50/10 text-indigo-900"
                                      : "border-gray-150 hover:border-indigo-100 text-gray-700",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                                      isChecked
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "border-gray-300",
                                    )}
                                  >
                                    {isChecked && <ClipboardCheck size={10} />}
                                  </div>
                                  <span className="text-[11px] font-bold leading-none">
                                    {s.name}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {immediateSectorIds.length > 0 && (
                        <div
                          className="flex items-center gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-100 group cursor-pointer col-span-1 md:col-span-2"
                          onClick={() =>
                            setImmediatePriority(!immediatePriority)
                          }
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                              immediatePriority
                                ? "bg-amber-600 border-amber-600 text-white"
                                : "border-amber-200",
                            )}
                          >
                            {immediatePriority && <ClipboardCheck size={12} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-amber-900 leading-none">
                              Atendimento Prioritário
                            </p>
                            <p className="text-[9px] text-amber-700/70 font-medium mt-1 leading-none">
                              Idosos, gestantes, etc.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      id="lgpd-consent"
                      type="checkbox"
                      checked={formData.lgpdConsent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lgpdConsent: e.target.checked,
                        })
                      }
                      className="w-6 h-6 rounded-lg border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 checked:bg-indigo-600 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lgpd-consent"
                      className="text-sm font-bold text-indigo-900 cursor-pointer"
                    >
                      Termo de Consentimento (LGPD)
                    </label>
                    <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
                      Eu autorizo o Centro Espírita Mirante de Luz a tratar meus
                      dados pessoais e sensíveis (especialmente anotações de
                      cunho espiritual) para fins de tratamento e acompanhamento
                      fraterno, em conformidade com a Lei Geral de Proteção de
                      Dados.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    id="cancel-register"
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingParticipant(null);
                    }}
                    className="w-full py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all active:scale-95"
                  >
                    Descartar
                  </button>
                  <button
                    id="save-participant"
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>
                      {editingParticipant
                        ? "Salvar Alterações"
                        : "Salvar Cadastro"}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: QR CODE CAMERA SCANNER & SIMULATOR */}
      <AnimatePresence>
        {isScanningQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-emerald-600 animate-pulse" />
                  <h3 className="text-xl font-black text-slate-800">Leitor de Credenciais</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanningQr(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-600">
                  Escaneie a carteirinha física ou crachá de membro
                </p>
                <p className="text-xs text-slate-400">
                  Aponte o código QR Código do associado para a câmera do dispositivo.
                </p>
              </div>

              {/* Viewport de Câmera Real */}
              <div className="relative">
                <div 
                  id="page-qr-reader-viewport" 
                  className="w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center"
                >
                  {!cameraActive && !cameraError && (
                    <div className="space-y-2 flex flex-col items-center">
                      <Camera size={36} className="text-indigo-500 animate-bounce" />
                      <p className="font-semibold text-slate-300">Inicializando câmera física...</p>
                    </div>
                  )}
                  {cameraError && (
                    <div className="space-y-2 flex flex-col items-center">
                      <AlertCircle size={36} className="text-amber-500" />
                      <p className="font-bold text-slate-300 px-4 leading-relaxed">{cameraError}</p>
                    </div>
                  )}
                </div>
                {cameraActive && (
                  <span className="absolute top-4 right-4 bg-emerald-500 text-white font-black uppercase text-[9px] px-3 py-1 rounded-full animate-pulse shadow-md z-10 flex items-center gap-1">
                    ● Câmera Ativa
                  </span>
                )}
              </div>

              {/* SIMULADOR MANUAL PARA DESENVOLVIMENTO / TESTES */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-500" /> Simulador de Leitura (Ambiente de Testes)
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Selecione qualquer trabalhador ou atendido cadastrado no CEMIL abaixo para simular a leitura do crachá via QR Code:
                </p>
                <div className="flex gap-2">
                  <select
                    id="simulator-participant-select"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = participants.find(p => String(p.id) === selectedId);
                      if (matched) {
                        setCredentialParticipant(matched);
                        setThemeColorPreset(matched.isWorker ? 'emerald' : 'indigo');
                        setCustomRole(matched.isWorker ? 'Trabalhador Voluntário' : 'Frequentador Assistido');
                        setCustomAccessLevel(matched.isWorker ? 'Geral / Multi-Setores' : 'Passe & Atendimento');
                        setCustomPhoto(null);
                        setIsCredentialModalOpen(true);
                        setIsScanningQr(false);
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 text-xs text-slate-700 px-3 py-2 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="">-- Selecione um Membro --</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.isWorker ? '👷 [Trabalhador] ' : '👤 [Atendido] '} {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsScanningQr(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: GENERATE MEMBER CARTEIRINHA & COMPREHENSIVE EVEN BADGE PRINT */}
      <AnimatePresence>
        {isCredentialModalOpen && credentialParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Contact size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">
                      Painel de Credenciamento CEMIL
                    </h2>
                    <p className="text-sm font-medium text-slate-400">
                      Gere carteirinhas de sócio ou crachás de identificação com visualização e formatação para impressão em material PVC/papel rígido.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCredentialModalOpen(false);
                    setCredentialParticipant(null);
                  }}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Dynamic Content Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                
                {/* COLUMN 1: CUSTOMIZATIONS CONTROLS (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                      1. Tipo de Documento
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setActiveCredentialTab('carteira')}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                          activeCredentialTab === 'carteira'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Carteira de Sócio
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCredentialTab('cracha')}
                        className={cn(
                          "py-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                          activeCredentialTab === 'cracha'
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Crachá de Eventos
                      </button>
                    </div>
                  </div>

                  {/* Themes options */}
                  <div className="space-y-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                      2. Identidade Visual (Tema)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setThemeColorPreset('emerald')}
                        className={cn(
                          "w-8 h-8 rounded-full bg-emerald-600 border-4 cursor-pointer transition-all hover:scale-115 shadow-sm",
                          themeColorPreset === 'emerald' ? "border-slate-800 scale-110" : "border-emerald-100"
                        )}
                        title="Verde Espiritual"
                      />
                      <button
                        type="button"
                        onClick={() => setThemeColorPreset('indigo')}
                        className={cn(
                          "w-8 h-8 rounded-full bg-indigo-600 border-4 cursor-pointer transition-all hover:scale-115 shadow-sm",
                          themeColorPreset === 'indigo' ? "border-slate-800 scale-110" : "border-indigo-100"
                        )}
                        title="Azul Clássico"
                      />
                      <button
                        type="button"
                        onClick={() => setThemeColorPreset('amber')}
                        className={cn(
                          "w-8 h-8 rounded-full bg-amber-500 border-4 cursor-pointer transition-all hover:scale-115 shadow-sm",
                          themeColorPreset === 'amber' ? "border-slate-800 scale-110" : "border-amber-100"
                        )}
                        title="Ouro Nobre"
                      />
                      <button
                        type="button"
                        onClick={() => setThemeColorPreset('rose')}
                        className={cn(
                          "w-8 h-8 rounded-full bg-rose-600 border-4 cursor-pointer transition-all hover:scale-115 shadow-sm",
                          themeColorPreset === 'rose' ? "border-slate-800 scale-110" : "border-rose-100"
                        )}
                        title="Rosa Fraterno"
                      />
                    </div>
                  </div>

                  {/* Foto de Perfil Customization */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                      3. Foto do Credenciado
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                        {customPhoto ? (
                          <img 
                            src={customPhoto} 
                            className="w-full h-full object-cover transition-transform duration-75" 
                            style={{
                              transform: `scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg)`,
                              transformOrigin: 'center center'
                            }}
                          />
                        ) : (
                          <span className="text-xl font-bold">{(credentialParticipant?.name || "U").charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-2 flex-grow">
                        <div className="flex gap-2">
                          <label className="cursor-pointer bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[11px] font-black uppercase text-slate-600 px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1">
                            <Upload size={12} /> Carregar Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCustomPhoto(reader.result as string);
                                    setPhotoScale(100);
                                    setPhotoShiftX(0);
                                    setPhotoShiftY(0);
                                    setPhotoRotate(0);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {customPhoto && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPhoto(null);
                                setPhotoScale(100);
                                setPhotoShiftX(0);
                                setPhotoShiftY(0);
                                setPhotoRotate(0);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold px-3 py-2 rounded-xl border border-red-100 cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Suporta PNG/JPG. De preferência faces nítidas.</p>
                      </div>
                    </div>

                    {customPhoto && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-550">Ajustar & Enquadrar Foto Voluntário</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoScale(100);
                              setPhotoShiftX(0);
                              setPhotoShiftY(0);
                              setPhotoRotate(0);
                            }}
                            className="text-[8px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                          >
                            Resetar
                          </button>
                        </div>

                        {/* Zoom Scale Selector */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Aumentar Zoom / Escala</span>
                            <span className="text-emerald-600 font-mono font-bold">{photoScale}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="300"
                            step="2"
                            value={photoScale}
                            onChange={(e) => setPhotoScale(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Position X Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Alinha Horizontal (Esq ⬌ Dir)</span>
                            <span className="text-emerald-600 font-mono font-bold">{photoShiftX}px</span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            step="1"
                            value={photoShiftX}
                            onChange={(e) => setPhotoShiftX(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Position Y Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Alinha Vertical (Cima ⬌ Baixo)</span>
                            <span className="text-emerald-600 font-mono font-bold">{photoShiftY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-80"
                            max="80"
                            step="1"
                            value={photoShiftY}
                            onChange={(e) => setPhotoShiftY(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                        </div>

                        {/* Rotate Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Girar Foto / Ângulo</span>
                            <span className="text-emerald-600 font-mono font-bold">{photoRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="2"
                            value={photoRotate}
                            onChange={(e) => setPhotoRotate(Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 pt-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-none">
                      4. Informações do Cargo e Prazos
                    </span>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block pl-1">Cargo / Função do Portador</label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['Trabalhador Voluntário', 'Membro Sócio', 'Membro Efetivo', 'Membro Coordenador', 'Diretoria', 'Palestrante Espírita'].map(r => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => setCustomRole(r)}
                            className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 block pl-1">Departamento / Área de Acesso</label>
                      <input
                        type="text"
                        value={customAccessLevel}
                        onChange={(e) => setCustomAccessLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {activeCredentialTab === 'carteira' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 block pl-1">Validade da Carteira</label>
                        <input
                          type="text"
                          value={customExpiryDate}
                          onChange={(e) => setCustomExpiryDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Ex: 31/12/2027"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 pl-1 block">Nome do Evento</label>
                          <input
                            type="text"
                            value={customEventName}
                            onChange={(e) => setCustomEventName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                          />
                          <div className="flex flex-wrap gap-1 pt-1">
                            {['Seminário CEMIL', 'Mocidade Espírita 2026', 'Congresso Espiritualidade', 'Oficinas de Passe'].map(ev => (
                              <button
                                type="button"
                                key={ev}
                                onClick={() => setCustomEventName(ev)}
                                className="text-[9px] font-black uppercase px-2 py-0.5 roundedbg-slate-200 text-slate-600 hover:bg-slate-300 transition-all cursor-pointer"
                              >
                                {ev}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 pl-1 block">Data/Mês do Evento</label>
                          <input
                            type="text"
                            value={customEventDate}
                            onChange={(e) => setCustomEventDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: LIVE CARD PREVIEW MOCKUP (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-6 lg:border-l lg:border-slate-100 lg:pl-10 pb-6">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest pl-2">
                    Visualização de Impressão de Alta Resolução (3D Card)
                  </span>

                  {activeCredentialTab === 'carteira' ? (
                    /* CARTEIRINHA MOCKUP FRONT / BACK */
                    <div className="space-y-6 w-full flex flex-col items-center">
                      
                      {/* FRONT CARD */}
                      <div className="relative shadow-2xl rounded-3xl overflow-hidden hover:scale-102 transition-transform duration-300 select-none bg-white w-full max-w-[340px] border border-slate-100 text-left">
                        {/* Header bar colored */}
                        <div className={cn(
                          "h-2.5 w-full",
                          themeColorPreset === 'emerald' ? "bg-emerald-600" :
                          themeColorPreset === 'indigo' ? "bg-indigo-600" :
                          themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                        )} />
                        
                        <div className="p-4 flex flex-col justify-between h-[200px]">
                          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                            <span className="text-xl">🕊️</span>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 leading-none">CEMIL</h4>
                              <p className="text-[6.5px] text-slate-400 font-extrabold uppercase tracking-tight">Centro Espírita Maria Imaculada de Luz</p>
                            </div>
                          </div>

                          <div className="flex gap-3 my-2 items-center">
                            {/* Photo Slot */}
                            <div className={cn(
                              "w-16 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border",
                              themeColorPreset === 'emerald' ? "bg-emerald-50/50 border-emerald-100" :
                              themeColorPreset === 'indigo' ? "bg-indigo-50/50 border-indigo-100" :
                              themeColorPreset === 'amber' ? "bg-amber-50/50 border-amber-100" : "bg-rose-50/50 border-rose-100"
                            )}>
                              {customPhoto ? (
                                <img 
                                  src={customPhoto} 
                                  className="w-full h-full object-cover" 
                                  style={{
                                    transform: `scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg)`,
                                    transformOrigin: 'center center'
                                  }}
                                />
                              ) : (
                                <span className={cn(
                                  "text-2xl font-black",
                                  themeColorPreset === 'emerald' ? "text-emerald-700" :
                                  themeColorPreset === 'indigo' ? "text-indigo-700" :
                                  themeColorPreset === 'amber' ? "text-amber-700" : "text-rose-700"
                                )}>
                                  {(credentialParticipant.name || "U").charAt(0)}
                                </span>
                              )}
                            </div>

                            {/* Details Slot */}
                            <div className="space-y-1 flex-1 overflow-hidden">
                              <h5 className="font-black text-slate-800 text-[12px] truncate capitalize leading-tight">
                                {credentialParticipant.name}
                              </h5>
                              <span className={cn(
                                "inline-block text-[7px] font-black uppercase px-2 py-0.5 rounded-md border",
                                themeColorPreset === 'emerald' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                themeColorPreset === 'indigo' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                themeColorPreset === 'amber' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {customRole}
                              </span>
                              
                              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[7px] text-slate-500 font-medium">
                                <p><strong className="text-slate-800">REG:</strong> {credentialParticipant.id}</p>
                                <p><strong className="text-slate-800">ADM:</strong> {new Date(credentialParticipant.registrationDate || Date.now()).toLocaleDateString('pt-BR')}</p>
                                <p className="col-span-2"><strong className="text-slate-800">NASC:</strong> {credentialParticipant.birthDate || '-'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">
                              CARTEIRA DE MEMBRO SÓCIO
                            </span>
                            <span className="text-[7px] font-black text-slate-600 uppercase">
                              Estudo, Fraternidade e Luz
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* BACK CARD */}
                      <div className="relative shadow-2xl rounded-3xl overflow-hidden hover:scale-102 transition-transform duration-300 select-none bg-white w-full max-w-[340px] border border-slate-100 text-left">
                        <div className="p-4 flex h-[200px] items-center gap-3">
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + credentialParticipant.id)}`}
                              alt="Scan QR"
                              referrerPolicy="no-referrer"
                              className="w-[84px] h-[84px] object-contain block"
                            />
                            <span className="text-[5px] text-slate-400 font-bold uppercase font-mono mt-1 tracking-tight">Express Check-in Portaria</span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between h-full py-1">
                            <div className="space-y-1.5 text-left">
                              <h5 className="font-extrabold text-[9px] text-slate-800">Termos & Instruções</h5>
                              <p className="text-[6.5px] text-slate-500 leading-tight">
                                Esta credencial identifica de forma unívoca o associado do Centro Espírita Maria Imaculada de Luz (CEMIL), sendo pessoal e insubstituível. O portador declara aceitar as diretrizes da federativa.
                              </p>
                              <p className="text-[7px] font-bold text-slate-700">Setor: {customAccessLevel}</p>
                            </div>

                            <div className="border-t border-slate-300 pt-1">
                              <p className="text-[5px] text-slate-400 font-bold uppercase tracking-widest block text-center leading-none">Assinatura da Presidência / Secretária</p>
                            </div>

                            <div className="flex justify-between items-center text-[7px] font-black text-slate-400">
                              <span>VAL: {customExpiryDate}</span>
                              <span className="text-[6px] text-slate-300 uppercase">CEMIL CRED</span>
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "h-2.5 w-full",
                          themeColorPreset === 'emerald' ? "bg-emerald-600" :
                          themeColorPreset === 'indigo' ? "bg-indigo-600" :
                          themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                        )} />
                      </div>

                    </div>
                  ) : (
                    /* CRAGHA / BADGE MOCKUP */
                    <div className="relative shadow-2xl rounded-3xl overflow-hidden hover:scale-102 transition-transform duration-300 select-none bg-white w-full max-w-[310px] border border-slate-100 text-left min-h-[412px] flex flex-col justify-between">
                      {/* Lanyard Hole Mockup */}
                      <div className="flex justify-center shrink-0 py-2 bg-slate-50 border-b border-slate-100">
                        <div className="w-12 h-2.5 rounded-full bg-slate-300 border border-slate-200 shadow-inner flex items-center justify-center text-[5px] font-bold text-slate-500 uppercase">Furo Passador</div>
                      </div>

                      {/* Event Banner */}
                      <div className={cn(
                        "p-4 text-center text-white space-y-1 shrink-0",
                        themeColorPreset === 'emerald' ? "bg-gradient-to-r from-emerald-600 to-emerald-700" :
                        themeColorPreset === 'indigo' ? "bg-gradient-to-r from-indigo-600 to-indigo-700" :
                        themeColorPreset === 'amber' ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-rose-600 to-rose-700"
                      )}>
                        <h4 className="font-serif italic font-black text-sm tracking-tight leading-none truncate">{customEventName}</h4>
                        <p className="text-[8px] font-bold tracking-widest uppercase text-white/80">Credencial Oficial CEMIL</p>
                      </div>

                      {/* Body section */}
                      <div className="p-6 flex flex-col items-center justify-center flex-grow space-y-4">
                        {/* Avatar */}
                        <div className={cn(
                          "w-24 h-[110px] rounded-2xl overflow-hidden flex items-center justify-center border-4",
                          themeColorPreset === 'emerald' ? "bg-emerald-50/50 border-emerald-5050" :
                          themeColorPreset === 'indigo' ? "bg-indigo-50/50 border-indigo-5050" :
                          themeColorPreset === 'amber' ? "bg-amber-50/50 border-amber-5050" : "bg-rose-50/50 border-rose-5050"
                        )}>
                          {customPhoto ? (
                            <img 
                              src={customPhoto} 
                              className="w-full h-full object-cover" 
                              style={{
                                transform: `scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg)`,
                                transformOrigin: 'center center'
                              }}
                            />
                          ) : (
                            <span className={cn(
                              "text-4xl font-black",
                              themeColorPreset === 'emerald' ? "text-emerald-700" :
                              themeColorPreset === 'indigo' ? "text-indigo-700" :
                              themeColorPreset === 'amber' ? "text-amber-700" : "text-rose-700"
                            )}>
                              {(credentialParticipant.name || "U").charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Renders Text */}
                        <div className="text-center space-y-1.5 w-full">
                          <h3 className="text-lg font-black text-slate-800 capitalize leading-none tracking-tight truncate">{credentialParticipant.name}</h3>
                          
                          <div className="inline-block mt-1">
                            <span className={cn(
                              "text-[10px] font-black uppercase px-4 py-1 rounded-full text-white",
                              themeColorPreset === 'emerald' ? "bg-emerald-600" :
                              themeColorPreset === 'indigo' ? "bg-indigo-600" :
                              themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                            )}>
                              {customRole}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide pt-2">Setor: {customAccessLevel}</p>
                        </div>
                      </div>

                      {/* Footer Info & QR Code */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="space-y-1 text-left">
                          <span className="text-[7px] font-black uppercase text-slate-400 leading-none block">Período / Data</span>
                          <span className="text-xs font-black text-slate-700">{customEventDate}</span>
                          <span className="text-[8px] font-bold text-slate-500 block">ID: {credentialParticipant.id}</span>
                        </div>
                        
                        <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + credentialParticipant.id)}`}
                            alt="Scan QR Badge"
                            referrerPolicy="no-referrer"
                            className="w-[52px] h-[52px] object-contain block"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Print triggers */}
                  <div className="pt-4 flex gap-3 w-full max-w-[320px]">
                    <button
                      type="button"
                      onClick={() => {
                        const type = activeCredentialTab;
                        const printWin = window.open("", "_blank");
                        if (!printWin) {
                          alert("Por favor, permita pop-ups para que o sistema de impressão integrada funcione.");
                          return;
                        }

                        const themeColor = themeColorPreset === 'emerald' ? '#059669' : themeColorPreset === 'amber' ? '#f59e0b' : themeColorPreset === 'rose' ? '#e11d48' : '#4f46e5';
                        const themeBg = themeColorPreset === 'emerald' ? '#ecfdf5' : themeColorPreset === 'amber' ? '#fffbeb' : themeColorPreset === 'rose' ? '#fff1f2' : '#f5f3ff';
                        
                        const rDate = credentialParticipant.registrationDate ? new Date(credentialParticipant.registrationDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
                        const bDate = credentialParticipant.birthDate || '-';
                        const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${credentialParticipant.id}`);
                        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
                        
                        const transformStyle = `transform: scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg); transform-origin: center center;`;
                        const photoHtml = customPhoto 
                          ? `<img src="${customPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
                          : `<div style="width: 100%; height: 100%; background: ${themeBg}; color: ${themeColor}; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(credentialParticipant.name || "U").charAt(0)}</div>`;

                        let elementHtml = '';

                        if (type === 'carteira') {
                          elementHtml = `
                            <div class="print-cards-container">
                              <!-- CARD FRENTE (CR80) -->
                              <div class="card CR80">
                                <div class="card-inner" style="border-top: 6px solid ${themeColor};">
                                  <div class="card-header">
                                    <div class="logo">🕊️</div>
                                    <div class="header-text">
                                      <div class="title">CEMIL</div>
                                      <div class="subtitle">Centro Espírita Maria Imaculada de Luz</div>
                                    </div>
                                  </div>
                                  
                                  <div class="card-body">
                                    <div class="photo-frame" style="border: 1px solid ${themeColor}; background: ${themeBg};">
                                      ${photoHtml}
                                    </div>
                                    <div class="details">
                                      <div class="name">${credentialParticipant.name}</div>
                                      <div class="badge-role" style="background: ${themeBg}; color: ${themeColor}; border: 0.5px solid ${themeColor}60;">
                                        ${customRole.toUpperCase()}
                                      </div>
                                      <table class="data-table">
                                        <tr>
                                          <td><strong>REGISTRO:</strong> ${credentialParticipant.id}</td>
                                          <td><strong>ADMISSÃO:</strong> ${rDate}</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2"><strong>NASCIMENTO:</strong> ${bDate}</td>
                                        </tr>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <!-- CARD VERSO (CR80) -->
                              <div class="card CR80 back">
                                <div class="card-inner" style="border-bottom: 6px solid ${themeColor};">
                                  <div class="back-body">
                                    <div class="back-left">
                                      <img src="${qrImg}" class="qr" />
                                      <div class="qr-sub">Leitura Digital</div>
                                    </div>
                                    
                                    <div class="back-right">
                                      <div class="section-title">CARTEIRA DE SÓCIO</div>
                                      <div class="rules">
                                        Este documento identifica o portador como membro/colaborador voluntário do CEMIL - Centro Espírita Maria Imaculada de Luz. O uso é estritamente pessoal e intransferível.
                                      </div>
                                      
                                      <div class="signature-line" style="border-top: 0.5px solid ${themeColor}aa;">
                                        <div class="sig-title">ASSINATURA DA PRESIDÊNCIA</div>
                                      </div>
                                      
                                      <div class="meta-info">
                                        Validade: ${customExpiryDate} | Estudo, Amor e Luz
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                        } else {
                          elementHtml = `
                            <div class="print-cards-container">
                              <!-- BADGE EVENTO (3x4) -->
                              <div class="badge-card">
                                <div class="badge-inner" style="border: 2px solid ${themeColor}; border-top: 10px solid ${themeColor};">
                                  <div class="lanyard-hole"></div>
                                  
                                  <div class="badge-header">
                                    <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.5px; color: ${themeColor}; font-family: 'Space Grotesk', sans-serif;">
                                      ${customEventName.toUpperCase()}
                                    </div>
                                    <div style="font-size: 8px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px;">
                                      C E M I L
                                    </div>
                                  </div>
                                  
                                  <div class="badge-avatar-container">
                                    <div class="badge-photo" style="border: 2px solid ${themeColor}; background: ${themeBg};">
                                      ${photoHtml}
                                    </div>
                                  </div>
                                  
                                  <div class="badge-desc">
                                    <div class="badge-pname">${credentialParticipant.name}</div>
                                    
                                    <div class="badge-prole" style="background: ${themeColor}; color: #ffffff;">
                                      ${customRole.toUpperCase()}
                                    </div>
                                    
                                    <div class="badge-org" style="color: ${themeColor};">
                                      ÁREA: ${customAccessLevel}
                                    </div>
                                  </div>

                                  <div class="badge-footer">
                                    <div class="badge-footer-left">
                                      <div class="footer-label">DATA EVENTO</div>
                                      <div class="footer-val">${customEventDate}</div>
                                    </div>
                                    <div class="badge-footer-right">
                                      <img src="${qrImg}" class="badge-qr" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                        }

                        printWin.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>IMPRESSÃO - ${credentialParticipant.name}</title>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=Space+Grotesk:wght@500;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
                            <style>
                              body {
                                font-family: "Inter", -apple-system, sans-serif;
                                background-color: #f3f4f6;
                                margin: 0;
                                padding: 40px;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 100vh;
                                box-sizing: border-box;
                              }

                              .no-print-bar {
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                background: #ffffff;
                                padding: 15px 30px;
                                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                z-index: 1000;
                              }
                              .no-print-bar h3 {
                                margin: 0;
                                font-size: 14px;
                                color: #1f2937;
                                font-weight: 800;
                              }
                              .print-btn {
                                background-color: ${themeColor};
                                color: #ffffff;
                                border: none;
                                padding: 10px 20px;
                                font-size: 12px;
                                font-weight: 800;
                                text-transform: uppercase;
                                border-radius: 8px;
                                cursor: pointer;
                                box-shadow: 0 4px 10px -2px ${themeColor}40;
                              }

                              .print-cards-container {
                                display: flex;
                                flex-wrap: wrap;
                                gap: 30px;
                                justify-content: center;
                                margin-top: 40px;
                              }

                              /* CR80 PVC Standard: 85.60mm x 53.98mm */
                              .card.CR80 {
                                width: 85.6mm;
                                height: 53.98mm;
                                min-width: 85.6mm;
                                min-height: 53.98mm;
                                background: #ffffff;
                                border-radius: 3.2mm; 
                                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                                box-sizing: border-box;
                                overflow: hidden;
                                position: relative;
                                border: 1px solid #e5e7eb;
                              }
                              
                              .card-inner {
                                padding: 3mm 4mm;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                box-sizing: border-box;
                              }

                              .card-header {
                                display: flex;
                                align-items: center;
                                gap: 2mm;
                                border-bottom: 0.5px solid #e5e7eb;
                                padding-bottom: 1px;
                              }
                              .card-header .logo {
                                font-size: 14px;
                              }
                              .card-header .header-text {
                                display: flex;
                                flex-direction: column;
                                text-align: left;
                              }
                              .card-header .title {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 12px;
                                letter-spacing: -0.3px;
                                color: #111827;
                                line-height: 1.1;
                              }
                              .card-header .subtitle {
                                font-size: 5px;
                                font-weight: 800;
                                color: #6b7280;
                                text-transform: uppercase;
                                letter-spacing: 0.4px;
                              }

                              .card-body {
                                display: flex;
                                gap: 3mm;
                                align-items: center;
                                margin-top: 2.5mm;
                                flex-grow: 1;
                              }

                              .photo-frame {
                                width: 13mm;
                                height: 16.5mm;
                                border-radius: 1.5mm;
                                overflow: hidden;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                flex-shrink: 0;
                              }

                              .details {
                                flex-grow: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                overflow: hidden;
                                text-align: left;
                              }
                              .details .name {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 800;
                                font-size: 10px;
                                color: #1f2937;
                                margin-bottom: 1px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                              }
                              .details .badge-role {
                                align-self: flex-start;
                                font-size: 5px;
                                font-weight: 900;
                                padding: 0.5px 3px;
                                border-radius: 3px;
                                letter-spacing: 0.5px;
                                margin-bottom: 1.5mm;
                              }
                              
                              .data-table {
                                width: 100%;
                                border-collapse: collapse;
                              }
                              .data-table td {
                                font-size: 5.2px;
                                color: #4b5563;
                                padding: 0.2mm 0;
                                line-height: 1;
                              }
                              .data-table td strong {
                                color: #374151;
                                font-weight: 900;
                              }

                              /* BACK CARD */
                              .card.CR80.back {
                                background-color: #ffffff;
                              }
                              .back-body {
                                display: flex;
                                height: 100%;
                                align-items: center;
                                padding: 2mm 1mm;
                                box-sizing: border-box;
                                gap: 2.5mm;
                              }
                              .back-left {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                gap: 1mm;
                              }
                              .back-left .qr {
                                width: 16mm;
                                height: 16mm;
                                display: block;
                              }
                              .back-left .qr-sub {
                                font-family: "JetBrains Mono", monospace;
                                font-size: 3.5px;
                                color: #9ca3af;
                                text-transform: uppercase;
                                font-weight: 700;
                              }

                              .back-right {
                                flex-grow: 1;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                border-left: 0.5px dashed #d1d5db;
                                padding-left: 2.5mm;
                                text-align: left;
                              }
                              .back-right .section-title {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 8px;
                                color: #111827;
                              }
                              .back-right .rules {
                                font-size: 4.5px;
                                color: #4b5563;
                                line-height: 1.2;
                                font-weight: 500;
                              }
                              
                              .signature-line {
                                align-self: flex-start;
                                border-top: 0.5px solid #9ca3af;
                                width: 65%;
                                margin-top: 2mm;
                                padding-top: 0.3mm;
                              }
                              .sig-title {
                                font-size: 3.5px;
                                color: #6b7280;
                                font-weight: bold;
                                text-transform: uppercase;
                              }

                              .meta-info {
                                font-size: 4.2px;
                                color: #9ca3af;
                                font-weight: bold;
                              }

                              /* Event Badge: 3in x 4in -> 76.2mm x 101.6mm */
                              .badge-card {
                                width: 76.2mm;
                                height: 101.6mm;
                                min-width: 76.2mm;
                                min-height: 101.6mm;
                                background: #ffffff;
                                border-radius: 4mm;
                                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                                box-sizing: border-box;
                                overflow: hidden;
                                border: 1px solid #e5e7eb;
                                position: relative;
                              }
                              .badge-inner {
                                padding: 4.5mm;
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: space-between;
                                box-sizing: border-box;
                                position: relative;
                              }
                              
                              .lanyard-hole {
                                width: 12mm;
                                height: 2.5mm;
                                border-radius: 1.2mm;
                                border: 1px solid #e5e7eb;
                                background-color: #f3f4f6;
                                position: absolute;
                                top: 1.5mm;
                                left: 50%;
                                transform: translateX(-50%);
                              }

                              .badge-header {
                                text-align: center;
                                margin-top: 3.5mm;
                              }
                              
                              .badge-avatar-container {
                                margin-top: 1mm;
                              }
                              
                              .badge-photo {
                                width: 20mm;
                                height: 23mm;
                                border-radius: 2mm;
                                overflow: hidden;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                              }
                              
                              .badge-desc {
                                text-align: center;
                                width: 100%;
                                flex-grow: 1;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                              }
                              
                              .badge-pname {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 13px;
                                color: #111827;
                                line-height: 1.1;
                                margin-bottom: 1mm;
                              }
                              
                              .badge-prole {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 7.5px;
                                padding: 1px 5mm;
                                border-radius: 4px;
                                letter-spacing: 0.5px;
                                margin-bottom: 1mm;
                                display: inline-block;
                              }
                              
                              .badge-org {
                                font-size: 7px;
                                font-weight: 800;
                                text-transform: uppercase;
                              }

                              .badge-footer {
                                display: flex;
                                width: 100%;
                                justify-content: space-between;
                                align-items: center;
                                border-top: 0.5px solid #f3f4f6;
                                padding-top: 2mm;
                              }
                              
                              .badge-footer-left {
                                display: flex;
                                flex-direction: column;
                                text-align: left;
                              }
                              .footer-label {
                                font-size: 5px;
                                color: #9ca3af;
                                font-weight: bold;
                                text-transform: uppercase;
                              }
                              .footer-val {
                                font-size: 7px;
                                font-weight: 900;
                                color: #374151;
                              }
                              
                              .badge-qr {
                                width: 13mm;
                                height: 13mm;
                                display: block;
                              }

                              @media print {
                                body {
                                  background: #ffffff;
                                  padding: 0;
                                  min-height: auto;
                                }
                                .no-print-bar {
                                  display: none !important;
                                }
                                .print-cards-container {
                                  margin-top: 0;
                                  display: flex;
                                  gap: 20px;
                                  justify-content: center;
                                  page-break-inside: avoid;
                                }
                                .card.CR80, .badge-card {
                                  box-shadow: none !important;
                                  border: 1px solid #d1d5db !important;
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="no-print-bar">
                              <h3>📄 IMPRESSÃO DE CREDENCIAL</h3>
                              <button class="print-btn" onclick="window.print()">Imprimir Agora</button>
                            </div>
                            <div class="print-cards-container">
                              ${elementHtml}
                            </div>
                          </body>
                          </html>
                        `);

                        printWin.document.close();
                      }}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Printer size={16} /> Imprimir {activeCredentialTab === 'carteira' ? 'Carteira' : 'Crachá'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCredentialModalOpen(false);
                        setCredentialParticipant(null);
                      }}
                      className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
