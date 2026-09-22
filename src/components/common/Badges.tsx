import React from 'react';
import { ProductStatus } from '../../types';

export const StatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Active
        </span>
      );
    case 'OUT_OF_STOCK':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Out of Stock
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Draft
        </span>
      );
    case 'HIDDEN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-700 border border-stone-300">
          Hidden
        </span>
      );
    default:
      return null;
  }
};

export const MarketingBadge: React.FC<{ type: 'new' | 'trending' | 'featured' | 'discount'; value?: string | number }> = ({ type, value }) => {
  switch (type) {
    case 'new':
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] tracking-widest font-semibold uppercase bg-charcoal text-white rounded shadow-sm">
          NEW
        </span>
      );
    case 'trending':
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] tracking-widest font-semibold uppercase bg-gold-600 text-white rounded shadow-sm">
          TRENDING
        </span>
      );
    case 'featured':
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] tracking-widest font-semibold uppercase bg-boutique-600 text-white rounded shadow-sm">
          FEATURED
        </span>
      );
    case 'discount':
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider font-semibold uppercase bg-rose-700 text-white rounded shadow-sm">
          {value}% OFF
        </span>
      );
    default:
      return null;
  }
};
