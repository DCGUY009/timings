import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, SkipForward, Volume2, Flame, Sparkles, CheckCircle } from 'lucide-react';
import { Routine, PracticeStep } from '../types';
import { chimeSynthesizer } from '../utils/AudioSynthesizer';

interface TimerScreenProps {
  routine: Routine;
  onClose: (completed: boolean, durationMinutes: number) => void;
}

export default function TimerScreen({ routine, onClose }: TimerScreenProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const steps = routine.steps;
  const currentStep = steps[currentStepIdx] || steps[0];
  const nextStep = steps[currentStepIdx + 1] || null;

  // Track progress fraction
  const percentComplete = currentStep ? ((currentStep.duration - timeLeft) / currentStep.duration) * 100 : 0;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize first step
  useEffect(() => {
    if (currentStep) {
      setTimeLeft(currentStep.duration);
    }
  }, [currentStepIdx, routine]);

  // Handle Play / Pause logic
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger transition sound
            playCueSound(currentStep);
            
            // Go to next step or complete
            clearInterval(timerRef.current!);
            handleNextStep();
            return 0;
          }
          // Optional ticking audio feedback (very quiet soft click)
          if (routine.tickingSoundEnabled !== false) {
            chimeSynthesizer.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, currentStepIdx]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const playCueSound = (step: PracticeStep) => {
    if (step.cue === 'single-chime') {
      chimeSynthesizer.playSingleChime();
    } else if (step.cue === 'double-chime') {
      chimeSynthesizer.playDoubleChime();
    }
  };

  const handleNextStep = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Finished all steps
      setIsPlaying(false);
      setIsFinished(true);
      chimeSynthesizer.playDoubleChime();
    }
  };

  const handlePrevStep = () => {
    if (timeLeft < currentStep.duration - 2) {
      // Just reset current timer if they are partially through
      setTimeLeft(currentStep.duration);
    } else if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setTimeLeft(currentStep.duration);
    setIsPlaying(false);
  };

  const formatDigit = (num: number) => num.toString().padStart(2, '0');
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${formatDigit(m)}:${formatDigit(s)}`;
  };

  // Ring dimension computations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  const handleFinishEarly = () => {
    const elapsedSeconds = steps.reduce((sum, step, idx) => {
      if (idx < currentStepIdx) return sum + step.duration;
      if (idx === currentStepIdx) return sum + (step.duration - timeLeft);
      return sum;
    }, 0);
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onClose(true, minutes);
  };

  if (isFinished) {
    const totalMinutes = Math.max(1, Math.round(steps.reduce((sum, s) => sum + s.duration, 0) / 60));
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background text-on-surface flex flex-col justify-center items-center p-6 text-center select-none grid-bg"
      >
        <div className="w-24 h-24 rounded-full bg-primary-container/10 border border-primary-container/40 flex items-center justify-center text-primary-container mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 font-sans text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary-fixed">
          Practice Complete
        </h1>
        <p className="text-sm font-mono text-outline-variant uppercase tracking-wider mb-6">
          {routine.name}
        </p>

        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 w-full max-w-sm mb-8 space-y-4 font-mono text-xs">
          <div className="flex justify-between border-b border-outline-variant/10 pb-2">
            <span className="text-on-surface-variant">Total Duration</span>
            <span className="font-bold text-primary-container">{totalMinutes} Minutes</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant/10 pb-2">
            <span className="text-on-surface-variant">Completed Steps</span>
            <span className="font-bold text-on-surface">{steps.length} of {steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Precision Level</span>
            <span className="font-bold text-teal-400">100% High-Fidelity</span>
          </div>
        </div>

        <button
          onClick={() => onClose(true, totalMinutes)}
          className="bg-primary-container text-on-primary-container font-sans font-bold text-sm px-8 py-4 rounded-xl hover:bg-white transition-all active:scale-95 cursor-pointer glow-button shadow-cyan-500/10"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  const stepColors = 
    currentStep?.type === 'rest' ? 'bg-indigo-950/40 text-on-secondary border-indigo-700/30' :
    currentStep?.type === 'interval' ? 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/60' :
    'bg-primary-container/20 text-primary-container border-primary-container/30';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background text-on-surface grid-bg flex flex-col justify-between p-6 md:p-12 select-none"
    >
      {/* Header Watermark (Image 2 top left and Close top right) */}
      <header className="flex justify-between items-center w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container border border-primary-container/30 pulse-border">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-sans font-bold text-sm tracking-widest text-[#00f0ff] uppercase block">
              TIMINGS
            </span>
            <span className="text-[9px] tracking-[0.25em] text-outline font-mono uppercase block font-semibold">
              Silent Conductor
            </span>
          </div>
        </div>

        <button
          onClick={handleFinishEarly}
          className="p-3 bg-surface-container hover:bg-surface-container-high hover:text-error border border-outline-variant/30 text-on-surface-variant rounded-full transition-all cursor-pointer"
          title="Exit timer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Column Body */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-8">
        {/* Step index indicator pill */}
        <span className="inline-block px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary-container bg-primary-container/15 rounded-full border border-primary-container/25 mb-6">
          Step {currentStepIdx + 1} of {steps.length}
        </span>

        {/* Step Heading details */}
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface text-center mb-2 font-sans">
          {currentStep?.name}
        </h2>
        <p className="text-sm md:text-base text-on-surface-variant text-center max-w-lg mb-10 leading-relaxed font-sans h-12">
          {currentStep?.description}
        </p>

        {/* Big Circular Countdown Display widget (Image 2 center) */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center select-none">
          {/* Static Background circular track */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-outline-variant/20"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Active Cyan ticking border progress arc */}
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-primary-container"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.35, ease: 'linear' }}
              strokeLinecap="round"
            />
          </svg>

          {/* Time digits */}
          <div className="flex flex-col items-center justify-center z-10 text-center">
            <span className="font-mono text-[64px] md:text-[72px] font-extrabold leading-none tracking-tighter text-[#00f0ff]">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] tracking-[0.2em] text-outline font-mono uppercase mt-1 font-semibold">
              Remaining
            </span>
          </div>
        </div>

        {/* Controllers panel */}
        <div className="flex items-center gap-6 mt-10">
          {/* Reset key */}
          <button
            onClick={handleReset}
            className="p-3.5 bg-surface-container-low border border-outline-variant/35 hover:border-outline-variant text-[#dae2fd] hover:text-white rounded-full transition-all cursor-pointer hover:bg-surface-container active:scale-95"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play/Pause center toggle */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              // Activate audio context
              chimeSynthesizer.playTick();
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-on-primary-container transition-all cursor-pointer shadow-xl relative active:scale-95 hover:scale-105 duration-200 ${
              isPlaying
                ? 'bg-[#00f0ff] hover:bg-white text-black glow-active'
                : 'bg-primary-container hover:bg-white'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current text-black" />
            ) : (
              <Play className="w-6 h-6 fill-current text-black ml-1" />
            )}
          </button>

          {/* Next / Seek key */}
          <button
            onClick={handleNextStep}
            className="p-3.5 bg-surface-container-low border border-outline-variant/35 hover:border-outline-variant text-[#dae2fd] hover:text-white rounded-full transition-all cursor-pointer hover:bg-surface-container active:scale-95"
            title="Skip step"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Up Next Preview Slot Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 select-none">
        <div className="bg-surface-container-high/60 border border-outline-variant/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-mono uppercase text-outline tracking-wider font-semibold mb-1">
              Up Next
            </span>
            <span className="text-sm font-sans font-bold text-[#dae2fd]">
              {nextStep ? nextStep.name : 'Routine Conclusion'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary-container/80 tracking-wide bg-primary-container/10 border border-primary-container/15 px-2.5 py-1 rounded">
            {nextStep ? formatTime(nextStep.duration) : '00:00'}
          </span>
        </div>
      </footer>
    </motion.div>
  );
}
