import React from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export interface FilterState {
  priceRange: 'ALL' | 'UNDER_1500' | '1500_2500' | 'ABOVE_2500';
  selectedSize: string;
  inStockOnly: boolean;
  sortBy: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'FEATURED';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableSizes: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  availableSizes,
  totalResults,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-boutique-200/80 shadow-soft mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Results Counter & Header */}
        <div className="flex items-center gap-2 text-charcoal">
          <SlidersHorizontal className="w-4 h-4 text-boutique-500" />
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Filters</span>
          <span className="text-xs text-charcoal-muted bg-boutique-100 px-2 py-0.5 rounded-full font-medium">
            {totalResults} {totalResults === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {/* Filter Controls Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Price Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-charcoal-muted hidden sm:inline">Price:</span>
            <select
              value={filters.priceRange}
              onChange={(e) =>
                onChange({ ...filters, priceRange: e.target.value as FilterState['priceRange'] })
              }
              className="text-xs bg-boutique-50 border border-boutique-200 rounded-lg px-2.5 py-1.5 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
            >
              <option value="ALL">All Prices</option>
              <option value="UNDER_1500">Under ₹1,500</option>
              <option value="1500_2500">₹1,500 – ₹2,500</option>
              <option value="ABOVE_2500">Above ₹2,500</option>
            </select>
          </div>

          {/* Size Filter */}
          {availableSizes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-charcoal-muted hidden sm:inline">Size:</span>
              <select
                value={filters.selectedSize}
                onChange={(e) => onChange({ ...filters, selectedSize: e.target.value })}
                className="text-xs bg-boutique-50 border border-boutique-200 rounded-lg px-2.5 py-1.5 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
              >
                <option value="">All Sizes</option>
                {availableSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* In-Stock Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-charcoal cursor-pointer select-none bg-boutique-50 px-2.5 py-1.5 rounded-lg border border-boutique-200">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
              className="rounded text-charcoal focus:ring-charcoal w-3.5 h-3.5"
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-boutique-500" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })
              }
              className="text-xs bg-boutique-50 border border-boutique-200 rounded-lg px-2.5 py-1.5 text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-charcoal"
            >
              <option value="NEWEST">Newest Arrivals</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
