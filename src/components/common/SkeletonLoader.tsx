import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-boutique-200 animate-pulse">
      <div className="aspect-[3/4] bg-boutique-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-boutique-200 rounded w-3/4" />
        <div className="h-3 bg-boutique-200 rounded w-1/2" />
        <div className="h-5 bg-boutique-200 rounded w-1/3 pt-2" />
      </div>
    </div>
  );
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-boutique-200 animate-pulse flex flex-col justify-end p-6">
      <div className="h-6 bg-boutique-300 rounded w-1/2 mb-2" />
      <div className="h-4 bg-boutique-300 rounded w-3/4" />
    </div>
  );
};
