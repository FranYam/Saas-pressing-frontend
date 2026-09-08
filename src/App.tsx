import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ClientAccessProvider, useClientAccess } from '@/context/ClientAccessContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBrandTheme } from '@/lib/theme';

// Découpage du bundle pour une connexion lente (lazy loading des routes)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'));
const OrdersPage = lazy(() => import('@/pages/app/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/app/OrderDetailPage'));
const NewOrderPage = lazy(() => import('@/pages/app/NewOrderPage'));
const ClientsPage = lazy(() => import('@/pages/app/ClientsPage'));
const ClientDetailPage = lazy(() => import('@/pages/app/ClientDetailPage'));
const PaymentsPage = lazy(() => import('@/pages/app/PaymentsPage'));
const DeliveriesPage = lazy(() => import('@/pages/app/DeliveriesPage'));
const TeamPage = lazy(() => import('@/pages/app/TeamPage'));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'));
const CollectPage = lazy(() => import('@/pages/client/CollectPage'));
const TrackPage = lazy(() => import('@/pages/client/TrackPage'));
const PayPage = lazy(() => import('@/pages/client/PayPage'));
const ClientAccessPage = lazy(() => import('@/pages/client/ClientAccessPage'));
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage'));
const ClientHistoryPage = lazy(() => import('@/pages/client/ClientHistoryPage'));
const MissionsPage = lazy(() => import('@/pages/courier/MissionsPage'));
const MissionDetailPage = lazy(() => import('@/pages/courier/MissionDetailPage'));
const CourierDashboardPage = lazy(() => import('@/pages/courier/CourierDashboardPage'));
const CourierHistoryPage = lazy(() => import('@/pages/courier/CourierHistoryPage'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner label="Chargement de la page…" />
    </div>
  );
}

/** Accueil : redirige vers la page d'accueil du rôle connecté */
function RoleHome() {
  const { user, homeForRole, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

/** Applique la couleur personnalisée du pressing (variables CSS) à toute l'application */
function BrandThemeSync() {
  useBrandTheme();
  return null;
}

/** Garde du portail client : redirige vers l'écran d'accès si aucune session ticket */
function RequireClientAccess() {
  const { access, loading } = useClientAccess();
  if (loading && access) {
    return <PageLoader />;
  }
  if (!access) return <Navigate to="/client/access" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrandThemeSync />
      <ClientAccessProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Accueil : redirige selon le rôle */}
            <Route path="/" element={<RoleHome />} />

            {/* Authentification (sans sidebar) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Application Gérant / Employé */}
            <Route
              element={
                <ProtectedRoute roles={['gerant', 'employe']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/new" element={<NewOrderPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
            </Route>

            {/* Sections réservées au Gérant */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute roles={['gerant']}>
                  <AppLayout>
                    <PaymentsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute roles={['gerant']}>
                  <AppLayout>
                    <DeliveriesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute roles={['gerant']}>
                  <AppLayout>
                    <TeamPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={['gerant']}>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Portail Client — accès public par ticket + téléphone */}
            <Route path="/client/access" element={<ClientAccessPage />} />
            <Route path="/client/collect" element={<CollectPage />} />
            <Route element={<RequireClientAccess />}>
              <Route path="/client/dashboard" element={<ClientDashboardPage />} />
              <Route path="/client/history" element={<ClientHistoryPage />} />
              <Route path="/client/track/:id" element={<TrackPage />} />
              <Route path="/client/pay/:id" element={<PayPage />} />
            </Route>
            {/* Anciens chemins client → redirection permanente */}
            <Route path="/collect" element={<Navigate to="/client/access" replace />} />
            <Route path="/track/:id" element={<Navigate to="/client/access" replace />} />
            <Route path="/pay/:id" element={<Navigate to="/client/access" replace />} />
            <Route path="/portal" element={<Navigate to="/client/access" replace />} />

            {/* Portail Coursier (web + mobile) */}
            <Route
              path="/courier/dashboard"
              element={
                <ProtectedRoute roles={['coursier']}>
                  <CourierDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courier/missions"
              element={
                <ProtectedRoute roles={['coursier']}>
                  <MissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courier/missions/:id"
              element={
                <ProtectedRoute roles={['coursier']}>
                  <MissionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courier/history"
              element={
                <ProtectedRoute roles={['coursier']}>
                  <CourierHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<RoleHome />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ClientAccessProvider>
    </AuthProvider>
  );
}
