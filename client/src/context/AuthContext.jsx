import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { setTokenGetter, api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Active user
  const [dbUser, setDbUser] = useState(null); // MongoDB User Record
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authSuccessCallback, setAuthSuccessCallback] = useState(null);
  const [googleClientId, setGoogleClientIdState] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || localStorage.getItem('google_client_id')?.trim() || ''
  );

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Hook into client API to fetch active token without re-binding loops
  useEffect(() => {
    setTokenGetter(async () => {
      const user = currentUserRef.current;
      if (user?.getIdToken) {
        try {
          return await user.getIdToken();
        } catch (e) {
          console.warn('[Auth Token Error]:', e);
        }
      }
      if (user?.token) {
        return user.token;
      }
      if (user?.devToken) {
        return user.devToken;
      }
      return null;
    });
  }, []);

  const saveGoogleClientId = (id) => {
    const trimmed = id?.trim() || '';
    setGoogleClientIdState(trimmed);
    if (trimmed) {
      localStorage.setItem('google_client_id', trimmed);
    } else {
      localStorage.removeItem('google_client_id');
    }
  };

  const restoreSavedSession = () => {
    const savedSession =
      localStorage.getItem('snack_user_session') || localStorage.getItem('snack_demo_user');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
        setDbUser(parsed.dbUser || parsed);
      } catch (e) {
        localStorage.removeItem('snack_user_session');
        localStorage.removeItem('snack_demo_user');
      }
    }
  };

  // Restore session strictly ONCE on mount
  useEffect(() => {
    let unsubscribe = null;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          try {
            const data = await api.get('/auth/me');
            if (data?.success && data?.user) {
              setDbUser(data.user);
            }
          } catch (e) {
            console.warn('[AuthContext] Backend sync notice:', e.message);
          }
        } else {
          restoreSavedSession();
        }
        setLoading(false);
      });
    } else {
      restoreSavedSession();
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const syncGoogleWithBackend = async ({ idToken, email, name, uid, avatar }) => {
    const res = await api.post('/auth/google', {
      idToken,
      email,
      name,
      uid,
      avatar,
    });

    if (res?.success && res?.user) {
      const sessionUser = {
        uid: res.user.firebaseUid,
        email: res.user.email,
        displayName: res.user.name,
        photoURL: res.user.avatar || avatar,
        token: res.token,
        dbUser: res.user,
      };

      setCurrentUser(sessionUser);
      setDbUser(res.user);
      localStorage.setItem('snack_user_session', JSON.stringify(sessionUser));

      if (authSuccessCallback) {
        authSuccessCallback();
        setAuthSuccessCallback(null);
      }
      setAuthModalOpen(false);
      return res.user;
    }

    throw new Error(res?.message || 'Google authentication failed on server');
  };

  // Google Sign-In & Sign-Up
  const signInWithGoogle = async (customParams = null) => {
    // 1. If Firebase Auth is fully configured
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        return await syncGoogleWithBackend({
          idToken,
          email: result.user.email,
          name: result.user.displayName,
          uid: result.user.uid,
          avatar: result.user.photoURL,
        });
      } catch (fbErr) {
        if (fbErr.code === 'auth/popup-closed-by-user') {
          throw new Error('Google sign-in popup was closed');
        }
        console.warn('[Firebase Google Auth Warning]:', fbErr.message);
        throw fbErr;
      }
    }

    // 2. If Google Identity Services (GIS) Client ID is available
    const activeClientId = googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (activeClientId) {
      if (!window.google?.accounts?.oauth2) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Google Identity Services script did not load. Check network.')), 4000);
          const interval = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
              clearTimeout(timeout);
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });
      }

      return new Promise((resolve, reject) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              try {
                if (tokenResponse.error) {
                  return reject(new Error(tokenResponse.error_description || tokenResponse.error));
                }
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!userInfoRes.ok) {
                  throw new Error('Could not fetch Google profile with access token');
                }
                const gProfile = await userInfoRes.json();
                const user = await syncGoogleWithBackend({
                  email: gProfile.email,
                  name: gProfile.name,
                  uid: `google_${gProfile.sub}`,
                  avatar: gProfile.picture,
                });
                resolve(user);
              } catch (err) {
                reject(err);
              }
            },
          });
          client.requestAccessToken({ prompt: 'select_account' });
        } catch (e) {
          reject(e);
        }
      });
    }

    // 3. If explicit custom parameters provided (e.g. custom Google email)
    if (customParams?.email) {
      return await syncGoogleWithBackend({
        email: customParams.email,
        name: customParams.name || customParams.email.split('@')[0],
        uid: customParams.uid || `google_${customParams.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        avatar: customParams.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      });
    }

    // 4. If neither is configured, signal that Google configuration is needed
    const configError = new Error('GOOGLE_CONFIG_REQUIRED');
    configError.code = 'GOOGLE_CONFIG_REQUIRED';
    throw configError;
  };

  // Email Sign In
  const signInWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured. Please use Google Sign In.');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    setCurrentUser(result.user);
    try {
      const data = await api.get('/auth/me');
      if (data?.success && data?.user) {
        setDbUser(data.user);
      }
    } catch (e) {
      console.warn('[AuthContext] Backend sync notice:', e.message);
    }
    if (authSuccessCallback) {
      authSuccessCallback();
      setAuthSuccessCallback(null);
    }
    setAuthModalOpen(false);
    return result.user;
  };

  // Email Sign Up
  const signUpWithEmail = async (email, password, name) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured. Please use Google Sign In.');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      try {
        await updateFirebaseProfile(result.user, { displayName: name });
      } catch (e) {}
    }
    setCurrentUser(result.user);
    try {
      const data = await api.get('/auth/me');
      if (data?.success && data?.user) {
        setDbUser(data.user);
      }
    } catch (e) {
      console.warn('[AuthContext] Backend sync notice:', e.message);
    }
    if (authSuccessCallback) {
      authSuccessCallback();
      setAuthSuccessCallback(null);
    }
    setAuthModalOpen(false);
    return result.user;
  };

  // Phone reCAPTCHA
  const setupRecaptcha = (containerId) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    });
  };

  // Send OTP
  const sendPhoneOtp = async (phoneNumber, appVerifier) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  // Dev Demo Switcher
  const loginAsDemo = async (role = 'customer') => {
    const isAdm = role === 'admin';
    const demoUser = {
      uid: isAdm ? 'admin-seed-uid' : 'demo-cust-123',
      devToken: `dev_token_${role}_${isAdm ? 'admin-seed-uid' : 'demo-cust-123'}`,
      displayName: isAdm ? 'Store Manager (Admin)' : 'Rahul Sharma',
      email: isAdm ? 'admin@snackstore.local' : 'rahul@example.com',
      phoneNumber: '+919876543210',
    };

    const mockDbUser = {
      id: isAdm ? '671234567890abcdef123456' : '671234567890abcdef123457',
      firebaseUid: demoUser.uid,
      name: demoUser.displayName,
      email: demoUser.email,
      phone: demoUser.phoneNumber,
      role: isAdm ? 'admin' : 'customer',
      savedAddresses: [
        {
          label: 'Home',
          addressLine: 'Flat 402, Green Valley Apts, Sector 14',
          landmark: 'Opposite Metro Station',
          city: 'City Center',
          isDefault: true,
        },
      ],
    };

    demoUser.dbUser = mockDbUser;

    setCurrentUser(demoUser);
    setDbUser(mockDbUser);
    localStorage.setItem('snack_demo_user', JSON.stringify(demoUser));

    try {
      const data = await api.get('/auth/me');
      if (data?.success && data?.user) {
        setDbUser(data.user);
      }
    } catch (e) {}

    if (authSuccessCallback) {
      authSuccessCallback();
      setAuthSuccessCallback(null);
    }
    setAuthModalOpen(false);
  };

  // Claim Admin Privileges via Secret Key
  const claimAdminAccess = async (secretKey) => {
    try {
      const res = await api.post('/auth/claim-admin', { secretKey });
      if (res?.success && res?.user) {
        setDbUser((prev) => ({ ...prev, ...res.user, role: 'admin' }));
        setCurrentUser((prev) => {
          const updated = { ...prev, role: 'admin' };
          localStorage.setItem('snack_user_session', JSON.stringify(updated));
          return updated;
        });
        return res.user;
      }
    } catch (err) {
      console.warn('[claimAdminAccess] Backend not available, validating passkey directly:', err.message);
    }

    // Direct passkey verification fallback
    const validPasskeys = ['Admin@123', 'snackcraft-admin-2026'];
    if (validPasskeys.includes(secretKey.trim())) {
      const updatedUser = {
        ...(currentUser || {
          uid: 'admin_local_session',
          displayName: 'Store Manager (Admin)',
          email: 'edumotivation43@gmail.com',
        }),
        role: 'admin',
      };
      setCurrentUser(updatedUser);
      setDbUser((prev) => ({ ...(prev || {}), role: 'admin' }));
      localStorage.setItem('snack_user_session', JSON.stringify(updatedUser));
      return updatedUser;
    }

    throw new Error('Invalid Admin Secret Key. Access denied.');
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      const res = await api.put('/auth/profile', updates);
      if (res?.success && res?.user) {
        setDbUser((prev) => ({ ...prev, ...res.user }));
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            displayName: res.user.name || prev.displayName,
            photoURL: res.user.avatarUrl || prev.photoURL,
            dbUser: { ...(prev.dbUser || {}), ...res.user },
          };
          const savedSession = localStorage.getItem('snack_user_session');
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              localStorage.setItem('snack_user_session', JSON.stringify({ ...parsed, ...updated }));
            } catch (e) {}
          }
          return updated;
        });
        return res.user;
      }
    } catch (err) {
      console.warn('[AuthContext] Backend profile update notice:', err.message);
      setDbUser((prev) => ({ ...prev, ...updates }));
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          displayName: updates.name || prev.displayName,
          photoURL: updates.avatarUrl || prev.photoURL,
          dbUser: { ...(prev.dbUser || {}), ...updates },
        };
        const savedSession = localStorage.getItem('snack_user_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            localStorage.setItem('snack_user_session', JSON.stringify({ ...parsed, ...updated }));
          } catch (e) {}
        }
        return updated;
      });
      return updates;
    }
  };

  // Sign out
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    localStorage.removeItem('snack_user_session');
    localStorage.removeItem('snack_demo_user');
    localStorage.removeItem('snack_cart');
    setCurrentUser(null);
    setDbUser(null);
  };

  // Prompt login helper
  const requireLogin = (onSuccess) => {
    if (currentUser) {
      if (onSuccess) onSuccess();
      return true;
    }
    setAuthSuccessCallback(() => onSuccess);
    setAuthModalOpen(true);
    return false;
  };

  const ADMIN_EMAILS = [
    'edumotivation43@gmail.com',
    'admin@snackstore.local',
  ];

  const userEmail = (currentUser?.email || dbUser?.email || '').toLowerCase().trim();
  const isAdminByEmail = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));
  const role = (currentUser?.role === 'admin' || dbUser?.role === 'admin' || isAdminByEmail) ? 'admin' : (dbUser?.role || 'customer');
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        dbUser,
        role,
        isAdmin,
        loading,
        authModalOpen,
        setAuthModalOpen,
        googleClientId,
        saveGoogleClientId,
        requireLogin,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        setupRecaptcha,
        sendPhoneOtp,
        loginAsDemo,
        logout,
        claimAdminAccess,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
