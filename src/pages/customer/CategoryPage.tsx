import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { FilterBar, FilterState } from '../../components/customer/FilterBar';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { categories, subcategories, products } = useStore();

  const [filters, setFilters] = useState<FilterState>({
    priceRange: 'ALL',
    selectedSize: '',
    inStockOnly: false,
    sortBy: 'NEWEST',
  });

  const category = categories.find((c) => c.slug === categorySlug?.toLowerCase());

  // Subcategories belonging to this category
  const categorySubcats = useMemo(() => {
    if (!category) return [];
    return subcategories.filter((s) => s.categoryId === category.id && s.isActive);
  }, [category, subcategories]);

  // All active products in this category
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((p) => p.categoryId === category.id && p.status !== 'HIDDEN' && p.status !== 'DRAFT');
  }, [category, products]);

  // Extract all available sizes in this category for filtering
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    categoryProducts.forEach((p) => {
      p.sizes?.forEach((sz) => sizeSet.add(sz));
    });
    return Array.from(sizeSet).sort();
  }, [categoryProducts]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let list = [...categoryProducts];

    // Price Filter
    if (filters.priceRange === 'UNDER_1500') {
      list = list.filter((p) => p.showPrice && p.sellingPrice < 1500);
    } else if (filters.priceRange === '1500_2500') {
      list = list.filter((p) => p.showPrice && p.sellingPrice >= 1500 && p.sellingPrice <= 2500);
    } else if (filters.priceRange === 'ABOVE_2500') {
      list = list.filter((p) => p.showPrice && p.sellingPrice > 2500);
    }

    // Size Filter
    if (filters.selectedSize) {
      list = list.filter((p) => p.sizes?.includes(filters.selectedSize));
    }

    // In Stock Only
    if (filters.inStockOnly) {
      list = list.filter((p) => p.status !== 'OUT_OF_STOCK');
    }

    // Sorting
    switch (filters.sortBy) {
      case 'PRICE_ASC':
        list.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
        break;
      case 'PRICE_DESC':
        list.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
        break;
      case 'FEATURED':
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
      case 'NEWEST':
      default:
        list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
    }

    return list;
  }, [categoryProducts, filters]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-editorial text-3xl font-bold text-charcoal mb-3">Category Not Found</h2>
        <p className="text-sm text-charcoal-muted mb-6">The category you are looking for does not exist or has been removed.</p>
        <Link to="/" className="px-6 py-3 bg-charcoal text-white rounded-xl text-xs uppercase font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  const getSubcategory = (subId: string) => subcategories.find((s) => s.id === subId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-12">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: category.name }]} />

      {/* Category Editorial Hero Banner */}
     {/* } <div className="relative rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[340px] flex items-end p-6 sm:p-12 shadow-card">
        <img
          src={category.coverImage}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <div className="relative z-10 max-w-2xl text-white space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-300">
            Exclusive Collection
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold">{category.name}</h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
            {category.description}
          </p>
        </div>
      </div> */}

      {/* Subcategories Showcase */}
      {categorySubcats.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-boutique-200 pb-3">
            <h2 className="font-editorial text-2xl font-bold text-charcoal">
              Explore Styles - {category.name}
            </h2>
            <span className="text-xs text-charcoal-muted">
              {categorySubcats.length} Sections
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categorySubcats.map((sub) => {
              const subCount = categoryProducts.filter((p) => p.subcategoryId === sub.id).length;
              return (
                <Link
                  key={sub.id}
                  to={`/${category.slug}/${sub.slug}`}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-boutique-200 shadow-soft hover:shadow-card transition-all block"
                >
                  <img
                    src={sub.coverImage}
                    alt={sub.name}
                    className="w-full h-full object-cover object-center img-zoom-hover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white">
                    <h3 className="font-serif text-sm sm:text-base font-semibold group-hover:text-gold-300 transition-colors">
                      {sub.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs text-stone-300">
                      <span>{subCount} Styles</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Products & Filters Section */}
      <section className="space-y-6">
        <div className="border-b border-boutique-200 pb-3">
          <h2 className="font-editorial text-2xl font-bold text-charcoal">
            All {category.name} Styles
          </h2>
          <p className="text-xs text-charcoal-muted mt-1">
            Browse our full range or select a subcategory above for focused collections.
          </p>
        </div>

        {/* Filter Toolbar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          availableSizes={availableSizes}
          totalResults={filteredProducts.length}
        />

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                category={category}
                subcategory={getSubcategory(prod.subcategoryId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-boutique-200 p-8">
            <h3 className="font-editorial text-xl font-bold text-charcoal mb-2">No Products Found</h3>
            <p className="text-xs text-charcoal-muted mb-4 max-w-sm mx-auto">
              No products match your active filter selections. Try clearing your filters to see more results.
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  priceRange: 'ALL',
                  selectedSize: '',
                  inStockOnly: false,
                  sortBy: 'NEWEST',
                })
              }
              className="px-5 py-2.5 bg-charcoal text-white rounded-xl text-xs font-semibold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
