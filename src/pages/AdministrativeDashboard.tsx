import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  Settings,
  ShieldCheck,
  Building2,
  ArrowRight,
  UserCheck,
  Coins,
  Store,
  Activity,
  Megaphone,
  Contact,
  ClipboardList,
  Package,
  Plus,
  Bell,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
  FileCheck,
  FileSpreadsheet,
  Download,
  Clock,
  Heart,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../src/services/dataService';
import { DashboardStats, AuditLog, AnnouncementNotification, CashSession, AdminAssociado, AdminAta, AdminDocumento, AdminPatrimonioItem, AdminBalanceteMensal } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import { cn } from '../../src/lib/utils';
import SectorDashboard from '../../src/components/SectorDashboard';
import { QuadroSocialView } from '../../src/components/admin/QuadroSocialView';
import { LivroAtasView } from '../../src/components/admin/LivroAtasView';
import { DocumentosOficiaisView } from '../../src/components/admin/DocumentosOficiaisView';
import { PatrimonioInventarioView } from '../../src/components/admin/PatrimonioInventarioView';
import { TesourariaBalancetesView } from '../../src/components/admin/TesourariaBalancetesView';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AdminTab = 'visao_geral' | 'quadro_social' | 'livro_atas' | 'documentos' | 'patrimonio' | 'tesouraria' | 'setor_gestao';

