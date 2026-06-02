import React, { useEffect, useState, useRef } from 'react';
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
  Layers,
  Trash2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cn, formatRegistrationCode } from '../lib/utils';
import { CemilLogo } from '../components/CemilLogo';
import { dataService } from '../services/dataService';
import { Participant, Sector } from '../types';

export default function CredentialsPage() {
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
      const [membersList, sectorsList, workersList] = await Promise.all([
        dataService.getParticipants(),
        dataService.getSectors(),
        dataService.getWorkers()
      ]);

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
                if (activeCredentialTab === 'carteira' && !matched.isWorker) {
                  alert("⚠️ Este participante foi localizado, mas não é um Membro da Equipe da Casa registrado. A Carteira de Voluntário é restrita.");
                  return;
                }
                handleSelectMember(matched);
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
    setThemeColorPreset(member.isWorker ? 'indigo' : 'emerald');
    setCustomRole(member.isWorker ? 'Trabalhador Voluntário' : 'Participante / Assistido');
    setCustomAccessLevel(member.isWorker ? 'Geral / Multi-Setores' : 'Acesso Geral');
    setCustomPhoto(member.photoUrl || null);
    setPhotoScale(100);
    setPhotoShiftX(0);
    setPhotoShiftY(0);
    setPhotoRotate(0);
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
    
    const rDate = selectedMember.registrationDate ? new Date(selectedMember.registrationDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const bDate = selectedMember.birthDate || '-';
    const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${selectedMember.id}`);
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
    
    const transformStyle = `transform: scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg); transform-origin: center center;`;
    const photoHtml = customPhoto 
      ? `<img src="${customPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
      : `<div style="width: 100%; height: 100%; background: #0A2E5C20; color: #0A2E5C; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(selectedMember.name || "U").charAt(0)}</div>`;

    const bloodType = selectedMember.bloodType || '';
    const allergies = selectedMember.allergies || '';
    const emergencyContact = selectedMember.emergencyContact || '';

    let elementHtml = '';

    if (type === 'carteira') {
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

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IMPRESSÃO - ${selectedMember.name}</title>
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
    };

    // Check if duplicate
    const exists = printQueue.some(item => item.printId === newItem.printId);
    if (exists) {
      alert("Esta credencial já foi guardada no lote de impressão atual!");
      return;
    }

    setPrintQueue(prev => [...prev, newItem]);
  };

  const handleRemoveFromQueue = (printId: string) => {
    setPrintQueue(prev => prev.filter(item => item.printId !== printId));
  };

  const handleClearQueue = () => {
    if (window.confirm("Deseja realmente limpar todo o lote de impressão atual?")) {
      setPrintQueue([]);
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
        emergencyContact: itemEmergency
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
    });

    printWin.document.write(`
      <html>
      <head>
        <title>IMPRESSÃO EM LOTE - CEMIL</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=Space+Grotesk:wght@500;700;900&family=JetBrains+Mono:wght@700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
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
        <div>
          <h1 className="text-3xl font-black text-slate-850 tracking-tight flex items-center gap-2.5">
            <CreditCard size={32} className="text-indigo-650" />
            Central de Credenciamento
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            Gere carteirinhas de sócios, crachás de eventos, ou escaneie códigos QR para checagem rápida.
          </p>
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
                  
                  {activeCredentialTab === 'carteira' ? (
                    /* CARTEIRINHA FRONT PREVIEW */
                    <div className="space-y-4 w-full flex flex-col items-center">
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
                              <span className="text-[5.5px] font-black text-slate-800 block leading-none">{selectedMember.birthDate || "-"}</span>
                            </div>
                            <div className="py-1 px-0.5 text-center flex flex-col justify-center min-w-0">
                              <span className="text-[3.8px] font-black text-slate-400 block uppercase leading-none mb-0.5">ADMISSÃO</span>
                              <span className="text-[5.5px] font-black text-slate-800 block leading-none">
                                {new Date(selectedMember.registrationDate || Date.now()).toLocaleDateString('pt-BR')}
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
                  ) : (
                    /* CRASHA PREVIEW */
                    <div className="space-y-4 w-full flex flex-col items-center">
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
                    <span>Imprimir Individual</span>
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
    </div>
  );
}
