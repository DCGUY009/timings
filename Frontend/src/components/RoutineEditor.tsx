import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, GripVertical, Save, ArrowLeft, Check, Play, ChevronUp, ChevronDown, Mic, Square, Pause } from 'lucide-react';
import { Routine, PracticeStep, CueType, StepType, ChecklistItem } from '../types';
import { DEFAULT_CHECKLIST } from '../data/defaultRoutines';
import { generateUniqueId } from '../utils/uniqueId';

interface RoutineEditorProps {
  routine: Routine | null; // null means "Create New"
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

export default function RoutineEditor({ routine, onSave, onCancel }: RoutineEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Flexibility');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [steps, setSteps] = useState<PracticeStep[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [customCheckText, setCustomCheckText] = useState('');
  const [tickingSoundEnabled, setTickingSoundEnabled] = useState(true);

  // Loaded state
  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setDescription(routine.description || '');
      
      const defaultCats = ['Focus', 'Morning', 'Workout', 'Flexibility'];
      const currentCat = routine.category || 'Focus';
      if (defaultCats.includes(currentCat)) {
        setCategory(currentCat);
        setIsCustomCategory(false);
        setCustomCategoryInput('');
      } else {
        setCategory('custom');
        setIsCustomCategory(true);
        setCustomCategoryInput(currentCat);
      }

      setSteps([...routine.steps]);
      setTickingSoundEnabled(routine.tickingSoundEnabled !== false);
      
      if (routine.checklist) {
        setChecklist([...routine.checklist]);
      } else {
        setChecklist([...DEFAULT_CHECKLIST]);
      }
    } else {
      // Create empty/blank canvas
      setName('New Routine');
      setDescription('Routine description details here.');
      setCategory('Focus');
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setTickingSoundEnabled(true);
      setSteps([
        {
          id: generateUniqueId('step'),
          name: 'First Step',
          description: 'Add step description...',
          duration: 60, // 1 min
          cue: 'single-chime',
          type: 'work'
        }
      ]);
      setChecklist([]);
    }
  }, [routine]);

  // Persist Checklist to state
  const handleToggleCheck = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCheckText.trim()) return;
    const newItem: ChecklistItem = {
      id: generateUniqueId('ec-custom'),
      label: customCheckText.trim(),
      checked: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setCustomCheckText('');
  };

  // Step operations
  const handleAddStep = () => {
    const newStep: PracticeStep = {
      id: generateUniqueId('step'),
      name: `Step ${steps.length + 1}`,
      description: 'Add instructions...',
      duration: 60,
      cue: 'single-chime',
      type: 'work'
    };
    setSteps([...steps, newStep]);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) return; // Prevent deleting the last step
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleUpdateStep = (id: string, updates: Partial<PracticeStep>) => {
    setSteps(
      steps.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // Reordering steps with precise arrows
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const updatedSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    // Swap
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[targetIndex];
    updatedSteps[targetIndex] = temp;
    setSteps(updatedSteps);
  };

  // Duration parsers & formatting helpers
  const formatTimeDigital = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate stats dynamically based on format
  const getStepDuration = (s: PracticeStep) => {
    if (s.stepFormat === 'reps') {
      const sets = s.sets || 1;
      const reps = s.reps || 12;
      const repPace = s.repPace || 3.0;
      const rest = s.duration; // set rest stored in duration
      return Math.round((sets * reps * repPace) + ((sets - 1) * rest));
    } else if (s.stepFormat === 'audio-loop') {
      // Estimate 3 seconds per loop for statistics
      return (s.reps || 21) * 3;
    }
    return s.duration;
  };

  const totalDuration = steps.reduce((sum, s) => sum + getStepDuration(s), 0);
  const totalWork = steps.filter((s) => s.type !== 'rest').reduce((sum, s) => {
    if (s.stepFormat === 'reps') {
      const sets = s.sets || 1;
      const reps = s.reps || 12;
      const repPace = s.repPace || 3.0;
      return sum + Math.round(sets * reps * repPace);
    }
    return sum + (s.stepFormat === 'audio-loop' ? getStepDuration(s) : s.duration);
  }, 0);
  const totalRest = steps.reduce((sum, s) => {
    if (s.type === 'rest') {
      return sum + (s.stepFormat === 'audio-loop' ? getStepDuration(s) : s.duration);
    }
    if (s.stepFormat === 'reps') {
      const sets = s.sets || 1;
      const rest = s.duration;
      return sum + Math.round((sets - 1) * rest);
    }
    return sum;
  }, 0);

  const handleSaveRoutine = () => {
    if (!name.trim()) return;

    if (steps.length === 0) {
      alert('A routine must contain at least one step.');
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || 'Custom')
      : category;

    onSave({
      id: routine?.id || `routine-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: finalCategory,
      steps: steps,
      lastExecuted: routine?.lastExecuted || 'Never',
      checklist: checklist,
      tickingSoundEnabled: tickingSoundEnabled
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-7xl mx-auto w-full select-none"
    >
      {/* Upper back Navigation trigger */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm font-mono text-on-surface-variant hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-2px]" />
          Back to Routines
        </button>
      </div>

      {/* Routine Editable Header (Image 1 top) */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-outline-variant/20">
        <div className="w-full md:max-w-xl">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Routine Title"
            className="w-full bg-transparent border-b border-transparent hover:border-outline-variant/40 focus:border-primary-container text-3xl font-bold tracking-tight text-on-surface py-1 outline-none transition-colors"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            className="w-full bg-transparent border-b border-transparent focus:border-primary-container text-sm text-on-surface-variant py-1 outline-none mt-2 transition-colors"
          />
        </div>

        {/* Category Selector wrapped beautifully */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center space-x-3 bg-surface-container border border-outline-variant/35 rounded-xl px-4 py-2 text-xs font-mono">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#849495]">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => {
                const val = e.target.value;
                setCategory(val);
                if (val === 'custom') {
                  setIsCustomCategory(true);
                  if (!customCategoryInput) {
                    setCustomCategoryInput('');
                  }
                } else {
                  setIsCustomCategory(false);
                }
              }}
              className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer text-sm"
            >
              <option value="Focus" className="bg-surface-container-high">Focus</option>
              <option value="Morning" className="bg-surface-container-high">Morning</option>
              <option value="Workout" className="bg-surface-container-high">Workout</option>
              <option value="Flexibility" className="bg-surface-container-high">Flexibility</option>
              <option value="custom" className="bg-surface-container-high text-primary-container">+ Add Custom Category</option>
            </select>
          </div>

          {isCustomCategory && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type custom category..."
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                className="bg-surface-container border border-outline-variant/35 focus:border-primary-container text-xs rounded-xl px-3 py-2 outline-none font-sans text-on-surface"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(false);
                  setCategory('Focus');
                }}
                className="text-[10px] font-mono text-outline hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid: Left side has Steps list. Right side has Summary + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* LEFT COLUMN: Routine Steps (lg:span-8) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-outline uppercase mb-2">
            Practice Sequence ({steps.length} Step{steps.length !== 1 ? 's' : ''})
          </h2>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const minutes = Math.floor(step.duration / 60);
              const seconds = step.duration % 60;

              return (
                <div
                  key={step.id}
                  className={`bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 md:p-5 flex items-center justify-between gap-4 transition-all duration-300 relative group ${
                    step.type === 'rest' ? 'bg-indigo-950/15 border-indigo-900/30' : ''
                  }`}
                >
                  {/* Left Grip Handle with micro ordering keys */}
                  <div className="flex items-col flex-col items-center">
                    <div className="p-1 text-on-surface-variant/40 group-hover:text-primary-container transition-colors">
                      <GripVertical className="w-5.5 h-5.5" />
                    </div>
                    {/* Quick helper order arrows */}
                    <div className="flex flex-col text-on-surface-variant/20 group-hover:text-on-surface-variant/60">
                      <button
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="hover:text-primary-container disabled:opacity-20 cursor-pointer p-0.5"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="hover:text-primary-container disabled:opacity-20 cursor-pointer p-0.5"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Editable inputs */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Name input */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {step.type === 'rest' && (
                            <span className="bg-secondary-container/40 text-on-secondary-container border border-secondary-container/60 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                              Rest
                            </span>
                          )}
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                            placeholder="Step Title"
                            className="bg-transparent border-b border-transparent focus:border-primary-container font-sans font-bold text-base text-on-surface w-full py-0.5 outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                          placeholder="Add instructions..."
                          className="bg-transparent text-xs text-on-surface-variant w-full outline-none"
                        />
                      </div>

                      {/* Time selector (Hours:Mins block in Monospace matching digital inputs in Image 1) */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        {step.stepFormat !== 'audio-loop' && (
                          <div className="bg-surface-container border border-outline-variant/45 rounded-lg px-3 py-1.5 flex flex-col items-center">
                            <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                              {step.stepFormat === 'reps' ? 'Set Rest' : 'Duration'}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-sm font-bold text-primary-container">
                              {/* Minutes */}
                              <select
                                value={minutes}
                                onChange={(e) => {
                                  const newSec = parseInt(e.target.value) * 60 + seconds;
                                  handleUpdateStep(step.id, { duration: newSec });
                                }}
                                className="bg-transparent text-primary-container font-bold border-none outline-none focus:ring-0 cursor-pointer"
                              >
                                {Array.from({ length: 60 }).map((_, i) => (
                                  <option key={i} value={i} className="bg-surface-container-high">{i.toString().padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span>:</span>
                              {/* Seconds */}
                              <select
                                value={seconds}
                                onChange={(e) => {
                                  const newSec = minutes * 60 + parseInt(e.target.value);
                                  handleUpdateStep(step.id, { duration: newSec });
                                }}
                                className="bg-transparent text-primary-container font-bold border-none outline-none focus:ring-0 cursor-pointer"
                              >
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <option key={i * 5} value={i * 5} className="bg-surface-container-high">{(i * 5).toString().padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Cue Picker Selector Block */}
                        <div className="bg-surface-container border border-outline-variant/45 rounded-lg px-3 py-1.5 flex flex-col items-center">
                          <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                            Cue Signal
                          </span>
                          <select
                            value={step.cue}
                            onChange={(e) => handleUpdateStep(step.id, { cue: e.target.value as CueType })}
                            className="bg-transparent text-on-surface font-mono font-bold font-semibold text-[11px] focus:outline-none cursor-pointer outline-none"
                          >
                            <option value="single-chime" className="bg-surface-container-high">Single Chime</option>
                            <option value="double-chime" className="bg-surface-container-high">Double Chime</option>
                            <option value="silent" className="bg-surface-container-high">Silent</option>
                          </select>
                        </div>

                        {/* WORK / REST toggler */}
                        <div className="bg-surface-container border border-outline-variant/45 rounded-lg px-3 py-1.5 flex flex-col items-center select-none">
                          <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                            Type
                          </span>
                          <select
                            value={step.type}
                            onChange={(e) => handleUpdateStep(step.id, { type: e.target.value as StepType })}
                            className="bg-transparent text-on-surface font-mono font-bold font-semibold text-[11px] focus:outline-none cursor-pointer outline-none uppercase"
                          >
                            <option value="work" className="bg-surface-container-high">Work</option>
                            <option value="flow" className="bg-surface-container-high">Flow</option>
                            <option value="interval" className="bg-surface-container-high">Interval</option>
                            <option value="rest" className="bg-surface-container-high">Rest</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* V2 Format Details and Recording block row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-outline-variant/10">
                      {/* Format Selector */}
                      <div className="bg-surface-container border border-outline-variant/35 rounded-lg px-2.5 py-1 flex flex-col items-center">
                        <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                          Format
                        </span>
                        <select
                          value={step.stepFormat || 'duration'}
                          onChange={(e) => {
                            const fmt = e.target.value as any;
                            handleUpdateStep(step.id, { 
                              stepFormat: fmt,
                              sets: step.sets || 1,
                              reps: step.reps || (fmt === 'audio-loop' ? 21 : 12),
                              repPace: step.repPace || 3.0
                            });
                          }}
                          className="bg-transparent text-primary-container font-mono font-bold text-[10px] focus:outline-none cursor-pointer outline-none uppercase"
                        >
                          <option value="duration" className="bg-surface-container-high">Time</option>
                          <option value="reps" className="bg-surface-container-high">Reps</option>
                          <option value="audio-loop" className="bg-surface-container-high">Audio Loop</option>
                        </select>
                      </div>

                      {/* Reps-specific inputs */}
                      {step.stepFormat === 'reps' && (
                        <>
                          <div className="bg-surface-container border border-outline-variant/35 rounded-lg px-2.5 py-1 flex flex-col items-center">
                            <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                              Sets
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={step.sets || 1}
                              onChange={(e) => handleUpdateStep(step.id, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-8 bg-transparent text-center font-mono font-bold text-xs text-on-surface focus:outline-none outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>

                          <div className="bg-surface-container border border-outline-variant/35 rounded-lg px-2.5 py-1 flex flex-col items-center">
                            <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                              Reps/Set
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={step.reps || 12}
                              onChange={(e) => handleUpdateStep(step.id, { reps: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-10 bg-transparent text-center font-mono font-bold text-xs text-on-surface focus:outline-none outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>

                          <div className="bg-surface-container border border-outline-variant/35 rounded-lg px-2.5 py-1 flex flex-col items-center">
                            <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                              Rep Pace
                            </span>
                            <select
                              value={step.repPace || 3.0}
                              onChange={(e) => handleUpdateStep(step.id, { repPace: parseFloat(e.target.value) })}
                              className="bg-transparent text-on-surface font-mono font-bold text-[10px] focus:outline-none cursor-pointer outline-none"
                            >
                              <option value="1" className="bg-surface-container-high">1.0s / rep</option>
                              <option value="1.5" className="bg-surface-container-high">1.5s / rep</option>
                              <option value="2" className="bg-surface-container-high">2.0s / rep</option>
                              <option value="2.5" className="bg-surface-container-high">2.5s / rep</option>
                              <option value="3" className="bg-surface-container-high">3.0s / rep</option>
                              <option value="4" className="bg-surface-container-high">4.0s / rep</option>
                              <option value="5" className="bg-surface-container-high">5.0s / rep</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Audio loop-specific inputs */}
                      {step.stepFormat === 'audio-loop' && (
                        <>
                          <div className="bg-surface-container border border-outline-variant/35 rounded-lg px-2.5 py-1 flex flex-col items-center">
                            <span className="text-[8px] font-mono uppercase text-outline tracking-wider block font-semibold mb-0.5">
                              Loops
                            </span>
                            <input
                              type="number"
                              min="1"
                              value={step.reps || 21}
                              onChange={(e) => handleUpdateStep(step.id, { reps: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-10 bg-transparent text-center font-mono font-bold text-xs text-on-surface focus:outline-none outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>

                          <AudioRecorder
                            audioData={step.audioData}
                            onSaveAudio={(base64) => handleUpdateStep(step.id, { audioData: base64 })}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete trigger */}
                  <button
                    disabled={steps.length <= 1}
                    onClick={() => handleDeleteStep(step.id)}
                    className="p-3 text-on-surface-variant hover:text-error hover:bg-error/10 disabled:opacity-20 rounded-xl transition-colors cursor-pointer"
                    title="Delete step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action buttons under sequence list */}
          <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/15 mt-8">
            <button
              onClick={handleAddStep}
              className="flex items-center justify-center gap-2 border border-outline-variant/60 hover:border-primary-container px-6 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-primary-container" /> Add Step
            </button>

            <button
              onClick={handleSaveRoutine}
              className="flex items-center justify-center gap-2 bg-primary-container text-on-primary-container font-sans font-bold px-8 py-3.5 rounded-xl hover:bg-white cursor-pointer transition-all active:scale-[0.98] glow-button shadow-cyan-500/10"
            >
              <Save className="w-4 h-4 fill-current" /> Save Routine
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary + Checklist (lg:span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Card 1: ROUTINE SUMMARY (Mockup 1 right top) */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 relative">
            <h3 className="text-[10px] font-mono font-bold tracking-widest text-outline uppercase border-b border-outline-variant/25 pb-3.5 mb-5">
              Routine Summary
            </h3>

            <div className="space-y-6">
              <div>
                <span className="block text-xs font-sans text-on-surface-variant/70 mb-1">
                  Total Duration
                </span>
                <span className="font-mono text-4xl font-extrabold text-[#00f0ff] tracking-tight">
                  {formatTimeDigital(totalDuration)}
                </span>
              </div>

              {/* Stats table elements matching mockup */}
              <div className="border-t border-outline-variant/15 pt-4 space-y-2 text-sm font-sans">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Steps</span>
                  <span className="font-mono text-on-surface font-bold">{steps.length}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Work</span>
                  <span className="font-mono text-on-surface font-bold">{formatTimeDigital(totalWork)}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Rest</span>
                  <span className="font-mono text-on-surface font-bold">{formatTimeDigital(totalRest)}</span>
                </div>
              </div>

              {/* Metronome Tick Toggle */}
              <div className="border-t border-outline-variant/15 pt-4 flex items-center justify-between gap-4 text-sm font-sans select-none">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-on-surface block">Metronome Tick</span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5 leading-relaxed">
                    Play quiet clicking metronome sounds during timing run.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTickingSoundEnabled(!tickingSoundEnabled)}
                  className={`w-10 h-6 rounded-full transition-all relative cursor-pointer outline-none shrink-0 ${
                    tickingSoundEnabled ? 'bg-primary-container' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      tickingSoundEnabled ? 'translate-x-[16px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: ENVIRONMENT CHECK (Mockup 1 right bottom) */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
            <h3 className="text-[10px] font-mono font-bold tracking-widest text-outline uppercase border-b border-outline-variant/25 pb-3.5 mb-5">
              Environment Check
            </h3>

            {/* Checklist records */}
            <div className="space-y-4 mb-6">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className="flex items-start gap-3.5 cursor-pointer group"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    item.checked
                      ? 'bg-primary-container border-primary-container text-on-primary-container'
                      : 'border-outline-variant group-hover:border-primary-container'
                  }`}>
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </div>
                  <span className={`text-sm font-sans transition-colors ${
                    item.checked ? 'text-on-surface line-through opacity-50' : 'text-on-surface-variant group-hover:text-on-surface'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* New custom check form */}
            <form onSubmit={handleAddCheckItem} className="flex gap-2 relative border-t border-outline-variant/15 pt-5">
              <input
                type="text"
                placeholder="Add custom check..."
                value={customCheckText}
                onChange={(e) => setCustomCheckText(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary-container focus:ring-0 rounded-lg px-3 py-2 text-xs font-sans placeholder-outline-variant text-on-surface outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-surface-container border border-outline-variant hover:border-primary-container hover:text-primary-container rounded-lg text-on-surface-variant transition-colors cursor-pointer"
                title="Add checklist item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface AudioRecorderProps {
  audioData?: string;
  onSaveAudio: (base64: string) => void;
}

function AudioRecorder({ audioData, onSaveAudio }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (audioData) {
      setAudioUrl(audioData);
    } else {
      setAudioUrl(null);
    }
  }, [audioData]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onSaveAudio(base64data);
          setAudioUrl(base64data);
        };
        
        stream.getTracks().forEach((track) => track.stop());
      };
      
      setRecordingTime(0);
      setIsRecording(true);
      mediaRecorder.start();
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to get mic access', err);
      alert('Microphone access is required to record custom audio loops.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playPreview = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  return (
    <div className="flex items-center gap-3 bg-surface-container-high/40 border border-outline-variant/20 rounded-xl px-4 py-2 text-xs font-mono w-full sm:w-auto">
      {isRecording ? (
        <div className="flex items-center gap-3 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span>Rec ({recordingTime}s)</span>
          <button
            type="button"
            onClick={stopRecording}
            className="p-1 bg-red-500/15 border border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg cursor-pointer transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary-container/10 border border-primary-container/20 hover:border-[#00f0ff] text-[#00f0ff] rounded-lg cursor-pointer transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Mantra</span>
          </button>
          
          {audioUrl && (
            <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-2">
              <button
                type="button"
                onClick={playPreview}
                className="flex items-center gap-1 px-2.5 py-1 bg-surface-container border border-outline-variant/40 hover:border-outline-variant text-on-surface rounded-lg cursor-pointer transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 fill-current" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <span className="text-[10px] text-on-surface-variant font-sans">Recorded</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
