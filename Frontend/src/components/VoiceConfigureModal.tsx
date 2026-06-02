import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Volume2, Sparkles, Check } from 'lucide-react';
import { Routine, PracticeStep } from '../types';
import { AudioRecorder } from './RoutineEditor';

interface VoiceConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine;
  unconfiguredSteps: PracticeStep[];
  onConfigured: (audioDataMap: Record<string, string>) => void;
}

export default function VoiceConfigureModal({
  isOpen,
  onClose,
  routine,
  unconfiguredSteps,
  onConfigured,
}: VoiceConfigureModalProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [recordedAudios, setRecordedAudios] = useState<Record<string, string>>({});
  const activeStep = unconfiguredSteps[currentStepIdx];

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIdx(0);
      setRecordedAudios({});
    }
  }, [isOpen]);

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

  if (!activeStep) return null;

  const handleSaveAudio = (base64: string) => {
    setRecordedAudios((prev) => ({
      ...prev,
      [activeStep.id]: base64,
    }));
  };

  const handleNextOrFinish = () => {
    if (currentStepIdx < unconfiguredSteps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Completed configuring all steps
      // Save all newly recorded audios to localStorage
      const finalMap = { ...recordedAudios };
      Object.entries(finalMap).forEach(([stepId, base64]) => {
        if (base64 === '') {
          localStorage.removeItem(`audio_loop_${stepId}`);
        } else {
          localStorage.setItem(`audio_loop_${stepId}`, base64);
        }
      });
      onConfigured(finalMap);
    }
  };

  const currentAudioData = recordedAudios[activeStep.id] !== undefined
    ? recordedAudios[activeStep.id]
    : (localStorage.getItem(`audio_loop_${activeStep.id}`) || undefined);

  const hasAudio = !!(currentAudioData && currentAudioData !== '');

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
            className="relative w-full max-w-xl bg-surface-container/95 border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10"
          >
            {/* Top Glowing Header Strip */}
            <div className="h-1 w-full shrink-0 bg-[#00f0ff]" />

            {/* Header */}
            <div className="p-6 pb-4 flex justify-between items-start border-b border-outline-variant/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container border border-primary-container/20">
                  <Mic className="w-5 h-5 text-[#00f0ff]" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-on-surface">
                    Voice Configuration Required
                  </h3>
                  <p className="text-xs text-on-surface-variant font-sans">
                    Setup your voice cues for {routine.name}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-lg text-on-surface-variant hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00f0ff] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> step {currentStepIdx + 1} of {unconfiguredSteps.length}: {activeStep.name}
                </span>
                <p className="text-xs text-on-surface leading-relaxed font-sans font-medium">
                  {activeStep.description}
                </p>
                {activeStep.name.toLowerCase().includes('aum') && (
                  <div className="text-[11px] text-on-surface-variant leading-relaxed font-sans pt-1 border-t border-outline-variant/10 mt-2 space-y-1">
                    <p className="font-bold text-white">How to record AUM chanting:</p>
                    <p>Speak AUM with "Aaa", "Uuuu", and "Mmmm" parts equally in length. Since meditation is personalized, recording your own voice is essential for resonance.</p>
                  </div>
                )}
              </div>

              {/* Embed Audio Recorder */}
              <div className="flex justify-center w-full">
                <AudioRecorder
                  key={activeStep.id}
                  audioData={currentAudioData}
                  onSaveAudio={(base64) => handleSaveAudio(base64)}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[10px] font-mono text-on-surface-variant">
                {currentStepIdx + 1} / {unconfiguredSteps.length} Steps
              </span>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-outline-variant/45 hover:border-outline text-xs font-sans font-semibold text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleNextOrFinish}
                  className="px-5 py-2 rounded-xl text-xs font-sans font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg bg-primary-container text-on-primary-container hover:bg-white flex items-center gap-1.5"
                >
                  {!hasAudio ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      Done
                    </>
                  ) : currentStepIdx < unconfiguredSteps.length - 1 ? (
                    'Next Step'
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      Finish Setup
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
