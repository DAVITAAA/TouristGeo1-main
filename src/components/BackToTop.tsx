import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';

interface BackToTopProps {
  language: Language;
}

export default function BackToTop({ language }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const t = translations[language];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 350);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={scrollToTop}
          title={t.back_to_top}
          aria-label={t.back_to_top}
          className="fixed bottom-24 right-7 z-[2900] w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md border border-border-light text-text-main hover:text-primary hover:border-primary/30 shadow-lg shadow-black/10 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-90 group"
        >
          <span className="material-symbols-outlined text-[24px] group-hover:-translate-y-0.5 transition-transform duration-200">
            keyboard_arrow_up
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
