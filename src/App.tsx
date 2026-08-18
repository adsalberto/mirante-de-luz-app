import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { AppHeader } from './components/layout/AppHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import LoginPage from './pages/LoginPage';
import VolunteerRegistration from './pages/VolunteerRegistration';
import { Dashboard } from './pages/Dashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import SpeakerDashboard from './pages/SpeakerDashboard';
import AdministrativeDashboard from './pages/AdministrativeDashboard';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { QueuePage } from './pages/QueuePage';
import { EvolutionPage } from './pages/EvolutionPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SpeakersPage } from './pages/SpeakersPage';
import { AgendaPage } from './pages/AgendaPage';
import { SectorsPage } from './pages/SectorsPage';
import SectorDetailsPage from './pages/SectorDetailsPage';
import ProfilePage from './pages/ProfilePage';
import { SchedulesPage } from './pages/SchedulesPage';
import { LogsPage } from './pages/LogsPage';
import { InventoryPage } from './pages/InventoryPage';
import DonationLandingPage from './pages/DonationLandingPage';
import { VendasPage } from './pages/VendasPage';
import CredentialsPage from './pages/CredentialsPage';
import ChangeTempPassword from './components/ChangeTempPassword';
import { PlanejamentoPage } from './pages/PlanejamentoPage';
import { AudiobooksPage } from './pages/AudiobooksPage';
import { MascotPage } from './pages/MascotPage';
import { AvisosPage } from './pages/AvisosPage';
import { ImpactoSocialPage } from './pages/ImpactoSocialPage';
import { DoutrinarioPage } from './pages/DoutrinarioPage';
import { FraternoPage } from './pages/FraternoPage';
import { PassePage } from './pages/PassePage';
import { ArtePage } from './pages/ArtePage';

function AppRoutes() {
  const { currentUser, fbUser, loading, logout } = useAuth();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to trigger Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDashboardByRole = () => {
    switch (currentUser?.role) {
      case 'RECEPCIONISTA':
        return <ReceptionistDashboard />;
      case 'VOLUNTARIO':
      case 'ATENDENTE':
        return <VolunteerDashboard />;
      case 'PALESTRANTE':
        return <SpeakerDashboard />;
      case 'SECRETARIO':
      case 'COORDENADOR':
        return <AdministrativeDashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Perfil...</p>
        </div>
      </div>
    );
  }

  if (currentUser?.mustChangePassword) {
    return <ChangeTempPassword />;
  }

  return (
    <>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      <Routes>
        <Route path="/login" element={!fbUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/quero-ser-voluntario" element={<VolunteerRegistration />} />
        <Route path="/doar/:campaignId" element={<DonationLandingPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="*" element={
            <div className="flex h-screen overflow-hidden bg-slate-50/70">
              {currentUser && (
                <Sidebar 
                  user={currentUser} 
                  onLogout={logout} 
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(prev => !prev)}
                  onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                />
              )}
              
              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {currentUser && (
                  <AppHeader 
                    user={currentUser} 
                    onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                  />
                )}

                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <Routes>
                    <Route path="/" element={getDashboardByRole()} />
                    <Route path="/atendidos" element={<ParticipantsPage />} />
                    <Route path="/palestrantes" element={<SpeakersPage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="/fila" element={<QueuePage />} />
                    <Route path="/fraterno" element={<FraternoPage />} />
                    <Route path="/atendimentos" element={<FraternoPage />} />
                    <Route path="/passe" element={<PassePage />} />
                    <Route path="/arte" element={<ArtePage />} />
                    <Route path="/relatorios" element={<ReportsPage />} />
                    <Route path="/vendas" element={<VendasPage />} />
                    <Route path="/credenciais" element={<CredentialsPage />} />
                    <Route path="/audiobooks" element={<AudiobooksPage />} />
                    <Route path="/avisos" element={<AvisosPage />} />
                    <Route path="/impacto-social" element={<ImpactoSocialPage />} />
                    <Route path="/mascote" element={<MascotPage />} />
                    <Route path="/doutrinario" element={<DoutrinarioPage />} />
                    
                    {/* Admin & Secretary/Coordinator routes */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADM', 'SECRETARIO', 'COORDENADOR']} />}>
                      <Route path="/trabalhadores" element={<SettingsPage />} />
                      <Route path="/setores" element={<SectorsPage />} />
                    </Route>

                    {/* Acesso ao Planejamento restrito apenas para ADMIN/ADM ou cargo "Secretário(a) de Planejamento" */}
                    <Route path="/planejamento" element={
                      currentUser && (
                        currentUser.role === 'ADMIN' || 
                        currentUser.role === 'ADM' || 
                        (currentUser.position && [
                          'secretário de planejamento',
                          'secretário(a) de planejamento',
                          'secretária de planejamento',
                          'secretario de planejamento',
                          'secretario(a) de planejamento',
                          'secretaria de planejamento'
                        ].includes(currentUser.position.toLowerCase()))
                      ) ? <PlanejamentoPage /> : <Navigate to="/" replace />
                    } />

                    {/* Strictly Admin only logs */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADM']} />}>
                      <Route path="/logs" element={<LogsPage />} />
                    </Route>
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADM', 'SECRETARIO']} />}>
                      <Route path="/inventario" element={<InventoryPage />} />
                    </Route>

                    <Route path="/escalas" element={<SchedulesPage />} />
                    <Route path="/setores/:id" element={<SectorDetailsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
