import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { HousesPage } from '../pages/Houses/HousesPage';
import { HouseDetailPage } from '../pages/Houses/HouseDetailPage';
import { RoomsPage } from '../pages/Rooms/RoomsPage';
import { TenantsPage } from '../pages/Tenants/TenantsPage';
import { PaymentsPage } from '../pages/Payments/PaymentsPage';
import { ExpensesPage } from '../pages/Expenses/ExpensesPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { ContractsPage } from '../pages/ContractsPage';
import { ContractDetailPage } from '../pages/Contracts/ContractDetailPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProfilePage } from '../pages/ProfilePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="houses/:id" element={<HouseDetailPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="contracts/:id" element={<ContractDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
