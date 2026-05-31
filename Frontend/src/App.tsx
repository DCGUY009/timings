import { useState, useEffect } from 'react';
import { ActiveScreen, Routine, SessionHistoryItem, ChecklistItem, User } from './types';
import { DEFAULT_ROUTINES, DEFAULT_CHECKLIST, DEFAULT_HISTORY } from './data/defaultRoutines';

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
  const [user, setUser] = useState<User | null>({
    name: 'Santhosh',
    email: 'samudrala.santhosh.19cse@bmu.edu.in'
  });

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [streakDays, setStreakDays] = useState(5);

  // Initialize and load state from localStorage or defaults
  useEffect(() => {
    // 1. Load Routines
    const savedRoutines = localStorage.getItem('timings_saved_routines');
    if (savedRoutines) {
      const parsed = JSON.parse(savedRoutines) as Routine[];
      const finalized = parsed.map(r => ({
        ...r,
        checklist: r.checklist || [...DEFAULT_CHECKLIST]
      }));
      setRoutines(finalized);
    } else {
      setRoutines([...DEFAULT_ROUTINES]);
      localStorage.setItem('timings_saved_routines', JSON.stringify(DEFAULT_ROUTINES));
    }

    // 2. Load Checklist
    const savedChecklist = localStorage.getItem('timings_checklist');
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist));
    } else {
      setChecklist([...DEFAULT_CHECKLIST]);
      localStorage.setItem('timings_checklist', JSON.stringify(DEFAULT_CHECKLIST));
    }

    // 3. Load History logs
    const savedHistory = localStorage.getItem('timings_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory([...DEFAULT_HISTORY]);
      localStorage.setItem('timings_history', JSON.stringify(DEFAULT_HISTORY));
    }

    // 4. Load User profile
    const savedUser = localStorage.getItem('timings_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleToggleRoutineCheck = (routineId: string, itemId: string) => {
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
    setRoutines(updated);
    localStorage.setItem('timings_saved_routines', JSON.stringify(updated));
  };

  const handleToggleCheck = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    localStorage.setItem('timings_checklist', JSON.stringify(updated));
  };

  const handleStartRoutine = (routine: Routine) => {
    setActiveRoutine(routine);
    setCurrentScreen('timer');
  };

  const handleEditRoutine = (routine: Routine) => {
    setActiveRoutine(routine);
    setCurrentScreen('edit-routine');
  };

  const handleCreateRoutine = () => {
    setActiveRoutine(null); // Create brand new sequence from canvas
    setCurrentScreen('edit-routine');
  };

  const handleSaveEditedRoutine = (savedRoutine: Routine) => {
    let updatedRoutines: Routine[] = [];
    const exists = routines.some((r) => r.id === savedRoutine.id);
    
    if (exists) {
      updatedRoutines = routines.map((r) => r.id === savedRoutine.id ? savedRoutine : r);
    } else {
      updatedRoutines = [...routines, savedRoutine];
    }
    
    setRoutines(updatedRoutines);
    localStorage.setItem('timings_saved_routines', JSON.stringify(updatedRoutines));
    setCurrentScreen('routines');
  };

  const handleDeleteRoutine = (id: string) => {
    const updated = routines.filter((r) => r.id !== id);
    setRoutines(updated);
    localStorage.setItem('timings_saved_routines', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.setItem('timings_history', JSON.stringify([]));
  };

  const handleAddSessionToLog = (item: SessionHistoryItem) => {
    const updated = [item, ...history];
    setHistory(updated);
    localStorage.setItem('timings_history', JSON.stringify(updated));
    setStreakDays((prev) => prev + 1);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('timings_user');
    setCurrentScreen('landing');
  };

  const handleLoginSuccess = (signedInUser: User) => {
    setUser(signedInUser);
    localStorage.setItem('timings_user', JSON.stringify(signedInUser));
    setCurrentScreen('dashboard');
  };

  // Callback once timing workspace concludes active step running
  const handleTimerFinished = (completed: boolean, sessionLengthInMinutes: number) => {
    if (completed && activeRoutine) {
      // Build session log entry
      const logItem: SessionHistoryItem = {
        id: `log-${Date.now()}`,
        routineName: activeRoutine.name,
        timestamp: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        durationMinutes: sessionLengthInMinutes,
        completionRate: 100
      };

      // Update routine's "last executed timestamp"
      const updatedRoutines = routines.map((r) => {
        if (r.id === activeRoutine.id) {
          return {
            ...r,
            lastExecuted: `Today, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          };
        }
        return r;
      });

      setRoutines(updatedRoutines);
      localStorage.setItem('timings_saved_routines', JSON.stringify(updatedRoutines));
      
      handleAddSessionToLog(logItem);
    }
    setActiveRoutine(null);
    setCurrentScreen('dashboard');
  };

  const handleTryPresetOnLanding = (presetId: string) => {
    const matched = routines.find((r) => r.id === presetId);
    if (matched) {
      handleStartRoutine(matched);
    }
  };

  // Render Screens based on active view selection
  const renderMainContent = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            routines={routines}
            onToggleRoutineCheck={handleToggleRoutineCheck}
            onStartRoutine={handleStartRoutine}
            onNavigate={setCurrentScreen}
            streakDays={streakDays}
          />
        );
      case 'routines':
        return (
          <RoutinesDashboard
            routines={routines}
            onStartRoutine={handleStartRoutine}
            onEditRoutine={handleEditRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onCreateRoutine={handleCreateRoutine}
          />
        );
      case 'edit-routine':
        return (
          <RoutineEditor
            routine={activeRoutine}
            onSave={handleSaveEditedRoutine}
            onCancel={() => setCurrentScreen('routines')}
          />
        );
      case 'history':
        return (
          <HistoryDashboard
            history={history}
            onClearHistory={handleClearHistory}
            onAddSimulatedHistory={handleAddSessionToLog}
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
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('timings_user', JSON.stringify(updatedUser));
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
        return <LandingPage onStart={() => setCurrentScreen('routines')} onNavigate={setCurrentScreen} onTryPreset={handleTryPresetOnLanding} />;
    }
  };

  // High Level Layout Outer shell switcher page frames
  if (currentScreen === 'landing') {
    return <LandingPage onStart={() => setCurrentScreen('dashboard')} onNavigate={setCurrentScreen} onTryPreset={handleTryPresetOnLanding} />;
  }

  if (currentScreen === 'auth') {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} onBackToLanding={() => setCurrentScreen('landing')} />;
  }

  if (currentScreen === 'timer' && activeRoutine) {
    return <TimerScreen routine={activeRoutine} onClose={handleTimerFinished} />;
  }

  return (
    <div className="flex bg-background text-on-surface min-h-screen text-sans select-none relative pb-16 md:pb-0">
      {/* Left sidebar nav container */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Primary body screen section */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {renderMainContent()}
      </main>
    </div>
  );
}
