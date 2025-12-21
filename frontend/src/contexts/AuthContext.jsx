import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { createUserProfile, updateLastLogin } from '../services/supabaseService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Helper to check if we should keep the session
    const checkRememberMe = () => {
      const remembered = localStorage.getItem('remember_me') === 'true' || sessionStorage.getItem('remember_me') === 'true';
      return remembered;
    };

    // Check active session with timeout
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { session: null } });
      }, 5000);
    });

    Promise.race([sessionPromise, timeoutPromise]).then(async ({ data: { session } }) => {
      // Security Check: If session exists but remember_me is not set in either storage
      // (meaning it was a session-only login and browser was restarted), log them out.
      if (session?.user && !checkRememberMe()) {
        await supabase.auth.signOut();
        setCurrentUser(null);
      } else {
        setCurrentUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(() => {
      setCurrentUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);

      // Ensure user profile exists and update last login (non-blocking)
      if (session?.user) {
        // Import ensureUserProfile dynamically to avoid circular dependency
        import('../services/supabaseService').then(({ ensureUserProfile, updateLastLogin }) => {
          // Ensure profile exists (critical for foreign key constraints)
          ensureUserProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata?.name || session.user.email
          ).catch(() => {
            // Silently fail - profile creation is handled by trigger
          });

          // Update last login (non-critical)
          updateLastLogin(session.user.id).catch(() => {
            // Silently fail - non-critical operation
          });
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register
  async function register(email, password, name) {
    try {
      setError('');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      // Note: If email confirmation is enabled, the user won't be fully logged in yet
      // public.handle_new_user trigger in Supabase will create the profile

      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Login
  async function login(email, password, rememberMe = false) {
    try {
      setError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        sessionStorage.removeItem('remember_me');
      } else {
        sessionStorage.setItem('remember_me', 'true');
        localStorage.removeItem('remember_me');
      }

      // Explicitly set user state immediately to help with redirect speed
      setCurrentUser(data.user);

      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Google Login
  async function loginWithGoogle() {
    try {
      setError('');
      // For OAuth, we default to "Remember Me" behavior (persistent)
      // as it's the standard expectation for social login
      localStorage.setItem('remember_me', 'true');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      // OAuth redirects automatically, no need to return data
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Reset Password
  async function resetPassword(email) {
    try {
      setError('');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  // Logout
  async function logout() {
    try {
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('remember_me');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setCurrentUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  const value = {
    currentUser,
    error,
    register,
    login,
    loginWithGoogle,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}