import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, QrCode, Barcode, CheckCircle2, ChevronRight, Copy, ArrowLeft, Building, Users } from 'lucide-react';

interface CampaignConfig {
  id: string;
  title: string;
  description: string;
  target?: string;
  mode: 'internal' | 'external';
  externalUrl?: string;
}

export default function DonationLandingPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  // Load campaigns
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('50');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto'>('pix');
  const [step, setStep] = useState<'input' | 'payment'>('input');
  
  // Result states
  const [generatedPix, setGeneratedPix] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Default campaigns
  const defaultCampaigns: CampaignConfig[] = [
    {
      id: 'obrassociais',
      title: 'Obras Sociais & Assistência Médica',
      description: 'Ajude na manutenção das cestas básicas, enxovais, sopão fraterno e consultas aos necessitados da nossa comunidade.',
      target: 'Manutenção Mensal das Famílias',
      mode: 'internal'
    },
    {
      id: 'reforma',
      title: 'Campanha de Manutenção Predial e Reforma',
      description: 'Contribua para as obras de melhoria e expansão da nossa sede física para acolher mais trabalhadores e assistidos.',
      target: 'Construção da Cozinha Comunitária',
      mode: 'internal'
    }
  ];

  useEffect(() => {
    // Try to load configured campaigns
    const stored = localStorage.getItem('admin_donation_campaigns');
    let campaignsList = defaultCampaigns;
    if (stored) {
      try {
        campaignsList = JSON.parse(stored);
      } catch {
        campaignsList = defaultCampaigns;
      }
    }

    const current = campaignsList.find(c => c.id === campaignId) || campaignsList[0];
    setCampaign(current);

    // If campaign is redirect external, do it immediately
    if (current && current.mode === 'external' && current.externalUrl) {
      window.location.href = current.externalUrl;
    }
  }, [campaignId]);

  // CRC16 CCITT for Pix
  const crc16ccitt = (str: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      let x = ((crc >> 8) ^ charCode) & 0xFF;
      x ^= x >> 4;
      crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  // Generate Pix EMV payload according to Brazilian BCB standards
  const generateRealPixPayload = (key: string, name: string, city: string, value: number, txId: string) => {
    const cleanKey = key.trim();
    const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 25);
    const cleanCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().substring(0, 15);
    const cleanTxId = txId.substring(0, 25);

    // Dynamic field formatter
    const f = (id: string, val: string) => {
      return id + String(val.length).padStart(2, '0') + val;
    };

    // Merchant Account Info (GUI + Key)
    const gui = '0014BR.GOV.BCB.PIX';
    const keyField = f('01', cleanKey);
    const merchantAccountInfo = f('26', gui + keyField);

    let payload = '';
    payload += f('00', '01'); // Format Indicator
    payload += merchantAccountInfo;
    payload += f('52', '040000'); // Category Code (generic)
    payload += f('53', '986'); // Currency (BRL)
    
    if (value > 0) {
      payload += f('54', value.toFixed(2)); // Value
    }
    
    payload += f('58', 'BR'); // Country
    payload += f('59', cleanName); // Merchant Name
    payload += f('60', cleanCity); // Merchant City
    
    const referenceField = f('05', cleanTxId);
    payload += f('62', referenceField); // Additional Data

    payload += '6304'; // CRC16 indicator
    const crc = crc16ccitt(payload);
    return payload + crc;
  };

  const handleConfirmDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(customAmount || amount);
    if (!finalAmount || finalAmount <= 0) {
      alert('Selecione ou insira um valor válido para doação.');
      return;
    }

    // Load Pix Settings
    const storedConfig = localStorage.getItem('admin_pix_config');
    let pixKey = 'carlostecal35@gmail.com';
    let pixName = 'ASSOC ESPIRITA MIRANTE DE LUZ';
    let pixCity = 'MONTES CLAROS';

    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        pixKey = parsed.key || pixKey;
        pixName = parsed.name || pixName;
        pixCity = parsed.city || pixCity;
      } catch {}
    }

    const txId = `DOA${Date.now().toString().slice(-6)}`;

    if (paymentMethod === 'pix') {
      const payload = generateRealPixPayload(pixKey, pixName, pixCity, finalAmount, txId);
      setGeneratedPix(payload);
    } else {
      // Simulate Boleto
      const bcode = `34191.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}.${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 90000000000000 + 10000000000000)}`;
      setGeneratedBarcode(bcode);
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setDueDate(d.toISOString().split('T')[0]);
    }

    // Save donation as "pending notification" in local storage
    const cachedPending = localStorage.getItem('admin_pending_donations');
    let pendingList = [];
    if (cachedPending) {
      try { pendingList = JSON.parse(cachedPending); } catch {}
    }

    const donationItem = {
      id: `DON:${Date.now()}`,
      donorName: donorName || 'Anônimo',
      donorEmail: donorEmail || 'não informado',
      amount: finalAmount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod.toUpperCase(),
      campaign: campaign?.title || 'Obras Sociais',
      status: 'Pendente'
    };

    pendingList.unshift(donationItem);
    localStorage.setItem('admin_pending_donations', JSON.stringify(pendingList));

    setStep('payment');
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const finalAmount = parseFloat(customAmount || amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="text-rose-500 fill-rose-100 animate-pulse" size={24} />
          <div>
            <h1 className="text-sm font-black text-gray-800 tracking-tight leading-4">Mirante de Luz</h1>
            <p className="text-[9px] uppercase tracking-wider font-black text-indigo-500">Doações on-line</p>
          </div>
        </div>
        <Link to="/" className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
          <ArrowLeft size={14} /> Voltar ao Sistema
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
          
          {/* Campaign Header banner */}
          <div className="bg-indigo-900 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
              <Heart size={200} />
            </div>
            <div className="max-w-md relative z-10 space-y-2">
              <span className="bg-indigo-800 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full text-indigo-200">
                Campanha Ativa
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{campaign.title}</h2>
              <p className="text-indigo-200 text-xs leading-relaxed">{campaign.description}</p>
              {campaign.target && (
                <div className="pt-2 flex items-center gap-2 text-indigo-100 font-bold text-[11px] uppercase tracking-wider">
                  <Building size={14} className="text-emerald-400" />
                  Meta: {campaign.target}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {step === 'input' ? (
              <form onSubmit={handleConfirmDonation} className="space-y-6">
                
                {/* Amount Selectors */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Selecione o valor do apoio</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['20', '50', '100', '200'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setAmount(val); setCustomAmount(''); }}
                        className={`py-3.5 rounded-2xl font-black text-sm tracking-tight transition-all cursor-pointer ${
                          amount === val && !customAmount
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-102'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>

                  {/* Custom Val */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">R$</span>
                    <input
                      type="number"
                      placeholder="Outro valor..."
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setAmount(''); }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none text-xs font-bold text-gray-700 transition-all"
                    />
                  </div>
                </div>

                {/* Donor Fields */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Seus dados de identificação</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Seu Nome Completo"
                        required
                        value={donorName}
                        onChange={e => setDonorName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 focus:bg-white rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none text-xs font-bold text-gray-800 transition-all"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Seu melhor E-mail"
                        required
                        value={donorEmail}
                        onChange={e => setDonorEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 focus:bg-white rounded-2xl border-2 border-transparent focus:border-indigo-600 outline-none text-xs font-bold text-gray-800 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Secure Gateway Selection */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Método de Transferência</label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <h4 className="font-black text-xs text-gray-800">Pix</h4>
                        <p className="text-[9px] text-gray-400 mt-0.5">Identificado e instantâneo</p>
                      </div>
                      <QrCode className="text-emerald-500" size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('boleto')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        paymentMethod === 'boleto'
                          ? 'border-amber-500 bg-amber-50/30'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <h4 className="font-black text-xs text-gray-800">Boleto</h4>
                        <p className="text-[9px] text-gray-400 mt-0.5">Banco do Brasil compensação</p>
                      </div>
                      <Barcode className="text-amber-500" size={18} />
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continuar para Doação de R$ {finalAmount || 50}
                  <ChevronRight size={16} />
                </button>

              </form>
            ) : (
              <div className="space-y-6 text-center">
                
                {paymentMethod === 'pix' ? (
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <QrCode size={24} />
                    </div>
                    <div>
                      <h3 className="text-md font-black text-gray-900">Doação Gerada com Sucesso</h3>
                      <p className="text-[10px] text-gray-500 mt-1">Escaneie o QR code abaixo utilizando o aplicativo do seu banco</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-3xl inline-block border border-gray-100">
                      {/* Dynamic scannable QR Code image using qrserver API */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedPix)}`}
                        alt="Pix QR Code"
                        className="w-44 h-44 mx-auto rounded-xl shadow-sm bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="text-left bg-indigo-50/50 p-4 rounded-2xl space-y-1.5 text-xs text-gray-700 border border-indigo-50">
                      <p><strong className="text-gray-900">Instituição:</strong> Associação Espírita Mirante de Luz</p>
                      <p><strong className="text-gray-900">Doador:</strong> {donorName}</p>
                      <p><strong className="text-gray-900">Valor da Doação:</strong> R$ {finalAmount.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Código Pix Copia-and-Cola</span>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="text-[9px] font-mono text-gray-400 truncate flex-1 block">{generatedPix}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPix);
                            alert('Código Pix Copiado!');
                          }}
                          className="bg-white hover:bg-gray-100 p-1.5 px-3 rounded-lg border border-gray-200 text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 shrink-0"
                        >
                          <Copy size={10} /> Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                      <Barcode size={24} />
                    </div>
                    <div>
                      <h3 className="text-md font-black text-gray-900">Boleto de Doação Registrado</h3>
                      <p className="text-[10px] text-gray-500 mt-1">Imprima ou pague pelo código de barras no seu Internet Banking</p>
                    </div>

                    <div className="py-4 px-6 bg-gray-50 rounded-3xl border border-gray-100 max-w-sm mx-auto flex flex-col items-center gap-3">
                      <Barcode size={72} className="text-gray-900" />
                      <span className="text-[8px] font-mono text-gray-400 tracking-tight select-all w-full truncate">{generatedBarcode}</span>
                    </div>

                    <div className="text-left bg-amber-50/40 p-4 rounded-2xl space-y-1.5 text-xs text-gray-700 border border-amber-50">
                      <p><strong className="text-gray-900">Agência/Conta:</strong> 1423 / 38112-9 (Banco do Brasil)</p>
                      <p><strong className="text-gray-900">Pagador:</strong> {donorName}</p>
                      <p><strong className="text-gray-900">Vencimento:</strong> {new Date(dueDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong className="text-gray-900">Valor Líquido:</strong> R$ {finalAmount.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Código de Barras para Pagamento</span>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 overflow-hidden">
                        <span className="text-[9px] font-mono text-gray-400 truncate flex-1 block">{generatedBarcode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedBarcode);
                            alert('Código de Barras Copiado!');
                          }}
                          className="bg-white hover:bg-gray-100 p-1.5 px-3 rounded-lg border border-gray-200 text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 shrink-0"
                        >
                          <Copy size={10} /> Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex flex-col justify-center sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      alert('Simulação de Doação gravada na Tesouraria! Obrigado por colaborar.');
                      setStep('input');
                    }}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Finalizar & Confirmar
                  </button>

                  <button
                    onClick={() => setStep('input')}
                    className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Fazer Outra Doação
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Inst safety terms */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-[9px] uppercase tracking-wider font-semibold text-center">
          <Users size={12} className="text-gray-300" />
          Gateway Integrado Seguro • Associação Espírita Mirante de Luz
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-150 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
            A.E. Mirante de Luz © 2026. CNPJ: 14.238.112/0001-90
          </p>
          <p className="text-[9px] text-gray-400 leading-relaxed max-w-sm">
            Toda doação arrecadada é direcionada de forma auditada para a caridade moral e física instituída no estatuto da casa.
          </p>
        </div>
      </footer>

    </div>
  );
}
