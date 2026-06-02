import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, SkipForward, Volume2, Flame, Sparkles, CheckCircle, ClipboardCheck, Check } from 'lucide-react';
import { Routine, PracticeStep } from '../types';
import { chimeSynthesizer } from '../utils/AudioSynthesizer';
import { useRoutineStore } from '../store/useRoutineStore';
import ConfirmationModal from './ConfirmationModal';

interface TimerScreenProps {
  routine: Routine;
  onClose: (completed: boolean, durationMinutes: number) => void;
}

// Speech helper for verbal repetitions counting
const speakNumber = (num: number) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(num));
    utterance.rate = 1.15; // slightly sped up for precise counting
    window.speechSynthesis.speak(utterance);
  }
};

// Web Audio API precise beep generator
const playPacerBeep = (freq = 800, duration = 0.08) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Pacer beep synthesis error:', e);
  }
};

export default function TimerScreen({ routine, onClose }: TimerScreenProps) {
  const [phase, setPhase] = useState<'setup' | 'timer'>('setup');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // v2 Reps-based and Audio Loop-based execution state
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0); // stores rep count for 'reps', or loop count for 'audio-loop'
  const [repSubPhase, setRepSubPhase] = useState<'work' | 'rest'>('work');

  const storeRoutine = useRoutineStore((state) => state.routines.find((r) => r.id === routine.id)) || routine;
  const checklist = storeRoutine.checklist || [];
  const handleToggleRoutineCheck = useRoutineStore((state) => state.handleToggleRoutineCheck);

  const steps = routine.steps || [];
  const currentStep = steps[currentStepIdx] || steps[0] || {
    id: 'empty-step',
    name: 'Empty Step',
    description: 'This routine has no steps configured.',
    duration: 0,
    cue: 'silent',
    type: 'work',
    stepFormat: 'duration'
  };
  const nextStep = steps[currentStepIdx + 1] || null;

  const getStepDuration = (s: PracticeStep) => {
    if (s.stepFormat === 'reps') {
      const sets = s.sets || 1;
      const reps = s.reps || 12;
      const repPace = s.repPace || 3.0;
      const rest = s.duration; // set rest stored in s.duration
      return Math.round((sets * reps * repPace) + ((sets - 1) * rest));
    } else if (s.stepFormat === 'audio-loop') {
      return (s.reps || 21) * 3; // Estimated average loop duration for stats
    }
    return s.duration;
  };

  // Track progress fraction based on active format
  const getPercentComplete = () => {
    if (!currentStep) return 0;
    if (currentStep.stepFormat === 'reps') {
      if (repSubPhase === 'work') {
        const pace = currentStep.repPace || 3.0;
        return ((pace - timeLeft) / pace) * 100;
      } else {
        const rest = currentStep.duration || 30;
        return ((rest - timeLeft) / rest) * 100;
      }
    } else if (currentStep.stepFormat === 'audio-loop') {
      const maxLoops = currentStep.reps || 21;
      return (currentRep / maxLoops) * 100;
    }
    return ((currentStep.duration - timeLeft) / currentStep.duration) * 100;
  };

  const percentComplete = getPercentComplete();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize step configuration states on transition
  useEffect(() => {
    if (currentStep) {
      if (currentStep.stepFormat === 'reps') {
        setCurrentSet(1);
        setCurrentRep(0);
        setRepSubPhase('work');
        setTimeLeft(currentStep.repPace || 3.0);
      } else if (currentStep.stepFormat === 'audio-loop') {
        setCurrentRep(1);
        setRepSubPhase('work');
        setTimeLeft(0);
      } else {
        setTimeLeft(currentStep.duration);
      }
    }
  }, [currentStepIdx, routine]);

  // Handle Audio Loops playback logic
  useEffect(() => {
    if (currentStep && currentStep.stepFormat === 'audio-loop' && phase === 'timer') {
      if (isPlaying && currentStep.audioData) {
        if (!activeAudioRef.current) {
          const audio = new Audio(currentStep.audioData);
          activeAudioRef.current = audio;
          
          audio.onended = () => {
            const nextLoop = currentRep + 1;
            const maxLoops = currentStep.reps || 21;
            if (nextLoop <= maxLoops) {
              setCurrentRep(nextLoop);
              audio.currentTime = 0;
              audio.play().catch(e => console.error('Loop playback failed', e));
            } else {
              playCueSound(currentStep);
              activeAudioRef.current = null;
              handleNextStep();
            }
          };
          
          audio.play().catch(e => console.error('Start loop playback failed', e));
        } else {
          activeAudioRef.current.play().catch(e => console.error('Resume loop playback failed', e));
        }
      } else {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
        }
      }
    }

    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, [isPlaying, currentStepIdx, phase, currentRep, currentStep]);

  // Handle primary timing countdown and pacer loop
  useEffect(() => {
    if (isPlaying && (currentStep.stepFormat !== 'audio-loop' || timeLeft > 0)) {
      if (currentStep.stepFormat === 'reps') {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (repSubPhase === 'work') {
              if (prev <= 1) {
                const nextRep = currentRep + 1;
                const maxReps = currentStep.reps || 12;

                if (nextRep <= maxReps) {
                  setCurrentRep(nextRep);
                  playPacerBeep(800, 0.08);
                  speakNumber(nextRep);
                  const pace = currentStep.repPace || 3.0;
                  return pace;
                } else {
                  // All reps done for this set
                  const maxSets = currentStep.sets || 1;
                  if (currentSet < maxSets) {
                    setRepSubPhase('rest');
                    playCueSound(currentStep);
                    const restTime = currentStep.duration || 30; // set rest in duration
                    return restTime;
                  } else {
                    // All sets completed
                    clearInterval(timerRef.current!);
                    playCueSound(currentStep);
                    handleNextStep();
                    return 0;
                  }
                }
              } else {
                if (routine.tickingSoundEnabled !== false) {
                  chimeSynthesizer.playTick();
                }
                return prev - 1;
              }
            } else {
              // Resting between sets
              if (prev <= 1) {
                setCurrentSet((s) => s + 1);
                setCurrentRep(1);
                setRepSubPhase('work');
                playPacerBeep(1000, 0.15); // distinct set transition chime
                speakNumber(1);
                const pace = currentStep.repPace || 3.0;
                return pace;
              } else {
                if (routine.tickingSoundEnabled !== false) {
                  chimeSynthesizer.playTick();
                }
                return prev - 1;
              }
            }
          });
        }, 1000);
      } else {
        // Standard time-based step
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              playCueSound(currentStep);
              clearInterval(timerRef.current!);
              handleNextStep();
              return 0;
            }
            if (routine.tickingSoundEnabled !== false) {
              chimeSynthesizer.playTick();
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, currentStepIdx, repSubPhase, currentRep, currentSet]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
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
      setIsPlaying(false);
      setIsFinished(true);
      chimeSynthesizer.playDoubleChime();
    }
  };

  const handlePrevStep = () => {
    if (currentStep.stepFormat === 'reps') {
      handleReset();
    } else if (timeLeft < currentStep.duration - 2) {
      setTimeLeft(currentStep.duration);
    } else if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (currentStep.stepFormat === 'reps') {
      setCurrentSet(1);
      setCurrentRep(0);
      setRepSubPhase('work');
      setTimeLeft(currentStep.repPace || 3.0);
    } else if (currentStep.stepFormat === 'audio-loop') {
      setCurrentRep(1);
      setTimeLeft(0);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      }
    } else {
      setTimeLeft(currentStep.duration);
    }
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
      if (idx < currentStepIdx) return sum + getStepDuration(step);
      if (idx === currentStepIdx) {
        if (step.stepFormat === 'reps') {
          const setsCompleted = currentSet - 1;
          const repsCompleted = currentRep;
          const pace = step.repPace || 3.0;
          const rest = step.duration || 30;
          let elapsed = (setsCompleted * (step.reps || 12) * pace) + (setsCompleted * rest) + (repsCompleted * pace);
          if (repSubPhase === 'rest') {
            elapsed += (rest - timeLeft);
          }
          return sum + elapsed;
        } else if (step.stepFormat === 'audio-loop') {
          return sum + (currentRep * 3); // estimated loop length
        }
        return sum + (step.duration - timeLeft);
      }
      return sum;
    }, 0);
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onClose(true, minutes);
  };

  const handleExit = () => {
    if (phase === 'setup') {
      onClose(false, 0);
    } else {
      setShowExitModal(true);
    }
  };

  if (isFinished) {
    const totalMinutes = Math.max(1, Math.round(steps.reduce((sum, s) => sum + getStepDuration(s), 0) / 60));
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
      className="fixed inset-0 z-50 bg-background text-on-surface grid-bg flex flex-col justify-between p-6 md:p-12 select-none overflow-y-auto"
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
          onClick={handleExit}
          className="p-3 bg-surface-container hover:bg-surface-container-high hover:text-error border border-outline-variant/30 text-on-surface-variant rounded-full transition-all cursor-pointer"
          title={phase === 'setup' ? "Cancel" : "Exit timer"}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Content wrapper with AnimatePresence */}
      <AnimatePresence mode="wait">
        {phase === 'setup' ? (
          <motion.main
            key="setup-phase"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-8"
          >
            {/* Title */}
            <span className="inline-block px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary-container bg-primary-container/15 rounded-full border border-primary-container/25 mb-6">
              Environment Setup
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface text-center mb-2 font-sans">
              Prepare Your Space
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant text-center max-w-lg mb-6 leading-relaxed font-sans px-4">
              Prepare your environment for maximum efficiency before commencing <strong>{routine.name}</strong>.
            </p>

            {/* Routine Overview Section */}
            <div className="bg-surface-container/25 border border-outline-variant/15 rounded-2xl p-4 w-full max-w-md mb-6 font-sans text-xs">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00f0ff]">
                  Routine Sequence Overview
                </span>
                <span className="font-mono text-outline-variant">
                  {steps.length} steps • {Math.round(steps.reduce((sum, s) => sum + getStepDuration(s), 0) / 60)} minutes
                </span>
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {steps.map((step, idx) => (
                  <div key={step.id || idx} className="flex justify-between text-on-surface-variant">
                    <span className="truncate pr-4">
                      {idx + 1}. {step.name}
                    </span>
                    <span className="font-mono text-[10px] shrink-0">
                      {step.stepFormat === 'reps' 
                        ? `${step.sets || 1}s x ${step.reps || 12}r` 
                        : step.stepFormat === 'audio-loop'
                          ? `${step.reps || 21} loops`
                          : formatTime(step.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Card */}
            <div className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl p-6 w-full max-w-md mb-8 backdrop-blur-md relative overflow-hidden">
              {/* Optional neon accent light on top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />

              {checklist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline-variant mb-4 border border-outline-variant/10">
                    <ClipboardCheck className="w-8 h-8 text-[#00f0ff]/60" />
                  </div>
                  <h3 className="text-sm font-sans font-bold text-on-surface mb-1">No Environment Checks</h3>
                  <p className="text-xs text-on-surface-variant max-w-xs font-sans">
                    No environmental checklist items are configured for this routine. Feel free to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress Indicator */}
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-on-surface-variant">Preparation Progress</span>
                    <span className="font-bold text-[#00f0ff]">
                      {checklist.filter((item) => item.checked).length} of {checklist.length} ready
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-4 border border-outline-variant/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#00f0ff] to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(checklist.filter((item) => item.checked).length / checklist.length) * 100}%`
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Checklist List */}
                  <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                    {checklist.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleRoutineCheck(routine.id, item.id)}
                        className="flex items-center gap-3.5 w-full text-left p-3 rounded-xl bg-surface-container-low/55 border border-outline-variant/20 hover:border-[#00f0ff]/30 hover:bg-surface-container transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            item.checked
                              ? 'bg-[#00f0ff] border-[#00f0ff] text-black shadow-lg shadow-cyan-500/20'
                              : 'border-outline-variant group-hover:border-[#00f0ff]/50 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span
                          className={`text-sm font-sans font-medium transition-all ${
                            item.checked
                              ? 'text-on-surface/50 line-through'
                              : 'text-on-surface'
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Glowing start button */}
            <button
              onClick={() => {
                setPhase('timer');
                setIsPlaying(true);
              }}
              className="bg-[#00f0ff] text-black font-sans font-bold text-sm px-10 py-4 rounded-xl hover:bg-white transition-all active:scale-95 cursor-pointer glow-button shadow-cyan-500/10 flex items-center gap-2 group"
            >
              Ready to Begin
              <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.main>
        ) : (
          <motion.main
            key="timer-phase"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-8"
          >
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

              {/* Central Display Widget */}
              <div className="flex flex-col items-center justify-center z-10 text-center px-4">
                {currentStep.stepFormat === 'reps' ? (
                  repSubPhase === 'work' ? (
                    <>
                      <span className="font-mono text-[72px] md:text-[84px] font-extrabold leading-none tracking-tighter text-[#00f0ff]">
                        {currentRep}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] text-outline font-mono uppercase mt-1 font-semibold">
                        Rep {currentRep} of {currentStep.reps || 12}
                      </span>
                      <span className="text-[11px] text-[#dae2fd] font-sans mt-2 font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        Set {currentSet} of {currentStep.sets || 1}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-[64px] md:text-[72px] font-extrabold leading-none tracking-tighter text-indigo-400">
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] text-outline font-mono uppercase mt-1 font-semibold">
                        Set Rest
                      </span>
                      <span className="text-[11px] text-indigo-300 font-sans mt-2 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        Next Set Starting
                      </span>
                    </>
                  )
                ) : currentStep.stepFormat === 'audio-loop' ? (
                  <>
                    <span className="font-mono text-[72px] md:text-[84px] font-extrabold leading-none tracking-tighter text-[#00f0ff]">
                      {currentRep}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] text-outline font-mono uppercase mt-1 font-semibold">
                      Loop {currentRep} of {currentStep.reps || 21}
                    </span>
                    <span className="text-[11px] text-teal-300 font-sans mt-2 font-bold px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 animate-pulse">
                      Playing Mantra
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[64px] md:text-[72px] font-extrabold leading-none tracking-tighter text-[#00f0ff]">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] text-outline font-mono uppercase mt-1 font-semibold">
                      Remaining
                    </span>
                  </>
                )}
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
          </motion.main>
        )}
      </AnimatePresence>

      {/* Up Next Preview Slot Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 select-none">
        <div className="bg-surface-container-high/60 border border-outline-variant/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-mono uppercase text-outline tracking-wider font-semibold mb-1">
              {phase === 'setup' ? 'First Step' : 'Up Next'}
            </span>
            <span className="text-sm font-sans font-bold text-[#dae2fd]">
              {phase === 'setup' 
                ? (steps[0]?.name || 'Routine Sequence')
                : (nextStep ? nextStep.name : 'Routine Conclusion')}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-primary-container/80 tracking-wide bg-primary-container/10 border border-primary-container/15 px-2.5 py-1 rounded">
            {phase === 'setup'
              ? formatTime(steps[0] ? getStepDuration(steps[0]) : 0)
              : (nextStep ? formatTime(getStepDuration(nextStep)) : '00:00')}
          </span>
        </div>
      </footer>

      {/* Confirmation Modal for Session Exit */}
      <ConfirmationModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          onClose(false, 0); // Exits without logging/history
        }}
        title="End Practice Session?"
        message="Are you sure you want to end this session early? Your progress for this session will not be saved or recorded in history."
        confirmText="End Session"
        cancelText="Resume"
        type="warning"
      />
    </motion.div>
  );
}
