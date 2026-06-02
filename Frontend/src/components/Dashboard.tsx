import { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Clipboard, CheckSquare, Dumbbell, Award, Flame, Zap, Check } from 'lucide-react';
import { Routine, ChecklistItem, User } from '../types';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';

interface DashboardProps {
  user: User | null;
  routines: Routine[];
  onToggleRoutineCheck: (routineId: string, itemId: string) => void;
  onStartRoutine: (routine: Routine) => void;
  onNavigate: (screen: any) => void;
  streakDays: number;
}

export default function Dashboard({
  user,
  routines,
  onToggleRoutineCheck,
  onStartRoutine,
  onNavigate,
  streakDays,
}: DashboardProps) {

  // Let's keep a state of the currently selected routine for the checklist
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(routines[0]?.id || '');

  // Find selected routine
  const selectedRoutine = routines.find(r => r.id === selectedRoutineId) || routines[0];
  const activeChecklist = selectedRoutine?.checklist || [];

  // Sort routines to get some quick starters
  const quickStarters = routines.slice(0, 3);

  // Math totals
  const checkedCount = activeChecklist.filter((item) => item.checked).length;
  const listPercent = activeChecklist.length > 0 ? Math.round((checkedCount / activeChecklist.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-7xl mx-auto w-full select-none"
    >
      {/* Greetings Header block */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-on-surface">
            Welcome back, {user ? user.name : 'focus conductor'}
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-1.5 leading-normal">
            Your timing workspace is active and calibrated.
          </p>
        </div>

        {/* Dynamic Streak Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-[#eac324]/10 border border-orange-500/20 rounded-xl">
          <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
          <div className="text-left">
            <span className="block text-[9px] font-mono uppercase text-[#ff8e3c] font-bold">
              Practice Streak
            </span>
            <span className="text-sm font-mono font-bold text-on-surface leading-none">
              {streakDays} Days Solid
            </span>
          </div>
        </div>
      </header>

      {/* Main split dashboard segments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* LEFT COLUMN: Quick Stats & Quick Start Grid */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Promo premium upgrade banner or focus reminder */}
          <div className="bg-gradient-to-r from-surface-container-high/60 via-indigo-950/20 to-surface-container-high/60 border border-outline-variant/35 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Visual background circle glow */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/20 text-[9px] font-mono text-primary-container uppercase tracking-wider font-bold">
                CONDUCTOR TIPS
              </span>
              <h3 className="font-sans font-bold text-lg text-on-surface leading-snug">
                Audio Cues protect cognitive energy
              </h3>
              <p className="text-xs font-sans text-on-surface-variant max-w-md leading-relaxed">
                Looking at a phone screen releases a pulse of dopamine that halts flow. When performing breathwork or stretches, relying completely on the chimes prevents mental friction.
              </p>
            </div>

            <button 
              onClick={() => onNavigate('settings')} 
              className="bg-primary-container/10 border border-primary-container/20 hover:border-primary-container text-primary-container hover:text-white font-sans font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Configure Chimes
            </button>
          </div>

          {/* My Routines & Example Sequences Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
              <h3 className="text-xs font-mono font-bold tracking-widest text-[#849495] uppercase">
                Active Sequences
              </h3>
              <button 
                onClick={() => onNavigate('routines')} 
                className="text-xs font-mono text-primary-container hover:text-white hover:underline flex items-center gap-1"
              >
                Manage All →
              </button>
            </div>

            <div className="space-y-4">
              {/* User routines section */}
              {(() => {
                const userOnlyRoutines = routines.filter(
                  (r) => 
                    !DEFAULT_ROUTINES.some((dr) => dr.id === r.id) &&
                    !DEFAULT_ROUTINES.some((dr) => dr.name.toLowerCase() === r.name.toLowerCase())
                );
                if (userOnlyRoutines.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono tracking-wider text-outline uppercase font-bold">
                      My Custom Routines ({userOnlyRoutines.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userOnlyRoutines.slice(0, 4).map((routine) => (
                      <div
                        key={routine.id}
                        onClick={() => onStartRoutine(routine)}
                        className="bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/40 p-4.5 rounded-2xl flex justify-between items-center group cursor-pointer transition-all duration-300 hover:translate-y-[-1px]"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-outline block mb-1">
                            {routine.category}
                          </span>
                          <h4 className="font-sans font-bold text-[16px] text-on-surface truncate group-hover:text-primary-container transition-colors">
                            {routine.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant mt-1 font-mono truncate">
                            {routine.steps.length} Steps • {Math.round(routine.steps.reduce((sum, s) => sum + s.duration, 0) / 60)}m
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartRoutine(routine); }}
                          className="p-2.5 bg-surface-container-highest rounded-full text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors cursor-pointer shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              {/* Preconfigured Example routines section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-wider text-[#ffe179] uppercase font-bold">
                    Preconfigured Examples
                  </span>
                  <Sparkles className="w-3 h-3 text-[#eac324]/80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_ROUTINES.map((routine) => {
                    const totalSec = routine.steps.reduce((sum, s) => sum + s.duration, 0);
                    const totalMin = Math.round(totalSec / 60) || 1;
                    return (
                      <div
                        key={`dash-pre-${routine.id}`}
                        onClick={() => onStartRoutine({ ...routine, isPreconfigured: true })}
                        className="bg-surface-container-low/40 border border-[#eac324]/10 hover:border-[#eac324]/30 p-4.5 rounded-2xl flex justify-between items-center group cursor-pointer transition-all duration-300 hover:translate-y-[-1px]"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#ffe179]/70 block mb-1">
                            {routine.category}
                          </span>
                          <h4 className="font-sans font-bold text-[16px] text-on-surface truncate group-hover:text-[#ffe179] transition-colors">
                            {routine.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant mt-1 font-mono truncate">
                            {routine.steps.length} Steps • {totalMin}m
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onStartRoutine({ ...routine, isPreconfigured: true }); }}
                          className="p-2.5 bg-surface-container-highest rounded-full text-[#ffe179] group-hover:bg-[#eac324]/20 transition-colors cursor-pointer shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Environment checklist shortcut & Quick Action card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: ENVIRONMENT CONSOLE INTEGRITY CHECK */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative">
            <div className="border-b border-outline-variant/25 pb-4 mb-5 flex flex-col gap-3">
              <h3 className="text-[10px] font-mono font-bold tracking-widest text-[#849495] uppercase">
                Environment Setup
              </h3>
              
              {/* Routine selector dropdown */}
              <div className="relative">
                <select
                  value={selectedRoutineId || (routines[0]?.id || '')}
                  onChange={(e) => setSelectedRoutineId(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/35 text-on-surface font-sans font-semibold text-xs rounded-xl px-3 py-2 cursor-pointer outline-none focus:border-primary-container"
                >
                  {routines.map((r) => (
                    <option key={r.id} value={r.id} className="bg-surface-container-high">
                      {r.name} Checklist
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-xs text-on-surface-variant font-sans">
                Calibration Checklist
              </span>
              <span className="text-xs font-mono font-bold text-primary-container border border-primary-container/20 bg-primary-container/5 px-2 py-0.5 rounded">
                {listPercent}% Ready
              </span>
            </div>

            <div className="space-y-4">
              {activeChecklist.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-2 font-sans">
                  No environment constraints set for this sequence.
                </p>
              ) : (
                activeChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => selectedRoutine && onToggleRoutineCheck(selectedRoutine.id, item.id)}
                    className="flex items-start gap-3 cursor-pointer group select-none"
                  >
                    <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      item.checked
                        ? 'bg-primary-container border-primary-container text-on-primary-container'
                        : 'border-outline-variant group-hover:border-primary-container'
                    }`}>
                      {item.checked && <Check className="w-3.5 h-3.5 stroke-[3.5px] text-black" />}
                    </div>
                    <span className={`text-xs font-sans transition-colors ${
                      item.checked ? 'text-on-surface line-through opacity-50' : 'text-on-surface-variant group-hover:text-on-surface'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Customization Callout */}
          <div 
            onClick={() => onNavigate('profile')}
            className="bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/40 rounded-2xl p-6 text-center space-y-4 cursor-pointer transition-all hover:translate-y-[-1px] group"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5 text-primary-fixed-dim" />
            </div>
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-sm text-on-surface group-hover:text-primary-container transition-colors">Conductor Profile</h4>
              <p className="text-[11px] font-mono text-outline uppercase tracking-wider">
                {user ? user.email : 'guest@timings.app'}
              </p>
            </div>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
              Analyze your logged practice focus sessions, check streaks, and explore milestones directly inside your conductor statistics dashboard.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
