import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CategoryCard } from '../../components/customer/CategoryCard';
import { ProductCard } from '../../components/customer/ProductCard';
import { CategoryCardSkeleton, ProductCardSkeleton } from '../../components/common/SkeletonLoader';

export const HomePage: React.FC = () => {
  const { categories, subcategories, products, homepageSettings, isLoading } = useStore();

  if (isLoading || !homepageSettings) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <div className="h-96 rounded-3xl bg-boutique-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
        </div>
      </div>
    );
  }

  const { sections, hero, promoBanner, customSection } = homepageSettings;

  // Filter categories that are active and designated for homepage
  const activeCategories = categories.filter(
    (c) => c.isActive && (!homepageSettings.visibleCategoryIds?.length || homepageSettings.visibleCategoryIds.includes(c.id))
  );

  // Active public products
  const publicProducts = products.filter((p) => p.status !== 'HIDDEN' && p.status !== 'DRAFT');
  const featuredProducts = publicProducts.filter((p) => p.isFeatured).slice(0, 8);
  const newArrivals = publicProducts.filter((p) => p.isNewArrival).slice(0, 8);
  const trendingProducts = publicProducts.filter((p) => p.isTrending).slice(0, 8);

  const getProductCategory = (catId: string) => categories.find((c) => c.id === catId);
  const getProductSubcategory = (subId: string) => subcategories.find((s) => s.id === subId);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      {sections.hero && (
        <section className="relative overflow-hidden bg-boutique-100 border-b border-boutique-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Text */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              

                <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-charcoal leading-[1.08]">
                  {hero.title}
                </h1>

                <p className="font-editorial text-xl sm:text-2xl text-gold-700 tracking-wide font-normal">
                  {hero.subtitle}
                </p>

                <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {hero.description}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  {hero.primaryBtnText && (
                    <Link
                      to={hero.primaryBtnLink || '/women'}
                      className="w-full sm:w-auto px-8 py-4 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs sm:text-sm font-semibold tracking-widest uppercase shadow-md transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>{hero.primaryBtnText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {hero.secondaryBtnText && (
                    <Link
                      to={hero.secondaryBtnLink || '/girls'}
                      className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-charcoal border border-boutique-300 rounded-xl text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center"
                    >
                      <span>{hero.secondaryBtnText}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Hero Image Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-elevated border-8 border-white">
                  <img
                    src={hero.image}
                    alt="Modern Dresses Editorial Collection"
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[11px] uppercase tracking-widest text-gold-300 font-semibold block mb-1">
                      New Season Lookbook
                    </span>
                    <h3 className="font-editorial text-2xl font-bold">Curated Festive Elegance</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. SHOP BY CATEGORY SECTION */}
      {sections.categories && (
        <section
  id="categories"
  className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
>
        <div className="text-center max-w-2xl mx-auto pt-4 sm:pt-6 mb-10 sm:mb-14">

  {/* Small eyebrow text */}
  <div className="flex items-center justify-center gap-3 mb-2">
    <span className="w-8 h-px bg-gold-700"></span>

    <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-charcoal-muted font-medium">
      Explore Our
    </span>

    <span className="w-8 h-px bg-gold-700"></span>
  </div>

  {/* Main heading */}
  <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-charcoal leading-tight">
    Collections
  </h2>

  {/* Subtitle */}
  <p className="text-xs sm:text-sm text-charcoal-muted mt-2">
    Thoughtfully selected styles for every generation.
  </p>

</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {activeCategories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id && p.status !== 'HIDDEN').length;
              return <CategoryCard key={cat.id} category={cat} productCount={count} />;
            })}
          </div>
        </section>
      )}

      {/* 3. FEATURED COLLECTIONS SECTION */}
      {sections.featured && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-boutique-600 block mb-2">
                Handpicked Styles
              </span>activeCategories
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal">
                Featured Collections
              </h2>
            </div>
            <Link
              to="/women"
              className="text-xs font-bold uppercase tracking-widest text-charcoal hover:text-gold-700 flex items-center gap-1 transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                category={getProductCategory(prod.categoryId)}
                subcategory={getProductSubcategory(prod.subcategoryId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. PROMOTIONAL BANNER SECTION */}
      {sections.promoBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden shadow-elevated bg-charcoal min-h-[380px] sm:min-h-[440px] flex items-center">
            <img
              src={promoBanner.image}
              alt={promoBanner.heading}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-xl text-white space-y-4">
              <span className="inline-block px-3 py-1 bg-gold-600 text-charcoal text-[11px] font-bold tracking-widest uppercase rounded-full">
                {promoBanner.badge}
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {promoBanner.heading}
              </h2>
              <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-light">
                {promoBanner.description}
              </p>
              <div className="pt-2">
                <Link
                  to={promoBanner.btnLink || '/women/ethnic-wear'}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-charcoal hover:bg-gold-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow"
                >
                  <span>{promoBanner.btnText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. NEW ARRIVALS SECTION */}
      {sections.newArrivals && newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-gold-600 block mb-2">
                Fresh Off The Looms
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal">
                New Arrivals
              </h2>
            </div>
            
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                category={getProductCategory(prod.categoryId)}
                subcategory={getProductSubcategory(prod.subcategoryId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. TRENDING SECTION */}
      {sections.trending && trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-rose-600 block mb-2">
              Most Loved by Customers
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal">
              Trending Now
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                category={getProductCategory(prod.categoryId)}
                subcategory={getProductSubcategory(prod.subcategoryId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. CUSTOM PROMOTIONAL SECTION */}
      {sections.customSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-boutique-100 rounded-3xl p-8 sm:p-12 border border-boutique-300/80 shadow-soft">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 bg-gold-100 px-3 py-1 rounded-full inline-block">
                  {customSection.badge}
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal">
                  {customSection.heading}
                </h2>
                <p className="text-sm text-charcoal-muted leading-relaxed">
                  {customSection.description}
                </p>
                <div className="pt-2">
                  <a
                    href={customSection.btnLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal hover:bg-gold-700 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    <span>{customSection.btnText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
                  <img
                    src={customSection.image}
                    alt={customSection.heading}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. WHY SHOP WITH US SECTION */}
      {sections.whyUs && (
        <section className="bg-white border-y border-boutique-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
             
              <h2 className="font-editorial text-3xl font-bold text-charcoal">
                Why Shop With Us..!
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
              <div className="p-6 rounded-2xl bg-boutique-50 border border-boutique-200/60 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-boutique-200 flex items-center justify-center text-charcoal">
                  <Award className="w-6 h-6 text-gold-700" />
                </div>
                <h3 className="font-editorial text-lg font-bold text-charcoal">Trusted Since 1970</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Serving generations of families with trusted fashion and a legacy built over decades.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-boutique-50 border border-boutique-200/60 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-boutique-200 flex items-center justify-center text-charcoal">
                  <HeartHandshake className="w-6 h-6 text-gold-700" />
                </div>
                <h3 className="font-editorial text-lg font-bold text-charcoal">Trusted by Families</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  A family-focused destination for boys, girls, women, and men, with service you can count on.
                </p>
              </div>

             

              <div className="p-6 rounded-2xl bg-boutique-50 border border-boutique-200/60 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-boutique-200 flex items-center justify-center text-charcoal">
                  <ShieldCheck className="w-6 h-6 text-gold-700" />
                </div>
                <h3 className="font-editorial text-lg font-bold text-charcoal">Reasonable Rates</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Good fashion at fair and reasonable prices, so you get value without compromising on quality.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
