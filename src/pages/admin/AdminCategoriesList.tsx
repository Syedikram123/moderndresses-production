import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { storageService } from '../../services/storage';
import { Category } from '../../types';
import { slugify } from '../../utils/formatters';
import { compressImage, compressImageToWebP } from '../../utils/imageCompressor';
import { supabaseMediaService } from '../../services/storage/SupabaseMediaService';

export const AdminCategoriesList: React.FC = () => {
  const { categories, subcategories, products, refreshData } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete protection modal state (Requirement #36)
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{ subCount: number; prodCount: number } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description);
    setCoverImage(c.coverImage);
    setDisplayOrder(c.displayOrder || 1);
    setIsActive(c.isActive);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const catId = editingCategory?.id || `temp_${Date.now()}`;
      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 900, 0.82);
        const url = await supabaseMediaService.uploadCategoryCover(catId, webpResult.blob);
        if (coverImage && coverImage !== url) {
          supabaseMediaService.deleteMediaByUrlOrPath(coverImage);
        }
        setCoverImage(url);
      } else {
        const res = await compressImage(file, 900, 0.8);
        setCoverImage(res.dataUrl);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingCategory) {
        await storageService.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim(),
          coverImage,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        showNotification(`Updated category "${name}"`);
      } else {
        await storageService.createCategory({
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim(),
          coverImage,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        showNotification(`Created new category "${name}"`);
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  const handleToggleActive = async (c: Category) => {
    try {
      await storageService.updateCategory(c.id, { isActive: !c.isActive });
      await refreshData();
      showNotification(`Category "${c.name}" is now ${!c.isActive ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Check dependencies before showing delete modal (Requirement #36)
  const initiateDelete = (c: Category) => {
    const subCount = subcategories.filter((s) => s.categoryId === c.id).length;
    const prodCount = products.filter((p) => p.categoryId === c.id).length;
    setDeleteCandidate(c);
    setDependencyInfo({ subCount, prodCount });
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await storageService.deleteCategory(deleteCandidate.id);
      await refreshData();
      showNotification(`Deleted category "${deleteCandidate.name}"`);
      setDeleteCandidate(null);
      setDependencyInfo(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-charcoal text-white text-xs px-4 py-3 rounded-xl shadow-elevated flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-charcoal">
            Categories Management
          </h1>
         
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Category</span>
        </button>
      </div>

      {/* Categories Grid/Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-charcoal-muted uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-4">Slug / URL</th>
                <th className="py-3.5 px-4">Subcategories</th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((cat) => {
                const subCount = subcategories.filter((s) => s.categoryId === cat.id).length;
                const prodCount = products.filter((p) => p.categoryId === cat.id).length;

                return (
                  <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={cat.coverImage}
                          alt={cat.name}
                          className="w-12 h-14 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-sm text-charcoal">{cat.name}</div>
                          <div className="text-[11px] text-charcoal-muted line-clamp-1 max-w-xs">
                            {cat.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-muted">
                      /{cat.slug}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-charcoal">
                      {subCount} subcategories
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-charcoal">
                      {prodCount} items
                    </td>

                    <td className="py-3.5 px-4 font-mono">{cat.displayOrder}</td>

                    <td className="py-3.5 px-4">
                      {cat.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                          Hidden
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          className="p-1.5 text-stone-500 hover:text-charcoal rounded hover:bg-stone-100"
                          title={cat.isActive ? 'Hide Category' : 'Activate Category'}
                        >
                          {cat.isActive ? (
                            <EyeOff className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-stone-600 hover:text-gold-700 rounded hover:bg-stone-100"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateDelete(cat)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-elevated border border-stone-200 space-y-4">
            <h2 className="font-editorial text-xl font-bold text-charcoal pb-2 border-b border-stone-100">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Category'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. BOYS or ACCESSORIES"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Slug / URL Path
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="accessories"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Description / Tagline
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Little Style. Big Dreams..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-charcoal focus:outline-none"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Cover Image URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl cursor-pointer flex items-center gap-1 font-semibold flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {coverImage && (
                  <div className="mt-2 aspect-[16/9] w-32 rounded-lg overflow-hidden border border-stone-200">
                    <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-charcoal">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-charcoal focus:ring-charcoal"
                    />
                    <span>Active on Store</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-600 hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl font-bold uppercase tracking-wider shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PROTECTION MODAL (Requirement #36) */}
      {deleteCandidate && dependencyInfo && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-stone-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-charcoal">
                Delete Category Protection
              </h3>
            </div>

            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
              <p className="font-bold">
                Warning: Category "{deleteCandidate.name}" is currently in use!
              </p>
              <p>
                This category contains <strong>{dependencyInfo.prodCount} products</strong> and{' '}
                <strong>{dependencyInfo.subCount} subcategories</strong>.
              </p>
              <p className="text-[11px] text-rose-800">
                Deleting this category will safely delete all its subcategories and product catalogue entries to prevent orphaned links.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteCandidate(null);
                  setDependencyInfo(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
