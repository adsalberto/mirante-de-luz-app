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
  Check,
  FileText,
  Heart,
  Package,
  FileCheck,
  Eye,
  Award,
  DollarSign,
  AlertTriangle,
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
import { cn, formatRegistrationCode, formatDateBR } from "../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  CepField, 
  PhoneField, 
  CpfField, 
  RgField 
} from "../components/common/BrazilFormFields";
import { 
  validateCPF, 
  validatePhone, 
  validateRG,
  isValidCEPFormat 
} from "../utils/brazilValidation";

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
  const [scanSuccess, setScanSuccess] = useState(false); // scanner visual feedback trigger

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
                // Play simulated or real haptic vibration
                if (navigator.vibrate) {
                  try {
                    navigator.vibrate([100, 50, 100]);
                  } catch (vErr) {
                    console.log("Vibration ignored:", vErr);
                  }
                }

                setScanSuccess(true);

                // Stop scanner stream immediately to prevent duplicate triggers
                if (scannerInstance && scannerInstance.isScanning) {
                  scannerInstance.stop().then(() => {
                    setCameraActive(false);
                  }).catch(console.error);
                }

                setTimeout(() => {
                  setCredentialParticipant(matched);
                  setThemeColorPreset(matched.isWorker ? 'emerald' : 'indigo');
                  setCustomRole(matched.isWorker ? 'Trabalhador Voluntário' : 'Frequentador Assistido');
                  setCustomAccessLevel(matched.isWorker ? 'Geral / Multi-Setores' : 'Passe & Atendimento');
                  setCustomPhoto(null);
                  setPhotoScale(100);
                  setPhotoShiftX(0);
                  setPhotoShiftY(0);
                  setPhotoRotate(0);
                  setIsCredentialModalOpen(true);
                  setIsScanningQr(false);
                  setScanSuccess(false);
                }, 800);
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

  // Helper for accent-insensitive search
  const normalizeStr = (str: string) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Form State with Socio-demographic & Social Assistance fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    birthDate: "",
    gender: "Masculino",
    cep: "",
    address: "",
    neighborhood: "",
    city: "Salvador / BA",
    state: "BA",
    cpf: "",
    rg: "",
    maritalStatus: "Solteiro(a)",
    profession: "",
    vulnerabilityLevel: "Média" as 'Baixa' | 'Média' | 'Alta' | 'Extrema',
    foodSecurity: "Seguro" as 'Seguro' | 'Insegurança Leve' | 'Insegurança Moderada' | 'Grave',
    monthlyIncome: "" as string | number,
    familyMembersCount: 1 as string | number,
    socialNotes: "",
    lgpdConsent: false,
    bloodType: "",
    allergies: "",
    emergencyContact: "",
  });

  // Visão 360° Modal States
  const [selected360Participant, setSelected360Participant] = useState<Participant | null>(null);
  const [active360Tab, setActive360Tab] = useState<'dados' | 'prontuario' | 'frequencia' | 'social'>('dados');

  // Print Sheet States
  const [isPrintingFicha, setIsPrintingFicha] = useState(false);
  const [isPrintingLgpdTerm, setIsPrintingLgpdTerm] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

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
    const [p, q, w] = await Promise.all([
      dataService.getParticipants(),
      dataService.getQueue(),
      dataService.getWorkers(),
    ]);

    const workerAsParticipants: Participant[] = (w || []).map((wk) => ({
      id: wk.id,
      name: wk.name,
      birthDate: "",
      email: wk.email,
      phone: wk.phone || "",
      address: wk.address || "",
      cpf: wk.cpf,
      rg: wk.rg,
      neighborhood: wk.neighborhood,
      city: wk.city,
      profession: wk.profession,
      lgpdConsent: wk.lgpdConsent || false,
      lgpdDate: wk.lgpdDate || wk.createdAt || Date.now(),
      registrationDate: wk.createdAt || Date.now(),
      currentStatus: wk.active ? "COMPLETED" : "IDLE",
      photoUrl: wk.photoUrl,
      isWorker: true,
      bloodType: wk.bloodType,
      allergies: wk.allergies,
      emergencyContact: wk.emergencyContact,
      observation: wk.observation,
    }));

    const combinedMap = new Map<string, Participant>();
    (p || []).forEach((item) => combinedMap.set(item.id, item));
    workerAsParticipants.forEach((item) => {
      if (!combinedMap.has(item.id)) {
        combinedMap.set(item.id, item);
      } else {
        const existing = combinedMap.get(item.id)!;
        combinedMap.set(item.id, {
          ...existing,
          isWorker: true,
          photoUrl: item.photoUrl || existing.photoUrl,
        });
      }
    });

    setParticipants(Array.from(combinedMap.values()));
    setActiveQueues(
      (q || []).filter(
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
      cep: p.cep || "",
      address: p.address || "",
      neighborhood: p.neighborhood || "",
      city: p.city || "Salvador / BA",
      state: p.state || "BA",
      cpf: p.cpf || "",
      rg: p.rg || "",
      maritalStatus: p.maritalStatus || "Solteiro(a)",
      profession: p.profession || "",
      vulnerabilityLevel: p.vulnerabilityLevel || "Média",
      foodSecurity: p.foodSecurity || "Seguro",
      monthlyIncome: p.monthlyIncome !== undefined ? p.monthlyIncome : "",
      familyMembersCount: p.familyMembersCount !== undefined ? p.familyMembersCount : 1,
      socialNotes: p.socialNotes || "",
      lgpdConsent: !!p.lgpdConsent,
      bloodType: p.bloodType || "",
      allergies: p.allergies || "",
      emergencyContact: p.emergencyContact || "",
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

    // Validação de Telefone / DDD
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.valid) {
        alert(`⚠️ Telefone inválido: ${phoneValidation.error}`);
        return;
      }
    }

    // Validação de CPF
    if (formData.cpf) {
      const cpfValidation = validateCPF(formData.cpf);
      if (!cpfValidation.valid) {
        alert(`⚠️ CPF inválido: ${cpfValidation.error}`);
        return;
      }

      const cleanCpf = formData.cpf.replace(/\D/g, "");
      const existingCpf = participants.find(
        (p) =>
          p.id !== editingParticipant?.id &&
          p.cpf &&
          p.cpf.replace(/\D/g, "") === cleanCpf
      );
      if (existingCpf) {
        alert(
          `⚠️ O CPF informado (${formData.cpf}) já está cadastrado no sistema para "${existingCpf.name}". Por favor, verifique para evitar duplicidades.`
        );
        return;
      }
    }

    // Validação de RG se preenchido
    if (formData.rg) {
      const rgValidation = validateRG(formData.rg);
      if (!rgValidation.valid) {
        alert(`⚠️ Documento de Identidade (RG) inválido: ${rgValidation.error}`);
        return;
      }
    }

    // Validação de CEP se preenchido
    if (formData.cep) {
      const cleanCep = formData.cep.replace(/\D/g, "");
      if (cleanCep.length > 0 && cleanCep.length !== 8) {
        alert("⚠️ CEP inválido: O CEP precisa ter exatamente 8 números.");
        return;
      }
    }

    // Duplicity warning by Name + Phone
    const normName = normalizeStr(formData.name);
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (normName && cleanPhone) {
      const existingDup = participants.find(
        (p) =>
          p.id !== editingParticipant?.id &&
          normalizeStr(p.name) === normName &&
          p.phone.replace(/\D/g, "") === cleanPhone
      );
      if (existingDup) {
        const confirmProceed = window.confirm(
          `⚠️ Já existe um atendido cadastrado com o nome "${existingDup.name}" e telefone "${existingDup.phone}".\n\nDeseja prosseguir com o salvamento mesmo assim?`
        );
        if (!confirmProceed) return;
      }
    }

    const payload = {
      ...formData,
      monthlyIncome: formData.monthlyIncome ? Number(formData.monthlyIncome) : 0,
      familyMembersCount: formData.familyMembersCount ? Number(formData.familyMembersCount) : 1,
    };

    try {
      if (editingParticipant) {
        await dataService.updateParticipant({
          ...editingParticipant,
          ...payload,
          isWorker: editingParticipant.isWorker,
        });
        alert(
          editingParticipant.isWorker
            ? "Dados do trabalhador atualizados com sucesso!"
            : "Dados do atendido atualizados com sucesso!",
        );
      } else {
        const created = await dataService.addParticipant({
          ...payload,
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
        cep: "",
        address: "",
        neighborhood: "",
        city: "Salvador / BA",
        state: "BA",
        cpf: "",
        rg: "",
        maritalStatus: "Solteiro(a)",
        profession: "",
        vulnerabilityLevel: "Média",
        foodSecurity: "Seguro",
        monthlyIncome: "",
        familyMembersCount: 1,
        socialNotes: "",
        lgpdConsent: false,
        bloodType: "",
        allergies: "",
        emergencyContact: "",
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
    const normSearch = normalizeStr(searchTerm);
    if (!normSearch) {
      if (activeTab === "workers") return p.isWorker === true;
      if (activeTab === "participants") return !p.isWorker;
      return true;
    }

    const formattedId = p.id ? formatRegistrationCode(p.id, p.registrationDate) : '';
    const matchesSearch =
      normalizeStr(p.name).includes(normSearch) ||
      normalizeStr(p.phone).includes(normSearch) ||
      normalizeStr(p.cpf || '').includes(normSearch) ||
      normalizeStr(p.rg || '').includes(normSearch) ||
      normalizeStr(p.neighborhood || '').includes(normSearch) ||
      normalizeStr(p.address || '').includes(normSearch) ||
      normalizeStr(p.id).includes(normSearch) ||
      normalizeStr(formattedId).includes(normSearch);

    if (!matchesSearch) return false;

    if (activeTab === "workers") {
      return p.isWorker === true;
    } else if (activeTab === "participants") {
      return !p.isWorker;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedParticipants = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
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
            {paginatedParticipants.length > 0 ? (
              paginatedParticipants.map((p) => (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelected360Participant(p);
                    setActive360Tab('dados');
                  }}
                  className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-indigo-100 shrink-0">
                        {(p.name || "?").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {p.cpf && (
                            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              CPF: {p.cpf}
                            </span>
                          )}
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
                                      ? "bg-emerald-50 text-emerald-650 border-emerald-100"
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
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                       <Phone size={14} className="text-gray-300 shrink-0" />
                       <span>{p.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-300 shrink-0" />
                      <span>Nascimento: {p.birthDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-300 shrink-0" />
                      <span className="truncate">{p.neighborhood ? `${p.neighborhood}, ${p.address}` : p.address}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-tight">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span>LGPD OK</span>
                      </div>
                      {p.vulnerabilityLevel && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border",
                          p.vulnerabilityLevel === "Extrema" ? "bg-red-50 text-red-600 border-red-200" :
                          p.vulnerabilityLevel === "Alta" ? "bg-amber-50 text-amber-600 border-amber-200" :
                          p.vulnerabilityLevel === "Média" ? "bg-blue-50 text-blue-600 border-blue-200" :
                          "bg-emerald-50 text-emerald-600 border-emerald-200"
                        )}>
                          Vuln: {p.vulnerabilityLevel}
                        </span>
                      )}
                    </div>

                    {/* Active Service Notification Area */}
                    {activeQueues.filter((q) => q.participantId === p.id)
                      .length > 0 && (
                      <div className="pt-2">
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700 text-[10px] font-black uppercase tracking-tighter">
                          <AlertCircle size={12} className="shrink-0" />
                          Atendimento:{" "}
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

                  {/* Actions Area - Structured separate footer to avoid margin overflow */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected360Participant(p);
                        setActive360Tab('dados');
                      }}
                      title="Abrir Visão 360°"
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-all"
                    >
                      <Eye size={14} />
                      <span>Visão 360°</span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      {currentUser?.role !== "RECEPCIONISTA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/atendimentos?participantId=${p.id}`);
                          }}
                          title="Abrir Prontuário"
                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <History size={16} />
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
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <ClipboardCheck size={16} />
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
                                className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <CreditCard size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(p);
                              }}
                              title="Editar Trabalhador"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className={cn(
                                "p-1.5 transition-all rounded-lg flex items-center gap-1",
                                deletingId === p.id
                                  ? "bg-red-500 text-white text-[10px] font-bold px-2 py-0.5"
                                  : "text-gray-400 hover:text-red-500",
                              )}
                            >
                              {deletingId === p.id ? (
                                "Confirma?"
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </div>
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
                    <PhoneField
                      id="participant-phone-field"
                      required
                      value={formData.phone}
                      onChange={(phone) => setFormData({ ...formData, phone })}
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

                  <div className="space-y-1.5">
                    <CpfField
                      id="participant-cpf-field"
                      value={formData.cpf}
                      onChange={(cpf) => setFormData({ ...formData, cpf })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <RgField
                      id="participant-rg-field"
                      value={formData.rg}
                      onChange={(rg) => setFormData({ ...formData, rg })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <CepField
                      id="participant-cep-field"
                      value={formData.cep}
                      onChange={(cep) => setFormData({ ...formData, cep })}
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Bairro
                    </label>
                    <input
                      value={formData.neighborhood}
                      onChange={(e) =>
                        setFormData({ ...formData, neighborhood: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Pau da Lima, Liberdade, etc."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Cidade / UF (Auto-preenchida pelo CEP)
                    </label>
                    <input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Salvador / BA"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Estado Civil
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) =>
                        setFormData({ ...formData, maritalStatus: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="União Estável">União Estável</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Profissão / Ocupação
                    </label>
                    <input
                      value={formData.profession}
                      onChange={(e) =>
                        setFormData({ ...formData, profession: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Autônomo, Aposentado, Estudante"
                    />
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
                      placeholder="Rua, Número, Complemento e CEP"
                    />
                  </div>

                  {/* Assistência Social section header */}
                  <div className="md:col-span-2 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                      <Heart size={14} /> Dados de Assistência Social & Vulnerabilidade
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Informações para auxílio social e acompanhamento familiar fraterno.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Nível de Vulnerabilidade Social
                    </label>
                    <select
                      value={formData.vulnerabilityLevel}
                      onChange={(e: any) =>
                        setFormData({ ...formData, vulnerabilityLevel: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-emerald-50/50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-emerald-200 focus:ring-2 focus:ring-emerald-600 outline-none transition-all font-bold text-emerald-900"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Extrema">Extrema (Prioridade Social)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Segurança Alimentar
                    </label>
                    <select
                      value={formData.foodSecurity}
                      onChange={(e: any) =>
                        setFormData({ ...formData, foodSecurity: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="Seguro">Seguro</option>
                      <option value="Insegurança Leve">Insegurança Leve</option>
                      <option value="Insegurança Moderada">Insegurança Moderada</option>
                      <option value="Grave">Insegurança Grave (Necessita Cesta)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Renda Familiar Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyIncome: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: 1412.00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      N° de Membros na Família
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.familyMembersCount}
                      onChange={(e) =>
                        setFormData({ ...formData, familyMembersCount: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Observações & Diagnóstico Social
                    </label>
                    <textarea
                      rows={2}
                      value={formData.socialNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, socialNotes: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none text-xs"
                      placeholder="Anotações sobre necessidades da família, visitas sociais ou distribuição de cestas."
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Tipo Sanguíneo
                    </label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodType: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                    >
                      <option value="">Não informado</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Contato de Emergência
                    </label>
                    <input
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContact: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Nome e Telefone"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Alergias / Restrições Médicas
                    </label>
                    <input
                      value={formData.allergies}
                      onChange={(e) =>
                        setFormData({ ...formData, allergies: e.target.value })
                      }
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                      placeholder="Ex: Alergia a Dipirona, Penicilina, rinite, etc."
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
              <motion.div 
                className="relative"
                animate={scanSuccess ? {
                  scale: [1, 0.98, 1.02, 0.98, 1.02, 1],
                  x: [0, -4, 4, -4, 4, -2, 2, 0],
                  y: [0, 2, -2, 2, -2, 1, -1, 0],
                  transition: { duration: 0.4 }
                } : {}}
              >
                <div 
                  id="page-qr-reader-viewport" 
                  className={cn(
                    "w-full aspect-square bg-slate-900 rounded-3xl overflow-hidden relative border-2 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center transition-all duration-300",
                    scanSuccess 
                      ? "border-emerald-500 ring-4 ring-emerald-500/20" 
                      : "border-dashed border-slate-700"
                  )}
                >
                  {!cameraActive && !cameraError && !scanSuccess && (
                    <div className="space-y-2 flex flex-col items-center">
                      <Camera size={36} className="text-indigo-500 animate-bounce" />
                      <p className="font-semibold text-slate-300">Inicializando câmera física...</p>
                    </div>
                  )}
                  {cameraError && !scanSuccess && (
                    <div className="space-y-2 flex flex-col items-center">
                      <AlertCircle size={36} className="text-amber-500" />
                      <p className="font-bold text-slate-300 px-4 leading-relaxed">{cameraError}</p>
                    </div>
                  )}
                </div>

                {/* Feedback Visual Imediato - Moldura Verde e Ícone de Match no Centro */}
                {scanSuccess && (
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl border-[6px] border-emerald-500 flex flex-col items-center justify-center z-20 pointer-events-none animate-pulse">
                    <div className="bg-emerald-600 text-white p-4 rounded-full shadow-xl flex items-center justify-center scale-110 transition-transform duration-300">
                      <Check size={32} className="stroke-[3]" />
                    </div>
                    <span className="mt-3 bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider px-3 py-1 rounded-full shadow-md">
                      Leitura Confirmada!
                    </span>
                  </div>
                )}

                {cameraActive && !scanSuccess && (
                  <span className="absolute top-4 right-4 bg-emerald-500 text-white font-black uppercase text-[9px] px-3 py-1 rounded-full animate-pulse shadow-md z-10 flex items-center gap-1">
                    ● Câmera Ativa
                  </span>
                )}
              </motion.div>

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
                        // Play simulated or real haptic vibration
                        if (navigator.vibrate) {
                          try {
                            navigator.vibrate([100, 50, 100]);
                          } catch (vErr) {
                            console.log("Vibration ignored:", vErr);
                          }
                        }

                        setScanSuccess(true);

                        setTimeout(() => {
                          setCredentialParticipant(matched);
                          setThemeColorPreset(matched.isWorker ? 'emerald' : 'indigo');
                          setCustomRole(matched.isWorker ? 'Trabalhador Voluntário' : 'Frequentador Assistido');
                          setCustomAccessLevel(matched.isWorker ? 'Geral / Multi-Setores' : 'Passe & Atendimento');
                          setCustomPhoto(null);
                          setPhotoScale(100);
                          setPhotoShiftX(0);
                          setPhotoShiftY(0);
                          setPhotoRotate(0);
                          setIsCredentialModalOpen(true);
                          setIsScanningQr(false);
                          setScanSuccess(false);
                          
                          // Reset simulator dropdown
                          e.target.value = "";
                        }, 800);
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
                           <div className="flex flex-wrap gap-1 pt-1.5">
                            {['Seminário CEMIL', 'Mocidade Espírita 2026', 'Congresso Espiritualidade', 'Oficinas de Passe', 'Palestra Doutrinária', 'Evangelização Infantil'].map(ev => (
                              <button
                                type="button"
                                key={ev}
                                onClick={() => {
                                  setCustomEventName(ev);
                                  if (ev === 'Seminário CEMIL') {
                                    setCustomEventDate('Julho / 2026');
                                  } else if (ev === 'Mocidade Espírita 2026') {
                                    setCustomEventDate('Outubro / 2026');
                                  } else {
                                    setCustomEventDate('Mensal / Geral');
                                  }
                                }}
                                className={cn(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer border",
                                  customEventName === ev 
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                    : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-800"
                                )}
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
                                <p><strong className="text-slate-800">REG:</strong> {formatRegistrationCode(credentialParticipant.id, credentialParticipant.registrationDate)}</p>
                                <p><strong className="text-slate-800">ADM:</strong> {formatDateBR(credentialParticipant.registrationDate || Date.now())}</p>
                                <p className="col-span-2"><strong className="text-slate-800">NASC:</strong> {formatDateBR(credentialParticipant.birthDate)}</p>
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
                              <p className="text-[7px] font-bold text-slate-750">Setor: {customAccessLevel}</p>
                              <div className="text-[6px] font-bold text-indigo-700 bg-indigo-50/70 p-1 rounded-lg border border-indigo-100/50 space-y-0.5 mt-1 leading-normal">
                                <p>🩸 <strong className="text-slate-800">TIPO SANGUÍNEO:</strong> {credentialParticipant.bloodType || 'N/I'}</p>
                                <p>⚠️ <strong className="text-slate-800">ALERGIAS:</strong> <span className={credentialParticipant.allergies ? "text-rose-600" : ""}>{credentialParticipant.allergies || 'Nenhuma informada'}</span></p>
                                <p>📞 <strong className="text-slate-800">EMERGÊNCIA:</strong> {credentialParticipant.emergencyContact || 'N/I'}</p>
                              </div>
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
                          <span className="text-[8px] font-bold text-slate-500 block">REGISTRO: {formatRegistrationCode(credentialParticipant.id, credentialParticipant.registrationDate)}</span>
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

                        const themeColor = '#0A2E5C';
                        const goldColor = '#CF9E22';
                        
                        const rDate = formatDateBR(credentialParticipant.registrationDate || Date.now());
                        const bDate = formatDateBR(credentialParticipant.birthDate);
                        const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${credentialParticipant.id}`);
                        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
                        
                        const transformStyle = `transform: scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg); transform-origin: center center;`;
                        const photoHtml = customPhoto 
                          ? `<img src="${customPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
                          : `<div style="width: 100%; height: 100%; background: #0A2E5C20; color: #0A2E5C; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(credentialParticipant.name || "U").charAt(0)}</div>`;

                        let elementHtml = '';

                        if (type === 'carteira') {
                          elementHtml = `
                            <!-- CARD FRENTE (CR80) -->
                            <div class="card CR80">
                              <div class="card-inner-split">
                                <!-- LEFT BLUE SIDEBAR -->
                                <div class="sidebar">
                                  <div class="logo-box">
                                    <svg width="44" height="48" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <g transform="translate(0, -10)">
                                        <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" stroke-linecap="round" />
                                        <circle cx="170" cy="115" r="7" fill="#E59A18" />
                                        <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="128" y1="93" x2="78" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="212" y1="93" x2="262" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="118" y1="115" x2="58" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="222" y1="115" x2="282" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="128" y1="137" x2="78" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                        <line x1="212" y1="137" x2="262" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      </g>
                                      <g transform="translate(0, -12)">
                                        <polygon points="80,165 215,165 235,193 60,193" fill="#FFFFFF" />
                                        <polygon points="40,197 240,197 260,225 20,225" fill="#FFFFFF" />
                                        <polygon points="25,229 265,229 285,257 5,257" fill="#FFFFFF" />
                                      </g>
                                      <g>
                                        <text x="170" y="298" text-anchor="middle" fill="#FFFFFF" font-size="15" font-weight="700" letter-spacing="5px" font-family="'Playfair Display', 'Georgia', serif">CENTRO ESPÍRITA</text>
                                        <text x="170" y="336" text-anchor="middle" fill="#E59A18" font-size="25" font-weight="900" letter-spacing="1px" font-family="'Playfair Display', 'Georgia', serif">MIRANTE DE LUZ</text>
                                      </g>
                                    </svg>
                                  </div>
                                  <div class="sidebar-text">
                                    <div class="card-title">CARTEIRA DE VOLUNTÁRIO</div>
                                    <div class="card-subtitle">Centro Espírita Mirante de Luz</div>
                                  </div>
                                </div>
                                
                                <!-- RIGHT CREAM PANEL -->
                                <div class="main-panel">
                                  <div class="photo-container-dual">
                                    <div class="photo-outer">
                                      <div class="photo-inner">
                                        ${photoHtml}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div class="name-display">${credentialParticipant.name}</div>
                                  
                                  <div class="role-pill">${customRole.toUpperCase()}</div>
                                  
                                  <div class="meta-bottom">
                                    <div class="meta-cell">
                                      <span class="meta-label">REGISTRO</span>
                                      <span class="meta-val">${formatRegistrationCode(credentialParticipant.id, credentialParticipant.registrationDate)}</span>
                                    </div>
                                    <div class="meta-cell">
                                      <span class="meta-label">NASCIMENTO</span>
                                      <span class="meta-val">${bDate}</span>
                                    </div>
                                    <div class="meta-cell">
                                      <span class="meta-label">ADMISSÃO</span>
                                      <span class="meta-val">${rDate}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- CARD VERSO (CR80) -->
                            <div class="card CR80 back border-sandwich">
                              <div class="top-stripe" style="background: #0A2E5C; height: 1.5mm; width: 100%;"></div>
                              <div class="back-body">
                                <div class="back-left-qr">
                                  <img src="${qrImg}" class="qr-print" />
                                  <div class="qr-sub-text">Check-in Portaria</div>
                                </div>
                                <div class="back-right-rules">
                                  <div class="rules-header" style="color: #0A2E5C; font-family: 'Space Grotesk', sans-serif; font-weight: 950; font-size: 8px; margin-bottom: 0.5mm;">Instruções Administrativas</div>
                                  <p class="rules-p" style="font-size: 4.5px; color: #4b5563; line-height: 1.2; margin: 0 0 1.5mm 0;">
                                    Esta credencial oficial identifica de forma unívoca o membro ou portador voluntário do CEMIL/Mirante de Luz, sendo de uso pessoal e intransferível. 
                                  </p>
                                  <div class="access-sectors" style="font-size: 4.5px; font-weight: bold; color: #CF9E22; margin-bottom: 0.8mm;">Autorização de Setor: ${customAccessLevel}</div>
                                  <div class="medical-info" style="font-size: 4.2px; margin: 0.8mm 0; border: 0.15mm solid #e5e7eb; background: #f8fafc; padding: 0.8mm; border-radius: 0.5mm; color: #0f172a; line-height: 1.25; font-family: 'Space Grotesk', sans-serif;">
                                    <div><strong>🩸 GRUPO SANGUÍNEO:</strong> ${credentialParticipant.bloodType || 'Não Informado'}</div>
                                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>⚠️ ALERGIAS:</strong> ${credentialParticipant.allergies || 'Nenhuma informada'}</div>
                                    <div><strong>📞 CONTATO DE EMERGÊNCIA:</strong> ${credentialParticipant.emergencyContact || 'Não Informado'}</div>
                                  </div>
                                  
                                  <div class="footer-meta" style="display: flex; justify-content: space-between; align-items: center; border-top: 0.2mm solid #e5e7eb; padding-top: 1mm; font-size: 4.8px; font-weight: bold; color: #9ca3af;">
                                    <div class="validity">VALIDADE: ${customExpiryDate}</div>
                                    <div class="cred-brand" style="color: #0A2E5C;">CEMIL CRED</div>
                                  </div>
                                </div>
                              </div>
                              <div class="bottom-stripe" style="background: #CF9E22; height: 1.5mm; width: 100%;"></div>
                            </div>
                          `;
                        } else {
                          elementHtml = `
                            <!-- BADGE EVENTO (3x4) -->
                            <div class="badge-card">
                              <div class="badge-inner-custom">
                                <!-- Top Header Block -->
                                <div class="badge-header-block" style="background: #0A2E5C; width: 100%; text-align: center; padding: 3mm 0; border-bottom: 1.2mm solid #CF9E22; box-sizing: border-box;">
                                  <div style="width: 26px; height: 26px; margin: 0 auto 0.5mm auto;">
                                    <svg width="26" height="26" viewBox="0 0 340 270" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" stroke-linecap="round" />
                                      <circle cx="170" cy="115" r="7" fill="#E59A18" />
                                      <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="128" y1="93" x2="78" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="212" y1="93" x2="262" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="118" y1="115" x2="58" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="222" y1="115" x2="282" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="128" y1="137" x2="78" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <line x1="212" y1="137" x2="262" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                                      <polygon points="80,165 215,165 235,193 60,193" fill="#FFFFFF" />
                                      <polygon points="40,197 240,197 260,225 20,225" fill="#FFFFFF" />
                                      <polygon points="25,229 265,229 285,257 5,257" fill="#FFFFFF" />
                                    </svg>
                                  </div>
                                  <div style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 900; color: #E59A18; letter-spacing: 0.5px; text-transform: uppercase;">
                                    ${customEventName}
                                  </div>
                                  <div style="font-size: 5px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9;">
                                    CREDENCIAÇÃO DE EVENTO
                                  </div>
                                </div>
                                
                                <div class="lanyard-hole-print"></div>

                                <!-- Main Body -->
                                <div class="badge-body" style="padding: 3mm 4mm; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; width: 100%; box-sizing: border-box;">
                                  <!-- Dual bordered photo frame -->
                                  <div class="photo-container-dual" style="margin-bottom: 2mm;">
                                    <div class="photo-outer">
                                      <div class="photo-inner" style="width: 17mm; height: 21mm;">
                                        ${photoHtml}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div class="badge-desc-custom" style="text-align: center; width: 100%;">
                                    <div class="name-display" style="font-size: 13px; margin-bottom: 1.2mm;">${credentialParticipant.name}</div>
                                    
                                    <div class="role-pill" style="margin-bottom: 1.2mm;">${customRole.toUpperCase()}</div>
                                    
                                    <div class="badge-org-custom" style="font-size: 6.5px; font-weight: bold; color: #4b5563; text-transform: uppercase;">
                                      Setor de Acesso: <span style="color: #0A2E5C;">${customAccessLevel}</span>
                                    </div>
                                  </div>
                                </div>

                                <!-- Footer Section -->
                                <div class="badge-footer-custom" style="width: 100%; background: #ffffff; border-top: 0.2mm solid #e5e7eb; padding: 2.2mm 4mm; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                                  <div style="text-align: left; display: flex; flex-direction: column; gap: 0.3mm;">
                                    <div style="font-size: 4px; color: #9ca3af; font-weight: 900; text-transform: uppercase;">DATA / PERÍODO</div>
                                    <div style="font-size: 6.8px; font-weight: 900; color: #1f2937;">${customEventDate}</div>
                                    <div style="font-size: 5px; font-weight: bold; color: #0A2E5C;">REGISTRO: ${formatRegistrationCode(credentialParticipant.id, credentialParticipant.registrationDate)}</div>
                                  </div>
                                  
                                  <div style="background: #ffffff; padding: 0.3mm; border: 0.2mm solid #e5e7eb; border-radius: 1mm; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <img src="${qrImg}" style="width: 10mm; height: 10mm; display: block;" />
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
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=Space+Grotesk:wght@500;700;900&family=JetBrains+Mono:wght@700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
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
                                background: #FBFBFA;
                                border-radius: 3.2mm; 
                                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
                                box-sizing: border-box;
                                overflow: hidden;
                                position: relative;
                                border: 0.3mm solid #e5e7eb;
                              }

                              .card-inner-split {
                                display: flex;
                                width: 100%;
                                height: 100%;
                                box-sizing: border-box;
                              }

                              /* Left Sidebar (Navy Blue) */
                              .sidebar {
                                width: 32%;
                                background: #0A2E5C;
                                padding: 3mm 1.5mm;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: space-between;
                                text-align: center;
                                box-sizing: border-box;
                                height: 100%;
                                border-right: 0.15mm solid rgba(10, 46, 92, 0.1);
                              }

                              .logo-box {
                                width: 10mm;
                                height: 10mm;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin-bottom: 0px;
                              }

                              .sidebar-text {
                                width: 100%;
                              }
                              
                              .card-title {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 5.2px;
                                color: #E59A18;
                                line-height: 1.2;
                                word-wrap: break-word;
                                letter-spacing: 0.3px;
                                text-transform: uppercase;
                                margin-bottom: 0.3mm;
                              }
                              
                              .card-subtitle {
                                font-size: 3.8px;
                                font-weight: 800;
                                color: #cbd5e1;
                                text-transform: uppercase;
                                letter-spacing: 0.1px;
                                line-height: 1.1;
                              }

                              /* Right Main Panel */
                              .main-panel {
                                flex-grow: 1;
                                padding: 2.5mm 3.5mm;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: space-between;
                                box-sizing: border-box;
                                height: 100%;
                                background-color: #FBFBFA;
                                position: relative;
                              }

                              /* Dual-border golden-navy photoframe */
                              .photo-container-dual {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                              }
                              
                              .photo-outer {
                                padding: 0.4mm;
                                background-color: #CF9E22;
                                border-radius: 1.5mm;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                              }

                              .photo-inner {
                                padding: 0.3mm;
                                background-color: #0A2E5C;
                                border-radius: 1.1mm;
                                width: 12.2mm;
                                height: 15.6mm;
                                overflow: hidden;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 1.5px 3px rgba(0,0,0,0.05);
                              }

                              .name-display {
                                font-family: "Space Grotesk", sans-serif;
                                font-weight: 900;
                                font-size: 11px;
                                color: #0A2E5C;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                width: 100%;
                                text-align: center;
                                line-height: 1.1;
                                margin-top: 0.2mm;
                                letter-spacing: -0.2px;
                              }

                              .role-pill {
                                display: inline-block;
                                background-color: #CF9E22;
                                color: #ffffff;
                                font-size: 6.2px;
                                font-weight: 900;
                                padding: 0.6px 3.5mm;
                                border-radius: 0.6mm;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                line-height: 1;
                                box-shadow: 0 1px 2px rgba(207, 158, 34, 0.15);
                              }

                              /* Grid lower table metadata */
                              .meta-bottom {
                                width: 100%;
                                display: flex;
                                border: 0.15mm solid rgba(10, 46, 92, 0.18);
                                border-radius: 0.8mm;
                                overflow: hidden;
                                background-color: #ffffff;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                              }

                              .meta-cell {
                                flex: 1;
                                text-align: center;
                                padding: 0.8mm 0.2mm;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                box-sizing: border-box;
                              }

                              .meta-cell:not(:last-child) {
                                border-right: 0.15mm solid rgba(10, 46, 92, 0.18);
                              }

                              .meta-label {
                                font-size: 3.5px;
                                color: #9ca3af;
                                font-weight: 900;
                                margin-bottom: 0.3mm;
                                line-height: 1;
                                letter-spacing: 0.2px;
                              }

                              .meta-val {
                                font-size: 5.2px;
                                color: #1f2937;
                                font-weight: 900;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                line-height: 1;
                              }

                              /* BACK CARD STYLE */
                              .card.CR80.back {
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                              }
                              
                              .back-body {
                                display: flex;
                                flex-grow: 1;
                                align-items: center;
                                padding: 3mm 4mm;
                                box-sizing: border-box;
                                gap: 3.5mm;
                              }

                              .back-left-qr {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                background-color: #ffffff;
                                border: 0.2mm solid #e5e7eb;
                                padding: 1.5mm;
                                border-radius: 2mm;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                              }
                              
                              .qr-print {
                                width: 13mm;
                                height: 13mm;
                                display: block;
                              }
                              
                              .qr-sub-text {
                                font-family: "JetBrains Mono", monospace;
                                font-size: 3.2px;
                                color: #9ca3af;
                                text-transform: uppercase;
                                font-weight: 700;
                                margin-top: 0.8mm;
                              }

                              .back-right-rules {
                                flex-grow: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                height: 100%;
                                text-align: left;
                              }

                              /* Event Badge 3"x4" (76.2mm x 101.6mm) */
                              .badge-card {
                                width: 76.2mm;
                                height: 101.6mm;
                                min-width: 76.2mm;
                                min-height: 101.6mm;
                                background: #FBFBFA;
                                border-radius: 4mm;
                                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                                box-sizing: border-box;
                                overflow: hidden;
                                border: 0.3mm solid #e5e7eb;
                                position: relative;
                              }

                              .badge-inner-custom {
                                height: 100%;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                align-items: center;
                                box-sizing: border-box;
                                position: relative;
                              }

                              .lanyard-hole-print {
                                width: 12mm;
                                height: 2.8mm;
                                border-radius: 1.4mm;
                                border: 0.2mm solid #e5e7eb;
                                background-color: #f3f4f6;
                                position: absolute;
                                top: 11.5mm;
                                left: 50%;
                                transform: translateX(-50%);
                                z-index: 10;
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

        {/* Visão 360° do Atendido Modal */}
        {selected360Participant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected360Participant(null)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden shadow-indigo-900/20 flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl font-black text-amber-400 shrink-0">
                      {(selected360Participant.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950 font-black text-[10px] uppercase tracking-wider">
                          Prontuário 360°
                        </span>
                        <span className="text-xs font-mono text-indigo-200">
                          {formatRegistrationCode(selected360Participant.id, selected360Participant.registrationDate)}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white mt-1 leading-tight">
                        {selected360Participant.name}
                      </h2>
                      <p className="text-xs text-indigo-200 font-medium flex items-center gap-2 mt-1">
                        <span>{selected360Participant.phone}</span>
                        <span>•</span>
                        <span>Nasc: {formatDateBR(selected360Participant.birthDate)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected360Participant(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs Header */}
                <div className="flex items-center gap-2 mt-6 overflow-x-auto custom-scrollbar pt-2 border-t border-white/10">
                  <button
                    onClick={() => setActive360Tab('dados')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                      active360Tab === 'dados'
                        ? "bg-white text-indigo-950 shadow-md"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
                    )}
                  >
                    <FileText size={14} /> Dados Cadastrais
                  </button>
                  <button
                    onClick={() => setActive360Tab('prontuario')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                      active360Tab === 'prontuario'
                        ? "bg-white text-indigo-950 shadow-md"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
                    )}
                  >
                    <History size={14} /> Prontuário ({evolutions.filter(e => e.participantId === selected360Participant.id).length})
                  </button>
                  <button
                    onClick={() => setActive360Tab('frequencia')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                      active360Tab === 'frequencia'
                        ? "bg-white text-indigo-950 shadow-md"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
                    )}
                  >
                    <Clock size={14} /> Frequência / Filas
                  </button>
                  <button
                    onClick={() => setActive360Tab('social')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 shrink-0 cursor-pointer",
                      active360Tab === 'social'
                        ? "bg-white text-indigo-950 shadow-md"
                        : "bg-white/10 text-indigo-100 hover:bg-white/20"
                    )}
                  >
                    <Heart size={14} /> Ação Social & Cestas
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
                {active360Tab === 'dados' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">CPF</span>
                        <p className="font-mono font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.cpf || "Não informado"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">RG</span>
                        <p className="font-mono font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.rg || "Não informado"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Estado Civil</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.maritalStatus || "Solteiro(a)"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Profissão</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.profession || "Não informada"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Bairro / Cidade</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.neighborhood || "N/I"} - {selected360Participant.city || "Salvador/BA"}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contato Emergência</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{selected360Participant.emergencyContact || "Não cadastrado"}</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Endereço Residencial Completo</span>
                      <p className="text-sm font-semibold text-gray-800">{selected360Participant.address}</p>
                    </div>

                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
                        <div>
                          <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Consentimento LGPD Ativo</p>
                          <p className="text-[11px] text-emerald-700/80 font-medium">
                            Registrado em {selected360Participant.lgpdDate ? format(selected360Participant.lgpdDate, "dd/MM/yyyy HH:mm") : "Data de cadastro"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const printWin = window.open("", "_blank");
                          if (!printWin) return;
                          printWin.document.write(`
                            <html>
                              <head>
                                <title>TERMO LGPD - ${selected360Participant.name}</title>
                                <style>
                                  body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
                                  h2 { text-align: center; color: #0A2E5C; }
                                  .box { border: 1px solid #ccc; padding: 20px; border-radius: 8px; margin-top: 20px; }
                                  .sig { margin-top: 60px; text-align: center; border-top: 1px solid #000; width: 300px; margin-left: auto; margin-right: auto; padding-top: 5px; }
                                </style>
                              </head>
                              <body>
                                <h2>CENTRO ESPÍRITA MIRANTE DE LUZ</h2>
                                <h3 style="text-align: center;">TERMO DE CONSENTIMENTO - LGPD</h3>
                                <div class="box">
                                  <p>Eu, <strong>${selected360Participant.name}</strong>, portador(a) do CPF/RG <strong>${selected360Participant.cpf || selected360Participant.rg || 'N/A'}</strong>, autorizo expressamente o Centro Espírita Mirante de Luz a efetuar o tratamento de meus dados pessoais e dados sensíveis de acompanhamento espiritual/fraterno para fins institucionais e de atendimento fraterno.</p>
                                  <p>Este consentimento segue os ditames da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
                                </div>
                                <div style="margin-top: 40px;">
                                  <p>Salvador/BA, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                </div>
                                <div class="sig">
                                  ${selected360Participant.name}<br/>Assinatura do Atendido / Responsável
                                </div>
                                <script>window.onload = function() { window.print(); }</script>
                              </body>
                            </html>
                          `);
                          printWin.document.close();
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <Printer size={14} /> Imprimir Termo LGPD
                      </button>
                    </div>
                  </div>
                )}

                {active360Tab === 'prontuario' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">Histórico de Atendimentos Fraternos</h3>
                      {currentUser?.role !== "RECEPCIONISTA" && (
                        <button
                          onClick={() => navigate(`/atendimentos?participantId=${selected360Participant.id}`)}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                        >
                          <History size={14} /> Novo Registro / Prontuário
                        </button>
                      )}
                    </div>

                    {evolutions.filter(e => e.participantId === selected360Participant.id).length > 0 ? (
                      <div className="space-y-3">
                        {evolutions.filter(e => e.participantId === selected360Participant.id).map(evo => (
                          <div key={evo.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                Data: {format(evo.date, "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                              {evo.encaminhamento && (
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                  Encaminhado: {evo.encaminhamento}
                                </span>
                              )}
                            </div>
                            {evo.notesEncrypted && (
                              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl italic">
                                "{evo.notesEncrypted}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
                        <History className="mx-auto text-gray-300" size={32} />
                        <p className="text-xs font-bold text-gray-500">Nenhum registro no prontuário ainda.</p>
                      </div>
                    )}
                  </div>
                )}

                {active360Tab === 'frequencia' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">Passagens e Entrada em Filas</h3>
                    {activeQueues.filter(q => q.participantId === selected360Participant.id).length > 0 ? (
                      <div className="space-y-2">
                        {activeQueues.filter(q => q.participantId === selected360Participant.id).map(q => {
                          const s = sectors.find(sec => sec.id === q.sectorId);
                          return (
                            <div key={q.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-xs text-amber-900">{s?.name || "Setor"}</p>
                                <p className="text-[10px] text-amber-700">Chegada: {format(q.joinedAt, "dd/MM/yyyy HH:mm")}</p>
                              </div>
                              <span className="px-2.5 py-1 bg-amber-200/60 text-amber-900 font-black text-[10px] rounded-lg uppercase">
                                Em Espera ({q.priority ? "Prioritário" : "Normal"})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
                        <Clock className="mx-auto text-gray-300" size={32} />
                        <p className="text-xs font-bold text-gray-500">Atendido livre (não está em nenhuma fila ativa no momento).</p>
                      </div>
                    )}
                  </div>
                )}

                {active360Tab === 'social' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vulnerabilidade Social</span>
                        <div>
                          <span className={cn(
                            "px-3 py-1 rounded-xl font-black text-xs uppercase border inline-block",
                            selected360Participant.vulnerabilityLevel === "Extrema" ? "bg-red-50 text-red-600 border-red-200" :
                            selected360Participant.vulnerabilityLevel === "Alta" ? "bg-amber-50 text-amber-600 border-amber-200" :
                            selected360Participant.vulnerabilityLevel === "Média" ? "bg-blue-50 text-blue-600 border-blue-200" :
                            "bg-emerald-50 text-emerald-600 border-emerald-200"
                          )}>
                            {selected360Participant.vulnerabilityLevel || "Média"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Segurança Alimentar</span>
                        <p className="font-bold text-gray-900 text-sm">{selected360Participant.foodSecurity || "Seguro"}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Renda Familiar Mensal</span>
                        <p className="font-bold text-gray-900 text-sm">
                          {selected360Participant.monthlyIncome ? `R$ ${Number(selected360Participant.monthlyIncome).toFixed(2)}` : "Não informada"}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Membros da Família</span>
                        <p className="font-bold text-gray-900 text-sm">{selected360Participant.familyMembersCount || 1} pessoa(s)</p>
                      </div>
                    </div>

                    {selected360Participant.socialNotes && (
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Diagnóstico e Notas do Serviço Social</span>
                        <p className="text-xs text-gray-700 leading-relaxed">{selected360Participant.socialNotes}</p>
                      </div>
                    )}

                    {/* Food Basket Delivery Module */}
                    <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                            <Package size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-base">Cestas Básicas Entregues</h4>
                            <p className="text-xs text-emerald-800 font-medium">
                              Histórico de auxílio de mantimentos ao atendido.
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-950">{selected360Participant.foodBasketsCount || 0}</span>
                          <span className="text-[10px] font-bold text-emerald-800 block uppercase">Entregas</span>
                        </div>
                      </div>

                      {selected360Participant.lastFoodBasketDate && (
                        <p className="text-xs text-emerald-900 font-bold bg-white/60 p-3 rounded-xl border border-emerald-100">
                          📅 Última cesta entregue em: {format(selected360Participant.lastFoodBasketDate, "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      )}

                      <button
                        onClick={async () => {
                          try {
                            const updatedCount = (selected360Participant.foodBasketsCount || 0) + 1;
                            const updatedDate = Date.now();
                            const updatedPart = {
                              ...selected360Participant,
                              foodBasketsCount: updatedCount,
                              lastFoodBasketDate: updatedDate,
                            };
                            await dataService.updateParticipant(updatedPart);
                            setSelected360Participant(updatedPart);
                            await loadParticipants();
                            alert(`Cesta Básica registrada com sucesso! Total de cestas entregues: ${updatedCount}`);
                          } catch (err) {
                            console.error("Erro ao registrar cesta básica:", err);
                            alert("Erro ao registrar entrega de cesta básica.");
                          }
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Package size={18} />
                        <span>Registrar Entrega de Cesta Básica Hoje</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => {
                    handleEdit(selected360Participant);
                    setSelected360Participant(null);
                  }}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  <Pencil size={14} /> Editar Cadastro
                </button>
                <button
                  onClick={() => setSelected360Participant(null)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
