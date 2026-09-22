import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs sm:text-sm text-charcoal-muted">
      <ol className="flex items-center flex-wrap gap-1 sm:gap-2">
        <li>
          <Link to="/" className="flex items-center hover:text-charcoal transition-colors">
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1 sm:gap-2">
              <ChevronRight className="w-3 h-3 text-boutique-400 flex-shrink-0" />
              {isLast || !item.url ? (
                <span className="text-charcoal font-medium truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              ) : (
                <Link to={item.url} className="hover:text-charcoal transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
