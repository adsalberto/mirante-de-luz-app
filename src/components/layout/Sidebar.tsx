import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, 
  Users, 
  ClipboardList, 
  Clock, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Mic2, 
  Calendar as CalendarIcon, 
  Building2, 
  CalendarCheck, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Target, 
  Headphones, 
  Sparkles, 
  Bell, 
  HeartHandshake, 
  BookOpen,
  ChevronDown,
  ChevronRight,
  Tv,
  Search,
  Zap,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Worker } from '../../types';
import { CemilLogo } from '../CemilLogo';

interface SidebarProps {
  user: Worker;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenCommandPalette: () => void;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeColor?: string;
  roles?: string[];
}

interface NavSection {
  id: string;
  title: string;
  icon?: React.ElementType;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  onLogout, 
  isOpen, 
  onToggle,
  onOpenCommandPalette 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Collapsible sections state (default open)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    acolhimento: false,
    espiritualidade: false,
    doutrina: false,
    social: false,
    governanca: false
  });

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isAdmin = 
    user?.role === 'ADMIN' || 
    user?.role === 'ADM' || 
    user?.email === 'carlostecal35@gmail.com' ||
    (user?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(user.position));

  const isPlanejamentoSec = user?.position && [
    'secretário de planejamento',
    'secretário(a) de planejamento',
    'secretária de planejamento',
    'secretario de planejamento',
    'secretario(a) de planejamento',
    'secretaria de planejamento'
  ].includes(user.position.toLowerCase());

  // Navigation sections organized: Visão Master / Salão on top, Doutrina Espírita in upper part, Demais Setores in lower part
  const rawSections: NavSection[] = [
    {
      id: 'acolhimento',
      title: 'Visão Master & Acolhimento',
      items: [
        { to: '/', icon: Layout, label: 'Painel Principal (Visão Master)', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/fila', icon: Clock, label: 'Fila & Modo TV', badge: 'Ao Vivo', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
        { to: '/credenciais', icon: CreditCard, label: 'Crachás & Credenciais', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
      ]
    },
    {
      id: 'espiritualidade',
      title: 'Doutrina Espírita • Atendimento',
      items: [
        { to: '/fraterno', icon: HeartHandshake, label: 'Atendimento Fraterno', badge: 'Acolhimento', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
        { to: '/passe', icon: Zap, label: 'Passe & Fluidoterapia', badge: 'Fluidos', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/atendidos', icon: Users, label: 'Cadastro de Assistidos', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
      ]
    },
    {
      id: 'doutrina',
      title: 'Doutrina Espírita • Estudos & Arte',
      items: [
        { to: '/doutrinario', icon: BookOpen, label: 'Doutrinária & Palestras', badge: 'Estudos', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/palestrantes', icon: Mic2, label: 'Oradores Espíritas', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'PALESTRANTE'] },
        { to: '/arte', icon: Palette, label: 'Arte Espírita & Coral', badge: 'Música', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/agenda', icon: CalendarIcon, label: 'Agenda de Eventos', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'PALESTRANTE'] },
        { to: '/mascote', icon: Sparkles, label: 'Mascote & Projeção TV', badge: 'Áudio', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/audiobooks', icon: Headphones, label: 'Audiobooks & Podcasts', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/avisos', icon: Bell, label: 'Mural de Avisos', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
      ]
    },
    {
      id: 'social',
      title: 'Demais Setores • Ação Social & Livraria',
      items: [
        { to: '/impacto-social', icon: HeartHandshake, label: 'Impacto Social & Doações', badge: 'Caridade', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO', 'PALESTRANTE'] },
        { to: '/vendas', icon: ShoppingCart, label: 'Livraria & Bazar (PDV)', badge: 'Caixa', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
      ]
    },
    {
      id: 'governanca',
      title: 'Demais Setores • Gestão & Governança',
      items: [
        { to: '/escalas', icon: CalendarCheck, label: 'Escalas de Trabalho', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO', 'RECEPCIONISTA', 'ATENDENTE', 'VOLUNTARIO'] },
        { to: '/trabalhadores', icon: Settings, label: 'Trabalhadores / RH', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
        { to: '/setores', icon: Building2, label: 'Setores da Casa', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
        { to: '/planejamento', icon: Target, label: 'Planejamento Estratégico', roles: ['ADMIN', 'ADM', 'SECRETARIO'] },
        { to: '/inventario', icon: Package, label: 'Inventário Patrimonial', roles: ['ADMIN', 'ADM', 'SECRETARIO'] },
        { to: '/relatorios', icon: BarChart3, label: 'Relatórios Estatísticos', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
        { to: '/logs', icon: ShieldCheck, label: 'Logs de Auditoria', roles: ['ADMIN', 'ADM'] },
      ]
    }
  ];

  // Filter sections and items based on permissions
  const filteredSections = useMemo(() => {
    return rawSections
      .map(section => {
        const items = section.items.filter(item => {
          if (item.to === '/planejamento') {
            return isAdmin || isPlanejamentoSec;
          }
          if (isAdmin) return true;
          if (!item.roles) return true;
          return item.roles.includes(user?.role || '');
        });
        return { ...section, items };
      })
      .filter(section => section.items.length > 0);
  }, [rawSections, isAdmin, isPlanejamentoSec, user?.role]);

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            id="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:relative border-r border-indigo-800/40"
          >
            {/* Header / Logo */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-indigo-800/50 bg-indigo-950/40">
              <NavLink to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 flex-shrink-0 group-hover:scale-105 transition-transform drop-shadow-md">
                  <CemilLogo variant="sun-only" size="100%" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-black text-[#FED02F] text-base leading-tight tracking-tight uppercase group-hover:text-amber-300 transition-colors">
                    Cemil
                  </h1>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300 font-black">
                    Mirante de Luz
                  </p>
                </div>
              </NavLink>

              <button
                onClick={onToggle}
                className="p-1.5 text-indigo-300 hover:text-white rounded-xl hover:bg-white/10 lg:hidden transition-colors cursor-pointer"
                title="Fechar Menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Command Trigger in Sidebar */}
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={onOpenCommandPalette}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/40 text-indigo-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer group shadow-inner"
              >
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-indigo-400 group-hover:text-amber-300 transition-colors" />
                  <span>Busca Rápida</span>
                </div>
                <kbd className="px-1.5 py-0.5 bg-indigo-950 border border-indigo-700/60 text-[10px] font-mono text-indigo-300 rounded font-bold">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Nav List with Collapsible Spiritual Categories */}
            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
              {filteredSections.map((section) => {
                const isCollapsed = collapsedSections[section.id];

                return (
                  <div key={section.id} className="space-y-1">
                    {/* Section Accordion Title */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-300/80 hover:text-indigo-100 transition-colors cursor-pointer group"
                    >
                      <span className="truncate">{section.title}</span>
                      <span className="text-indigo-400/60 group-hover:text-indigo-200 transition-colors">
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {/* Section Items */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 animate-in fade-in duration-200">
                        {section.items.map((item) => {
                          const IconComponent = item.icon;
                          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={cn(
                                "flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all duration-150 group relative text-xs font-semibold",
                                isActive
                                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/50 font-bold border border-indigo-400/30"
                                  : "text-indigo-200/90 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <IconComponent 
                                  size={16} 
                                  className={cn(
                                    "shrink-0 transition-transform duration-150 group-hover:scale-110",
                                    isActive ? "text-amber-300" : "text-indigo-300"
                                  )} 
                                />
                                <span className="truncate">{item.label}</span>
                              </div>

                              {item.badge && (
                                <span className={cn(
                                  "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border shrink-0",
                                  item.badgeColor || "bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Footer / Profile and Logout */}
            <div className="p-3 border-t border-indigo-800/50 bg-indigo-950/60 space-y-2">
              <NavLink 
                to="/perfil"
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-colors group"
                title="Acessar Meu Perfil e Configurações"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md border border-white/20 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    (user.name || '?').charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-amber-300 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider truncate">
                    {user.role}
                  </p>
                </div>
              </NavLink>

              <button
                id="logout-btn"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-indigo-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all text-xs font-bold cursor-pointer"
              >
                <LogOut size={14} className="text-red-400" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
