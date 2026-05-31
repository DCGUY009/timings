import { ActiveScreen, User } from '../types';
import { LayoutDashboard, ClipboardList, History, Settings, UserCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ currentScreen, onNavigate, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ActiveScreen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routines' as ActiveScreen, label: 'Routines', icon: ClipboardList },
    { id: 'history' as ActiveScreen, label: 'History', icon: History },
    { id: 'settings' as ActiveScreen, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 min-h-screen bg-surface-container-lowest border-r border-outline-variant/30 py-8 px-6 text-on-surface sticky top-0 h-screen select-none shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center justify-center mb-10 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className="text-2xl font-bold tracking-tight text-primary-container font-sans text-center">
              Timings
            </span>
          </div>

          {/* Nav List */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentScreen === item.id || 
                               (item.id === 'routines' && currentScreen === 'edit-routine');
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-sans font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container font-semibold glow-active'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`} />
                  <span className="text-body-md">{item.label}</span>
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile section at the bottom */}
        {user ? (
          <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
            <div 
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-3 cursor-pointer hover:bg-surface-container-low p-2 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all text-left group/user ${
                currentScreen === 'profile' ? 'bg-secondary-container font-semibold' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-surface-variant border border-outline-variant/50 flex items-center justify-center text-primary-container group-hover/user:scale-105 transition-transform shrink-0">
                <UserCircle className="w-6 h-6 text-primary-container" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate text-on-surface">{user.name}</span>
                <span className="text-[11px] text-[#849495] font-mono truncate group-hover/user:text-primary-container transition-colors font-bold">
                  Conductor Profile
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-mono text-on-surface-variant hover:text-error hover:border-error/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-sans font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
          >
            <UserCircle className="w-5 h-5 text-primary-container animate-pulse" />
            <span className="text-body-md font-semibold text-primary-container">Sign In / Register</span>
          </button>
        )}
      </aside>

      {/* Mobile Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex md:hidden justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant/30 shadow-2xl rounded-t-xl select-none">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentScreen === item.id || 
                           (item.id === 'routines' && currentScreen === 'edit-routine');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-primary-container bg-surface-container-high scale-[1.02]'
                  : 'text-on-surface-variant active:bg-surface-variant'
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-sans font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Mobile profile link / trigger */}
        <button
          onClick={() => onNavigate(user ? 'profile' : 'auth')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-xl transition-all duration-150 ${
            currentScreen === 'profile' || currentScreen === 'auth' 
              ? 'text-primary-container bg-surface-container-high Scale-[1.02]' 
              : 'text-on-surface-variant'
          }`}
        >
          <UserCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-sans font-medium tracking-tight">
            {user ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </nav>
    </>
  );
}
