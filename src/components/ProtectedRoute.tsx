import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldOff } from 'lucide-react';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { currentUser, loading, fbUser, logout } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  // Small delay to handle race conditions during new user registration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (fbUser && !currentUser && !loading && !isRetrying) {
      setIsRetrying(true);
      timer = setTimeout(() => {
        // This will trigger a re-render and useAuth will have the updated state if Firestore synced
        window.location.reload(); 
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [fbUser, currentUser, loading, isRetrying]);

  if (loading || (fbUser && !currentUser && isRetrying)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Sincronizando Perfil...</p>
      </div>
    );
  }

  if (!fbUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser) {
    // User is authenticated but worker profile is missing or still synced.
    // We could show a specific error or just redirect to login.
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Perfil não encontrado</h2>
        <p className="text-gray-500 mb-6 font-medium">Seu usuário está autenticado, mas não encontramos seu registro de trabalhador no sistema.</p>
        <button 
          onClick={logout}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
        >
          Voltar para Login
        </button>
      </div>
    );
  }

  if (!currentUser.active) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-600 mb-6 shadow-inner animate-pulse">
          <ShieldOff size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 italic tracking-tighter">Acesso em Análise</h2>
        <p className="text-gray-500 mb-8 font-medium max-w-sm leading-relaxed text-sm">Seu cadastro foi recebido com sucesso! Nossa equipe está analisando sua solicitação de voluntariado. Você poderá acessar o sistema assim que seu perfil for ativado pela coordenação.</p>
        <button 
          onClick={logout}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all uppercase tracking-[0.2em] text-[10px]"
        >
          Sair do Sistema
        </button>
      </div>
    );
  }

  if (allowedRoles) {
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'ADM';
    const isAllowed = allowedRoles.includes(currentUser.role) || (isAdmin && allowedRoles.includes('ADMIN'));
    
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
