import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, productCount }) => {
  return (
    <Link
      to={`/${category.slug}`}
      className="group relative h-[150px] sm:h-[180px] lg:h-[170px] rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-500 block"
    >
      {/* Background Image */}
      <img
        src={category.coverImage}
        alt={category.name}
        loading="lazy"
        className="w-full h-full object-cover object-center img-zoom-hover"
      />

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent transition-opacity duration-300" />

      {/* Floating Tag & Info */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
         
         
        </div>

        <div>
          <h3 className="font-editorial text-2xl sm:text-3xl font-bold tracking-wider mb-2 group-hover:text-gold-300 transition-colors">
            {category.name}
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 mb-4 font-light leading-relaxed">
            {category.description}
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-300 group-hover:text-white transition-colors">
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
};
