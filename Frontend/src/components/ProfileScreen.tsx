import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, SessionHistoryItem, Routine } from '../types';
import { 
  UserCircle, Mail, Flame, Clock, Award, ShieldCheck, 
  Trash2, RefreshCw, Check, Sparkles, Star, Calendar, Zap, Edit3, X
} from 'lucide-react';

interface ProfileScreenProps {
  user: User | null;
  history: SessionHistoryItem[];
  routines: Routine[];
  streakDays: number;
  onUpdateUser: (updatedUser: User) => void;
  onResetApp: () => void;
}

const AVATAR_STYLINGS = [
  { id: 'zen', name: 'Lotus Teal', bg: 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#a3e635]', colorCode: '#a3e635' },
  { id: 'work', name: 'Deep Indigo', bg: 'bg-[#6366f1]/10 border-[#6366f1]/30 text-[#6366f1]', colorCode: '#6366f1' },
  { id: 'hiit', name: 'Coral Amber', bg: 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#f59e0b]', colorCode: '#f59e0b' },
  { id: 'flow', name: 'Cosmic Sky', bg: 'bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]', colorCode: '#06b6d4' },
];

export default function ProfileScreen({ 
  user, 
  history, 
  routines, 
  streakDays, 
  onUpdateUser, 
  onResetApp 
}: ProfileScreenProps) {
  const activeUser = user || {
    name: 'Anonymous Conductor',
    email: 'local.conductor@sequence.io',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeUser.name);
  const [editEmail, setEditEmail] = useState(activeUser.email);
  const [activeAvatarId, setActiveAvatarId] = useState(() => {
    const saved = localStorage.getItem('timings_profile_avatar_id');
    return saved || 'zen';
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  // Total calculations
  const totalMinutes = history.reduce((sum, item) => sum + item.durationMinutes, 0);
  const totalCompletedCount = history.length;
  const averageCompletion = history.length > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.completionRate, 0) / history.length) 
    : 0;

  const selectedAvatar = AVATAR_STYLINGS.find(a => a.id === activeAvatarId) || AVATAR_STYLINGS[0];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...activeUser,
      name: editName.trim() || 'Anonymous Conductor',
      email: editEmail.trim() || 'local.conductor@sequence.io',
    });
    setIsEditing(false);
    setShowSuccessMsg(true);
    setTimeout(() => setShowSuccessMsg(false), 2400);
  };

  const selectAvatar = (id: string) => {
    setActiveAvatarId(id);
    localStorage.setItem('timings_profile_avatar_id', id);
  };

  const milestones = [
    {
      id: 'first-step',
      title: 'Initial Ascent',
      desc: 'Completed your very first sound-guided routine.',
      icon: Zap,
      unlocked: totalCompletedCount > 0,
      req: 'Complete 1 session'
    },
    {
      id: 'streak-ignite',
      title: 'Rhythmic Spark',
      desc: 'Maintained a solid consecutive daily practice streak.',
      icon: Flame,
      unlocked: streakDays >= 5,
      req: '5-Day Streak'
    },
    {
      id: 'focus-expert',
      title: 'Mindful Sovereign',
      desc: 'Invested over 100 minutes of pure focus in quiet flow states.',
      icon: Clock,
      unlocked: totalMinutes >= 100,
      req: '100+ Total Minutes'
    },
    {
      id: 'creator-touch',
      title: 'Custom Architect',
      desc: 'Expanded the application with custom routines.',
      icon: Award,
      unlocked: routines.length > 3,
      req: 'Create custom routine'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 p-6 md:p-12 text-on-surface overflow-y-auto max-w-4xl mx-auto w-full select-none"
    >
      {/* Title Header */}
      <div className="mb-8 border-b border-outline-variant/15 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-on-surface">
            Profile & Settings
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-1.5 leading-normal">
            Analyze focus accomplishments, configure account details, and check historic achievements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> SECURE SECURED SYNC
          </span>
        </div>
      </div>

      {showSuccessMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary-container/10 border border-primary-container/20 text-primary-container font-sans text-xs rounded-xl flex items-center gap-2 font-semibold"
        >
          <Check className="w-4 h-4 text-emerald-400" /> Credentials updated successfully.
        </motion.div>
      )}

      <div className="space-y-8">
        
        {/* BIO CARD: Styled as a beautifully integrated master card */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Left Box: Avatar display and active styling circle */}
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${selectedAvatar.bg}`}>
                <UserCircle className="w-14 h-14" style={{ color: selectedAvatar.colorCode }} />
              </div>
            </div>

            {/* Right Box: Info block or Form and picker */}
            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-outline mb-1.5 font-bold">Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl px-3 py-2 text-xs font-sans text-on-surface outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#849495] mb-1.5 font-bold">Email</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-surface-container-highest border border-outline-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl px-3 py-2 text-xs font-mono text-on-surface outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center bg-primary-container hover:bg-white text-on-primary-container text-xs font-sans font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(activeUser.name);
                        setEditEmail(activeUser.email);
                      }}
                      className="inline-flex items-center justify-center border border-outline-variant text-xs font-sans text-on-surface hover:bg-surface-container-high px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 justify-center md:justify-start">
                    <h3 className="font-sans font-extrabold text-2xl text-on-surface">{activeUser.name}</h3>
                    <span className="text-xs font-mono text-[#849495] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/20">
                      {totalMinutes > 300 ? 'Sovereign Conductor' : totalMinutes > 100 ? 'Advanced Planner' : 'Focus Conductor'}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-on-surface-variant">{activeUser.email}</p>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container px-3.5 py-1.5 text-xs font-mono font-bold text-on-surface-variant transition-colors border border-outline-variant/30 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Workspace Info
                    </button>
                  </div>
                </div>
              )}

              {/* Sub: Color Theme picker */}
              <div className="pt-4 border-t border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="font-sans text-xs">
                  <span className="font-bold text-on-surface block">Theme Accent Profile</span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5">Select your primary color highlight.</span>
                </div>

                <div className="flex gap-2 justify-center">
                  {AVATAR_STYLINGS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => selectAvatar(av.id)}
                      className={`h-8 px-3 rounded-lg border text-xs font-mono font-semibold transition-all relative cursor-pointer ${
                        activeAvatarId === av.id
                          ? 'border-primary-container bg-primary-container/10 text-primary-container font-extrabold'
                          : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: av.colorCode }}></span>
                        {av.name.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* METRICS GRID: Centered, extremely scannable bento design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tile 1 */}
          <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold">
              Completed Loops
            </span>
            <div className="mt-4">
              <span className="text-4xl font-extrabold font-sans text-on-surface tracking-tight">
                {totalCompletedCount}
              </span>
              <span className="block text-[10px] text-on-surface-variant font-sans mt-1">
                focus sessions done
              </span>
            </div>
          </div>

          {/* Tile 2 */}
          <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold">
              Total Duration
            </span>
            <div className="mt-4">
              <span className="text-4xl font-extrabold font-sans text-on-surface tracking-tight">
                {totalMinutes}<span className="text-lg font-normal text-on-surface-variant ml-1">m</span>
              </span>
              <span className="block text-[10px] text-on-surface-variant font-sans mt-1">
                practiced in stillness
              </span>
            </div>
          </div>

          {/* Tile 3 */}
          <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#849495] uppercase font-bold">
              Completion Rate
            </span>
            <div className="mt-4">
              <span className="text-4xl font-extrabold font-sans text-on-surface tracking-tight">
                {averageCompletion}%
              </span>
              <span className="block text-[10px] text-on-surface-variant font-sans mt-1">
                routine finishing rate
              </span>
            </div>
          </div>

          {/* Tile 4 */}
          <div className="bg-surface-container-low border border-outline-variant/30 p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-orange-500/5 to-transparent">
            <span className="text-[10px] font-mono tracking-widest text-orange-400 uppercase font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" /> Active Streak
            </span>
            <div className="mt-4">
              <span className="text-4xl font-extrabold font-sans text-orange-400 tracking-tight">
                {streakDays}<span className="text-sm font-normal text-outline ml-1">days</span>
              </span>
              <span className="block text-[10px] text-on-surface-variant font-sans mt-1">
                continuous practice
              </span>
            </div>
          </div>
        </div>

        {/* MILESTONES: Staggered Achievement board */}
        <section className="space-y-4">
          <h3 className="text-xs font-mono font-bold tracking-widest text-[#849495] uppercase">
            Milestones & Achievements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((m) => {
              const GoalIcon = m.icon;
              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex gap-4 ${
                    m.unlocked
                      ? 'bg-surface-container border-primary-container/20 shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/20 opacity-60'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    m.unlocked
                      ? 'bg-primary-container/10 border-primary-container-low text-primary-container'
                      : 'bg-surface-container-highest border-outline-variant text-[#849495]'
                  }`}>
                    <GoalIcon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-sans font-bold text-sm text-on-surface">
                        {m.title}
                      </h4>
                      {m.unlocked ? (
                        <span className="text-[9px] font-mono font-bold text-[#a3e635] bg-[#a3e635]/15 border border-[#a3e635]/25 px-1.5 py-0.2 rounded uppercase">
                          Done
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-outline uppercase">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans text-on-surface-variant leading-relaxed">
                      {m.desc}
                    </p>
                    <span className="block text-[9px] font-mono text-[#849495] mt-1.5">
                      Requirement: {m.req}
                    </span>
                  </div>

                  {m.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-3.5 h-3.5 text-[#eac324] fill-[#eac324] rotate-12" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* DANGER FACTORY DATA SECTION */}
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-sans">
            <div>
              <span className="font-bold text-on-surface block text-base">
                Reset Workspace Data
              </span>
              <span className="text-xs text-on-surface-variant block mt-1 max-w-xl">
                This wipes all custom routines, checklists, and saved history logs from your device storage. The workspace will reset back to its pristine default configurations.
              </span>
            </div>

            {showResetConfirm ? (
              <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    onResetApp();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Wipe Data
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center border border-outline-variant hover:bg-surface-container text-xs font-sans text-on-surface font-semibold py-2 px-3.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-error/10 hover:bg-error hover:text-white border border-error/25 text-error text-xs font-mono font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Wipe Saved Data
              </button>
            )}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
