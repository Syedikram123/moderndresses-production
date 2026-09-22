import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { storageService } from '../../services/storage';
import { Subcategory } from '../../types';
import { slugify } from '../../utils/formatters';
import { compressImage, compressImageToWebP } from '../../utils/imageCompressor';
import { supabaseMediaService } from '../../services/storage/SupabaseMediaService';

export const AdminSubcategoriesList: React.FC = () => {
  const { categories, subcategories, products, refreshData } = useStore();

  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState<Subcategory | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [deleteCandidate, setDeleteCandidate] = useState<Subcategory | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredSubcategories = selectedParentFilter
    ? subcategories.filter((s) => s.categoryId === selectedParentFilter)
    : subcategories;

  const handleOpenCreate = () => {
    setEditingSubcat(null);
    setCategoryId(selectedParentFilter || (categories[0]?.id || ''));
    setName('');
    setSlug('');
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80');
    setDisplayOrder(subcategories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subcategory) => {
    setEditingSubcat(s);
    setCategoryId(s.categoryId);
    setName(s.name);
    setSlug(s.slug);
    setDescription(s.description);
    setCoverImage(s.coverImage);
    setDisplayOrder(s.displayOrder || 1);
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const subId = editingSubcat?.id || `temp_${Date.now()}`;
      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 900, 0.82);
        const url = await supabaseMediaService.uploadSubcategoryCover(subId, webpResult.blob);
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
    if (!name.trim() || !categoryId) return;

    try {
      if (editingSubcat) {
        await storageService.updateSubcategory(editingSubcat.id, {
          categoryId,
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim(),
          coverImage,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        showNotification(`Updated subcategory "${name}"`);
      } else {
        await storageService.createSubcategory({
          categoryId,
          name: name.trim(),
          slug: slugify(slug || name),
          description: description.trim(),
          coverImage,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        showNotification(`Created new subcategory "${name}"`);
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save subcategory');
    }
  };

  const handleToggleActive = async (s: Subcategory) => {
    try {
      await storageService.updateSubcategory(s.id, { isActive: !s.isActive });
      await refreshData();
      showNotification(`Subcategory "${s.name}" is now ${!s.isActive ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await storageService.deleteSubcategory(deleteCandidate.id);
      await refreshData();
      showNotification(`Deleted subcategory "${deleteCandidate.name}"`);
      setDeleteCandidate(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete subcategory');
    }
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || 'Unknown';

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
            Subcategories Management
          </h1>
        
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Subcategory</span>
        </button>
      </div>

      {/* Filter by Category */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-soft flex items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-charcoal">
          Filter by Category:
        </label>
        <select
          value={selectedParentFilter}
          onChange={(e) => setSelectedParentFilter(e.target.value)}
          className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-charcoal focus:outline-none"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-charcoal-muted uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Subcategory</th>
                <th className="py-3.5 px-4">Parent Category</th>
                <th className="py-3.5 px-4">Slug / URL</th>
                <th className="py-3.5 px-4">Products</th>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSubcategories.map((sub) => {
                const prodCount = products.filter((p) => p.subcategoryId === sub.id).length;
                const parentCat = categories.find((c) => c.id === sub.categoryId);

                return (
                  <tr key={sub.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={sub.coverImage}
                          alt={sub.name}
                          className="w-10 h-12 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-sm text-charcoal">{sub.name}</div>
                          <div className="text-[11px] text-charcoal-muted line-clamp-1 max-w-xs">
                            {sub.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-charcoal bg-stone-100 px-2 py-1 rounded">
                        {getCategoryName(sub.categoryId)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-muted">
                      /{parentCat?.slug}/{sub.slug}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-charcoal">
                      {prodCount} items
                    </td>

                    <td className="py-3.5 px-4 font-mono">{sub.displayOrder}</td>

                    <td className="py-3.5 px-4">
                      {sub.isActive ? (
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
                          onClick={() => handleToggleActive(sub)}
                          className="p-1.5 text-stone-500 hover:text-charcoal rounded hover:bg-stone-100"
                          title={sub.isActive ? 'Hide Subcategory' : 'Activate Subcategory'}
                        >
                          {sub.isActive ? (
                            <EyeOff className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sub)}
                          className="p-1.5 text-stone-600 hover:text-gold-700 rounded hover:bg-stone-100"
                          title="Edit Subcategory"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(sub)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                          title="Delete Subcategory"
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
              {editingSubcat ? `Edit Subcategory: ${editingSubcat.name}` : 'New Subcategory'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Parent Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingSubcat) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Frocks or Kurti Sets"
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
                  placeholder="kurti-sets"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono text-charcoal focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Handcrafted festive and everyday styles..."
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
                  <div className="mt-2 aspect-[4/3] w-28 rounded-lg overflow-hidden border border-stone-200">
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
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-elevated border border-stone-200 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-charcoal">
              Delete Subcategory?
            </h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Are you sure you want to delete <strong className="text-charcoal">{deleteCandidate.name}</strong>? Any products inside this subcategory will also be removed.
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
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
