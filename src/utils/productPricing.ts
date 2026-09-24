import { Product, ProductSizePrice } from '../types';
import { formatPrice, calculateDiscount } from './formatters';

export const DEFAULT_CONTACT_PRICE_MESSAGE = 'Price available on request';

/**
 * Extracts and normalizes size pricing array from a product.
 * Provides complete backward compatibility with legacy products that only have
 * global mrp, sellingPrice, showPrice, and sizes.
 */
export function getProductSizePricing(product?: Product | null): ProductSizePrice[] {
  if (!product) return [];

  if (product.sizePricing && Array.isArray(product.sizePricing) && product.sizePricing.length > 0) {
    return product.sizePricing.map((sp) => ({
      size: (sp.size || '').trim(),
      mrp: Number(sp.mrp) || 0,
      sellingPrice: Number(sp.sellingPrice) || 0,
      showPrice: sp.showPrice !== false,
      contactPriceMessage: (sp.contactPriceMessage || DEFAULT_CONTACT_PRICE_MESSAGE).trim(),
    }));
  }

  // Legacy fallback: Derive from legacy product fields
  const legacyShowPrice = product.showPrice !== false;
  const legacyMrp = Number(product.mrp) || 0;
  const legacySellingPrice = Number(product.sellingPrice) || 0;
  const legacyMessage = product.priceRequestText || DEFAULT_CONTACT_PRICE_MESSAGE;

  if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes.map((sz) => ({
      size: sz.trim(),
      mrp: legacyMrp,
      sellingPrice: legacySellingPrice,
      showPrice: legacyShowPrice,
      contactPriceMessage: legacyMessage,
    }));
  }

  // Default single item fallback if no sizes were specified
  return [
    {
      size: 'Standard',
      mrp: legacyMrp,
      sellingPrice: legacySellingPrice,
      showPrice: legacyShowPrice,
      contactPriceMessage: legacyMessage,
    },
  ];
}

export interface PriceDisplayResult {
  hasVisiblePrice: boolean;
  isRange: boolean;
  sellingPrice: number | null;
  mrp: number | null;
  discount: number;
  displayPriceText: string;
  contactPriceMessage: string;
  matchedSizePricing: ProductSizePrice | null;
}

/**
 * Computes price display information for a product.
 * When selectedSize is passed (e.g. on Product Detail Page), it evaluates that exact size.
 * When no selectedSize is passed (e.g. on Product Card, Search Modal), it evaluates all sizes.
 *
 * CRITICAL SECURITY & BUSINESS LOGIC:
 * Never exposes hidden prices in the returned display values or DOM.
 */
export function getProductPriceDisplay(product?: Product | null, selectedSize?: string): PriceDisplayResult {
  if (!product) {
    return {
      hasVisiblePrice: false,
      isRange: false,
      sellingPrice: null,
      mrp: null,
      discount: 0,
      displayPriceText: '',
      contactPriceMessage: '',
      matchedSizePricing: null,
    };
  }

  const sizePricing = getProductSizePricing(product);
  const showDiscountBadge = product.showDiscountBadge !== false;

  // Case 1: A specific size is selected (Product Detail Page)
  if (selectedSize) {
    const matched = sizePricing.find((sp) => sp.size.toLowerCase() === selectedSize.trim().toLowerCase()) || sizePricing[0];
    if (matched) {
      if (matched.showPrice) {
        const discount = showDiscountBadge ? calculateDiscount(matched.mrp, matched.sellingPrice) : 0;
        return {
          hasVisiblePrice: true,
          isRange: false,
          sellingPrice: matched.sellingPrice,
          mrp: matched.mrp > matched.sellingPrice ? matched.mrp : null,
          discount,
          displayPriceText: formatPrice(matched.sellingPrice),
          contactPriceMessage: matched.contactPriceMessage || DEFAULT_CONTACT_PRICE_MESSAGE,
          matchedSizePricing: matched,
        };
      }

      // Hidden price for selected size
      return {
        hasVisiblePrice: false,
        isRange: false,
        sellingPrice: null,
        mrp: null,
        discount: 0,
        displayPriceText: matched.contactPriceMessage || DEFAULT_CONTACT_PRICE_MESSAGE,
        contactPriceMessage: matched.contactPriceMessage || DEFAULT_CONTACT_PRICE_MESSAGE,
        matchedSizePricing: matched,
      };
    }
  }

  // Case 2: General product card / listing display (no size selected)
  const visibleEntries = sizePricing.filter((sp) => sp.showPrice && sp.sellingPrice > 0);

  if (visibleEntries.length > 0) {
    const prices = visibleEntries.map((sp) => sp.sellingPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const isRange = minPrice !== maxPrice;

    // Find the entry with min price for representative MRP / discount
    const minEntry = visibleEntries.find((sp) => sp.sellingPrice === minPrice) || visibleEntries[0];
    const discount = showDiscountBadge ? calculateDiscount(minEntry.mrp, minEntry.sellingPrice) : 0;

    return {
      hasVisiblePrice: true,
      isRange,
      sellingPrice: minPrice,
      mrp: minEntry.mrp > minEntry.sellingPrice ? minEntry.mrp : null,
      discount,
      displayPriceText: isRange ? `From ${formatPrice(minPrice)}` : formatPrice(minPrice),
      contactPriceMessage: minEntry.contactPriceMessage || DEFAULT_CONTACT_PRICE_MESSAGE,
      matchedSizePricing: minEntry,
    };
  }

  // All sizes are hidden (or no visible pricing)
  const firstMessage = sizePricing[0]?.contactPriceMessage || product.priceRequestText || DEFAULT_CONTACT_PRICE_MESSAGE;
  return {
    hasVisiblePrice: false,
    isRange: false,
    sellingPrice: null,
    mrp: null,
    discount: 0,
    displayPriceText: firstMessage,
    contactPriceMessage: firstMessage,
    matchedSizePricing: sizePricing[0] || null,
  };
}

/**
 * Returns the effective minimum selling price for sorting and filtering.
 */
export function getProductFilterPrice(product: Product): number | null {
  const display = getProductPriceDisplay(product);
  return display.hasVisiblePrice ? display.sellingPrice : null;
}
