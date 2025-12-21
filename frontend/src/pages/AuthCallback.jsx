import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Zap } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First, check if we already have a session (Supabase might have created it automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          // Session already exists - Supabase handled it automatically
          // Ensure user profile exists
          if (session.user) {
            try {
              const { ensureUserProfile } = await import('../services/supabaseService');
              const profile = await ensureUserProfile(
                session.user.id,
                session.user.email,
                session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email
              );
              if (!profile) {
                throw new Error('Failed to create user profile');
              }
            } catch (profileError) {
              // Log error but don't block navigation - user can still use app
              // Profile might be created by trigger or can be created later
            }
          }
          
          // Success - redirect to dashboard
          navigate('/dashboard', { replace: true });
          return;
        }

        // If no session, try to exchange code for session
        // Extract code from URL hash or query params
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          // Check hash fragment (Supabase sometimes uses hash)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashCode = hashParams.get('code');
          
          if (hashCode) {
            // Exchange code for session
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(hashCode);
            
            if (exchangeError) throw exchangeError;
            
            // Ensure user profile exists after exchange
            if (data?.session?.user) {
              try {
                const { ensureUserProfile } = await import('../services/supabaseService');
                const profile = await ensureUserProfile(
                  data.session.user.id,
                  data.session.user.email,
                  data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || data.session.user.email
                );
                if (!profile) {
                  throw new Error('Failed to create user profile');
                }
              } catch (profileError) {
                // Log error but don't block navigation - user can still use app
                // Profile might be created by trigger or can be created later
              }
            }
            
            // Success - redirect to dashboard
            navigate('/dashboard', { replace: true });
            return;
          }
          
          // No code and no session - might be a direct visit or error
          // Check if there's an error in the URL
          const errorParam = urlParams.get('error') || new URLSearchParams(window.location.hash.substring(1)).get('error');
          if (errorParam) {
            throw new Error(`OAuth error: ${errorParam}`);
          }
          
          // If we reach here, try to get session one more time (in case it was created asynchronously)
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession?.user) {
            // Session created - ensure profile exists
            try {
              const { ensureUserProfile } = await import('../services/supabaseService');
              const profile = await ensureUserProfile(
                retrySession.user.id,
                retrySession.user.email,
                retrySession.user.user_metadata?.name || retrySession.user.user_metadata?.full_name || retrySession.user.email
              );
              if (!profile) {
                throw new Error('Failed to create user profile');
              }
            } catch (profileError) {
              // Log error but don't block navigation - user can still use app
              // Profile might be created by trigger or can be created later
            }
            
            navigate('/dashboard', { replace: true });
            return;
          }
          
          throw new Error('No authorization code found in URL and no active session');
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) throw exchangeError;
        
        // Ensure user profile exists after exchange
        if (data?.session?.user) {
          try {
            const { ensureUserProfile } = await import('../services/supabaseService');
            const profile = await ensureUserProfile(
              data.session.user.id,
              data.session.user.email,
              data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || data.session.user.email
            );
            if (!profile) {
              throw new Error('Failed to create user profile');
            }
          } catch (profileError) {
            // Log error but don't block navigation - user can still use app
            // Profile might be created by trigger or can be created later
          }
        }
        
        // Success - redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.message || 'Authentication failed');
        setLoading(false);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <Zap className="h-6 w-6 text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

