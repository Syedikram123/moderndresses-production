import React from 'react';
import { MapPin, Phone, MessageCircle, Clock, Mail, Globe } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { generateGeneralInquiryWhatsAppUrl } from '../../utils/whatsapp';

export const ContactPage: React.FC = () => {
  const { storeSettings } = useStore();
  const whatsappUrl = generateGeneralInquiryWhatsAppUrl(
    storeSettings?.whatsappNumber || '7204919857',
    storeSettings?.storeName || 'Modern Dresses'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-12">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-boutique-600 block">
          Get In Touch
        </span>
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-charcoal">
          Visit Our Bidar Boutique
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          We warmly invite you to explore our physical boutique in Bidar or get in touch instantly through WhatsApp for orders, custom fittings, and queries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Cards */}
        <div className="lg:col-span-6 space-y-4">
          {/* WhatsApp Direct Card */}
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 space-y-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">WhatsApp Concierge</h3>
                <p className="text-xs text-emerald-800">Fastest response for pricing & orders</p>
              </div>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Send us screenshots of products you like or inquire about custom sizes and fabrics. Our shop team replies promptly!
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Chat with +91 {storeSettings?.whatsappNumber || '7204919857'}</span>
            </a>
          </div>

          {/* Location & Address */}
          <div className="bg-white rounded-2xl p-6 border border-boutique-200 space-y-3 shadow-soft">
            <div className="flex items-center gap-3 text-charcoal">
              <MapPin className="w-5 h-5 text-gold-700" />
              <h3 className="text-base font-bold">Store Address</h3>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed pl-8">
              {storeSettings?.address || 'Main Market Road, Near Gawan Chowk, Bidar - 585401, Karnataka, India'}
            </p>
          </div>

          {/* Phone & Business Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-boutique-200 space-y-2 shadow-soft">
              <div className="flex items-center gap-2 text-charcoal">
                <Phone className="w-4 h-4 text-gold-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Phone Call</h4>
              </div>
              <p className="text-xs text-charcoal-muted">
                {storeSettings?.phone || '+91 7204919857'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-boutique-200 space-y-2 shadow-soft">
              <div className="flex items-center gap-2 text-charcoal">
                <Clock className="w-4 h-4 text-gold-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Store Timings</h4>
              </div>
              <p className="text-xs text-charcoal-muted">
                {storeSettings?.businessHours || '10:00 AM - 9:30 PM (Daily)'}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl p-5 border border-boutique-200 flex items-center justify-between shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal">Follow Modern Dresses:</span>
            <div className="flex items-center gap-3">
              {storeSettings?.instagram && (
                <a
                  href={storeSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-boutique-100 hover:bg-boutique-200 text-charcoal transition-colors flex items-center justify-center text-xs font-semibold"
                  aria-label="Instagram"
                >
                  <Globe className="w-4 h-4 mr-1 text-gold-700" />
                  <span>Instagram</span>
                </a>
              )}
              {storeSettings?.facebook && (
                <a
                  href={storeSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-boutique-100 hover:bg-boutique-200 text-charcoal transition-colors flex items-center justify-center text-xs font-semibold"
                  aria-label="Facebook"
                >
                  <Globe className="w-4 h-4 mr-1 text-blue-700" />
                  <span>Facebook</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Map / Boutique Visual */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl overflow-hidden border border-boutique-200 shadow-card bg-boutique-100 aspect-[4/3] relative">
            <img
              src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80"
              alt="Boutique Interior Modern Dresses Bidar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-gold-300 font-bold block">
                  Boutique Experience
                </span>
                <h3 className="font-editorial text-xl font-bold">Modern Dresses, Bidar</h3>
                <p className="text-xs text-stone-300">Come explore thousands of premium styles in person</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
