export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'DRAFT' | 'HIDDEN';

export interface ProductColour {
  id: string;
  name: string;
  hex?: string;
  images: string[]; // max 5 images
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string; // e.g. MD-GIRLS-FROCK-0012
  categoryId: string;
  subcategoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;

  // Pricing
  mrp: number;
  sellingPrice: number;
  showPrice: boolean;
  priceRequestText?: string; // e.g. "Price available on request"

  // Status & Flags
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  isTrending: boolean;

  // Specifications
  brand?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  fit?: string;
  sleeve?: string;
  neck?: string;
  washCare?: string;
  countryOfOrigin?: string;

  tags: string[];
  sizes: string[];
  colours: ProductColour[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;

  createdAt: string;
  updatedAt: string;
}

export interface HomepageSettings {
  sections: {
    hero: boolean;
    categories: boolean;
    featured: boolean;
    newArrivals: boolean;
    trending: boolean;
    promoBanner: boolean;
    whyUs: boolean;
    customSection: boolean;
  };
  sectionOrder: string[];
  hero: {
    title: string;
    subtitle: string;
    description: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
    image: string;
  };
  promoBanner: {
    badge: string;
    heading: string;
    description: string;
    btnText: string;
    btnLink: string;
    image: string;
  };
  customSection: {
    badge: string;
    heading: string;
    description: string;
    image: string;
    btnText: string;
    btnLink: string;
  };
  visibleCategoryIds: string[];
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  location: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  businessHours: string;
  instagram: string;
  facebook: string;
  footerText: string;
  aboutStory: string;
  aboutHighlights: string[];

  // WhatsApp Behaviour
  whatsappCtaText: string;
  whatsappPriceHiddenCtaText: string;
  whatsappOutOfStockCtaText: string;
  normalEnquiryTemplate: string;
  priceEnquiryTemplate: string;

  // Product visibility config
  showOutOfStockProducts: boolean;
  allowOutOfStockOrdering: boolean;
  hiddenProductsReturn404: boolean;
}

export interface StorageDataBackup {
  version: string;
  timestamp: string;
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  homepageSettings: HomepageSettings;
  storeSettings: StoreSettings;
}

export interface WhatsAppClickEvent {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  timestamp: string; // ISO 8601 string
}
