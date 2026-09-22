import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-boutique-100 flex items-center justify-center text-gold-700">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-boutique-600 block">
            404 Error
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal">
            Looks like this style went out of stock.
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            The page or product catalogue link you followed does not exist or may have been updated.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
