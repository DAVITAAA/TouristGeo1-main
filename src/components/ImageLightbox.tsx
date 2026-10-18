import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[4000] flex flex-col justify-between bg-black/95 backdrop-blur-xl select-none">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary text-[22px]">photo_library</span>
            {title && (
              <span className="font-bold text-sm sm:text-base truncate max-w-xs sm:max-w-md font-display">
                {title}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close lightbox"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Center Main Image Display with Prev/Next Controls */}
        <div className="relative flex-1 flex items-center justify-center p-4 min-h-0">
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              aria-label="Previous image"
            >
              <span className="material-symbols-outlined text-[28px]">chevron_left</span>
            </button>
          )}

          {/* Current Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="max-h-[72vh] max-w-[90vw] flex items-center justify-center"
          >
            <img
              src={images[currentIndex]}
              alt={title || `Photo ${currentIndex + 1}`}
              className="max-h-[72vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
              draggable={false}
            />
          </motion.div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
              aria-label="Next image"
            >
              <span className="material-symbols-outlined text-[28px]">chevron_right</span>
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div className="px-6 py-4 bg-gradient-to-t from-black/80 to-transparent z-10 flex justify-center overflow-x-auto">
            <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 transition-all border-2 ${
                    idx === currentIndex
                      ? 'border-primary ring-2 ring-primary/40 scale-105'
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
