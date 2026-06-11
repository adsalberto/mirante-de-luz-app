import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
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

function AppRoutes() {
  const { currentUser, fbUser, loading, logout } = useAuth();

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
    <Routes>
      <Route path="/login" element={!fbUser ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/quero-ser-voluntario" element={<VolunteerRegistration />} />
      <Route path="/doar/:campaignId" element={<DonationLandingPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="*" element={
          <div className="flex min-h-screen bg-indigo-50/50">
            {currentUser && <Sidebar user={currentUser} onLogout={logout} />}
            
            <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
              <Routes>
                <Route path="/" element={getDashboardByRole()} />
                <Route path="/atendidos" element={<ParticipantsPage />} />
                <Route path="/palestrantes" element={<SpeakersPage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/fila" element={<QueuePage />} />
                <Route path="/atendimentos" element={<EvolutionPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route path="/vendas" element={<VendasPage />} />
                <Route path="/credenciais" element={<CredentialsPage />} />
                
                {/* Admin & Secretary/Coordinator routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ADM', 'SECRETARIO', 'COORDENADOR']} />}>
                  <Route path="/trabalhadores" element={<SettingsPage />} />
                  <Route path="/setores" element={<SectorsPage />} />
                </Route>

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
        } />
      </Route>
    </Routes>
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
