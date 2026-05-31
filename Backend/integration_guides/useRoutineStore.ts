import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { Routine, SessionHistoryItem, ChecklistItem, User, PracticeStep } from '../src/types';
import { DEFAULT_ROUTINES, DEFAULT_CHECKLIST, DEFAULT_HISTORY } from '../src/data/defaultRoutines';

interface RoutineState {
  // State
  user: User | null;
  routines: Routine[];
  checklist: ChecklistItem[];
  history: SessionHistoryItem[];
  activeRoutine: Routine | null;
  streakDays: number;
  isLoading: boolean;

  // Actions
  initializeStore: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchData: (userId: string) => Promise<void>;
  
  // App Handlers (Matching existing App.tsx handlers)
  handleToggleRoutineCheck: (routineId: string, itemId: string) => Promise<void>;
  handleToggleCheck: (id: string) => Promise<void>;
  handleStartRoutine: (routine: Routine) => void;
  handleSaveEditedRoutine: (savedRoutine: Routine) => Promise<void>;
  handleDeleteRoutine: (id: string) => Promise<void>;
  handleClearHistory: () => Promise<void>;
  handleAddSessionToLog: (item: SessionHistoryItem) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleLoginSuccess: (signedInUser: User, userId: string) => Promise<void>;
  handleTimerFinished: (completed: boolean, sessionLengthInMinutes: number) => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  user: null,
  routines: [],
  checklist: [],
  history: [],
  activeRoutine: null,
  streakDays: 5,
  isLoading: true,

  // Initialize store and listen to Supabase Auth state changes
  initializeStore: async () => {
    set({ isLoading: true });

    // Set up auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const name = session.user.user_metadata?.name || email.split('@')[0];
        
        // Fetch or create profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const loggedInUser: User = {
          email,
          name: profile?.name || name,
          isPro: profile?.is_pro || false
        };

        set({ 
          user: loggedInUser,
          streakDays: profile?.streak_days || 5
        });

