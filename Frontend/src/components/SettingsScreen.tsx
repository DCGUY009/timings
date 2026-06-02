import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, Settings, Sliders, Database
} from 'lucide-react';
import { User } from '../types';
import { chimeSynthesizer } from '../utils/AudioSynthesizer';

interface SettingsScreenProps {
  user: User | null;
}

export default function SettingsScreen({ user }: SettingsScreenProps) {
  const [soundVolume, setSoundVolume] = useState(80);
  const [defaultCue, setDefaultCue] = useState('single-chime');
  const [testActive, setTestActive] = useState(false);

  const testTriggerChime = () => {
    if (defaultCue === 'silent') return;
    setTestActive(true);
    if (defaultCue === 'double-chime') {
      chimeSynthesizer.playDoubleChime();
    } else {
      chimeSynthesizer.playSingleChime();
    }
    setTimeout(() => setTestActive(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-4xl mx-auto w-full select-none"
    >
      {/* Title Header Section */}
      <div className="mb-10 border-b border-outline-variant/15 pb-6">
        <h1 className="text-3xl font-extrabold font-sans tracking-tight text-on-surface flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-container" /> Settings
        </h1>
        <p className="text-sm font-sans text-on-surface-variant mt-2 leading-relaxed">
          Calibrate precise audio transitions, interface mechanics, and storage options.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Audio Synth Calibration */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
            <Sliders className="w-5 h-5 text-primary-container" />
            <div>
              <h2 className="text-base font-bold font-sans text-on-surface">Audio Synth Calibration</h2>
              <p className="text-xs text-on-surface-variant font-sans mt-0.5">Customize transition audio feedback.</p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="font-sans font-semibold text-sm text-on-surface">
                Chime Synth Volume
              </label>
              <span className="font-mono text-sm font-bold text-primary-container bg-primary-container/10 px-2.5 py-0.5 rounded border border-primary-container/20">
                {soundVolume}%
              </span>
            </div>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
              Adjusts the amplitude of synthesized crystalline chime alerts.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-mono text-on-surface-variant">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={(e) => {
                  setSoundVolume(parseInt(e.target.value));
                  chimeSynthesizer.setVolume(parseInt(e.target.value) / 100);
                }}
                className="flex-1 accent-primary-container h-1.5 bg-surface-container-highest rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-on-surface-variant">100%</span>
            </div>
          </div>

          {/* Chime Choice selection */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/10">
            <label className="font-sans font-semibold text-sm text-on-surface block">
              Default Timer Signalling
            </label>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed mb-3">
              Standard sound triggered at the termination of a sequence segment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: 'single-chime', label: 'Single Chime', desc: 'A clean crystal strike' },
                { type: 'double-chime', label: 'Double Chime', desc: 'Two rhythmic strikes' },
                { type: 'silent', label: 'Silent System', desc: 'No mechanical tones' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setDefaultCue(item.type)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all duration-200 cursor-pointer ${
                    defaultCue === item.type
                      ? 'bg-primary-container/10 border-primary-container border-2 text-primary-container shadow-md'
                      : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="font-sans font-bold text-xs uppercase tracking-wider block">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-sans opacity-80 block">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chime Engine test triggers */}
          <div className="bg-[#0b1424]/60 border border-outline-variant/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3 text-left">
              <span className={`w-2.5 h-2.5 rounded-full ${testActive ? 'bg-primary-container animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
              <div>
                <span className="text-xs font-sans font-bold block text-on-surface">Test Audio Cue</span>
                <span className="text-[11px] font-sans text-on-surface-variant block mt-0.5">Play a preview of your selected audio setting.</span>
              </div>
            </div>
            <button
              onClick={testTriggerChime}
              disabled={testActive || defaultCue === 'silent'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-primary-container bg-primary-container/10 hover:bg-primary-container hover:text-on-primary-container border border-primary-container/20 rounded-lg px-4 py-2 text-xs font-mono font-bold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Test Synthesizer
            </button>
          </div>
        </section>

        {/* Section 3: Account & Data */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
            <Database className="w-5 h-5 text-primary-container" />
            <div>
              <h2 className="text-base font-bold font-sans text-on-surface">Account & Data</h2>
              <p className="text-xs text-on-surface-variant font-sans mt-0.5">Inspect active user session and database synchronization.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold">Authenticated Identity</span>
                <span className="text-sm font-semibold text-on-surface block font-mono">
                  {user ? user.email : 'Unauthenticated Local Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold rounded py-1">
                  Active
                </span>
              </div>
            </div>
          </div>
        </section>


      </div>
    </motion.div>
  );
}
