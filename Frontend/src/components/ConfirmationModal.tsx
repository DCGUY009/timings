import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmationModalProps) {
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const colorMap = {
    danger: {
      bar: 'bg-error',
      icon: 'text-error bg-error/10 border-error/25',
      button: 'bg-error text-white hover:bg-red-500 shadow-red-500/10'
    },
    warning: {
      bar: 'bg-tertiary-container',
      icon: 'text-tertiary-container bg-tertiary-container/10 border-tertiary-container/25',
      button: 'bg-tertiary-container text-on-tertiary-container hover:bg-white shadow-yellow-500/10'
    },
    info: {
      bar: 'bg-[#00f0ff]',
      icon: 'text-primary-container bg-primary-container/10 border-primary-container/25',
      button: 'bg-primary-container text-on-primary-container hover:bg-white shadow-cyan-500/10'
    }
  };

  const colors = colorMap[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#060e20]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-surface-container/95 border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10"
          >
            {/* Top Glowing Header Strip */}
            <div className={`h-1 w-full shrink-0 ${colors.bar}`} />

            {/* Header / Content */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 shrink-0 ${colors.icon}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="font-sans font-bold text-lg text-on-surface mb-2">
                {title}
              </h3>
              
              <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/20 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-outline-variant/45 hover:border-outline text-xs font-sans font-semibold text-on-surface transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-sans font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg ${colors.button}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
