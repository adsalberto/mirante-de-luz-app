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
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Sector } from '../types';
import { ImageUpload } from '../components/ImageUpload';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photoUrl: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name,
        phone: currentUser.phone || '',
        photoUrl: currentUser.photoUrl || '',
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
      alert('Perfil atualizado com sucesso!');
      // Note: In a real app, we might need to refresh the global auth context
      // Depending on how current user is synced.
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
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">Meu Perfil</h1>
            <p className="text-gray-500 font-medium">Gerencie suas informações no Mirante de Luz.</p>
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

          <form onSubmit={handleSubmit} className="p-8 pt-20 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                  <Camera size={16} /> Foto de Identificação
                </h2>
                <ImageUpload 
                  value={formData.photoUrl}
                  onChange={val => setFormData({...formData, photoUrl: val})}
                  label="Nova Foto"
                />
              </div>

              {/* Stats/Badges */}
              <div className="space-y-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                  <ShieldCheck size={16} /> Status do Trabalhador
                </h2>
                
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Building2 size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Setor</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600">{userSector?.name || 'Acesso Geral'}</span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">Acesso</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">{currentUser?.role}</span>
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                     <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">E-mail Vinculado</p>
                     <div className="flex items-center gap-2 text-indigo-900">
                        <Mail size={14} />
                        <span className="text-sm font-bold">{currentUser?.email}</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome de Exibição</label>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Telefone/WhatsApp</label>
                <div className="relative group">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" />
                  <input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:bg-white focus:border-indigo-600 font-bold"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2",
                isSubmitting ? "bg-gray-200 text-gray-400" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
