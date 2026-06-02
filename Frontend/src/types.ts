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
  isPreconfigured?: boolean; // true for built-in example routines shown to all users
}

export interface SessionHistoryItem {
  id: string;
  routineName: string;
  timestamp: string; // human-readable display string e.g. "Jun 2, 2026 • 9:00 AM"
  createdAt?: string; // ISO 8601 UTC timestamp for accurate date calculations
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
