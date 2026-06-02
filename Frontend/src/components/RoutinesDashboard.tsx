import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Play, Edit2, Trash2, Library, Sparkles, Mic, Copy } from 'lucide-react';
import { Routine } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';

interface RoutinesDashboardProps {
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (id: string) => void;
  onCreateRoutine: () => void;
  onEditVoice: (routine: Routine) => void;
  onCustomize: (routine: Routine) => void;
}

export default function RoutinesDashboard({
  routines,
  onStartRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onCreateRoutine,
  onEditVoice,
  onCustomize,
}: RoutinesDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const categories = ['All', 'Focus', 'Workout', 'Morning', 'Flexibility'];

  const getDurationString = (steps: any[]) => {
    const totalSeconds = steps.reduce((sum, step) => sum + step.duration, 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    let res = '';
    if (h > 0) res += `${h}h `;
    if (m > 0) res += `${m}m `;
    if (s > 0 && h === 0) res += `${s}s`;
    return res.trim() || '0s';
  };

  const filteredRoutines = routines
    .filter((curr) => 
      !DEFAULT_ROUTINES.some((dr) => dr.id === curr.id) &&
      !DEFAULT_ROUTINES.some((dr) => dr.name.toLowerCase() === curr.name.toLowerCase())
    )
    .filter((curr) => {
      const matchesSearch = curr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            curr.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'All' || curr.category.toLowerCase() === activeFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });

  // Preconfigured routines are always shown (mark them so card can disable actions)
  const preconfiguredRoutines: Routine[] = DEFAULT_ROUTINES.map(dr => {
    const userVersion = routines.find(r => r.id === dr.id);
    if (userVersion) {
      return { ...userVersion, isPreconfigured: true };
    }
    return { ...dr, isPreconfigured: true };
  });
  const filteredPreconfigured = preconfiguredRoutines.filter((curr) => {
    const matchesSearch = curr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          curr.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilter === 'All' || curr.category.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-7xl mx-auto w-full select-none"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-on-surface">
            My Routines
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-1.5">
            Manage and execute your precise sequences.
          </p>
        </div>
        
        <button
          onClick={onCreateRoutine}
          className="inline-flex items-center justify-center gap-2 bg-primary-container hover:bg-white text-on-primary-container font-sans font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer glow-button shadow-cyan-500/10 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mb-8">
        <div className="relative w-full xl:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant/70 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search routines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl pl-10 pr-4 py-3 placeholder-on-surface-variant/40 text-sm font-sans outline-none text-on-surface transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 font-sans overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeFilter === cat
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                  : 'bg-surface-container border border-outline-variant/35 text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredRoutines.map((routine) => {
            const stepsCount = routine.steps.length;
            const durationStr = getDurationString(routine.steps);
            
            const badgeColors = 
              routine.category.toLowerCase() === 'focus' ? 'bg-[#3131c0]/40 text-[#c0c1ff] border-[#3131c0]/60' :
              routine.category.toLowerCase() === 'workout' ? 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/60' :
              routine.category.toLowerCase() === 'morning' ? 'bg-[#eac324]/15 text-[#ffe179] border-[#eac324]/30' :
              'bg-surface-container-highest text-on-surface-variant border-outline-variant/35';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={routine.id}
                className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col justify-between hover:border-primary-container/40 transition-all duration-300 group hover:translate-y-[-2px] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-container/5 transition-colors group-hover:bg-primary-container/30"></div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 border rounded-lg ${badgeColors}`}>
                        {routine.category}
                      </span>
                      {routine.lastExecuted && (
                        <span className="text-[10px] font-mono text-[#849495] bg-surface-container border border-outline-variant/20 rounded-lg px-2.5 py-[3px]">
                          Last: {routine.lastExecuted}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      {routine.steps.some((s) => s.stepFormat === 'audio-loop') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditVoice(routine);
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-[#00f0ff] rounded-lg transition-colors cursor-pointer"
                          title="Configure Voice Cues"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }}
                        className="p-1.5 text-on-surface-variant hover:text-primary-container rounded-lg transition-colors cursor-pointer"
                        title="Edit routine"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRoutineToDelete(routine.id); }}
                        className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors cursor-pointer"
                        title="Delete routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-sans font-bold text-[21px] text-on-surface tracking-tight mb-2 leading-snug group-hover:text-primary-container transition-colors">
                    {routine.name}
                  </h3>
                  
                  <p className="text-sm font-sans text-on-surface-variant line-clamp-2 leading-relaxed mb-6">
                    {routine.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-5">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-mono tracking-wider text-[#849495] uppercase font-bold leading-none">
                        Duration
                      </span>
                      <span className="block text-xs font-mono font-bold text-on-surface leading-none">
                        {durationStr}
                      </span>
                    </div>
                    
                    <div className="h-6 w-[1px] bg-outline-variant/20 self-center"></div>
                    
                    <div className="space-y-1">
                      <span className="block text-[10px] font-mono tracking-wider text-[#849495] uppercase font-bold leading-none">
                        Steps
                      </span>
                      <span className="block text-xs font-mono font-bold text-on-surface leading-none">
                        {stepsCount} step{stepsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartRoutine(routine)}
                    className="p-3.5 bg-primary-container hover:bg-white text-on-primary-container rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-90 group-hover:scale-105"
                    title="Run routine"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            layout
            onClick={onCreateRoutine}
            className="border-2 border-dashed border-outline-variant/35 hover:border-primary-container/65 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low/20 transition-all duration-200 group min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant group-hover:text-primary-container group-hover:border-primary-container/60 transition-all mb-4">
              <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
            </div>
            <h3 className="font-sans font-bold text-[19px] text-on-surface group-hover:text-primary-container transition-colors mb-1">
              Blank Canvas
            </h3>
            <p className="text-xs font-sans text-on-surface-variant max-w-[200px] leading-relaxed">
              Start a new sequence from scratch.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Preconfigured Example Routines ─── */}
      <div className="mt-14">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-4 h-4 text-[#eac324]/80" />
          <h2 className="text-lg font-bold font-sans tracking-tight text-on-surface">
            Preconfigured Routines
          </h2>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-[#eac324]/10 text-[#ffe179] border border-[#eac324]/25 rounded-lg">
            Examples
          </span>
        </div>
        <p className="text-sm font-sans text-on-surface-variant mb-8 -mt-3">
          Ready-to-use routines curated for everyone. Start one directly or use it as inspiration for your own.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPreconfigured.map((routine) => {
              const stepsCount = routine.steps.length;
              const durationStr = getDurationString(routine.steps);

              const badgeColors =
                routine.category.toLowerCase() === 'focus' ? 'bg-[#3131c0]/40 text-[#c0c1ff] border-[#3131c0]/60' :
                routine.category.toLowerCase() === 'workout' ? 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/60' :
                routine.category.toLowerCase() === 'morning' ? 'bg-[#eac324]/15 text-[#ffe179] border-[#eac324]/30' :
                'bg-surface-container-highest text-on-surface-variant border-outline-variant/35';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={`preconfigured-${routine.id}`}
                  className="bg-surface-container-low/60 border border-[#eac324]/15 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group hover:border-[#eac324]/35 hover:translate-y-[-2px] relative overflow-hidden"
                >
                  {/* Golden accent top bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#eac324]/15 transition-colors group-hover:bg-[#eac324]/40"></div>

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 border rounded-lg ${badgeColors}`}>
                          {routine.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-[#eac324]/10 text-[#ffe179] border border-[#eac324]/25 rounded-lg flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Preconfigured
                        </span>
                      </div>
                    </div>

                    <h3 className="font-sans font-bold text-[21px] text-on-surface tracking-tight mb-2 leading-snug group-hover:text-[#ffe179] transition-colors">
                      {routine.name}
                    </h3>

                    <p className="text-sm font-sans text-on-surface-variant line-clamp-2 leading-relaxed mb-6">
                      {routine.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#eac324]/10 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-5">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-mono tracking-wider text-[#849495] uppercase font-bold leading-none">
                          Duration
                        </span>
                        <span className="block text-xs font-mono font-bold text-on-surface leading-none">
                          {durationStr}
                        </span>
                      </div>

                      <div className="h-6 w-[1px] bg-outline-variant/20 self-center"></div>

                      <div className="space-y-1">
                        <span className="block text-[10px] font-mono tracking-wider text-[#849495] uppercase font-bold leading-none">
                          Steps
                        </span>
                        <span className="block text-xs font-mono font-bold text-on-surface leading-none">
                          {stepsCount} step{stepsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onCustomize(routine); }}
                        className="p-3.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-90 group-hover:scale-105 border border-outline-variant/35"
                        title="Customize template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {routine.steps.some(s => s.stepFormat === 'audio-loop') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditVoice(routine); }}
                          className="p-3.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-90 group-hover:scale-105 border border-[#00f0ff]/25"
                          title="Configure Voice Cues"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onStartRoutine(routine)}
                        className="p-3.5 bg-[#eac324]/15 hover:bg-[#eac324]/30 text-[#ffe179] rounded-full transition-all duration-200 cursor-pointer shadow-lg active:scale-90 group-hover:scale-105 border border-[#eac324]/25"
                        title="Run this preconfigured routine"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredPreconfigured.length === 0 && (searchQuery || activeFilter !== 'All') && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant border-2 border-dashed border-[#eac324]/15 rounded-2xl">
            <Sparkles className="w-8 h-8 text-[#eac324]/30 mb-2" />
            <p className="text-sm font-sans font-medium">No preconfigured routines match your filters.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Routine Deletion */}
      <ConfirmationModal
        isOpen={routineToDelete !== null}
        onClose={() => setRoutineToDelete(null)}
        onConfirm={() => {
          if (routineToDelete) {
            onDeleteRoutine(routineToDelete);
          }
        }}
        title="Delete Routine"
        message="Are you sure you want to permanently delete this routine? This action will delete the routine and all its configuration."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </motion.div>
  );
}
