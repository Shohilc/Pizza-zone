import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

export function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans">
      <CartDrawer />
      <AuthModal />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="/order/:id" element={<OrderTrackingPage />} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute>
                <AdminMenuPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminSettingsPage />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
