import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';

export default function ChangeTempPassword() {
  const { currentUser, changeTempPassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await changeTempPassword(newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(
        err.message || 'Erro ao alterar a senha. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 p-8 relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/10 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100/10 rounded-full blur-2xl -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6">
            <Lock size={28} />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-950 text-center tracking-tight leading-tight">
            Primeiro Acesso Detectado
          </h2>
          <p className="text-gray-500 text-sm font-medium text-center mt-2 px-1">
            Olá, <strong className="text-indigo-600 font-bold">{currentUser?.name || currentUser?.email}</strong>. Por motivos de segurança, você precisa alterar sua senha provisória padrão para configurar sua nova senha pessoal antes de acessar o painel.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 w-full flex items-start gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-xs font-semibold leading-relaxed"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 w-full flex items-start gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 text-xs font-semibold leading-relaxed"
            >
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>Sua senha foi alterada com sucesso! Redirecionando...</span>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="mt-6 w-full space-y-5">
              <div className="space-y-1.5 animate-none">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    required
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-sm"
                    placeholder="Nova senha pessoal (mín. 6 caracteres)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 animate-none">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    required
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all border border-transparent focus:bg-white focus:border-indigo-600 font-bold text-gray-700 text-sm"
                    placeholder="Repita a nova senha pessoal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 w-full border-t border-gray-100 pt-4 flex justify-center">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 py-2.5 px-4 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
