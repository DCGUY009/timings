export type CueType = 'single-chime' | 'double-chime' | 'silent';
export type StepType = 'work' | 'rest' | 'interval' | 'flow';

export type StepFormat = 'duration' | 'reps' | 'audio-loop';

export interface PracticeStep {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  cue: CueType;
  type: StepType;
  stepFormat?: StepFormat;
  sets?: number;
  reps?: number;
  repPace?: number;
  audioData?: string; // base64 encoded audio string
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: PracticeStep[];
  lastExecuted?: string; // string representing time elapsed, e.g. "Today, 9:00 AM" or null
  checklist?: ChecklistItem[];
  tickingSoundEnabled?: boolean;
}

export interface SessionHistoryItem {
  id: string;
  routineName: string;
  timestamp: string;
  durationMinutes: number;
  completionRate: number; // percentage
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface User {
  email: string;
  name: string;
  isPro?: boolean;
}

export type ActiveScreen = 'landing' | 'auth' | 'dashboard' | 'routines' | 'history' | 'settings' | 'timer' | 'edit-routine' | 'profile';
