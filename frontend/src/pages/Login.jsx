import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import LoadingButton from '../components/auth/LoadingButton';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const getErrorMessage = (error) => {
    if (error.message.includes('Invalid login credentials')) return t('validation.passwordRequired'); // Simplification for demo
    if (error.message.includes('Email not confirmed')) return 'Please confirm your email address.';
    return error.message;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email) {
      return setError(t('validation.emailRequired'));
    }
    if (!password) {
      return setError(t('validation.passwordRequired'));
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password, rememberMe);
      // Explicitly navigate after successful login, though useEffect handles auth state change
      // This acts as a backup and immediate feedback
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }

    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-main mb-3 tracking-tight">
            {t('welcome_back')}
          </h2>
          <p className="text-text-sub font-normal text-base">
            {t('login_subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-text-main ml-1">
              {t('email_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full pl-11 pr-5 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="password" className="block text-sm font-semibold text-text-main">
                {t('password_label')}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors"
              >
                {t('link_forgot_pass')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center ml-1">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-text-sub">
              {t('remember_me', 'Remember me')}
            </label>
          </div>

          <div className="pt-2">
            <LoadingButton loading={loading} type="submit">
              {t('btn_login')}
            </LoadingButton>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-text-sub font-medium uppercase tracking-wider text-xs">
              {t('or_divider')}
            </span>
          </div>
        </div>

        <LoadingButton
          onClick={handleGoogleLogin}
          loading={loading}
          variant="secondary"
          type="button"
          className="rounded-full py-3.5 border-gray-200"
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-semibold">{t('google_login')}</span>
          </div>
        </LoadingButton>

        <p className="mt-8 text-center text-sm text-text-sub font-medium">
          {t('link_no_account')}{' '}
          <Link to="/register" className="font-bold text-primary hover:text-blue-700 transition-colors ml-1">
            {t('btn_register')}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}