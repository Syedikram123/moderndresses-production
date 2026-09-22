import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Upload, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { storageService } from '../../services/storage';
import { HomepageSettings } from '../../types';
import { compressImage, compressImageToWebP } from '../../utils/imageCompressor';
import { supabaseMediaService } from '../../services/storage/SupabaseMediaService';

export const AdminHomepageCMS: React.FC = () => {
  const { homepageSettings, categories, refreshSettings } = useStore();

  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (homepageSettings) {
      setSettings(JSON.parse(JSON.stringify(homepageSettings)));
    }
  }, [homepageSettings]);

  if (!settings) {
    return <div className="p-8 text-center text-xs text-charcoal-muted">Loading CMS settings...</div>;
  }

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleSection = (key: keyof HomepageSettings['sections']) => {
    setSettings({
      ...settings,
      sections: {
        ...settings.sections,
        [key]: !settings.sections[key],
      },
    });
  };

  const handleHeroImageUpload = async (file: File) => {
    try {
      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 1200, 0.82);
        const url = await supabaseMediaService.uploadBanner('hero', webpResult.blob);
        if (settings.hero.image && settings.hero.image !== url) {
          supabaseMediaService.deleteMediaByUrlOrPath(settings.hero.image);
        }
        setSettings({
          ...settings,
          hero: { ...settings.hero, image: url },
        });
      } else {
        const res = await compressImage(file, 1200, 0.82);
        setSettings({
          ...settings,
          hero: { ...settings.hero, image: res.dataUrl },
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload hero image.');
    }
  };

  const handlePromoImageUpload = async (file: File) => {
    try {
      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 1200, 0.82);
        const url = await supabaseMediaService.uploadBanner('promo', webpResult.blob);
        if (settings.promoBanner.image && settings.promoBanner.image !== url) {
          supabaseMediaService.deleteMediaByUrlOrPath(settings.promoBanner.image);
        }
        setSettings({
          ...settings,
          promoBanner: { ...settings.promoBanner, image: url },
        });
      } else {
        const res = await compressImage(file, 1200, 0.82);
        setSettings({
          ...settings,
          promoBanner: { ...settings.promoBanner, image: res.dataUrl },
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload promo image.');
    }
  };

  const handleCustomImageUpload = async (file: File) => {
    try {
      if (supabaseMediaService.isConfigured()) {
        const webpResult = await compressImageToWebP(file, 1000, 0.82);
        const url = await supabaseMediaService.uploadBanner('custom', webpResult.blob);
        if (settings.customSection.image && settings.customSection.image !== url) {
          supabaseMediaService.deleteMediaByUrlOrPath(settings.customSection.image);
        }
        setSettings({
          ...settings,
          customSection: { ...settings.customSection, image: url },
        });
      } else {
        const res = await compressImage(file, 1000, 0.82);
        setSettings({
          ...settings,
          customSection: { ...settings.customSection, image: res.dataUrl },
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload custom section image.');
    }
  };

  const toggleCategoryVisibility = (catId: string) => {
    const list = settings.visibleCategoryIds || [];
    if (list.includes(catId)) {
      setSettings({
        ...settings,
        visibleCategoryIds: list.filter((id: string) => id !== catId),
      });
    } else {
      setSettings({
        ...settings,
        visibleCategoryIds: [...list, catId],
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storageService.updateHomepageSettings(settings);
      await refreshSettings();
      showNotification('Homepage settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update homepage settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
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
            Homepage Controls
          </h1>
          
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: MASTER SECTION ON/OFF TOGGLES (Requirement #8 & #77) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="pb-2 border-b border-stone-100">
            <h2 className="font-editorial text-lg font-bold text-charcoal">
              Homepage Sections Control
            </h2>
            <p className="text-xs text-charcoal-muted">
              Click any section ON or OFF. Disabled sections disappear immediately from the customer website.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
         //     { key: 'hero' as const, label: 'Hero Banner', desc: 'Main headline & hero photo' },
              { key: 'categories' as const, label: 'Categories', desc: 'All Category Cards' },
              { key: 'newArrivals' as const, label: 'New Arrivals', desc: 'New Arivals Grid' },
              { key: 'trending' as const, label: 'Trending Products', desc: 'Popular customer picks' },
              { key: 'promoBanner' as const, label: 'Promotional Banner', desc: 'Festive / Seasonal Picks' },
              { key: 'customSection' as const, label: 'Promotional Banner 2', desc: 'Promotional story section' },
         //     { key: 'whyUs' as const, label: 'Why Shop With Us', desc: 'Modern Dresses detailed Section' },

            ].map((sec) => {
              const isEnabled = settings.sections[sec.key];
              return (
                <div
                  key={sec.key}
                  onClick={() => handleToggleSection(sec.key)}
                  className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                    isEnabled
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider">{sec.label}</span>
                    {isEnabled ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3">{sec.desc}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: HERO SECTION CONTENT (Requirement #9) */}
       {/*  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="pb-2 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-editorial text-lg font-bold text-charcoal">
              Hero Banner Settings
            </h2>
            <span className="text-xs font-semibold text-charcoal-muted">
              Status: {settings.sections.hero ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Hero Title
              </label>
              <input
                type="text"
                value={settings.hero.title}
                onChange={(e) =>
                  setSettings({ ...settings, hero: { ...settings.hero, title: e.target.value } })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={settings.hero.subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, hero: { ...settings.hero, subtitle: e.target.value } })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={settings.hero.description}
                onChange={(e) =>
                  setSettings({ ...settings, hero: { ...settings.hero, description: e.target.value } })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-charcoal focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Primary Button Text & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.hero.primaryBtnText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, primaryBtnText: e.target.value },
                    })
                  }
                  placeholder="SHOP COLLECTION"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <input
                  type="text"
                  value={settings.hero.primaryBtnLink}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, primaryBtnLink: e.target.value },
                    })
                  }
                  placeholder="/women"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Secondary Button Text & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.hero.secondaryBtnText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, secondaryBtnText: e.target.value },
                    })
                  }
                  placeholder="EXPLORE NOW"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <input
                  type="text"
                  value={settings.hero.secondaryBtnLink}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, secondaryBtnLink: e.target.value },
                    })
                  }
                  placeholder="/girls"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Hero Image URL or Upload
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={settings.hero.image}
                  onChange={(e) =>
                    setSettings({ ...settings, hero: { ...settings.hero, image: e.target.value } })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl cursor-pointer flex items-center gap-1 font-semibold flex-shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleHeroImageUpload(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>  */}

        {/* SECTION 3: WHICH CATEGORIES APPEAR ON HOMEPAGE */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="pb-2 border-b border-stone-100">
            <h2 className="font-editorial text-lg font-bold text-charcoal">
              Categories Settings
            </h2>
            <p className="text-xs text-charcoal-muted">

            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const isSelected = settings.visibleCategoryIds?.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategoryVisibility(cat.id)}
                  className={`p-3 rounded-2xl border cursor-pointer select-none transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <img
                    src={cat.coverImage}
                    alt={cat.name}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                  <div>
                    <div className="text-xs">{cat.name}</div>
                    <span className="text-[10px] text-stone-400">
                      {isSelected ? '✓ Shown on Home' : 'Hidden from Home'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: PROMOTIONAL BANNER CONTENT */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="pb-2 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-editorial text-lg font-bold text-charcoal">
              Promotional Banner Settings
            </h2>
            <span className="text-xs font-semibold text-charcoal-muted">
              Status: {settings.sections.promoBanner ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Badge
              </label>
              <input
                type="text"
                value={settings.promoBanner.badge}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoBanner: { ...settings.promoBanner, badge: e.target.value },
                  })
                }
                placeholder="FESTIVE EDIT 2025"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Heading
              </label>
              <input
                type="text"
                value={settings.promoBanner.heading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoBanner: { ...settings.promoBanner, heading: e.target.value },
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={settings.promoBanner.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    promoBanner: { ...settings.promoBanner, description: e.target.value },
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Button Text & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.promoBanner.btnText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      promoBanner: { ...settings.promoBanner, btnText: e.target.value },
                    })
                  }
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <input
                  type="text"
                  value={settings.promoBanner.btnLink}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      promoBanner: { ...settings.promoBanner, btnLink: e.target.value },
                    })
                  }
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Banner Image
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={settings.promoBanner.image}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      promoBanner: { ...settings.promoBanner, image: e.target.value },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl cursor-pointer flex items-center gap-1 font-semibold flex-shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePromoImageUpload(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: CUSTOM HOMEPAGE SECTION (Requirement #38) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
          <div className="pb-2 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-editorial text-lg font-bold text-charcoal">
              Promotional Banner 2 Settings
            </h2>
            <span className="text-xs font-semibold text-charcoal-muted">
              Status: {settings.sections.customSection ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Badge
              </label>
              <input
                type="text"
                value={settings.customSection.badge}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customSection: { ...settings.customSection, badge: e.target.value },
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Heading
              </label>
              <input
                type="text"
                value={settings.customSection.heading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customSection: { ...settings.customSection, heading: e.target.value },
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={settings.customSection.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customSection: { ...settings.customSection, description: e.target.value },
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Button Text & Link
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={settings.customSection.btnText}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      customSection: { ...settings.customSection, btnText: e.target.value },
                    })
                  }
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <input
                  type="text"
                  value={settings.customSection.btnLink}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      customSection: { ...settings.customSection, btnLink: e.target.value },
                    })
                  }
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-charcoal mb-1">
                Image
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={settings.customSection.image}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      customSection: { ...settings.customSection, image: e.target.value },
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-charcoal rounded-xl cursor-pointer flex items-center gap-1 font-semibold flex-shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCustomImageUpload(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow"
          >
            {saving ? 'Saving...' : 'Save All Homepage Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
