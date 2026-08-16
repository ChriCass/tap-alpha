import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ErrorBoundary } from "./components/common/error-boundary";
import { AuthLayout } from "./layouts/auth.layout";
import { AdminLayout } from "./layouts/admin.layout";
import { LoginPage } from "./pages/auth/login.page";
import { DashboardPage } from "./pages/admin/dashboard.page";
import { ProductsPage } from "./pages/admin/products.page";
import { ProductDetailPage } from "./pages/admin/product-detail.page";
import { CollectionsPage } from "./pages/admin/collections.page";
import { CollectionDetailPage } from "./pages/admin/collection-detail.page";
import { OrdersPage } from "./pages/admin/orders.page";
import { CustomersPage } from "./pages/admin/customers.page";
import { CouponsPage } from "./pages/admin/coupons.page";
import { AnalyticsPage } from "./pages/admin/analytics.page";
import { ThemesPage } from "./pages/admin/themes.page";
import { SettingsPage } from "./pages/admin/settings.page";
import { LoadingSpinner } from "./components/common/loading-spinner";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route
              element={
                <GuestRoute>
                  <AuthLayout />
                </GuestRoute>
              }
            >
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Admin */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/products/new" element={<ProductDetailPage />} />
              <Route path="/admin/products/:id" element={<ProductDetailPage />} />
              <Route path="/admin/collections" element={<CollectionsPage />} />
              <Route path="/admin/collections/new" element={<CollectionDetailPage />} />
              <Route path="/admin/collections/:id" element={<CollectionDetailPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/customers" element={<CustomersPage />} />
              <Route path="/admin/coupons" element={<CouponsPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/themes" element={<ThemesPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
