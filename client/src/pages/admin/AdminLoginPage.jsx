import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    isAdmin,
    signInWithGoogle,
    claimAdminAccess,
    loginAsDemo,
    logout,
  } = useAuth();

  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClaimAdmin = async (e) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      setError('Please enter the Admin Secret Key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // If user not logged in yet, prompt or create session
      if (!currentUser) {
        throw new Error('Please sign in with your Google account first, then enter your Admin Secret Key');
      }

      await claimAdminAccess(secretKey.trim());
      setSuccessMsg('Admin access verified! Redirecting to Dashboard...');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid Admin Secret Key');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        setSuccessMsg(`Signed in as ${user.email}. Enter your Admin Secret Key below to unlock dashboard.`);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    await loginAsDemo('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-[32px] p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            Store Owner Portal
          </span>
          <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
            Kitchen & Admin Access
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Real-time orders stream, menu control & store analytics
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If already Admin */}
        {isAdmin ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl">
              <p className="text-xs text-stone-400 font-medium">Currently Authenticated as:</p>
              <p className="text-sm font-bold text-white mt-0.5">{currentUser?.email || 'Store Owner'}</p>
              <span className="inline-block mt-1 text-[10px] font-black text-brand-400 bg-brand-400/10 px-2.5 py-0.5 rounded-full border border-brand-400/20">
                ACTIVE ADMIN
              </span>
            </div>

            <button
              onClick={() => navigate('/admin')}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <span>Enter Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await logout();
              }}
              className="text-xs text-stone-500 hover:text-stone-300 font-semibold transition"
            >
              Sign out / Switch account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Option 1: Sign in with Google */}
            {!currentUser && (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleAdminLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs flex items-center justify-center gap-3 transition"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign in as Admin with Google</span>
                </button>

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-800" />
                  </div>
                  <span className="relative bg-stone-950 px-3 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    Or unlock with Admin Key
                  </span>
                </div>
              </div>
            )}

            {/* Option 2: Enter Admin Secret Key */}
            <form onSubmit={handleClaimAdmin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Admin Passkey / Master Secret
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter admin secret key..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Default passkey: <code className="text-brand-400 font-mono">snackcraft-admin-2026</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-brand-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{loading ? 'Verifying...' : 'Unlock Admin Portal'}</span>
              </button>
            </form>

            {/* Quick local testing */}
            <div className="pt-3 border-t border-stone-900 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDemoAdmin}
                className="text-[11px] font-bold text-stone-400 hover:text-brand-400 inline-flex items-center gap-1 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Quick Test: Sign in as Demo Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Back to Home Link */}
        <div className="mt-6 pt-4 border-t border-stone-900 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Snack Store Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

