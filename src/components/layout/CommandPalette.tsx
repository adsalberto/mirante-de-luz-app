import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Layout, 
  Users, 
  Clock, 
  ClipboardList, 
  Calendar, 
  CalendarCheck, 
  ShoppingCart, 
  Headphones, 
  Bell, 
  HeartHandshake, 
  Sparkles, 
  BookOpen, 
  Mic2, 
  BarChart3, 
  Building2, 
  Target, 
  Package, 
  Settings, 
  ShieldCheck, 
  CreditCard,
  Tv,
  ArrowRight,
  X,
  User,
  Activity,
  Zap,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Participant } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  subtitle: string;
  category: 'Acolhimento' | 'Espiritualidade' | 'Doutrina & Estudos' | 'Social & Livraria' | 'Governança & Gestão' | 'Assistidos';
  icon: React.ElementType;
  path?: string;
  badge?: string;
  roles?: string[];
  action?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Load participants for instant search
  useEffect(() => {
    if (isOpen) {
      dataService.getParticipants().then(setParticipants).catch(() => {});
    }
  }, [isOpen]);

  const isAdmin = 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'ADM' || 
    currentUser?.email === 'carlostecal35@gmail.com' ||
    (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  const allActions: PaletteAction[] = useMemo(() => [
    // Visão Master & Acolhimento
    { id: 'painel', title: 'Painel Principal (Visão Master)', subtitle: 'Visão geral e monitoramento das atividades da casa', category: 'Acolhimento', icon: Layout, path: '/' },
    { id: 'fila', title: 'Fila de Atendimento ao Vivo', subtitle: 'Chamar senhas e acompanhar fluxo', category: 'Acolhimento', icon: Clock, path: '/fila', badge: 'Ao Vivo' },
    { id: 'tv', title: 'Modo TV / Sala de Espera', subtitle: 'Painel de exibição em tela cheia para TV do salão', category: 'Acolhimento', icon: Tv, path: '/fila', badge: 'Projeção' },
    { id: 'credenciais', title: 'Emissão de Credenciais & Crachás', subtitle: 'Imprimir crachás com QR Code para trabalhadores e assistidos', category: 'Acolhimento', icon: CreditCard, path: '/credenciais' },

    // Doutrina Espírita • Atendimento
    { id: 'fraterno', title: 'Atendimento Fraterno', subtitle: 'Registrar acolhimentos, escuta fraterna e encaminhamentos', category: 'Espiritualidade', icon: HeartHandshake, path: '/fraterno', badge: 'Acolhimento', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'ATENDENTE'] },
    { id: 'passe', title: 'Passe & Fluidoterapia', subtitle: 'Controle de cabines de passe, fluidificação de água e escalas', category: 'Espiritualidade', icon: Zap, path: '/passe', badge: 'Fluidos' },
    { id: 'atendidos', title: 'Cadastro de Assistidos & Frequentadores', subtitle: 'Localizar fichas cadastrais, histórico e contatos', category: 'Espiritualidade', icon: Users, path: '/atendidos' },

    // Doutrina Espírita • Estudos & Arte
    { id: 'doutrinario', title: 'Doutrinária & Palestras Públicas', subtitle: 'Palestras, mesa dirigente, expositores e acervo', category: 'Doutrina & Estudos', icon: BookOpen, path: '/doutrinario', badge: 'Estudos' },
    { id: 'palestrantes', title: 'Palestrantes & Oradores Espíritas', subtitle: 'Escala de palestrantes convidados e temas', category: 'Doutrina & Estudos', icon: Mic2, path: '/palestrantes' },
    { id: 'arte', title: 'Arte Espírita & Coral', subtitle: 'Músicas, ensaios de coral, teatro e expressões artísticas', category: 'Doutrina & Estudos', icon: Palette, path: '/arte', badge: 'Música' },
    { id: 'agenda', title: 'Agenda Geral de Eventos', subtitle: 'Cronograma semanal de reuniões e palestras', category: 'Doutrina & Estudos', icon: Calendar, path: '/agenda' },
    { id: 'mascote', title: 'Mascote Luminho & Projeção Digital', subtitle: 'Controle multimídia do assistente e avisos em tela', category: 'Doutrina & Estudos', icon: Sparkles, path: '/mascote', badge: 'Áudio & TV' },
    { id: 'audiobooks', title: 'Audiobooks & Podcasts Espíritas', subtitle: 'Obras de Kardec, Chico Xavier e mensagens de áudio', category: 'Doutrina & Estudos', icon: Headphones, path: '/audiobooks' },
    { id: 'avisos', title: 'Mural de Avisos & Comunicados', subtitle: 'Informativos para a comunidade e frequentadores', category: 'Doutrina & Estudos', icon: Bell, path: '/avisos' },

    // Demais Setores • Social & Livraria
    { id: 'impacto', title: 'Impacto Social & Campanhas Fraternas', subtitle: 'Distribuição de cestas, agasalhos e famílias assistidas', category: 'Social & Livraria', icon: HeartHandshake, path: '/impacto-social', badge: 'Caridade' },
    { id: 'vendas', title: 'Livraria Espírita & Bazar (PDV)', subtitle: 'Ponto de venda beneficente e controle de estoques', category: 'Social & Livraria', icon: ShoppingCart, path: '/vendas', badge: 'Caixa' },

    // Demais Setores • Governança & Gestão
    { id: 'escalas', title: 'Escalas de Trabalho Voluntário', subtitle: 'Distribuição dos voluntários nos setores da Casa', category: 'Governança & Gestão', icon: CalendarCheck, path: '/escalas' },
    { id: 'trabalhadores', title: 'Gestão de Trabalhadores & RH', subtitle: 'Cadastros de voluntários, permissões e equipes', category: 'Governança & Gestão', icon: Settings, path: '/trabalhadores', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { id: 'setores', title: 'Setores & Departamentos', subtitle: 'Configuração das salas e tipos de atendimento', category: 'Governança & Gestão', icon: Building2, path: '/setores', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { id: 'planejamento', title: 'Planejamento Estratégico & Metas', subtitle: 'Acompanhamento de diretrizes da diretoria', category: 'Governança & Gestão', icon: Target, path: '/planejamento' },
    { id: 'inventario', title: 'Inventário & Patrimônio', subtitle: 'Controle de bens materiais, livros e equipamentos', category: 'Governança & Gestão', icon: Package, path: '/inventario', roles: ['ADMIN', 'ADM', 'SECRETARIO'] },
    { id: 'relatorios', title: 'Relatórios Estatísticos & Gráficos', subtitle: 'Métricas de atendimento, frequência e evolução', category: 'Governança & Gestão', icon: BarChart3, path: '/relatorios', roles: ['ADMIN', 'ADM', 'COORDENADOR', 'SECRETARIO'] },
    { id: 'logs', title: 'Logs de Auditoria & Segurança', subtitle: 'Registro de atividades do sistema', category: 'Governança & Gestão', icon: ShieldCheck, path: '/logs', roles: ['ADMIN', 'ADM'] }
  ], []);

  // Filter actions based on role and query
  const filteredActions = useMemo(() => {
    const roleFiltered = allActions.filter(action => {
      if (isAdmin) return true;
      if (!action.roles) return true;
      return action.roles.includes(currentUser?.role || '');
    });

    if (!query.trim()) return roleFiltered;

    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const matchingActions = roleFiltered.filter(a => {
      const matchTitle = a.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchSub = a.subtitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchCat = a.category.toLowerCase().includes(q);
      return matchTitle || matchSub || matchCat;
    });

    // Also match participants by name or CPF
    const matchingParticipants: PaletteAction[] = participants
      .filter(p => {
        const matchName = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
        const matchCpf = (p.cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        return matchName || (matchCpf && q.length >= 3);
      })
      .slice(0, 5)
      .map(p => ({
        id: `participant-${p.id}`,
        title: p.name,
        subtitle: `CPF: ${p.cpf || 'Não informado'} • Fone: ${p.phone || 'Não informado'}`,
        category: 'Assistidos' as const,
        icon: User,
        action: () => {
          navigate('/atendidos');
        },
        badge: p.currentStatus === 'IN_SERVICE' ? 'Em Atendimento' : p.currentStatus === 'WAITING' ? 'Na Fila' : 'Cadastrado'
      }));

    return [...matchingActions, ...matchingParticipants];
  }, [allActions, query, isAdmin, currentUser, participants, navigate]);

  // Keyboard navigation inside the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredActions[selectedIndex];
        if (selected) {
          executeAction(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeAction = (action: PaletteAction) => {
    onClose();
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="fixed inset-0" 
          onClick={onClose} 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[80vh] z-10"
        >
          {/* Header & Search Input */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/20">
            <Search size={20} className="text-indigo-600 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite para buscar qualquer módulo, tela ou assistido... (Ex: Fila, Passe, Livraria)"
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-1 bg-gray-100 border border-gray-200 text-[10px] font-mono font-bold text-gray-500 rounded-lg">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {filteredActions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Search size={32} className="mx-auto text-indigo-300 opacity-50" />
                <p className="text-sm font-semibold">Nenhum resultado encontrado para "{query}"</p>
                <p className="text-xs">Tente buscar por "Fila", "Atendimentos", "Escalas", "Livraria" ou pelo nome do assistido.</p>
              </div>
            ) : (
              filteredActions.map((item, index) => {
                const isSelected = index === selectedIndex;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => executeAction(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'hover:bg-indigo-50/70 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-indigo-100/70 text-indigo-700'
                      }`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{item.title}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-medium hidden sm:inline ${
                        isSelected ? 'text-indigo-200' : 'text-gray-400'
                      }`}>
                        {item.category}
                      </span>
                      <ArrowRight size={16} className={isSelected ? 'text-white' : 'text-gray-300'} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-3">
              <span>Navegue com <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono font-bold text-gray-600">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono font-bold text-gray-600">↓</kbd></span>
              <span>Abrir com <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded font-mono font-bold text-gray-600">ENTER</kbd></span>
            </div>
            <span className="text-indigo-600 font-semibold hidden sm:inline">Centro Espírita Mirante de Luz</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
