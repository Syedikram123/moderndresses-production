import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { ProductColour } from '../../types';

interface ProductGalleryProps {
  currentColour: ProductColour;
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ currentColour, productName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const images = currentColour?.images?.length
    ? currentColour.images
    : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'];

  // Reset to first image when colour changes
  useEffect(() => {
    setActiveIndex(0);
  }, [currentColour?.id]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative aspect-[3/4] bg-boutique-100 rounded-2xl overflow-hidden border border-boutique-200/80 shadow-soft group">
        <img
          src={images[activeIndex]}
          alt={`${productName} - ${currentColour.name} (View ${activeIndex + 1})`}
          className="w-full h-full object-cover object-center transition-all duration-500"
          loading="lazy"
        />

        {/* Next / Prev Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-charcoal shadow-md backdrop-blur-xs transition-transform hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-charcoal shadow-md backdrop-blur-xs transition-transform hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-charcoal shadow-md backdrop-blur-xs transition-transform hover:scale-110"
          aria-label="Zoom image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-charcoal/60 backdrop-blur-xs text-[11px] font-medium text-white tracking-wider">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row (Up to 5 images per colour) */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-[3/4] w-16 sm:w-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                activeIndex === idx
                  ? 'border-charcoal ring-2 ring-boutique-300'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
            aria-label="Close zoomed view"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] overflow-hidden">
            <img
              src={images[activeIndex]}
              alt={`${productName} zoomed`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
