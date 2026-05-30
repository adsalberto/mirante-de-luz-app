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
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from '../lib/utils';
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
      const [membersList, sectorsList] = await Promise.all([
        dataService.getParticipants(),
        dataService.getSectors()
      ]);
      const workersOnly = (membersList || []).filter(p => p.isWorker);
      setParticipants(workersOnly);
      setSectors(sectorsList || []);
    } catch (err) {
      console.error("Error loading credentials page database:", err);
    } finally {
      setLoading(false);
    }
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
  }, [isScanningQr, participants]);

  const handleSelectMember = (member: Participant) => {
    setSelectedMember(member);
    setThemeColorPreset('emerald');
    setCustomRole('Trabalhador Voluntário');
    setCustomAccessLevel('Geral / Multi-Setores');
    setCustomPhoto(null);
    setPhotoScale(100);
    setPhotoShiftX(0);
    setPhotoShiftY(0);
    setPhotoRotate(0);
  };

  // Filter list of participants/workers
  const filteredParticipants = participants.filter(p => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (p.id && String(p.id).toLowerCase().includes(searchQuery.toLowerCase())) ||
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

    const themeColor = themeColorPreset === 'emerald' ? '#059669' : themeColorPreset === 'amber' ? '#f59e0b' : themeColorPreset === 'rose' ? '#e11d48' : '#4f46e5';
    const themeBg = themeColorPreset === 'emerald' ? '#ecfdf5' : themeColorPreset === 'amber' ? '#fffbeb' : themeColorPreset === 'rose' ? '#fff1f2' : '#f5f3ff';
    
    const rDate = selectedMember.registrationDate ? new Date(selectedMember.registrationDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const bDate = selectedMember.birthDate || '-';
    const qrData = encodeURIComponent(`${window.location.origin}${window.location.pathname}?assistidoId=${selectedMember.id}`);
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
    
    const transformStyle = `transform: scale(${photoScale / 100}) translate(${photoShiftX}px, ${photoShiftY}px) rotate(${photoRotate}deg); transform-origin: center center;`;
    const photoHtml = customPhoto 
      ? `<img src="${customPhoto}" style="width: 100%; height: 100%; object-fit: cover; ${transformStyle}" />`
      : `<div style="width: 100%; height: 100%; background: ${themeBg}; color: ${themeColor}; font-size: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: 'Space Grotesk', sans-serif;">${(selectedMember.name || "U").charAt(0)}</div>`;

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
                  <div class="name">${selectedMember.name}</div>
                  <div class="badge-role" style="background: ${themeBg}; color: ${themeColor}; border: 0.5px solid ${themeColor}60;">
                    ${customRole.toUpperCase()}
                  </div>
                  <table class="data-table">
                    <tr>
                      <td><strong>REGISTRO:</strong> ${selectedMember.id}</td>
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
                  <div class="section-title">CARTEIRA DE VOLUNTÁRIO</div>
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
                <div class="badge-pname">${selectedMember.name}</div>
                
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
        <title>IMPRESSÃO - ${selectedMember.name}</title>
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
              1. Selecionar Trabalhador / Voluntário
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
              {filteredParticipants.length} Trabalhador(es)
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar trabalhador por nome, ID ou telefone..."
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
              <div className="py-12 text-center text-slate-400 text-xs font-bold">
                Nenhum trabalhador voluntário localizado com este filtro.
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-black bg-emerald-600">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate capitalize">{member.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ID: {member.id} • Trabalhador Voluntário
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
                      onClick={() => setActiveCredentialTab('carteira')}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                        activeCredentialTab === 'carteira' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      Carteira CR80
                    </button>
                    <button
                      onClick={() => setActiveCredentialTab('cracha')}
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
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Frente da Carteirinha</span>
                      <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-white w-full max-w-[280px] border border-slate-100 text-left">
                        <div className={cn(
                          "h-2 w-full",
                          themeColorPreset === 'emerald' ? "bg-emerald-600" :
                          themeColorPreset === 'indigo' ? "bg-indigo-600" :
                          themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                        )} />
                        
                        <div className="p-3 flex flex-col justify-between h-[160px]">
                          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                            <span className="text-[14px]">🕊️</span>
                            <div>
                              <h4 className="font-extrabold text-[9px] text-slate-800 leading-none">CEMIL</h4>
                              <p className="text-[5px] text-slate-400 font-extrabold uppercase tracking-tight">Centro Espírita Maria Imaculada de Luz</p>
                            </div>
                          </div>

                          <div className="flex gap-2.5 my-1 items-center">
                            {/* Photo area */}
                            <div className={cn(
                              "w-12 h-15 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border",
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
                                  "text-lg font-black",
                                  themeColorPreset === 'emerald' ? "text-emerald-700" :
                                  themeColorPreset === 'indigo' ? "text-indigo-700" :
                                  themeColorPreset === 'amber' ? "text-amber-700" : "text-rose-700"
                                )}>
                                  {(selectedMember.name || "U").charAt(0)}
                                </span>
                              )}
                            </div>

                            {/* Details Column */}
                            <div className="space-y-1 flex-1 overflow-hidden">
                              <h5 className="font-black text-slate-850 text-[10px] truncate capitalize leading-tight">
                                {selectedMember.name}
                              </h5>
                              <span className={cn(
                                "inline-block text-[5.5px] font-black uppercase px-1.5 py-0.5 rounded border leading-none",
                                themeColorPreset === 'emerald' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                themeColorPreset === 'indigo' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                themeColorPreset === 'amber' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {customRole}
                              </span>
                              
                              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 pt-0.5 text-[5.5px] text-slate-500 font-extrabold">
                                <p><strong className="text-slate-850">REG:</strong> {selectedMember.id}</p>
                                <p><strong className="text-slate-850">ADM:</strong> {new Date(selectedMember.registrationDate || Date.now()).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-slate-50 px-1.5 py-1 rounded-md border border-slate-100 text-[5px] font-black text-slate-400">
                            <span>TRABALHADOR VOLUNTÁRIO</span>
                            <span className="text-slate-500 uppercase">Espiritualidade e Paz</span>
                          </div>
                        </div>
                      </div>

                      {/* BACK PREVIEW */}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 pt-2">Verso da Carteirinha</span>
                      <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-white w-full max-w-[280px] border border-slate-100 text-left">
                        <div className="p-3 flex h-[160px] items-center gap-2.5">
                          <div className="flex flex-col items-center justify-center p-1.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                              alt="Scan QR"
                              referrerPolicy="no-referrer"
                              className="w-[50px] h-[50px] object-contain block"
                            />
                            <span className="text-[4px] text-slate-400 font-bold uppercase mt-1">Check-in Portaria</span>
                          </div>

                          <div className="flex-grow flex flex-col justify-between h-full py-0.5">
                            <div className="space-y-1">
                              <h5 className="font-extrabold text-[7.5px] text-slate-850">Instruções</h5>
                              <p className="text-[5px] text-slate-500 leading-tight">
                                Este documento oficial garante identificação integrada. Valide os acessos nas portarias e balcões de atendimento.
                              </p>
                              <p className="text-[5px] font-extrabold text-slate-700">Setor: {customAccessLevel}</p>
                            </div>

                             <div className="border-t border-slate-200 mt-2 pt-1 text-center">
                              <span className="text-[4.5px] text-slate-450 uppercase block font-semibold leading-none">VOLUNTÁRIO • ATIVIDADE INTEGRADA</span>
                            </div>

                            <div className="flex justify-between items-center text-[5.5px] font-black text-slate-400">
                              <span>VAL: {customExpiryDate}</span>
                              <span className="text-[5.5px] text-slate-350 uppercase">CEMIL CRED</span>
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "h-2 w-full",
                          themeColorPreset === 'emerald' ? "bg-emerald-600" :
                          themeColorPreset === 'indigo' ? "bg-indigo-600" :
                          themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                        )} />
                      </div>
                    </div>
                  ) : (
                    /* CRASHA PREVIEW */
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Crachá de Identificação de Evento (3x4)</span>
                      <div className="relative shadow-xl rounded-2xl overflow-hidden select-none bg-white w-full max-w-[240px] border border-slate-100 text-left min-h-[300px] flex flex-col justify-between">
                        {/* Event Banner */}
                        <div className={cn(
                          "p-2.5 text-center text-white space-y-0.5 shrink-0",
                          themeColorPreset === 'emerald' ? "bg-gradient-to-r from-emerald-600 to-emerald-700" :
                          themeColorPreset === 'indigo' ? "bg-gradient-to-r from-indigo-600 to-indigo-700" :
                          themeColorPreset === 'amber' ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-gradient-to-r from-rose-600 to-rose-700"
                        )}>
                          <h4 className="font-serif italic font-black text-xs leading-none truncate">{customEventName}</h4>
                          <p className="text-[6px] font-bold tracking-widest uppercase text-white/80 leading-none mt-0.5">Credencial Oficial CEMIL</p>
                        </div>

                        {/* Body section */}
                        <div className="p-4 flex flex-col items-center justify-center flex-grow space-y-2.5">
                          {/* Avatar */}
                          <div className={cn(
                            "w-16 h-20 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-100 shrink-0",
                            themeColorPreset === 'emerald' ? "bg-emerald-50/50" :
                            themeColorPreset === 'indigo' ? "bg-indigo-50/50" :
                            themeColorPreset === 'amber' ? "bg-amber-50/50" : "bg-rose-50/50"
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
                                "text-3xl font-black",
                                themeColorPreset === 'emerald' ? "text-emerald-700" :
                                themeColorPreset === 'indigo' ? "text-indigo-700" :
                                themeColorPreset === 'amber' ? "text-amber-700" : "text-rose-700"
                              )}>
                                {(selectedMember.name || "U").charAt(0)}
                              </span>
                            )}
                          </div>

                          {/* Renders Text */}
                          <div className="text-center space-y-1 w-full">
                            <h3 className="text-xs font-black text-slate-800 capitalize leading-none truncate">{selectedMember.name}</h3>
                            
                            <div className="inline-block">
                              <span className={cn(
                                "text-[7.5px] font-black uppercase px-2.5 py-0.5 rounded-full text-white leading-none block",
                                themeColorPreset === 'emerald' ? "bg-emerald-600" :
                                themeColorPreset === 'indigo' ? "bg-indigo-600" :
                                themeColorPreset === 'amber' ? "bg-amber-500" : "bg-rose-600"
                              )}>
                                {customRole}
                              </span>
                            </div>
                            
                            <p className="text-[6.5px] text-slate-400 font-extrabold uppercase tracking-wide">Setor: {customAccessLevel}</p>
                          </div>
                        </div>

                        {/* Footer Info & QR Code */}
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[6px] font-black uppercase text-slate-400 leading-none block">Data Evento</span>
                            <span className="text-[9px] font-black text-slate-700">{customEventDate}</span>
                            <span className="text-[6.5px] font-bold text-slate-500 block">ID: {selectedMember.id}</span>
                          </div>
                          
                          <div className="bg-white p-0.5 rounded-lg border border-slate-150">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + window.location.pathname + "?assistidoId=" + selectedMember.id)}`}
                              alt="Scan QR Badge"
                              referrerPolicy="no-referrer"
                              className="w-[32px] h-[32px] object-contain block"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Print button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Printer size={18} />
                  <span>Gerar e Imprimir Documento</span>
                </button>
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
