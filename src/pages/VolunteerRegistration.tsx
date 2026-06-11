import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Sector, SectorType, SECTOR_TYPE_LABELS, formatSectorName } from '../types';
import { cn } from '../lib/utils';

import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { ImageUpload } from '../components/ImageUpload';

export default function VolunteerRegistration() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // New field
    phone: '',
    sectorId: '',
    photoUrl: '', // New field
    activityType: 'OUTROS' as SectorType,
    acceptedTerm: false,
    lgpdConsent: false,
    observation: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    cpf: '',
    rg: '',
    address: '',
    cep: '',
    neighborhood: '',
    city: 'Salvador',
    profession: '',
    nationality: 'brasileira'
  });

  useEffect(() => {
    loadSectors();
  }, []);

  // Auto-select sector when activity type changes OR when sectors load
  useEffect(() => {
    if (sectors.length > 0 && formData.activityType !== 'OUTROS') {
      const matchingSectors = sectors.filter(s => s.type === formData.activityType);
      if (matchingSectors.length > 0) {
        // If current sectorId is not valid for this activity type, pick the first one
        if (!formData.sectorId || !matchingSectors.some(s => s.id === formData.sectorId)) {
          setFormData(prev => ({ ...prev, sectorId: matchingSectors[0].id }));
        }
      }
    }
  }, [formData.activityType, sectors]);

  const loadSectors = async () => {
    const data = await dataService.getSectors();
    if (data && data.length > 0) {
      const uniqueS: Sector[] = [];
      const seenNames = new Set<string>();
      data.forEach(item => {
        const normName = formatSectorName(item.name);
        if (!seenNames.has(normName)) {
          seenNames.add(normName);
          uniqueS.push({ ...item, name: normName });
        }
      });
      setSectors(uniqueS);
    } else {
      // In case they are empty, try to populate defaults
      await dataService.populateDefaults();
      const retryData = await dataService.getSectors();
      if (retryData) {
        const uniqueS: Sector[] = [];
        const seenNames = new Set<string>();
        retryData.forEach(item => {
          const normName = formatSectorName(item.name);
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueS.push({ ...item, name: normName });
          }
        });
        setSectors(uniqueS);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerm || !formData.lgpdConsent) {
      alert('Por favor, aceite os termos de voluntariado e o consentimento LGPD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const email = formData.email.toLowerCase().trim();
      // 1. Create Auth Account First
      const authRes = await createUserWithEmailAndPassword(auth, email, formData.password);
      const uid = authRes.user.uid;

      // 2. Create Firestore Profile
      await dataService.addWorker({
        id: uid, // Use Auth UID
        name: formData.name,
        email: email,
        photoUrl: formData.photoUrl, // Save photo
        phone: formData.phone,
        role: 'VOLUNTARIO',
        sectorId: formData.sectorId || undefined,
        observation: !formData.sectorId ? `Interesse: ${formData.activityType}. ${formData.observation}` : formData.observation,
        acceptedTerm: true,
        termAcceptedAt: Date.now(),
        lgpdConsent: true,
        lgpdDate: Date.now(),
        active: false,
        createdAt: Date.now(),
        bloodType: formData.bloodType || '',
        allergies: formData.allergies || '',
        emergencyContact: formData.emergencyContact || '',
        cpf: formData.cpf || '',
        rg: formData.rg || '',
        address: formData.address || '',
        cep: formData.cep || '',
        neighborhood: formData.neighborhood || '',
        city: formData.city || 'Salvador',
        profession: formData.profession || '',
        nationality: formData.nationality || 'brasileira',
      });
      
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        alert('ERRO: Este e-mail já está cadastrado no sistema.\n\nSugestões:\n1. Se você já é cadastrado, tente fazer login.\n2. Se esqueceu sua senha, use a opção "Esqueci minha senha" na tela de login.\n3. Se você nunca se cadastrou, verifique se digitou o e-mail corretamente.');
      } else if (err.code === 'auth/weak-password') {
        alert('A senha informada é frágil. Por favor, use pelo menos 6 caracteres.');
      } else {
        alert('Não foi possível completar seu cadastro no momento. Por favor, tente novamente mais tarde ou entre em contato com a coordenação.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-xl shadow-indigo-100 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Cadastro Recebido!</h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            Sua solicitação foi enviada com sucesso para o <strong>Mirante de Luz</strong>. 
            Nossa equipe entrará em contato em breve para liberar seu acesso.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-[32px] md:rounded-[40px] shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col md:flex-row md:min-h-[800px] lg:h-[850px]">
        
        {/* Lado Esquerdo: Info */}
        <div className="md:w-[35%] bg-indigo-600 p-6 md:p-12 text-white space-y-8 md:space-y-12 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <Link to="/login" className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors font-bold text-xs">
              <ArrowLeft size={14} /> Voltar ao Login
            </Link>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Heart size={24} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black leading-tight italic tracking-tighter">CEMIL</h1>
              <p className="text-[10px] text-indigo-200 uppercase tracking-[0.2em] font-bold">Gestão Institucional</p>
              <div className="h-1 w-12 bg-indigo-400/30 rounded-full mt-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Seja um Mirante</h2>
              <p className="text-sm text-indigo-100/70 mt-2 font-medium leading-relaxed">
                O trabalho voluntário é o exercício do amor ao próximo. Junte-se à nossa corrente de bem.
              </p>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl space-y-2 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Info size={12} /> Importante
            </h3>
            <p className="text-[10px] text-indigo-100/90 leading-relaxed font-medium">
              Seu cadastro será analisado pela coordenação. Você receberá um aviso quando liberado.
            </p>
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="md:w-[65%] p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Formulário de Adesão</h2>
              <p className="text-xs font-medium text-gray-400">Dados do novo colaborador voluntário</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Nome Completo</label>
                <div className="flex flex-col md:flex-row gap-6 mt-2">
                  <div className="w-full md:w-32 shrink-0">
                    <ImageUpload 
                      value={formData.photoUrl} 
                      onChange={val => setFormData({...formData, photoUrl: val})}
                      label="Foto"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-sm" 
                        placeholder="Seu nome completo..." 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">E-mail Corporativo</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-sm" 
                    placeholder="Seu melhor e-mail" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Senha de Acesso</label>
                <div className="relative group">
                  <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required 
                    type="password"
                    minLength={6}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-sm" 
                    placeholder="Min. 6 caracteres" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Telefone / WhatsApp</label>
                <div className="relative group">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-sm" 
                    placeholder="(00) 00000-0000" 
                  />
                </div>
              </div>


              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Tipo de Atividade</label>
                <select 
                  required
                  value={formData.activityType} 
                  onChange={e => setFormData({...formData, activityType: e.target.value as SectorType})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold appearance-none text-gray-700 text-sm"
                >
                  <option value="OUTROS">Selecione...</option>
                  <option value="FRATERNO">Atendimento Fraterno</option>
                  <option value="ESTUDO">Estudos</option>
                  <option value="INFANCIA">Infância & Juventude</option>
                  <option value="SOCIAL">Ação Social</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Setor Específico (Sugerido)</label>
                <select 
                  value={formData.sectorId} 
                  onChange={e => setFormData({...formData, sectorId: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold appearance-none text-gray-700 text-sm"
                >
                  <option value="">Selecione ou confirme o setor...</option>
                  {sectors.filter(s => s.type === formData.activityType).map(s => (
                    <option key={s.id} value={s.id}>{formatSectorName(s.name)}</option>
                  ))}
                </select>
              </div>

              {/* Documentação e Endereço para Termo de Adesão (Item 2) */}
              <div id="secao-documentacao-termo" className="md:col-span-2 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-600 rounded-lg text-white">
                    <ShieldCheck size={14} />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-indigo-950 tracking-wider">Dados Auxiliares de Voluntário (Item 2 - Termo de Adesão)</h4>
                    <p className="text-[9px] text-indigo-700/80 font-bold">Estas informações preenchem automaticamente seu Termo Oficial de Voluntariado para assinatura física ou digital.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">CPF</label>
                    <input
                      type="text"
                      required
                      value={formData.cpf}
                      onChange={e => setFormData({...formData, cpf: e.target.value})}
                      placeholder="Ex: 000.000.000-00"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">RG</label>
                    <input
                      type="text"
                      required
                      value={formData.rg}
                      onChange={e => setFormData({...formData, rg: e.target.value})}
                      placeholder="Ex: 00.000.000-0"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Profissão</label>
                    <input
                      type="text"
                      required
                      value={formData.profession}
                      onChange={e => setFormData({...formData, profession: e.target.value})}
                      placeholder="Ex: professora letróloga, autônomo, estudante..."
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Nacionalidade</label>
                    <input
                      type="text"
                      required
                      value={formData.nationality}
                      onChange={e => setFormData({...formData, nationality: e.target.value})}
                      placeholder="Ex: brasileira, portuguesa, etc."
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Endereço Residencial (Rua / Av., Nº, Apto, Edf.)</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Ex: Avenida Dom João VI, N°.195, Edf Aguassai, Apto 164"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Bairro</label>
                    <input
                      type="text"
                      required
                      value={formData.neighborhood}
                      onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      placeholder="Ex: Brotas"
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Cidade</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">CEP</label>
                      <input
                        type="text"
                        required
                        value={formData.cep}
                        onChange={e => setFormData({...formData, cep: e.target.value})}
                        placeholder="Ex: 40.285-000"
                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all border border-transparent focus:bg-white focus:border-indigo-600 ring-1 ring-gray-200 focus:ring-2 font-medium text-gray-700 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ficha Médica de Emergência */}
              <div className="md:col-span-2 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-amber-500 rounded-lg text-white">
                    <Heart size={14} className="fill-white" />
                  </span>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-amber-950 tracking-wider">Ficha Médica de Emergência (Opcional)</h4>
                    <p className="text-[9px] text-amber-700/80 font-bold">Para impressão no verso da sua carteirinha de voluntário (CR80) em caso de necessidade.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-900/60 tracking-wider ml-1 block">
                      Tipo Sanguíneo
                    </label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodType: e.target.value })
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
                      value={formData.allergies}
                      onChange={(e) =>
                        setFormData({ ...formData, allergies: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all border border-amber-150 font-bold text-gray-700 text-xs text-left"
                      placeholder="Ex: Antiinflamatório..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-amber-900/60 tracking-wider ml-1 block">
                      Contato de Emergência
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContact: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-amber-200 transition-all border border-amber-150 font-bold text-gray-700 text-xs text-left"
                      placeholder="Ex: Nome - (42) 9999-9999"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider ml-1">Observações Adicionais</label>
                <textarea 
                  rows={2}
                  value={formData.observation} 
                  onChange={e => setFormData({...formData, observation: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-medium text-sm resize-none" 
                  placeholder="Conte um pouco sobre sua experiência..." 
                />
              </div>
            </div>

            {/* Termos e LGPD */}
            <div className="space-y-3">
              {/* Termo de Voluntariado */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <h3 className="text-[10px] font-black uppercase text-indigo-900 flex items-center gap-2">
                  <ShieldCheck size={12} /> Termo de Trabalho Voluntário
                </h3>
                <div className="max-h-[60px] overflow-y-auto text-[9px] text-indigo-700/80 leading-relaxed font-medium bg-white/50 p-2 rounded-lg border border-indigo-100/50">
                  <p className="mb-1">Pelo presente, o voluntário adere ao trabalho no <strong>Centro Espírita Mirante de Luz</strong> (Lei 9.608/98). Sem vínculo empregatício.</p>
                  <p>O voluntário compromete-se a observar o sigilo rigoroso das informações e as normas da casa.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" required checked={formData.acceptedTerm} onChange={e => setFormData({...formData, acceptedTerm: e.target.checked})} className="peer hidden" />
                    <div className="w-5 h-5 rounded-md border-2 border-indigo-200 bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-900 group-hover:text-indigo-600">Aceito o Termo de Voluntariado</span>
                </label>
              </div>

              {/* Termo LGPD */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                <h3 className="text-[10px] font-black uppercase text-amber-900 flex items-center gap-2">
                  <ShieldCheck size={12} /> Consentimento LGPD
                </h3>
                <div className="max-h-[60px] overflow-y-auto text-[9px] text-amber-700/80 leading-relaxed font-medium bg-white/50 p-2 rounded-lg border border-amber-100/50">
                  <p>Autorizo o <strong>Mirante de Luz</strong> a tratar meus dados pessoais para fins de gestão de escalas e comunicação institucional, conforme a Lei Geral de Proteção de Dados (Lei 13.709/18).</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" required checked={formData.lgpdConsent} onChange={e => setFormData({...formData, lgpdConsent: e.target.checked})} className="peer hidden" />
                    <div className="w-5 h-5 rounded-md border-2 border-amber-200 bg-white peer-checked:bg-amber-600 peer-checked:border-amber-600 transition-all flex items-center justify-center">
                      <CheckCircle2 size={12} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 group-hover:text-amber-600">Autorizo o tratamento dos meus dados (LGPD)</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg",
                isSubmitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Enviar Cadastro <Sparkles size={16} className="text-amber-300" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
