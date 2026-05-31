import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, Clock, Calendar, Check, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { SessionHistoryItem } from '../types';

interface HistoryDashboardProps {
  history: SessionHistoryItem[];
  onClearHistory: () => void;
  onAddSimulatedHistory: (item: SessionHistoryItem) => void;
}

export default function HistoryDashboard({
  history,
  onClearHistory,
  onAddSimulatedHistory,
}: HistoryDashboardProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Hardcode weekly hours stats matching image 4 mockup exactly
  const weeklyActivityData = [
    { day: 'Mon', h: 2.2, pct: 60 },
    { day: 'Tue', h: 3.8, pct: 100 },
    { day: 'Wed', h: 1.4, pct: 40 },
    { day: 'Thu', h: 3.2, pct: 85 },
    { day: 'Fri', h: 2.9, pct: 75 },
    { day: 'Sat', h: 0.1, pct: 5 },
    { day: 'Sun', h: 0.4, pct: 12 },
  ];

  // Derive stats dynamically based on the history log
  const totalSessionsCount = history.length;
  const avgCompletionPct = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + item.completionRate, 0) / history.length)
    : 0;
  const totalHoursCount = history.length > 0
    ? parseFloat((history.reduce((sum, item) => sum + item.durationMinutes, 0) / 60).toFixed(1))
    : 0;

  const triggerMockAddition = () => {
    const templates = [
      { name: 'Kettlebell HIIT', dur: 45, compl: 100 },
      { name: 'Sunrise Activation', dur: 25, compl: 100 },
      { name: 'Deep Work Block', dur: 90, compl: 100 },
      { name: 'Quick Stretching', dur: 15, compl: 80 },
    ];
    const picked = templates[Math.floor(Math.random() * templates.length)];
    const mockItem: SessionHistoryItem = {
      id: `hist-sim-${Date.now()}`,
      routineName: picked.name,
      timestamp: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
      durationMinutes: picked.dur,
      completionRate: picked.compl,
    };
    onAddSimulatedHistory(mockItem);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-7xl mx-auto w-full select-none"
    >
      {/* Header section with console triggers */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-on-surface flex items-center gap-2">
            Session History
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-1.5 leading-normal">
            Track your consistency and rhythm over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerMockAddition}
            className="inline-flex items-center justify-center gap-1.5 border border-outline-variant/50 hover:border-primary-container px-4 py-2.5 rounded-xl font-mono text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-container" /> Simulate Log
          </button>
          
          <button
            disabled={history.length === 0}
            onClick={onClearHistory}
            className="inline-flex items-center justify-center gap-1.5 border border-error/20 hover:border-error/50 disabled:opacity-30 disabled:pointer-events-none px-4 py-2.5 rounded-xl font-mono text-xs text-error hover:bg-error/5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Performance Tonal Stats Grid (Mockup 4 Top side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Card 1: TOTAL SESSIONS */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary-container/20"></div>
          <span className="block text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold mb-1">
            Total Sessions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-extrabold text-[#00f0ff]">
              {totalSessionsCount}
            </span>
            <span className="text-xs text-on-surface-variant font-mono">this month</span>
          </div>
        </div>

        {/* Card 2: AVG COMPLETION % */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-secondary/20"></div>
          <span className="block text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold mb-1">
            Avg Completion %
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-extrabold text-secondary">
              {avgCompletionPct}%
            </span>
            <span className="text-xs text-on-surface-variant font-mono">this month</span>
          </div>
        </div>

        {/* Card 3: TOTAL HOURS */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-tertiary-fixed-dim/20"></div>
          <span className="block text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold mb-1">
            Total Hours
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-extrabold text-tertiary-fixed">
              {totalHoursCount}
            </span>
            <span className="text-xs text-on-surface-variant font-mono">this month</span>
          </div>
        </div>
      </div>

      {/* Weekly Activity section card custom SVG element (Mockup 4 center) */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 mb-8 select-none">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans font-bold text-lg text-on-surface">
            Weekly Activity
          </h3>
          <span className="text-xs font-mono font-bold text-primary-container bg-primary-container/10 border border-primary-container/15 px-3 py-1 rounded-full uppercase tracking-wider">
            12.5 hrs this week
          </span>
        </div>

        {/* Custom SVG / Bar graph */}
        <div className="relative pt-6 pb-2 px-2 md:px-12 flex items-end justify-between gap-3 md:gap-8 h-40">
          {weeklyActivityData.map((data, idx) => {
            const isHovered = hoveredBar === idx;
            return (
              <div 
                key={data.day} 
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip on hovering graph bar */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: -12, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      className="absolute bottom-full mb-1 bg-surface-container-highest border border-outline-variant/40 px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap text-primary-container pointer-events-none z-20 shadow-md font-bold"
                    >
                      {data.h} hrs
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Vertical Bar Cylinder matched perfectly with mockup design */}
                <div className="w-full bg-surface-container-high rounded-lg h-24 relative overflow-hidden transition-all duration-200 border border-outline-variant/10 group-hover:border-primary-container/40">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${data.pct}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.6 }}
                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-colors min-h-[4px] ${
                      isHovered 
                        ? 'bg-gradient-to-t from-[#00f0ff] to-cyan-400' 
                        : 'bg-[#00dbe9]/80'
                    }`}
                  />
                </div>

                <span className="block text-xs font-sans font-medium text-on-surface-variant mt-2 tracking-wide uppercase">
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session entries list block */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold tracking-widest text-[#849495] uppercase mb-4">
          All Session Logs ({history.length} Log{history.length !== 1 ? 's' : ''})
        </h3>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {history.map((item) => {
              const isPerfect = item.completionRate >= 100;

              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  key={item.id}
                  className="bg-surface-container-low border border-outline-variant/25 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-outline-variant/65 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Visual check state */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isPerfect 
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' 
                        : 'bg-surface-container-highest border-outline-variant/40 text-on-surface-variant'
                    }`}>
                      {isPerfect ? <Check className="w-5 h-5 stroke-[3px]" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div>
                      <h4 className="font-sans font-bold text-[17px] text-on-surface tracking-tight">
                        {item.routineName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#849495]">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant/50" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & stats column */}
                  <div className="flex items-center gap-4 shrink-0 sm:self-center">
                    <div className="text-right flex items-center gap-4">
                      <div className="hidden sm:block">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-outline font-semibold mb-0.5">
                          Duration
                        </span>
                        <span className="text-sm font-mono font-bold text-on-surface">
                          {item.durationMinutes} min
                        </span>
                      </div>

                      {/* Pill indicator badge formatted neatly */}
                      <span className={`inline-block px-3 py-1 font-mono text-[10px] font-bold uppercase rounded-lg border tracking-wide whitespace-nowrap ${
                        isPerfect
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/40'
                      }`}>
                        {item.completionRate}% {isPerfect ? 'Complete' : 'Partial'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant border-2 border-dashed border-outline-variant/20 rounded-2xl bg-[#131b2e]/10">
              <Zap className="w-10 h-10 text-outline-variant/60 mb-2" />
              <p className="text-sm font-sans font-medium">No sessions logged yet.</p>
              <button 
                onClick={triggerMockAddition}
                className="text-xs font-mono text-primary-container underline mt-1.5 hover:text-white"
              >
                Log a simulated practice run now
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
