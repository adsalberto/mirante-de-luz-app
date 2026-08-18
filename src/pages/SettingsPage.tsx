import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Users,
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Mail,
  UserCircle,
  X,
  Pencil,
  Lock,
  Search,
  ArrowLeft,
  Heart,
  FileText,
  Printer,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Headphones,
  ShoppingBag,
} from "lucide-react";
import { dataService } from "../services/dataService";
import {
  Worker,
  WorkerStatus,
  WORKER_STATUS_LABELS,
  Sector,
  UserRole,
  SectorType,
  SECTOR_TYPE_LABELS,
  formatSectorName,
} from "../types";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { ImageUpload } from "../components/ImageUpload";
import { useNavigate, useLocation } from "react-router-dom";

const getRemainingTempTimeLabel = (expiry: number) => {
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return "";
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  return `${diffHours}h`;
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, registerWorker } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [isAddingSector, setIsAddingSector] = useState(false);
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [workerPassword, setWorkerPassword] = useState("");
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);
  const [hasTempPermission, setHasTempPermission] = useState(false);
  const [tempRole, setTempRole] = useState<UserRole>("SECRETARIO");
  const [tempDurationValue, setTempDurationValue] = useState<number>(1);
  const [tempDurationUnit, setTempDurationUnit] = useState<'hours' | 'days'>("days");

  const [searchTerm, setSearchTerm] = useState("");
  const [workerFilter, setWorkerFilter] = useState<'all' | 'active' | 'pending' | 'afastado' | 'em_formacao' | 'desligado'>('all');

  // Modal de Limpeza para Produção
  const [isCleanProductionModalOpen, setIsCleanProductionModalOpen] = useState(false);
  const [isCleaningProgress, setIsCleaningProgress] = useState(false);
  const [cleaningResult, setCleaningResult] = useState<{
    clearedCollections: string[];
    preservedWorkers: string[];
    removedWorkersCount: number;
    audiobooksPreservedCount: number;
    productsPreservedCount: number;
  } | null>(null);

  const handleCleanProduction = async () => {
    setIsCleaningProgress(true);
    try {
      const res = await dataService.cleanSystemForProduction();
      setCleaningResult(res);
      await loadData();
    } catch (err: any) {
      alert("Erro ao realizar limpeza: " + (err.message || String(err)));
    } finally {
      setIsCleaningProgress(false);
    }
  };

  const [selectedWorkerForTerm, setSelectedWorkerForTerm] = useState<Worker | null>(null);
  const [termDate, setTermDate] = useState("");
  const [termWorkerData, setTermWorkerData] = useState({
    cpf: "",
    rg: "",
    address: "",
    cep: "",
    neighborhood: "",
    city: "Salvador",
    profession: "",
    nationality: "brasileira",
  });

  const formatDateToPortuguese = (timestamp?: number) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    const day = date.getDate();
    const monthNames = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const handleOpenTermModal = (w: Worker) => {
    setSelectedWorkerForTerm(w);
    setTermDate(formatDateToPortuguese(w.termAcceptedAt || w.createdAt));
    setTermWorkerData({
      cpf: w.cpf || "",
      rg: w.rg || "",
      address: w.address || "",
      cep: w.cep || "",
      neighborhood: w.neighborhood || "",
      city: w.city || "Salvador",
      profession: w.profession || "",
      nationality: w.nationality || "brasileira",
    });
  };

  const handleSaveAndPrintTerm = async () => {
    if (!selectedWorkerForTerm) return;
    try {
      const updatedWorker = {
        ...selectedWorkerForTerm,
        ...termWorkerData,
      };
      await dataService.updateWorker(updatedWorker);
      
      setWorkers(prev => prev.map(w => w.id === selectedWorkerForTerm.id ? updatedWorker : w));
      
      const printWin = window.open("", "_blank");
      if (!printWin) {
        alert("Por favor, permita pop-ups para que o sistema de impressão integrada funcione.");
        return;
      }
      
      const elementHtml = `
        <div class="contract-container">
          <div class="brand-header">
            <div class="brand-left">
              <svg width="190" height="190" viewBox="0 0 340 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Sun Emblem Central Concentric Circles & Dot -->
                <g transform="translate(0, -10)">
                  <circle cx="170" cy="115" r="32" fill="none" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <circle cx="170" cy="115" r="16" fill="none" stroke="#E59A18" stroke-width="3" stroke-linecap="round" />
                  <circle cx="170" cy="115" r="7" fill="#E59A18" />

                  <!-- 8 Sun Rays radiating outwards -->
                  <line x1="152" y1="67" x2="134" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="188" y1="67" x2="206" y2="20" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="128" y1="93" x2="78" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="212" y1="93" x2="262" y2="67" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="118" y1="115" x2="58" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="222" y1="115" x2="282" y2="115" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="128" y1="137" x2="78" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                  <line x1="212" y1="137" x2="262" y2="163" stroke="#E59A18" stroke-width="6" stroke-linecap="round" />
                </g>

                <!-- Stepped Pyramid Graphics -->
                <g transform="translate(0, -12)">
                  <polygon points="80,165 215,165 235,193 60,193" fill="#063994" />
                  <polygon points="40,197 240,197 260,225 20,225" fill="#063994" />
                  <polygon points="25,229 265,229 285,257 5,257" fill="#063994" />
                </g>

                <!-- Brand Text -->
                <g>
                  <text x="170" y="298" text-anchor="middle" fill="#063994" font-size="15" font-weight="700" letter-spacing="5px" font-family="'Playfair Display', 'Georgia', serif">CENTRO ESPÍRITA</text>
                  <text x="170" y="336" text-anchor="middle" fill="#063994" font-size="25" font-weight="900" letter-spacing="1px" font-family="'Playfair Display', 'Georgia', serif">MIRANTE DE LUZ</text>
                </g>
              </svg>
            </div>
            
            <div class="brand-divider"></div>
            
            <div class="brand-right">
              <svg width="250" height="95" viewBox="0 0 640 220" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 5px auto;">
                <!-- KID 1 -->
                <path d="M 75,45 Q 100,15 125,45 Z" fill="#063994" />
                <path d="M 72,40 L 80,18 L 92,26 L 100,10 L 108,26 L 120,18 L 128,40" fill="#063994" />
                <circle cx="100" cy="45" r="22" fill="#063994" />
                <rect x="94" y="62" width="12" height="12" fill="#063994" />
                <path d="M 84,72 L 116,72 Q 115,125 115,125 L 124,180 C 128,186 115,188 111,180 L 100,138 L 89,180 C 85,188 72,186 76,180 L 85,125 Q 85,125 84,72 Z" fill="#063994" />
                <path d="M 85,85 C 65,115 50,115 30,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 115,85 C 135,115 145,115 155,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 100,102 c -3,-4.5 -8.5,-4.5 -8.5,1 c 0,5 6,9.5 8.5,12 c 2.5,-2.5 8.5,-7 8.5,-12 c 0,-5.5 -5.5,-5.5 -8.5,-1" fill="#3fc3ee" />

                <!-- KID 2 -->
                <path d="M 183,45 Q 210,12 237,45 Q 244,72 234,75 Q 210,65 186,75 Q 176,72 183,45 Z" fill="#063994" />
                <circle cx="210" cy="45" r="22" fill="#063994" />
                <rect x="204" y="62" width="12" height="12" fill="#063994" />
                <path d="M 194,72 L 226,72 Q 225,125 225,125 L 234,180 C 238,186 225,188 221,180 L 210,138 L 199,180 C 195,188 182,186 186,180 L 195,125 Q 195,125 194,72 Z" fill="#063994" />
                <path d="M 195,85 C 175,115 165,115 155,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 225,85 C 245,115 255,115 265,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 210,102 c -3,-4.5 -8.5,-4.5 -8.5,1 c 0,5 6,9.5 8.5,12 c 2.5,-2.5 8.5,-7 8.5,-12 c 0,-5.5 -5.5,-5.5 -8.5,-1" fill="#3fc3ee" />

                <!-- KID 3 -->
                <path d="M 292,38 Q 320,10 348,38 Z" fill="#063994" />
                <circle cx="320" cy="45" r="22" fill="#063994" />
                <rect x="314" y="62" width="12" height="12" fill="#063994" />
                <path d="M 304,72 L 336,72 Q 335,125 335,125 L 344,180 C 348,186 335,188 331,180 L 320,138 L 309,180 C 305,188 292,186 296,180 L 305,125 Q 305,125 304,72 Z" fill="#063994" />
                <path d="M 305,85 C 285,115 275,115 265,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 335,85 C 355,115 365,115 375,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 320,102 c -3,-4.5 -8.5,-4.5 -8.5,1 c 0,5 6,9.5 8.5,12 c 2.5,-2.5 8.5,-7 8.5,-12 c 0,-5.5 -5.5,-5.5 -8.5,-1" fill="#3fc3ee" />

                <!-- KID 4 -->
                <path d="M 405,42 L 410,24 L 420,32 L 430,17 L 440,30 L 450,22 L 455,42" fill="#063994" />
                <circle cx="430" cy="45" r="22" fill="#063994" />
                <rect x="424" y="62" width="12" height="12" fill="#063994" />
                <path d="M 414,72 L 446,72 Q 445,125 445,125 L 454,180 C 458,186 445,188 441,180 L 430,138 L 419,180 C 415,188 402,186 406,180 L 415,125 Q 415,125 414,72 Z" fill="#063994" />
                <path d="M 415,85 C 395,115 385,115 375,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 445,85 C 465,115 475,115 485,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 430,102 c -3,-4.5 -8.5,-4.5 -8.5,1 c 0,5 6,9.5 8.5,12 c 2.5,-2.5 8.5,-7 8.5,-12 c 0,-5.5 -5.5,-5.5 -8.5,-1" fill="#3fc3ee" />

                <!-- KID 5 -->
                <circle cx="510" cy="40" r="10" fill="#063994" />
                <circle cx="520" cy="25" r="12" fill="#063994" />
                <circle cx="540" cy="22" r="12" fill="#063994" />
                <circle cx="560" cy="28" r="11" fill="#063994" />
                <circle cx="568" cy="42" r="10" fill="#063994" />
                <circle cx="540" cy="45" r="22" fill="#063994" />
                <rect x="533" y="62" width="12" height="12" fill="#063994" />
                <path d="M 524,72 L 556,72 Q 555,125 555,125 L 564,180 C 568,186 555,188 551,180 L 540,138 L 529,180 C 525,188 512,186 516,180 L 525,125 Q 525,125 524,72 Z" fill="#063994" />
                <path d="M 525,85 C 505,115 495,115 485,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 555,85 C 575,115 590,115 610,120" stroke="#063994" stroke-width="14" stroke-linecap="round" fill="none" />
                <path d="M 540,102 c -3,-4.5 -8.5,-4.5 -8.5,1 c 0,5 6,9.5 8.5,12 c 2.5,-2.5 8.5,-7 8.5,-12 c 0,-5.5 -5.5,-5.5 -8.5,-1" fill="#3fc3ee" />
              </svg>
              <div class="voluntario-espiritas-subtitle">Voluntário Espírita</div>
            </div>
          </div>
          
          <div class="document-title-block">
            <h1 class="title">TERMO DE ADESÃO A SERVIÇO VOLUNTÁRIO</h1>
            <p class="subtitle">(Lei nº 9.608, de 18 de fevereiro de 1998)</p>
          </div>

          <div class="content">
            <p class="paragraph">
              <strong>1 - Centro Espírita Mirante de Luz (CEMIL)</strong>, organização religiosa sem fins lucrativos, inscrita no CNPJ 07.821.422/0001-77, situada na Rua Antônio Teixeira, nº 222 E, Conjunto Mirantes de Periperi, Periperi, Salvador/BA, CEP: 40.720-196, Consolação, neste ato representada por seu Presidente Sr. Altamir Airon Arruda, com endereço comercial no local supracitado.
            </p>

            <p class="paragraph">
              <strong>2 - ${selectedWorkerForTerm.name.toUpperCase()}</strong>, residente na ${termWorkerData.address || "_________________________________"}, Bairro: ${termWorkerData.neighborhood || "___________"}, Cidade: ${termWorkerData.city || "___________"}, CEP: ${termWorkerData.cep || "___________"}, inscrito(a) no CPF sob o nº ${termWorkerData.cpf || "___________"}, portador(a) do RG nº ${termWorkerData.rg || "___________"}, de profissão ${termWorkerData.profession || "__________"}, nacionalidade ${termWorkerData.nationality || "__________"}.
            </p>

            <div class="section-title">Serviço Prestado</div>

            <p class="paragraph">
              <strong>3 -</strong> O Voluntário reconhece que alguns serviços são administrativo, mediúnico e doutrinário na casa espírita, nas dependências da organização, que funciona no mesmo endereço dela, por 20 horas semanais, no período da manhã, tarde ou noite, conforme disponibilidade do voluntário e vinculado à necessidade da entidade, dentro da capacitação do voluntário.
            </p>

            <p class="paragraph">
              <strong>4 -</strong> O Voluntário declara conhecer que a prestação dos serviços acima não gera vínculo empregatício, nem obrigações de natureza trabalhista, previdenciária ou afim; que inexiste controle de frequência ou exigência de aviso prévio formal no caso de descontinuidade da relação objeto deste Termo.
            </p>

            <p class="paragraph">
              <strong>5 -</strong> O Voluntário declara que é detentor de todas as condições necessárias ao desempenho dos serviços a que se compromete e que tem ciência de que, no caso de acarretar danos a terceiros, sejam decorrentes de dolo ou culpa, poderá ficar sujeito a arcar com os consequentes prejuízos.
            </p>

            <p class="paragraph">
              <strong>6 -</strong> O Voluntário declara, espontaneamente, estar ciente e de acordo com os termos da Lei Federal nº 9.608 de 18/02/98, que dispõe sobre o serviço voluntário, cujo texto está transcrito no verso deste termo.
            </p>

            <p class="paragraph">
              <strong>7 -</strong> O Voluntário AUTORIZA a instituição beneficiária, acima qualificada, a título gratuito e em caráter definitivo, irrevogável, irretratável e por prazo indeterminado, utilizar o seu nome e sua imagem e voz obtidas, captadas, gravadas e fotografadas nos trabalhos da instituição, bem como reproduzidas por qualquer forma de tecnologia para uso em atividades doutrinárias ou de divulgação, seja através de mídia virtual, impressa, televisiva, radiodifusão, palestras e seminários, dentre outros.
            </p>

            <p class="paragraph">
              <strong>8 -</strong> O presente termo vigora pelo prazo de um ano, com início na data de sua assinatura, podendo qualquer das partes rescindi-lo quando lhe aprouver, sem qualquer ônus e independentemente de prévia comunicação.
            </p>

            <p class="paragraph subitem">
              <strong>8.1) -</strong> Na ausência de manifestação das partes, o presente termo será sucessiva e automaticamente renovado por iguais períodos.
            </p>
          </div>

          <div class="date-location">
            Salvador, ${termDate}.
          </div>

          <div class="signatures-wrapper">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-name">${selectedWorkerForTerm.name}</div>
              <div class="signature-label">Voluntário(a)</div>
            </div>

            <div class="signature-block president">
              <div class="signature-line"></div>
              <div class="signature-name">Altamir Airon Arruda</div>
              <div class="signature-label">Presidente - CEMIL</div>
            </div>
          </div>

          <hr class="page-break" />

          <div class="law-section">
            <div class="law-title">LEI Nº 9.608, DE 18 DE FEVEREIRO DE 1998</div>
            <p class="law-subtitle">Dispõe sobre o serviço voluntário e dá outras providências.</p>
            
            <p class="law-text">
              <strong>Art. 1º</strong> Considera-se serviço voluntário, para os fins desta Lei, a atividade não remunerada prestada por pessoa física a entidade pública de qualquer natureza ou a instituição privada de fins não lucrativos que tenha objetivos cívicos, culturais, educacionais, científicos, recreativos ou de assistência à pessoa.
            </p>
            <p class="law-text italic font-bold">
              <strong>Parágrafo único.</strong> O serviço voluntário não gera vínculo empregatício, nem obrigação de natureza trabalhista previdenciária ou afim.
            </p>
            <p class="law-text">
              <strong>Art. 2º</strong> O serviço voluntário será exercido mediante a celebração de termo de adesão entre a entidade, pública ou privada, e o prestador do serviço voluntário, dele devendo constar o objeto e as condições de seu exercício.
            </p>
            <p class="law-text">
              <strong>Art. 3º</strong> O prestador do serviço voluntário poderá ser ressarcido pelas despesas que comprovadamente realizar no desempenho das atividades voluntárias.
            </p>
            <p class="law-text italic font-bold">
              <strong>Parágrafo único.</strong> As despesas a serem ressarcidas deverão estar expressamente autorizadas pela entidade a que for prestado o serviço voluntário.
            </p>
            <p class="law-text">
              <strong>Art. 4º</strong> Esta Lei entra em vigor na data de sua publicação.
            </p>
            <p class="law-text">
              <strong>Art. 5º</strong> Revogam-se as disposições em contrário.
            </p>
            <p class="law-footer">
              Brasília, 18 de fevereiro de 1998; 177º da Independência e 110º da República.<br />
              <strong>PRESIDÊNCIA DA REPÚBLICA - Fernando Henrique Cardoso</strong>
            </p>
          </div>
        </div>
      `;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Termo de Voluntariado - ${selectedWorkerForTerm.name}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700;900&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #111827;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }

            .no-print-bar {
              background-color: #4f46e5;
              color: white;
              padding: 12px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: 'Space Grotesk', sans-serif;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }

            .no-print-bar h3 {
              margin: 0;
              font-size: 14px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }

            .print-btn {
              background-color: white;
              color: #4f46e5;
              border: none;
              padding: 8px 16px;
              font-weight: 700;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              transition: all 0.2s;
            }

            .print-btn:hover {
              background-color: #f3f4f6;
            }

            .contract-container {
              max-width: 800px;
              margin: 40px auto;
              padding: 0 40px;
              box-sizing: border-box;
              line-height: 1.6;
              font-size: 13.5px;
            }

            .brand-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              margin-bottom: 25px;
              border-bottom: 3px solid #063994;
              padding-bottom: 15px;
            }

            .brand-left {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .brand-divider {
              width: 3.5px;
              height: 120px;
              background-color: #000000;
              margin: 0 15px;
              align-self: center;
            }

            .brand-right {
              flex: 1.2;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }

            .voluntario-espiritas-subtitle {
              font-family: 'Space Grotesk', 'Playfair Display', 'Georgia', serif;
              font-size: 21px;
              font-weight: 700;
              color: #063994;
              text-align: center;
              letter-spacing: -0.3px;
              line-height: 1.2;
              margin-top: 5px;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.05);
            }

            .document-title-block {
              text-align: center;
              margin-top: 15px;
              margin-bottom: 25px;
            }

            .title {
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 950;
              font-size: 16px;
              margin: 0 0 5px 0;
              letter-spacing: -0.5px;
              color: #111827;
            }

            .subtitle {
              margin: 0;
              font-size: 10px;
              font-weight: 700;
              color: #6b7280;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .section-title {
              font-family: 'Space Grotesk', sans-serif;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 25px;
              margin-bottom: 15px;
              color: #374151;
              border-left: 3px solid #4f46e5;
              padding-left: 10px;
            }

            .paragraph {
              text-align: justify;
              margin-bottom: 16px;
              text-indent: 2em;
            }

            .paragraph.subitem {
              margin-left: 2em;
              text-indent: 0;
            }

            .date-location {
              margin-top: 40px;
              margin-bottom: 50px;
              text-align: right;
              font-weight: 700;
            }

            .signatures-wrapper {
              margin-top: 50px;
              margin-bottom: 50px;
              display: flex;
              justify-content: space-between;
            }

            .signature-block {
              display: inline-block;
              width: 45%;
              text-align: center;
            }

            .signature-line {
              width: 85%;
              margin: 0 auto;
              border-top: 1px solid #374151;
              margin-bottom: 8px;
            }

            .signature-name {
              font-weight: 700;
              font-size: 12px;
            }

            .signature-label {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 500;
            }

            .page-break {
              display: none;
              page-break-after: always;
              border: none;
              margin: 50px 0;
            }

            .law-section {
              margin-top: 60px;
              border-top: 1px dashed #d1d5db;
              padding-top: 40px;
              font-size: 11px;
              color: #4b5563;
              line-height: 1.5;
            }

            .law-title {
              font-family: 'Space Grotesk', sans-serif;
              font-weight: 950;
              font-size: 13px;
              text-align: center;
              color: #1f2937;
              margin-bottom: 4px;
            }

            .law-subtitle {
              text-align: center;
              margin-bottom: 20px;
              font-weight: 700;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .law-text {
              text-align: justify;
              margin-bottom: 12px;
            }

            .law-text.italic {
              font-style: italic;
            }

            .law-text.font-bold {
              font-weight: 700;
            }

            .law-footer {
              margin-top: 25px;
              text-align: center;
              font-size: 9px;
              font-weight: 500;
              color: #9ca3af;
              line-height: 1.4;
            }

            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .no-print-bar {
                display: none !important;
              }
              .contract-container {
                margin: 0;
                padding: 0;
                max-width: 100%;
              }
              .page-break {
                display: block;
                height: 0;
                page-break-after: always;
              }
              .law-section {
                border-top: none;
                margin-top: 0;
                padding-top: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <h3>SISTEMA DE IMPRESSÃO INTEGRADA CEMIL</h3>
            <button class="print-btn" onclick="window.print()">Imprimir Agora</button>
          </div>
          ${elementHtml}
        </body>
        </html>
      `);
      
      printWin.document.close();
      setSelectedWorkerForTerm(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados do termo.");
    }
  };

  useEffect(() => {
    if (location.state?.filterPending) {
      setWorkerFilter('pending');
    }
  }, [location.state]);

  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    phone: "",
    role: "VOLUNTARIO" as UserRole,
    position: "", // NEW
    sectorId: "",
    status: "ATIVO" as WorkerStatus,
    photoUrl: "",
    acceptedTerm: false,
    bloodType: "",
    allergies: "",
    emergencyContact: "",
    cpf: "",
    rg: "",
    address: "",
    cep: "",
    neighborhood: "",
    city: "Salvador",
    profession: "",
    nationality: "brasileira",
    interviewNotes: "",
    coursesCompleted: [] as string[],
    availabilityDays: [] as string[],
  });
  const [newSector, setNewSector] = useState({
    name: "",
    type: "FRATERNO" as SectorType,
    description: "",
    parentSectorId: "",
    mission: "",
    foundation: "",
    location: "",
    coordinator: "",
    subcoordinator: "",
    secretary: "",
    workerProfile: "",
    entryFlow: "",
    mainActivities: "",
    schedule: "",
    meetingFrequency: "",
    reportsTo: "",
    interactions: "",
    resources: "",
    goals: "",
    challenges: "",
  });

  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "ADM" ||
    (currentUser?.position &&
      [
        "Presidente(s)",
        "Vice-presidente(s)",
        "1º Secretário(a)",
        "Secretário(a) de Planejamento",
      ].includes(currentUser.position));

  const resetSectorForm = () => {
    setNewSector({
      name: "",
      type: "FRATERNO",
      description: "",
      parentSectorId: "",
      mission: "",
      foundation: "",
      location: "",
      coordinator: "",
      subcoordinator: "",
      secretary: "",
      workerProfile: "",
      entryFlow: "",
      mainActivities: "",
      schedule: "",
      meetingFrequency: "",
      reportsTo: "",
      interactions: "",
      resources: "",
      goals: "",
      challenges: "",
    });
  };

  const resetWorkerForm = () => {
    setEditingWorker(null);
    setNewWorker({
      name: "",
      email: "",
      phone: "",
      role: "VOLUNTARIO",
      position: "",
      sectorId: (currentUser?.role === "COORDENADOR" && currentUser.sectorId) ? currentUser.sectorId : "",
      status: "ATIVO",
      photoUrl: "",
      acceptedTerm: false,
      bloodType: "",
      allergies: "",
      emergencyContact: "",
      cpf: "",
      rg: "",
      address: "",
      cep: "",
      neighborhood: "",
      city: "Salvador",
      profession: "",
      nationality: "brasileira",
      interviewNotes: "",
      coursesCompleted: [],
      availabilityDays: [],
    });
    setWorkerPassword("");
    setForcePasswordChange(true);
    setShowCreatedPassword(false);
    setHasTempPermission(false);
    setTempRole("SECRETARIO");
    setTempDurationValue(1);
    setTempDurationUnit("days");
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let generated = "";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWorkerPassword(generated);
    setShowCreatedPassword(true);
  };

  useEffect(() => {
    const unsub = dataService.subscribeToWorkers((list) => {
      setWorkers(list || []);
    });
    loadSectors();
    return () => {
      unsub();
    };
  }, []);

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
  };

  const loadData = async () => {
    loadSectors();
  };

  const handleEditWorker = (w: Worker) => {
    setEditingWorker(w);
    setNewWorker({
      name: w.name || "",
      email: w.email || "",
      phone: w.phone || "",
      role: w.role || "VOLUNTARIO",
      position: w.position || "",
      sectorId: w.sectorId || "",
      status: w.status || (w.active ? "ATIVO" : "EM_ANALISE"),
      photoUrl: w.photoUrl || "",
      acceptedTerm: w.acceptedTerm || false,
      bloodType: w.bloodType || "",
      allergies: w.allergies || "",
      emergencyContact: w.emergencyContact || "",
      cpf: w.cpf || "",
      rg: w.rg || "",
      address: w.address || "",
      cep: w.cep || "",
      neighborhood: w.neighborhood || "",
      city: w.city || "Salvador",
      profession: w.profession || "",
      nationality: w.nationality || "brasileira",
      interviewNotes: w.interviewNotes || "",
      coursesCompleted: w.coursesCompleted || [],
      availabilityDays: w.availabilityDays || [],
    });

    const active = !!(w.tempRole && w.tempRoleExpiry && Date.now() < w.tempRoleExpiry);
    setHasTempPermission(active);
    if (w.tempRole) {
      setTempRole(w.tempRole);
    } else {
      setTempRole("SECRETARIO");
    }

    if (active && w.tempRoleExpiry) {
      const msLeft = w.tempRoleExpiry - Date.now();
      const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
      if (hoursLeft > 24) {
        setTempDurationValue(Math.ceil(hoursLeft / 24));
        setTempDurationUnit("days");
      } else {
        setTempDurationValue(hoursLeft);
        setTempDurationUnit("hours");
      }
    } else {
      setTempDurationValue(1);
      setTempDurationUnit("days");
    }

    setIsAddingWorker(true);
  };

  const handleEditSector = (s: Sector) => {
    setEditingSector(s);
    setNewSector({
      name: s.name || "",
      type: s.type || "OUTROS",
      description: s.description || "",
      parentSectorId: s.parentSectorId || "",
      mission: s.mission || "",
      foundation: s.foundation || "",
      location: s.location || "",
      coordinator: s.coordinator || "",
      subcoordinator: s.subcoordinator || "",
      secretary: s.secretary || "",
      workerProfile: s.workerProfile || "",
      entryFlow: s.entryFlow || "",
      mainActivities: s.mainActivities || "",
      schedule: s.schedule || "",
      meetingFrequency: s.meetingFrequency || "",
      reportsTo: s.reportsTo || "",
      interactions: s.interactions || "",
      resources: s.resources || "",
      goals: s.goals || "",
      challenges: s.challenges || "",
    });
    setIsAddingSector(true);
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to save worker...", {
      editing: !!editingWorker,
      email: newWorker.email,
    });

    if (newWorker.role === "VOLUNTARIO" && !newWorker.acceptedTerm) {
      alert("É necessário aceitar o Termo de Adesão ao Trabalho Voluntário.");
      return;
    }

    const normalizedEmail = newWorker.email.toLowerCase().trim();

    setIsSubmittingWorker(true);
    try {
      // 1. Check if worker already exists in Firestore BEFORE trying to create Auth
      if (!editingWorker) {
        console.log("Checking for duplicates for email:", normalizedEmail);
        const existingWorkers = await dataService.getWorkers();
        if (!existingWorkers)
          throw new Error("Não foi possível validar a lista de trabalhadores.");

        const duplicate = existingWorkers.find(
          (w) => w.email.toLowerCase().trim() === normalizedEmail,
        );

        if (duplicate) {
          alert(
            `O trabalhador "${duplicate.name}" já está cadastrado com este e-mail.\n\nSugestão: Tente localizar o cadastro atual na lista e editá-lo se necessário.`,
          );
          setIsSubmittingWorker(false);
          return;
        }
      }

      console.log("Preparing payload for worker:", normalizedEmail);

      let sectorHistory = editingWorker?.sectorHistory || [];
      if (editingWorker && newWorker.sectorId && newWorker.sectorId !== editingWorker.sectorId) {
        const currentSectorObj = sectors.find((s) => s.id === newWorker.sectorId);
        const nowIso = new Date().toISOString().split("T")[0];
        sectorHistory = [
          ...sectorHistory,
          {
            sectorId: newWorker.sectorId,
            sectorName: currentSectorObj?.name || "Setor",
            startDate: nowIso,
            roleName: newWorker.position || newWorker.role,
            notes: "Transferência de setor cadastrada em sistema",
          },
        ];
      }

      const payload: any = {
        ...newWorker,
        email: normalizedEmail,
        active: newWorker.status !== "DESLIGADO" && newWorker.status !== "AFASTADO",
        sectorHistory,
        termAcceptedAt: newWorker.acceptedTerm ? Date.now() : undefined,
        tempRole: hasTempPermission ? tempRole : null,
        tempRoleExpiry: hasTempPermission
          ? Date.now() +
            (tempDurationUnit === "days"
              ? tempDurationValue * 24 * 60 * 60 * 1000
              : tempDurationValue * 60 * 60 * 1000)
          : null,
        mustChangePassword: editingWorker ? undefined : forcePasswordChange,
      };

      if (editingWorker) {
        console.log("Updating existing worker:", editingWorker.id);
        const oldTempActive = !!(editingWorker.tempRole && editingWorker.tempRoleExpiry && Date.now() < editingWorker.tempRoleExpiry);
        
        await dataService.updateWorker({ ...editingWorker, ...payload });
        
        // Audit log for temporary permission assignment/revocation
        if (hasTempPermission) {
          const validityStr = `${tempDurationValue} ${tempDurationUnit === 'days' ? 'dia(s)' : 'hora(s)'}`;
          await dataService.createLog(
            'Permissão Temporária Concedida',
            `Administrador ${currentUser?.name || currentUser?.email} CONCEDEU permissão temporária de [${tempRole}] para [${payload.name}] com duração de ${validityStr}. Logins efetuados por este trabalhador: ${editingWorker.loginCount || 0} vez(es)`
          );
        } else if (oldTempActive && !hasTempPermission) {
          await dataService.createLog(
            'Permissão Temporária Removida',
            `Administrador ${currentUser?.name || currentUser?.email} REMOVEU permissão temporária de [${editingWorker.tempRole}] para [${payload.name}]. Logins efetuados por este trabalhador: ${editingWorker.loginCount || 0} vez(es)`
          );
        }

        alert("Trabalhador atualizado com sucesso!");
      } else {
        if (!workerPassword || workerPassword.length < 6) {
          alert("Senha deve ter no mínimo 6 caracteres.");
          setIsSubmittingWorker(false);
          return;
        }
        console.log("Registering new worker auth account...");
        await registerWorker(payload, workerPassword);
        
        if (hasTempPermission) {
          const validityStr = `${tempDurationValue} ${tempDurationUnit === 'days' ? 'dia(s)' : 'hora(s)'}`;
          await dataService.createLog(
            'Permissão Temporária Concedida',
            `Administrador ${currentUser?.name || currentUser?.email} CONCEDEU permissão temporária de [${tempRole}] para o novo trabalhador [${payload.name}] com duração de ${validityStr}. Logins efetuados por este trabalhador: 0 vez(es)`
          );
        }

        alert("Trabalhador cadastrado e conta de acesso criada com sucesso!");
      }
      setIsAddingWorker(false);
      resetWorkerForm();
      loadData();
    } catch (err: any) {
      console.log("Interpreting registration error...", err);
      const msg = (err.message || err || "").toString();
      console.log("Extracted message:", msg);

      const isDomainError =
        msg.includes("AUTH_EMAIL_ALREADY_IN_USE") ||
        msg.includes("auth/email-already-in-use") ||
        msg.includes("already-in-use");

      if (isDomainError) {
        // If we reach here, it means the email exists in Firebase Auth but NOT as an active worker profile
        const isCurrentAdmin =
          normalizedEmail === currentUser?.email?.toLowerCase().trim();

        if (isCurrentAdmin) {
          alert(
            "ATENÇÃO: Você está tentando cadastrar o seu PRÓPRIO e-mail de administrador.\n\nSeu perfil já existe. Se quiser alterar seus dados, localize seu nome na lista e use o botão de editar.",
          );
          setIsSubmittingWorker(false);
          return;
        }

        const friendlyMsg =
          "Este e-mail já está em uso. Tente fazer login ou recupere sua senha.";

        const dialogMsg =
          friendlyMsg +
          "\n\n" +
          "AVISO: Este e-mail já possui uma conta de acesso (login) registrada no sistema Firebase (provavelmente de um cadastro antigo que foi excluído).\n\n" +
          "Deseja REATIVAR o perfil deste colaborador? Ele poderá entrar com a mesma senha que usava antes.";

        if (confirm(dialogMsg)) {
          try {
            console.log(
              "Proceeding with manual profile creation for existing auth user...",
            );
            setIsSubmittingWorker(true);
            const profilePayload = {
              ...newWorker,
              email: normalizedEmail,
              active: true,
              createdAt: Date.now(),
              termAcceptedAt: newWorker.acceptedTerm ? Date.now() : undefined,
              tempRole: hasTempPermission ? tempRole : null,
              tempRoleExpiry: hasTempPermission
                ? Date.now() +
                  (tempDurationUnit === "days"
                    ? tempDurationValue * 24 * 60 * 60 * 1000
                    : tempDurationValue * 60 * 60 * 1000)
                : null,
            };

            await dataService.addWorkerManual(profilePayload);

            if (hasTempPermission) {
              const validityStr = `${tempDurationValue} ${tempDurationUnit === 'days' ? 'dia(s)' : 'hora(s)'}`;
              await dataService.createLog(
                'Permissão Temporária Concedida',
                `Administrador ${currentUser?.name || currentUser?.email} CONCEDEU permissão temporária de [${tempRole}] para [${profilePayload.name}] (perfil reativado) com duração de ${validityStr}. Logins efetuados por este trabalhador: 0 vez(es)`
              );
            }

            alert(
              "Sucesso! O perfil foi recriado e vinculado ao e-mail existente.",
            );

            setIsAddingWorker(false);
            resetWorkerForm();
            loadData();
            return;
          } catch (profileErr: any) {
            console.error("Manual link error:", profileErr);
            alert(
              "Erro ao vincular perfil: " +
                (profileErr.message || "Erro de permissão ou conexão."),
            );
          }
        }
      } else if (msg.includes("auth/weak-password")) {
        alert(
          "A senha informada é muito fraca. Por favor, use pelo menos 6 caracteres.",
        );
      } else {
        alert(
          "Não foi possível concluir o registro:\n" +
            (msg ||
              "Erro de conexão ou permissão. Verifique os campos e tente novamente."),
        );
      }
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSector) {
        await dataService.updateSector({ ...editingSector, ...newSector });
        alert("Setor atualizado com sucesso!");
      } else {
        await dataService.addSector(newSector);
        alert("Setor criado com sucesso!");
      }
      setIsAddingSector(false);
      setEditingSector(null);
      resetSectorForm();
      loadData();
    } catch (err: any) {
      console.error("Erro ao salvar setor:", err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao salvar setor: ${errObj.error || "Sem permissão"}`);
      } catch {
        alert("Ocorreu um erro ao salvar o setor.");
      }
    }
  };

  const handleDeleteWorkerAction = async () => {
    if (!workerToDelete) return;
    try {
      await dataService.deleteWorker(workerToDelete.id);
      loadData();
      setIsDeletingConfirmOpen(false);
      setWorkerToDelete(null);
      alert("Trabalhador excluído com sucesso!");
    } catch (err: any) {
      console.error("Erro ao excluir trabalhador:", err);
      try {
        const errObj = JSON.parse(err.message);
        alert(`Erro ao excluir: ${errObj.error || "Sem permissão"}`);
      } catch {
        alert("Ocorreu um erro ao excluir o trabalhador.");
      }
    }
  };

  const handleDeleteSector = async (id: string) => {
    if (deletingSectorId === id) {
      await dataService.deleteSector(id);
      setDeletingSectorId(null);
      loadData();
    } else {
      setDeletingSectorId(id);
      setTimeout(() => setDeletingSectorId(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 sm:space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer shrink-0"
          title="Voltar ao Painel"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight italic">
            Configurações & Gestão
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium italic">
            Gerenciamento de equipe e frentes de trabalho do Mirante de Luz.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Gestão de Voluntários */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} /> Equipe da Casa
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Localizar trabalhador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                />
              </div>
              {(isAdmin || currentUser?.role === "COORDENADOR") && (
                <button
                  onClick={() => setIsAddingWorker(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
                >
                  <Plus size={16} />{" "}
                  <span className="uppercase tracking-widest px-1">Novo</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs para Filtrar Trabalhadores */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/50">
            <button
              onClick={() => setWorkerFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                workerFilter === 'all'
                  ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/30"
                  : "text-gray-400 hover:text-gray-700 hover:bg-white/40"
              )}
            >
              Todos ({workers.filter(w => isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)).length})
            </button>
            <button
              onClick={() => setWorkerFilter('active')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                workerFilter === 'active'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-600 hover:bg-emerald-50"
              )}
            >
              Ativos ({workers.filter(w => (isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)) && w.active && (w.status === 'ATIVO' || !w.status)).length})
            </button>
            <button
              onClick={() => setWorkerFilter('pending')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 relative overflow-hidden",
                workerFilter === 'pending'
                  ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                  : "text-amber-600 hover:bg-amber-50"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                workerFilter === 'pending' ? "bg-white animate-pulse" : "bg-amber-500 animate-ping"
              )} />
              Acolhimento / Pendentes ({workers.filter(w => (isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)) && (!w.active || w.status === 'EM_ANALISE')).length})
            </button>
            <button
              onClick={() => setWorkerFilter('em_formacao')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                workerFilter === 'em_formacao'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-600 hover:bg-blue-50"
              )}
            >
              Em Formação ({workers.filter(w => (isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)) && w.status === 'EM_FORMACAO').length})
            </button>
            <button
              onClick={() => setWorkerFilter('afastado')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                workerFilter === 'afastado'
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-600 hover:bg-purple-50"
              )}
            >
              Afastados ({workers.filter(w => (isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)) && w.status === 'AFASTADO').length})
            </button>
            <button
              onClick={() => setWorkerFilter('desligado')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                workerFilter === 'desligado'
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Desligados ({workers.filter(w => (isAdmin || (currentUser?.role === "COORDENADOR" && w.sectorId === currentUser.sectorId)) && w.status === 'DESLIGADO').length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers
              .filter((w) => {
                const matchesSearch =
                  w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  w.email.toLowerCase().includes(searchTerm.toLowerCase());
                const isUserAllowed =
                  isAdmin ||
                  (currentUser?.role === "COORDENADOR" &&
                    w.sectorId === currentUser.sectorId);
                
                const matchesFilter =
                  workerFilter === 'all' ||
                  (workerFilter === 'active' && w.active && (w.status === 'ATIVO' || !w.status)) ||
                  (workerFilter === 'pending' && (!w.active || w.status === 'EM_ANALISE')) ||
                  (workerFilter === 'em_formacao' && w.status === 'EM_FORMACAO') ||
                  (workerFilter === 'afastado' && w.status === 'AFASTADO') ||
                  (workerFilter === 'desligado' && w.status === 'DESLIGADO');

                return matchesSearch && isUserAllowed && matchesFilter;
              })
              .map((w) => {
                const canEdit =
                  isAdmin ||
                  (currentUser?.role === "COORDENADOR" &&
                    w.sectorId === currentUser.sectorId);

                return (
                  <motion.div
                    layout
                    key={w.id}
                    className={cn(
                      "p-4 sm:p-5 rounded-[28px] border transition-all group relative overflow-hidden",
                      w.active
                        ? "bg-white border-gray-50 shadow-sm hover:shadow-xl hover:border-indigo-100"
                        : "bg-amber-50/30 border-amber-300 shadow-md hover:shadow-2xl hover:border-amber-500 ring-2 ring-amber-100/40"
                    )}
                  >
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {w.photoUrl ? (
                          <div className="relative group/photo shrink-0">
                            <img
                              src={w.photoUrl}
                              alt={w.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white shadow-md object-cover ring-4 ring-gray-100"
                              referrerPolicy="no-referrer"
                            />
                            {canEdit && (
                              <button
                                onClick={() => handleEditWorker(w)}
                                className="absolute inset-0 bg-indigo-600/60 rounded-2xl flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all text-white backdrop-blur-[2px]"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => canEdit && handleEditWorker(w)}
                            className={cn(
                              "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-white ring-4 ring-gray-100 transition-all shrink-0",
                              canEdit
                                ? "cursor-pointer hover:bg-indigo-600 hover:text-white bg-indigo-50 text-indigo-600"
                                : "bg-gray-50 text-gray-300",
                            )}
                          >
                            {(w.name || "?").charAt(0)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h4 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate">
                              {w.name}
                            </h4>
                            {!w.active && (
                              <span className="text-[8px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0 animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate mb-2">
                            {w.email}{" "}
                            {w.position && (
                              <span className="text-indigo-600 font-black ml-1">
                                • {w.position}
                              </span>
                            )}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                                w.role === "ADMIN" || w.role === "ADM"
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : w.role === "COORDENADOR"
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : "bg-gray-50 text-gray-500 border-gray-100",
                              )}
                            >
                              {w.role}
                            </span>
                            {w.tempRole && w.tempRoleExpiry && Date.now() < w.tempRoleExpiry && (
                              <span className="text-[8px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-white animate-ping shrink-0" />
                                🔓 Temp: {w.tempRole} ({getRemainingTempTimeLabel(w.tempRoleExpiry)})
                              </span>
                            )}
                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-widest italic border border-indigo-50">
                              {sectors.find((s) => s.id === w.sectorId)?.name ||
                                "Geral"}
                            </span>
                            {w.status && (
                              <span
                                className={cn(
                                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border",
                                  w.status === "ATIVO"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : w.status === "EM_FORMACAO"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : w.status === "EM_ANALISE"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : w.status === "AFASTADO"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                )}
                              >
                                {WORKER_STATUS_LABELS[w.status] || w.status}
                              </span>
                            )}
                            {w.coursesCompleted && w.coursesCompleted.length > 0 && (
                              <span className="text-[8px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-100">
                                🎓 {w.coursesCompleted.length} curso(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-all">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenTermModal(w)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Gerar Termo de Voluntariado"
                              >
                                <FileText size={14} />
                              </button>
                              <button
                                onClick={() => handleEditWorker(w)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setWorkerToDelete(w);
                                  setIsDeletingConfirmOpen(true);
                                }}
                                className="p-2 mr-1 rounded-xl transition-all flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50"
                                title="Excluir Trabalhador"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Botão de Ação Direta para Trabalhadores Ativos */}
                      {w.active && canEdit && (
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Termos & Contratos:</span>
                          <button
                            onClick={() => handleOpenTermModal(w)}
                            className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-1 transition-all"
                            title="Gerar e Imprimir Termo de Voluntariado"
                          >
                            <FileText size={10} />
                            Termo de Adesão
                          </button>
                        </div>
                      )}

                      {/* Botão de Ação Direta para Solicitações Pendentes */}
                      {!w.active && canEdit && (
                        <div className="pt-2 border-t border-amber-200/50 flex flex-col gap-1.5">
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Ações de Análise:</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja aprovar e ativar o cadastro de ${w.name}?`)) {
                                  try {
                                    await dataService.updateWorker({
                                      ...w,
                                      active: true
                                    });
                                    alert(`Trabalhador ${w.name} aprovado com sucesso!`);
                                    loadData();
                                  } catch (err) {
                                    console.error("Erro ao aprovar:", err);
                                    alert("Erro ao aprovar trabalhador.");
                                  }
                                }
                              }}
                              className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 size={12} strokeWidth={3} />
                              Aprovar Cadastro
                            </button>
                            <button
                              onClick={() => handleOpenTermModal(w)}
                              className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1"
                              title="Preencher e Imprimir Termo de Voluntariado"
                            >
                              <FileText size={10} />
                              Termo
                            </button>
                            <button
                              onClick={() => handleEditWorker(w)}
                              className="py-1.5 px-3 bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
                            >
                              Ver Ficha
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

            {workers.filter((w) => {
              if (isAdmin) return true;
              if (currentUser?.role === "COORDENADOR")
                return w.sectorId === currentUser.sectorId;
              return false;
            }).length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                  <Users size={32} />
                </div>
                <p className="text-gray-400 font-medium italic">
                  Nenhum trabalhador encontrado...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gestão de Setores */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={24} /> Setores
            </h2>
            {isAdmin && (
              <button
                onClick={() => setIsAddingSector(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {sectors.map((s) => (
              <div
                key={s.id}
                className="p-5 bg-white rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                      {formatSectorName(s.name)}
                      {s.parentSectorId && (
                        <span className="text-[9px] text-indigo-500 font-black tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                          Sub-setor
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      {SECTOR_TYPE_LABELS[s.type] || s.type}
                    </p>
                    {s.parentSectorId && (
                      <p className="text-[10px] text-gray-400 font-medium">
                        Setor Superior: {sectors.find(p => p.id === s.parentSectorId)?.name || 'Outro'}
                      </p>
                    )}
                  </div>
                </div>
                {(currentUser?.role === "ADMIN" ||
                  currentUser?.role === "ADM") && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditSector(s)}
                      className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSector(s.id)}
                      className={cn(
                        "p-2 transition-all rounded-lg",
                        deletingSectorId === s.id
                          ? "bg-red-500 text-white text-[10px] font-bold px-2 py-1"
                          : "text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100",
                      )}
                    >
                      {deletingSectorId === s.id ? (
                        "Confirma?"
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isAdmin && (
              <button
                onClick={() => setIsAddingSector(true)}
                className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[24px] text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all"
              >
                + Adicionar Novo Setor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Adicionar Colaborador */}
      {isAddingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"
            onClick={() => setIsAddingWorker(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">
                  {editingWorker ? "Editar Colaborador" : "Novo Colaborador"}
                </h2>
                <p className="text-xs text-gray-400 font-medium tracking-tight">
                  Cadastre um novo irmão de jornada.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingWorker(false);
                  resetWorkerForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={handleAddWorker}
              className="p-8 space-y-5 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Nome do Trabalhador
                  </label>
                  <input
                    required
                    value={newWorker.name}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, name: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-sm"
                    placeholder="Ex: Francisco Cândido"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Cargo Institucional
                  </label>
                  <select
                    value={newWorker.position}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, position: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700 text-sm"
                  >
                    <option value="">Nenhum cargo específico</option>
                    <option value="Presidente(s)">Presidente(s)</option>
                    <option value="Vice-presidente(s)">
                      Vice-presidente(s)
                    </option>
                    <option value="1º Secretário(a)">1º Secretário(a)</option>
                    <option value="Secretário(a) de Planejamento">
                      Secretário(a) de Planejamento
                    </option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    E-mail para Login
                  </label>
                  <input
                    required
                    type="email"
                    value={newWorker.email}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, email: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700"
                    placeholder="Ex: voluntario@cemil.org"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Telefone da Equipe
                  </label>
                  <input
                    value={newWorker.phone}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, phone: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <ImageUpload
                label="Foto do Trabalhador"
                value={newWorker.photoUrl}
                onChange={(val) =>
                  setNewWorker({ ...newWorker, photoUrl: val })
                }
              />

              {/* Documentação e Endereço para Termo de Adesão (Item 2) */}
              <div id="admin-secao-documentacao" className="p-5 bg-indigo-50/20 rounded-[24px] border border-indigo-100/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-600 rounded-lg text-white shrink-0">
                    <ShieldCheck size={14} />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-indigo-950 tracking-wider">Dados do Termo de Voluntariado (Item 2)</h4>
                    <p className="text-[9px] text-indigo-800/80 font-bold leading-relaxed">Informações obrigatórias para o preenchimento automático do contrato de serviço voluntário (Lei 9.608/98).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">CPF</label>
                    <input
                      type="text"
                      value={newWorker.cpf}
                      onChange={e => setNewWorker({...newWorker, cpf: e.target.value})}
                      placeholder="Ex: 313.211.515-00"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">RG</label>
                    <input
                      type="text"
                      value={newWorker.rg}
                      onChange={e => setNewWorker({...newWorker, rg: e.target.value})}
                      placeholder="Ex: 24.394.89-7"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Profissão</label>
                    <input
                      type="text"
                      value={newWorker.profession}
                      onChange={e => setNewWorker({...newWorker, profession: e.target.value})}
                      placeholder="Ex: professora letróloga"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Nacionalidade</label>
                    <input
                      type="text"
                      value={newWorker.nationality}
                      onChange={e => setNewWorker({...newWorker, nationality: e.target.value})}
                      placeholder="Ex: brasileira"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Endereço Residencial Completo</label>
                    <input
                      type="text"
                      value={newWorker.address}
                      onChange={e => setNewWorker({...newWorker, address: e.target.value})}
                      placeholder="Ex: Avenida Dom João VI, N°.195, Edf Aguassai, Apto 164"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Bairro</label>
                    <input
                      type="text"
                      value={newWorker.neighborhood}
                      onChange={e => setNewWorker({...newWorker, neighborhood: e.target.value})}
                      placeholder="Ex: Brotas"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Cidade</label>
                      <input
                        type="text"
                        value={newWorker.city}
                        onChange={e => setNewWorker({...newWorker, city: e.target.value})}
                        placeholder="Ex: Salvador"
                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">CEP</label>
                      <input
                        type="text"
                        value={newWorker.cep}
                        onChange={e => setNewWorker({...newWorker, cep: e.target.value})}
                        placeholder="Ex: 40.285-000"
                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-gray-150 font-bold text-gray-700 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Medical Information Group */}
              <div className="p-5 bg-amber-50/50 rounded-[24px] border border-amber-100/50 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-amber-500 rounded-lg text-white shrink-0">
                    <Heart size={14} className="fill-white" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-amber-950 tracking-wider">Ficha Médica de Emergência (Para Carteirinha)</h4>
                    <p className="text-[9px] text-amber-800/80 font-bold leading-relaxed">Essas informações serão gravadas no cadastro e aparecerão no verso da carteirinha oficial de voluntário (CR80) em caso de emergências.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-900/60 tracking-wider ml-1 block">
                      Tipo Sanguíneo
                    </label>
                    <select
                      value={newWorker.bloodType}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, bloodType: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all border border-amber-150 font-bold text-gray-700 text-xs"
                    >
                      <option value="">Não Informado</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-900/60 tracking-wider ml-1 block">
                      Alérgico a:
                    </label>
                    <input
                      type="text"
                      value={newWorker.allergies}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, allergies: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all border border-amber-150 font-bold text-gray-700 text-xs text-left"
                      placeholder="Ex: Dipirona, Pó..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-900/60 tracking-wider ml-1 block">
                      Contato de Emergência
                    </label>
                    <input
                      type="text"
                      value={newWorker.emergencyContact}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, emergencyContact: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all border border-amber-150 font-bold text-gray-700 text-xs text-left"
                      placeholder="Ex: Maria (42) 9999-9999"
                    />
                  </div>
                </div>
              </div>

              {!editingWorker && (
                <div className="space-y-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-150">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Senha Inicial
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border border-indigo-100"
                    >
                      <span>Gerar Senha Aleatória</span>
                    </button>
                  </div>
                  <div className="relative group/pass animate-none">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within/pass:text-indigo-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      required
                      type={showCreatedPassword ? "text" : "password"}
                      value={workerPassword}
                      onChange={(e) => setWorkerPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 focus:border-indigo-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-750 text-sm"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatedPassword(!showCreatedPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCreatedPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <label className="flex items-start gap-3 select-none cursor-pointer group mt-2">
                    <input
                      type="checkbox"
                      checked={forcePasswordChange}
                      onChange={(e) => setForcePasswordChange(e.target.checked)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                        Forçar alteração de senha no próximo acesso
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium">
                        O trabalhador será obrigado a cadastrar uma nova senha pessoal ao realizar o primeiro login.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Nível de Acesso
                  </label>
                  <select
                    value={newWorker.role}
                    onChange={(e) =>
                      setNewWorker({
                        ...newWorker,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700"
                  >
                    <option value="VOLUNTARIO">Voluntário</option>
                    <option value="ATENDENTE">Atendente</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                    {(isAdmin || currentUser?.role === "ADM" || currentUser?.role === "ADMIN") && (
                      <>
                        <option value="SECRETARIO">Secretário</option>
                        <option value="COORDENADOR">Coordenador</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="ADM">ADM (Admin)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Setor Principal
                  </label>
                  <select
                    disabled={currentUser?.role === "COORDENADOR"}
                    value={newWorker.sectorId}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, sectorId: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700 disabled:opacity-75"
                  >
                    <option value="">Acesso Geral</option>
                    {sectors.map((s) => {
                      const path: string[] = [];
                      let curr: Sector | undefined = s;
                      while (curr) {
                        path.unshift(formatSectorName(curr.name));
                        if (curr.parentSectorId) {
                          const pId = curr.parentSectorId;
                          const parent: Sector | undefined = sectors.find(x => x.id === pId);
                          if (parent && parent.id !== curr.id) {
                            curr = parent;
                          } else {
                            break;
                          }
                        } else {
                          break;
                        }
                      }
                      return (
                        <option key={s.id} value={s.id}>
                          {path.join(" ➔ ")}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Status do Vínculo RH */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Status de Vínculo na Casa
                </label>
                <select
                  value={newWorker.status}
                  onChange={(e) =>
                    setNewWorker({
                      ...newWorker,
                      status: e.target.value as WorkerStatus,
                    })
                  }
                  className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="EM_ANALISE">Em Análise (Acolhimento / Solicitante)</option>
                  <option value="EM_FORMACAO">Em Formação / Curso</option>
                  <option value="AFASTADO">Afastado Temporariamente</option>
                  <option value="DESLIGADO">Desligado / Inativo</option>
                </select>
              </div>

              {/* Formação Espírita & Cursos Concluídos */}
              <div className="p-5 bg-blue-50/40 rounded-[24px] border border-blue-100/50 space-y-3">
                <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider block">
                  Formação & Cursos Concluídos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['ESDE', 'EADE', 'Curso de Passe', 'Atendimento Fraterno', 'Estudo da Mediunidade', 'Evangelização Infantil'].map((course) => {
                    const isSelected = (newWorker.coursesCompleted || []).includes(course);
                    return (
                      <button
                        key={course}
                        type="button"
                        onClick={() => {
                          const current = newWorker.coursesCompleted || [];
                          const next = isSelected
                            ? current.filter((c) => c !== course)
                            : [...current, course];
                          setNewWorker({ ...newWorker, coursesCompleted: next });
                        }}
                        className={cn(
                          "p-2.5 rounded-xl text-xs font-bold text-left transition-all border",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {isSelected ? "✓ " : "+ "}{course}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observações de Acolhimento & Entrevista */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Observações do Acolhimento & Entrevista Inicial
                </label>
                <textarea
                  rows={2}
                  value={newWorker.interviewNotes}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, interviewNotes: e.target.value })
                  }
                  placeholder="Anotações do acolhimento, disponibilidades, aptidões ou histórico doutrinário..."
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-xs text-gray-700"
                />
              </div>

              {/* Permissão Temporária Especial */}
              {isAdmin && (
                <div className="p-5 bg-amber-50/50 rounded-[24px] border border-amber-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-amber-950 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-amber-600" /> Permissão Temporária Especial
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasTempPermission}
                        onChange={(e) => setHasTempPermission(e.target.checked)}
                        className="sr-only peer"
                      />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">
                  Ative esta opção para conceder temporariamente poderes de outros cargos para visualização ou edição de abas restritas (como inventário, relatórios, etc). Após o tempo expirar, o voluntário retornará ao seu nível de acesso padrão.
                </p>

                {hasTempPermission && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-amber-800 tracking-wider">
                        Cargo Temporário
                      </label>
                      <select
                        value={tempRole}
                        onChange={(e) => setTempRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 outline-none text-xs font-bold text-gray-700"
                      >
                        <option value="VOLUNTARIO">Voluntário</option>
                        <option value="ATENDENTE">Atendente</option>
                        <option value="RECEPCIONISTA">Recepcionista</option>
                        <option value="SECRETARIO">Secretário</option>
                        <option value="COORDENADOR">Coordenador</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="ADM">ADM (Admin)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-amber-800 tracking-wider">
                        Duração
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tempDurationValue}
                        onChange={(e) => setTempDurationValue(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 outline-none text-xs font-bold text-gray-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-amber-800 tracking-wider">
                        Unidade
                      </label>
                      <select
                        value={tempDurationUnit}
                        onChange={(e) => setTempDurationUnit(e.target.value as 'hours' | 'days')}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 outline-none text-xs font-bold text-gray-700"
                      >
                        <option value="hours">Horas</option>
                        <option value="days">Dias</option>
                      </select>
                    </div>

                    {editingWorker?.tempRoleExpiry && editingWorker?.tempRole && Date.now() < editingWorker.tempRoleExpiry && (
                      <div className="col-span-1 sm:col-span-3 p-2.5 bg-amber-100/50 rounded-lg text-[10px] text-amber-950 font-bold border border-amber-200/50 flex justify-between items-center">
                        <span>Acesso ativo como {editingWorker.tempRole} até {new Date(editingWorker.tempRoleExpiry).toLocaleString('pt-BR')}</span>
                        <span className="text-[9px] px-2 py-0.5 bg-amber-600 text-white rounded font-black uppercase tracking-wider animate-pulse">Ativo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              <div className="p-5 bg-indigo-50/50 rounded-[24px] border border-indigo-100 space-y-4">
                <h3 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-2">
                  <ShieldCheck size={14} /> Termo de Adesão ao Trabalho
                  Voluntário
                </h3>
                <div className="max-h-[80px] overflow-y-auto text-[10px] text-indigo-700/80 leading-relaxed font-medium bg-white/50 p-3 rounded-xl border border-indigo-100/50 custom-scrollbar">
                  <p className="mb-2">
                    Pelo presente instrumento, o voluntário adere ao trabalho
                    voluntário no{" "}
                    <strong>CENTRO ESPÍRITA MIRANTE DE LUZ</strong>, nos termos
                    da Lei nº 9.608/98.
                  </p>
                  <p className="mb-2">
                    O serviço voluntário não gera vínculo empregatício... O
                    voluntário declara estar ciente das normas da casa e
                    compromete-se a desempenhar suas tarefas com zelo e ética.
                  </p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newWorker.acceptedTerm}
                      onChange={(e) =>
                        setNewWorker({
                          ...newWorker,
                          acceptedTerm: e.target.checked,
                        })
                      }
                      className="peer hidden"
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-indigo-200 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                      <CheckCircle2
                        size={12}
                        className="text-white scale-0 peer-checked:scale-100 transition-transform"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                    Li e concordo com os termos de voluntariado da casa.
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingWorker(false);
                    resetWorkerForm();
                  }}
                  className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWorker}
                  className="flex-[1.5] py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isSubmittingWorker ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : editingWorker ? (
                    "Salvar Alterações"
                  ) : (
                    "Salvar Trabalhador"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Adicionar Setor */}
      {isAddingSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"
            onClick={() => setIsAddingSector(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">
                  {editingSector ? "Editar Setor" : "Novo Setor"}
                </h2>
                <p className="text-xs text-gray-400 font-medium tracking-tight">
                  Crie uma nova frente de atendimento.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingSector(false);
                  setEditingSector(null);
                  resetSectorForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form
              onSubmit={handleAddSector}
              className="p-8 space-y-5 overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-4 pr-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Nome do Setor
                  </label>
                  <input
                    required
                    value={newSector.name}
                    onChange={(e) =>
                      setNewSector({ ...newSector, name: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700"
                    placeholder="Ex: Evangelização Juvenil"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Tipo de Atividade
                    </label>
                    <select
                      value={newSector.type}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          type: e.target.value as SectorType,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700"
                    >
                      <option value="FRATERNO">Atendimento Fraterno</option>
                      <option value="PASSE">Passe & Fluidoterapia</option>
                      <option value="ARTE">Arte Espírita (Coral & Teatro)</option>
                      <option value="COMUNICACAO">Comunicação Social</option>
                      <option value="ESTUDO">Estudos</option>
                      <option value="INFANCIA">Infância & Juventude</option>
                      <option value="SOCIAL">Ação Social</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="MEDIUNICO">Trabalho Mediúnico</option>
                      <option value="OUTROS">Outros / Não Especificado</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Localização
                    </label>
                    <input
                      value={newSector.location}
                      onChange={(e) =>
                        setNewSector({ ...newSector, location: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Ex: Sala 3"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Setor Superior / Pai (Opcional)
                  </label>
                  <select
                    value={newSector.parentSectorId || ""}
                    onChange={(e) =>
                      setNewSector({ ...newSector, parentSectorId: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none border-none font-bold text-gray-700"
                  >
                    <option value="">-- Sem Setor Superior (Principal) --</option>
                    {sectors
                      .filter((s) => !editingSector || s.id !== editingSector.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Missão / Objetivo Geral
                  </label>
                  <textarea
                    rows={2}
                    value={newSector.mission}
                    onChange={(e) =>
                      setNewSector({ ...newSector, mission: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner"
                    placeholder="Qual a razão de existir deste setor?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Fundamentação Doutrinária
                  </label>
                  <input
                    value={newSector.foundation}
                    onChange={(e) =>
                      setNewSector({ ...newSector, foundation: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                    placeholder="Ex: O Evangelho Segundo o Espiritismo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Coordenador
                    </label>
                    <input
                      value={newSector.coordinator}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          coordinator: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Subcoordenador
                    </label>
                    <input
                      value={newSector.subcoordinator}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          subcoordinator: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Vice"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Secretário(a)
                    </label>
                    <input
                      value={newSector.secretary}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          secretary: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Horário de Trabalho
                    </label>
                    <input
                      value={newSector.schedule}
                      onChange={(e) =>
                        setNewSector({ ...newSector, schedule: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Ex: Terças 20h"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Frequência Reuniões de Equipe
                    </label>
                    <input
                      value={newSector.meetingFrequency}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          meetingFrequency: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Ex: Mensal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      A quem responde?
                    </label>
                    <input
                      value={newSector.reportsTo}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          reportsTo: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Ex: Diretoria Executiva"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Recursos e Materiais Necessários
                  </label>
                  <textarea
                    rows={2}
                    value={newSector.resources}
                    onChange={(e) =>
                      setNewSector({ ...newSector, resources: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner"
                    placeholder="Ex: Projetor, macas, computador"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Metas e Indicadores
                    </label>
                    <input
                      value={newSector.goals}
                      onChange={(e) =>
                        setNewSector({ ...newSector, goals: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Qualidade, frequência..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                      Principais Desafios
                    </label>
                    <input
                      value={newSector.challenges}
                      onChange={(e) =>
                        setNewSector({
                          ...newSector,
                          challenges: e.target.value,
                        })
                      }
                      className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium"
                      placeholder="Melhorar o que?"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Atividades Principais (separadas por vírgula)
                  </label>
                  <textarea
                    rows={2}
                    value={newSector.mainActivities}
                    onChange={(e) =>
                      setNewSector({
                        ...newSector,
                        mainActivities: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none shadow-inner"
                    placeholder="Ex: Passe, Estudo, Vibração"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Breve Descrição para Painéis
                  </label>
                  <textarea
                    rows={2}
                    value={newSector.description}
                    onChange={(e) =>
                      setNewSector({
                        ...newSector,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium resize-none"
                    placeholder="Finalidade resumida..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSector(false);
                    setEditingSector(null);
                    resetSectorForm();
                  }}
                  className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  {editingSector ? "Salvar Alterações" : "Criar Setor"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Trabalhador */}
      {isDeletingConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-red-950/40 backdrop-blur-sm"
            onClick={() => setIsDeletingConfirmOpen(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <Trash2 size={40} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Confirmar Exclusão
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Tem certeza que deseja excluir o trabalhador{" "}
                <strong className="text-gray-900">
                  {workerToDelete?.name}
                </strong>
                ?
              </p>
              <div className="text-[10px] text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-100 italic leading-relaxed text-left">
                <strong>Nota Importante:</strong> O perfil no banco de dados
                (Firestore) será eliminado. Por segurança, o acesso de login
                (Firebase Auth) não é removido automaticamente para evitar perda
                acidental de conta. Se você re-cadastrar este e-mail no futuro,
                o sistema perguntará se deseja reativar o acesso.
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeletingConfirmOpen(false)}
                className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteWorkerAction}
                className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal do Termo de Adesão e Impressão */}
      {selectedWorkerForTerm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            onClick={() => setSelectedWorkerForTerm(null)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileText size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-black text-gray-950 tracking-tight">
                    Termo de Voluntariado
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    Preenchimento Automático do Item 2
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkerForTerm(null)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/30 space-y-2">
              <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                Revise ou preencha as informações do voluntário <strong>{selectedWorkerForTerm.name}</strong> para o preenchimento da Cláusula 2 do termo contratual sob a Lei nº 9.608/98.
              </p>
              <p className="text-[10px] text-indigo-800/80 font-medium leading-normal">
                Ao salvar e imprimir, estas informações serão gravadas definitivamente no cadastro do voluntário no Firestore e uma aba de impressão otimizada será iniciada automaticamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">CPF do Voluntário</label>
                <input
                  type="text"
                  value={termWorkerData.cpf}
                  onChange={e => setTermWorkerData({...termWorkerData, cpf: e.target.value})}
                  placeholder="Ex: 313.211.515-00"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">RG do Voluntário</label>
                <input
                  type="text"
                  value={termWorkerData.rg}
                  onChange={e => setTermWorkerData({...termWorkerData, rg: e.target.value})}
                  placeholder="Ex: 24.394.89-7"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Profissão</label>
                <input
                  type="text"
                  value={termWorkerData.profession}
                  onChange={e => setTermWorkerData({...termWorkerData, profession: e.target.value})}
                  placeholder="Ex: professora letróloga"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Nacionalidade</label>
                <input
                  type="text"
                  value={termWorkerData.nationality}
                  onChange={e => setTermWorkerData({...termWorkerData, nationality: e.target.value})}
                  placeholder="Ex: brasileira"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Endereço Completo</label>
                <input
                  type="text"
                  value={termWorkerData.address}
                  onChange={e => setTermWorkerData({...termWorkerData, address: e.target.value})}
                  placeholder="Ex: Avenida Dom João VI, N°.195, Edf Aguassai, Apto 164"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Bairro</label>
                <input
                  type="text"
                  value={termWorkerData.neighborhood}
                  onChange={e => setTermWorkerData({...termWorkerData, neighborhood: e.target.value})}
                  placeholder="Ex: Brotas"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">Cidade</label>
                  <input
                    type="text"
                    value={termWorkerData.city}
                    onChange={e => setTermWorkerData({...termWorkerData, city: e.target.value})}
                    placeholder="Ex: Salvador"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 block">CEP</label>
                  <input
                    type="text"
                    value={termWorkerData.cep}
                    onChange={e => setTermWorkerData({...termWorkerData, cep: e.target.value})}
                    placeholder="Ex: 40.285-000"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2 border-t border-gray-100 pt-4">
                <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1 block">Data de Assinatura por Extenso</label>
                <input
                  type="text"
                  value={termDate}
                  onChange={e => setTermDate(e.target.value)}
                  placeholder="Ex: 22 de fevereiro de 2026"
                  className="w-full px-5 py-3.5 bg-indigo-50/30 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-indigo-100/50 focus:bg-white focus:border-indigo-600 font-bold text-gray-800 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedWorkerForTerm(null)}
                className="flex-1 py-3.5 font-bold text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAndPrintTerm}
                className="flex-1.5 py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                <span>Salvar & Gerar Termo</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Opções Avançadas de Manutenção e Produção */}
      {isAdmin && (
        <div className="pt-10 border-t border-gray-100 space-y-6">
          {/* Card 1: Limpeza para Produção */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 p-8 rounded-[32px] border border-emerald-200/60 shadow-sm">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Prontidão para Uso Real</span>
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Limpeza do Sistema para Início de Produção
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Zera as filas de atendimento, atendidos de teste, evoluções fictícias e o histórico de vendas de teste.
                <strong> Carlos Alberto, Cleiton Airon, todo o acervo de Audiobooks e o Catálogo de Livros da Livraria/Bazar são mantidos 100% intactos.</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setCleaningResult(null);
                setIsCleanProductionModalOpen(true);
              }}
              className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-200 flex items-center gap-2 shrink-0"
            >
              <Sparkles size={18} />
              <span>Limpar Dados de Teste</span>
            </button>
          </div>

          {/* Card 2: Restaurar Estrutura de Setores */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-[28px] border border-gray-200/70">
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                Verificação de Estrutura de Setores
              </h4>
              <p className="text-xs text-gray-500 font-medium max-w-md mt-0.5">
                Restaura setores básicos que possam ter sido removidos acidentalmente, sem apagar nenhum dado de atendimentos.
              </p>
            </div>
            <button
              onClick={async () => {
                if (
                  confirm(
                    "ATENÇÃO: Deseja restaurar a estrutura básica de setores caso tenham desaparecido? Dados de atendimentos existentes NÃO serão apagados.",
                  )
                ) {
                  try {
                    const restored = await dataService.populateDefaults();
                    if (restored) {
                      alert("Setores restaurados com sucesso!");
                      loadData();
                    } else {
                      alert(
                        "Os setores já existem ou não precisaram de restauração.",
                      );
                    }
                  } catch (err: any) {
                    alert("Erro ao restaurar: " + err.message);
                  }
                }
              }}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all text-xs flex items-center gap-2 shrink-0"
            >
              <ShieldCheck size={16} />
              <span>Verificar / Restaurar Setores</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Limpeza para Produção */}
      {isCleanProductionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isCleaningProgress && setIsCleanProductionModalOpen(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {cleaningResult ? (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    Sistema Pronto para Produção!
                  </h3>
                  <p className="text-sm text-gray-600 font-medium max-w-lg mx-auto">
                    Os dados de testes foram limpos e o banco de dados está devidamente preparado para os atendimentos reais da Casa Espírita.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
                  <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Resumo da Operação:
                  </div>
                  <ul className="text-xs text-slate-700 font-semibold space-y-2">
                    <li className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span><strong>Trabalhadores preservados:</strong> {cleaningResult.preservedWorkers.join(", ") || "Carlos Alberto e Cleiton Airon"}</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-700">
                      <Headphones size={16} className="shrink-0" />
                      <span><strong>Módulo Audiobooks:</strong> {cleaningResult.audiobooksPreservedCount} títulos e arquivos 100% mantidos sem alterações.</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-700">
                      <BookOpen size={16} className="shrink-0" />
                      <span><strong>Catálogo de Livros & PDV:</strong> {cleaningResult.productsPreservedCount} produtos cadastrados mantidos com histórico de vendas zerado.</span>
                    </li>
                    <li className="flex items-center gap-2 text-blue-700">
                      <RefreshCw size={16} className="shrink-0" />
                      <span><strong>Coleções de teste limpas:</strong> {cleaningResult.clearedCollections.join(", ")}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setIsCleanProductionModalOpen(false)}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all text-sm"
                >
                  Concluir e Voltar ao Sistema
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">
                        Preparar Sistema para Produção
                      </h3>
                      <p className="text-xs text-gray-500 font-bold mt-0.5">
                        Zerar dados temporários e manter registros essenciais
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isCleaningProgress}
                    onClick={() => setIsCleanProductionModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 space-y-2">
                    <div className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      <span>O que será PRESERVADO (100% Seguro):</span>
                    </div>
                    <ul className="text-xs text-emerald-950 font-medium space-y-1.5 list-disc list-inside">
                      <li><strong>Carlos Alberto & Cleiton Airon:</strong> Usuários, senhas, privilégios de Admin e acessos.</li>
                      <li><strong>Módulo Audiobooks & Podcasts:</strong> Todos os áudios, capítulos, capas e livros cadastrados.</li>
                      <li><strong>Catálogo da Livraria & Bazar:</strong> Todos os livros e produtos cadastrados (itens e preços).</li>
                      <li><strong>Estrutura da Casa:</strong> Todos os setores, salas e configurações de painel.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-2">
                    <div className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                      <Trash2 size={15} />
                      <span>O que será LIMPO / ZERADO:</span>
                    </div>
                    <ul className="text-xs text-amber-950 font-medium space-y-1.5 list-disc list-inside">
                      <li>Filas de atendimento e senhas geradas durante os testes.</li>
                      <li>Cadastros de participantes/assistidos fictícios criados em testes.</li>
                      <li>Prontuários e evoluções espirituais de teste.</li>
                      <li>Histórico de vendas do PDV e sessões de caixa anteriores.</li>
                      <li>Logs de auditoria antigos (um log limpo de produção será criado).</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={isCleaningProgress}
                    onClick={() => setIsCleanProductionModalOpen(false)}
                    className="flex-1 py-3.5 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all disabled:opacity-50 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={isCleaningProgress}
                    onClick={handleCleanProduction}
                    className="flex-[1.5] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-75"
                  >
                    {isCleaningProgress ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Executando Limpeza Segura...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Confirmar e Limpar para Produção</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
