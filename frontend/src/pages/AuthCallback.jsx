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
        // 1. Check existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session?.user && !sessionError) {
          await ensureProfile(session.user);
          navigate('/dashboard', { replace: true });
          return;
        }

        // 2. Parse URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashCode = hashParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          throw new Error(`OAuth Error: ${errorParam} - ${errorDescription || ''}`);
        }

        // 3. Handle Implicit Flow (Access Token)
        if (accessToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (setSessionError) throw setSessionError;
          if (data?.session?.user) await ensureProfile(data.session.user);
          navigate('/dashboard', { replace: true });
          return;
        }

        // 4. Handle PKCE Flow (Code)
        const finalCode = code || hashCode;
        if (finalCode) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(finalCode);
          if (exchangeError) throw exchangeError;
          if (data?.session?.user) await ensureProfile(data.session.user);
          navigate('/dashboard', { replace: true });
          return;
        }

        // 5. Final Retry (Race condition check)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession?.user) {
          await ensureProfile(retrySession.user);
          navigate('/dashboard', { replace: true });
          return;
        }

        throw new Error('No authorization code or token found in URL');

      } catch (err) {
        console.error('Auth Callback Error:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000); // Give user time to read debug info
      }
    };

    // Helper to ensure profile exists
    const ensureProfile = async (user) => {
      try {
        const { ensureUserProfile } = await import('../services/supabaseService');
        await ensureUserProfile(
          user.id,
          user.email,
          user.user_metadata?.name || user.user_metadata?.full_name || user.user.email
        );
      } catch (e) {
        console.warn('Profile creation failed:', e);
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
          <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-100 rounded break-all max-w-md mx-auto">
            Debug URL: {window.location.href}
          </div>
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

