import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageCircle,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  getWhatsAppClicks,
  syncWhatsAppClicksFromFirestore,
  formatClickDate,
  isTimestampInDateRange,
  DateFilterOption,
  WhatsAppClickEvent,
} from '../../utils/whatsappAnalytics';

interface AggregatedProductRow {
  productId: string;
  productName: string;
  categoryName: string;
  subcategoryName: string;
  clicksCount: number;
  lastClickTimestamp: string;
}

export const AdminWhatsAppClicks: React.FC = () => {
  const { categories, subcategories, products } = useStore();

  const [allClicks, setAllClicks] = useState<WhatsAppClickEvent[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [customDate, setCustomDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Load clicks from LocalStorage on mount and listen to storage events, plus sync from Firestore
  useEffect(() => {
    const load = () => {
      setAllClicks(getWhatsAppClicks());
    };
    load();

    syncWhatsAppClicksFromFirestore().then((clicks) => {
      if (clicks && clicks.length > 0) {
        setAllClicks(clicks);
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'modern_dresses_whatsapp_clicks') {
        load();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Summary Metrics (always calculated across the entire dataset)
  const summaryMetrics = useMemo(() => {
    let today = 0;
    let yesterday = 0;
    let last7Days = 0;
    let thisMonth = 0;
    const total = allClicks.length;

    for (const click of allClicks) {
      if (isTimestampInDateRange(click.timestamp, 'today')) today++;
      if (isTimestampInDateRange(click.timestamp, 'yesterday')) yesterday++;
      if (isTimestampInDateRange(click.timestamp, 'last7days')) last7Days++;
      if (isTimestampInDateRange(click.timestamp, 'thismonth')) thisMonth++;
    }

    return { today, yesterday, last7Days, thisMonth, total };
  }, [allClicks]);

  // Dynamically filtered subcategories based on category selection
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return subcategories;
    return subcategories.filter((s) => s.categoryId === selectedCategory);
  }, [subcategories, selectedCategory]);

  // Dynamically filtered products based on category/subcategory selection
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && p.subcategoryId !== selectedSubcategory) return false;
      return true;
    });
  }, [products, selectedCategory, selectedSubcategory]);

  // Filter click events based on all active filter criteria
  const filteredClicks = useMemo(() => {
    return allClicks.filter((click) => {
      // Date filter
      if (!isTimestampInDateRange(click.timestamp, dateFilter, customDate)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && click.categoryId !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'all' && click.subcategoryId !== selectedSubcategory) {
        return false;
      }
      // Product filter
      if (selectedProduct !== 'all' && click.productId !== selectedProduct) {
        return false;
      }
      return true;
    });
  }, [allClicks, dateFilter, customDate, selectedCategory, selectedSubcategory, selectedProduct]);

  // Aggregate filtered clicks by Product
  const aggregatedRows = useMemo<AggregatedProductRow[]>(() => {
    const map = new Map<string, AggregatedProductRow>();

    for (const click of filteredClicks) {
      const pid = click.productId;
      const existing = map.get(pid);

      if (!existing) {
        map.set(pid, {
          productId: pid,
          productName: click.productName,
          categoryName: click.categoryName || 'Unknown',
          subcategoryName: click.subcategoryName || 'General',
          clicksCount: 1,
          lastClickTimestamp: click.timestamp,
        });
      } else {
        existing.clicksCount += 1;
        if (new Date(click.timestamp) > new Date(existing.lastClickTimestamp)) {
          existing.lastClickTimestamp = click.timestamp;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.clicksCount - a.clicksCount);
  }, [filteredClicks]);

  // Top Products for the currently selected filter range (Top 5)
  const topProducts = useMemo(() => {
    return aggregatedRows.slice(0, 5);
  }, [aggregatedRows]);

  // Reset all filters back to default
  const handleResetFilters = () => {
    setDateFilter('today');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedProduct('all');
  };

  const isFiltered =
    dateFilter !== 'today' ||
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    selectedProduct !== 'all';

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="font-editorial text-3xl font-bold text-charcoal">
          WhatsApp Clicks
        </h1>
        
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* TODAY */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
              TODAY
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-emerald-700">
            {summaryMetrics.today}
          </div>
        </div>

        {/* YESTERDAY */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
              YESTERDAY
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-charcoal">
            {summaryMetrics.yesterday}
          </div>
        </div>

        {/* LAST 7 DAYS */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
              LAST 7 DAYS
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-charcoal">
            {summaryMetrics.last7Days}
          </div>
        </div>

        {/* THIS MONTH */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
              THIS MONTH
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-charcoal">
            {summaryMetrics.thisMonth}
          </div>
        </div>

        {/* TOTAL CLICKS */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-soft flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
              TOTAL CLICKS
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-charcoal">
            {summaryMetrics.total}
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold-700" />
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
              Filter Analytics
            </h2>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Date Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-charcoal-muted uppercase tracking-wider text-[11px]">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-all"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thismonth">This Month</option>
              <option value="custom">Custom Date</option>
            </select>
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full mt-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-charcoal text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/30"
              />
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-charcoal-muted uppercase tracking-wider text-[11px]">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all');
                setSelectedProduct('all');
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-charcoal-muted uppercase tracking-wider text-[11px]">
              Subcategory
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setSelectedProduct('all');
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-all"
            >
              <option value="all">All Subcategories</option>
              {availableSubcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="space-y-1.5">
            <label className="font-semibold text-charcoal-muted uppercase tracking-wider text-[11px]">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-all truncate"
            >
              <option value="all">All Products</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top Products Section */}
     {/* <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
              TOP PRODUCTS
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted">
            {aggregatedRows.length} {aggregatedRows.length === 1 ? 'product' : 'products'} clicked
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-charcoal-muted text-xs">
            No clicks recorded for the selected filter range.
          </div>
        ) : (
          <div className="space-y-2.5">
            {topProducts.map((item, index) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-charcoal text-sm truncate">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-charcoal-muted flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-charcoal-subtle">{item.productId}</span>
                      <span>•</span>
                      <span>{item.categoryName} → {item.subcategoryName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    {item.clicksCount} {item.clicksCount === 1 ? 'click' : 'clicks'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* Click Analytics Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gold-700" />
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
              Product Click Breakdown
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted font-medium">
            Showing {aggregatedRows.length} {aggregatedRows.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {allClicks.length === 0 ? (
          /* Empty State: No clicks recorded yet */
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-charcoal">
              No WhatsApp clicks recorded yet.
            </h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto mt-1">
              When customers click the WhatsApp ordering button for any product on the public website, click analytics will be tracked and displayed here.
            </p>
          </div>
        ) : aggregatedRows.length === 0 ? (
          /* Empty State: No clicks match current filter */
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-semibold text-charcoal">
              No WhatsApp clicks match the selected filters.
            </p>
            <p className="text-xs text-charcoal-muted mt-1">
              Try adjusting the date range or category filters above.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-charcoal transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">
                  <th className="py-3.5 px-6">PRODUCT</th>
                  <th className="py-3.5 px-6">CATEGORY</th>
                  <th className="py-3.5 px-6">SUBCATEGORY</th>
                  <th className="py-3.5 px-6">PRODUCT ID</th>
                  <th className="py-3.5 px-6 text-center">WHATSAPP CLICKS</th>
                  <th className="py-3.5 px-6 text-right">LAST CLICK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-charcoal">
                {aggregatedRows.map((row) => (
                  <tr key={row.productId} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-charcoal text-sm max-w-xs">
                      <div className="truncate">{row.productName}</div>
                    </td>
                    <td className="py-4 px-6 text-charcoal-muted font-medium">
                      {row.categoryName}
                    </td>
                    <td className="py-4 px-6 text-charcoal-muted font-medium">
                      {row.subcategoryName}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-charcoal-subtle">
                      {row.productId}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {row.clicksCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-charcoal-muted font-mono text-[11px] whitespace-nowrap">
                      {formatClickDate(row.lastClickTimestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
