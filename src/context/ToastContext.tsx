import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  const icons: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  const styleMap: Record<ToastType, { bg: string; text: string; border: string; iconColor: string }> = {
    success: {
      bg: 'bg-white/95 backdrop-blur-md',
      text: 'text-gray-900',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-500',
    },
    error: {
      bg: 'bg-white/95 backdrop-blur-md',
      text: 'text-gray-900',
      border: 'border-rose-500/30',
      iconColor: 'text-rose-500',
    },
    info: {
      bg: 'bg-white/95 backdrop-blur-md',
      text: 'text-gray-900',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-500',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-md px-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = styleMap[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl shadow-black/5 font-semibold text-[13px] w-full ${style.bg} ${style.border} ${style.text}`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${style.iconColor}`}>
                  {icons[toast.type]}
                </span>
                <span className="flex-1 leading-snug break-words">{toast.message}</span>
                <button
                  onClick={() => hideToast(toast.id)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Dismiss notification"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
