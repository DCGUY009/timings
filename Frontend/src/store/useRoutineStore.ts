import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { Routine, SessionHistoryItem, ChecklistItem, User } from '../types';


// Helper to calculate daily consecutive practice streak from history items
const calculateStreak = (history: SessionHistoryItem[]): number => {
  if (!history || history.length === 0) return 0;

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Resolve a session to a local-timezone YYYY-MM-DD date string.
   *
   * Priority:
   *  1. `createdAt` — an ISO 8601 UTC string (e.g. "2026-06-02T06:45:00Z").
   *     new Date(isoString) is unambiguous; getFullYear/getMonth/getDate then
   *     read the user's LOCAL date — exactly what we want for streak purposes.
   *  2. Manual regex parse of the human-readable `timestamp` string
   *     (e.g. "Jun 2, 2026 • 9:00 AM") as LOCAL time so there is no UTC shift.
   */
  const resolveLocalDateStr = (item: SessionHistoryItem): string | null => {
    // --- path 1: ISO timestamp (preferred) ---
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) return getLocalDateString(d);
    }

    // --- path 2: parse human-readable string as local date ---
    const displayPart = item.timestamp.split('•')[0].trim();
    // Expected format: "Mon DD, YYYY" e.g. "Jun 2, 2026"
    const MONTHS: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const match = displayPart.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
    if (match) {
      const mo = MONTHS[match[1]];
      const day = parseInt(match[2], 10);
      const yr = parseInt(match[3], 10);
      if (mo !== undefined && !isNaN(day) && !isNaN(yr)) {
        // Construct as LOCAL midnight — no UTC shift
        const d = new Date(yr, mo, day);
        if (!isNaN(d.getTime())) return getLocalDateString(d);
      }
    }

    return null;
  };

  const loggedDates = Array.from(new Set(
    history
      .map(item => resolveLocalDateStr(item))
      .filter((d): d is string => d !== null)
  )).sort((a, b) => b.localeCompare(a)); // Descending order

  if (loggedDates.length === 0) return 0;

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const hasToday = loggedDates.includes(todayStr);
  const hasYesterday = loggedDates.includes(yesterdayStr);

  // Streak is only alive if the user practiced today OR yesterday
  if (!hasToday && !hasYesterday) {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date();

  // If no session today but has one yesterday, start counting from yesterday
  if (!hasToday && hasYesterday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkStr = getLocalDateString(checkDate);
    if (loggedDates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};



interface RoutineState {
  // State
  user: User | null;
  routines: Routine[];
  checklist: ChecklistItem[];
  history: SessionHistoryItem[];
  activeRoutine: Routine | null;
  streakDays: number;
  isLoading: boolean;
  showEmailConfirmedAlert: boolean;

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
  streakDays: 0,
  isLoading: true,
  showEmailConfirmedAlert: false,

  // Initialize store and listen to Supabase Auth state changes
  initializeStore: async () => {
    console.log('[Store Init] initializeStore started');
    set({ isLoading: true });

    // Detect if this is an email confirmation redirect before auth state listener fires
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isConfirmation = params.has('code') || 
                           hashParams.get('type') === 'signup' || 
                           hashParams.has('access_token');

    const handleUserSession = async (session: any) => {
      console.log('[Store Init] handleUserSession triggered with session user:', session?.user?.email || 'none');
      try {
        if (session?.user) {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.name || email.split('@')[0];
          
          // Fetch profile safely
          let profile = null;
          try {
            console.log('[Store Init] Fetching profile from DB for:', session.user.id);
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (!error && data) {
              profile = data;
              console.log('[Store Init] Profile fetched successfully:', profile);
            } else {
              console.warn('[Store Init] Profile not found. Attempting self-healing creation...');
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  name: name,
                  email: email,
                  is_pro: false,
                  streak_days: 0,
                  avatar_id: 'avatar-1'
                })
                .select()
                .single();
              if (!createError && newProfile) {
                profile = newProfile;
                console.log('[Store Init] Profile self-healed/created successfully:', profile);
              } else {
                console.error('[Store Init] Failed to create profile:', createError || 'No profile returned');
              }
            }
          } catch (e) {
            console.error('[Store Init] Exception fetching profile:', e);
          }

          const loggedInUser: User = {
            email,
            name: profile?.name || name,
            isPro: profile?.is_pro || false
          };

          set({ 
            user: loggedInUser,
            streakDays: profile?.streak_days ?? 0
          });

          // Load data from Supabase
          console.log('[Store Init] Calling fetchData for user ID:', session.user.id);
          await get().fetchData(session.user.id);

          if (isConfirmation) {
            set({ showEmailConfirmedAlert: true });
            // Clean up URL parameters so it doesn't trigger again on page refresh
            window.history.replaceState({}, document.title, window.location.origin);
          }
        } else {
          console.log('[Store Init] No user session found. Initializing empty state.');
          set({
            user: null,
            routines: [],
            checklist: [],
            history: [],
            streakDays: 0,
            isLoading: false
          });
        }
      } catch (err) {
        console.error('[Store Init] Error in session handler:', err);
        set({ isLoading: false });
      }
    };

    // Get initial session
    let initialSession = null;
    try {
      console.log('[Store Init] Fetching initial session from getSession()...');
      const { data } = await supabase.auth.getSession();
      initialSession = data?.session;
      console.log('[Store Init] getSession() completed. Session user:', initialSession?.user?.email || 'none');
    } catch (e) {
      console.error('[Store Init] Error getting initial session:', e);
    }

    // Process initial session state immediately
    await handleUserSession(initialSession);

    // Set up auth state listener for future changes
    console.log('[Store Init] Registering onAuthStateChange listener');
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Store Init] onAuthStateChange event received:', event, 'User:', session?.user?.email || 'none');
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        await handleUserSession(session);
      }
    });
  },

  setUser: (user) => set({ user }),

  // Fetch all user specific data from Supabase
  fetchData: async (userId: string) => {
    console.log('[fetchData] started for user:', userId);
    try {
      // 1. Fetch Routines with Steps and Checklist Items
      console.log('[fetchData] Fetching routines + steps + checklist items...');
      const { data: dbRoutines, error: routinesErr } = await supabase
        .from('routines')
        .select(`
          id, name, description, category, last_executed, ticking_sound_enabled,
          steps:routine_steps(*),
          checklist:routine_checklist_items(*)
        `)
        .eq('user_id', userId);

      if (routinesErr) {
        console.error('[fetchData] Routines fetch error:', routinesErr);
        throw routinesErr;
      }
      console.log('[fetchData] Routines fetched successfully. Count:', dbRoutines?.length || 0);

      // 2. Fetch Global Checklist Items
      console.log('[fetchData] Fetching global checklist items...');
      const { data: dbChecklist, error: checklistErr } = await supabase
        .from('global_checklist_items')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (checklistErr) {
        console.error('[fetchData] Checklist fetch error:', checklistErr);
        throw checklistErr;
      }
      console.log('[fetchData] Global checklist fetched successfully. Count:', dbChecklist?.length || 0);

      // 3. Fetch Session History
      console.log('[fetchData] Fetching session history...');
      const { data: dbHistory, error: historyErr } = await supabase
        .from('session_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (historyErr) {
        console.error('[fetchData] History fetch error:', historyErr);
        throw historyErr;
      }
      console.log('[fetchData] Session history fetched successfully. Count:', dbHistory?.length || 0);



      const formattedRoutines: Routine[] = (dbRoutines || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        category: r.category || '',
        lastExecuted: r.last_executed || undefined,
        tickingSoundEnabled: r.ticking_sound_enabled,
        steps: (r.steps || []).sort((a: any, b: any) => a.position - b.position).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          duration: s.duration,
          cue: s.cue,
          type: s.type,
          stepFormat: s.step_format,
          sets: s.sets,
          reps: s.reps,
          repPace: s.rep_pace,
          audioData: s.audio_base64 || undefined
        })),
        checklist: (r.checklist || []).sort((a: any, b: any) => a.position - b.position).map((c: any) => ({
          id: c.id,
          label: c.label,
          checked: c.checked
        }))
      }));

      const historyList = (dbHistory || []).map((h: any) => ({
        id: h.id,
        routineName: h.routine_name,
        timestamp: h.timestamp,
        createdAt: h.created_at, // ISO UTC string — used for accurate streak calculation
        durationMinutes: h.duration_minutes,
        completionRate: h.completion_rate
      }));

      const computedStreak = calculateStreak(historyList);
      
      // Sync calculated streak to profiles table in DB
      try {
        await supabase
          .from('profiles')
          .update({ streak_days: computedStreak })
          .eq('id', userId);
      } catch (dbErr) {
        console.error('[fetchData] Failed to sync computed streak to DB:', dbErr);
      }

      console.log('[fetchData] All queries completed. Setting state and setting isLoading to false.');
      set({
        routines: formattedRoutines,
        checklist: dbChecklist || [],
        history: historyList,
        streakDays: computedStreak,
        isLoading: false
      });
    } catch (err) {
      console.error('[fetchData] Exception occurred in fetchData:', err);
      set({ isLoading: false });
    }
  },

  handleToggleRoutineCheck: async (routineId, itemId) => {
    const { routines, user } = get();
    if (!user) return;

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

    const targetRoutine = updated.find(r => r.id === routineId);
    const targetItem = targetRoutine?.checklist?.find(i => i.id === itemId);
    if (targetItem) {
      const { error } = await supabase
        .from('routine_checklist_items')
        .update({ checked: targetItem.checked })
        .eq('id', itemId);
      if (error) {
        console.error('[handleToggleRoutineCheck] Supabase update failed:', error.message, error.details);
      }
    }
  },

  handleToggleCheck: async (id) => {
    const { checklist, user } = get();
    if (!user) return;

    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ checklist: updated });

    const targetItem = updated.find(i => i.id === id);
    if (targetItem) {
      const { error } = await supabase
        .from('global_checklist_items')
        .update({ checked: targetItem.checked })
        .eq('id', id);
      if (error) {
        console.error('[handleToggleCheck] Supabase update failed:', error.message, error.details);
      }
    }
  },

  handleStartRoutine: (routine) => {
    set({ activeRoutine: routine });
  },

  handleSaveEditedRoutine: async (savedRoutine) => {
    try {
      const { routines, user } = get();
      if (!user) return;

      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session?.user) {
        throw new Error(authErr?.message || 'No active user session found.');
      }

      const activeUser = session.user;
      console.log('[handleSaveEditedRoutine] Saving routine to database...', savedRoutine.id);

      // 1. Upsert routine
      const { error: routineErr } = await supabase.from('routines').upsert({
        id: savedRoutine.id,
        user_id: activeUser.id,
        name: savedRoutine.name,
        description: savedRoutine.description,
        category: savedRoutine.category,
        last_executed: savedRoutine.lastExecuted,
        ticking_sound_enabled: savedRoutine.tickingSoundEnabled ?? true
      });
      if (routineErr) {
        throw new Error(`Routine upsert failed: ${routineErr.message}`);
      }

      // 2. Refresh steps (Delete existing steps and insert new ones)
      const { error: delStepsErr } = await supabase.from('routine_steps').delete().eq('routine_id', savedRoutine.id);
      if (delStepsErr) {
        throw new Error(`Steps clean failed: ${delStepsErr.message}`);
      }
      if (savedRoutine.steps.length > 0) {
        const { error: insStepsErr } = await supabase.from('routine_steps').insert(
          savedRoutine.steps.map((step, idx) => ({
            id: step.id,
            routine_id: savedRoutine.id,
            name: step.name,
            description: step.description,
            duration: Math.max(1, Math.round(step.duration)),
            cue: step.cue,
            type: step.type,
            position: idx,
            step_format: step.stepFormat || 'duration',
            sets: Math.max(1, Math.round(step.sets || 1)),
            reps: Math.max(1, Math.round(step.reps || 1)),
            rep_pace: step.repPace || 3.0,
            audio_base64: step.audioData || null
          }))
        );
        if (insStepsErr) {
          throw new Error(`Steps insert failed: ${insStepsErr.message}`);
        }
      }

      // 3. Refresh checklist items
      const { error: delCheckErr } = await supabase.from('routine_checklist_items').delete().eq('routine_id', savedRoutine.id);
      if (delCheckErr) {
        throw new Error(`Checklist clean failed: ${delCheckErr.message}`);
      }
      if (savedRoutine.checklist && savedRoutine.checklist.length > 0) {
        const { error: insCheckErr } = await supabase.from('routine_checklist_items').insert(
          savedRoutine.checklist.map((item, idx) => ({
            id: item.id,
            routine_id: savedRoutine.id,
            label: item.label,
            checked: item.checked,
            position: idx
          }))
        );
        if (insCheckErr) {
          throw new Error(`Checklist insert failed: ${insCheckErr.message}`);
        }
      }

      // Sync local state ONLY after successful database transactional write
      let updatedRoutines: Routine[] = [];
      const exists = routines.some((r) => r.id === savedRoutine.id);

      if (exists) {
        updatedRoutines = routines.map((r) => r.id === savedRoutine.id ? savedRoutine : r);
      } else {
        updatedRoutines = [...routines, savedRoutine];
      }

      set({ routines: updatedRoutines });

    } catch (err: any) {
      console.error('[handleSaveEditedRoutine] Failed to save routine:', err);
      alert(`Error saving routine: ${err.message || err}`);
      throw err; // Prevent editor navigation so changes aren't silently lost
    }
  },

  handleDeleteRoutine: async (id) => {
    try {
      const { routines, user } = get();
      if (!user) return;

      console.log('[handleDeleteRoutine] Deleting child steps and checklist items for routine:', id);
      // Delete child rows first to satisfy foreign key constraints
      const { error: stepErr } = await supabase.from('routine_steps').delete().eq('routine_id', id);
      if (stepErr) {
        throw new Error(`Steps deletion failed: ${stepErr.message}`);
      }

      const { error: checkErr } = await supabase.from('routine_checklist_items').delete().eq('routine_id', id);
      if (checkErr) {
        throw new Error(`Checklist deletion failed: ${checkErr.message}`);
      }

      console.log('[handleDeleteRoutine] Deleting routine row for:', id);
      const { error: routineErr } = await supabase.from('routines').delete().eq('id', id);
      if (routineErr) {
        throw new Error(`Routine deletion failed: ${routineErr.message}`);
      }

      // Sync local state ONLY after successful database delete
      const updated = routines.filter((r) => r.id !== id);
      set({ routines: updated });

    } catch (err: any) {
      console.error('[handleDeleteRoutine] Failed to delete routine:', err);
      alert(`Error deleting routine: ${err.message || err}`);
    }
  },

  handleClearHistory: async () => {
    const { user } = get();
    if (!user) return;

    set({ history: [] });

    const { data: authUser, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authUser.user) {
      console.error('[handleClearHistory] Auth error:', authErr || 'No user session');
      return;
    }
    const { error } = await supabase.from('session_history').delete().eq('user_id', authUser.user.id);
    if (error) {
      console.error('[handleClearHistory] Supabase clear history failed:', error.message, error.details);
    }
  },

  handleAddSessionToLog: async (item) => {
    const { history, user } = get();
    if (!user) return;

    const updated = [item, ...history];
    const newStreak = calculateStreak(updated);
    set({ 
      history: updated,
      streakDays: newStreak
    });

    const { data: authUser, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authUser.user) {
      console.error('[handleAddSessionToLog] Auth error:', authErr || 'No user session');
      return;
    }
    // Insert into history table
    const { error: histErr } = await supabase.from('session_history').insert({
      id: item.id,
      user_id: authUser.user.id,
      routine_name: item.routineName,
      timestamp: item.timestamp,
      duration_minutes: item.durationMinutes,
      completion_rate: item.completionRate
    });
    if (histErr) {
      console.error('[handleAddSessionToLog] Supabase insert history failed:', histErr.message, histErr.details);
    }

    // Update streak_days in user profile
    const { error: streakErr } = await supabase
      .from('profiles')
      .update({ streak_days: newStreak })
      .eq('id', authUser.user.id);
    if (streakErr) {
      console.error('[handleAddSessionToLog] Supabase update streak failed:', streakErr.message, streakErr.details);
    }
  },

  handleLogout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[handleLogout] Sign out error:', error.message);
    }
    set({
      user: null,
      routines: [],
      checklist: [],
      history: [],
      streakDays: 0,
      activeRoutine: null
    });
  },

  handleLoginSuccess: async (signedInUser, userId) => {
    set({ user: signedInUser });
    await get().fetchData(userId);
  },

  handleTimerFinished: async (completed, sessionLengthInMinutes) => {
    const { activeRoutine, routines, user } = get();
    if (!user) return;
    
    if (completed && activeRoutine) {
      const logItem: SessionHistoryItem = {
        id: `log-${Date.now()}`,
        routineName: activeRoutine.name,
        timestamp: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        createdAt: new Date().toISOString(), // ISO UTC — used for accurate streak calculation
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
      
      const { error } = await supabase
        .from('routines')
        .update({ last_executed: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` })
        .eq('id', activeRoutine.id);
      if (error) {
        console.error('[handleTimerFinished] Supabase update last executed failed:', error.message, error.details);
      }

      await get().handleAddSessionToLog(logItem);
    }
    
    set({ activeRoutine: null });
  }
}));
