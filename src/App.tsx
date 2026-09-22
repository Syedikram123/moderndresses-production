import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { CategoryPage } from './pages/customer/CategoryPage';
import { SubcategoryPage } from './pages/customer/SubcategoryPage';
import { ProductPage } from './pages/customer/ProductPage';
import { AboutPage } from './pages/customer/AboutPage';
import { ContactPage } from './pages/customer/ContactPage';
import { NotFoundPage } from './pages/customer/NotFoundPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProductsList } from './pages/admin/AdminProductsList';
import { AdminProductEdit } from './pages/admin/AdminProductEdit';
import { AdminCategoriesList } from './pages/admin/AdminCategoriesList';
import { AdminSubcategoriesList } from './pages/admin/AdminSubcategoriesList';
import { AdminHomepageCMS } from './pages/admin/AdminHomepageCMS';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminWhatsAppClicks } from './pages/admin/AdminWhatsAppClicks';

// Scroll to top helper on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/categories') {
      setTimeout(() => {
        document.getElementById('categories')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

// Customer Layout Shell
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-boutique-50 text-charcoal">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Protected Admin Route Guard
const ProtectedAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AdminAuthProvider>
          <ScrollToTop />
          <Routes>
            {/* ADMIN ROUTES */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProductsList />} />
              <Route path="products/new" element={<AdminProductEdit />} />
              <Route path="products/edit/:id" element={<AdminProductEdit />} />
              <Route path="categories" element={<AdminCategoriesList />} />
              <Route path="subcategories" element={<AdminSubcategoriesList />} />
              <Route path="whatsapp-clicks" element={<AdminWhatsAppClicks />} />
              <Route path="homepage" element={<AdminHomepageCMS />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* CUSTOMER STORE ROUTES */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/:categorySlug" element={<CategoryPage />} />
              <Route path="/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
              <Route path="/:categorySlug/:subcategorySlug/:productSlug" element={<ProductPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
