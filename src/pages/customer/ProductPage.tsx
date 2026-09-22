import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Share2, ShieldCheck, Truck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductGallery } from '../../components/customer/ProductGallery';
import { ProductCard } from '../../components/customer/ProductCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { ShareModal } from '../../components/customer/ShareModal';
import { StickyWhatsAppCTA } from '../../components/customer/StickyWhatsAppCTA';
import { formatPrice, calculateDiscount } from '../../utils/formatters';
import { generateWhatsAppUrl } from '../../utils/whatsapp';
import { recordWhatsAppClick } from '../../utils/whatsappAnalytics';
import { MarketingBadge } from '../../components/common/Badges';

export const ProductPage: React.FC = () => {
  const { categorySlug, subcategorySlug, productSlug } = useParams<{
    categorySlug: string;
    subcategorySlug: string;
    productSlug: string;
  }>();

  const { categories, subcategories, products, storeSettings } = useStore();

  const [selectedColourIndex, setSelectedColourIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'shipping'>('details');

  const category = categories.find((c) => c.slug === categorySlug?.toLowerCase());
  const subcategory = subcategories.find(
    (s) => s.slug === subcategorySlug?.toLowerCase() && (!category || s.categoryId === category.id)
  );

  const product = useMemo(() => {
    if (!category || !subcategory) return null;
    return (
      products.find(
        (p) =>
          p.categoryId === category.id &&
          p.subcategoryId === subcategory.id &&
          p.slug === productSlug?.toLowerCase()
      ) || null
    );
  }, [category, subcategory, productSlug, products]);

  // Handle hidden product visibility rule (Requirement #22)
  const isHidden = product?.status === 'HIDDEN';
  const isOutOfStock = product?.status === 'OUT_OF_STOCK';

  // Selected colour
  const currentColour = product?.colours[selectedColourIndex] || product?.colours[0] || {
    id: 'default',
    name: 'Standard',
    images: [],
  };

  // Set default size once product is loaded
  React.useEffect(() => {
    if (product?.sizes?.length && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product, selectedSize]);

  // Current URL for sharing & WhatsApp
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://moderndresses.com/${categorySlug}/${subcategorySlug}/${productSlug}`;

  // WhatsApp Message Generator
  const whatsappUrl = useMemo(() => {
    if (!product) return '';
    return generateWhatsAppUrl({
      product,
      selectedColour: currentColour.name,
      selectedSize,
      currentUrl,
      whatsappNumber: storeSettings?.whatsappNumber || '7204919857',
      isPriceHidden: !product.showPrice,
      isOutOfStock,
    });
  }, [product, currentColour.name, selectedSize, currentUrl, storeSettings?.whatsappNumber, isOutOfStock]);

  // WhatsApp Button Label
  const whatsappButtonText = useMemo(() => {
    if (isOutOfStock) {
      return storeSettings?.whatsappOutOfStockCtaText || 'ASK IF AVAILABLE';
    }
    if (!product?.showPrice) {
      return storeSettings?.whatsappPriceHiddenCtaText || 'ASK FOR PRICE ON WHATSAPP';
    }
    return storeSettings?.whatsappCtaText || 'ORDER THROUGH WHATSAPP';
  }, [isOutOfStock, product?.showPrice, storeSettings]);

  // Record WhatsApp click event
  const handleWhatsAppClick = () => {
    if (!product) return;
    try {
      recordWhatsAppClick({
        productId: product.id,
        productName: product.name,
        categoryId: category?.id || product.categoryId || '',
        categoryName: category?.name || '',
        subcategoryId: subcategory?.id || product.subcategoryId || '',
        subcategoryName: subcategory?.name || '',
      });
    } catch (err) {
      console.error('Failed to record WhatsApp click event:', err);
    }
  };

  // Related Products ("You May Also Like") - Requirement #65
  const relatedProducts = useMemo(() => {
    if (!product || !category || !subcategory) return [];

    // Same subcategory first
    const sameSubcat = products.filter(
      (p) =>
        p.id !== product.id &&
        p.subcategoryId === subcategory.id &&
        p.status !== 'HIDDEN' &&
        p.status !== 'DRAFT'
    );

    // If fewer than 4, fill with same category
    if (sameSubcat.length >= 4) {
      return sameSubcat.slice(0, 4);
    }

    const sameCat = products.filter(
      (p) =>
        p.id !== product.id &&
        p.categoryId === category.id &&
        p.subcategoryId !== subcategory.id &&
        p.status !== 'HIDDEN' &&
        p.status !== 'DRAFT'
    );

    return [...sameSubcat, ...sameCat].slice(0, 4);
  }, [product, category, subcategory, products]);

  if (!product || !category || !subcategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-editorial text-3xl font-bold text-charcoal mb-3">Product Not Found</h2>
        <p className="text-sm text-charcoal-muted mb-6">
          The requested fashion style may have moved or is currently unavailable.
        </p>
        <Link to="/" className="px-6 py-3 bg-charcoal text-white rounded-xl text-xs uppercase font-semibold">
          Explore Latest Arrivals
        </Link>
      </div>
    );
  }

  // If product is hidden by admin
  if (isHidden) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-editorial text-3xl font-bold text-charcoal mb-3">Style Currently Unavailable</h2>
        <p className="text-sm text-charcoal-muted mb-6">
          This exclusive piece is temporarily paused or unavailable in our catalogue.
        </p>
        <Link to={`/${category.slug}`} className="px-6 py-3 bg-charcoal text-white rounded-xl text-xs uppercase font-semibold">
          Back to {category.name} Collection
        </Link>
      </div>
    );
  }

  const discount = calculateDiscount(product.mrp, product.sellingPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 space-y-12">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: category.name, url: `/${category.slug}` },
          { label: subcategory.name, url: `/${category.slug}/${subcategory.slug}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Layout: Left Gallery, Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Gallery Col */}
        <div className="lg:col-span-6">
          <ProductGallery currentColour={currentColour} productName={product.name} />
        </div>

        {/* Details Col */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Meta: Category, Product ID, Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to={`/${category.slug}/${subcategory.slug}`}
                className="text-xs uppercase font-bold tracking-widest text-gold-700 hover:underline"
              >
                {subcategory.name}
              </Link>
               </div>

            <div className="flex items-center gap-1.5">
              {product.isNewArrival && <MarketingBadge type="new" />}
              {product.isTrending && <MarketingBadge type="trending" />}
              {product.isFeatured && <MarketingBadge type="featured" />}
            </div>
          </div>

          {/* Product Name */}
          <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-charcoal leading-snug">
            {product.name}
          </h1>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-charcoal-muted leading-relaxed font-light">
              {product.shortDescription}
            </p>
          )}

          {/* Price Engine (Requirement 14, 63) */}
          <div className="py-4 border-y border-boutique-200">
            {product.showPrice ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-charcoal">
                    {formatPrice(product.sellingPrice)}
                  </span>
                  {product.mrp > product.sellingPrice && (
                    <>
                      <span className="text-sm sm:text-base text-charcoal-subtle line-through">
                        MRP {formatPrice(product.mrp)}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 rounded">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-charcoal-subtle">Inclusive of all local taxes</p>
              </div>
            ) : (
             <div className="space-y-1">
  <div className="text-base sm:text-lg font-sans font-medium text-charcoal">
    {product.priceRequestText || 'Price available on request'}
  </div>
  <p className="text-xs text-charcoal-muted">
    Connect directly with our store through WhatsApp for current pricing, discounts & availability.
  </p>
</div>
            )}
          </div>

          {/* Out of Stock Notice */}
          {isOutOfStock && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider">OUT OF STOCK:</span>
              <span>This item is currently sold out. Inquire on WhatsApp for next restock date.</span>
            </div>
          )}

          {/* Colour Swatches Selector (Requirement 18) */}
          {product.colours.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-charcoal">
                Selected Colour: <span className="text-gold-700 font-normal">{currentColour.name}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.colours.map((col, idx) => (
                  <button
                    key={col.id || idx}
                    type="button"
                    onClick={() => setSelectedColourIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      selectedColourIndex === idx
                        ? 'border-charcoal bg-charcoal text-white ring-2 ring-charcoal/20'
                        : 'border-boutique-300 bg-white text-charcoal hover:border-charcoal'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: col.hex || '#ccc' }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector (Requirement 20) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-widest text-charcoal">
                  Select Size
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-w-[48px] h-10 px-3.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                      selectedSize === sz
                        ? 'border-charcoal bg-charcoal text-white shadow-sm'
                        : 'border-boutique-300 bg-white text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp CTA Action & Share */}
          <div className="pt-2 space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className={`w-full py-4 px-6 rounded-2xl text-white font-semibold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md transition-all duration-300 ${
                isOutOfStock
                  ? 'bg-stone-700 hover:bg-stone-800'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
              }`}
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{whatsappButtonText}</span>
            </a>

            <div className="flex items-center justify-between pt-1 text-xs text-charcoal-muted">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 hover:text-charcoal transition-colors py-1"
              >
                <Share2 className="w-4 h-4 text-boutique-500" />
                <span>Share Product</span>
              </button>

              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Immediate WhatsApp Confirmation</span>
              </div>
            </div>
          </div>

          {/* Assurances Banner */}
          <div className="grid grid-cols-3 gap-2 py-4 border-t border-boutique-200 text-center">
            <div className="p-2">
              <ShieldCheck className="w-5 h-5 mx-auto text-gold-700 mb-1" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal">100% Authentic</div>
              <div className="text-[9px] text-charcoal-muted"></div>
            </div>
            <div className="p-2">
              <Truck className="w-5 h-5 mx-auto text-gold-700 mb-1" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal">Fast Dispatch</div>
              <div className="text-[9px] text-charcoal-muted"></div>
            </div>
            <div className="p-2">
              <RefreshCw className="w-5 h-5 mx-auto text-gold-700 mb-1" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal">Easy Exchange</div>
              <div className="text-[9px] text-charcoal-muted"></div>
            </div>
          </div>

          {/* Tabs Section: Details, Specifications, Shipping */}
          <div className="pt-2">
            <div className="flex border-b border-boutique-200">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Specifications
              </button>
          {/*}    <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'shipping'
                    ? 'border-charcoal text-charcoal'
                    : 'border-transparent text-charcoal-muted hover:text-charcoal'
                }`}
              >
                Shipping & Care
              </button> */}
            </div>

            <div className="py-4 text-xs text-charcoal-muted leading-relaxed">
              {activeTab === 'details' && (
                <div className="space-y-3">
                  <p>{product.description}</p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-boutique-100 text-charcoal rounded text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="divide-y divide-boutique-100">
                  {product.brand && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Brand</span>
                      <span className="text-charcoal font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.fabric && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Fabric</span>
                      <span className="text-charcoal font-medium">{product.fabric}</span>
                    </div>
                  )}
                  {product.pattern && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Pattern</span>
                      <span className="text-charcoal font-medium">{product.pattern}</span>
                    </div>
                  )}
                  {product.occasion && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Occasion</span>
                      <span className="text-charcoal font-medium">{product.occasion}</span>
                    </div>
                  )}
                  {product.fit && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Fit</span>
                      <span className="text-charcoal font-medium">{product.fit}</span>
                    </div>
                  )}
                  {product.sleeve && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Sleeve</span>
                      <span className="text-charcoal font-medium">{product.sleeve}</span>
                    </div>
                  )}
                  {product.neck && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Neck Style</span>
                      <span className="text-charcoal font-medium">{product.neck}</span>
                    </div>
                  )}
                  {product.washCare && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Wash Care</span>
                      <span className="text-charcoal font-medium">{product.washCare}</span>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div className="py-2 flex justify-between">
                      <span className="text-charcoal-subtle">Country of Origin</span>
                      <span className="text-charcoal font-medium">{product.countryOfOrigin}</span>
                    </div>
                  )}
                </div>
              )}

            {/*  {activeTab === 'shipping' && (
                <div className="space-y-3">
                  <p>
                    <strong className="text-charcoal">Bidar In-Store Pickup:</strong> Free instant collection available during boutique hours (10:00 AM - 9:30 PM).
                  </p>
                  <p>
                    <strong className="text-charcoal">Courier Delivery:</strong> Standard doorstep courier dispatch within Karnataka and throughout India (typically 2-4 business days).
                  </p>
                  <p>
                    <strong className="text-charcoal">Washing & Maintenance:</strong> {product.washCare || 'Dry clean recommended for silk and festive garments; hand wash in cold water for cottons.'}
                  </p>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products ("You May Also Like") - Requirement 65 */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-boutique-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-gold-700 block mb-1">
                Curated Recommendations
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-charcoal">
                You May Also Like
              </h2>
            </div>
            <Link
              to={`/${category.slug}`}
              className="text-xs font-bold uppercase tracking-widest text-charcoal hover:text-gold-700"
            >
              View More
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd.id}
                product={relProd}
                category={category}
                subcategory={subcategories.find((s) => s.id === relProd.subcategoryId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Share Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={product.name}
        url={currentUrl}
      />

      {/* Sticky Mobile WhatsApp CTA */}
      <StickyWhatsAppCTA
        whatsappUrl={whatsappUrl}
        ctaText={whatsappButtonText}
        subtitle={product.showPrice ? formatPrice(product.sellingPrice) : 'Price on request'}
        onWhatsAppClick={handleWhatsAppClick}
      />
    </div>
  );
};
