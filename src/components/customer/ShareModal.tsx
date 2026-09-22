import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} at Modern Dresses:`,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out ${title} at Modern Dresses:\n${url}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-elevated border border-boutique-200">
        <div className="flex items-center justify-between pb-4 border-b border-boutique-100">
          <h3 className="text-base font-bold font-editorial text-charcoal">Share Product</h3>
          <button
            onClick={onClose}
            className="p-1 text-charcoal-muted hover:text-charcoal rounded-full"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share via WhatsApp</span>
          </a>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-boutique-100 hover:bg-boutique-200 text-charcoal rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>More Share Options</span>
            </button>
          )}

          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
              Direct Product Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="w-full text-xs bg-boutique-50 border border-boutique-200 rounded-lg px-3 py-2 text-charcoal truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-2 bg-charcoal text-white rounded-lg text-xs font-medium hover:bg-gold-700 transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