export default function AdministrativeDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementNotification[]>([]);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);
  const [associadosCount, setAssociadosCount] = useState(0);
  const [atasCount, setAtasCount] = useState(0);
  const [documentosCount, setDocumentosCount] = useState(0);
  const [patrimonioCount, setPatrimonioCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<AdminTab>('visao_geral');
  const [adminSectorId, setAdminSectorId] = useState<string>('sec-administrativo');
  const [adminSectorName, setAdminSectorName] = useState<string>('Administrativo');

  const isAdmin = 
    currentUser?.role === 'ADMIN' || 
    currentUser?.role === 'ADM' || 
    currentUser?.email === 'carlostecal35@gmail.com' ||
    (currentUser?.position && ['Presidente(s)', 'Vice-presidente(s)', '1º Secretário(a)', 'Secretário(a) de Planejamento'].includes(currentUser.position));

  useEffect(() => {
    // Subscriptions in real time
    const unsubStats = dataService.subscribeToStats((s) => {
      setStats(s);
      setLoading(false);
    });

    const unsubLogs = dataService.subscribeToLogs((list) => {
      setRecentLogs((list || []).slice(0, 6));
    }, 6);

    const unsubAnnouncements = dataService.subscribeAnnouncements((list) => {
      setAnnouncements(list || []);
    });

    const unsubCashSession = dataService.subscribeActiveCashSession((session) => {
      setActiveCashSession(session);
    });

    const unsubAssoc = dataService.subscribeAdminAssociados((list) => {
      setAssociadosCount(list?.length || 0);
    });

    const unsubAtas = dataService.subscribeAdminAtas((list) => {
      setAtasCount(list?.length || 0);
    });

    const unsubDocs = dataService.subscribeAdminDocumentos((list) => {
      setDocumentosCount(list?.length || 0);
    });

    const unsubPat = dataService.subscribeAdminPatrimonio((list) => {
      setPatrimonioCount(list?.length || 0);
    });

    loadSectors();

    return () => {
      unsubStats();
      unsubLogs();
      unsubAnnouncements();
      unsubCashSession();
      unsubAssoc();
      unsubAtas();
      unsubDocs();
      unsubPat();
    };
  }, []);

  const loadSectors = async () => {
    try {
      const sectors = await dataService.getSectors();
      if (!sectors || sectors.length === 0) return;

      let adm = sectors.find(sec => 
        sec.name.toLowerCase().includes('administrat') ||
        sec.name.toLowerCase().includes('secretar') ||
        sec.name.toLowerCase().includes('gestão')
      );
      
      if (!adm) {
        adm = sectors.find(sec => 
          (sec.type === 'ADMINISTRATIVO' || sec.name.toLowerCase().includes('adm')) &&
          !sec.name.toLowerCase().includes('comun') &&
          !sec.name.toLowerCase().includes('mídia')
        );
      }

      if (!adm) {
        adm = sectors.find(sec => sec.type === 'ADMINISTRATIVO');
      }

      if (!adm) {
        adm = sectors[0];
      }

      if (adm) {
        setAdminSectorId(adm.id);
        setAdminSectorName(adm.name);
      }
    } catch (err) {
      console.error("Error loading admin sector:", err);
    }
  };

  const activeAnnouncementsCount = announcements.filter(a => a.active !== false).length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-gray-100">
        <div className="flex items-start gap-3.5">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-sm hover:shadow-md text-gray-400 hover:text-indigo-600 transition-all active:scale-95 border border-gray-100 cursor-pointer shrink-0 mt-0.5"
            title="Voltar ao Início"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px] sm:text-xs uppercase tracking-[0.2em] mb-1">
              <Building2 size={13} className="shrink-0" />
              <span>Secretaria Geral & Diretoria Executiva</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight italic">
              Governança Institucional
            </h1>
            <p className="text-gray-500 font-medium text-xs sm:text-sm mt-1 leading-relaxed">
              Gestão estatutária, quadro social, livro de atas, expedição de termos e patrimônio tombado.
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="w-full lg:w-auto overflow-x-auto pb-1 scrollbar-none">
          <div className="flex bg-gray-100/90 p-1.5 rounded-2xl gap-1.5 shrink-0 whitespace-nowrap min-w-max">
            <button
              onClick={() => setAdminTab('visao_geral')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'visao_geral'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Settings size={14} />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setAdminTab('quadro_social')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'quadro_social'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Users size={14} />
              <span>Quadro Social ({associadosCount})</span>
            </button>

            <button
              onClick={() => setAdminTab('livro_atas')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'livro_atas'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BookOpen size={14} />
              <span>Livro de Atas ({atasCount})</span>
            </button>

            <button
              onClick={() => setAdminTab('documentos')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'documentos'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <FileCheck size={14} />
              <span>Documentos Oficiais ({documentosCount})</span>
            </button>

            <button
              onClick={() => setAdminTab('patrimonio')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'patrimonio'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Package size={14} />
              <span>Patrimônio ({patrimonioCount})</span>
            </button>

            <button
              onClick={() => setAdminTab('tesouraria')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'tesouraria'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Coins size={14} />
              <span>Tesouraria & Balancetes</span>
            </button>

            <button
              onClick={() => setAdminTab('setor_gestao')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer",
                adminTab === 'setor_gestao'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Building2 size={14} />
              <span>Gestão do Setor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Renderers */}
      <AnimatePresence mode="wait">
        {adminTab === 'quadro_social' && (
          <motion.div key="quadro_social" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <QuadroSocialView />
          </motion.div>
        )}

        {adminTab === 'livro_atas' && (
          <motion.div key="livro_atas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <LivroAtasView />
          </motion.div>
        )}

        {adminTab === 'documentos' && (
          <motion.div key="documentos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DocumentosOficiaisView />
          </motion.div>
        )}

        {adminTab === 'patrimonio' && (
          <motion.div key="patrimonio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <PatrimonioInventarioView />
          </motion.div>
        )}

        {adminTab === 'tesouraria' && (
          <motion.div key="tesouraria" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <TesourariaBalancetesView />
          </motion.div>
        )}

        {adminTab === 'setor_gestao' && (
          <motion.div key="setor_gestao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SectorDashboard sectorId={adminSectorId} sectorName={adminSectorName} />
          </motion.div>
        )}

        {adminTab === 'visao_geral' && (
          <motion.div key="visao_geral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                onClick={() => setAdminTab('quadro_social')}
                className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Quadro Social</p>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Users size={18} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{associadosCount}</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Sócios cadastrados</p>
              </div>

              <div 
                onClick={() => setAdminTab('livro_atas')}
                className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Livro de Atas</p>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <BookOpen size={18} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{atasCount}</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Atas lavradas e aprovadas</p>
              </div>

              <div 
                onClick={() => setAdminTab('documentos')}
                className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-purple-500 uppercase tracking-widest">Termos e Ofícios</p>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <FileCheck size={18} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{documentosCount}</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Expedidos com validação</p>
              </div>

              <div 
                onClick={() => setAdminTab('patrimonio')}
                className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Bens Tombados</p>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Package size={18} />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{patrimonioCount}</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-1">Itens no almoxarifado</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                Módulos e Fluxos Operacionais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => navigate('/trabalhadores')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserCheck size={24} />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 text-base">Equipe & Voluntariado</h4>
                    {(stats?.pendingVolunteers || 0) > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-black">
                        {stats?.pendingVolunteers} pendentes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Gestão de voluntários, aprovação de fichas e designação de funções.</p>
                </div>

                <div 
                  onClick={() => navigate('/escalas')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CalendarCheck size={24} />
                  </div>
                  <h4 className="font-black text-gray-900 text-base">Escalas de Trabalho</h4>
                  <p className="text-xs text-gray-500 mt-1">Organização de turnos, recepção, passes e plantões por departamento.</p>
                </div>

                <div 
                  onClick={() => navigate('/credenciais')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Contact size={24} />
                  </div>
                  <h4 className="font-black text-gray-900 text-base">Crachás & Acesso</h4>
                  <p className="text-xs text-gray-500 mt-1">Emissão e impressão de crachás funcionais com QR Code de autenticidade.</p>
                </div>

                <div 
                  onClick={() => navigate('/vendas')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Store size={24} />
                  </div>
                  <h4 className="font-black text-gray-900 text-base">PDV Frente de Caixa</h4>
                  <p className="text-xs text-gray-500 mt-1">Operação de vendas e doações da livraria espírita, cantina e bazar fraterno.</p>
                </div>

                <div 
                  onClick={() => navigate('/avisos')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Megaphone size={24} />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-gray-900 text-base">Mural de Avisos Oficial</h4>
                    {activeAnnouncementsCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-black">
                        {activeAnnouncementsCount} ativos
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Comunicados internos, painel de projeção e avisos doutrinários.</p>
                </div>

                <div 
                  onClick={() => navigate('/logs')}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-black text-gray-900 text-base">Auditoria & Segurança</h4>
                  <p className="text-xs text-gray-500 mt-1">Trilha de conformidade LGPD, controle de acessos e permissões.</p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent Audit Logs & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShieldCheck size={18} />
                    </div>
                    <h3 className="font-black text-gray-900 text-base tracking-tight">Trilha de Auditoria Recente</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/logs')}
                    className="text-xs font-black text-indigo-600 hover:underline"
                  >
                    Ver Histórico Completo
                  </button>
                </div>

                <div className="divide-y divide-gray-50">
                  {recentLogs.length > 0 ? (
                    recentLogs.map((log) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{log.action}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">{log.details}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-gray-400 text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Recente'}
                          </span>
                          <p className="text-gray-600 font-bold text-[10px]">{log.userName || 'Sistema'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium">
                      Nenhum registro de auditoria no momento.
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">
                    <Sparkles size={14} />
                    <span>Conformidade Espírita</span>
                  </div>
                  <h3 className="text-xl font-black italic tracking-tight">Padrão FEB & Legislação</h3>
                  <p className="text-xs text-indigo-200 mt-2 leading-relaxed">
                    Módulos integrados com os estatutos e regimentos recomendados pela Federação Espírita Brasileira (FEB), Lei Federal de Voluntariado nº 9.608/1998 e Lei Geral de Proteção de Dados (LGPD).
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-indigo-200">
                    <span>Quadro Social Estatutário</span>
                    <span className="font-bold text-white">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-200">
                    <span>Livro Oficial de Atas</span>
                    <span className="font-bold text-white">Canônico</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-200">
                    <span>Assinatura Digital de Termos</span>
                    <span className="font-bold text-white">QR Code</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
