import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, MapPin, MessageCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { generateGeneralInquiryWhatsAppUrl } from '../../utils/whatsapp';

export const AboutPage: React.FC = () => {
  const { storeSettings } = useStore();
  const whatsappUrl = generateGeneralInquiryWhatsAppUrl(
    storeSettings?.whatsappNumber || '7204919857',
    storeSettings?.storeName || 'Modern Dresses'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-12">
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[380px] flex items-center p-8 sm:p-14 bg-charcoal text-white shadow-card">
        <img
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80"
          alt="Modern Dresses Boutique"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold uppercase tracking-widest border border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Boutique Story</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold leading-tight">
            MODERN DRESSES
          </h1>
          <p className="font-editorial text-xl sm:text-2xl text-gold-400 font-normal">
            Fashion For Every Generation
          </p>
          <p className="text-xs sm:text-sm text-stone-200 font-light leading-relaxed">
            Bidar’s beloved family clothing boutique celebrating authenticity, quality fabrics, and personalized service.
          </p>
        </div>
      </div>

      {/* Story Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-boutique-600 block">
              Heritage & Vision
            </span>
            <h2 className="font-editorial text-3xl font-bold text-charcoal">
              Crafting Memorable Looks For Bidar Families
            </h2>
          </div>

          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
            {storeSettings?.aboutStory ||
              'Established with a passion for exceptional quality and timeless fashion, Modern Dresses has been the trusted destination for generations of families in Bidar. From adorable frocks for little girls and festive kurta sets for boys, to graceful designer kurtis for women and sharp tailored shirts for men, we take pride in celebrating every milestone of your life with style.'}
          </p>

          <p className="text-sm text-charcoal-muted leading-relaxed">
            Unlike mass-produced apparel, our collections are handpicked with an emphasis on fabric breathability, stitching longevity, and vibrant Indian aesthetics. Whether you are dressing for a sacred festive puja, a family wedding, or daily comfort, Modern Dresses ensures an effortless shopping experience.
          </p>

          <div className="pt-2 space-y-3">
            {(storeSettings?.aboutHighlights || [
              'Handpicked authentic fabrics & premium tailoring',
              'Full family collection: Boys, Girls, Women & Mens',
              'Personalized WhatsApp consultation & sizing support',
              'Convenient store location in the heart of Bidar',
            ]).map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-charcoal">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{highlight}</span>
              </div>
            ))}
          </div>

       
        </div>

        <div className="lg:col-span-5 relative">
       
        
        </div>
      </div>
    </div>
  );
};
