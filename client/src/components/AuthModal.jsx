import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Mail,
  Phone,
  Lock,
  User,
  Sparkles,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';

export function AuthModal() {
  const {
    currentUser,
    dbUser,
    role,
    isAdmin,
    authModalOpen,
    setAuthModalOpen,
    googleClientId,
    saveGoogleClientId,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    setupRecaptcha,
    sendPhoneOtp,
    loginAsDemo,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google setup states
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(googleClientId || '');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const googleBtnRef = useRef(null);

  // If user is already logged in or modal opens
  useEffect(() => {
    if (authModalOpen) {
      setError('');
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogleSignInClick = async (customParams = null) => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle(customParams);
    } catch (err) {
      if (err.code === 'GOOGLE_CONFIG_REQUIRED') {
        setShowGoogleSetup(true);
      } else {
        const msg = err.message || 'Google authentication failed';
        if (msg.toLowerCase().includes('origin') || msg.toLowerCase().includes('mismatch')) {
          setError(
            'Google OAuth origin mismatch: Please make sure "http://localhost:5173" is added to "Authorized JavaScript origins" for this Client ID in Google Cloud Console.'
          );
        } else if (msg.toLowerCase().includes('popup-closed') || msg.toLowerCase().includes('closed')) {
          setError('Google sign-in popup was closed before completing.');
        } else {
          setError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientIdAndLaunch = async (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) {
      setError('Please paste your Google OAuth Client ID');
      return;
    }
    saveGoogleClientId(clientIdInput.trim());
    setShowGoogleSetup(false);
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to start Google sign in with provided Client ID');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomEmailSignIn = async (e) => {
    e.preventDefault();
    if (!customEmailInput || !customEmailInput.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }
    const cleanEmail = customEmailInput.trim().toLowerCase();
    const cleanName = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    await handleGoogleSignInClick({
      email: cleanEmail,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container');
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const result = await sendPhoneOtp(formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setAuthModalOpen(false);
    } catch (err) {
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto pr-1 -mr-1 flex-1">
          {/* USER ALREADY LOGGED IN VIEW */}
          {currentUser ? (
            <div className="py-2 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl shadow-md border-2 border-white">
                {(currentUser.displayName || currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
              </div>
              <h3 className="text-xl font-black text-stone-900">
                {currentUser.displayName || currentUser.name || 'Valued Customer'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">{currentUser.email}</p>

              <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                <span className="capitalize">{isAdmin ? 'Store Owner / Admin' : 'Customer Account'}</span>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    navigate('/my-orders');
                  }}
                  className="w-full py-3 bg-stone-900 text-white font-bold rounded-2xl text-xs hover:bg-stone-800 transition"
                >
                  View My Orders
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full py-3 bg-brand-500 text-white font-bold rounded-2xl text-xs hover:bg-brand-600 transition"
                  >
                    Go to Admin Dashboard
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setShowGoogleSetup(false);
                  }}
                  className="w-full py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* USER NOT LOGGED IN - AUTH FORMS */
            <>
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2 font-bold text-2xl shadow-sm">
                  🍕
                </div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  {mode === 'login' && 'Welcome to SnackCraft'}
                  {mode === 'signup' && 'Create Your Account'}
                  {mode === 'phone' && 'Sign in with Phone'}
                </h3>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  Order delicious bites, track deliveries & save addresses
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex border-b border-stone-200 mb-5">
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setShowGoogleSetup(false);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                    mode === 'login'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                    setShowGoogleSetup(false);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                    mode === 'signup'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    setMode('phone');
                    setError('');
                    setShowGoogleSetup(false);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                    mode === 'phone'
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  Phone OTP
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium animate-fade-in flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* GOOGLE SETUP MODAL / SHEET IF CLIENT ID NOT SET */}
              {showGoogleSetup ? (
                <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl space-y-3.5 mb-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-600" />
                    <h4 className="text-xs font-bold text-stone-900">
                      Google OAuth Client ID Required
                    </h4>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Google requires an <strong>OAuth 2.0 Web Client ID</strong> to open the real Google account chooser window.
                  </p>

                  <form onSubmit={handleSaveClientIdAndLaunch} className="space-y-2">
                    <label className="block text-[11px] font-bold text-stone-700">
                      Paste Your Google Client ID:
                    </label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="xxxxxx-xxxxxx.apps.googleusercontent.com"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-brand-700 transition shadow-sm"
                    >
                      {loading ? 'Connecting...' : 'Save & Open Google Popup'}
                    </button>
                  </form>

                  <div className="pt-2 border-t border-brand-200/80">
                    <p className="text-[10px] font-bold text-stone-700 mb-1.5">
                      Or Sign in immediately with your Google Email:
                    </p>
                    <form onSubmit={handleCustomEmailSignIn} className="flex gap-1.5">
                      <input
                        type="email"
                        value={customEmailInput}
                        onChange={(e) => setCustomEmailInput(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:border-brand-500"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-3 py-1.5 bg-stone-900 text-white font-bold rounded-xl text-xs hover:bg-stone-800 transition"
                      >
                        Sign In
                      </button>
                    </form>
                  </div>

                  <div className="pt-2 text-[10px] text-stone-500 flex items-center justify-between">
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Get Client ID in Google Cloud</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowGoogleSetup(false)}
                      className="text-stone-500 hover:text-stone-800 underline font-semibold"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                /* GOOGLE BUTTON */
                <div className="space-y-2 mb-4">
                  {/* Fallback & Primary Styled Button */}
                  <button
                    type="button"
                    onClick={() => handleGoogleSignInClick()}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl border-2 border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 active:scale-[0.99] text-stone-800 font-bold text-sm flex items-center justify-center gap-3 transition shadow-sm group"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span>
                      {loading
                        ? 'Connecting...'
                        : mode === 'signup'
                        ? 'Sign up with Google'
                        : 'Continue with Google'}
                    </span>
                  </button>

                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-stone-400 font-extrabold">
                      Or with email
                    </span>
                  </div>
                </div>
              )}

              {/* Email Forms */}
              {!showGoogleSetup && (mode === 'login' || mode === 'signup') && (
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm transition shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Please wait...' : mode === 'login' ? 'Sign In with Email' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* Phone OTP Form */}
              {!showGoogleSetup && mode === 'phone' && (
                <div className="space-y-4">
                  <div id="recaptcha-container"></div>
                  {!confirmationResult ? (
                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Phone Number (10 digits)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm transition shadow-sm"
                      >
                        {loading ? 'Sending OTP...' : 'Send Verification Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Enter 6-digit OTP
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full tracking-widest text-center text-xl font-bold py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-sm transition shadow-sm"
                      >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Demo Switcher */}
        {!currentUser && (
          <div className="mt-4 pt-4 border-t border-stone-100 bg-stone-50 -mx-6 -mb-6 p-5 rounded-b-[32px]">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>Instant Test Switcher</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginAsDemo('customer')}
                className="p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:border-brand-500 hover:text-brand-600 transition text-left shadow-2xs"
              >
                <div className="text-[10px] text-stone-400">Customer Mode</div>
                <div className="font-bold truncate">Demo Customer</div>
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('admin')}
                className="p-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:border-brand-500 hover:text-brand-600 transition text-left shadow-2xs"
              >
                <div className="text-[10px] text-brand-600 font-bold">Admin Portal</div>
                <div className="font-bold truncate">Store Owner</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
