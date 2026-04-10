
import React, { useState } from 'react';
import { Mail, Lock, UserPlus, LogIn, Milk, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { signIn, signUp, resetPassword } from '../services/firebase';

export const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'LOGIN') {
        await signIn(email, password);
      } else if (mode === 'SIGNUP') {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signUp(email, password);
      } else if (mode === 'FORGOT') {
        await resetPassword(email);
        setSuccess("Password reset link sent to your email!");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-blue-600 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden animate-in fade-in duration-500">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[5%] left-[-15%] w-72 h-72 bg-indigo-400/20 rounded-full blur-[80px]"></div>

      <div className="w-full max-w-sm z-10 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-xl border border-white/20 animate-bounce">
            <Milk size={44} className="text-white fill-white/10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight leading-none mb-2">DairyTrack</h1>
            <p className="text-blue-100 text-sm font-semibold uppercase tracking-[0.2em] opacity-80">
              {mode === 'LOGIN' ? 'Welcome Back' : mode === 'SIGNUP' ? 'Create Account' : 'Recovery'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-white/20 border border-white/30 p-4 pl-12 rounded-2xl outline-none focus:bg-white/30 focus:border-white/50 text-white placeholder-blue-100/50 font-bold transition-all"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/50" size={20} />
            </div>
          </div>

          {mode !== 'FORGOT' && (
            <div className="space-y-1.5">
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/20 border border-white/30 p-4 pl-12 rounded-2xl outline-none focus:bg-white/30 focus:border-white/50 text-white placeholder-blue-100/50 font-bold transition-all"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/50" size={20} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/80 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/80 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span>{mode === 'LOGIN' ? 'Sign In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Reset Link'}</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 pt-2">
          {mode === 'LOGIN' ? (
            <>
              <button onClick={() => setMode('FORGOT')} className="text-blue-100 text-sm font-bold hover:underline opacity-80">
                Forgot Password?
              </button>
              <div className="h-px w-20 bg-white/20"></div>
              <button onClick={() => setMode('SIGNUP')} className="text-white font-black flex items-center gap-2 group">
                <span className="opacity-80">New here?</span> 
                <span className="group-hover:translate-x-1 transition-transform">Create Account</span>
              </button>
            </>
          ) : (
            <button onClick={() => setMode('LOGIN')} className="text-white font-black flex items-center gap-2 group">
              <span className="opacity-80">Already have account?</span> 
              <span className="group-hover:translate-x-[-4px] transition-transform">Sign In</span>
            </button>
          )}
        </div>
      </div>

      <p className="absolute bottom-8 text-blue-100/40 text-[10px] font-black uppercase tracking-[0.3em]">
        Professional Dairy Management
      </p>
    </div>
  );
};

const CheckCircle2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
