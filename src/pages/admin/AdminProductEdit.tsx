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
import { Product, ProductColour, ProductStatus } from '../../types';
import { slugify, calculateDiscount } from '../../utils/formatters';
import { compressImage, compressImageToWebP } from '../../utils/imageCompressor';
import { supabaseMediaService } from '../../services/storage/SupabaseMediaService';

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

const STANDARD_ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const STANDARD_KIDS_SIZES = ['20', '22', '24', '26', '28', '30', '32'];

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

  // Pricing & Price Visibility Engine (Requirements #13 & #14)
  const [mrp, setMrp] = useState<number>(1999);
  const [sellingPrice, setSellingPrice] = useState<number>(1499);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [priceRequestText, setPriceRequestText] = useState('Price available on request');

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

  // Tags & Sizes
  const [tags, setTags] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');

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
          setMrp(prod.mrp || 0);
          setSellingPrice(prod.sellingPrice || 0);
          setShowPrice(prod.showPrice !== false);
          setPriceRequestText(prod.priceRequestText || 'Price available on request');
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
          setSizes(prod.sizes || []);
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

  // Size toggling
  const toggleSize = (sz: string) => {
    if (sizes.includes(sz)) {
      setSizes(sizes.filter((s) => s !== sz));
    } else {
      setSizes([...sizes, sz]);
    }
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSizeInput.trim() && !sizes.includes(customSizeInput.trim())) {
      setSizes([...sizes, customSizeInput.trim()]);
      setCustomSizeInput('');
    }
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
    if (colToRemove && supabaseMediaService.isConfigured()) {
      for (const imgUrl of colToRemove.images) {
        supabaseMediaService.deleteMediaByUrlOrPath(imgUrl);
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

  // Image Upload with Supabase Storage & WebP compression (fallback to canvas)
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

      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 900, 0.82);
        finalImageUrl = await supabaseMediaService.uploadProductImage(
          targetProductId,
          colourId,
          webpResult.blob
        );
      } else {
        const result = await compressImage(file, 900, 0.8);
        finalImageUrl = result.dataUrl;
      }

      const updatedColours = colours.map((c) => {
        if (c.id === colourId) {
          return { ...c, images: [...c.images, finalImageUrl] };
        }
        return c;
      });
      setColours(updatedColours);
    } catch (err) {
      console.error(err);
      alert('Failed to process and upload image.');
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
    if (imgUrlToRemove && supabaseMediaService.isConfigured()) {
      supabaseMediaService.deleteMediaByUrlOrPath(imgUrlToRemove);
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

    setLoading(true);
    setError(null);

    try {
      const productPayload = {
        categoryId,
        subcategoryId,
        name: name.trim(),
        slug: slugify(slug || name),
        description: description.trim(),
        shortDescription: shortDescription.trim(),
        mrp: Number(mrp) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        showPrice,
        priceRequestText: priceRequestText.trim(),
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
        sizes,
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

  const discount = calculateDiscount(mrp, sellingPrice);

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

        {/* SECTION 2: PRICING & PRICE VISIBILITY (Requirements #14, #63) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h2 className="font-editorial text-lg font-bold text-charcoal">
                Pricing & Price Visibility Controls
              </h2>
              <p className="text-xs text-charcoal-muted">
                Control whether the customer see the price of custom text
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Calculated Discount
              </label>
              <div className="w-full text-xs bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 font-bold text-emerald-800">
                {discount > 0 ? `${discount}% OFF` : 'No Discount'}
              </div>
            </div>
          </div>

          {/* Core Price Visibility Toggle */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Price Display Mode on Customer Store
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="priceVisibility"
                  checked={showPrice === true}
                  onChange={() => setShowPrice(true)}
                  className="text-charcoal focus:ring-charcoal"
                />
                <span className="font-semibold text-charcoal">Show Price (e.g. ₹{sellingPrice})</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="priceVisibility"
                  checked={showPrice === false}
                  onChange={() => setShowPrice(false)}
                  className="text-charcoal focus:ring-charcoal"
                />
                <span className="font-semibold text-gold-700">
                  Hide Price
                </span>
              </label>
            </div>

            {!showPrice && (
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Custom Contact Price Message
                </label>
                <input
                  type="text"
                  value={priceRequestText}
                  onChange={(e) => setPriceRequestText(e.target.value)}
                  placeholder="Price available on request"
                  className="w-full sm:max-w-md text-xs bg-amber-50/60 border border-amber-200 rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none"
                />
                <p className="text-[11px] text-charcoal-muted mt-1">
                  This text will replace the price in product cards and product pages.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: PRODUCT STATUS & MARKETING */}
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

        {/* SECTION 4: SIZES & TAGS (Requirements #20 & #28) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-5">
          <h2 className="font-editorial text-lg font-bold text-charcoal pb-2 border-b border-stone-100">
            Available Sizes & Tags
          </h2>

          {/* Sizes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
              Available Sizes
            </label>
            <div className="space-y-2">
              <div className="text-[11px] text-charcoal-muted">Standard Adult Sizes:</div>
              <div className="flex flex-wrap gap-2">
                {STANDARD_ADULT_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                      sizes.includes(sz)
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-stone-50 text-charcoal border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-charcoal-muted pt-1">Kids / Custom Sizes:</div>
              <div className="flex flex-wrap gap-2">
                {STANDARD_KIDS_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                      sizes.includes(sz)
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-stone-50 text-charcoal border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => toggleSize('Free Size')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                    sizes.includes('Free Size')
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-stone-50 text-charcoal border-stone-200 hover:border-stone-400'
                  }`}
                >
                  Free Size
                </button>
              </div>

                            {/* Custom Sizes */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] text-charcoal-muted">
                  Custom Sizes:
                </div>

                {/* Added custom sizes */}
                {sizes.filter(
                  (sz) =>
                    !STANDARD_ADULT_SIZES.includes(sz) &&
                    !STANDARD_KIDS_SIZES.includes(sz) &&
                    sz !== 'Free Size'
                ).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sizes
                      .filter(
                        (sz) =>
                          !STANDARD_ADULT_SIZES.includes(sz) &&
                          !STANDARD_KIDS_SIZES.includes(sz) &&
                          sz !== 'Free Size'
                      )
                      .map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                            sizes.includes(sz)
                              ? 'bg-charcoal text-white border-charcoal'
                              : 'bg-stone-50 text-charcoal border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                  </div>
                )}

                {/* Add New Custom Size */}
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    placeholder="Custom size (e.g. 34 or 2-3Y)"
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-charcoal focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-semibold uppercase flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}

          {/* Tags */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
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
          </div>
        </div>

        {/* SECTION 5: MULTI-COLOUR & PHOTOS SYSTEM (Requirements #18 & #50) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div>
              <h2 className="font-editorial text-lg font-bold text-charcoal">
                Colour Variants & Image Galleries
              </h2>
              <p className="text-xs text-charcoal-muted">
                Add colours with names, hex codes, and up to 5 photos per colour (compressed automatically)
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddColour}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Colour</span>
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
                          className="w-full h-full object-cover"
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
