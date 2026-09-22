import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FolderTree,
  Tags,
  Sparkles,
  AlertCircle,
  Plus,
  ArrowRight,
  Sliders,
  HardDrive,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatters';
import { StatusBadge } from '../../components/common/Badges';
import { getTodayWhatsAppClicksCount } from '../../utils/whatsappAnalytics';

export const AdminDashboard: React.FC = () => {
  const { products, categories, subcategories, storageMetrics } = useStore();

  const [todayClicks, setTodayClicks] = React.useState(0);

  React.useEffect(() => {
    setTodayClicks(getTodayWhatsAppClicksCount());
  }, []);

  const totalProducts = products.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const activeSubcats = subcategories.filter((s) => s.isActive).length;
  const featuredProducts = products.filter((p) => p.isFeatured).length;
  const newArrivals = products.filter((p) => p.isNewArrival).length;
  const outOfStock = products.filter((p) => p.status === 'OUT_OF_STOCK').length;

  const recentProducts = [...products].slice(0, 5);

  const stats = [
    { title: 'Total Products', count: totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/products' },
    { title: 'Categories', count: activeCategories, icon: FolderTree, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/categories' },
    { title: 'Subcategories', count: activeSubcats, icon: Tags, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/admin/subcategories' },
    { title: 'WHATSAPP CLICKS', count: todayClicks, icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/whatsapp-clicks' },
    { title: 'New Arrivals', count: newArrivals, icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/products' },
    { title: 'Out of Stock', count: outOfStock, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/admin/products' },
  ];

  return (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-bold text-charcoal">
            Admin Dashboard
          </h1>
         
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.link}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-editorial text-3xl font-bold text-charcoal">
                {stat.count}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Storage & Local Architecture Info Card (Requirements #47, #51, #70) */}
     {/* <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-boutique-100 flex items-center justify-center text-charcoal">
              <HardDrive className="w-5 h-5 text-gold-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal">Local Prototype Storage Service</h3>
              <p className="text-xs text-charcoal-muted">
                Running clean abstraction layer ready for future Supabase migration without altering UI components
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-charcoal">{storageMetrics.usedFormatted} used</span>
            <span className="text-xs text-charcoal-subtle block">Estimated quota: ~5 MB</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 text-charcoal-muted">
            <span>✅ Automatic client-side canvas compression for uploaded images</span>
            <span>✅ Complete JSON export / import available in Settings</span>
          </div>
          <Link to="/admin/settings" className="font-semibold text-gold-700 hover:underline">
            Manage Backups & Reset →
          </Link>
        </div>
      </div>  */}

      {/* Recent Products Table */}
     {/* <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl font-bold text-charcoal">Recent Products</h2>
            <p className="text-xs text-charcoal-muted mt-0.5">Recently created or updated clothing catalogue items</p>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-semibold text-charcoal hover:text-gold-700 flex items-center gap-1"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-charcoal-muted uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Badges</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentProducts.map((p) => {
                const img = p.colours[0]?.images[0] || '';
                return (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-charcoal">{p.name}</div>
                          <div className="text-[11px] text-charcoal-muted">{p.brand || 'Modern Dresses'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal-muted">{p.id}</td>
                    <td className="py-3.5 px-4">
                      {p.showPrice ? (
                        <div className="font-medium text-charcoal">{formatPrice(p.sellingPrice)}</div>
                      ) : (
                        <span className="text-[11px] italic text-gold-700">Price on Request</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1">
                        {p.isFeatured && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded font-semibold">
                            F
                          </span>
                        )}
                        {p.isNewArrival && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-charcoal text-white rounded font-semibold">
                            N
                          </span>
                        )}
                        {p.isTrending && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-gold-600 text-white rounded font-semibold">
                            T
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/admin/products/edit/${p.id}`}
                        className="text-xs font-semibold text-charcoal hover:text-gold-700 underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>   */}
    </div>
  );
};
