import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, Mail } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: 'privacy' | 'terms' | 'contact';
}

export default function InfoModal({ isOpen, onClose, defaultTab }: InfoModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'contact'>(defaultTab);

  // Sync activeTab when defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

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

  const tabs = [
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'contact', label: 'Contact', icon: Mail },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
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
            className="relative w-full max-w-lg bg-surface-container/95 border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[90vh]"
          >
            {/* Top Glowing Header Strip */}
            <div className="h-1 w-full bg-gradient-to-r from-primary-container via-indigo-500 to-teal-400 shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-outline-variant/20 shrink-0">
              <span className="font-sans font-bold text-headline-sm text-primary-container uppercase tracking-wider">
                Timings Info
              </span>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-outline-variant/20 font-mono text-xs px-4 shrink-0 bg-surface-container-low/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary-container text-primary-container'
                        : 'border-transparent text-outline hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto text-sm font-sans leading-relaxed text-on-surface-variant">
              <AnimatePresence mode="wait">
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary-container" /> Privacy Policy
                    </h4>
                    <p>
                      Timings is designed with privacy at its core. Most of your custom routine data is stored completely locally in your browser's <code className="font-mono text-xs bg-surface-container-highest px-1 py-0.5 rounded text-primary-container">LocalStorage</code>.
                    </p>
                    <p>
                      If you choose to register and use our cloud synchronization, your account profile and custom routines are securely stored in our Supabase database instance under strict row-level security policy checks.
                    </p>
                    <p>
                      We do not track, profile, sell, or disclose your information to any third parties. Your presence and attention belong to you.
                    </p>
                  </motion.div>
                )}

                {activeTab === 'terms' && (
                  <motion.div
                    key="terms"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-container" /> Terms of Service
                    </h4>
                    <p>
                      By using the Timings application, you agree to comply with and be bound by the following terms of use:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-xs font-mono">
                      <li>
                        <strong>Account Integrity:</strong> You are responsible for maintaining the confidentiality of your login credentials when using cloud synchronization.
                      </li>
                      <li>
                        <strong>Permitted Use:</strong> The service is designed solely as a personal timer companion for yoga, workouts, meditation, and deep focus blocks.
                      </li>
                      <li>
                        <strong>No Warranty:</strong> Timings is provided "as is" and "as available", without warranties of any kind, whether express or implied.
                      </li>
                      <li>
                        <strong>Modifications:</strong> We reserve the right to update these terms. Continuing to use the app constitutes acceptance of any updates.
                      </li>
                    </ul>
                  </motion.div>
                )}

                {activeTab === 'contact' && (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary-container" /> Contact Information
                    </h4>
                    <p>
                      Have feedback, questions, or ideas for improving Timings? We would love to hear from you.
                    </p>
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 mt-2">
                      <p className="text-xs font-mono text-outline uppercase tracking-wider mb-1">
                        Direct Email
                      </p>
                      <p className="text-base font-bold text-primary-container select-all font-mono break-all">
                        samudrala.santhosh.19cse@bmu.edu.in
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/20 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="bg-primary-container text-on-primary-container font-sans font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-white transition-all active:scale-[0.98] duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
