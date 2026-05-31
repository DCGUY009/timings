import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, UserCircle, CheckCircle, Smartphone } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export default function AuthScreen({ onLoginSuccess, onBackToLanding }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('samudrala.santhosh.19cse@bmu.edu.in'); 
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Santhosh');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [isAddingGoogleAccount, setIsAddingGoogleAccount] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(`Welcome back, ${name}! Redirecting to console...`);
    setTimeout(() => {
      onLoginSuccess({
        email: email || 'user@domain.com',
        name: name || 'Santhosh',
      });
    }, 1200);
  };

  const handleGoogleLogin = (selectedName: string, selectedEmail: string) => {
    setShowGoogleChooser(false);
    setSuccessMsg(`Connecting secure Google Account: ${selectedName}...`);
    setTimeout(() => {
      onLoginSuccess({
        email: selectedEmail,
        name: selectedName,
      });
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full min-h-screen bg-background grid-bg text-on-surface flex flex-col justify-center items-center py-12 px-6 select-none relative"
    >
      {/* Brand Header */}
      <div 
        onClick={onBackToLanding}
        className="flex flex-col items-center mb-8 cursor-pointer text-center group"
      >
        <span className="text-4xl font-black tracking-tight text-primary-container group-hover:text-white transition-colors font-sans">
          Timings
        </span>
      </div>

      {/* Main card box with high fidelity */}
      <div className="w-full max-w-md bg-surface-container/85 border border-outline-variant/30 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-indigo-500 to-teal-400"></div>

        {/* Tab triggers */}
        <div className="flex border-b border-outline-variant/30 mb-8 font-mono">
          <button
            onClick={() => { setActiveTab('login'); setName('Santhosh'); }}
            className={`flex-1 pb-4 text-center text-sm font-semibold tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'border-primary-container text-primary-container font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setPassword(''); }}
            className={`flex-1 pb-4 text-center text-sm font-semibold tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'border-primary-container text-primary-container font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign Up
          </button>
        </div>

        {successMsg ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <CheckCircle className="w-16 h-16 text-primary-container mb-4 pulse-border rounded-full p-2" />
            <h3 className="font-sans font-bold text-xl text-primary-container mb-2">Authenticated</h3>
            <p className="text-body-md text-on-surface-variant font-mono">{successMsg}</p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-outline mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                      <UserCircle className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name (e.g. Santhosh)"
                      className="w-full bg-surface-container-lowest border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl pl-10 pr-4 py-3.5 text-sm font-sans placeholder-outline-variant text-on-surface outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-outline mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl pl-10 pr-4 py-3.5 text-sm font-sans placeholder-outline-variant text-on-surface outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-outline">
                    Password
                  </label>
                  {activeTab === 'login' && (
                    <button type="button" className="text-xs font-mono text-primary-fixed-dim hover:text-primary-container transition-colors">
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl pl-10 pr-4 py-3.5 text-sm font-sans placeholder-outline-variant text-on-surface outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="flex items-center gap-2 pt-1 select-none text-xs font-sans text-on-surface-variant">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  Account configuration is active.
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary-container hover:bg-white text-on-primary-container font-sans font-bold text-body-md py-4 rounded-xl transition-all cursor-pointer glow-button shadow-cyan-500/10 mt-6 active:scale-[0.98]"
              >
                Access Console <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Simulated Divider OR */}
            <div className="relative my-6 select-none font-mono text-xs text-outline-variant flex items-center justify-center">
              <span className="absolute inset-x-0 h-[1px] bg-outline-variant/20"></span>
              <span className="relative bg-[#0d1527] px-3 z-10 font-bold uppercase tracking-wider">OR</span>
            </div>

            {/* Google Sign In button */}
            <button
              type="button"
              onClick={() => setShowGoogleChooser(true)}
              className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-sans font-semibold py-3.5 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
            >
              {/* Colored SVG Google G */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.93 1 12 1 7.35 1 3.37 3.68 1.48 7.58l3.76 2.92C6.12 7.04 8.84 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.52 12.28c0-.84-.08-1.64-.24-2.4H12v4.56h6.48c-.28 1.44-1.08 2.68-2.28 3.48l3.52 2.72c2.08-1.92 3.28-4.76 3.28-8.36z" />
                <path fill="#FBBC05" d="M5.24 14.5c-.24-.72-.36-1.48-.36-2.25s.12-1.53.36-2.25L1.48 7.08C.56 8.94 0 11.01 0 13.2s.56 4.26 1.48 6.12l3.76-2.82z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.52-2.72c-1.1.73-2.5 1.16-4.44 1.16-3.16 0-5.88-2-6.84-4.96L1.4 16.38C3.3 20.3 7.3 23 12 23z" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}
      </div>

      {/* Sub Footer links */}
      <div className="flex space-x-6 mt-8 text-xs font-mono text-outline">
        <a href="#" className="hover:text-on-surface transition-colors">Privacy</a>
        <span>•</span>
        <a href="#" className="hover:text-on-surface transition-colors">Terms</a>
        <span>•</span>
        <a href="#" className="hover:text-on-surface transition-colors">Contact</a>
      </div>

      {/* STUNNING INTERACTIVE GOOGLE CHOOSER OVERLAY DIALOG */}
      <AnimatePresence>
        {showGoogleChooser && (
          <div className="fixed inset-0 bg-[#000000]/65 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border border-gray-200"
            >
              {/* Google Brand top-header line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>

              {/* Header */}
              <div className="p-6 text-center border-b border-gray-100">
                {/* Micro Google Logo */}
                <div className="flex justify-center mb-3">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-sans text-gray-800">Sign in with Google</h3>
                <p className="text-xs text-gray-500 font-sans mt-1">to continue to <span className="font-semibold text-gray-700">Timings Console</span></p>
              </div>

              {/* Account List body */}
              <div className="p-6 space-y-4">
                {isAddingGoogleAccount ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (customGoogleEmail && customGoogleName) {
                      handleGoogleLogin(customGoogleName, customGoogleEmail);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 font-mono">Gmail Address</label>
                      <input 
                        type="email" 
                        required
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="john.doe@gmail.com"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono text-gray-800 focus:border-blue-500 focus:outline-none placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsAddingGoogleAccount(false)}
                        className="flex-1 border border-gray-300 text-gray-600 text-xs font-sans font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2.5">
                    {/* Santhosh active account block */}
                    <button
                      onClick={() => handleGoogleLogin('Santhosh', 'samudrala.santhosh.19cse@bmu.edu.in')}
                      className="w-full flex items-center justify-between text-left p-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                          S
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-800 block">Santhosh</span>
                          <span className="text-xs font-mono text-gray-500 block">samudrala.santhosh.19cse@bmu.edu.in</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider group-hover:bg-blue-100">
                        Default
                      </span>
                    </button>

                    {/* Choose another account block */}
                    <button
                      onClick={() => setIsAddingGoogleAccount(true)}
                      className="w-full flex items-center gap-3 text-left p-3.5 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer text-gray-600 hover:text-gray-900"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg">
                        +
                      </div>
                      <span className="text-sm font-semibold">Use another Google Account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom legal notice */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-[10px] text-gray-500 leading-relaxed font-sans flex justify-between items-center">
                <span>Safe & Secured through Google OAuth API</span>
                <button 
                  onClick={() => setShowGoogleChooser(false)} 
                  className="text-xs font-sans font-bold text-gray-700 hover:text-red-500 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
