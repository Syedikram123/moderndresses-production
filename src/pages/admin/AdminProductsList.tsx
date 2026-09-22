import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { storageService } from '../../services/storage';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/Badges';

export const AdminProductsList: React.FC = () => {
  const { products, categories, subcategories, refreshData } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFeatured, setSelectedFeatured] = useState('');
  const [selectedNewArrival, setSelectedNewArrival] = useState('');

  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered subcategories for category dropdown
  const categorySubcategories = useMemo(() => {
    if (!selectedCategory) return subcategories;
    return subcategories.filter((s) => s.categoryId === selectedCategory);
  }, [selectedCategory, subcategories]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category
      if (selectedCategory && p.categoryId !== selectedCategory) return false;

      // Subcategory
      if (selectedSubcategory && p.subcategoryId !== selectedSubcategory) return false;

      // Status
      if (selectedStatus && p.status !== selectedStatus) return false;

      // Featured
      if (selectedFeatured === 'YES' && !p.isFeatured) return false;
      if (selectedFeatured === 'NO' && p.isFeatured) return false;

      // New Arrival
      if (selectedNewArrival === 'YES' && !p.isNewArrival) return false;
      if (selectedNewArrival === 'NO' && p.isNewArrival) return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedStatus,
    selectedFeatured,
    selectedNewArrival,
  ]);

  // DUPLICATE PRODUCT (Requirement #33)
  const handleDuplicate = async (p: Product) => {
    try {
      const duplicated = await storageService.duplicateProduct(p.id);
      await refreshData();
      showNotification(`Duplicated "${p.name}" as new product ${duplicated.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate product');
    }
  };

  // TOGGLE STATUS (Requirement #22)
  const handleToggleHide = async (p: Product) => {
    try {
      const newStatus = p.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
      await storageService.updateProduct(p.id, { status: newStatus });
      await refreshData();
      showNotification(`Product ${p.id} is now ${newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE CONFIRMATION
  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await storageService.deleteProduct(deleteCandidate.id);
      await refreshData();
      showNotification(`Deleted product ${deleteCandidate.name}`);
      setDeleteCandidate(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || 'Unknown';
  const getSubcategoryName = (id: string) => subcategories.find((s) => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-charcoal text-white text-xs px-4 py-3 rounded-xl shadow-elevated flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-charcoal">
            Products Management
          </h1>
        
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-charcoal pb-2 border-b border-stone-100">
          <SlidersHorizontal className="w-4 h-4 text-stone-500" />
          <span>Filter & Search Products ({filteredProducts.length} Results)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-charcoal"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('');
            }}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-charcoal focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcategory Filter */}
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-charcoal focus:outline-none"
          >
            <option value="">All Subcategories</option>
            {categorySubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-charcoal focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Marketing Filters */}
     {/*     <select
            value={selectedFeatured}
            onChange={(e) => setSelectedFeatured(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-charcoal focus:outline-none"
          >
            <option value="">Featured: All</option>
            <option value="YES">Featured Only</option>
            <option value="NO">Non-Featured</option>
          </select> */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-charcoal-muted uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-4">Category / Sub</th>
                <th className="py-3.5 px-4">Pricing</th>
                <th className="py-3.5 px-4">Colours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Flags</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const firstImg = p.colours[0]?.images[0] || '';
                  const category = categories.find((c) => c.id === p.categoryId);
                  const subcategory = subcategories.find((s) => s.id === p.subcategoryId);
                  const liveUrl = category && subcategory ? `/${category.slug}/${subcategory.slug}/${p.slug}` : '#';

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstImg}
                            alt={p.name}
                            className="w-12 h-16 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                            loading="lazy"
                          />
                          <div className="max-w-xs">
                            <div className="font-semibold text-charcoal line-clamp-1">{p.name}</div>
                            <div className="font-mono text-[10px] text-charcoal-subtle">{p.id}</div>
                            {p.brand && (
                              <div className="text-[10px] text-charcoal-muted">{p.brand}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category / Sub */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-charcoal">{getCategoryName(p.categoryId)}</div>
                        <div className="text-[11px] text-charcoal-muted">{getSubcategoryName(p.subcategoryId)}</div>
                      </td>

                      {/* Pricing & Visibility */}
                      <td className="py-3.5 px-4">
                        {p.showPrice ? (
                          <div>
                            <div className="font-bold text-charcoal">{formatPrice(p.sellingPrice)}</div>
                            {p.mrp > p.sellingPrice && (
                              <div className="text-[10px] text-charcoal-subtle line-through">
                                {formatPrice(p.mrp)}
                              </div>
                            )}
                            <span className="text-[9px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                              Price Visible
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] italic text-gold-700 font-semibold block">
                              Price Hidden
                            </span>
                            <span className="text-[9px] text-charcoal-muted">
                              {p.priceRequestText || 'On request'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Colours */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          {p.colours.map((col, idx) => (
                            <span
                              key={idx}
                              className="w-3 h-3 rounded-full border border-stone-300"
                              style={{ backgroundColor: col.hex || '#999' }}
                              title={`${col.name} (${col.images.length} photos)`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-charcoal-muted block mt-0.5">
                          {p.colours.length} {p.colours.length === 1 ? 'colour' : 'colours'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 rounded">
                              FEAT
                            </span>
                          )}
                          {p.isNewArrival && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-charcoal text-white rounded">
                              NEW
                            </span>
                          )}
                          {p.isTrending && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gold-600 text-white rounded">
                              TREND
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live preview */}
                          {p.status !== 'HIDDEN' && (
                            <Link
                              to={liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-stone-500 hover:text-charcoal rounded hover:bg-stone-100"
                              title="Preview on Store"
                              aria-label="Preview on Store"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* Toggle Hide/Show */}
                          <button
                            type="button"
                            onClick={() => handleToggleHide(p)}
                            className="p-1 text-stone-500 hover:text-charcoal rounded hover:bg-stone-100"
                            title={p.status === 'HIDDEN' ? 'Make Visible' : 'Hide from Store'}
                            aria-label={p.status === 'HIDDEN' ? 'Make Visible' : 'Hide from Store'}
                          >
                            {p.status === 'HIDDEN' ? (
                              <Eye className="w-3.5 h-3.5 text-stone-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            className="p-1 text-stone-500 hover:text-charcoal rounded hover:bg-stone-100"
                            title="Duplicate Product"
                            aria-label="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <Link
                            to={`/admin/products/edit/${p.id}`}
                            className="p-1 text-stone-600 hover:text-gold-700 rounded hover:bg-stone-100"
                            title="Edit Product"
                            aria-label="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(p)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                            title="Delete Product"
                            aria-label="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No products match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-elevated border border-stone-200 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-charcoal">
              Delete Product?
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Are you sure you want to delete <strong className="text-charcoal">{deleteCandidate.name}</strong> ({deleteCandidate.id})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
