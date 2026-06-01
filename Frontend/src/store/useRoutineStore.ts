import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { Routine, SessionHistoryItem, ChecklistItem, User } from '../types';
import { DEFAULT_ROUTINES, DEFAULT_CHECKLIST, DEFAULT_HISTORY } from '../data/defaultRoutines';

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
          id, name, description, category, last_executed,
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

      // --- SEED DATABASE IF NEW USER (0 ROUTINES IN CLOUD) ---
      if (!dbRoutines || dbRoutines.length === 0) {
        console.log('[fetchData] New user detected (0 cloud routines). Seeding defaults...');
        
        // Seed default routines
        for (const routine of DEFAULT_ROUTINES) {
          try {
            await supabase.from('routines').insert({
              id: routine.id,
              user_id: userId,
              name: routine.name,
              description: routine.description,
              category: routine.category,
              last_executed: routine.lastExecuted
            });

            if (routine.steps && routine.steps.length > 0) {
              await supabase.from('routine_steps').insert(
                routine.steps.map((step, idx) => ({
                  id: step.id,
                  routine_id: routine.id,
                  name: step.name,
                  description: step.description,
                  duration: step.duration,
                  cue: step.cue,
                  type: step.type,
                  position: idx
                }))
              );
            }

            if (routine.checklist && routine.checklist.length > 0) {
              await supabase.from('routine_checklist_items').insert(
                routine.checklist.map((item, idx) => ({
                  id: item.id,
                  routine_id: routine.id,
                  label: item.label,
                  checked: item.checked,
                  position: idx
                }))
              );
            }
          } catch (seedErr) {
            console.error('[fetchData] Failed to seed routine:', routine.id, seedErr);
          }
        }

        // Seed default global checklist
        if (!dbChecklist || dbChecklist.length === 0) {
          try {
            await supabase.from('global_checklist_items').insert(
              DEFAULT_CHECKLIST.map((item, idx) => ({
                id: item.id,
                user_id: userId,
                label: item.label,
                checked: item.checked,
                position: idx
              }))
            );
          } catch (seedErr) {
            console.error('[fetchData] Failed to seed checklist items:', seedErr);
          }
        }

        // Seed default history
        if (!dbHistory || dbHistory.length === 0) {
          try {
            await supabase.from('session_history').insert(
              DEFAULT_HISTORY.map((item) => ({
                id: item.id,
                user_id: userId,
                routine_name: item.routineName,
                timestamp: item.timestamp,
                duration_minutes: item.durationMinutes,
                completion_rate: item.completionRate
              }))
            );
            
            // Set user profile streak to match seeded history
            await supabase
              .from('profiles')
              .update({ streak_days: DEFAULT_HISTORY.length })
              .eq('id', userId);
            set({ streakDays: DEFAULT_HISTORY.length });
          } catch (seedErr) {
            console.error('[fetchData] Failed to seed session history:', seedErr);
          }
        }

        // Re-run fetchData to fetch the newly seeded items from DB
        return get().fetchData(userId);
      }
      // --------------------------------------------------------

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

      const historyList = (dbHistory || []).map((h: any) => ({
        id: h.id,
        routineName: h.routine_name,
        timestamp: h.timestamp,
        durationMinutes: h.duration_minutes,
        completionRate: h.completion_rate
      }));

      // Robust check: If history is empty but streakDays is still showing > 0 (often from legacy triggers/defaults),
      // we auto-correct it locally and update the database profile record.
      if (historyList.length === 0 && get().streakDays > 0) {
        console.log('[fetchData] Correcting streakDays from', get().streakDays, 'to 0 because history is empty');
        set({ streakDays: 0 });
        try {
          await supabase
            .from('profiles')
            .update({ streak_days: 0 })
            .eq('id', userId);
        } catch (dbErr) {
          console.error('[fetchData] Failed to auto-correct profile streak to 0:', dbErr);
        }
      }

      console.log('[fetchData] All queries completed. Setting state and setting isLoading to false.');
      set({
        routines: formattedRoutines,
        checklist: dbChecklist || [],
        history: historyList,
        isLoading: false
      });
    } catch (err) {
      console.error('[fetchData] Exception occurred in fetchData:', err);
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
        const { error } = await supabase
          .from('routine_checklist_items')
          .update({ checked: targetItem.checked })
          .eq('id', itemId);
        if (error) {
          console.error('[handleToggleRoutineCheck] Supabase update failed:', error.message, error.details);
        }
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
        const { error } = await supabase
          .from('global_checklist_items')
          .update({ checked: targetItem.checked })
          .eq('id', id);
        if (error) {
          console.error('[handleToggleCheck] Supabase update failed:', error.message, error.details);
        }
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
      const { data: authUser, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser.user) {
        console.error('[handleSaveEditedRoutine] Auth error:', authErr || 'No user session');
        return;
      }

      console.log('[handleSaveEditedRoutine] Saving routine to database...', savedRoutine.id);

      // 1. Upsert routine
      const { error: routineErr } = await supabase.from('routines').upsert({
        id: savedRoutine.id,
        user_id: authUser.user.id,
        name: savedRoutine.name,
        description: savedRoutine.description,
        category: savedRoutine.category,
        last_executed: savedRoutine.lastExecuted
      });
      if (routineErr) {
        console.error('[handleSaveEditedRoutine] Supabase upsert routine failed:', routineErr.message, routineErr.details);
      }

      // 2. Refresh steps (Delete existing steps and insert new ones)
      const { error: delStepsErr } = await supabase.from('routine_steps').delete().eq('routine_id', savedRoutine.id);
      if (delStepsErr) {
        console.error('[handleSaveEditedRoutine] Supabase delete steps failed:', delStepsErr.message, delStepsErr.details);
      }
      if (savedRoutine.steps.length > 0) {
        const { error: insStepsErr } = await supabase.from('routine_steps').insert(
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
        if (insStepsErr) {
          console.error('[handleSaveEditedRoutine] Supabase insert steps failed:', insStepsErr.message, insStepsErr.details);
        }
      }

      // 3. Refresh checklist items
      const { error: delCheckErr } = await supabase.from('routine_checklist_items').delete().eq('routine_id', savedRoutine.id);
      if (delCheckErr) {
        console.error('[handleSaveEditedRoutine] Supabase delete checklist failed:', delCheckErr.message, delCheckErr.details);
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
          console.error('[handleSaveEditedRoutine] Supabase insert checklist failed:', insCheckErr.message, insCheckErr.details);
        }
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
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) {
        console.error('[handleDeleteRoutine] Supabase delete routine failed:', error.message, error.details);
      }
    } else {
      localStorage.setItem('timings_saved_routines', JSON.stringify(updated));
    }
  },

  handleClearHistory: async () => {
    const { user } = get();
    set({ history: [] });

    if (user) {
      const { data: authUser, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authUser.user) {
        console.error('[handleClearHistory] Auth error:', authErr || 'No user session');
        return;
      }
      const { error } = await supabase.from('session_history').delete().eq('user_id', authUser.user.id);
      if (error) {
        console.error('[handleClearHistory] Supabase clear history failed:', error.message, error.details);
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
    } else {
      localStorage.setItem('timings_history', JSON.stringify(updated));
    }
  },

  handleLogout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[handleLogout] Sign out error:', error.message);
    }
    localStorage.removeItem('timings_user');
    set({
      user: null,
      routines: [...DEFAULT_ROUTINES],
      checklist: [...DEFAULT_CHECKLIST],
      history: [...DEFAULT_HISTORY],
      streakDays: 0,
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
        const { error } = await supabase
          .from('routines')
          .update({ last_executed: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` })
          .eq('id', activeRoutine.id);
        if (error) {
          console.error('[handleTimerFinished] Supabase update last executed failed:', error.message, error.details);
        }
      } else {
        localStorage.setItem('timings_saved_routines', JSON.stringify(updatedRoutines));
      }

      await get().handleAddSessionToLog(logItem);
    }
    
    set({ activeRoutine: null });
  }
}));
