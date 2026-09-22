import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Product, Category, Subcategory } from '../../types';
import { formatPrice, calculateDiscount } from '../../utils/formatters';
import { MarketingBadge } from '../common/Badges';

interface ProductCardProps {
  product: Product;
  category?: Category;
  subcategory?: Subcategory;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, category, subcategory }) => {
  const [selectedColourIndex, setSelectedColourIndex] = useState(0);

  const currentColour = product.colours[selectedColourIndex] || product.colours[0];
  const displayImage = currentColour?.images[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80';
  const discount = calculateDiscount(product.mrp, product.sellingPrice);
  const isOutOfStock = product.status === 'OUT_OF_STOCK';

  const categorySlug = category?.slug || 'shop';
  const subcategorySlug = subcategory?.slug || 'items';
  const productUrl = `/${categorySlug}/${subcategorySlug}/${product.slug}`;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-boutique-200/80 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col">
      {/* Product Image & Badges Container */}
      <Link to={productUrl} className="relative aspect-[3/4] overflow-hidden bg-boutique-100 block">
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover object-center img-zoom-hover ${
            isOutOfStock ? 'opacity-70 grayscale-30' : ''
          }`}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-rose-600 text-white rounded shadow">
              OUT OF STOCK
            </span>
          ) : (
            <>
              {product.isNewArrival && <MarketingBadge type="new" />}
              {product.isTrending && <MarketingBadge type="trending" />}
              {product.isFeatured && <MarketingBadge type="featured" />}
              {product.showPrice && discount > 0 && <MarketingBadge type="discount" value={discount} />}
            </>
          )}
        </div>

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-0 bg-charcoal/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="w-full py-2.5 bg-white/95 backdrop-blur-xs text-charcoal rounded-xl text-xs font-bold tracking-wider uppercase text-center shadow-md flex items-center justify-center gap-1">
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category / Brand Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-charcoal-muted uppercase tracking-wider mb-1">
            <span>{category?.name || 'Modern Dresses'}</span>
            <span className="font-mono text-[10px] text-charcoal-subtle">{product.id}</span>
          </div>

          {/* Product Title */}
          <Link to={productUrl}>
            <h3 className="font-serif text-base font-medium text-charcoal line-clamp-1 group-hover:text-gold-700 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs text-charcoal-muted line-clamp-1 mt-1 font-light">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Bottom Details: Colours & Price */}
        <div className="mt-4 pt-3 border-t border-boutique-100 flex items-center justify-between">
          {/* Colours Swatches */}
          <div className="flex items-center gap-1.5">
            {product.colours.map((col, idx) => (
              <button
                key={col.id || idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColourIndex(idx);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  selectedColourIndex === idx
                    ? 'scale-125 ring-2 ring-charcoal/20'
                    : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: col.hex || '#ccc' }}
                title={col.name}
                aria-label={col.name}
              />
            ))}
            {product.colours.length > 3 && (
              <span className="text-[10px] text-charcoal-subtle">+{product.colours.length - 3}</span>
            )}
          </div>

          {/* Price Display Logic (Requirement 14 & 63) */}
          <div className="text-right">
            {product.showPrice ? (
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-sm sm:text-base font-bold text-charcoal">
                  {formatPrice(product.sellingPrice)}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-xs text-charcoal-subtle line-through">
                    {formatPrice(product.mrp)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-serif italic text-gold-700 font-medium">
                {product.priceRequestText || 'Price on request'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
