import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products, categories, subcategories } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? products
        .filter((p) => p.status !== 'HIDDEN' && p.status !== 'DRAFT')
        .filter((p) => {
          return (
            p.name.toLowerCase().includes(trimmed) ||
            p.id.toLowerCase().includes(trimmed) ||
            p.description.toLowerCase().includes(trimmed) ||
            p.shortDescription?.toLowerCase().includes(trimmed) ||
            p.brand?.toLowerCase().includes(trimmed) ||
            p.fabric?.toLowerCase().includes(trimmed) ||
            p.tags?.some((t) => t.toLowerCase().includes(trimmed))
          );
        })
        .slice(0, 8)
    : [];

  const handleSelectProduct = (product: any) => {
    const category = categories.find((c) => c.id === product.categoryId);
    const subcategory = subcategories.find((s) => s.id === product.subcategoryId);
    if (category && subcategory) {
      navigate(`/${category.slug}/${subcategory.slug}/${product.slug}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-charcoal/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-elevated border border-boutique-200 overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-boutique-200">
          <Search className="w-5 h-5 text-boutique-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-charcoal placeholder:text-boutique-400 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-charcoal-muted hover:text-charcoal mr-2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-charcoal-muted hover:text-charcoal bg-boutique-100 rounded-md"
          >
            Back
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-boutique-100">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-charcoal-muted text-sm">
              <p>Type to search across </p><p>Modern Dresses collections</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Boys', 'Girls', 'Mens', 'Women'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 bg-boutique-100 hover:bg-boutique-200 rounded-full text-xs text-charcoal font-medium transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((product) => {
              const category = categories.find((c) => c.id === product.categoryId);
              const mainImage = product.colours[0]?.images[0] || '';
              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-boutique-50 cursor-pointer transition-colors group"
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-14 h-18 object-cover rounded-lg bg-boutique-100 flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold text-boutique-600 bg-boutique-100 px-1.5 py-0.5 rounded">
                        {category?.name || 'Item'}
                      </span>
                      <span className="text-xs text-charcoal-muted font-mono">{product.id}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-charcoal truncate mt-0.5 group-hover:text-gold-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-charcoal-muted truncate">{product.shortDescription}</p>
                    <div className="mt-1">
                      {product.showPrice ? (
                        <span className="text-xs font-bold text-charcoal">
                          {formatPrice(product.sellingPrice)}
                        </span>
                      ) : (
                        <span className="text-xs italic text-boutique-600">
                          {product.priceRequestText || 'Price available on request'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-boutique-400 group-hover:text-charcoal group-hover:translate-x-1 transition-all" />
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-charcoal-muted">
              <p className="text-sm font-medium">No products found for "{query}"</p>
              <p className="text-xs text-charcoal-subtle mt-1">Try another keyword or category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
