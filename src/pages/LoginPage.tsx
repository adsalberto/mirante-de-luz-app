import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, Eye, EyeOff, User as UserIcon, Shield } from 'lucide-react';
import { CemilLogo } from '../components/CemilLogo';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ADM' | 'COORDENADOR' | 'SECRETARIO' | 'RECEPCIONISTA' | 'ATENDENTE' | 'VOLUNTARIO'>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.toLowerCase().trim();

    if (isRegister) {
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo.');
        setLoading(false);
        return;
      }
      try {
        // Create user in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;

        // Force Admin role for the custom super-admin email
        const resolvedRole = normalizedEmail === 'carlostecal35@gmail.com' ? 'ADMIN' : role;

        // Create the worker profile document
        const workerProfile = {
          id: user.uid,
          name: name.trim(),
          email: normalizedEmail,
          role: resolvedRole,
          active: true,
          createdAt: Date.now(),
          acceptedTerm: true,
          termAcceptedAt: Date.now(),
          loginCount: 1
        };

        await setDoc(doc(db, 'trabalhadores', user.uid), workerProfile);

        setSuccess('Sua conta foi criada e ativada com sucesso!');
        setIsRegister(false);
        setPassword('');
        navigate('/');
      } catch (err: any) {
        console.error("Registration error:", err);
        if (err.code === 'auth/email-already-in-use') {
          setError('Este e-mail já está cadastrado. Tente entrar usando a aba "Entrar".');
        } else if (err.code === 'auth/weak-password') {
          setError('A senha deve possuir no mínimo 6 caracteres.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Formato de e-mail inválido.');
        } else {
          setError('Erro ao criar conta: ' + (err.message || 'Verifique as informações.'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      try {
        await login(normalizedEmail, password);
        navigate('/');
      } catch (err: any) {
        console.error("Login error detail:", err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          if (normalizedEmail === 'carlostecal35@gmail.com') {
            setError('Senha incorreta ou ainda não cadastrado. Criar esta conta de administrador? Alterne para a aba "Criar Conta" acima.');
          } else {
            setError('E-mail ou senha incorretos ou não cadastrados. Dica: use a aba "Criar Conta" acima para se cadastrar se for seu primeiro acesso!');
          }
        } else if (err.code === 'auth/too-many-requests') {
          setError('Muitas tentativas sem sucesso. Tente novamente mais tarde.');
        } else if (err.code === 'auth/user-disabled') {
          setError('Este usuário foi desativado pela coordenação.');
        } else {
          setError('Erro ao acessar o sistema. ' + (err.message || 'Verifique sua conexão.'));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail primeiro.');
      return;
    }
    setResetLoading(true);
    setError('');
    setSuccess('');
    try {
      await resetPassword(email.toLowerCase().trim());
      setSuccess('E-mail de redefinição enviado com sucesso!');
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado com este e-mail.');
      } else {
        setError('Erro ao enviar e-mail. Tente novamente mais tarde.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-indigo-100 overflow-hidden border border-gray-100"
      >
        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-52 h-56 mb-4 hover:scale-105 transition-transform duration-350 ease-out filter drop-shadow-md">
              <CemilLogo variant="full" size="100%" showBackground={false} />
            </div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mt-3">Gestão Institucional</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100 mb-8 select-none">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-all cursor-pointer ${
                !isRegister
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 pb-4 text-xs font-black uppercase tracking-widest text-center border-b-2 transition-all cursor-pointer ${
                isRegister
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                      <UserIcon size={18} />
                    </div>
                    <input
                      type="text"
                      required={isRegister}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-600/20 text-gray-700 font-bold transition-all"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Perfil / Função de Acesso</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                      <Shield size={18} />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-600/20 text-gray-700 font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="ADMIN">Administrador Geral (Acesso total)</option>
                      <option value="ADM">Assistente Administrativo (ADM)</option>
                      <option value="COORDENADOR">Coordenador de Setor</option>
                      <option value="SECRETARIO">Secretário(a)</option>
                      <option value="RECEPCIONISTA">Recepcionista</option>
                      <option value="ATENDENTE">Atendente Fraterno</option>
                      <option value="VOLUNTARIO">Voluntário</option>
                    </select>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 ml-1">
                    * E-mails como carlostecal35@gmail.com serão sempre Administrador Geral.
                  </p>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-600/20 text-gray-700 font-bold transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-600/20 text-gray-700 font-bold transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isRegister && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-xs font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-500 text-xs font-bold text-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100"
              >
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 uppercase tracking-widest text-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isRegister ? 'Confirmar e Criar Conta' : 'Entrar no Sistema'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 text-center border-t border-gray-100 flex flex-col gap-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Acesso Restrito aos Trabalhadores da CEMIL
          </p>
          <div className="pt-2 border-t border-gray-100/50 mt-2">
            <button
              onClick={() => navigate('/quero-ser-voluntario')}
              className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Quero ser Voluntário
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
