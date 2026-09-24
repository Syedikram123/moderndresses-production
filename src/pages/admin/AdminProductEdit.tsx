import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { storageService } from '../../services/storage';
import { Product, ProductColour, ProductStatus, ProductSizePrice } from '../../types';
import { slugify, calculateDiscount } from '../../utils/formatters';
import { getProductSizePricing } from '../../utils/productPricing';
import { compressImage, compressImageToWebP } from '../../utils/imageCompressor';
import { cloudinaryMediaService } from '../../services/storage/CloudinaryMediaService';

const PRESET_TAGS = [
  'New',
  'Trending',
  'Bestseller',
  'Party Wear',
  'Wedding',
  'Festive',
  'Casual',
  'Premium',
  'Summer',
  'Exclusive',
];

export const AdminProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { categories, subcategories, refreshData } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  // Status & Marketing
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(true);
  const [isTrending, setIsTrending] = useState<boolean>(false);

  // Specifications
  const [brand, setBrand] = useState('Modern Dresses');
  const [fabric, setFabric] = useState('');
  const [pattern, setPattern] = useState('');
  const [occasion, setOccasion] = useState('');
  const [fit, setFit] = useState('');
  const [sleeve, setSleeve] = useState('');
  const [neck, setNeck] = useState('');
  const [washCare, setWashCare] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('India');

  // Dynamic Size Pricing & Tags
  const [sizePricing, setSizePricing] = useState<ProductSizePrice[]>([]);
  const [showDiscountBadge, setShowDiscountBadge] = useState<boolean>(true);
  const [tags, setTags] = useState<string[]>([]);

  // Multi-Colour System (Requirements #18 & #50: Max 5 photos per colour)
  const [colours, setColours] = useState<ProductColour[]>([
    {
      id: `col-${Date.now()}`,
      name: 'Standard',
      hex: '#D1B490',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ]);

  // Direct URL input state per colour
  const [urlInputs, setUrlInputs] = useState<{ [colourId: string]: string }>({});

  // Populate data when editing
  useEffect(() => {
    if (isEditing && id) {
      storageService.getProductById(id).then((prod) => {
        if (prod) {
          setName(prod.name);
          setSlug(prod.slug);
          setCategoryId(prod.categoryId);
          setSubcategoryId(prod.subcategoryId);
          setShortDescription(prod.shortDescription || '');
          setDescription(prod.description || '');
          setStatus(prod.status);
          setIsFeatured(Boolean(prod.isFeatured));
          setIsNewArrival(Boolean(prod.isNewArrival));
          setIsTrending(Boolean(prod.isTrending));
          setBrand(prod.brand || '');
          setFabric(prod.fabric || '');
          setPattern(prod.pattern || '');
          setOccasion(prod.occasion || '');
          setFit(prod.fit || '');
          setSleeve(prod.sleeve || '');
          setNeck(prod.neck || '');
          setWashCare(prod.washCare || '');
          setCountryOfOrigin(prod.countryOfOrigin || 'India');
          setTags(prod.tags || []);
          setShowDiscountBadge(prod.showDiscountBadge !== false);
          setSizePricing(getProductSizePricing(prod));
          setColours(
            prod.colours?.length
              ? prod.colours
              : [
                  {
                    id: `col-${Date.now()}`,
                    name: 'Standard',
                    hex: '#ccc',
                    images: [],
                  },
                ]
          );
        }
      });
    } else if (categories.length > 0 && !categoryId) {
      // Set default category
      setCategoryId(categories[0].id);
    }
  }, [isEditing, id, categories]);

  // Filter subcategories by category
  const availableSubcategories = subcategories.filter((s) => s.categoryId === categoryId);

  // Set default subcategory when category changes
  useEffect(() => {
    if (availableSubcategories.length > 0 && (!subcategoryId || !availableSubcategories.some((s) => s.id === subcategoryId))) {
      setSubcategoryId(availableSubcategories[0].id);
    }
  }, [categoryId, availableSubcategories, subcategoryId]);

  // Auto-slugify name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  // Tag toggling
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // Dynamic Size Pricing Handlers
  const handleAddSize = () => {
    const newEntry: ProductSizePrice = {
      size: '',
      mrp: 0,
      sellingPrice: 0,
      showPrice: true,
      contactPriceMessage: 'Price available on request',
    };
    setSizePricing((prev) => [...prev, newEntry]);
  };

  const handleUpdateSize = (index: number, field: keyof ProductSizePrice, value: any) => {
    setSizePricing((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveSize = (index: number) => {
    setSizePricing((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Colour Handlers
  const handleAddColour = () => {
    const newCol: ProductColour = {
      id: `col-${Date.now()}`,
      name: `Colour ${colours.length + 1}`,
      hex: '#D97706',
      images: [],
    };
    setColours([...colours, newCol]);
  };

  const handleRemoveColour = (colourId: string) => {
    if (colours.length <= 1) {
      alert('A product must have at least 1 colour.');
      return;
    }
    const colToRemove = colours.find((c) => c.id === colourId);
    if (colToRemove && cloudinaryMediaService.isConfigured()) {
      for (const imgUrl of colToRemove.images) {
        cloudinaryMediaService.deleteMediaByUrlOrPath(imgUrl);
      }
    }
    setColours(colours.filter((c) => c.id !== colourId));
  };

  const handleColourChange = (colourId: string, field: 'name' | 'hex', value: string) => {
    setColours(
      colours.map((c) => {
        if (c.id === colourId) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  // Image Upload with Cloudinary Storage & WebP compression (fallback to canvas)
  const handleImageFileUpload = async (colourId: string, file: File) => {
    const col = colours.find((c) => c.id === colourId);
    if (!col) return;

    if (col.images.length >= 5) {
      alert('Maximum 5 images allowed per colour.');
      return;
    }

    try {
      let finalImageUrl = '';
      const targetProductId = id || `temp_${Date.now()}`;

      if (cloudinaryMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 1600, 0.92);
        finalImageUrl = await cloudinaryMediaService.uploadProductImage(
          targetProductId,
          colourId,
          webpResult.blob
        );
      } else {
        const result = await compressImage(file, 1600, 0.92);
        finalImageUrl = result.dataUrl;
      }

      const updatedColours = colours.map((c) => {
        if (c.id === colourId) {
          return { ...c, images: [...c.images, finalImageUrl] };
        }
        return c;
      });
      setColours(updatedColours);
    } catch (err: any) {
      console.error('Image upload error in AdminProductEdit:', err);
      alert(`Failed to process and upload image: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleAddImageUrl = (colourId: string) => {
    const url = (urlInputs[colourId] || '').trim();
    if (!url) return;

    const col = colours.find((c) => c.id === colourId);
    if (!col) return;

    if (col.images.length >= 5) {
      alert('Maximum 5 images allowed per colour.');
      return;
    }

    setColours(
      colours.map((c) => {
        if (c.id === colourId) {
          return { ...c, images: [...c.images, url] };
        }
        return c;
      })
    );
    setUrlInputs({ ...urlInputs, [colourId]: '' });
  };

  const handleRemoveImage = (colourId: string, imageIndex: number) => {
    const col = colours.find((c) => c.id === colourId);
    const imgUrlToRemove = col?.images[imageIndex];
    if (imgUrlToRemove && cloudinaryMediaService.isConfigured()) {
      cloudinaryMediaService.deleteMediaByUrlOrPath(imgUrlToRemove);
    }

    setColours(
      colours.map((c) => {
        if (c.id === colourId) {
          return { ...c, images: c.images.filter((_, idx) => idx !== imageIndex) };
        }
        return c;
      })
    );
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!categoryId || !subcategoryId) {
      setError('Please select category and subcategory');
      return;
    }

    // Size Validation
    for (let i = 0; i < sizePricing.length; i++) {
      const item = sizePricing[i];
      if (!item.size.trim()) {
        setError(`Size name cannot be empty (Row #${i + 1})`);
        return;
      }
      if (item.mrp < 0 || item.sellingPrice < 0) {
        setError(`MRP and Selling Price cannot be negative (Row #${i + 1}: ${item.size})`);
        return;
      }
    }

    // Check for duplicate size names
    const sizeNames = sizePricing.map((s) => s.size.trim().toLowerCase());
    const hasDuplicates = sizeNames.some((szName, idx) => sizeNames.indexOf(szName) !== idx);
    if (hasDuplicates) {
      setError('Duplicate size names are not allowed. Please ensure each size is unique.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanSizePricing: ProductSizePrice[] = sizePricing.map((sp) => ({
        size: sp.size.trim(),
        mrp: Number(sp.mrp) || 0,
        sellingPrice: Number(sp.sellingPrice) || 0,
        showPrice: Boolean(sp.showPrice),
        contactPriceMessage: (sp.contactPriceMessage || 'Price available on request').trim(),
      }));

      const derivedSizes = cleanSizePricing.map((sp) => sp.size);
      const firstVisible = cleanSizePricing.find((sp) => sp.showPrice) || cleanSizePricing[0];

      const productPayload = {
        categoryId,
        subcategoryId,
        name: name.trim(),
        slug: slugify(slug || name),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        sizePricing: cleanSizePricing,
        showDiscountBadge,
        // Legacy fallback fields for backward compatibility
        mrp: firstVisible ? firstVisible.mrp : 0,
        sellingPrice: firstVisible ? firstVisible.sellingPrice : 0,
        showPrice: cleanSizePricing.length > 0 ? cleanSizePricing.some((sp) => sp.showPrice) : true,
        priceRequestText: firstVisible?.contactPriceMessage || 'Price available on request',
        status,
        isFeatured,
        isNewArrival,
        isTrending,
        brand: brand.trim(),
        fabric: fabric.trim(),
        pattern: pattern.trim(),
        occasion: occasion.trim(),
        fit: fit.trim(),
        sleeve: sleeve.trim(),
        neck: neck.trim(),
        washCare: washCare.trim(),
        countryOfOrigin: countryOfOrigin.trim(),
        tags,
        sizes: derivedSizes,
        colours,
      };

      if (isEditing && id) {
        await storageService.updateProduct(id, productPayload);
      } else {
        await storageService.createProduct(productPayload);
      }

      await refreshData();
      navigate('/admin/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 bg-white rounded-xl border border-stone-200 text-charcoal hover:bg-stone-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-charcoal">
              {isEditing ? `Edit Product: ${name || id}` : 'Create New Product'}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Product'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <h2 className="font-editorial text-lg font-bold text-charcoal pb-2 border-b border-stone-100">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Pink Embroidered Party Frock"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Product URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="pink-embroidered-party-frock"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 font-mono text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Modern Dresses"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Subcategory *
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              >
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Short Description (Card Summary)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief 1-line highlights of the garment..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Full Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of craftsmanship, fabric, occasions, and lining..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl p-3 text-charcoal focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PRODUCT STATUS & MARKETING */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <h2 className="font-editorial text-lg font-bold text-charcoal pb-2 border-b border-stone-100">
            Status & Marketing Badges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Visible on Store)</option>
                <option value="OUT_OF_STOCK">OUT OF STOCK (Visible with Sold Out Badge)</option>
                <option value="DRAFT">DRAFT (Hidden from Store)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="rounded text-charcoal focus:ring-charcoal w-4 h-4"
                />
                <span>New Arrival</span>
              </label>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="rounded text-charcoal focus:ring-charcoal w-4 h-4"
                />
                <span>Trending Now</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: AVAILABLE SIZES, PRICING & TAGS */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-editorial text-lg font-bold text-charcoal">
                Sizes, Pricing & Discount
              </h2>
             
            </div>

            <button
              type="button"
              onClick={handleAddSize}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Size</span>
            </button>
          </div>

          {/* Product-level Discount Badge Toggle */}
          <div className="flex items-center gap-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
            <input
              type="checkbox"
              id="showDiscountBadge"
              checked={showDiscountBadge}
              onChange={(e) => setShowDiscountBadge(e.target.checked)}
              className="rounded text-charcoal focus:ring-charcoal w-4 h-4"
            />
            <label htmlFor="showDiscountBadge" className="text-xs font-semibold text-charcoal cursor-pointer">
              Show discount percentage on store
              
            </label>
          </div>

          {/* Size Pricing Rows */}
          <div className="space-y-3">
            {sizePricing.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="text-xs font-medium text-stone-600 mb-2">No sizes added for this product yet.</p>
                <p className="text-[11px] text-stone-400 mb-4">Click below to add sizes (e.g. S, M, L, XL, Free Size, 32, 2-3Y) with specific pricing.</p>
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sizePricing.map((item, index) => {
                  const sizeDiscount = item.mrp > item.sellingPrice && item.mrp > 0
                    ? calculateDiscount(item.mrp, item.sellingPrice)
                    : 0;

                  return (
                    <div
                      key={index}
                      className="p-4 bg-stone-50/70 hover:bg-stone-50 border border-stone-200 rounded-2xl transition-all space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                        {/* Size Name */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1">
                            Size *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.size}
                            onChange={(e) => handleUpdateSize(index, 'size', e.target.value)}
                            placeholder="e.g. S, M, XL, Free Size, 34"
                            className="w-full text-xs font-medium bg-white border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
                          />
                        </div>

                        {/* MRP */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1">
                            MRP (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.mrp || ''}
                            onChange={(e) => handleUpdateSize(index, 'mrp', Number(e.target.value))}
                            placeholder="0"
                            className="w-full text-xs bg-white border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
                          />
                        </div>

                        {/* Selling Price */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1">
                            Selling Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.sellingPrice || ''}
                            onChange={(e) => handleUpdateSize(index, 'sellingPrice', Number(e.target.value))}
                            placeholder="0"
                            className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
                          />
                        </div>

                        {/* Discount Display */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1">
                            Discount
                          </label>
                          <div className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 font-bold text-center">
                            {item.showPrice && sizeDiscount > 0 ? (
                              <span className="text-emerald-700">{sizeDiscount}% OFF</span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </div>
                        </div>

                        {/* Price Visibility Controls */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1">
                            Price Visibility
                          </label>
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateSize(index, 'showPrice', true)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                item.showPrice
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              Show
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSize(index, 'showPrice', false)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                !item.showPrice
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              Hide
                            </button>
                          </div>
                        </div>

                        {/* Delete Row */}
                        <div className="sm:col-span-1 flex sm:justify-center sm:pt-6">
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(index)}
                            title="Remove Size"
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Custom Contact Price Message (if price is hidden) */}
                      {!item.showPrice && (
                        <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex-shrink-0">
                            Custom Price Message:
                          </label>
                          <input
                            type="text"
                            value={item.contactPriceMessage || ''}
                            onChange={(e) => handleUpdateSize(index, 'contactPriceMessage', e.target.value)}
                            placeholder="Price available on request"
                            className="flex-1 text-xs bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-1.5 text-charcoal focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Marketing Tags */}
        {/*}  <div className="space-y-2 pt-4 border-t border-stone-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Marketing Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-gold-600 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div> */}
        </div>   

        {/* SECTION 5: MULTI-COLOUR & PHOTOS SYSTEM (Requirements #18 & #50) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h2 className="font-editorial text-lg font-bold text-charcoal">
                Colour Variants & Image Galleries
              </h2>
              
            </div>

            <button
              type="button"
              onClick={handleAddColour}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Colour</span>
            </button>
          </div>

          <div className="space-y-6">
            {colours.map((col, cIdx) => {
              const remainingPhotos = 5 - col.images.length;
              return (
                <div
                  key={col.id}
                  className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4"
                >
                  {/* Colour Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-stone-300 flex-shrink-0" style={{ backgroundColor: col.hex || '#ccc' }} />
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => handleColourChange(col.id, 'name', e.target.value)}
                        placeholder="Colour Name (e.g. Pink)"
                        className="text-xs font-bold bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-charcoal"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-charcoal-muted uppercase">Hex:</span>
                        <input
                          type="color"
                          value={col.hex || '#ffffff'}
                          onChange={(e) => handleColourChange(col.id, 'hex', e.target.value)}
                          className="w-7 h-7 p-0 border border-stone-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal-muted">
                        {col.images.length}/5 Photos
                      </span>
                      {colours.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColour(col.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Colour"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Photos Grid for this Colour */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                    {col.images.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative aspect-[3/4] rounded-xl overflow-hidden border border-stone-200 bg-white group shadow-xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`${col.name} photo ${imgIdx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(col.id, imgIdx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-charcoal/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono">
                          #{imgIdx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Upload / Add Photo Box */}
                    {remainingPhotos > 0 && (
                      <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 bg-white hover:border-stone-400 p-3 flex flex-col items-center justify-center text-center space-y-2">
                        <Upload className="w-5 h-5 text-stone-400" />
                        <label className="cursor-pointer text-[11px] font-semibold text-charcoal hover:underline">
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFileUpload(col.id, file);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-stone-400">
                          {remainingPhotos} left (max 5)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add via direct URL if preferred */}
                  {remainingPhotos > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="url"
                        value={urlInputs[col.id] || ''}
                        onChange={(e) =>
                          setUrlInputs({ ...urlInputs, [col.id]: e.target.value })
                        }
                        placeholder="Or paste an image URL (https://...)"
                        className="w-full sm:max-w-md text-xs bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-charcoal focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddImageUrl(col.id)}
                        className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-charcoal rounded-lg text-xs font-semibold"
                      >
                        Add URL
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: SPECIFICATIONS */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <h2 className="font-editorial text-lg font-bold text-charcoal pb-2 border-b border-stone-100">
            Product Specifications (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Fabric
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Pure Cotton / Chanderi Silk"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Pattern / Work
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. Floral Embroidered / Zari"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Occasion
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Wedding & Festive / Party"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Fit
              </label>
              <input
                type="text"
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                placeholder="e.g. Regular Flared / Slim Fit"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Sleeve
              </label>
              <input
                type="text"
                value={sleeve}
                onChange={(e) => setSleeve(e.target.value)}
                placeholder="e.g. 3/4th Sleeves / Sleeveless"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Neck Style
              </label>
              <input
                type="text"
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
                placeholder="e.g. Mandarin Collar / Round"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Wash Care
              </label>
              <input
                type="text"
                value={washCare}
                onChange={(e) => setWashCare(e.target.value)}
                placeholder="e.g. Dry clean only"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Country of Origin
              </label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                placeholder="India"
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            to="/admin/products"
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-charcoal"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
