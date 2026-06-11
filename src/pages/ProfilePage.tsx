import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Building2, 
  CheckCircle2,
  Camera,
  Save,
  ArrowLeft,
  HeartPulse,
  MapPin,
  FileText,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Sector } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, refreshUser } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photoUrl: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    cpf: '',
    rg: '',
    address: '',
    cep: '',
    neighborhood: '',
    city: '',
    profession: '',
    nationality: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        photoUrl: currentUser.photoUrl || '',
        bloodType: currentUser.bloodType || '',
        allergies: currentUser.allergies || '',
        emergencyContact: currentUser.emergencyContact || '',
        cpf: currentUser.cpf || '',
        rg: currentUser.rg || '',
        address: currentUser.address || '',
        cep: currentUser.cep || '',
        neighborhood: currentUser.neighborhood || '',
        city: currentUser.city || '',
        profession: currentUser.profession || '',
        nationality: currentUser.nationality || '',
      });
      loadSectors();
    }
  }, [currentUser]);

  const loadSectors = async () => {
    const s = await dataService.getSectors();
    setSectors(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await dataService.updateWorker({
        ...currentUser,
        ...formData
      });
      await refreshUser();
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userSector = sectors.find(s => s.id === currentUser?.sectorId);

  return (
    <div className="min-h-screen bg-indigo-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">Meu Perfil</h1>
            <p className="text-gray-500 font-medium text-sm">Gerencie suas informações no Mirante de Luz.</p>
          </div>
        </header>

        <div className="bg-white rounded-[40px] shadow-xl shadow-indigo-100 overflow-hidden border border-gray-100">
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
             <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-[32px] shadow-lg">
                <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-gray-100 border border-gray-100">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <User size={40} />
                    </div>
                  )}
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 pt-20 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                  <Camera size={16} className="text-indigo-600" /> Foto de Identificação
                </h2>
                <ImageUpload 
                  value={formData.photoUrl}
                  onChange={val => setFormData({...formData, photoUrl: val})}
                  label="Nova Foto"
                />
              </div>

              {/* Stats/Badges */}
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" /> Status do Trabalhador
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col justify-center border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Building2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Setor</span>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-900 truncate">{userSector?.name || 'Acesso Geral'}</span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col justify-center border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Acesso</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600">{currentUser?.role}</span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                   <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">E-mail Vinculado</p>
                   <div className="flex items-center gap-2 text-indigo-900">
                      <Mail size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-xs font-extrabold truncate">{currentUser?.email}</span>
                   </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SEÇÃO 1: Dados Pessoais e Identificação */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" /> Dados Pessoais & Documentação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome Completo</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Profissão</label>
                  <div className="relative group">
                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                    <input 
                      value={formData.profession}
                      onChange={e => setFormData({...formData, profession: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                      placeholder="Sua profissão"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nacionalidade</label>
                  <input 
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="Ex: Brasileira"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">CPF</label>
                  <input 
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">RG</label>
                  <input 
                    value={formData.rg}
                    onChange={e => setFormData({...formData, rg: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="Seu documento de identidade"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SEÇÃO 2: Contato e Endereço */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-950 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" /> Contato & Localização
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Telefone / WhatsApp</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                    <input 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Endereço Residencial</label>
                  <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                    <input 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                      placeholder="Rua, Número, Complemento"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Bairro</label>
                  <input 
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cidade</label>
                  <input 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">CEP</label>
                  <input 
                    value={formData.cep}
                    onChange={e => setFormData({...formData, cep: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-xs"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SEÇÃO 3: Informações de Saúde & Emergência */}
            <div className="p-6 bg-rose-50/30 rounded-3xl border border-rose-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-955 flex items-center gap-2">
                <HeartPulse size={16} className="text-rose-600" /> Informações de Saúde & Emergência
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-rose-800/60 tracking-widest ml-1">Tipo Sanguíneo</label>
                  <select 
                    value={formData.bloodType}
                    onChange={e => setFormData({...formData, bloodType: e.target.value})}
                    className="w-full px-4 py-3 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 border border-rose-100 font-bold text-gray-700 text-xs"
                  >
                    <option value="">Não Informado</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-rose-800/60 tracking-widest ml-1">Alergias</label>
                  <input 
                    value={formData.allergies}
                    onChange={e => setFormData({...formData, allergies: e.target.value})}
                    className="w-full px-4 py-3 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 border border-rose-100 font-bold text-gray-700 text-xs"
                    placeholder="Ex: Medicamentos, Pó, etc."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-rose-800/60 tracking-widest ml-1">Contato de Emergência</label>
                  <div className="relative group">
                    <AlertCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-600" />
                    <input 
                      value={formData.emergencyContact}
                      onChange={e => setFormData({...formData, emergencyContact: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-rose-200 border border-rose-100 font-bold text-gray-700 text-xs"
                      placeholder="Nome e Telefone"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2",
                isSubmitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-100"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações do Meu Perfil
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