        // Load data from Supabase
        await get().fetchData(session.user.id);
      } else {
        // Fallback to localStorage for guest users
        const savedRoutines = localStorage.getItem('timings_saved_routines');
        const savedChecklist = localStorage.getItem('timings_checklist');
        const savedHistory = localStorage.getItem('timings_history');
        const savedUser = localStorage.getItem('timings_user');
        
        set({
          user: savedUser ? JSON.parse(savedUser) : null,
          routines: savedRoutines ? JSON.parse(savedRoutines) : [...DEFAULT_ROUTINES],
          checklist: savedChecklist ? JSON.parse(savedChecklist) : [...DEFAULT_CHECKLIST],
          history: savedHistory ? JSON.parse(savedHistory) : [...DEFAULT_HISTORY],
          streakDays: 5,
          isLoading: false
        });
      }
    });
  },

  setUser: (user) => set({ user }),

  // Fetch all user specific data from Supabase
  fetchData: async (userId: string) => {
    try {
      // 1. Fetch Routines with Steps and Checklist Items
      const { data: dbRoutines, error: routinesErr } = await supabase
        .from('routines')
        .select(`
          id, name, description, category, last_executed,
          steps:routine_steps(*),
          checklist:routine_checklist_items(*)
        `)
        .eq('user_id', userId);

      if (routinesErr) throw routinesErr;

      const formattedRoutines: Routine[] = (dbRoutines || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        category: r.category || '',
        lastExecuted: r.last_executed || undefined,
        steps: (r.steps || []).sort((a: any, b: any) => a.position - b.position).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          duration: s.duration,
          cue: s.cue,
          type: s.type
        })),
        checklist: (r.checklist || []).sort((a: any, b: any) => a.position - b.position).map((c: any) => ({
          id: c.id,
          label: c.label,
          checked: c.checked
        }))
      }));

      // 2. Fetch Global Checklist Items
      const { data: dbChecklist, error: checklistErr } = await supabase
        .from('global_checklist_items')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (checklistErr) throw checklistErr;

      // 3. Fetch Session History
      const { data: dbHistory, error: historyErr } = await supabase
        .from('session_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (historyErr) throw historyErr;

      set({
        routines: formattedRoutines,
        checklist: dbChecklist || [],
        history: (dbHistory || []).map((h: any) => ({
          id: h.id,
          routineName: h.routine_name,
          timestamp: h.timestamp,
          durationMinutes: h.duration_minutes,
          completionRate: h.completion_rate
        })),
        isLoading: false
      });
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      set({ isLoading: false });
    }
  },

  handleToggleRoutineCheck: async (routineId, itemId) => {
    const { routines, user } = get();
    const updated = routines.map((r) => {
      if (r.id === routineId) {
        const rChecklist = r.checklist || [];
        const updatedChecklist = rChecklist.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        return { ...r, checklist: updatedChecklist };
      }
      return r;
    });

    set({ routines: updated });

    if (user) {
      const targetRoutine = updated.find(r => r.id === routineId);
      const targetItem = targetRoutine?.checklist?.find(i => i.id === itemId);
      if (targetItem) {
        await supabase
          .from('routine_checklist_items')
          .update({ checked: targetItem.checked })
          .eq('id', itemId);
      }
    } else {
      localStorage.setItem('timings_saved_routines', JSON.stringify(updated));
    }
  },

  handleToggleCheck: async (id) => {
    const { checklist, user } = get();
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ checklist: updated });

    if (user) {
      const targetItem = updated.find(i => i.id === id);
      if (targetItem) {
        await supabase
          .from('global_checklist_items')
          .update({ checked: targetItem.checked })
          .eq('id', id);
      }
    } else {
      localStorage.setItem('timings_checklist', JSON.stringify(updated));
    }
  },

  handleStartRoutine: (routine) => {
    set({ activeRoutine: routine });
  },

  handleSaveEditedRoutine: async (savedRoutine) => {
    const { routines, user } = get();
    let updatedRoutines: Routine[] = [];
    const exists = routines.some((r) => r.id === savedRoutine.id);

    if (exists) {
      updatedRoutines = routines.map((r) => r.id === savedRoutine.id ? savedRoutine : r);
    } else {
      updatedRoutines = [...routines, savedRoutine];
    }

    set({ routines: updatedRoutines });

    if (user) {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      // 1. Upsert routine
      await supabase.from('routines').upsert({
        id: savedRoutine.id,
        user_id: authUser.user.id,
        name: savedRoutine.name,
        description: savedRoutine.description,
        category: savedRoutine.category,
        last_executed: savedRoutine.lastExecuted
      });

      // 2. Refresh steps (Delete existing steps and insert new ones)
      await supabase.from('routine_steps').delete().eq('routine_id', savedRoutine.id);
      if (savedRoutine.steps.length > 0) {
        await supabase.from('routine_steps').insert(
          savedRoutine.steps.map((step, idx) => ({
            id: step.id,
            routine_id: savedRoutine.id,
            name: step.name,
            description: step.description,
            duration: step.duration,
            cue: step.cue,
            type: step.type,
            position: idx
          }))
        );
      }

      // 3. Refresh checklist items
      await supabase.from('routine_checklist_items').delete().eq('routine_id', savedRoutine.id);
      if (savedRoutine.checklist && savedRoutine.checklist.length > 0) {
        await supabase.from('routine_checklist_items').insert(
          savedRoutine.checklist.map((item, idx) => ({
            id: item.id,
            routine_id: savedRoutine.id,
            label: item.label,
            checked: item.checked,
            position: idx
          }))
        );
      }
    } else {
      localStorage.setItem('timings_saved_routines', JSON.stringify(updatedRoutines));
    }
  },

  handleDeleteRoutine: async (id) => {
    const { routines, user } = get();
    const updated = routines.filter((r) => r.id !== id);
    set({ routines: updated });

    if (user) {
      await supabase.from('routines').delete().eq('id', id);
    } else {
      localStorage.setItem('timings_saved_routines', JSON.stringify(updated));
    }
  },

  handleClearHistory: async () => {
    const { user } = get();
    set({ history: [] });

    if (user) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        await supabase.from('session_history').delete().eq('user_id', authUser.user.id);
      }
    } else {
      localStorage.setItem('timings_history', JSON.stringify([]));
    }
  },

  handleAddSessionToLog: async (item) => {
    const { history, streakDays, user } = get();
    const updated = [item, ...history];
    const newStreak = streakDays + 1;
    set({ 
      history: updated,
      streakDays: newStreak
    });

    if (user) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user) {
        // Insert into history table
        await supabase.from('session_history').insert({
          id: item.id,
          user_id: authUser.user.id,
          routine_name: item.routineName,
          timestamp: item.timestamp,
          duration_minutes: item.durationMinutes,
          completion_rate: item.completionRate
        });

        // Update streak_days in user profile
        await supabase
          .from('profiles')
          .update({ streak_days: newStreak })
          .eq('id', authUser.user.id);
      }
    } else {
      localStorage.setItem('timings_history', JSON.stringify(updated));
    }
  },

  handleLogout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('timings_user');
    set({
      user: null,
      routines: [...DEFAULT_ROUTINES],
      checklist: [...DEFAULT_CHECKLIST],
      history: [...DEFAULT_HISTORY],
      streakDays: 5,
      activeRoutine: null
    });
  },

  handleLoginSuccess: async (signedInUser, userId) => {
    set({ user: signedInUser });
    localStorage.setItem('timings_user', JSON.stringify(signedInUser));
    await get().fetchData(userId);
  },

  handleTimerFinished: async (completed, sessionLengthInMinutes) => {
    const { activeRoutine, routines } = get();
    
    if (completed && activeRoutine) {
      const logItem: SessionHistoryItem = {
        id: `log-${Date.now()}`,
        routineName: activeRoutine.name,
        timestamp: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        durationMinutes: sessionLengthInMinutes,
        completionRate: 100
      };

      const updatedRoutines = routines.map((r) => {
        if (r.id === activeRoutine.id) {
          return {
            ...r,
            lastExecuted: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          };
        }
        return r;
      });

      set({ routines: updatedRoutines });
      
      // Update local storage / DB last executed timestamp
      const { user } = get();
      if (user) {
        await supabase
          .from('routines')
          .update({ last_executed: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` })
          .eq('id', activeRoutine.id);
      } else {
        localStorage.setItem('timings_saved_routines', JSON.stringify(updatedRoutines));
      }

      await get().handleAddSessionToLog(logItem);
    }
    
    set({ activeRoutine: null });
  }
}));
