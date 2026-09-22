import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { useStore } from '../../context/StoreContext';
import { generateGeneralInquiryWhatsAppUrl } from '../../utils/whatsapp';

export const Footer: React.FC = () => {
  const { categories, storeSettings } = useStore();
  const activeCategories = categories.filter((c) => c.isActive);

  const whatsappUrl = generateGeneralInquiryWhatsAppUrl(
    storeSettings?.whatsappNumber || '7204919857',
    storeSettings?.storeName || 'Modern Dresses'
  );

  return (
    <footer className="bg-charcoal text-white pt-16 pb-12 border-t border-charcoal-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo321.png"
                alt="Modern Dresses Logo"
                className="h-10 w-auto object-contain flex-shrink-0"
              />
              <div>
                <span className="font-editorial text-2xl sm:text-3xl tracking-wider text-white font-bold block leading-none">
                  MODERN DRESSES
                </span>
                <span className="text-[10px] tracking-[0.25em] text-gold-400 uppercase font-semibold block mt-1">
                  50+ Years of Trust • Quality • Value • Customer Satisfaction
                </span>
              </div>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed max-w-md">
              {storeSettings?.footerText ||
                'Your premier fashion boutique offering handpicked clothing for boys, girls, women and men. Browse our digital catalogue and order seamlessly via WhatsApp.'}
            </p>
           
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-sm">
              {activeCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/${cat.slug}`}
                    className="text-stone-300 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
    {/*}      <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-stone-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-stone-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-stone-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-300 hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Ordering
                </a>
              </li>
             
            </ul>
          </div>   */}

          {/* Col 4: Store Info */}
          <div>
  <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
    About Us
  </h4>

  <div className="space-y-3 text-sm text-stone-300">

    {/* Location */}
    <a
  href="https://maps.app.goo.gl/f6Zz3vFtXT2j7VxGA"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-start gap-2.5 hover:text-gold-300 transition-colors"
>
  <MapPin className="w-4 h-4 text-gold-400 mt-1 flex-shrink-0" />
  <span className="text-xs leading-relaxed">
    {storeSettings?.address || 'Main Market Road, Near Gawan Chowk, Bidar - 585401, Karnataka'}
  </span>
</a>

    {/* Call */}
    <a
      href="tel:+917204919857"
      className="flex items-center gap-2.5 hover:text-gold-300 transition-colors"
    >
      <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
      <span className="text-xs">7204919857</span>
    </a>

    {/* WhatsApp */}
<a
  href="https://wa.me/917204919857"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2.5 hover:text-gold-300 transition-colors"
>
  <FaWhatsapp className="w-4 h-4 text-gold-400 flex-shrink-0" />
  <span className="text-xs">7204919857</span>
</a>

{/* Instagram */}
<a
  href="https://instagram.com/moderndressesbidar"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2.5 hover:text-gold-300 transition-colors"
>
  <FaInstagram className="w-4 h-4 text-gold-400 flex-shrink-0" />
  <span className="text-xs">@moderndressesbidar</span>
</a>



    {/* Business Hours - Hidden for now */}
    {/* 
    <div className="flex items-center gap-2.5">
      <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
      <span className="text-xs">
        {storeSettings?.businessHours || '10:00 AM - 9:30 PM (All Days)'}
      </span>
    </div>
    */}

  </div>
</div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
  <p>
    © {new Date().getFullYear()} Modern Dresses, Bidar (585401). All rights reserved.
  </p>

  <p>
    Designed & Developed by{" "}
    <span className="text-gold-400 font-medium">ScanGrow</span>
    {" | "}
    <a
      href={`https://wa.me/918951337609?text=${encodeURIComponent(
        "Hello, i want to build a Shopping Website"
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gold-400 hover:text-gold-300 transition-colors"
    >
      Contact Us
    </a>
  </p>
</div>
      </div>
    </footer>
  );
};
