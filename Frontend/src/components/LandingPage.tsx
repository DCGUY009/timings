import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, Copy, Play, ArrowRight, Clock, Star, BrainCircuit } from 'lucide-react';
import { ActiveScreen } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  onTryPreset: (presetId: string) => void;
}

export default function LandingPage({ onStart, onNavigate, onTryPreset }: LandingPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(21); // 21 seconds focus countdown

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 21));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const architectures = [
    {
      id: 'deep-work-block',
      badge: 'WORK',
      badgeBg: 'bg-[#dbfcff] text-[#006970]',
      title: 'Pomodoro Focus',
      desc: 'Deep work sessions intercut with tactical breaks.',
      duration: '25:00',
      isActive: true,
    },
    {
      id: 'kettlebell-hiit',
      badge: 'INTERVAL',
      badgeBg: 'bg-secondary-container text-on-secondary-container',
      title: 'HIIT Circuit',
      desc: 'High-intensity intervals structured for maximum output.',
      duration: '45:00',
      isActive: false,
    },
    {
      id: 'sunrise-activation',
      badge: 'FLOW',
      badgeBg: 'bg-tertiary-container text-on-tertiary-container',
      title: 'Morning Kriya',
      desc: 'Breathwork and mobility sequence to prime the system.',
      duration: '15:00',
      isActive: false,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen bg-background text-on-surface grid-bg relative pb-16 overflow-y-auto"
    >
      {/* Top Banner Header (External Landing Page Navbar) */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 w-full max-w-7xl mx-auto border-b border-outline-variant/30 relative z-30">
        <div className="font-sans text-2xl font-extrabold text-primary-container tracking-tight cursor-pointer">
          Timings
        </div>
      </nav>

      {/* Hero Section */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12 flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="flex-1 flex flex-col space-y-6 md:pr-12 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant/50 bg-surface-container-low text-xs font-mono text-primary-container uppercase tracking-wider mb-4">
              <BrainCircuit className="w-3.5 h-3.5 animate-pulse" /> Introducing Timings
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-on-surface"
          >
            Execute routines <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container via-secondary-fixed-dim to-primary">
              without looking
            </span> at your phone.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-body-lg text-on-surface-variant max-w-xl mx-auto md:mx-0 leading-relaxed font-sans"
          >
            Timings guides your yoga practice, physical workout, deep focus blocks, or meditation sequences through pristine, gentle audio cues. Focus on your breathing, your reps, or your writing—not your screen.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-6 flex justify-center md:justify-start w-full sm:w-auto"
          >
            <button 
              onClick={() => onNavigate('auth')}
              className="w-full sm:w-auto bg-primary-container text-on-primary-container font-sans font-bold text-body-lg px-8 py-4 rounded-xl hover:bg-white transition-all active:scale-[0.98] duration-200 cursor-pointer glow-button shadow-cyan-500/20 inline-flex items-center justify-center gap-2"
            >
              Access Console <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <div className="flex-1 mt-12 md:mt-0 relative w-full h-[360px] md:h-[450px] flex justify-center items-center select-none">
          {/* Abstract Focus Representation */}
          <div className="absolute inset-x-0 w-80 h-80 bg-primary-container/5 rounded-full blur-[110px] animate-pulse"></div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            className="absolute w-80 h-80 border border-outline-variant/10 rounded-full flex items-center justify-center border-dashed"
          />

          {/* Glowing pulse rings aligned beautifully with mockup styling */}
          <div className="relative w-72 h-72 border border-outline-variant/30 rounded-full flex items-center justify-center bg-surface-container-lowest/40 pulse-border glow-active">
            <div className="w-56 h-56 border border-primary-container/20 rounded-full flex items-center justify-center">
              <div className="w-40 h-40 border border-outline-variant/35 rounded-full flex items-center justify-center bg-[#060e20]/60 relative">
                {/* Floating breathing dots */}
                <span className="absolute w-2 h-2 rounded-full bg-primary-container top-3 left-1/2 -translate-x-1/2 animate-bounce"></span>
                <span className="font-mono text-3xl md:text-4xl font-bold text-primary-container tracking-tight">
                  {formatCountdown(secondsLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Bento Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16">
        <h2 className="text-center font-sans font-bold text-2xl tracking-tight text-on-surface-variant uppercase tracking-[0.15em] mb-12">
          Designed for Absolute Presence
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bento Card 1 */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 flex flex-col space-y-4 hover:border-primary-container/40 transition-all duration-350 hover:translate-y-[-2px] group">
            <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center text-primary-container mb-2 group-hover:scale-105 group-hover:bg-primary-container group-hover:text-on-primary-container transition-all shadow-md">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-headline-md text-on-surface">Minimal Audio Cues</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Subtle crystalline chimes and gentle signals keep you in the zone without startling interruptions or visual disruptions. Realize total focus, zero noise, and seamless rhythm.
            </p>
          </div>

          {/* Bento Card 2 */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-8 flex flex-col space-y-4 hover:border-primary-container/40 transition-all duration-350 hover:translate-y-[-2px] group">
            <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center text-primary-container mb-2 group-hover:scale-105 group-hover:bg-primary-container group-hover:text-on-primary-container transition-all shadow-md">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-sans font-bold text-headline-md text-on-surface">Reusable Templates</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Build your customized breathing intervals, meditation steps, or workout sequences once, save them safely into local storage templates, and trigger them infinitely with a single click.
            </p>
          </div>
        </div>
      </section>

      {/* routine architectures (mockup 5 table) */}
      <section className="w-full max-w-4xl mx-auto px-6 md:px-12 py-12 flex flex-col items-center">
        <h2 className="font-sans font-bold text-3xl text-on-surface mb-3 text-center">
          Routine Architectures
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-primary-container to-secondary-container rounded-full mb-12"></div>
        
        <div className="flex flex-col space-y-5 w-full">
          {architectures.map((arch) => (
            <div 
              key={arch.id}
              onClick={() => onTryPreset(arch.id)}
              className={`group relative overflow-hidden bg-surface-container-high border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-all duration-300 ${
                arch.isActive 
                  ? 'border-primary-container/80 pulse-border glow-active translate-x-1' 
                  : 'border-outline-variant/20 opacity-70 hover:opacity-100 hover:border-primary-container/35'
              }`}
            >
              {arch.isActive && (
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-container to-teal-400 w-1/3"></div>
              )}
              
              <div className="flex flex-col pr-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`font-mono text-[10px] font-bold px-2 py-1 rounded tracking-wider ${arch.badgeBg}`}>
                    {arch.badge}
                  </span>
                  <h3 className="font-sans font-bold text-xl text-on-surface group-hover:text-primary-container transition-colors">
                    {arch.title}
                  </h3>
                </div>
                <p className="text-body-md text-on-surface-variant leading-normal">
                  {arch.desc}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center space-x-4 shrink-0">
                <div className={`font-mono text-4xl md:text-5xl font-bold tracking-tighter ${arch.isActive ? 'text-primary-container' : 'text-on-surface-variant/40'}`}>
                  {arch.duration}
                </div>
                <button className="p-3.5 bg-surface-container-highest rounded-full border border-outline-variant/40 hover:bg-primary-container hover:text-on-primary-container hover:border-primary-container transition-all text-primary-container shadow-md cursor-pointer group-hover:scale-105">
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 pt-10 pb-8 mt-12 bg-surface-container-lowest/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col text-center md:text-left">
            <span className="font-sans font-bold text-sm tracking-widest text-on-surface uppercase">
              TIMINGS
            </span>
            <span className="text-xs text-outline font-mono mt-1">
              High-Precision Practice Companion
            </span>
          </div>
          
          <div className="flex space-x-8 text-sm font-mono">
            <a href="#" className="text-outline hover:text-on-surface transition-colors">Privacy</a>
            <a href="#" className="text-outline hover:text-on-surface transition-colors">Terms</a>
            <a href="#" className="text-outline hover:text-on-surface transition-colors">Contact</a>
          </div>

          <div className="text-xs text-outline font-mono text-center md:text-right">
            &copy; {new Date().getFullYear()} Timings. High-Precision Rhythm. Built to Conductor specs.
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
