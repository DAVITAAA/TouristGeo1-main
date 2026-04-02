import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  const colors = {
    success: 'bg-green-50 text-green-600 border-green-100',
    error: 'bg-red-50 text-red-600 border-red-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className={`fixed top-8 left-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl border-2 shadow-2xl font-bold min-w-[300px] max-w-md ${colors[type]}`}
    >
      <span className="material-symbols-outlined">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity">
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </motion.div>
  );
}
