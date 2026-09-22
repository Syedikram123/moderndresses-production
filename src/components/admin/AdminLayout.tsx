import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Sliders,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  HardDrive,
  Sparkles,
  MessageCircle,
  Cloud,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStore } from '../../context/StoreContext';
import { isFirebaseConfigured } from '../../config/firebase';
import { isSupabaseConfigured } from '../../config/supabase';

export const AdminLayout: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, adminEmail } = useAdminAuth();
  const { storageMetrics } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Subcategories', path: '/admin/subcategories', icon: Tags },
    { name: 'WHATSAPP CLICKS', path: '/admin/whatsapp-clicks', icon: MessageCircle },
    { name: 'Homepage Settings', path: '/admin/homepage', icon: Sliders },
    { name: 'Store Settings', path: '/admin/settings', icon: Settings },
  ];

  const isCurrent = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row text-charcoal">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-charcoal text-white border-r border-charcoal-light flex-shrink-0 min-h-screen">
        {/* Brand header */}
        <div className="p-6 border-b border-stone-800">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <img
              src="/logo321.png"
              alt="Modern Dresses Logo"
              className="h-7 w-auto object-contain flex-shrink-0"
            />
            <div>
              <span className="font-editorial text-lg font-bold tracking-wider block leading-none">
                MODERN DRESSES
              </span>
              <span className="text-[9px] tracking-[0.2em] text-gold-400 font-semibold uppercase block mt-1">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isCurrent(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? 'bg-gold-600 text-charcoal font-bold shadow'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Storage status & user */}
        <div className="p-4 border-t border-stone-800 space-y-3">
          <div className="bg-stone-800/80 rounded-xl p-3 text-xs space-y-2 border border-stone-700">
            <div className="flex items-center justify-between text-stone-300">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase">
                <Cloud className="w-3.5 h-3.5 text-gold-400" />
                <span>{isFirebaseConfigured ? 'Firestore DB' : 'Local Storage'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="font-mono text-[10px] text-stone-300">{isFirebaseConfigured ? 'Connected' : 'Local'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-stone-700/60 pt-1.5">
              <span>Supabase Media</span>
              <span className="text-stone-300 font-mono">{isSupabaseConfigured ? 'Connected' : 'Local'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="truncate max-w-[140px] text-stone-400 text-[11px]">
              {adminEmail}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-stone-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-charcoal text-white p-4 flex flex-col z-10 shadow-elevated">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <img
                  src="/logo321.png"
                  alt="Modern Dresses Logo"
                  className="h-6 w-auto object-contain"
                />
                <div>
                  <span className="font-editorial text-base font-bold block leading-none">MODERN DRESSES</span>
                  <span className="block text-[9px] tracking-widest text-gold-400 uppercase mt-0.5">
                    Admin Panel
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const active = isCurrent(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider ${
                      active
                        ? 'bg-gold-600 text-charcoal font-bold'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-rose-400 rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-stone-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-1.5 text-charcoal lg:hidden"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isFirebaseConfigured
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {isFirebaseConfigured ? 'CLOUD FIRESTORE' : 'LOCAL DEMO MODE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-boutique-100 hover:bg-boutique-200 text-charcoal rounded-lg text-xs font-semibold transition-colors"
            >
              <span>View Live</span>
              <ExternalLink className="w-3.5 h-3.5 text-boutique-600" />
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
