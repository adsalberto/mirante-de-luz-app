import React from 'react';
import { 
  Search, 
  Tv, 
  Menu, 
  Sparkles, 
  Bell, 
  Clock, 
  Heart, 
  User as UserIcon,
  Plus
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Worker } from '../../types';
import { CemilLogo } from '../CemilLogo';

interface AppHeaderProps {
  user: Worker;
  onOpenCommandPalette: () => void;
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  user, 
  onOpenCommandPalette, 
  onToggleSidebar 
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-indigo-100/70 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
      {/* Left: Mobile Toggle & Brand Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all lg:hidden cursor-pointer"
          title="Menu de Navegação"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0 lg:hidden">
            <CemilLogo variant="sun-only" size="100%" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider truncate">
              Centro Espírita Mirante de Luz
            </h2>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Santuário da Fraternidade & Luz
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Command Search Trigger */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2 bg-gray-100/80 hover:bg-indigo-50/70 border border-gray-200/80 hover:border-indigo-200 text-gray-500 hover:text-indigo-900 rounded-2xl text-xs font-medium transition-all shadow-inner group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 truncate">
            <Search size={15} className="text-gray-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            <span className="truncate">Buscar módulo, tela ou assistido...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-gray-200 text-[10px] font-mono font-bold text-gray-500 rounded-md shadow-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action Controls & User Identity */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick TV Mode Button */}
        <NavLink
          to="/fila"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200/60 transition-all shadow-xs"
          title="Abrir Painel da Fila e Projeção TV"
        >
          <Tv size={14} className="text-amber-500" />
          <span>Fila & TV</span>
        </NavLink>

        {/* User Mini Avatar & Profile Link */}
        <NavLink
          to="/perfil"
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 transition-all group"
          title="Meu Perfil e Credenciais"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-xs border border-white overflow-hidden shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user.name || '?').charAt(0)
            )}
          </div>
          <div className="text-left hidden xl:block min-w-0">
            <p className="text-xs font-black text-gray-800 truncate leading-tight group-hover:text-indigo-600">
              {user.name?.split(' ')[0]}
            </p>
            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
              {user.role}
            </p>
          </div>
        </NavLink>
      </div>
    </header>
  );
};
