import React, { useState } from 'react';
import { Layout, Users, ClipboardList, Clock, BarChart3, Settings, LogOut, Menu, X, Heart, ShieldCheck, Mic2, Calendar as CalendarIcon, Building2, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Worker } from '../../types';

interface SidebarProps {
  user: Worker;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const location = useLocation();

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const isAdmin = 
    user?.role === 'ADMIN' || 
    user?.role === 'ADM' || 
    user?.email === 'carlostecal35@gmail.com' ||
    (user?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(user.position));

  const navItems = [
    { to: '/', icon: Layout, label: 'Painel', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
    { to: '/atendidos', icon: Users, label: 'Atendidos', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
    { to: '/fila', icon: Clock, label: 'Fila de Atendimento', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
    { to: '/atendimentos', icon: ClipboardList, label: 'Atendimentos', roles: ['ADMIN', 'ADM', 'COORDENADOR'] },
    { to: '/agenda', icon: CalendarIcon, label: 'Agenda', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'PALESTRANTE'] },
    { to: '/escalas', icon: CalendarCheck, label: 'Escalas', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
    { to: '/palestrantes', icon: Mic2, label: 'Palestrantes', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'PALESTRANTE'] },
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { to: '/setores', icon: Building2, label: 'Setores', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { to: '/trabalhadores', icon: Settings, label: 'Trabalhadores/RH', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { to: '/logs', icon: ShieldCheck, label: 'Logs de Auditoria', roles: ['ADMIN', 'ADM'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!user || !user.role) return false;
    if (isAdmin) return true; // Admins see everything
    return item.roles.includes(user.role);
  });

  if (!user) return null;

  return (
    <>
      <button 
        id="toggle-sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md lg:hidden shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            id="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:relative"
          >
            <div className="p-6 flex items-center gap-3 border-b border-indigo-800/50">
              <div className="bg-indigo-500/20 p-2 rounded-xl">
                <Heart className="text-pink-300" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight">Mirante de Luz</h1>
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Gestão Espírita</p>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {filteredItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" 
                      : "text-indigo-200 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn("transition-transform duration-200 group-hover:scale-110")} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-indigo-800/50 bg-indigo-950/30">
              <div className="flex items-center gap-3 mb-4 px-2">
                <NavLink 
                  to="/perfil"
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md border-2 border-white/10 overflow-hidden hover:scale-110 transition-transform"
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Me" className="w-full h-full object-cover" />
                  ) : (
                    (user.name || '?').charAt(0)
                  )}
                </NavLink>
                <div className="flex-1 min-w-0">
                  <NavLink to="/perfil" className="text-sm font-semibold truncate hover:text-indigo-300 transition-colors block">
                    {user.name}
                  </NavLink>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">{user.role}</p>
                </div>
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-indigo-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors duration-200"
              >
                <LogOut size={18} />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
