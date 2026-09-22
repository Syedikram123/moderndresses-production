import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/customer/ProductCard';
import { FilterBar, FilterState } from '../../components/customer/FilterBar';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SubcategoryPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{ categorySlug: string; subcategorySlug: string }>();
  const { categories, subcategories, products } = useStore();

  const [filters, setFilters] = useState<FilterState>({
    priceRange: 'ALL',
    selectedSize: '',
    inStockOnly: false,
    sortBy: 'NEWEST',
  });

  const category = categories.find((c) => c.slug === categorySlug?.toLowerCase());
  const subcategory = subcategories.find(
    (s) => s.slug === subcategorySlug?.toLowerCase() && (!category || s.categoryId === category.id)
  );

  // Products belonging specifically to this subcategory
  const subcategoryProducts = useMemo(() => {
    if (!category || !subcategory) return [];
    return products.filter(
      (p) =>
        p.categoryId === category.id &&
        p.subcategoryId === subcategory.id &&
        p.status !== 'HIDDEN' &&
        p.status !== 'DRAFT'
    );
  }, [category, subcategory, products]);

  // Extract available sizes
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    subcategoryProducts.forEach((p) => {
      p.sizes?.forEach((sz) => sizeSet.add(sz));
    });
    return Array.from(sizeSet).sort();
  }, [subcategoryProducts]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let list = [...subcategoryProducts];

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
  }, [subcategoryProducts, filters]);

  if (!category || !subcategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-editorial text-3xl font-bold text-charcoal mb-3">Subcategory Not Found</h2>
        <p className="text-sm text-charcoal-muted mb-6">
          The requested section could not be found.
        </p>
        <Link to="/" className="px-6 py-3 bg-charcoal text-white rounded-xl text-xs uppercase font-semibold">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: category.name, url: `/${category.slug}` },
          { label: subcategory.name },
        ]}
      />

      {/* Subcategory Banner & Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-boutique-200/80 shadow-soft">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <Link
              to={`/${category.slug}`}
              className="text-xs uppercase font-bold tracking-widest text-gold-700 hover:underline"
            >
              {category.name}
            </Link>
            <span className="text-boutique-400">•</span>
            <span className="text-xs text-charcoal-muted">{subcategoryProducts.length} Items Available</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-charcoal">
            {subcategory.name}
          </h1>
          {subcategory.description && (
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed font-light pt-1">
              {subcategory.description}
            </p>
          )}
        </div>
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
              subcategory={subcategory}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-boutique-200 p-8">
          <h3 className="font-editorial text-xl font-bold text-charcoal mb-2">No Products in this View</h3>
          <p className="text-xs text-charcoal-muted mb-4 max-w-sm mx-auto">
            Try adjusting your price range, sizes, or stock filter to explore other available products.
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
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
