import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  QrCode, 
  X, 
  Camera, 
  AlertCircle, 
  Sparkles, 
  Contact, 
  Upload, 
  Search, 
  Check, 
  Printer, 
  User, 
  Users, 
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  Layers,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cn, formatRegistrationCode, formatDateBR } from '../lib/utils';
import { CemilLogo } from '../components/CemilLogo';
import { dataService } from '../services/dataService';
import { Participant, Sector } from '../types';

export default function CredentialsPage() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // QR Code camera scanner states
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Selected participant for credentials generator
  const [selectedMember, setSelectedMember] = useState<Participant | null>(null);

  // Customize states
  const [activeCredentialTab, setActiveCredentialTab] = useState<'carteira' | 'cracha'>('carteira');
  const [themeColorPreset, setThemeColorPreset] = useState<'emerald' | 'indigo' | 'amber' | 'rose'>('indigo');
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern'>('classic');
  const [customRole, setCustomRole] = useState('');
  const [customAccessLevel, setCustomAccessLevel] = useState('');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  
  // Photo alignment and zoom edit states
  const [photoScale, setPhotoScale] = useState(100); // percentage (100 to 300)
  const [photoShiftX, setPhotoShiftX] = useState(0);  // pixels (-60 to 60)
  const [photoShiftY, setPhotoShiftY] = useState(0);  // pixels (-60 to 60)
  const [photoRotate, setPhotoRotate] = useState(0);  // degrees (-180 to 180)

  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [customEventName, setCustomEventName] = useState('Seminário CEMIL');
  const [customEventDate, setCustomEventDate] = useState('Julho / 2026');

  // NEW: Card side toggle (frente / verso)
  const [cardSide, setCardSide] = useState<'frente' | 'verso'>('frente');

  // NEW: Direct In-Page Print Sheet modal state (Bypasses popup blocker & includes Crop Marks)
  const [isDirectPrintOpen, setIsDirectPrintOpen] = useState(false);

  // NEW: Camera QR Scanner Action Modal for instant attendance check-in
  const [scannedParticipantModal, setScannedParticipantModal] = useState<Participant | null>(null);
  const [checkInSuccessMessage, setCheckInSuccessMessage] = useState<string | null>(null);

  // Print Queue States for batch printing
  const [printQueue, setPrintQueue] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('cemil-print-queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cemil-print-queue', JSON.stringify(printQueue));
  }, [printQueue]);

  useEffect(() => {
    loadData();
    // Set default expiry date to 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setCustomExpiryDate(nextYear.toLocaleDateString('pt-BR'));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersList, sectorsList, workersList, queueList] = await Promise.all([
        dataService.getParticipants(),
        dataService.getSectors(),
        dataService.getWorkers(),
        dataService.getPrintQueue()
      ]);

      if (queueList && Array.isArray(queueList) && queueList.length > 0) {
        setPrintQueue(queueList);
      }

      const pList: Participant[] = [...(membersList || [])];
      
      if (workersList && Array.isArray(workersList)) {
        workersList.forEach((w: any) => {
          // Match by id, or case-insensitive matching name for duplicate prevention
          const existingIndex = pList.findIndex(p => p.id === w.id || (p.name.toLowerCase() === w.name.toLowerCase() && p.isWorker));
          
          const mappedWorker: Participant = {
            id: w.id || `worker-${w.email || w.name}`,
            name: w.name,
            email: w.email || undefined,
            phone: w.phone || '',
            birthDate: '',
            address: w.observation || '',
            lgpdConsent: w.lgpdConsent || false,
            lgpdDate: w.lgpdDate || w.createdAt || Date.now(),
            registrationDate: w.createdAt || Date.now(),
            currentStatus: 'IDLE',
            photoUrl: w.photoUrl || undefined,
            isWorker: true,
            bloodType: w.bloodType || '',
            allergies: w.allergies || '',
            emergencyContact: w.emergencyContact || '',
          };

          if (existingIndex > -1) {
            const existing = pList[existingIndex];
            pList[existingIndex] = {
              ...existing,
              isWorker: true,
              photoUrl: mappedWorker.photoUrl || existing.photoUrl,
              phone: mappedWorker.phone || existing.phone,
              email: mappedWorker.email || existing.email,
              bloodType: existing.bloodType || mappedWorker.bloodType,
              allergies: existing.allergies || mappedWorker.allergies,
              emergencyContact: existing.emergencyContact || mappedWorker.emergencyContact,
            };
          } else {
            pList.push(mappedWorker);
          }
        });
      }

      setParticipants(pList);
      setSectors(sectorsList || []);
    } catch (err) {
      console.error("Error loading credentials page database:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTab = (tab: 'carteira' | 'cracha') => {
    if (tab === 'carteira' && selectedMember && !selectedMember.isWorker) {
      alert("⚠️ A Carteira de Voluntário (CR80) é exclusiva para Membros da Equipe da Casa. Para gerá-la, por favor selecione um voluntário ativo.");
      setSelectedMember(null);
    }
    setActiveCredentialTab(tab);
  };

  // QR Code camera controller loop
  useEffect(() => {
    let scannerInstance: Html5Qrcode | null = null;

    if (isScanningQr) {
      setCameraError(null);
      setCameraActive(false);

      const timeout = setTimeout(() => {
        try {
          const container = document.getElementById("credentials-qr-reader-viewport");
          if (!container) return;

          scannerInstance = new Html5Qrcode("credentials-qr-reader-viewport");
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
                setScannedParticipantModal(matched);
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
            setCameraError("Acesso à câmera negado ou indisponível. Utilize a busca manual abaixo ou habilite permissões de câmera.");
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
  }, [isScanningQr, participants, activeCredentialTab]);

  const handleSelectMember = (member: Participant) => {
    setSelectedMember(member);

    // Auto sector/role theme color detection
    const roleOrSector = ((member.isWorker ? 'Trabalhador Voluntário' : 'Participante / Assistido') + ' ' + (member.address || '')).toLowerCase();
    if (roleOrSector.includes('fraterno') || roleOrSector.includes('doutrinária') || roleOrSector.includes('estudo')) {
      setThemeColorPreset('indigo');
    } else if (roleOrSector.includes('passe') || roleOrSector.includes('fluido') || roleOrSector.includes('saúde')) {
      setThemeColorPreset('emerald');
    } else if (roleOrSector.includes('mocidade') || roleOrSector.includes('evangelização') || roleOrSector.includes('infantil')) {
      setThemeColorPreset('amber');
    } else if (roleOrSector.includes('evento') || roleOrSector.includes('comunicação') || roleOrSector.includes('festa')) {
      setThemeColorPreset('rose');
    } else {
      setThemeColorPreset(member.isWorker ? 'indigo' : 'emerald');
    }

    setCustomRole(member.isWorker ? 'Trabalhador Voluntário' : 'Participante / Assistido');
    setCustomAccessLevel(member.isWorker ? 'Geral / Multi-Setores' : 'Acesso Geral');
    setCustomPhoto(member.photoUrl || null);
    setPhotoScale(100);
    setPhotoShiftX(0);
    setPhotoShiftY(0);
    setPhotoRotate(0);
    setCardSide('frente');
  };

  // Filter list of participants/workers depending on active credential tab:
  // Carteira: members with isWorker === true only (Equipe da Casa)
  // Crachá: all participants/sectors (isWorker or not)
  const filteredParticipants = participants.filter(p => {
    if (activeCredentialTab === 'carteira' && !p.isWorker) {
      return false;
    }
    const formattedId = p.id ? formatRegistrationCode(p.id, p.registrationDate).toLowerCase() : '';
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (p.id && String(p.id).toLowerCase().includes(searchQuery.toLowerCase())) ||
           formattedId.includes(searchQuery.toLowerCase()) ||
           (p.phone && p.phone.includes(searchQuery));
  });

  const handlePrint = () => {
    if (!selectedMember) return;

    const type = activeCredentialTab;
    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Por favor, permita pop-ups para que o sistema de impressão integrada funcione.");
      return;
    }

    const themeColor = '#0A2E5C';
    const goldColor = '#CF9E22';
    
    const rDate = formatDateBR(selectedMember.registrationDate || Date.now());
    const bDate = formatDateBR(selectedMember.birthDate);
    const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${selectedMember.id}`);
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
    
    const transformStyle = `transform: scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg); transform-origin: center center;`;
    const photoHtml = customPhoto 
      ? `<img src="${customPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
      : `<div style="width: 100%; height: 100%; background: #0A2E5C20; color: #0A2E5C; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(selectedMember.name || "U").charAt(0)}</div>`;

    let elementHtml = '';
    const bloodType = selectedMember.bloodType || '';
    const allergies = selectedMember.allergies || '';
    const emergencyContact = selectedMember.emergencyContact || '';
    
    if (type === 'carteira') {
      if (selectedTemplate === 'modern') {
        const phone = selectedMember.phone || '-';
        const email = selectedMember.email || 'contato@mirantedeluz.org';
        const formattedCode = formatRegistrationCode(selectedMember.id, selectedMember.registrationDate);
        elementHtml = `
          <div class="print-cards-container">
            <!-- CARD FRENTE (PREMIUM WAVES VERTICAL) -->
            <div class="card CR80 vertical animate-fade-in">
              <div class="v-header-svg">
                <svg viewBox="0 0 540 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                  <path d="M0 0H540V120C540 120 400 200 270 190C140 180 0 210 0 210V0Z" fill="url(#blue-grad-print-singular)" />
                  <path d="M0 210C0 210 140 180 270 190C400 200 540 120 540 120V126C540 126 400 205 270 195C140 185 0 215 0 215V210Z" fill="#CF9E22" />
                  <defs>
                    <linearGradient id="blue-grad-print-singular" x1="0" y1="0" x2="540" y2="220" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#0A2E5C" />
                      <stop offset="1" stop-color="#1e40af" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div class="v-header-content">
                <div class="v-header-logo">
                  <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                    <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
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
                <div class="v-header-text">
                  <span class="v-header-org" style="font-size: 1.4mm; line-height: 1.1; font-weight: 700; letter-spacing: 0.15mm; display: block; color: rgba(255, 255, 255, 0.9);">CENTRO ESPÍRITA</span>
                  <span class="v-header-brand" style="font-size: 2.1mm; line-height: 1.1; font-weight: 900; color: #CF9E22; display: block;">MIRANTE DE LUZ</span>
                </div>
              </div>

              <div class="v-body-zone">
                <div class="v-photo-wrapper">
                  <div class="v-photo-inner">
                    ${photoHtml}
                  </div>
                </div>
                <div class="v-info-column">
                  <h4 class="v-name" style="font-size: 7.5px;">${selectedMember.name}</h4>
                  <p class="v-role" style="font-size: 5px; margin-top: 0.4mm;">${customRole.toUpperCase()}</p>
                </div>
              </div>

              <div class="v-meta-grid" style="padding: 1mm 3.2mm; gap: 0.8mm 1.5mm;">
                <div class="v-grid-cell">
                  <div class="v-grid-cell-icon" style="font-size: 5px;">👤</div>
                  <div class="v-cell-info">
                    <span class="v-cell-lbl">ID NO.</span>
                    <span class="v-cell-val" style="font-size: 4.5px;">${formattedCode}</span>
                  </div>
                </div>
                <div class="v-grid-cell">
                  <div class="v-grid-cell-icon" style="font-size: 5px;">📅</div>
                  <div class="v-cell-info">
                    <span class="v-cell-lbl">NASCIMENTO</span>
                    <span class="v-cell-val" style="font-size: 4.5px;">${bDate}</span>
                  </div>
                </div>
                <div class="v-grid-cell">
                  <div class="v-grid-cell-icon" style="font-size: 5px;">📞</div>
                  <div class="v-cell-info">
                    <span class="v-cell-lbl">TELEFONE</span>
                    <span class="v-cell-val" style="font-size: 4.5px;">${phone}</span>
                  </div>
                </div>
                <div class="v-grid-cell">
                  <div class="v-grid-cell-icon" style="font-size: 5px;">✉️</div>
                  <div class="v-cell-info">
                    <span class="v-cell-lbl">E-MAIL</span>
                    <span class="v-cell-val" style="font-size: 4px;">${email}</span>
                  </div>
                </div>
              </div>

              <div class="v-footer-zone" style="padding: 2mm 3.2mm 2.2mm 3.2mm; height: 18mm;">
                <div class="v-footer-wave">
                  <svg viewBox="0 0 540 150" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                    <path d="M0 150H220C220 150 150 90 80 100C0 110 0 150 0 150Z" fill="url(#blue-grad-bottom-printed-singular)" />
                    <path d="M0 150C0 150 0 110 80 100C150 90 220 150 220 150" stroke="#CF9E22" stroke-width="4" />
                    <defs>
                      <linearGradient id="blue-grad-bottom-printed-singular" x1="0" y1="150" x2="220" y2="90" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#0A2E5C" />
                        <stop offset="1" stop-color="#1A365D" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div class="v-sign-qr-row">
                  <div class="v-sign-col light">
                    <span class="v-sign-font" style="font-size: 8px; margin-bottom: -0.5mm;">Sign</span>
                    <div class="v-sign-line" style="width: 13mm; margin-bottom: 0.4mm;"></div>
                    <span class="v-sign-lbl" style="font-size: 3px;">ASSINATURA</span>
                  </div>
                  <div class="v-qr-box" style="padding: 0.5mm;">
                    <img src="${qrImg}" class="v-qr-img" style="width: 10.5mm; height: 10.5mm;" />
                  </div>
                </div>
              </div>
            </div>

            <!-- CARD VERSO (PREMIUM WAVES VERTICAL) -->
            <div class="card CR80 vertical animate-fade-in">
              <div class="v-back-header-svg">
                <svg viewBox="0 0 540 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                  <path d="M0 0H540V110C540 110 400 160 270 150C140 140 0 170 0 170V0Z" fill="url(#blue-grad-back-printed-singular)" />
                  <path d="M0 170C0 170 140 140 270 150C400 160 540 110 540 110V115C540 115 400 165 270 155C140 145 0 175 0 175V170Z" fill="#CF9E22" />
                  <defs>
                    <linearGradient id="blue-grad-back-printed-singular" x1="0" y1="0" x2="540" y2="180" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#0A2E5C" />
                      <stop offset="1" stop-color="#1e40af" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div class="v-back-header-content" style="padding: 2.2mm 3.2mm;">
                <div class="v-back-logo" style="width: 6.5mm; height: 7mm;">
                  <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                    <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
                    <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                    <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                    <line x1="118" y1="115" x2="58" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                    <line x1="222" y1="115" x2="282" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                    <polygon points="80,165 215,165 235,193 60,193" fill="#FFFFFF" />
                  </svg>
                </div>
                <div class="v-back-title">
                  <span class="v-back-title-line" style="font-size: 4.5px;">TERMOS E</span>
                  <span class="v-back-title-line gold" style="font-size: 4.5px;">CONDIÇÕES</span>
                </div>
              </div>

              <div class="v-terms-box" style="margin-top: 10.5mm; gap: 1.5mm;">
                <div class="v-term-item" style="gap: 1.2mm;">
                  <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                  <p class="v-term-p" style="font-size: 3.8px;">O uso desta credencial é obrigatório para identificação e controle de acesso no Mirante de Luz.</p>
                </div>
                <div class="v-term-item" style="gap: 1.2mm;">
                  <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                  <p class="v-term-p" style="font-size: 3.8px;">Identifica voluntário ativo e autoriza circulação nos setores de acesso: <strong style="color: #0A2E5C;">${customAccessLevel}</strong>.</p>
                </div>
                <div class="v-term-item" style="gap: 1.2mm;">
                  <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                  <p class="v-term-p" style="font-size: 3.8px;">Este cartão constituí propriedade do CEMIL. Em caso de perda, notifique imediatamente a adm.</p>
                </div>
              </div>

              <div class="v-emerg-box" style="margin: 1.5mm 3.2mm; padding: 1mm 0;">
                <span class="v-emerg-lbl" style="font-size: 4.5px; margin-bottom: 0.4mm;">Ficha de Emergência Médica</span>
                <div class="v-emerg-grid" style="font-size: 3.8px;">
                  <div>SANGUE: <strong style="color: #1e293b;">${bloodType || 'N/I'}</strong></div>
                  <div>ALERGIAS: <strong style="color: #1e293b; max-width: 40px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${allergies || 'Nenhuma'}</strong></div>
                  <div class="v-emerg-grid-full" style="line-height: 1;">CONTATOS: <strong style="color: #1e293b;">${emergencyContact || 'Central CEMIL'}</strong></div>
                </div>
              </div>

              <div class="v-back-dates-row" style="padding: 2mm 3.2mm;">
                <div class="v-dates-col" style="gap: 1mm;">
                  <div class="v-date-item">
                    <div class="v-date-icon" style="font-size: 4px;">📅</div>
                    <div class="v-date-info">
                      <span class="v-date-lbl">ADMISSÃO</span>
                      <span class="v-date-val" style="font-size: 3.8px;">${rDate}</span>
                    </div>
                  </div>
                  <div class="v-date-item">
                    <div class="v-date-icon" style="font-size: 4px;">📅</div>
                    <div class="v-date-info">
                      <span class="v-date-lbl">EXPIRAÇÃO</span>
                      <span class="v-date-val" style="font-size: 3.8px;">${customExpiryDate}</span>
                    </div>
                  </div>
                </div>

                <div class="v-sign-col" style="align-items: center; padding-right: 1.5mm;">
                  <span class="v-sign-font" style="font-size: 7px; margin-bottom: -0.5mm;">Sign</span>
                  <div class="v-sign-line" style="width: 12mm; margin-bottom: 0.4mm;"></div>
                  <span class="v-sign-lbl" style="font-size: 3px;">DIRETOR</span>
                </div>
              </div>

              <div class="v-solid-foot-bar"></div>
            </div>
          </div>
        `;
      } else {
        elementHtml = `
          <div class="print-cards-container">
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
                  
                  <!-- Center Balanced Section to improve the empty space -->
                  <div class="sidebar-center" style="margin: auto 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5mm;">
                    <div style="height: 0.15mm; width: 6mm; background: rgba(255,255,255,0.25); margin-bottom: 0.6mm;"></div>
                    ${bloodType ? `
                      <div style="font-size: 3.5px; font-weight: 900; color: #cbd5e1; letter-spacing: 0.4px;">SANGUE</div>
                      <div style="font-size: 7.5px; font-weight: 900; color: #E59A18; font-family: monospace; line-height: 1;">${bloodType}</div>
                    ` : `
                      <div style="font-size: 3.2px; font-weight: 900; color: #cbd5e1; letter-spacing: 0.4px;">ATIVO</div>
                      <div style="font-size: 5px; font-weight: 900; color: #E59A18; line-height: 1; letter-spacing: 0.5px;">★★★</div>
                    `}
                    <div style="height: 0.15mm; width: 6mm; background: rgba(255,255,255,0.25); margin-top: 0.6mm;"></div>
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
                  
                  <div class="name-display">${selectedMember.name}</div>
                  
                  <div class="role-pill">${customRole.toUpperCase()}</div>
                  
                  <div class="meta-bottom">
                    <div class="meta-cell">
                      <span class="meta-label">REGISTRO</span>
                      <span class="meta-val">${formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</span>
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
                  <p class="rules-p" style="font-size: 4.5px; color: #4b5563; line-height: 1.2; margin: 0 0 1.2mm 0;">
                    Esta credencial oficial identifica de forma unívoca o membro ou portador voluntário do CEMIL/Mirante de Luz.
                  </p>
                  <div class="access-sectors" style="font-size: 4.5px; font-weight: bold; color: #CF9E22; margin-bottom: 1.5mm;">Autorização de Setor: ${customAccessLevel}</div>
                  
                  <!-- Dynamic Medical Box on back -->
                  <div style="border-top: 0.15mm dashed #cbd5e1; padding-top: 0.8mm; margin-top: 1mm;">
                    <div style="color: #c2410c; font-family: 'Space Grotesk', sans-serif; font-weight: 955; font-size: 5px; margin-bottom: 0.3mm; text-transform: uppercase;">Ficha Pré-Médica de Emergência</div>
                    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap-x: 1mm; font-size: 4.2px; color: #374151; font-weight: 600; line-height: 1.2;">
                      <div><strong>TIPO SANGUE:</strong> ${bloodType || 'N/I'}</div>
                      <div><strong>ALERGIAS:</strong> ${allergies || 'Nenhuma informada'}</div>
                      <div style="grid-column: span 2;"><strong>CONTATO EMERGÊNCIA:</strong> ${emergencyContact || 'Central CEMIL'}</div>
                    </div>
                  </div>

                  <div class="footer-meta" style="display: flex; justify-content: space-between; align-items: center; border-top: 0.15mm solid #e5e7eb; padding-top: 0.8mm; font-size: 4.5px; font-weight: bold; color: #9ca3af; margin-top: 1mm;">
                    <div class="validity">VALIDADE: ${customExpiryDate}</div>
                    <div class="cred-brand" style="color: #0A2E5C;">CEMIL CRED</div>
                  </div>
                </div>
              </div>
              <div class="bottom-stripe" style="background: #CF9E22; height: 1.5mm; width: 100%;"></div>
            </div>
          </div>
        `;
      }
    } else {
      if (selectedTemplate === 'modern') {
        const formattedCode = formatRegistrationCode(selectedMember.id, selectedMember.registrationDate);
        elementHtml = `
          <div class="print-cards-container">
            <!-- MODERN CRASHÁ (PREMIUM ONDAS MODEL 2) -->
            <div class="badge-card vertical animate-fade-in">
              <div class="v-cracha-header-svg">
                <svg viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                  <path d="M0 0H540V220C540 220 400 300 270 290C140 280 0 310 0 310V0Z" fill="url(#blue-grad-cracha-printed-singular)" />
                  <path d="M0 310C0 310 140 280 270 290C400 300 540 220 540 220V226C540 226 400 305 270 295C140 285 0 315 0 315V310Z" fill="#CF9E22" />
                  <defs>
                    <linearGradient id="blue-grad-cracha-printed-singular" x1="0" y1="0" x2="540" y2="320" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#0A2E5C" />
                      <stop offset="1" stop-color="#1E40AF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div class="v-cracha-lanyard"></div>

              <div class="v-cracha-top-title">
                <div class="v-cracha-logo" style="width: 8.5mm; height: 9mm;">
                  <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                    <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
                    <polygon points="80,165 215,165 235,193 60,193" fill="#FFFFFF" />
                    <polygon points="40,197 240,197 260,225 20,225" fill="#FFFFFF" />
                  </svg>
                </div>
                <h4 class="v-cracha-event" style="font-size: 7.5px;">${customEventName}</h4>
                <p class="v-cracha-sub" style="font-size: 4px;">Credenciamento Oficial de Evento</p>
              </div>

              <div class="v-cracha-body">
                <div class="v-cracha-photo-outer" style="margin-bottom: 2mm;">
                  <div class="v-cracha-photo-inner-border">
                    <div class="v-cracha-photo-imgcontainer">
                      ${photoHtml}
                    </div>
                  </div>
                </div>

                <h4 class="v-cracha-name" style="font-size: 10px; margin-bottom: 0.6mm;">${selectedMember.name}</h4>
                <div class="v-cracha-pill" style="font-size: 5px; margin-bottom: 0.6mm;">${customRole.toUpperCase()}</div>
                <p class="v-cracha-access" style="font-size: 5px;">Setor de Acesso: <strong style="color: #0A2E5C;">${customAccessLevel}</strong></p>
              </div>

              <div class="v-cracha-foot" style="padding: 2.2mm 3.2mm;">
                <div class="v-cracha-foot-l">
                  <span class="v-cracha-foot-l-lbl" style="font-size: 3.5px;">Data / Período</span>
                  <span class="v-cracha-foot-l-val" style="font-size: 6px;">${customEventDate}</span>
                  <span class="v-cracha-foot-l-reg" style="font-size: 4.8px; margin-top: 0.3mm;">REGISTRO: ${formattedCode}</span>
                </div>
                <div class="v-qr-box">
                  <img src="${qrImg}" class="v-qr-img" />
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
              <div class="badge-inner-custom">
                <!-- Top Header Block -->
                <div class="badge-header-block" style="background: #0A2E5C; width: 100%; text-align: center; padding: 3mm 0; border-bottom: 1.2mm solid #CF9E22; box-sizing: border-box;">
                  <div style="width: 34px; height: 38px; margin: 0 auto 0.5mm auto;">
                    <svg width="34" height="38" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <div class="name-display" style="font-size: 13px; margin-bottom: 1.2mm;">${selectedMember.name}</div>
                    
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
                    <div style="font-size: 5px; font-weight: bold; color: #0A2E5C;">REGISTRO: ${formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</div>
                  </div>
                  
                  <div style="background: #ffffff; padding: 0.3mm; border: 0.2mm solid #e5e7eb; border-radius: 1mm; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                    <img src="${qrImg}" style="width: 10mm; height: 10mm; display: block;" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IMPRESSÃO - ${selectedMember.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;600;800;900&family=Space+Grotesk:wght@500;700;900&family=JetBrains+Mono:wght@700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
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

          /* =======================================================
             ESTILOS DO NOVO MODELO VERTICAL (PREMIUM WAVES / PREMIUM ONDAS MODEL 2)
             ======================================================= */
          /* CARD DE CREDENCIAL CR80 VERTICAL */
          .card.CR80.vertical {
            width: 53.98mm;
            height: 85.6mm;
            min-width: 53.98mm;
            min-height: 85.6mm;
            background: #FBFBFA;
            border-radius: 3.2mm; 
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            border: 0.3mm solid #e5e7eb;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .v-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 38mm;
            z-index: 1;
          }

          .v-header-content {
            position: relative;
            z-index: 2;
            padding: 3mm 2.5mm 0 2.5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .v-header-logo {
            margin-bottom: 0px;
          }

          .v-header-text {
            text-align: center;
            margin-top: -0.5mm;
          }

          .v-header-org {
            font-family: 'Playfair Display', serif;
            font-size: 3px;
            font-weight: 700;
            color: rgba(255,255,255,0.85);
            letter-spacing: 1px;
            display: block;
          }

          .v-header-brand {
            font-family: 'Playfair Display', serif;
            font-size: 5.5px;
            font-weight: 900;
            color: #E59A18;
            letter-spacing: 0.3px;
            display: block;
          }

          /* V-BODY ZONE */
          .v-body-zone {
            position: relative;
            z-index: 3;
            margin-top: 15mm;
            padding: 0 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-grow: 1;
            justify-content: center;
          }

          /* Photo wrapper similar to classic but styled vertically */
          .v-photo-wrapper {
            padding: 0.3mm;
            background: #CF9E22;
            border-radius: 1.5mm;
            margin-bottom: 1.8mm;
          }

          .v-photo-inner {
            padding: 0.3mm;
            background: #0A2E5C;
            border-radius: 1.2mm;
            width: 15mm;
            height: 19mm;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-photo-inner img,
          .v-photo-inner div {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 0.8mm;
            display: block;
          }

          .v-info-column {
            text-align: center;
            width: 100%;
          }

          .v-name {
            font-family: "Playfair Display", serif;
            font-weight: 900;
            color: #0A2E5C;
            font-size: 8.5px;
            margin-bottom: 0.6mm;
            text-transform: capitalize;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }

          .v-role {
            font-family: "Space Grotesk", sans-serif;
            display: inline-block;
            background: #CF9E22;
            color: #ffffff;
            font-size: 4.8px;
            font-weight: 900;
            padding: 0.3mm 3mm;
            border-radius: 0.6mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
          }

          /* 2x2 Metadata grid inside v-body-zone */
          .v-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.2mm 2mm;
            width: 100%;
            box-sizing: border-box;
          }

          .v-grid-box {
            text-align: left;
            border-bottom: 0.1mm solid rgba(229, 231, 235, 0.8);
            padding-bottom: 0.3mm;
          }

          .v-grid-cell {
            display: flex;
            align-items: center;
            gap: 0.8mm;
          }

          .v-grid-cell-icon {
            font-size: 4px;
          }

          .v-cell-info {
            display: flex;
            flex-direction: column;
          }

          .v-cell-lbl {
            font-size: 2.8px;
            color: #9ca3af;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 0.1mm;
          }

          .v-cell-val {
            font-size: 4px;
            color: #1f2937;
            font-weight: 900;
            line-height: 1;
          }

          /* V-FOOTER ZONE */
          .v-footer-zone {
            position: relative;
            width: 100%;
            height: 25mm;
            margin-top: auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .v-footer-wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }

          .v-sign-qr-row {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 3mm 1mm 3.2mm;
            box-sizing: border-box;
            width: 100%;
          }

          .v-sign-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 1.2mm;
          }

          .v-sign-font {
            font-family: 'Dancing Script', cursive, Georgia, serif;
            font-size: 7.5px;
            font-weight: bold;
            color: #0A2E5C;
          }

          .v-sign-line {
            height: 0.15mm;
            width: 15mm;
            background: #cbd5e1;
            margin-bottom: 0.4mm;
          }

          .v-sign-lbl {
            font-size: 3.5px;
            font-weight: 950;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .v-qr-box {
            background: #ffffff;
            border: 0.2mm solid #e5e7eb;
            padding: 0.6mm;
            border-radius: 1.5mm;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-qr-img {
            width: 9.5mm;
            height: 9.5mm;
            display: block;
          }

          .v-barcode-row {
            position: relative;
            z-index: 2;
            width: 100%;
            display: flex;
            justify-content: center;
            padding-bottom: 1.8mm;
          }

          .v-barcode-line {
            height: 1.2mm;
            width: 80%;
            background: repeating-linear-gradient(90deg, #1e293b, #1e293b 0.15mm, transparent 0.15mm, transparent 0.4mm);
            opacity: 0.85;
          }

          /* NOVO MODELO VERTICAL - VERSO */
          .v-back-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 14mm;
            z-index: 1;
          }

          .v-back-header-content {
            position: relative;
            z-index: 2;
            padding: 2.2mm 3mm 0 3mm;
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }

          .v-back-logo {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-back-title {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-back-title-line {
            font-size: 3.2px;
            font-weight: 900;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-back-title-line.gold {
            color: #E59A18;
          }

          /* V-TERMS BOX ON BACK */
          .v-terms-box {
            position: relative;
            z-index: 3;
            margin-top: 15mm;
            padding: 0 3.2mm;
            box-sizing: border-box;
          }

          .v-term-item {
            display: flex;
            align-items: flex-start;
            gap: 1mm;
            margin-bottom: 1.5mm;
          }

          .v-term-check {
            font-size: 4.5px;
            line-height: 1;
            margin-top: 0.2mm;
          }

          .v-term-p {
            font-size: 4px;
            color: #4b5563;
            line-height: 1.2;
            margin: 0;
            font-weight: 600;
            text-align: left;
          }

          /* V-EMERG BOX ON BACK */
          .v-emerg-box {
            margin-top: 2.5mm;
            border-top: 0.15mm dashed #cbd5e1;
            padding: 1.2mm 3.2mm 0 3.2mm;
            box-sizing: border-box;
          }

          .v-emerg-lbl {
            font-family: "Space Grotesk", sans-serif;
            font-weight: 955;
            font-size: 4.8px;
            color: #c2410c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 0.8mm;
            text-align: left;
          }

          .v-emerg-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1mm 2mm;
            font-size: 3.8px;
            color: #374151;
            font-weight: bold;
            line-height: 1.2;
            text-align: left;
          }

          .v-emerg-grid-full {
            grid-column: span 2;
          }

          /* BACK DATES */
          .v-back-dates-row {
            margin-top: auto;
            border-top: 0.15mm solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            padding: 1.5mm 3.2mm 1mm 3.2mm;
            box-sizing: border-box;
          }

          .v-dates-col {
            display: flex;
            gap: 2.5mm;
          }

          .v-date-item {
            display: flex;
            align-items: center;
            gap: 0.8mm;
          }

          .v-date-icon {
            font-size: 4.8px;
          }

          .v-date-info {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-date-lbl {
            font-size: 2.5px;
            color: #9ca3af;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 0.1mm;
          }

          .v-date-val {
            font-size: 3.6px;
            color: #1f2937;
            font-weight: 900;
            line-height: 1;
          }

          .v-solid-foot-bar {
            height: 1.2mm;
            background: #CF9E22;
            width: 100%;
          }

          /* MODERN EVENT BADGE (PREMIUM ONDAS MODEL 2) */
          .badge-card.vertical {
            width: 76.2mm;
            height: 101.6mm;
            min-width: 76.2mm;
            min-height: 101.6mm;
            background: #FBFBFA;
            border-radius: 6mm;
            box-sizing: border-box;
            overflow: hidden;
            border: 0.3mm solid #D1D5DB;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .v-cracha-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 48mm;
            z-index: 1;
          }

          .v-cracha-lanyard {
            position: absolute;
            top: 4.5mm;
            left: 50%;
            transform: translateX(-50%);
            width: 12mm;
            height: 3mm;
            border-radius: 1.5mm;
            border: 0.25mm solid rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.15);
            z-index: 10;
          }

          .v-cracha-top-title {
            position: relative;
            z-index: 2;
            margin-top: 11mm;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .v-cracha-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.6mm;
          }

          .v-cracha-event {
            font-family: 'Space Grotesk', sans-serif;
            color: #E59A18;
            font-weight: 900;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-cracha-sub {
            color: #ffffff;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0.3mm 0 0 0;
          }

          .v-cracha-body {
            position: relative;
            z-index: 2;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-top: 2mm;
          }

          .v-cracha-photo-outer {
            padding: 0.35mm;
            background: #CF9E22;
            border-radius: 2mm;
          }

          .v-cracha-photo-inner-border {
            padding: 0.35mm;
            background: #0A2E5C;
            border-radius: 1.6mm;
          }

          .v-cracha-photo-imgcontainer {
            width: 18mm;
            height: 22.5mm;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 1.2mm;
          }

          .v-cracha-photo-imgcontainer img,
          .v-cracha-photo-imgcontainer div {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .v-cracha-name {
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            color: #0A2E5C;
            text-align: center;
            margin: 0;
          }

          .v-cracha-pill {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 900;
            background: #CF9E22;
            color: #ffffff;
            padding: 0.5mm 3.5mm;
            border-radius: 1mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-cracha-access {
            font-size: 5px;
            color: #4b5563;
            font-weight: bold;
            margin: 0.5mm 0 0 0;
          }

          .v-cracha-foot {
            background: #F3F4F6;
            border-top: 0.25mm solid #E5E7EB;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            width: 100%;
            padding: 2mm 3.2mm;
          }

          .v-cracha-foot-l {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-cracha-foot-l-lbl {
            font-size: 3.5px;
            font-weight: bold;
            color: #9CA3AF;
            text-transform: uppercase;
          }

          .v-cracha-foot-l-val {
            font-size: 6px;
            font-weight: 900;
            color: #0A2E5C;
            text-transform: uppercase;
          }

          .v-cracha-foot-l-reg {
            font-size: 4.8px;
            font-weight: 900;
            color: #9CA3AF;
          }

          .v-qr-img {
            width: 8.5mm;
            height: 8.5mm;
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
          }

          /* Overrides for Premium Waves Front Logo & Signatures */
          .v-header-logo {
            width: 12.5mm !important;
            height: 13.5mm !important;
            margin-bottom: 0.8mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .v-sign-col.light .v-sign-font {
            color: #FFFFFF !important;
            text-shadow: 0 0.2mm 0.5mm rgba(0,0,0,0.2) !important;
          }
          .v-sign-col.light .v-sign-line {
            background: rgba(255, 255, 255, 0.45) !important;
          }
          .v-sign-col.light .v-sign-lbl {
            color: rgba(255, 255, 255, 0.85) !important;
          }

          .v-sign-col.dark .v-sign-font {
            color: #0A2E5C !important;
          }
          .v-sign-col.dark .v-sign-line {
            background: rgba(10, 46, 92, 0.25) !important;
          }
          .v-sign-col.dark .v-sign-lbl {
            color: #64748b !important;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <h3>SISTEMA DE IMPRESSÃO INTEGRADA CEMIL</h3>
          <button class="print-btn" onclick="window.print()">Imprimir Credencial</button>
        </div>
        ${elementHtml}
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleAddToQueue = () => {
    if (!selectedMember) return;

    const newItem = {
      printId: `${selectedMember.id}-${activeCredentialTab}`,
      memberId: selectedMember.id,
      name: selectedMember.name,
      registrationDate: selectedMember.registrationDate,
      birthDate: selectedMember.birthDate || '',
      type: activeCredentialTab,
      customRole,
      customAccessLevel,
      customEventName,
      customEventDate,
      customExpiryDate,
      customPhoto,
      photoScale,
      photoShiftX,
      photoShiftY,
      photoRotate,
      bloodType: selectedMember.bloodType || '',
      allergies: selectedMember.allergies || '',
      emergencyContact: selectedMember.emergencyContact || '',
      phone: selectedMember.phone || '',
      email: selectedMember.email || '',
      selectedTemplate,
    };

    // Check if duplicate
    const exists = printQueue.some(item => item.printId === newItem.printId);
    if (exists) {
      alert("Esta credencial já foi guardada no lote de impressão atual!");
      return;
    }

    const updated = [...printQueue, newItem];
    setPrintQueue(updated);
    dataService.savePrintQueue(updated).catch(console.error);
  };

  const handleRemoveFromQueue = (printId: string) => {
    const updated = printQueue.filter(item => item.printId !== printId);
    setPrintQueue(updated);
    dataService.savePrintQueue(updated).catch(console.error);
  };

  const handleClearQueue = () => {
    if (window.confirm("Deseja realmente limpar todo o lote de impressão atual?")) {
      setPrintQueue([]);
      dataService.savePrintQueue([]).catch(console.error);
    }
  };

  const handlePrintBatch = () => {
    if (printQueue.length === 0) {
      alert("Seu lote de impressão está vazio!");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Por favor, permita pop-ups para que o sistema de impressão integrada funcione.");
      return;
    }

    const themeColor = '#0A2E5C';
    const goldColor = '#CF9E22';

    let listHtml = '';

    printQueue.forEach(item => {
      const {
        name,
        registrationDate,
        birthDate,
        type,
        customRole: itemRole,
        customAccessLevel: itemAccess,
        customEventName: itemEvent,
        customEventDate: itemDate,
        customExpiryDate: itemExpiry,
        customPhoto: itemPhoto,
        photoScale: itemScale,
        photoShiftX: itemX,
        photoShiftY: itemY,
        photoRotate: itemRot,
        bloodType: itemBlood,
        allergies: itemAllergies,
        emergencyContact: itemEmergency,
        phone = '-',
        email = 'contato@mirantedeluz.org',
        selectedTemplate: itemTemplate = selectedTemplate
      } = item;

      const rDate = registrationDate ? new Date(registrationDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
      const bDate = birthDate || '-';
      const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${item.memberId}`);
      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
      
      const transformStyle = `transform: scale(${itemScale / 100}) translate(${itemX}px, ${itemY}px) rotate(${itemRot}deg); transform-origin: center center;`;
      const photoHtml = itemPhoto 
        ? `<img src="${itemPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
        : `<div style="width: 100%; height: 100%; background: #0A2E5C20; color: #0A2E5C; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(name || "U").charAt(0)}</div>`;

      if (type === 'carteira') {
        if (itemTemplate === 'modern') {
          const formattedCode = formatRegistrationCode(item.memberId, registrationDate);
          listHtml += `
            <div class="print-cards-container print-batch-item">
              <!-- CARD FRENTE (PREMIUM WAVES VERTICAL) -->
              <div class="card CR80 vertical animate-fade-in">
                <div class="v-header-svg">
                  <svg viewBox="0 0 540 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                    <path d="M0 0H540V120C540 120 400 200 270 190C140 180 0 210 0 210V0Z" fill="url(#blue-grad-print-${item.memberId})" />
                    <path d="M0 210C0 210 140 180 270 190C400 200 540 120 540 120V126C540 126 400 205 270 195C140 185 0 215 0 215V210Z" fill="#CF9E22" />
                    <defs>
                      <linearGradient id="blue-grad-print-${item.memberId}" x1="0" y1="0" x2="540" y2="220" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#0A2E5C" />
                        <stop offset="1" stop-color="#1e40af" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div class="v-header-content">
                  <div class="v-header-logo">
                    <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                      <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
                      <circle cx="170" cy="115" r="7" fill="#E59A18" />
                      <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <line x1="128" y1="93" x2="78" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <line x1="212" y1="93" x2="262" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <polyline points="80,165 215,165 235,193 60,193" stroke="white" stroke-width="1" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <div class="v-header-text">
                    <span class="v-header-org" style="font-size: 1.4mm; line-height: 1.1; font-weight: 700; letter-spacing: 0.15mm; display: block; color: rgba(255, 255, 255, 0.9);">CENTRO ESPÍRITA</span>
                    <span class="v-header-brand" style="font-size: 2.1mm; line-height: 1.1; font-weight: 900; color: #CF9E22; display: block;">MIRANTE DE LUZ</span>
                  </div>
                </div>

                <div class="v-body-zone">
                  <div class="v-photo-wrapper">
                    <div class="v-photo-inner">
                      ${photoHtml}
                    </div>
                  </div>
                  <div class="v-info-column">
                    <h4 class="v-name" style="font-size: 7.5px;">${name}</h4>
                    <p class="v-role" style="font-size: 5px; margin-top: 0.4mm;">${itemRole.toUpperCase()}</p>
                  </div>
                </div>

                <div class="v-meta-grid" style="padding: 1mm 3.2mm; gap: 0.8mm 1.5mm;">
                  <div class="v-grid-cell">
                    <div class="v-grid-cell-icon" style="font-size: 5px;">👤</div>
                    <div class="v-cell-info">
                      <span class="v-cell-lbl">ID NO.</span>
                      <span class="v-cell-val" style="font-size: 4.5px;">${formattedCode}</span>
                    </div>
                  </div>
                  <div class="v-grid-cell">
                    <div class="v-grid-cell-icon" style="font-size: 5px;">📅</div>
                    <div class="v-cell-info">
                      <span class="v-cell-lbl">NASCIMENTO</span>
                      <span class="v-cell-val" style="font-size: 4.5px;">${bDate}</span>
                    </div>
                  </div>
                  <div class="v-grid-cell">
                    <div class="v-grid-cell-icon" style="font-size: 5px;">📞</div>
                    <div class="v-cell-info">
                      <span class="v-cell-lbl">TELEFONE</span>
                      <span class="v-cell-val" style="font-size: 4.5px;">${phone}</span>
                    </div>
                  </div>
                  <div class="v-grid-cell">
                    <div class="v-grid-cell-icon" style="font-size: 5px;">✉️</div>
                    <div class="v-cell-info">
                      <span class="v-cell-lbl">E-MAIL</span>
                      <span class="v-cell-val" style="font-size: 4px;">${email}</span>
                    </div>
                  </div>
                </div>

                <div class="v-footer-zone" style="padding: 2mm 3.2mm 2.2mm 3.2mm; height: 18mm;">
                  <div class="v-footer-wave">
                    <svg viewBox="0 0 540 150" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                      <path d="M0 150H220C220 150 150 90 80 100C0 110 0 150 0 150Z" fill="url(#blue-grad-bottom-${item.memberId})" />
                      <path d="M0 150C0 150 0 110 80 100C150 90 220 150 220 150" stroke="#CF9E22" stroke-width="4" />
                      <defs>
                        <linearGradient id="blue-grad-bottom-${item.memberId}" x1="0" y1="150" x2="220" y2="90" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#0A2E5C" />
                          <stop offset="1" stop-color="#1A365D" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div class="v-sign-qr-row">
                    <div class="v-sign-col light">
                      <span class="v-sign-font" style="font-size: 8px; margin-bottom: -0.5mm;">Sign</span>
                      <div class="v-sign-line" style="width: 13mm; margin-bottom: 0.4mm;"></div>
                      <span class="v-sign-lbl" style="font-size: 3px;">ASSINATURA</span>
                    </div>
                    <div class="v-qr-box" style="padding: 0.5mm;">
                      <img src="${qrImg}" class="v-qr-img" style="width: 10.5mm; height: 10.5mm;" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD VERSO (PREMIUM WAVES VERTICAL) -->
              <div class="card CR80 vertical animate-fade-in">
                <div class="v-back-header-svg">
                  <svg viewBox="0 0 540 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                    <path d="M0 0H540V110C540 110 400 160 270 150C140 140 0 170 0 170V0Z" fill="url(#blue-grad-back-${item.memberId})" />
                    <path d="M0 170C0 170 140 140 270 150C400 160 540 110 540 110V115C540 115 400 165 270 155C140 145 0 175 0 175V170Z" fill="#CF9E22" />
                    <defs>
                      <linearGradient id="blue-grad-back-${item.memberId}" x1="0" y1="0" x2="540" y2="180" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#0A2E5C" />
                        <stop offset="1" stop-color="#1e40af" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div class="v-back-header-content" style="padding: 2.2mm 3.2mm;">
                  <div class="v-back-logo" style="width: 6.5mm; height: 7mm;">
                    <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                      <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
                      <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <polyline points="80,165 215,165 235,193 60,193" stroke="white" stroke-width="1" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <div class="v-back-title">
                    <span class="v-back-title-line" style="font-size: 4.5px;">TERMOS E</span>
                    <span class="v-back-title-line gold" style="font-size: 4.5px;">CONDIÇÕES</span>
                  </div>
                </div>

                <div class="v-terms-box" style="margin-top: 10.5mm; gap: 1.5mm;">
                  <div class="v-term-item" style="gap: 1.2mm;">
                    <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                    <p class="v-term-p" style="font-size: 3.8px;">O uso desta credencial é obrigatório para identificação e controle de acesso no Mirante de Luz.</p>
                  </div>
                  <div class="v-term-item" style="gap: 1.2mm;">
                    <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                    <p class="v-term-p" style="font-size: 3.8px;">Identifica voluntário ativo e autoriza circulação nos setores de acesso: <strong style="color: #0A2E5C;">${itemAccess}</strong>.</p>
                  </div>
                  <div class="v-term-item" style="gap: 1.2mm;">
                    <div class="v-term-check" style="width: 3.2mm; height: 3.2mm; font-size: 4px;">✓</div>
                    <p class="v-term-p" style="font-size: 3.8px;">Este cartão constituí propriedade do CEMIL. Em caso de perda, notifique imediatamente a adm.</p>
                  </div>
                </div>

                <div class="v-emerg-box" style="margin: 1.5mm 3.2mm; padding: 1mm 0;">
                  <span class="v-emerg-lbl" style="font-size: 4.5px; margin-bottom: 0.4mm;">Ficha de Emergência Médica</span>
                  <div class="v-emerg-grid" style="font-size: 3.8px;">
                    <div>SANGUE: <strong style="color: #1e293b;">${itemBlood || 'N/I'}</strong></div>
                    <div>ALERGIAS: <strong style="color: #1e293b; max-width: 40px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemAllergies || 'Nenhuma'}</strong></div>
                    <div class="v-emerg-grid-full" style="line-height: 1;">CONTATOS: <strong style="color: #1e293b;">${itemEmergency || 'Central CEMIL'}</strong></div>
                  </div>
                </div>

                <div class="v-back-dates-row" style="padding: 2mm 3.2mm;">
                  <div class="v-dates-col" style="gap: 1mm;">
                    <div class="v-date-item">
                      <div class="v-date-icon" style="font-size: 4px;">📅</div>
                      <div class="v-date-info">
                        <span class="v-date-lbl">ADMISSÃO</span>
                        <span class="v-date-val" style="font-size: 3.8px;">${rDate}</span>
                      </div>
                    </div>
                    <div class="v-date-item">
                      <div class="v-date-icon" style="font-size: 4px;">📅</div>
                      <div class="v-date-info">
                        <span class="v-date-lbl">EXPIRAÇÃO</span>
                        <span class="v-date-val" style="font-size: 3.8px;">${itemExpiry}</span>
                      </div>
                    </div>
                  </div>

                  <div class="v-sign-col" style="align-items: center; padding-right: 1.5mm;">
                    <span class="v-sign-font" style="font-size: 7px; margin-bottom: -0.5mm;">Sign</span>
                    <div class="v-sign-line" style="width: 12mm; margin-bottom: 0.4mm;"></div>
                    <span class="v-sign-lbl" style="font-size: 3px;">DIRETOR</span>
                  </div>
                </div>

                <div class="v-solid-foot-bar"></div>
              </div>
            </div>
          `;
        } else {
          listHtml += `
            <div class="print-cards-container print-batch-item">
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
                    
                    <!-- Center Balanced Section inside the blue sidebar -->
                    <div class="sidebar-center" style="margin: auto 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5mm;">
                      <div style="height: 0.15mm; width: 6mm; background: rgba(255,255,255,0.25); margin-bottom: 0.6mm;"></div>
                      ${itemBlood ? `
                        <div style="font-size: 3.5px; font-weight: 900; color: #cbd5e1; letter-spacing: 0.4px;">SANGUE</div>
                        <div style="font-size: 7.5px; font-weight: 900; color: #E59A18; font-family: monospace; line-height: 1;">${itemBlood}</div>
                      ` : `
                        <div style="font-size: 3.2px; font-weight: 900; color: #cbd5e1; letter-spacing: 0.4px;">ATIVO</div>
                        <div style="font-size: 5px; font-weight: 900; color: #E59A18; line-height: 1; letter-spacing: 0.5px;">★★★</div>
                      `}
                      <div style="height: 0.15mm; width: 6mm; background: rgba(255,255,255,0.25); margin-top: 0.6mm;"></div>
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
                    
                    <div class="name-display">${name}</div>
                    
                    <div class="role-pill">${itemRole.toUpperCase()}</div>
                    
                    <div class="meta-bottom">
                      <div class="meta-cell">
                        <span class="meta-label">REGISTRO</span>
                        <span class="meta-val">${formatRegistrationCode(item.memberId, registrationDate)}</span>
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
                    <div class="rules-header" style="color: #0A2E5C; font-family: 'Space Grotesk', sans-serif; font-weight: 955; font-size: 8px; margin-bottom: 0.5mm;">Instruções Administrativas</div>
                    <p class="rules-p" style="font-size: 4.5px; color: #4b5563; line-height: 1.2; margin: 0 0 1.2mm 0;">
                      Esta credencial oficial identifica de forma unívoca o membro ou portador voluntário do CEMIL/Mirante de Luz.
                    </p>
                    <div class="access-sectors" style="font-size: 4.5px; font-weight: bold; color: #CF9E22; margin-bottom: 1.5mm;">Autorização de Setor: ${itemAccess}</div>
                    
                    <!-- Dynamic Medical Box on back -->
                    <div style="border-top: 0.15mm dashed #cbd5e1; padding-top: 0.8mm; margin-top: 1mm;">
                      <div style="color: #c2410c; font-family: 'Space Grotesk', sans-serif; font-weight: 955; font-size: 5px; margin-bottom: 0.3mm; text-transform: uppercase;">Ficha Pré-Médica de Emergência</div>
                      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap-x: 1mm; font-size: 4.2px; color: #374151; font-weight: 600; line-height: 1.2;">
                        <div><strong>TIPO SANGUE:</strong> ${itemBlood || 'N/I'}</div>
                        <div><strong>ALERGIAS:</strong> ${itemAllergies || 'Nenhuma informada'}</div>
                        <div style="grid-column: span 2;"><strong>CONTATO EMERGÊNCIA:</strong> ${itemEmergency || 'Central CEMIL'}</div>
                      </div>
                    </div>

                    <div class="footer-meta" style="display: flex; justify-content: space-between; align-items: center; border-top: 0.15mm solid #e5e7eb; padding-top: 0.8mm; font-size: 4.5px; font-weight: bold; color: #9ca3af; margin-top: 1mm;">
                      <div class="validity">VALIDADE: ${itemExpiry}</div>
                      <div class="cred-brand" style="color: #0A2E5C;">CEMIL CRED</div>
                    </div>
                  </div>
                </div>
                <div class="bottom-stripe" style="background: #CF9E22; height: 1.5mm; width: 100%;"></div>
              </div>
            </div>
          `;
        }
      } else {
        if (itemTemplate === 'modern') {
          const formattedCode = formatRegistrationCode(item.memberId, registrationDate);
          listHtml += `
            <div class="print-cards-container print-batch-item">
              <!-- MODERN CRASHÁ (PREMIUM ONDAS MODEL 2) -->
              <div class="badge-card vertical">
                <div class="v-cracha-header-svg">
                  <svg viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                    <path d="M0 0H540V220C540 220 400 300 270 290C140 280 0 310 0 310V0Z" fill="url(#blue-grad-cracha-printed-${item.memberId})" />
                    <path d="M0 310C0 310 140 280 270 290C400 300 540 220 540 220V226C540 226 400 305 270 295C140 285 0 315 0 315V310Z" fill="#CF9E22" />
                    <defs>
                      <linearGradient id="blue-grad-cracha-printed-${item.memberId}" x1="0" y1="0" x2="540" y2="320" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#0A2E5C" />
                        <stop offset="1" stop-color="#1E40AF" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div class="v-cracha-lanyard"></div>

                <div class="v-cracha-top-title">
                  <div class="v-cracha-logo" style="width: 8.5mm; height: 9mm;">
                    <svg width="100%" height="100%" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" />
                      <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" />
                      <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                      <polyline points="80,165 215,165 235,193 60,193" stroke="white" stroke-width="1" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <h4 class="v-cracha-event" style="font-size: 7.5px;">${itemEvent}</h4>
                  <p class="v-cracha-sub" style="font-size: 4px;">Credenciamento Oficial de Evento</p>
                </div>

                <div class="v-cracha-body">
                  <div class="v-cracha-photo-outer" style="margin-bottom: 2mm;">
                    <div class="v-cracha-photo-inner-border">
                      <div class="v-cracha-photo-imgcontainer">
                        ${photoHtml}
                      </div>
                    </div>
                  </div>

                  <h4 class="v-cracha-name" style="font-size: 10px; margin-bottom: 0.6mm;">${name}</h4>
                  <div class="v-cracha-pill" style="font-size: 5px; margin-bottom: 0.6mm;">${itemRole.toUpperCase()}</div>
                  <p class="v-cracha-access" style="font-size: 5px;">Setor de Acesso: <strong style="color: #0A2E5C;">${itemAccess}</strong></p>
                </div>

                <div class="v-cracha-foot" style="padding: 2.2mm 3.2mm;">
                  <div class="v-cracha-foot-l">
                    <span class="v-cracha-foot-l-lbl" style="font-size: 3.5px;">Data / Período</span>
                    <span class="v-cracha-foot-l-val" style="font-size: 6px;">${itemDate}</span>
                    <span class="v-cracha-foot-l-reg" style="font-size: 4.8px; margin-top: 0.3mm;">REGISTRO: ${formattedCode}</span>
                  </div>
                  <div class="v-qr-box">
                    <img src="${qrImg}" class="v-qr-img" />
                  </div>
                </div>
              </div>
            </div>
          `;
        } else {
          listHtml += `
            <div class="print-cards-container print-batch-item">
              <!-- BADGE EVENTO (3x4) -->
              <div class="badge-card">
                <div class="badge-inner-custom">
                  <!-- Top Header Block -->
                  <div class="badge-header-block" style="background: #0A2E5C; width: 100%; text-align: center; padding: 3mm 0; border-bottom: 1.2mm solid #CF9E22; box-sizing: border-box;">
                    <div style="width: 34px; height: 38px; margin: 0 auto 0.5mm auto;">
                      <svg width="34" height="38" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <div style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 900; color: #E59A18; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${itemEvent}
                    </div>
                    <p style="font-size: 6px; font-weight: 900; tracking-widest: 1px; text-transform: uppercase; text-align: center; color: #ffffff; margin: 0.5mm 0 0 0;">Credencial Oficial de Evento</p>
                  </div>

                  <!-- Balanced Photo block in center -->
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; margin: 2mm 0;">
                    <div style="width: 20mm; height: 25mm; border-radius: 2mm; overflow: hidden; border: 0.25mm solid #CF9E22; display: flex; align-items: center; justify-content: center; background: #ffffff;">
                      ${photoHtml}
                    </div>
                    <h3 style="font-family: 'Playfair Display', serif; font-weight: 900; font-size: 13px; color: #0A2E5C; margin: 2mm 0 0 0; text-transform: capitalize; text-align: center;">${name}</h3>
                    <div style="margin-top: 1mm; font-size: 7px; font-weight: 900; color: #FFFFFF; font-family: 'Space Grotesk', sans-serif; background: #CF9E22; border-radius: 4px; padding: 0.6mm 3mm; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${itemRole}
                    </div>
                  </div>

                  <!-- Footer barcode / QR and Event date info -->
                  <div style="background: #F3F4F6; width: 100%; border-top: 0.3mm solid #E5E7EB; display: flex; align-items: center; justify-content: space-between; padding: 2.5mm 4mm; box-sizing: border-box; border-radius: 0 0 6mm 6mm;">
                    <div style="text-align: left; font-family: 'Space Grotesk', sans-serif;">
                      <div style="font-size: 5px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; margin-bottom: 0.2mm;">Credenciamento</div>
                      <div style="font-size: 7px; font-weight: 900; color: #0A2E5C;">${itemAccess}</div>
                      <div style="font-size: 5px; font-weight: 900; color: #9CA3AF; margin-top: 0.3mm;">REGISTRO: ${formatRegistrationCode(item.memberId, registrationDate)}</div>
                    </div>
                    
                    <div style="background: #FFFFFF; border: 0.25mm solid #D1D5DB; padding: 0.6mm; border-radius: 1.5mm;">
                      <img src="${qrImg}" style="width: 8.5mm; height: 8.5mm; display: block;" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      }
    });

    printWin.document.write(`
      <html>
      <head>
        <title>IMPRESSÃO EM LOTE - CEMIL</title>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;600;800;900&family=Space+Grotesk:wght@500;700;900&family=JetBrains+Mono:wght@700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: "Inter", -apple-system, sans-serif;
            background: #F1F5F9;
            margin: 0;
            padding: 0;
            min-height: 100vh;
          }
          .no-print-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 30px;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            position: sticky;
            top: 0;
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
            margin-top: 30px;
            margin-bottom: 30px;
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
            justify-content: center;
            box-sizing: border-box;
            height: 100%;
            text-align: center;
            background: #FBFBFA;
          }

          .photo-container-dual {
            display: flex;
            justify-content: center;
            margin-bottom: 1.2mm;
          }

          .photo-outer {
            padding: 0.4mm;
            background: #CF9E22;
            border-radius: 1.4mm;
          }

          .photo-inner {
            padding: 0.4mm;
            background: #0A2E5C;
            border-radius: 1mm;
          }

          .photo-inner > img,
          .photo-inner > div {
            width: 11mm;
            height: 14mm;
            border-radius: 0.6mm;
            overflow: hidden;
            display: block;
          }

          .name-display {
            font-family: "Playfair Display", serif;
            font-weight: 900;
            font-size: 7.2px;
            color: #0A2E5C;
            margin-bottom: 0.5mm;
            max-width: 48mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-transform: capitalize;
          }

          .role-pill {
            font-family: "Space Grotesk", sans-serif;
            display: inline-block;
            font-size: 4.8px;
            font-weight: 900;
            background: #CF9E22;
            color: #ffffff;
            padding: 0.4mm 2.2mm;
            border-radius: 0.8mm;
            letter-spacing: 0.2px;
            margin-bottom: 1.2mm;
            text-transform: uppercase;
          }

          .meta-bottom {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            width: 100%;
            border-top: 0.15mm solid rgba(229, 231, 235, 0.8);
            padding-top: 0.8mm;
            gap: 1mm;
          }

          .meta-cell {
            text-align: center;
          }

          .meta-label {
            display: block;
            font-size: 3.2px;
            font-weight: 900;
            color: #9ca3af;
            letter-spacing: 0.15px;
            margin-bottom: 0.1mm;
          }

          .meta-val {
            display: block;
            font-size: 4.2px;
            font-weight: 800;
            color: #1f2937;
          }

          /* Verso Style */
          .card.CR80.back {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .border-sandwich {
            border: 0.3mm solid #e5e7eb;
          }

          .back-body {
            display: flex;
            flex-grow: 1;
            padding: 2.2mm 3.2mm;
            align-items: center;
            box-sizing: border-box;
            background: #FBFBFA;
          }

          .back-left-qr {
            width: 25%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding-right: 1.5mm;
            border-right: 0.15mm dashed #cbd5e1;
          }

          .qr-sub-text {
            font-size: 3.8px;
            font-weight: 900;
            color: #9ca3af;
            text-transform: uppercase;
            margin-top: 0.6mm;
            letter-spacing: 0.1px;
            text-align: center;
          }

          .back-right-rules {
            flex-grow: 1;
            padding-left: 2.5mm;
            text-align: left;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          /* BADGE EVENTO (3x4) */
          .badge-card {
            width: 76.2mm;
            height: 101.6mm;
            min-width: 76.2mm;
            min-height: 101.6mm;
            background: #FBFBFA;
            border-radius: 6mm;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            border: 0.3mm solid #D1D5DB;
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

          .qr-print {
            width: 12mm;
            height: 12mm;
            display: block;
            margin: 0 auto;
          }

          /* =======================================================
             ESTILOS DO NOVO MODELO VERTICAL (PREMIUM WAVES / PREMIUM ONDAS MODEL 2)
             ======================================================= */
          /* CARD DE CREDENCIAL CR80 VERTICAL */
          .card.CR80.vertical {
            width: 53.98mm;
            height: 85.6mm;
            min-width: 53.98mm;
            min-height: 85.6mm;
            background: #FBFBFA;
            border-radius: 3.2mm; 
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            border: 0.3mm solid #e5e7eb;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .v-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 38mm;
            z-index: 1;
          }

          .v-header-content {
            position: relative;
            z-index: 2;
            padding: 3mm 2.5mm 0 2.5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .v-header-logo {
            margin-bottom: 0px;
          }

          .v-header-text {
            text-align: center;
            margin-top: -0.5mm;
          }

          .v-header-org {
            font-family: 'Playfair Display', serif;
            font-size: 3px;
            font-weight: 700;
            color: rgba(255,255,255,0.85);
            letter-spacing: 1px;
            display: block;
          }

          .v-header-brand {
            font-family: 'Playfair Display', serif;
            font-size: 5.5px;
            font-weight: 900;
            color: #E59A18;
            letter-spacing: 0.3px;
            display: block;
          }

          /* V-BODY ZONE */
          .v-body-zone {
            position: relative;
            z-index: 3;
            margin-top: 15mm;
            padding: 0 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-grow: 1;
            justify-content: center;
          }

          /* Photo wrapper similar to classic but styled vertically */
          .v-photo-wrapper {
            padding: 0.3mm;
            background: #CF9E22;
            border-radius: 1.5mm;
            margin-bottom: 1.8mm;
          }

          .v-photo-inner {
            padding: 0.3mm;
            background: #0A2E5C;
            border-radius: 1.2mm;
            width: 15mm;
            height: 19mm;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-photo-inner img,
          .v-photo-inner div {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 0.8mm;
            display: block;
          }

          .v-info-column {
            text-align: center;
            width: 100%;
          }

          .v-name {
            font-family: "Playfair Display", serif;
            font-weight: 900;
            color: #0A2E5C;
            font-size: 8.5px;
            margin-bottom: 0.6mm;
            text-transform: capitalize;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }

          .v-role {
            font-family: "Space Grotesk", sans-serif;
            display: inline-block;
            background: #CF9E22;
            color: #ffffff;
            font-size: 4.8px;
            font-weight: 900;
            padding: 0.3mm 3mm;
            border-radius: 0.6mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
          }

          /* 2x2 Metadata grid inside v-body-zone */
          .v-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.2mm 2mm;
            width: 100%;
            box-sizing: border-box;
          }

          .v-grid-box {
            text-align: left;
            border-bottom: 0.1mm solid rgba(229, 231, 235, 0.8);
            padding-bottom: 0.3mm;
          }

          .v-grid-cell {
            display: flex;
            align-items: center;
            gap: 0.8mm;
          }

          .v-grid-cell-icon {
            font-size: 4px;
          }

          .v-cell-info {
            display: flex;
            flex-direction: column;
          }

          .v-cell-lbl {
            font-size: 2.8px;
            color: #9ca3af;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 0.1mm;
          }

          .v-cell-val {
            font-size: 4px;
            color: #1f2937;
            font-weight: 900;
            line-height: 1;
          }

          /* V-FOOTER ZONE */
          .v-footer-zone {
            position: relative;
            width: 100%;
            height: 25mm;
            margin-top: auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .v-footer-wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }

          .v-sign-qr-row {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 3mm 1mm 3.2mm;
            box-sizing: border-box;
            width: 100%;
          }

          .v-sign-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 1.2mm;
          }

          .v-sign-font {
            font-family: 'Dancing Script', cursive, Georgia, serif;
            font-size: 7.5px;
            font-weight: bold;
            color: #0A2E5C;
          }

          .v-sign-line {
            height: 0.15mm;
            width: 15mm;
            background: #cbd5e1;
            margin-bottom: 0.4mm;
          }

          .v-sign-lbl {
            font-size: 3.5px;
            font-weight: 950;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .v-qr-box {
            background: #ffffff;
            border: 0.2mm solid #e5e7eb;
            padding: 0.6mm;
            border-radius: 1.5mm;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-qr-img {
            width: 9.5mm;
            height: 9.5mm;
            display: block;
          }

          .v-barcode-row {
            position: relative;
            z-index: 2;
            width: 100%;
            display: flex;
            justify-content: center;
            padding-bottom: 1.8mm;
          }

          .v-barcode-line {
            height: 1.2mm;
            width: 80%;
            background: repeating-linear-gradient(90deg, #1e293b, #1e293b 0.15mm, transparent 0.15mm, transparent 0.4mm);
            opacity: 0.85;
          }

          /* NOVO MODELO VERTICAL - VERSO */
          .v-back-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 14mm;
            z-index: 1;
          }

          .v-back-header-content {
            position: relative;
            z-index: 2;
            padding: 2.2mm 3mm 0 3mm;
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }

          .v-back-logo {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .v-back-title {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-back-title-line {
            font-size: 3.2px;
            font-weight: 900;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-back-title-line.gold {
            color: #E59A18;
          }

          /* V-TERMS BOX ON BACK */
          .v-terms-box {
            position: relative;
            z-index: 3;
            margin-top: 15mm;
            padding: 0 3.2mm;
            box-sizing: border-box;
          }

          .v-term-item {
            display: flex;
            align-items: flex-start;
            gap: 1mm;
            margin-bottom: 1.5mm;
          }

          .v-term-check {
            font-size: 4.5px;
            line-height: 1;
            margin-top: 0.2mm;
          }

          .v-term-p {
            font-size: 4px;
            color: #4b5563;
            line-height: 1.2;
            margin: 0;
            font-weight: 600;
            text-align: left;
          }

          /* V-EMERG BOX ON BACK */
          .v-emerg-box {
            margin-top: 2.5mm;
            border-top: 0.15mm dashed #cbd5e1;
            padding: 1.2mm 3.2mm 0 3.2mm;
            box-sizing: border-box;
          }

          .v-emerg-lbl {
            font-family: "Space Grotesk", sans-serif;
            font-weight: 955;
            font-size: 4.8px;
            color: #c2410c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 0.8mm;
            text-align: left;
          }

          .v-emerg-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1mm 2mm;
            font-size: 3.8px;
            color: #374151;
            font-weight: bold;
            line-height: 1.2;
            text-align: left;
          }

          .v-emerg-grid-full {
            grid-column: span 2;
          }

          /* BACK DATES */
          .v-back-dates-row {
            margin-top: auto;
            border-top: 0.15mm solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            padding: 1.5mm 3.2mm 1mm 3.2mm;
            box-sizing: border-box;
          }

          .v-dates-col {
            display: flex;
            gap: 2.5mm;
          }

          .v-date-item {
            display: flex;
            align-items: center;
            gap: 0.8mm;
          }

          .v-date-icon {
            font-size: 4.8px;
          }

          .v-date-info {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-date-lbl {
            font-size: 2.5px;
            color: #9ca3af;
            font-weight: 900;
            text-transform: uppercase;
            line-height: 1;
            margin-bottom: 0.1mm;
          }

          .v-date-val {
            font-size: 3.6px;
            color: #1f2937;
            font-weight: 900;
            line-height: 1;
          }

          .v-solid-foot-bar {
            height: 1.2mm;
            background: #CF9E22;
            width: 100%;
          }

          /* MODERN EVENT BADGE (PREMIUM ONDAS MODEL 2) */
          .badge-card.vertical {
            width: 76.2mm;
            height: 101.6mm;
            min-width: 76.2mm;
            min-height: 101.6mm;
            background: #FBFBFA;
            border-radius: 6mm;
            box-sizing: border-box;
            overflow: hidden;
            border: 0.3mm solid #D1D5DB;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .v-cracha-header-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 48mm;
            z-index: 1;
          }

          .v-cracha-lanyard {
            position: absolute;
            top: 4.5mm;
            left: 50%;
            transform: translateX(-50%);
            width: 12mm;
            height: 3mm;
            border-radius: 1.5mm;
            border: 0.25mm solid rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.15);
            z-index: 10;
          }

          .v-cracha-top-title {
            position: relative;
            z-index: 2;
            margin-top: 11mm;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .v-cracha-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.6mm;
          }

          .v-cracha-event {
            font-family: 'Space Grotesk', sans-serif;
            color: #E59A18;
            font-weight: 900;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-cracha-sub {
            color: #ffffff;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 0.3mm 0 0 0;
          }

          .v-cracha-body {
            position: relative;
            z-index: 2;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-top: 2mm;
          }

          .v-cracha-photo-outer {
            padding: 0.35mm;
            background: #CF9E22;
            border-radius: 2mm;
          }

          .v-cracha-photo-inner-border {
            padding: 0.35mm;
            background: #0A2E5C;
            border-radius: 1.6mm;
          }

          .v-cracha-photo-imgcontainer {
            width: 18mm;
            height: 22.5mm;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border-radius: 1.2mm;
          }

          .v-cracha-photo-imgcontainer img,
          .v-cracha-photo-imgcontainer div {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .v-cracha-name {
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            color: #0A2E5C;
            text-align: center;
            margin: 0;
          }

          .v-cracha-pill {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 900;
            background: #CF9E22;
            color: #ffffff;
            padding: 0.5mm 3.5mm;
            border-radius: 1mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .v-cracha-access {
            font-size: 5px;
            color: #4b5563;
            font-weight: bold;
            margin: 0.5mm 0 0 0;
          }

          .v-cracha-foot {
            background: #F3F4F6;
            border-top: 0.25mm solid #E5E7EB;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            width: 100%;
            padding: 2mm 3.2mm;
          }

          .v-cracha-foot-l {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .v-cracha-foot-l-lbl {
            font-size: 3.5px;
            font-weight: bold;
            color: #9CA3AF;
            text-transform: uppercase;
          }

          .v-cracha-foot-l-val {
            font-size: 6px;
            font-weight: 900;
            color: #0A2E5C;
            text-transform: uppercase;
          }

          .v-cracha-foot-l-reg {
            font-size: 4.8px;
            font-weight: 900;
            color: #9CA3AF;
          }

          .v-qr-img {
            width: 8.5mm;
            height: 8.5mm;
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
              margin-bottom: 0;
              display: flex;
              gap: 20px;
              justify-content: center;
              page-break-inside: avoid;
              page-break-after: always;
              break-after: page;
            }
          }

          /* Overrides for Premium Waves Front Logo & Signatures */
          .v-header-logo {
            width: 12.5mm !important;
            height: 13.5mm !important;
            margin-bottom: 0.8mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .v-sign-col.light .v-sign-font {
            color: #FFFFFF !important;
            text-shadow: 0 0.2mm 0.5mm rgba(0,0,0,0.2) !important;
          }
          .v-sign-col.light .v-sign-line {
            background: rgba(255, 255, 255, 0.45) !important;
          }
          .v-sign-col.light .v-sign-lbl {
            color: rgba(255, 255, 255, 0.85) !important;
          }

          .v-sign-col.dark .v-sign-font {
            color: #0A2E5C !important;
          }
          .v-sign-col.dark .v-sign-line {
            background: rgba(10, 46, 92, 0.25) !important;
          }
          .v-sign-col.dark .v-sign-lbl {
            color: #64748b !important;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <h3>SISTEMA DE IMPRESSÃO EM LOTE CEMIL (${printQueue.length} Credenciais)</h3>
          <button class="print-btn" onclick="window.print()">Imprimir Todo o Lote</button>
        </div>
        ${listHtml}
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-8 pb-12 p-4 md:p-8 max-w-7xl mx-auto text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-850 tracking-tight flex items-center gap-2.5">
              <CreditCard size={32} className="text-indigo-650" />
              Central de Credenciamento
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-0.5">
              Gere carteirinhas de sócios, crachás de eventos, ou escaneie códigos QR para checagem rápida.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScanningQr(!isScanningQr)}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black shadow-lg uppercase tracking-wider text-xs transition-all active:scale-95 cursor-pointer self-start md:self-center",
            isScanningQr 
              ? "bg-red-500 hover:bg-red-650 text-white shadow-red-100" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
          )}
        >
          <QrCode size={18} />
          <span>{isScanningQr ? 'Desativar Câmera' : 'Escanear QR Code'}</span>
        </button>
      </div>

      {/* QR Code Stream Overlay */}
      <AnimatePresence>
        {isScanningQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-slate-900 rounded-[32px] overflow-hidden p-6 border-2 border-dashed border-slate-700 space-y-4"
          >
            <div className="flex justify-between items-center text-white border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-500 animate-pulse" />
                <h3 className="font-extrabold uppercase text-xs tracking-wider">Câmera de Leitura Ativa</h3>
              </div>
              <button 
                onClick={() => setIsScanningQr(false)} 
                className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative max-w-sm mx-auto w-full aspect-square bg-black rounded-2xl overflow-hidden relative">
                <div 
                  id="credentials-qr-reader-viewport" 
                  className="w-full h-full"
                />
                {!cameraActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Camera size={32} className="animate-bounce text-indigo-5050" />
                    <span className="text-xs font-bold text-slate-350">Inicializando dispositivo físico...</span>
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 px-6 text-center">
                    <AlertCircle size={32} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-300">{cameraError}</span>
                  </div>
                )}
              </div>

              <div className="text-white space-y-3.5 md:pl-4">
                <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-900/30">
                  <h4 className="text-xs font-black uppercase text-indigo-3050 mb-1 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-yellow-4050" /> Instruções de Leitura
                  </h4>
                  <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                    Aproxime a carteirinha física ou crachá do membro em frente à câmera. O sistema detectará o código QR e carregará os dados cadastrais imediatamente na tela de edição.
                  </p>
                </div>

                <div className="text-xs text-slate-400">
                  ⚠️ Certifique-se de estar em um ambiente bem iluminado e limpe a lente da câmera se o foco estiver instável.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COL 1: SELETOR DE MEMBROS (5 Colunas) */}
        <div className="lg:col-span-5 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-850 text-sm tracking-tight flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              {activeCredentialTab === 'carteira' ? "1. Selecionar Equipe da Casa" : "1. Selecionar Portador (Qualquer Setor)"}
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
              {filteredParticipants.length} {activeCredentialTab === 'carteira' ? "Membro(s)" : "Registro(s)"}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={activeCredentialTab === 'carteira' ? "Buscar voluntário da Casa por nome, ID..." : "Buscar voluntário ou assistido de qualquer setor..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-700 placeholder-slate-400 border border-slate-150 pl-11 pr-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Scrollable list */}
          <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-emerald-650 uppercase tracking-wider animate-pulse">Consultando Banco...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold leading-relaxed">
                {activeCredentialTab === 'carteira' 
                  ? "Nenhum membro cadastrado como Equipe da Casa localizado."
                  : "Nenhum participante de nenhum setor localizado com este filtro."}
              </div>
            ) : (
              filteredParticipants.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={cn(
                    "w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group",
                    selectedMember?.id === member.id 
                      ? "bg-emerald-50/50 border-emerald-300 shadow-sm" 
                      : "bg-white hover:bg-slate-50 border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black",
                      member.isWorker ? "bg-indigo-600" : "bg-emerald-650"
                    )}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate capitalize">{member.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase flex items-center gap-1.5">
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full",
                          member.isWorker ? "bg-indigo-500" : "bg-emerald-500"
                        )} />
                        REGISTRO: {formatRegistrationCode(member.id, member.registrationDate)} • {member.isWorker ? "Equipe da Casa" : "Geral / Outro Setor"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className={cn(
                    "transition-all",
                    selectedMember?.id === member.id 
                      ? "text-indigo-650 translate-x-1" 
                      : "text-slate-300 group-hover:text-slate-500"
                  )} />
                </button>
              ))
            )}
          </div>

          {/* Lote de Impressão Queue UI Panel */}
          <div className="bg-slate-900 text-white rounded-[24px] border border-slate-800 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#E59A18] animate-pulse" />
                <h3 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100">Lote de Impressão ({printQueue.length})</h3>
              </div>
              {printQueue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="text-[9px] font-black uppercase text-red-400 hover:text-red-500 hover:underline cursor-pointer transition-all"
                >
                  Limpar Fila
                </button>
              )}
            </div>

            {printQueue.length === 0 ? (
              <div className="py-2 text-center text-slate-400 text-[11px] font-bold space-y-2">
                <p className="leading-relaxed">Nenhuma credencial guardada neste lote.</p>
                <p className="text-[10px] font-medium text-slate-500">
                  Configure um portador ao lado e clique em <span className="text-indigo-400 font-bold">"Adicionar ao Lote"</span> para enfileirar e gerar tudo de uma vez.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {printQueue.map((item) => (
                    <div key={item.printId} className="flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-800 text-xs text-left">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate capitalize text-[11px]">{item.name}</p>
                        <p className="text-[8.5px] font-semibold text-[#E59A18] uppercase tracking-wider truncate">
                          {item.type === 'carteira' ? 'Carteira CR80' : 'Crachá Evento'} • {item.customRole}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(item.printId)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors rounded-lg cursor-pointer shrink-0"
                        title="Remover do lote"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handlePrintBatch}
                  className="w-full py-2.5 bg-[#E59A18] hover:bg-[#CF9E22] text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border-none"
                >
                  <Printer size={14} />
                  <span>Gerar e Imprimir Lote ({printQueue.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COL 2: CREDENTIAL GENERATOR (7 Colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMember ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Settings inputs (7 of 12 inside the selected portador panel) */}
              <div className="md:col-span-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2">
                  2. Configurar Propriedades
                </span>

                {/* Doc type toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider">Formato do Layout</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleSelectTab('carteira')}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        activeCredentialTab === 'carteira' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Carteira CR80
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('cracha')}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        activeCredentialTab === 'cracha' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Crachá Grande
                    </button>
                  </div>
                </div>

                {/* Template option toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider">Modelo da Credencial</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('classic')}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        selectedTemplate === 'classic' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Horizontal (Original)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('modern')}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        selectedTemplate === 'modern' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Vertical (Ondas Gold)
                    </button>
                  </div>
                </div>

                {/* Color presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider">Identidade Visual</label>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setThemeColorPreset('emerald')}
                      className={cn(
                        "w-7 h-7 rounded-full bg-emerald-600 border-2 cursor-pointer transition-all hover:scale-115 shadow-sm",
                        themeColorPreset === 'emerald' ? "border-slate-800 scale-110" : "border-emerald-100"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColorPreset('indigo')}
                      className={cn(
                        "w-7 h-7 rounded-full bg-indigo-600 border-2 cursor-pointer transition-all hover:scale-115 shadow-sm",
                        themeColorPreset === 'indigo' ? "border-slate-800 scale-110" : "border-indigo-100"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColorPreset('amber')}
                      className={cn(
                        "w-7 h-7 rounded-full bg-amber-500 border-2 cursor-pointer transition-all hover:scale-115 shadow-sm",
                        themeColorPreset === 'amber' ? "border-slate-800 scale-110" : "border-amber-100"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setThemeColorPreset('rose')}
                      className={cn(
                        "w-7 h-7 rounded-full bg-rose-600 border-2 cursor-pointer transition-all hover:scale-115 shadow-sm",
                        themeColorPreset === 'rose' ? "border-slate-800 scale-110" : "border-rose-100"
                      )}
                    />
                  </div>
                </div>

                {/* Upload Photo */}
                <div className="space-y-2.5">
                  <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Foto do Portador</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
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
                        <User className="text-slate-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-[10px] font-black uppercase text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-200 transition-all shadow-xs">
                        <Upload size={12} /> Carregar
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
                          className="ml-2 bg-red-50 text-red-600 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl hover:bg-red-100 cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
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

                {/* Role/Access edit */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Cargo ou Função</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['Trabalhador Voluntário', 'Membro Sócio', 'Coordenador Setorial', 'Membro Efetivo', 'Palestrante', 'Colaborador'].map(t => (
                        <button
                          key={t}
                          onClick={() => setCustomRole(t)}
                          className="text-[8px] font-black uppercase px-1.5 py-1 bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Área / Setor Autorizado</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={customAccessLevel}
                      onChange={(e) => setCustomAccessLevel(e.target.value)}
                    />
                  </div>

                  {activeCredentialTab === 'carteira' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Data de Validade</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        placeholder="31/12/2026"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Nome do Evento</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={customEventName}
                          onChange={(e) => setCustomEventName(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {['Seminário CEMIL', 'Mocidade Espírita 2026', 'Congresso Espírita', 'Oficinas de Passe', 'Palestra Doutrinária', 'Evangelização Infantil'].map(ev => (
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
                                "text-[9px] font-black uppercase px-2 py-1 rounded transition-all cursor-pointer border",
                                customEventName === ev 
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs" 
                                  : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700"
                              )}
                            >
                              {ev}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] pl-1 font-black uppercase text-slate-500 tracking-wider block">Datas / Período</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={customEventDate}
                          onChange={(e) => setCustomEventDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right preview columns and buttons */}
              <div className="md:col-span-6 flex flex-col items-center justify-between space-y-6">
                <div className="w-full flex-grow flex flex-col items-center justify-center p-4 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner min-h-[360px]">
                  
                  {/* Card Side Toggle Pill */}
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => setCardSide('frente')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer",
                        cardSide === 'frente' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Frente (Identificação)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSide('verso')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer",
                        cardSide === 'verso' ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Verso (Instruções/Saúde)
                    </button>
                  </div>

                  {cardSide === 'verso' ? (
                    /* VERSO (BACK SIDE) PREVIEW VIEW */
                    activeCredentialTab === 'carteira' ? (
                      <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-[210px] h-[333px] border border-slate-200 text-left flex flex-col justify-between p-3.5 animate-fade-in">
                        <div className="space-y-1.5 border-b border-slate-200 pb-2">
                          <span className="text-[5px] font-black uppercase text-indigo-900 tracking-wider block">SOCIEDADE ESPÍRITA MIRANTE DE LUZ</span>
                          <p className="text-[7.5px] font-black text-slate-800 uppercase leading-tight">CARTÃO DE VOLUNTÁRIO / TRABALHADOR</p>
                          <p className="text-[4.5px] text-slate-500 font-medium leading-tight">CNPJ: 12.345.678/0001-90 • Sede Institucional CEMIL</p>
                        </div>

                        <div className="space-y-2 py-2 flex-grow">
                          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[5px] font-black uppercase text-slate-500 block">DADOS DE SAÚDE E EMERGÊNCIA</span>
                            <div className="grid grid-cols-2 gap-1 text-[5px] font-bold text-slate-700">
                              <div><span className="text-slate-400">TIPO SANGUÍNEO:</span> <span className="text-red-600 font-black">{selectedMember.bloodType || 'N/I'}</span></div>
                              <div><span className="text-slate-400">ALERGIAS:</span> <span>{selectedMember.allergies || 'Nenhuma'}</span></div>
                              <div className="col-span-2 truncate"><span className="text-slate-400">CONTATO:</span> <span>{selectedMember.emergencyContact || selectedMember.phone || '(11) 99999-8888'}</span></div>
                            </div>
                          </div>

                          <div className="space-y-1 text-[4.5px] text-slate-500 leading-normal">
                            <span className="font-black text-indigo-950 uppercase block text-[5px]">NORMAS DE UTILIZAÇÃO</span>
                            <p>1. Uso obrigatório e pessoal durante atividades voluntárias na Casa Espírita.</p>
                            <p>2. Em caso de perda ou desligamento, devolva à secretaria unificada.</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[4px] font-black text-slate-400 block uppercase">VALIDADE</span>
                            <span className="text-[6px] font-black text-slate-800 block">{customExpiryDate}</span>
                          </div>
                          <div className="bg-white p-1 rounded border border-slate-200">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                              alt="Scan QR Verso"
                              className="w-[28px] h-[28px] object-contain block"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-[210px] h-[295px] border border-slate-200 text-left flex flex-col justify-between p-4 animate-fade-in">
                        <div className="space-y-1 border-b border-indigo-900/20 pb-2 text-center">
                          <span className="text-[6px] font-black uppercase text-indigo-900 tracking-wider block">PROGRAMAÇÃO OFICIAL DO EVENTO</span>
                          <h4 className="text-[9px] font-black text-[#E59A18] uppercase leading-tight">{customEventName}</h4>
                          <p className="text-[5px] text-slate-500 font-bold">{customEventDate}</p>
                        </div>

                        <div className="space-y-1.5 py-2 text-[5.5px] text-slate-700">
                          <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <span className="font-black text-indigo-900 w-8 shrink-0">08:30</span>
                            <span className="font-semibold">Recepção & Acolhimento Fraterno</span>
                          </div>
                          <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <span className="font-black text-indigo-900 w-8 shrink-0">09:00</span>
                            <span className="font-semibold">Abertura com Prece e Leitura</span>
                          </div>
                          <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <span className="font-black text-indigo-900 w-8 shrink-0">10:30</span>
                            <span className="font-semibold">Painel Temático & Atividades</span>
                          </div>
                          <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                            <span className="font-black text-indigo-900 w-8 shrink-0">12:00</span>
                            <span className="font-semibold">Encerramento & Confraternização</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2 text-center space-y-0.5">
                          <p className="text-[5px] font-black text-slate-400 uppercase">MANTENHA SEU CRACHÁ EM LOCAL VISÍVEL</p>
                          <p className="text-[4.5px] text-slate-400 font-medium">Sociedade Espírita Mirante de Luz • CEMIL</p>
                        </div>
                      </div>
                    )
                  ) : activeCredentialTab === 'carteira' ? (
                    selectedTemplate === 'modern' ? (
                      /* VERTICAL MODERN CARTEIRINHA FRONT AND VERSO PREVIEW */
                      <div className="space-y-4 w-full flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A]">Frente da Carteirinha (Premium Ondas)</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-[210px] h-[333px] border border-slate-200 text-left flex flex-col justify-between">
                          
                          {/* Wavy Header Background */}
                          <div className="absolute top-0 left-0 w-full h-[110px] overflow-hidden">
                            <svg viewBox="0 0 540 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
                              <path d="M0 0H540V120C540 120 400 200 270 190C140 180 0 210 0 210V0Z" fill="url(#blue-grad-preview)" />
                              <path d="M0 210C0 210 140 180 270 190C400 200 540 120 540 120V126C540 126 400 205 270 195C140 185 0 215 0 215V210Z" fill="#CF9E22" />
                              <defs>
                                <linearGradient id="blue-grad-preview" x1="0" y1="0" x2="540" y2="220" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#0A2E5C" />
                                  <stop offset="1" stopColor="#1e40af" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* Top Headers content over wave */}
                          <div className="relative z-10 flex items-center p-3 gap-1.5 pt-4">
                            <div className="w-[32px] h-[35px] shrink-0">
                              <CemilLogo variant="full" showBackground={false} size="100%" sunColor="#E59A18" pyramidColor="#FFFFFF" textColorPrimary="#FFFFFF" textColorSecondary="#E59A18" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="font-sans font-black text-[5.5px] leading-tight text-white tracking-widest uppercase">CENTRO ESPÍRITA</span>
                              <span className="font-sans font-black text-[7.5px] leading-tight text-[#E59A18] tracking-normal uppercase">MIRANTE DE LUZ</span>
                            </div>
                          </div>

                          {/* Photo Container & Name Details in the Middle */}
                          <div className="relative z-10 flex items-center px-3 gap-3 flex-grow mt-6">
                            {/* Profile Photo */}
                            <div className="p-[1.5px] bg-[#0A2E5C] rounded-md shrink-0 shadow-sm">
                              <div className="w-14 h-[72px] rounded-[3px] overflow-hidden flex items-center justify-center bg-white relative">
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
                                  <span className="text-lg font-bold text-[#0A2E5C]">
                                    {(selectedMember.name || "U").charAt(0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Name & Role Text Column */}
                            <div className="min-w-0 flex-grow text-left">
                              <h4 className="font-sans font-black text-[#0A2E5C] text-[10px] leading-snug uppercase break-all">
                                {selectedMember.name}
                              </h4>
                              <p className="text-[6.5px] font-black text-slate-500 uppercase mt-0.5 tracking-wide leading-none">
                                {customRole}
                              </p>
                            </div>
                          </div>

                          {/* Metadata Fine Grid box */}
                          <div className="relative z-10 px-3 mt-1 w-full">
                            <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 grid grid-cols-2 gap-1.5 shadow-3xs">
                              <div className="flex items-center gap-1 min-w-0">
                                <Contact size={10} className="text-[#0A2E5C] shrink-0" />
                                <div className="flex flex-col min-w-0 leading-none">
                                  <span className="text-[3px] font-black text-slate-400 uppercase leading-none">ID NO.</span>
                                  <span className="text-[5px] font-black text-slate-800 truncate leading-none mt-0.5">{formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 min-w-0">
                                <User size={10} className="text-[#0A2E5C] shrink-0" />
                                <div className="flex flex-col min-w-0 leading-none">
                                  <span className="text-[3px] font-black text-slate-400 uppercase leading-none">NASCIMENTO</span>
                                  <span className="text-[5px] font-black text-slate-800 truncate leading-none mt-0.5">{formatDateBR(selectedMember.birthDate)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 min-w-0">
                                <Phone size={10} className="text-[#0A2E5C] shrink-0" />
                                <div className="flex flex-col min-w-0 leading-none">
                                  <span className="text-[3px] font-black text-slate-400 uppercase leading-none">TELEFONE</span>
                                  <span className="text-[5px] font-black text-slate-800 truncate leading-none mt-0.5">{selectedMember.phone || "-"}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 min-w-0">
                                <Mail size={10} className="text-[#0A2E5C] shrink-0" />
                                <div className="flex flex-col min-w-0 leading-none">
                                  <span className="text-[3px] font-black text-slate-400 uppercase leading-none">E-MAIL</span>
                                  <span className="text-[5px] font-black text-slate-800 truncate leading-none mt-0.5 break-all">{selectedMember.email || "contato@mirantedeluz.org"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom decorative wave, signature and QR/Barcode */}
                          <div className="relative p-3 pb-2 mt-auto flex flex-col gap-1">
                            
                            {/* Bottom corner wave decoration */}
                            <div className="absolute bottom-0 left-0 w-full h-[50px] overflow-hidden pointer-events-none rounded-b-2xl">
                              <svg viewBox="0 0 540 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 w-full h-full animate-fade-in">
                                <path d="M0 150H220C220 150 150 90 80 100C0 110 0 150 0 150Z" fill="url(#blue-grad-bottom-pre)" />
                                <path d="M0 150C0 150 0 110 80 100C150 90 220 150 220 150" stroke="#CF9E22" strokeWidth="4" />
                                <defs>
                                  <linearGradient id="blue-grad-bottom-pre" x1="0" y1="150" x2="220" y2="90" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#0A2E5C" />
                                    <stop offset="1" stopColor="#1A365D" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>

                            <div className="relative z-10 flex justify-between items-end w-full">
                              {/* Assinatura */}
                              <div className="flex flex-col items-start leading-none pl-2">
                                <span className="font-signature text-white text-[13px] mb-[-2.5px] animate-fade-in animate-duration-300">Sign</span>
                                <div className="w-[58px] h-[0.5px] bg-white/45 mb-1"></div>
                                <span className="text-[3.5px] font-black text-white/80 uppercase tracking-widest">ASSINATURA</span>
                              </div>

                              {/* Small QR Code check-in */}
                              <div className="bg-white p-[1.5px] rounded border border-slate-200 shadow-3xs z-20">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                                  alt="Check QR"
                                  referrerPolicy="no-referrer"
                                  className="w-[30px] h-[30px] object-contain block"
                                />
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* CARD VERSO (BACK) PREVIEW */}
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A] pt-2">Verso da Carteirinha (Termos)</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-[210px] h-[333px] border border-slate-200 text-left flex flex-col justify-between">
                          
                          {/* Wave Back Background Header */}
                          <div className="absolute top-0 left-0 w-full h-[90px] overflow-hidden">
                            <svg viewBox="0 0 540 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-[full]">
                              <path d="M0 0H540V110C540 110 400 160 270 150C140 140 0 170 0 170V0Z" fill="url(#blue-grad-back-pre)" />
                              <path d="M0 170C0 170 140 140 270 150C400 160 540 110 540 110V115C540 115 400 165 270 155C140 145 0 175 0 175V170Z" fill="#CF9E22" />
                              <defs>
                                <linearGradient id="blue-grad-back-pre" x1="0" y1="0" x2="540" y2="180" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#0A2E5C" />
                                  <stop offset="1" stopColor="#1e40af" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* Top Title */}
                          <div className="relative z-10 flex justify-between items-center p-3 pt-5 w-full">
                            <div className="w-[28px] h-[30px] shrink-0">
                              <CemilLogo variant="full" showBackground={false} size="100%" sunColor="#E59A18" pyramidColor="#FFFFFF" textColorPrimary="#FFFFFF" textColorSecondary="#E59A18" />
                            </div>
                            <div className="text-right">
                              <span className="font-sans font-black text-[7px] text-white tracking-wider block">TERMOS E</span>
                              <span className="font-sans font-black text-[7px] text-[#E59A18] tracking-wider block leading-none">CONDIÇÕES</span>
                            </div>
                          </div>

                          {/* Terms Text Middle Area */}
                          <div className="relative z-10 px-3.5 space-y-2 mt-8 flex-grow flex flex-col justify-center">
                            <div className="flex items-start gap-1.5">
                              <div className="w-3.5 h-3.5 bg-[#0A2E5C] text-white rounded-full flex items-center justify-center font-bold text-[5.5px] scale-90 shrink-0 mt-0.5">✓</div>
                              <p className="text-[4.5px] text-slate-600 leading-normal font-bold">
                                O uso desta credencial é obrigatório para identificação e controle de acesso no Mirante de Luz.
                              </p>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-3.5 h-3.5 bg-[#0A2E5C] text-white rounded-full flex items-center justify-center font-bold text-[5.5px] scale-90 shrink-0 mt-0.5">✓</div>
                              <p className="text-[4.5px] text-slate-600 leading-normal font-bold">
                                Identifica voluntário ativo e autoriza circulação nos setores de acesso: <strong className="text-[#0A2E5C]">{customAccessLevel}</strong>.
                              </p>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-3.5 h-3.5 bg-[#0A2E5C] text-white rounded-full flex items-center justify-center font-bold text-[5.5px] scale-90 shrink-0 mt-0.5">✓</div>
                              <p className="text-[4.5px] text-slate-600 leading-normal font-bold">
                                Este cartão constituí propriedade do CEMIL. Em caso de perda, notifique imediatamente a adm.
                              </p>
                            </div>
                          </div>

                          {/* Medical emergencies */}
                          <div className="relative z-10 mx-3 py-1 border-t border-b border-dashed border-slate-200 text-left">
                            <span className="text-[5.5px] text-red-600 font-extrabold uppercase block mb-0.5">Ficha de Emergência Médica</span>
                            <div className="grid grid-cols-2 gap-x-1.5 text-[4.5px] text-slate-500 font-extrabold leading-tight">
                              <div>SANGUE: <span className="text-slate-800 font-black">{selectedMember.bloodType || 'N/I'}</span></div>
                              <div>ALERGIAS: <span className="text-slate-800 font-black truncate inline-block max-w-[45px]">{selectedMember.allergies || 'Nenhuma'}</span></div>
                              <div className="col-span-2">CONTATOS: <span className="text-slate-800 font-black leading-none">{selectedMember.emergencyContact || 'Central CEMIL'}</span></div>
                            </div>
                          </div>

                          {/* Bottom Admissão & Expiração Dates / Director Sign */}
                          <div className="relative z-10 p-3 flex justify-between items-end mt-auto bg-white/70">
                            <div className="flex flex-col gap-1 text-left">
                              <div className="flex items-center gap-1">
                                <Clock size={8} className="text-[#0A2E5C]" />
                                <div className="flex flex-col">
                                  <span className="text-[2.8px] font-black text-slate-400 uppercase leading-none">ADMISSÃO</span>
                                  <span className="text-[4.5px] font-black text-slate-700 leading-none mt-0.5">
                                    {formatDateBR(selectedMember.registrationDate || Date.now())}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={8} className="text-[#0A2E5C]" />
                                <div className="flex flex-col">
                                  <span className="text-[2.8px] font-black text-slate-400 uppercase leading-none">EXPIRAÇÃO</span>
                                  <span className="text-[4.5px] font-black text-slate-700 leading-none mt-0.5">{customExpiryDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-center leading-none pr-1">
                              <span className="font-serif italic text-[#1e293b] text-[9.5px] mb-[-2px]">Sign</span>
                              <div className="w-[58px] h-[0.5px] bg-slate-400 mb-0.5"></div>
                              <span className="text-[3.5px] font-black text-slate-500 uppercase tracking-widest">DIRETOR</span>
                            </div>
                          </div>

                          {/* Solid footer bar */}
                          <div className="h-1.5 w-full bg-[#0A2E5C] border-t border-[#CF9E22] shrink-0" />

                        </div>
                      </div>
                    ) : (
                      /* ORIGINAL CLASSIC CARTEIRINHA FRONT PREVIEW */
                      <div className="space-y-4 w-full flex flex-col items-center animate-fade-in">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A]">Frente da Carteirinha (Padrão Oficial)</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-full max-w-[310px] h-[196px] border border-slate-200 text-left flex">
                          {/* LEFT BLUE COLUMN */}
                          <div className="w-[32%] bg-[#0A2E5C] text-white p-2 flex flex-col justify-between items-center text-center relative border-r border-[#0A2E5C]/10 h-full">
                            {/* Symbol logo with gold and white */}
                            <div className="w-[44px] h-[48px] mt-0.5 flex items-center justify-center shrink-0">
                              <CemilLogo variant="full" showBackground={false} size="100%" sunColor="#E59A18" pyramidColor="#FFFFFF" textColorPrimary="#FFFFFF" textColorSecondary="#E59A18" />
                            </div>

                            {/* Center Balanced Section to improve the empty space */}
                            <div className="my-auto flex flex-col items-center justify-center py-1 gap-0.5 shrink-0">
                              <div className="h-[0.5px] w-8 bg-white/20"></div>
                              {selectedMember.bloodType ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-[5px] font-black text-slate-350 tracking-wider">SANGUE</span>
                                  <span className="text-[9.5px] font-black text-[#E59A18] font-mono leading-none mt-0.5">{selectedMember.bloodType}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-[4.5px] font-black text-slate-350 tracking-normal block leading-none">VOLUNTÁRIO</span>
                                  <span className="text-[7px] font-black text-[#E59A18] mt-0.5 tracking-tighter leading-none">★★★</span>
                                </div>
                              )}
                              <div className="h-[0.5px] w-8 bg-white/20"></div>
                            </div>
                            
                            {/* Vertical / Bottom aligned text */}
                            <div className="space-y-0.5 pb-2 shrink-0">
                              <h4 className="font-sans font-black text-[6.5px] leading-tight tracking-wider uppercase text-[#E59A18]">
                                CARTEIRA DE VOLUNTÁRIO
                              </h4>
                              <p className="text-[4px] text-slate-300 font-extrabold uppercase leading-none tracking-tight">
                                Centro Espírita Mirante de Luz
                              </p>
                            </div>
                          </div>

                          {/* RIGHT LIGHT COLUMN */}
                          <div className="flex-1 bg-[#FBFBFA] p-3 flex flex-col items-center justify-between relative">
                            {/* Gold & Blue double bordered Photo */}
                            <div className="relative mt-0.5">
                              <div className="p-[1.5px] bg-[#CF9E22] rounded-md">
                                <div className="p-[1.5px] bg-[#0A2E5C] rounded-[4px]">
                                  <div className="w-14 h-18 rounded-[3px] overflow-hidden flex items-center justify-center bg-white shrink-0 relative">
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
                                      <span className="text-xl font-bold text-[#0A2E5C]">
                                        {(selectedMember.name || "U").charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Member’s Name */}
                            <div className="text-center w-full mt-1">
                              <h4 className="font-sans font-black text-[#0A2E5C] text-[11px] leading-none truncate capitalize max-w-[170px] mx-auto">
                                {selectedMember.name}
                              </h4>
                            </div>

                            {/* Role capsule banner / pill */}
                            <div className="mt-0.5">
                              <span className="inline-block bg-[#CF9E22] text-white text-[6.5px] font-sans font-black uppercase px-2.5 py-0.5 rounded-xs shadow-2xs tracking-widest leading-none">
                                {customRole.toUpperCase()}
                              </span>
                            </div>

                            {/* Fine metadata grid / table */}
                            <div className="w-full mt-1.5 border border-[#0A2E5C]/20 rounded-[3px] grid grid-cols-3 divide-x divide-[#0A2E5C]/20 bg-white shadow-3xs overflow-hidden">
                              <div className="py-1 px-0.5 text-center flex flex-col justify-center min-w-0">
                                <span className="text-[3.8px] font-black text-slate-400 block uppercase leading-none mb-0.5">REGISTRO</span>
                                <span className="text-[5.5px] font-black text-slate-800 truncate block leading-none">{formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</span>
                              </div>
                              <div className="py-1 px-0.5 text-center flex flex-col justify-center min-w-0">
                                <span className="text-[3.8px] font-black text-slate-400 block uppercase leading-none mb-0.5">NASCIMENTO</span>
                                <span className="text-[5.5px] font-black text-slate-800 block leading-none">{formatDateBR(selectedMember.birthDate)}</span>
                              </div>
                              <div className="py-1 px-0.5 text-center flex flex-col justify-center min-w-0">
                                <span className="text-[3.8px] font-black text-slate-400 block uppercase leading-none mb-0.5">ADMISSÃO</span>
                                <span className="text-[5.5px] font-black text-slate-800 block leading-none">
                                  {formatDateBR(selectedMember.registrationDate || Date.now())}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BACK PREVIEW */}
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A] pt-2">Verso da Carteirinha</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-full max-w-[310px] h-[196px] border border-slate-200 text-left flex flex-col justify-between">
                          <div className="h-1.5 w-full bg-[#0A2E5C]" />
                          <div className="p-3 flex items-center gap-3 flex-grow">
                            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-150 shrink-0 shadow-2xs">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                                alt="Scan QR"
                                referrerPolicy="no-referrer"
                                className="w-[48px] h-[48px] object-contain block"
                              />
                              <span className="text-[3.5px] text-slate-400 font-extrabold uppercase mt-1">Check-in Portaria</span>
                            </div>

                            <div className="flex-grow flex flex-col justify-between h-full py-0.5">
                              <div className="space-y-1">
                                <h5 className="font-extrabold text-[7.5px] text-[#0A2E5C]">Instruções Administrativas</h5>
                                <p className="text-[4.5px] text-slate-500 leading-normal font-medium">
                                  Esta credencial é de uso pessoal e intransferível, identificando o portador como membro/voluntário ativo do CEMIL. Em caso de perda, comunique à recepção.
                                </p>
                                <p className="text-[4.5px] font-extrabold text-[#CF9E22]">Setores Autorizados: {customAccessLevel}</p>
                              </div>

                              {/* Emergency Medical Box */}
                              <div className="border-t border-dashed border-slate-200 pt-1 mt-1 shrink-0">
                                <div className="text-[5.5px] font-black text-red-650 uppercase leading-none mb-0.5 tracking-wider">Ficha de Emergência Médica</div>
                                <div className="grid grid-cols-2 gap-x-1.5 text-[4.5px] font-bold text-slate-600 leading-normal">
                                  <div className="truncate"><span className="text-slate-400 font-extrabold uppercase">SANGUE:</span> {selectedMember.bloodType || 'N/I'}</div>
                                  <div className="truncate"><span className="text-slate-400 font-extrabold uppercase">ALERGIAS:</span> {selectedMember.allergies || 'Nenhuma'}</div>
                                  <div className="col-span-2 truncate"><span className="text-slate-400 font-extrabold uppercase">CONTATO:</span> {selectedMember.emergencyContact || 'Central CEMIL'}</div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[5.5px] font-black text-slate-400 border-t border-slate-100 pt-1 mt-0.5">
                                <span>VALIDADE: {customExpiryDate}</span>
                                <span className="text-[5px] text-[#0A2E5C] uppercase tracking-wider">CEMIL CRED</span>
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-[#CF9E22]" />
                        </div>
                      </div>
                    )
                  ) : (
                    selectedTemplate === 'modern' ? (
                      /* VERTICAL MODERN CRASHA PREVIEW */
                      <div className="space-y-4 w-full flex flex-col items-center animate-fade-in">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A]">Crachá de Evento (Premium Ondas Model 2)</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-[210px] h-[295px] border border-slate-200 text-left min-h-[295px] flex flex-col justify-between">
                          
                          {/* Wavy Background Image */}
                          <div className="absolute top-0 left-0 w-full h-[100px] overflow-hidden">
                            <svg viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
                              <path d="M0 0H540V220C540 220 400 300 270 290C140 280 0 310 0 310V0Z" fill="url(#blue-grad-cracha-pre)" />
                              <path d="M0 310C0 310 140 280 270 290C400 300 540 220 540 220V226C540 226 400 305 270 295C140 285 0 315 0 315V310Z" fill="#CF9E22" />
                              <defs>
                                <linearGradient id="blue-grad-cracha-pre" x1="0" y1="0" x2="540" y2="320" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#0A2E5C" />
                                  <stop offset="1" stopColor="#1E40AF" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* Top Lanyard space */}
                          <div className="w-[32px] h-[6px] rounded-lg border border-slate-200 bg-slate-100 mx-auto mt-2 z-20 relative"></div>

                          {/* Logo and Event details */}
                          <div className="relative z-10 text-center p-3 pt-0.5 space-y-0.5 text-white">
                            <div className="w-[26px] h-[28px] mx-auto mb-0.5">
                              <CemilLogo variant="full" showBackground={false} size="100%" sunColor="#E59A18" pyramidColor="#FFFFFF" textColorPrimary="#FFFFFF" textColorSecondary="#E59A18" />
                            </div>
                            <h4 className="font-extrabold text-[#E59A18] text-[8.5px] leading-tight truncate uppercase tracking-wider">{customEventName}</h4>
                            <p className="text-[5px] font-black tracking-widest uppercase text-white/95 leading-none">Credenciamento Oficial de Evento</p>
                          </div>

                          {/* Middle photo & user name zones */}
                          <div className="relative z-10 p-3 flex flex-col items-center justify-center flex-grow space-y-1.5 mt-2.5">
                            {/* Avatar double frames */}
                            <div className="p-[1.5px] bg-[#CF9E22] rounded-md shrink-0 shadow-sm">
                              <div className="p-[1.5px] bg-[#0A2E5C] rounded-[4px]">
                                <div className="w-11 h-14 rounded-[3px] overflow-hidden flex items-center justify-center bg-white relative">
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
                                    <span className="text-xl font-bold text-[#0A2E5C]">
                                      {(selectedMember.name || "U").charAt(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-center w-full">
                              <h4 className="font-sans font-black text-[#0A2E5C] text-[10px] leading-none truncate capitalize max-w-[160px] mx-auto">
                                {selectedMember.name}
                              </h4>
                              <div className="mt-1">
                                <span className="inline-block bg-[#CF9E22] text-white text-[5.5px] font-sans font-black uppercase px-2 py-0.5 rounded-sm tracking-widest leading-none">
                                  {customRole.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[5px] text-slate-400 font-extrabold uppercase mt-1">Setor de Acesso: {customAccessLevel}</p>
                            </div>
                          </div>

                          {/* Footer details with event info & QR Code */}
                          <div className="relative p-2.5 bg-white border-t border-slate-150 flex items-center justify-between mt-auto z-10 rounded-b-2xl">
                            <div className="space-y-0.5 text-left leading-none">
                              <span className="text-[4px] font-black uppercase text-slate-400 block pb-0.5">Data / Período</span>
                              <span className="text-[6.5px] font-black text-slate-800 block">{customEventDate}</span>
                              <span className="text-[5px] font-black text-[#0A2E5C] block pt-0.5">REGISTRO: {formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</span>
                            </div>
                            
                            <div className="bg-white p-0.5 rounded border border-slate-150 shadow-3xs">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                                alt="Scan QR Badge"
                                referrerPolicy="no-referrer"
                                className="w-[24px] h-[24px] object-contain block"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    ) : (
                      /* ORIGINAL CLASSIC CRASHA PREVIEW */
                      <div className="space-y-4 w-full flex flex-col items-center animate-fade-in">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0D2A4A]">Crachá de Identificação de Evento (3x4)</span>
                        <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-[#FBFBFA] w-full max-w-[230px] border border-slate-200 text-left min-h-[300px] flex flex-col justify-between">
                          {/* Event Banner */}
                          <div className="p-3 text-center bg-[#0A2E5C] space-y-1 shrink-0 relative border-b border-[#CF9E22]/60">
                            {/* Complete official logo floated on top */}
                            <div className="w-11 h-12 mx-auto mb-1">
                              <CemilLogo variant="full" showBackground={false} size="100%" sunColor="#E59A18" pyramidColor="#FFFFFF" textColorPrimary="#FFFFFF" textColorSecondary="#E59A18" />
                            </div>
                            <h4 className="font-extrabold text-[#E59A18] text-[10px] leading-tight truncate uppercase tracking-wider">{customEventName}</h4>
                            <p className="text-[5.5px] font-black tracking-widest uppercase text-white/90 leading-none">Credencial Oficial de Evento</p>
                          </div>

                          {/* Body section */}
                          <div className="p-3 flex flex-col items-center justify-center flex-grow space-y-2.5">
                            {/* Avatar */}
                            <div className="relative mt-1">
                              <div className="p-[1.5px] bg-[#CF9E22] rounded-md">
                                <div className="p-[1.5px] bg-[#0A2E5C] rounded-[4px]">
                                  <div className="w-14 h-18 rounded-[3px] overflow-hidden flex items-center justify-center bg-white shrink-0 relative">
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
                                      <span className="text-2xl font-black text-[#0A2E5C]">
                                        {(selectedMember.name || "U").charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Renders Text */}
                            <div className="text-center space-y-1 w-full">
                              <h3 className="text-[11px] font-sans font-black text-[#0A2E5C] capitalize leading-none truncate max-w-[160px] mx-auto">{selectedMember.name}</h3>
                              
                              <div className="inline-block mt-0.5">
                                <span className="text-[6.5px] font-black uppercase px-2.5 py-0.5 rounded-sm bg-[#CF9E22] text-white leading-none block shadow-3xs tracking-wider">
                                  {customRole.toUpperCase()}
                                </span>
                              </div>
                              
                              <p className="text-[5.5px] text-slate-400 font-extrabold uppercase tracking-wide">Setor de Acesso: {customAccessLevel}</p>
                            </div>
                          </div>

                          {/* Footer Info & QR Code */}
                          <div className="p-2.5 bg-white border-t border-slate-150 flex items-center justify-between">
                            <div className="space-y-0.5 text-left">
                              <span className="text-[5px] font-black uppercase text-slate-450 leading-none block">Período / Data</span>
                              <span className="text-[7.5px] font-black text-slate-800">{customEventDate}</span>
                              <span className="text-[5.5px] font-black text-[#0A2E5C] block">REGISTRO: {formatRegistrationCode(selectedMember.id, selectedMember.registrationDate)}</span>
                            </div>
                            
                            <div className="bg-white p-0.5 rounded-md border border-slate-150 shadow-3xs">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                                alt="Scan QR Badge"
                                referrerPolicy="no-referrer"
                                className="w-[28px] h-[28px] object-contain block"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                </div>

                {/* Print & Batch Buttons */}
                <div className="w-full grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Printer size={15} />
                    <span>Imprimir Pop-Up</span>
                  </button>

                  {printQueue.some(item => item.printId === `${selectedMember.id}-${activeCredentialTab}`) ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveFromQueue(`${selectedMember.id}-${activeCredentialTab}`)}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      title="Remover do Lote"
                    >
                      <Check size={15} className="text-yellow-300" />
                      <span>No Lote (Remover)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddToQueue}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Layers size={15} className="text-[#E59A18]" />
                      <span>Adicionar ao Lote</span>
                    </button>
                  )}

                  {/* NEW DIRECT IN-PAGE PRINT BUTTON (BYPASSES POPUP BLOCKERS) */}
                  <button
                    type="button"
                    onClick={() => setIsDirectPrintOpen(true)}
                    className="col-span-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Printer size={16} className="text-amber-400" />
                    <span>Impressão Direta A4 com Linhas de Corte (Sem Pop-Up)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl animate-bounce">
                <Contact size={32} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Visualizador em Tempo Real</h4>
                <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed">
                  Utilize o scanner de QR code no topo para ler cartões físicos ou selecione qualquer membro/portador voluntário na lista à esquerda para carregar o calibrador de credenciais CEMIL.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CHECK-IN SUCCESS TOAST BANNER */}
      <AnimatePresence>
        {checkInSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs"
          >
            <Check className="text-yellow-300" size={18} />
            <span>{checkInSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CAMERA QR SCANNER ACTION MODAL */}
      <AnimatePresence>
        {scannedParticipantModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                {scannedParticipantModal.photoUrl ? (
                  <img src={scannedParticipantModal.photoUrl} className="w-full h-full object-cover rounded-full" />
                ) : (
                  (scannedParticipantModal.name || 'U').charAt(0)
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Membro Localizado por QR Code</span>
                <h3 className="text-lg font-black text-slate-900">{scannedParticipantModal.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {scannedParticipantModal.isWorker ? 'Trabalhador Voluntário da Casa' : 'Participante / Assistido'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (!scannedParticipantModal) return;
                    await dataService.recordCheckIn({
                      participantId: scannedParticipantModal.id,
                      participantName: scannedParticipantModal.name,
                      sectorOrActivity: 'Portaria / Evento CEMIL',
                      role: scannedParticipantModal.isWorker ? 'VOLUNTARIO' : 'ATENDIDO',
                      status: 'PRESENTE',
                      timestamp: Date.now(),
                      method: 'QR_CODE'
                    });
                    setCheckInSuccessMessage(`Check-in de presença confirmado para ${scannedParticipantModal.name}!`);
                    setTimeout(() => setCheckInSuccessMessage(null), 4000);
                    setScannedParticipantModal(null);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Check size={16} />
                  <span>Registrar Presença / Check-In Instantâneo</span>
                </button>

                <button
                  onClick={() => {
                    handleSelectMember(scannedParticipantModal);
                    setScannedParticipantModal(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CreditCard size={16} />
                  <span>Carregar no Gerador de Credencial</span>
                </button>

                <button
                  onClick={() => setScannedParticipantModal(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DIRECT IN-PAGE A4 PRINT SHEET WITH CROP MARKS */}
      <AnimatePresence>
        {isDirectPrintOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-between p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
            {/* Top Bar (Hidden on print) */}
            <div className="w-full max-w-4xl bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center mb-4 shadow-xl print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="text-amber-400" size={20} />
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">Folha de Impressão A4 - Marcas de Corte & Guilhotina</h4>
                  <p className="text-[10px] text-slate-400">Layout de impressão direta sem dependência de janelas pop-up.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer size={15} /> Imprimir Folha A4
                </button>
                <button
                  onClick={() => setIsDirectPrintOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable A4 Sheet */}
            <div id="cemil-direct-print-sheet" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full text-slate-900 print:shadow-none print:border-none print:p-0 print:max-w-none">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #cemil-direct-print-sheet, #cemil-direct-print-sheet * {
                    visibility: visible !important;
                  }
                  #cemil-direct-print-sheet {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 210mm !important;
                    padding: 5mm !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 0mm;
                  }
                }
              `}</style>

              <div className="text-center border-b border-slate-300 pb-3 mb-6 print:mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block">SOCIEDADE ESPÍRITA MIRANTE DE LUZ</span>
                <h2 className="text-sm font-black text-slate-900 uppercase">LOTE OFICIAL DE CREDENCIAIS DE IDENTIFICAÇÃO</h2>
                <span className="text-[9px] text-slate-500 font-bold">
                  Folha A4 Padronizada • {printQueue.length > 0 ? `${printQueue.length} credencial(is) no lote` : '1 credencial selecionada'}
                </span>
              </div>

              {/* Cards Grid with Crop Marks */}
              <div className="grid grid-cols-2 gap-6 print:gap-4 justify-items-center">
                {(printQueue.length > 0 ? printQueue : (selectedMember ? [{
                  printId: selectedMember.id,
                  memberId: selectedMember.id,
                  name: selectedMember.name,
                  registrationDate: selectedMember.registrationDate,
                  birthDate: selectedMember.birthDate || '',
                  type: activeCredentialTab,
                  customRole,
                  customAccessLevel,
                  customEventName,
                  customEventDate,
                  customExpiryDate,
                  customPhoto,
                  photoScale,
                  photoShiftX,
                  photoShiftY,
                  photoRotate,
                  bloodType: selectedMember.bloodType || '',
                  allergies: selectedMember.allergies || '',
                  emergencyContact: selectedMember.emergencyContact || '',
                  phone: selectedMember.phone || '',
                  email: selectedMember.email || '',
                  selectedTemplate,
                }] : [])).map((item, idx) => (
                  <div key={item.printId || idx} className="relative p-2 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center">
                    {/* Corner Crop Marks (+) */}
                    <span className="absolute -top-1 -left-1 text-[10px] font-black text-slate-400 select-none">+</span>
                    <span className="absolute -top-1 -right-1 text-[10px] font-black text-slate-400 select-none">+</span>
                    <span className="absolute -bottom-1 -left-1 text-[10px] font-black text-slate-400 select-none">+</span>
                    <span className="absolute -bottom-1 -right-1 text-[10px] font-black text-slate-400 select-none">+</span>

                    {/* Card Preview */}
                    <div className="w-[210px] h-[320px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm p-3 flex flex-col justify-between text-left">
                      <div className="flex items-center gap-2 border-b border-indigo-900 pb-2">
                        <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-black">
                          {(item.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <span className="text-[6px] font-black uppercase text-indigo-900 block">CEMIL CRED</span>
                          <h4 className="text-[9px] font-black text-slate-900 truncate max-w-[140px]">{item.name}</h4>
                        </div>
                      </div>

                      <div className="my-2 flex gap-2 items-center">
                        <div className="w-12 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {item.customPhoto ? (
                            <img src={item.customPhoto} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-900">{(item.name || 'U').charAt(0)}</span>
                          )}
                        </div>
                        <div className="text-[7px] space-y-0.5">
                          <p className="font-black text-indigo-900 uppercase">{item.customRole}</p>
                          <p className="text-slate-500 font-bold">{item.customAccessLevel}</p>
                          <p className="text-[6px] text-slate-400 font-extrabold">REG: {formatRegistrationCode(item.memberId, item.registrationDate)}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-[6px]">
                        <span className="font-black text-slate-500">VAL: {item.customExpiryDate || '31/12/2026'}</span>
                        <span className="font-black text-indigo-900 uppercase">OFICIAL CEMIL</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
