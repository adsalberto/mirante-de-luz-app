import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck, Plus, Search, Filter, Download, 
  Calendar, ShieldCheck, CheckCircle2, UserCheck, 
  Edit2, Trash2, X, Sparkles, QrCode, FileText, Check
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AdminDocumento, DocumentoOficialTipo, DocumentoOficialStatus } from '../../types';
import { formatDateBR, getTodayBR } from '../../lib/utils';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const DOC_TIPO_CONFIG: Record<DocumentoOficialTipo, { label: string; bg: string; text: string }> = {
  TERMO_VOLUNTARIADO_LEI_9608: { label: 'Termo de Voluntariado (Lei 9.608)', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  TERMO_LGPD: { label: 'Termo de Consentimento LGPD', bg: 'bg-purple-50', text: 'text-purple-700' },
  DECLARACAO_FREQUENCIA: { label: 'Declaração de Frequência / Estudo', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  OFICIO_EXPEDIDO: { label: 'Ofício Expedido', bg: 'bg-blue-50', text: 'text-blue-700' },
  OFICIO_RECEBIDO: { label: 'Ofício Recebido / Protocolo', bg: 'bg-amber-50', text: 'text-amber-700' },
  CERTIFICADO_ESTUDOS: { label: 'Certificado de Conclusão Doutrinária', bg: 'bg-rose-50', text: 'text-rose-700' }
};

const DOC_STATUS_CONFIG: Record<DocumentoOficialStatus, { label: string; bg: string; text: string }> = {
  EMITIDO: { label: 'Emitido', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  ASSINADO: { label: 'Assinado & Válido', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  ARQUIVADO: { label: 'Arquivado', bg: 'bg-gray-100', text: 'text-gray-800' }
};

export const DocumentosOficiaisView: React.FC = () => {
  const [documentos, setDocumentos] = useState<AdminDocumento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminDocumento | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'TERMO_VOLUNTARIADO_LEI_9608' as DocumentoOficialTipo,
    destinatarioOuBeneficiario: '',
    cpfOuDocumento: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    conteudo: '',
    status: 'ASSINADO' as DocumentoOficialStatus,
    responsavelEmissao: 'Secretaria Geral CEMIL'
  });

  useEffect(() => {
    const unsub = dataService.subscribeAdminDocumentos((list) => {
      setDocumentos(list || []);
    });
    return () => unsub();
  }, []);

  const getTemplateForTipo = (tipo: DocumentoOficialTipo, nome: string, docNum: string) => {
    const todayStr = getTodayBR();
    const safeNome = nome || '[NOME COMPLETO DO BENEFICIÁRIO/TRABALHADOR]';
    const safeDoc = docNum || '[CPF OU RG]';

    switch (tipo) {
      case 'TERMO_VOLUNTARIADO_LEI_9608':
        return `TERMO DE ADESÃO AO SERVIÇO VOLUNTÁRIO (Lei Federal nº 9.608/1998)\n\nPelo presente instrumento particular, o CENTRO ESPÍRITA MIRANTE DE LUZ (CEMIL), pessoa jurídica de direito privado sem fins lucrativos, e o(a) voluntário(a) ${safeNome}, portador(a) do CPF ${safeDoc}, celebram o presente Termo de Adesão de Serviço Voluntário, nos termos da Lei nº 9.608, de 18 de fevereiro de 1998.\n\n1. O serviço voluntário será prestado de forma espontânea, sem remuneração, não gerando qualquer vínculo empregatício, nem obrigação de natureza trabalhista, previdenciária ou afim.\n2. O(a) voluntário(a) atuará nas atividades de acolhimento fraterno, assistência social e doutrinária sob as diretrizes do Estatuto Social e do Regimento Interno do CEMIL.\n3. O presente termo possui validade por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante comunicação prévia.`;

      case 'TERMO_LGPD':
        return `TERMO DE CONSENTIMENTO E TRATAMENTO DE DADOS PESSOAIS (LGPD - Lei nº 13.709/2018)\n\nEu, ${safeNome}, portador(a) do documento nº ${safeDoc}, autorizo expressamente o CENTRO ESPÍRITA MIRANTE DE LUZ (CEMIL) a realizar a coleta e o tratamento dos meus dados cadastrais e de frequência, exclusivamente para fins de gestão institucional, escalas de voluntariado, comunicações doutrinárias e cumprimento de obrigações legais.\n\nFica garantido o direito de acesso, retificação, bloqueio e eliminação dos dados a qualquer momento, conforme assegurado pelo Art. 18 da Lei Geral de Proteção de Dados.`;

      case 'DECLARACAO_FREQUENCIA':
        return `DECLARAÇÃO DE FREQUÊNCIA E PARTICIPAÇÃO DOUTRINÁRIA\n\nDeclaramos para os devidos fins de direito que o(a) Sr.(a) ${safeNome}, portador(a) do documento nº ${safeDoc}, participa regularmente das reuniões públicas, grupos de estudos doutrinários e atividades promovidas por esta instituição espírita, mantendo conduta fraterna e assídua.\n\nPor ser a expressão da verdade, firmamos a presente declaração em ${todayStr}.`;

      case 'OFICIO_EXPEDIDO':
        return `OFÍCIO EXPEDIDO Nº ${String(documentos.length + 1).padStart(3, '0')}/${new Date().getFullYear()}\n\nAo(À) Ilmo(a). Senhor(a): ${safeNome}\n\nCumprimentando-o(a) fraternalmente, vimos por meio deste solicitar / encaminhar as informações referentes às atividades institucionais desenvolvidas pelo Centro Espírita Mirante de Luz em prol da comunidade.\n\nCertos de contar com sua costumeira atenção e fraternidade, renovamos nossos votos de estima e consideração.`;

      case 'OFICIO_RECEBIDO':
        return `PROTOCOLO DE OFÍCIO / CORRESPONDÊNCIA RECEBIDA\n\nRemetente: ${safeNome}\nDocumento / Referência: ${safeDoc}\nData de Entrada: ${todayStr}\n\nAssunto registrado nos arquivos da Secretaria Geral para conhecimento da Diretoria Executiva e deliberações cabíveis.`;

      case 'CERTIFICADO_ESTUDOS':
        return `CERTIFICADO DE CONCLUSÃO DE ESTUDOS DOUTRINÁRIOS\n\nCertificamos que ${safeNome}, concluiu com aproveitamento e assiduidade o Curso Regular de Doutrina Espírita / Formação de Trabalhadores no ano letivo corrente, cumprindo carga horária total e participando ativamente dos módulos teóricos e práticos com base nas obras fundamentais de Allan Kardec e diretrizes da Federação Espírita Brasileira (FEB).`;

      default:
        return '';
    }
  };

  const handleOpenModal = (item?: AdminDocumento) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        titulo: item.titulo,
        tipo: item.tipo,
        destinatarioOuBeneficiario: item.destinatarioOuBeneficiario,
        cpfOuDocumento: item.cpfOuDocumento || '',
        dataEmissao: item.dataEmissao,
        conteudo: item.conteudo,
        status: item.status,
        responsavelEmissao: item.responsavelEmissao
      });
    } else {
      const initialTipo: DocumentoOficialTipo = 'TERMO_VOLUNTARIADO_LEI_9608';
      setEditingItem(null);
      setFormData({
        titulo: DOC_TIPO_CONFIG[initialTipo].label,
        tipo: initialTipo,
        destinatarioOuBeneficiario: '',
        cpfOuDocumento: '',
        dataEmissao: new Date().toISOString().split('T')[0],
        conteudo: getTemplateForTipo(initialTipo, '', ''),
        status: 'ASSINADO',
        responsavelEmissao: 'Secretaria Geral CEMIL'
      });
    }
    setIsModalOpen(true);
  };

  const handleTipoChange = (tipo: DocumentoOficialTipo) => {
    setFormData(prev => ({
      ...prev,
      tipo,
      titulo: DOC_TIPO_CONFIG[tipo].label,
      conteudo: getTemplateForTipo(tipo, prev.destinatarioOuBeneficiario, prev.cpfOuDocumento)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.destinatarioOuBeneficiario.trim()) return;

    const verificationCode = `CEMIL-DOC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const item: AdminDocumento = {
      id: editingItem ? editingItem.id : `doc_${Date.now()}`,
      titulo: formData.titulo.trim(),
      tipo: formData.tipo,
      destinatarioOuBeneficiario: formData.destinatarioOuBeneficiario.trim(),
      cpfOuDocumento: formData.cpfOuDocumento.trim() || undefined,
      dataEmissao: formData.dataEmissao,
      conteudo: formData.conteudo.trim(),
      status: formData.status,
      codigoVerificacao: editingItem?.codigoVerificacao || verificationCode,
      responsavelEmissao: formData.responsavelEmissao.trim(),
      createdAt: editingItem ? editingItem.createdAt : Date.now()
    };

    await dataService.saveAdminDocumento(item);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (window.confirm(`Deseja realmente excluir o documento "${titulo}"?`)) {
      await dataService.deleteAdminDocumento(id);
    }
  };

  const exportDocumentoPDF = async (item: AdminDocumento) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 27, 75); // Indigo 950
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('CENTRO ESPÍRITA MIRANTE DE LUZ', 14, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Secretaria Geral & Diretoria Executiva • Expedição de Documento Oficial', 14, 22);
    doc.text(`Autenticidade: ${item.codigoVerificacao || 'VALIDADO-DIGITALMENTE'}`, 14, 28);

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(item.titulo.toUpperCase(), 14, 46);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Destinatário / Titular: ${item.destinatarioOuBeneficiario}`, 14, 53);
    if (item.cpfOuDocumento) {
      doc.text(`Documento / CPF: ${item.cpfOuDocumento}`, 14, 59);
    }
    doc.text(`Data de Expedição: ${formatDateBR(item.dataEmissao)}`, 14, item.cpfOuDocumento ? 65 : 59);

    // Content body
    const startY = item.cpfOuDocumento ? 76 : 70;
    doc.setFontSize(10);
    const splitContent = doc.splitTextToSize(item.conteudo, 180);
    doc.text(splitContent, 14, startY);

    const endY = startY + (splitContent.length * 5.5) + 20;

    // QR Code generation for authenticity
    try {
      const qrData = `CEMIL|DOC|${item.codigoVerificacao}|${item.destinatarioOuBeneficiario}|${item.dataEmissao}`;
      const qrUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
      doc.addImage(qrUrl, 'PNG', 14, Math.min(endY, 230), 28, 28);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Documento assinado digitalmente pelo Centro Espírita Mirante de Luz.', 46, Math.min(endY, 230) + 10);
      doc.text(`Código de Autenticação: ${item.codigoVerificacao}`, 46, Math.min(endY, 230) + 15);
      doc.text(`Emissor: ${item.responsavelEmissao}`, 46, Math.min(endY, 230) + 20);
    } catch (e) {
      console.warn('QR Code generation failed in PDF export', e);
    }

    doc.save(`${item.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${item.destinatarioOuBeneficiario.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const filteredDocumentos = documentos.filter(item => {
    const matchSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destinatarioOuBeneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigoVerificacao && item.codigoVerificacao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filterTipo === 'TODOS' || item.tipo === filterTipo;
    const matchStatus = filterStatus === 'TODOS' || item.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por titular, documento ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos os Modelos</option>
              <option value="TERMO_VOLUNTARIADO_LEI_9608">Termo Voluntariado</option>
              <option value="TERMO_LGPD">Termo LGPD</option>
              <option value="DECLARACAO_FREQUENCIA">Declarações</option>
              <option value="OFICIO_EXPEDIDO">Ofícios Expedidos</option>
              <option value="OFICIO_RECEBIDO">Ofícios Recebidos</option>
              <option value="CERTIFICADO_ESTUDOS">Certificados</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
            >
              <option value="TODOS">Todos Status</option>
              <option value="EMITIDO">Emitidos</option>
              <option value="ASSINADO">Assinados</option>
              <option value="ARQUIVADO">Arquivados</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          <span>Expedir Documento</span>
        </button>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocumentos.length > 0 ? (
          filteredDocumentos.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${DOC_TIPO_CONFIG[item.tipo]?.bg} ${DOC_TIPO_CONFIG[item.tipo]?.text}`}>
                    {DOC_TIPO_CONFIG[item.tipo]?.label}
                  </span>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${DOC_STATUS_CONFIG[item.status]?.bg} ${DOC_STATUS_CONFIG[item.status]?.text}`}>
                    {DOC_STATUS_CONFIG[item.status]?.label}
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-sm tracking-tight mb-1">{item.titulo}</h4>
                <p className="text-xs text-gray-600 mb-2"><b>Titular:</b> {item.destinatarioOuBeneficiario}</p>

                <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-500 font-mono flex items-center justify-between mb-4">
                  <span>Cód: {item.codigoVerificacao || 'VALIDADO'}</span>
                  <span>{formatDateBR(item.dataEmissao)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => exportDocumentoPDF(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download size={13} />
                  <span>Baixar PDF</span>
                </button>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.titulo)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
            <FileCheck size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Nenhum documento emitido</p>
            <p className="text-xs text-gray-400 mt-1">Expeda termos de voluntariado (Lei 9.608), consentimentos LGPD ou declarações em segundos.</p>
          </div>
        )}
      </div>

      {/* Modal Emissão de Documento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <FileCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {editingItem ? 'Editar Documento' : 'Expedir Novo Documento Oficial'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Secretaria Geral CEMIL • Emissão com Validação Digital</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Modelo do Documento Oficial *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleTipoChange(e.target.value as DocumentoOficialTipo)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="TERMO_VOLUNTARIADO_LEI_9608">Termo de Voluntariado (Lei Federal 9.608/1998)</option>
                      <option value="TERMO_LGPD">Termo de Consentimento e Privacidade (LGPD)</option>
                      <option value="DECLARACAO_FREQUENCIA">Declaração de Frequência e Estudos</option>
                      <option value="OFICIO_EXPEDIDO">Ofício Expedido da Diretoria</option>
                      <option value="OFICIO_RECEBIDO">Ofício Recebido / Protocolo de Entrada</option>
                      <option value="CERTIFICADO_ESTUDOS">Certificado de Conclusão de Curso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nome do Titular / Destinatário *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.destinatarioOuBeneficiario}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          destinatarioOuBeneficiario: val,
                          conteudo: getTemplateForTipo(formData.tipo, val, formData.cpfOuDocumento)
                        });
                      }}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      CPF / Documento de Identidade
                    </label>
                    <input
                      type="text"
                      value={formData.cpfOuDocumento}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          cpfOuDocumento: val,
                          conteudo: getTemplateForTipo(formData.tipo, formData.destinatarioOuBeneficiario, val)
                        });
                      }}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      value={formData.dataEmissao}
                      onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Status do Documento
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as DocumentoOficialStatus })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="ASSINADO">Assinado & Válido</option>
                      <option value="EMITIDO">Emitido (Aguardando Assinatura)</option>
                      <option value="ARQUIVADO">Arquivado</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Conteúdo do Documento (Personalizável) *
                    </label>
                    <textarea
                      rows={8}
                      required
                      value={formData.conteudo}
                      onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    {editingItem ? 'Atualizar Documento' : 'Gerar e Expedir Documento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
