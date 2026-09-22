import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, MessageCircle, ChevronDown, Phone, MapPin, Download } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SearchModal } from './SearchModal';
import { generateGeneralInquiryWhatsAppUrl } from '../../utils/whatsapp';
import { usePWAInstall } from '../../utils/usePWAInstall';

export const Header: React.FC = () => {
  const { categories, subcategories, storeSettings } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { isInstallable, installApp } = usePWAInstall();
  const location = useLocation();

  const activeCategories = categories.filter((c) => c.isActive);
  const whatsappUrl = generateGeneralInquiryWhatsAppUrl(
    storeSettings?.whatsappNumber || '7204919857',
    storeSettings?.storeName || 'Modern Dresses'
  );

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-boutique-50/95 backdrop-blur-md border-b border-boutique-200 transition-all">
        {/* Top Announcement Bar */}
        

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-charcoal hover:text-charcoal-muted focus:outline-none"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-1 lg:flex-initial text-center lg:text-left">
              <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3 group text-left">
             {/*}   <img
                  src="/logo321.png"
                  alt="Modern Dresses Logo"
                  className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
                />  */}
                <div>
                  <span className="font-editorial text-2xl sm:text-3xl tracking-wider text-charcoal font-bold block leading-none">
  MODERN DRESSES
</span>

<span className="text-[10px] sm:text-[11px] tracking-[0.2em] text-charcoal-muted uppercase block mt-1 font-semibold group-hover:text-gold-700 transition-colors">
  FASHION FOR EVERY GENERATION
</span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Navigation Bar (Dynamic from Categories) */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold-700 ${
                  location.pathname === '/' ? 'text-charcoal font-bold border-b-2 border-charcoal pb-1' : 'text-charcoal-muted'
                }`}
              >
                Home
              </Link>

              {activeCategories.map((cat) => {
                const isCatActive = location.pathname.startsWith(`/${cat.slug}`);
                const catSubcats = subcategories.filter((s) => s.categoryId === cat.id && s.isActive);

                return (
                  <div key={cat.id} className="relative group">
                    <Link
                      to={`/${cat.slug}`}
                      className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold-700 flex items-center gap-1 ${
                        isCatActive ? 'text-charcoal font-bold border-b-2 border-charcoal pb-1' : 'text-charcoal-muted'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {catSubcats.length > 0 && (
                        <ChevronDown className="w-3 h-3 text-boutique-400 group-hover:rotate-180 transition-transform duration-200" />
                      )}
                    </Link>

                    {/* Subcategories Dropdown */}
                    {catSubcats.length > 0 && (
                      <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="w-56 bg-white rounded-xl shadow-card border border-boutique-200 py-2.5 px-1">
                          <Link
                            to={`/${cat.slug}`}
                            className="block px-3 py-2 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-boutique-100 rounded-lg"
                          >
                            All {cat.name}
                          </Link>
                          <div className="my-1 border-t border-boutique-100" />
                          {catSubcats.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/${cat.slug}/${sub.slug}`}
                              className="block px-3 py-1.5 text-xs text-charcoal-muted hover:text-charcoal hover:bg-boutique-50 rounded-lg transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/*}  <Link
                to="/about"
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold-700 ${
                  location.pathname === '/about' ? 'text-charcoal font-bold border-b-2 border-charcoal pb-1' : 'text-charcoal-muted'
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold-700 ${
                  location.pathname === '/contact' ? 'text-charcoal font-bold border-b-2 border-charcoal pb-1' : 'text-charcoal-muted'
                }`}
              >
                Contact
              </Link>  */}
            </nav>

            {/* Right: Actions (Search, PWA Install, WhatsApp CTA) */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {isInstallable && (
                <button
                  type="button"
                  onClick={installApp}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider text-charcoal bg-boutique-200 hover:bg-gold-200 rounded-full shadow-xs transition-all"
                  title="Install Modern Dresses App"
                >
                  <Download className="w-3.5 h-3.5 text-charcoal" />
                  <span>Install App</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-charcoal hover:text-gold-700 transition-colors rounded-full hover:bg-boutique-100"
                aria-label="Search catalogue"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Contact Actions */}
<div className="hidden sm:flex items-center gap-2">

  {/* WhatsApp */}
<a
  href={whatsappUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="WhatsApp"
  title="WhatsApp"
  className="flex items-center justify-center w-9 h-9 bg-emerald-600 text-white rounded-full shadow-sm hover:bg-emerald-700 transition-colors"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.6 5.96L.04 24l6.26-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.47-8.43ZM12.07 21.82h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.86 9.86 0 0 1-1.51-5.28c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.12 1.03 6.98 2.89a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.2-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
    />
  </svg>
</a>
  {/* Instagram */}
  <a
    href="https://www.instagram.com/moderndressesbidar"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    title="Instagram"
    className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white rounded-full shadow-sm hover:opacity-90 transition-opacity"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  </a>

  {/* Call */}
  <a
    href="tel:+917204919857"
    aria-label="Call"
    title="Call"
    className="flex items-center justify-center w-9 h-9 bg-emerald-600 text-white rounded-full shadow-sm hover:bg-emerald-700 transition-colors">
    <Phone className="w-5 h-5" />
  </a>

  {/* Location */}
  <a
    href="https://maps.app.goo.gl/f6Zz3vFtXT2j7VxGA"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Location"
    title="Location"
    className="flex items-center justify-center w-9 h-9 bg-blue-900 text-white rounded-full shadow-sm hover:bg-blue-950 transition-colors">
      <MapPin className="w-5 h-5" />
  </a>

</div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-boutique-50 shadow-elevated border-r border-boutique-200 flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-boutique-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo321.png"
                  alt="Modern Dresses Logo"
                  className="h-7 w-auto object-contain"
                />
                <div>
                  <span className="font-editorial text-lg font-bold text-charcoal leading-none block">MODERN DRESSES</span>
                  <span className="block text-[9px] tracking-widest text-charcoal-muted font-semibold uppercase mt-0.5">
                    FASHION FOR EVERY GENERATION
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-charcoal-muted hover:text-charcoal"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2.5 px-3 text-sm font-semibold uppercase tracking-wider text-charcoal hover:bg-boutique-100 rounded-lg"
              >
                Home
              </Link>

              {activeCategories.map((cat) => {
                const catSubcats = subcategories.filter((s) => s.categoryId === cat.id && s.isActive);
                const isExpanded = expandedCategory === cat.id;

                return (
                  <div key={cat.id} className="border-b border-boutique-100 last:border-none pb-1">
                    <div className="flex items-center justify-between py-2 px-3 hover:bg-boutique-100 rounded-lg">
                      <Link
                        to={`/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-sm font-semibold uppercase tracking-wider text-charcoal flex-1"
                      >
                        {cat.name}
                      </Link>
                      {catSubcats.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand(cat.id)}
                          className="p-1 text-boutique-500 hover:text-charcoal"
                          aria-label={`Toggle ${cat.name} subcategories`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {isExpanded && catSubcats.length > 0 && (
                      <div className="pl-6 pr-2 py-1 space-y-1 bg-boutique-100/50 rounded-lg my-1">
                        <Link
                          to={`/${cat.slug}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block py-1.5 text-xs font-semibold text-charcoal uppercase tracking-wider"
                        >
                          All {cat.name}
                        </Link>
                        {catSubcats.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/${cat.slug}/${sub.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-1.5 text-xs text-charcoal-muted hover:text-charcoal"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

             {/*} <div className="pt-4 border-t border-boutique-200">
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 text-sm font-medium text-charcoal-muted hover:text-charcoal"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-3 text-sm font-medium text-charcoal-muted hover:text-charcoal"
                >
                  Contact Us
                </Link>
              </div>  */}
            </div>

            {/* Drawer Footer - Quick Contact Actions */}
<div className="p-4 border-t border-boutique-200 bg-white space-y-3">
  {isInstallable && (
    <button
      type="button"
      onClick={() => {
        setIsMobileMenuOpen(false);
        installApp();
      }}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
    >
      <Download className="w-4 h-4 text-gold-400" />
      <span>Install Modern Dresses App</span>
    </button>
  )}
  <div className="grid grid-cols-4 gap-2">

    {/* WhatsApp */}
<a
  href="https://wa.me/917204919857"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="WhatsApp"
  className="flex items-center justify-center py-3 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.6 5.96L.04 24l6.26-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.47-8.43ZM12.07 21.82h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.86 9.86 0 0 1-1.51-5.28c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.12 1.03 6.98 2.89a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
  </svg>
</a>

    {/* Instagram */}
<a
  href="https://www.instagram.com/moderndressesbidar"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Instagram"
  className="flex items-center justify-center py-3 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
</a>

    {/* Call */}
    <a
      href="tel:+917204919857"
      aria-label="Call"
      className="flex items-center justify-center py-3 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
      >
      <Phone className="w-5 h-5" />
    </a>

    {/* Location */}
<a
  href="https://maps.app.goo.gl/f6Zz3vFtXT2j7VxGA"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Location"
  className="flex items-center justify-center py-3 bg-blue-900 text-white rounded-xl shadow-sm hover:bg-blue-950 transition-colors"
  >
  <MapPin className="w-5 h-5" />
</a>
  </div>
</div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
