import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X } from 'lucide-react';
import { ActiveScreen, Routine, User } from './types';
import { useRoutineStore } from './store/useRoutineStore';
import { supabase } from './utils/supabaseClient';

// Import View Components
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoutinesDashboard from './components/RoutinesDashboard';
import RoutineEditor from './components/RoutineEditor';
import HistoryDashboard from './components/HistoryDashboard';
import SettingsScreen from './components/SettingsScreen';
import TimerScreen from './components/TimerScreen';
import ProfileScreen from './components/ProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('landing');

  const {
    user,
    routines,
    checklist,
    history,
    activeRoutine,
    streakDays,
    isLoading,
    initializeStore,
    handleToggleRoutineCheck,
    handleToggleCheck,
    handleStartRoutine,
    handleSaveEditedRoutine,
    handleDeleteRoutine,
    handleClearHistory,
    handleAddSessionToLog,
    handleLogout,
    handleLoginSuccess,
    handleTimerFinished
  } = useRoutineStore();

  const showEmailConfirmedAlert = useRoutineStore((state) => state.showEmailConfirmedAlert);

  // Auto-dismiss confirmation toast after 6 seconds
  useEffect(() => {
    if (showEmailConfirmedAlert) {
      const timer = setTimeout(() => {
        useRoutineStore.setState({ showEmailConfirmedAlert: false });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showEmailConfirmedAlert]);

  // Initialize and load state from Supabase / localStorage on mount
  useEffect(() => {
    initializeStore();
  }, []);

  // Redirect to dashboard if logged in and on landing/auth screens
  useEffect(() => {
    if (user && (currentScreen === 'landing' || currentScreen === 'auth')) {
      setCurrentScreen('dashboard');
    }
  }, [user, currentScreen]);

  // Redirect to landing if not logged in and trying to access app screens
  useEffect(() => {
    if (!user && currentScreen !== 'landing' && currentScreen !== 'auth') {
      setCurrentScreen('landing');
    }
  }, [user, currentScreen]);

  // Update browser tab heading (document title) based on the active screen
  useEffect(() => {
    const screenTitles: Record<ActiveScreen, string> = {
      landing: 'Timings',
      auth: 'Authentication',
      dashboard: 'Dashboard',
      routines: 'Routines',
      history: 'History',
      settings: 'Settings',
      timer: 'Timer',
      'edit-routine': 'Edit Routine',
      profile: 'Profile',
    };

    const pageTitle = screenTitles[currentScreen];
    if (currentScreen === 'landing') {
      document.title = 'Timings';
    } else {
      document.title = `${pageTitle} | Timings`;
    }
  }, [currentScreen]);

  const startRoutine = (routine: Routine) => {
    handleStartRoutine(routine);
    setCurrentScreen('timer');
  };

  const handleEditRoutine = (routine: Routine) => {
    handleStartRoutine(routine);
    setCurrentScreen('edit-routine');
  };

  const handleCreateRoutine = () => {
    useRoutineStore.setState({ activeRoutine: null });
    setCurrentScreen('edit-routine');
  };

  const saveEditedRoutine = async (savedRoutine: Routine) => {
    await handleSaveEditedRoutine(savedRoutine);
    setCurrentScreen('routines');
  };

  const logout = async () => {
    await handleLogout();
    setCurrentScreen('landing');
  };

  const onLoginSuccess = async (signedInUser: User) => {
    const { data: authSession } = await supabase.auth.getSession();
    if (authSession?.session?.user) {
      setCurrentScreen('dashboard');
    } else {
      // Mock login fallback
      await handleLoginSuccess(signedInUser, 'mock-user-id');
      setCurrentScreen('dashboard');
    }
  };

  const timerFinished = async (completed: boolean, sessionLengthInMinutes: number) => {
    await handleTimerFinished(completed, sessionLengthInMinutes);
    setCurrentScreen('dashboard');
  };

  // Render a loading state during the initial Supabase session verification
  if (isLoading) {
    return (
      <div className="flex bg-[#0d1527] items-center justify-center min-h-screen text-sans select-none">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-transparent animate-spin mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-mono">Synchronizing workspace...</p>
        </div>
      </div>
    );
  }

  // Render Screens based on active view selection
  const renderMainContent = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            routines={routines}
            onToggleRoutineCheck={handleToggleRoutineCheck}
            onStartRoutine={startRoutine}
            onNavigate={setCurrentScreen}
            streakDays={streakDays}
          />
        );
      case 'routines':
        return (
          <RoutinesDashboard
            routines={routines}
            onStartRoutine={startRoutine}
            onEditRoutine={handleEditRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onCreateRoutine={handleCreateRoutine}
          />
        );
      case 'edit-routine':
        return (
          <RoutineEditor
            routine={activeRoutine}
            onSave={saveEditedRoutine}
            onCancel={() => setCurrentScreen('routines')}
          />
        );
      case 'history':
        return (
          <HistoryDashboard
            history={history}
            onClearHistory={handleClearHistory}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            user={user}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            history={history}
            routines={routines}
            streakDays={streakDays}
            onUpdateUser={async (updatedUser) => {
              useRoutineStore.setState({ user: updatedUser });
              const { data: authSession } = await supabase.auth.getSession();
              if (authSession?.session?.user) {
                await supabase
                  .from('profiles')
                  .update({ name: updatedUser.name })
                  .eq('id', authSession.session.user.id);
              } else {
                localStorage.setItem('timings_user', JSON.stringify(updatedUser));
              }
            }}
            onResetApp={() => {
              localStorage.removeItem('timings_saved_routines');
              localStorage.removeItem('timings_checklist');
              localStorage.removeItem('timings_history');
              localStorage.removeItem('timings_user');
              localStorage.removeItem('timings_profile_avatar_id');
              window.location.reload();
            }}
          />
        );
      default:
        return <LandingPage onStart={() => setCurrentScreen('auth')} onNavigate={setCurrentScreen} />;
    }
  };

  // High Level Layout Outer shell switcher page frames
  if (currentScreen === 'landing') {
    return <LandingPage onStart={() => setCurrentScreen('auth')} onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen onLoginSuccess={onLoginSuccess} onBackToLanding={() => setCurrentScreen('landing')} />;
  }

  if (currentScreen === 'timer' && activeRoutine) {
    return <TimerScreen routine={activeRoutine} onClose={timerFinished} />;
  }

  return (
    <div className="flex bg-background text-on-surface min-h-screen text-sans select-none relative pb-16 md:pb-0">
      {/* Toast Notification for Email Confirmation */}
      <AnimatePresence>
        {showEmailConfirmedAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-surface-container-high border border-emerald-500/30 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 font-sans">Email Confirmed!</h4>
                  <p className="text-xs text-on-surface-variant font-sans mt-0.5">Your account has been successfully verified.</p>
                </div>
              </div>
              <button 
                onClick={() => useRoutineStore.setState({ showEmailConfirmedAlert: false })}
                className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left sidebar nav container */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        user={user}
        onLogout={logout}
      />

      {/* Primary body screen section */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {renderMainContent()}
      </main>
    </div>
  );
}

