import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, UserCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../utils/supabaseClient';
import InfoModal from './InfoModal';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export default function AuthScreen({ onLoginSuccess, onBackToLanding }: AuthScreenProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    defaultTab: 'privacy' | 'terms' | 'contact';
  }>({
    isOpen: false,
    defaultTab: 'privacy',
  });

  const openInfoModal = (tab: 'privacy' | 'terms' | 'contact') => {
    setModalState({
      isOpen: true,
      defaultTab: tab,
    });
  };
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (activeTab === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Supabase Auth Signin Error Details:", error);
        setErrorMsg(`${error.message} (Status: ${error.status || 'unknown'})`);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        setSuccessMsg(`Welcome back! Redirecting to console...`);
        setTimeout(() => {
          onLoginSuccess({
            email: data.user!.email || email,
            name: data.user!.user_metadata?.name || email.split('@')[0]
          });
        }, 1000);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        console.error("Supabase Auth Signup Error Details:", error);
        setErrorMsg(`${error.message} (Status: ${error.status || 'unknown'})`);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        if (!data.session) {
          // Email confirmation is required, session is null
          setVerificationSent(email);
          setIsLoading(false);
        } else {
          // Email confirmation is disabled, session exists
          setSuccessMsg(`Account created! Redirecting to console...`);
          setTimeout(() => {
            onLoginSuccess({
              email: data.user!.email || email,
              name: name
            });
          }, 1000);
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        console.error("Supabase Google Signin Error Details:", error);
        setErrorMsg(`${error.message} (Status: ${error.status || 'unknown'})`);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Supabase Google Signin Unexpected Error Details:", err);
      setErrorMsg(err.message || 'An unexpected error occurred during Google Sign In');
      setIsLoading(false);
    }
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

        {verificationSent ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 mb-6 pulse-border rounded-full p-2 flex items-center justify-center">
              <Mail className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-sans font-bold text-xl text-emerald-400 mb-3">Verification Email Sent</h3>
            <p className="text-body-md text-on-surface-variant font-mono mb-6 leading-relaxed max-w-sm">
              We have sent a confirmation link to <span className="text-white font-semibold">{verificationSent}</span>. Please click the link to activate your account.
            </p>
            <button
              onClick={() => {
                setVerificationSent(null);
                setActiveTab('login');
                setPassword('');
              }}
              className="w-full bg-primary-container hover:bg-white text-on-primary-container font-sans font-bold text-body-md py-4 rounded-xl transition-all cursor-pointer glow-button shadow-cyan-500/10 active:scale-[0.98]"
            >
              Back to Log In
            </button>
          </motion.div>
        ) : successMsg ? (
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
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-sans rounded-xl p-3.5 mb-4">
                {errorMsg}
              </div>
            )}
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container rounded-xl pl-10 pr-10 py-3.5 text-sm font-sans placeholder-outline-variant text-on-surface outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary-container hover:bg-white disabled:bg-surface-container-low disabled:text-outline text-on-primary-container font-sans font-bold text-body-md py-4 rounded-xl transition-all cursor-pointer glow-button shadow-cyan-500/10 mt-6 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary-container border-t-transparent animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Access Console <ArrowRight className="w-4 h-4" />
                  </>
                )}
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
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container-low disabled:bg-surface-container-low disabled:text-outline text-on-surface font-sans font-semibold py-3.5 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
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
        <button 
          onClick={() => openInfoModal('privacy')} 
          className="hover:text-on-surface transition-colors cursor-pointer"
        >
          Privacy
        </button>
        <span>•</span>
        <button 
          onClick={() => openInfoModal('terms')} 
          className="hover:text-on-surface transition-colors cursor-pointer"
        >
          Terms
        </button>
        <span>•</span>
        <button 
          onClick={() => openInfoModal('contact')} 
          className="hover:text-on-surface transition-colors cursor-pointer"
        >
          Contact
        </button>
      </div>

      <InfoModal
        isOpen={modalState.isOpen}
        defaultTab={modalState.defaultTab}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
}
