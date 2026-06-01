import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, GripVertical, Save, ArrowLeft, Check, Play, ChevronUp, ChevronDown, Mic, Square, Pause, Sparkles } from 'lucide-react';
import { Routine, PracticeStep, CueType, StepType, ChecklistItem } from '../types';
import { DEFAULT_CHECKLIST } from '../data/defaultRoutines';
import { generateUniqueId } from '../utils/uniqueId';
import { processAudioBuffer, trimAudioBuffer } from '../utils/audioFilter';
import ConfirmationModal from './ConfirmationModal';

interface RoutineEditorProps {
  routine: Routine | null; // null means "Create New"
  onSave: (routine: Routine) => Promise<void>;
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
        setChecklist(DEFAULT_CHECKLIST.map(item => ({
          ...item,
          id: generateUniqueId('ec')
        })));
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
      const loopLen = s.audioData ? (s.duration || 3) : 3;
      return Math.round((s.reps || 21) * loopLen);
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

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    if (!name.trim()) return;

    if (steps.length === 0) {
      alert('A routine must contain at least one step.');
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleSaveRoutine = async () => {
    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || 'Custom')
      : category;

    setShowSaveConfirm(false);
    setIsSaving(true);
    try {
      await onSave({
        id: routine?.id || `routine-custom-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        steps: steps,
        lastExecuted: routine?.lastExecuted || 'Never',
        checklist: checklist,
        tickingSoundEnabled: tickingSoundEnabled
      });
    } finally {
      setIsSaving(false);
    }
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
                    <div className="space-y-3 pt-2.5 border-t border-outline-variant/10">
                      <div className="flex flex-wrap items-center gap-3">
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
                        )}
                      </div>

                      {/* Audio loop recorder block */}
                      {step.stepFormat === 'audio-loop' && (
                        <div className="pt-2">
                          <AudioRecorder
                            key={step.id}
                            audioData={step.audioData}
                            onSaveAudio={(base64, duration) => handleUpdateStep(step.id, { audioData: base64, duration: Math.max(1, Math.round(duration)) })}
                          />
                        </div>
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
              onClick={handleSaveClick}
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

      {/* Confirmation Modal for Saving Routine */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSaveRoutine}
        title="Ready to Save?"
        message="Are you sure you want to save this routine and exit?"
        confirmText="Yes, Save"
        cancelText="No, Keep Editing"
        type="info"
      />

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#060e20]/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 bg-surface-container/90 border border-outline-variant/30 rounded-2xl px-10 py-8 shadow-2xl">
            <svg className="animate-spin h-10 w-10 text-[#00f0ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div className="text-center">
              <p className="font-sans font-bold text-on-surface text-base">Saving Routine…</p>
              <p className="text-xs font-sans text-on-surface-variant mt-1">Syncing to your account</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface AudioRecorderProps {
  key?: string;
  audioData?: string;
  onSaveAudio: (base64: string, duration: number) => void;
}

function AudioRecorderComponent({ audioData, onSaveAudio }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [noiseRemovalEnabled, setNoiseRemovalEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  
  const rawBufferRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const decodeBase64ToAudioBuffer = async (base64: string): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(base64);
      const arrayBuffer = await response.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });
      ctx.close();
      return buffer;
    } catch (err) {
      console.error('Failed to decode loaded base64 audio:', err);
      return null;
    }
  };

  useEffect(() => {
    if (audioData) {
      setAudioUrl(audioData);
      // ONLY decode if we do not already have the raw buffer in memory (i.e. loading from database)
      if (!rawBufferRef.current) {
        decodeBase64ToAudioBuffer(audioData).then((buffer) => {
          if (buffer) {
            rawBufferRef.current = buffer;
            setOriginalBuffer(buffer);
            setMaxDuration(buffer.duration);
            setTrimStart(0);
            setTrimEnd(buffer.duration);
          }
        });
      }
    } else {
      setAudioUrl(null);
      setOriginalBuffer(null);
      rawBufferRef.current = null;
      setMaxDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
    }
  }, [audioData]);

  useEffect(() => {
    return () => {
      cleanupAudioContext();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const cleanupAudioContext = () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(e => console.error('Error closing AudioContext:', e));
      }
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      cleanupAudioContext();
      rawBufferRef.current = null;
      setOriginalBuffer(null);
      audioChunksRef.current = [];

      const constraints: MediaStreamConstraints = {
        audio: noiseRemovalEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        alert('Web Audio API is not supported in this browser.');
        return;
      }

      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Create a ScriptProcessorNode to capture raw mono audio (buffer size 4096)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        // Copy the samples
        audioChunksRef.current.push(new Float32Array(inputBuffer));
      };

      // Connect source to processor, and processor to destination so it runs
      source.connect(processor);
      processor.connect(audioCtx.destination);

      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to get mic access', err);
      alert('Microphone access is required to record custom audio loops.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsProcessing(true);

    try {
      // Accumulate audio chunks in local variables before cleanup
      const chunks = audioChunksRef.current;
      const sampleRate = audioCtxRef.current?.sampleRate || 44100;
      
      // Stop the mic tracks and release resources
      cleanupAudioContext();

      if (chunks.length === 0) {
        throw new Error('No audio samples captured.');
      }

      // Concatenate float chunks
      let totalLength = 0;
      for (const chunk of chunks) {
        totalLength += chunk.length;
      }
      const mergedSamples = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        mergedSamples.set(chunk, offset);
        offset += chunk.length;
      }

      // Create a clean AudioBuffer from these samples
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const offlineCtx = new AudioContextClass();
      const audioBuffer = offlineCtx.createBuffer(1, totalLength, sampleRate);
      audioBuffer.copyToChannel(mergedSamples, 0);
      
      rawBufferRef.current = audioBuffer;
      setOriginalBuffer(audioBuffer);
      setMaxDuration(audioBuffer.duration);
      setTrimStart(0);
      setTrimEnd(audioBuffer.duration);

      // Run through DSP filters and convert to WAV Blob
      const finalBlob = await processAudioBuffer(audioBuffer, noiseRemovalEnabled);

      const reader = new FileReader();
      reader.readAsDataURL(finalBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onSaveAudio(base64data, audioBuffer.duration);
        setAudioUrl(base64data);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('Processing failed:', err);
      setIsProcessing(false);
      alert('Failed to process and clean audio.');
    }
  };

  const applyTrimAndProcess = async (start: number, end: number) => {
    if (!rawBufferRef.current) return;
    try {
      const trimmed = trimAudioBuffer(rawBufferRef.current, start, end);
      const processedBlob = await processAudioBuffer(trimmed, noiseRemovalEnabled);
      
      const reader = new FileReader();
      reader.readAsDataURL(processedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onSaveAudio(base64data, trimmed.duration);
        setAudioUrl(base64data);
      };
    } catch (err) {
      console.error('Failed to apply trim:', err);
    }
  };

  const handleToggleNoiseClean = async () => {
    const nextVal = !noiseRemovalEnabled;
    setNoiseRemovalEnabled(nextVal);
    
    if (rawBufferRef.current) {
      try {
        const trimmed = trimAudioBuffer(rawBufferRef.current, trimStart, trimEnd);
        const processedBlob = await processAudioBuffer(trimmed, nextVal);
        
        const reader = new FileReader();
        reader.readAsDataURL(processedBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onSaveAudio(base64data, trimmed.duration);
          setAudioUrl(base64data);
        };
      } catch (err) {
        console.error('Failed to apply noise clean toggle:', err);
      }
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
    <div className="flex flex-col gap-4 bg-surface-container/30 backdrop-blur-md border border-outline-variant/40 rounded-2xl p-5 text-xs font-mono w-full max-w-xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-cyan-500/5 hover:border-cyan-500/20">
      {/* Background Subtle Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />

      {/* Action and controls row */}
      <div className="flex items-center justify-between gap-4 flex-wrap min-h-[38px] z-10 relative">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Record Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse'
                : 'bg-cyan-500/5 border-cyan-500/25 text-[#00f0ff] hover:bg-cyan-500/15 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(0,240,255,0.15)]'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop ({recordingTime}s)</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Record Mantra</span>
              </>
            )}
          </button>

          {/* Play/Pause Button */}
          {audioUrl && !isRecording && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={playPreview}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isPlaying
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-[#00f0ff] hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                  : 'bg-surface-container border-outline-variant/35 text-on-surface hover:border-outline hover:bg-surface-container-high'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
          )}

          {/* Bouncing audio visualizer bars */}
          {isPlaying && (
            <div className="flex items-end gap-[3px] h-3.5 px-2">
              <span className="w-[2.5px] bg-[#00f0ff] animate-bounce h-2" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
              <span className="w-[2.5px] bg-[#00f0ff] animate-bounce h-3.5" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
              <span className="w-[2.5px] bg-[#00f0ff] animate-bounce h-1.5" style={{ animationDelay: '0.5s', animationDuration: '0.7s' }} />
            </div>
          )}

          {/* Status text */}
          {audioUrl && !isRecording && !isProcessing && (
            <span className="text-[10px] text-on-surface-variant/60 font-sans italic select-none">
              Recorded & Cleaned
            </span>
          )}
        </div>

        {/* Right side controls: Loading spinner & Noise Clean toggle */}
        <div className="flex items-center gap-3 select-none">
          {isProcessing && (
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-bold uppercase tracking-wider pr-1 animate-pulse">
              <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          )}

          {!isRecording && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleToggleNoiseClean}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] uppercase font-bold tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                noiseRemovalEnabled 
                  ? 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400 hover:bg-cyan-500/20' 
                  : 'bg-surface-container border-outline-variant/35 text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${noiseRemovalEnabled ? 'animate-pulse' : ''}`} />
              <span>Noise Clean: {noiseRemovalEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Trimming section with interactive waveform */}
      {!isRecording && originalBuffer && (
        <div className="flex flex-col gap-2 border-t border-outline-variant/10 pt-3 mt-1 z-10 relative">
          <InteractiveWaveTrimmer
            buffer={originalBuffer}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onChange={(start, end) => {
              setTrimStart(start);
              setTrimEnd(end);
            }}
            onChangeEnd={(start, end) => {
              applyTrimAndProcess(start, end);
            }}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Silent environment tip */}
      {!isRecording && (
        <div className="text-[10px] text-on-surface-variant/80 border-t border-outline-variant/10 pt-3 flex items-start gap-2 select-none z-10 relative">
          <span className="text-[#00f0ff] mt-0.5">💡</span>
          <span className="leading-relaxed">
            <strong className="text-[#dae2fd]">Tip:</strong> For best noise clean results, try to record in a quiet, silent environment.
          </span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Interactive Waveform Trimmer Component
// ----------------------------------------------------
interface InteractiveWaveTrimmerProps {
  buffer: AudioBuffer;
  trimStart: number;
  trimEnd: number;
  onChange: (start: number, end: number) => void;
  onChangeEnd: (start: number, end: number) => void;
  isProcessing: boolean;
}

function InteractiveWaveTrimmer({
  buffer,
  trimStart,
  trimEnd,
  onChange,
  onChangeEnd,
  isProcessing
}: InteractiveWaveTrimmerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const duration = buffer.duration;

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const rawData = buffer.getChannelData(0);

    ctx.clearRect(0, 0, width, height);

    // Number of bars
    const barCount = 70;
    const totalBarWidth = width / barCount;
    const barGap = 2;
    const barWidth = Math.max(1.5, totalBarWidth - barGap);
    const startX = 0;

    const samplesPerBin = Math.floor(rawData.length / barCount);
    const peaks: number[] = [];
    let maxPeak = 0.01;

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const startSample = i * samplesPerBin;
      const endSample = Math.min(startSample + samplesPerBin, rawData.length);
      for (let j = startSample; j < endSample; j++) {
        sum += Math.abs(rawData[j]);
      }
      const avg = sum / (endSample - startSample || 1);
      peaks.push(avg);
      if (avg > maxPeak) {
        maxPeak = avg;
      }
    }

    const normalizedPeaks = peaks.map(p => p / maxPeak);

    for (let i = 0; i < barCount; i++) {
      const peak = normalizedPeaks[i];
      const barHeight = Math.max(3, peak * (height - 16));
      const x = startX + i * totalBarWidth;
      const y = (height - barHeight) / 2;

      const barTime = (i / barCount) * duration;
      const isInside = barTime >= trimStart && barTime <= trimEnd;

      if (isInside) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = '#3b494b';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, 1.5) : ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
    }
  }, [buffer, trimStart, trimEnd]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, x / rect.width));
    const clickTime = clickRatio * duration;

    const distToStart = Math.abs(clickTime - trimStart);
    const distToEnd = Math.abs(clickTime - trimEnd);

    const handle = distToStart < distToEnd ? 'start' : 'end';
    setActiveHandle(handle);
    
    if (handle === 'start') {
      if (clickTime < trimEnd - 0.2) {
        onChange(clickTime, trimEnd);
      }
    } else {
      if (clickTime > trimStart + 0.2) {
        onChange(trimStart, clickTime);
      }
    }

    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const time = ratio * duration;

    if (activeHandle === 'start') {
      if (time < trimEnd - 0.2) {
        onChange(time, trimEnd);
      }
    } else {
      if (time > trimStart + 0.2) {
        onChange(trimStart, time);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle) return;
    const handleReleased = activeHandle;
    setActiveHandle(null);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    onChangeEnd(trimStart, trimEnd);
  };

  const startPercent = (trimStart / duration) * 100;
  const endPercent = (trimEnd / duration) * 100;

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      <div className="flex justify-between items-center text-[10px] text-outline font-bold uppercase tracking-wider mb-1 px-1">
        <span>Drag Handles to Trim Loop</span>
        <span className="text-[#00f0ff] font-sans font-bold">
          Range: {trimStart.toFixed(1)}s - {trimEnd.toFixed(1)}s (Len: {(trimEnd - trimStart).toFixed(1)}s)
        </span>
      </div>

      {/* Outer container with no overflow-hidden, so handles can overflow the edges by 6px */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative h-20 cursor-ew-resize touch-none transition-opacity ${
          isProcessing ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {/* Inner track with rounded corners and overflow-hidden */}
        <div className="absolute inset-0 bg-transparent border border-outline-variant/35 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Start Handle Line and Knob */}
        <div
          className="absolute inset-y-0 w-[2px] bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] z-20 pointer-events-none"
          style={{ left: `${startPercent}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-3 h-3 rounded-full bg-[#00f0ff] border border-[#0b1326] shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
        </div>

        {/* End Handle Line and Knob */}
        <div
          className="absolute inset-y-0 w-[2px] bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] z-20 pointer-events-none"
          style={{ left: `${endPercent}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-3 h-3 rounded-full bg-[#00f0ff] border border-[#0b1326] shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
        </div>
      </div>
    </div>
  );
}

export const AudioRecorder = React.memo(
  AudioRecorderComponent,
  (prevProps, nextProps) => prevProps.audioData === nextProps.audioData
);
