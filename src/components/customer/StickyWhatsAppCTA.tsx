import React from 'react';
import { MessageCircle } from 'lucide-react';

interface StickyWhatsAppCTAProps {
  whatsappUrl: string;
  ctaText: string;
  subtitle?: string;
  onWhatsAppClick?: () => void;
}

export const StickyWhatsAppCTA: React.FC<StickyWhatsAppCTAProps> = ({
  whatsappUrl,
  ctaText,
  subtitle,
  onWhatsAppClick,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-boutique-200 p-3 sm:hidden shadow-elevated">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onWhatsAppClick}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold tracking-wider uppercase shadow-md transition-all"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
        <div className="text-left">
          <div className="leading-tight">{ctaText}</div>
          {subtitle && <div className="text-[10px] text-emerald-100 font-normal"></div>}
        </div>
      </a>
    </div>
  );
};
