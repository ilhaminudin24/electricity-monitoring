import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Mail, Lock, User, RefreshCw, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import LoadingButton from '../components/auth/LoadingButton';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, login, loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const getErrorMessage = (error) => {
    if (error.message?.includes('User already registered')) return 'Email already in use';
    if (error.message?.includes('Password should be')) return t('validation.passwordTooShort');
    if (error.message?.includes('Unable to validate email')) return 'Invalid Email';
    return error.message;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name) return setError(t('validation.nameRequired'));
    if (!email) return setError(t('validation.emailRequired'));
    if (!password) return setError(t('validation.passwordRequired'));
    if (password.length < 6) return setError(t('validation.passwordTooShort'));
    if (password !== confirmPassword) return setError(t('validation.passwordsDoNotMatch'));

    try {
      setError('');
      setLoading(true);

      await register(email, password, name);

      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (loginError) {
        if (loginError.message?.includes('Email not confirmed')) {
          setSuccess(true);
        } else {
          setSuccess(true);
        }
      }

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Success View (Check Email)
  if (success) {
    return (
      <AuthLayout>
        <AuthCard>
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6 animate-bounce">
              <Mail className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-text-main mb-4 tracking-tight">
              Check Your Inbox
            </h2>
            <p className="text-text-sub mb-8 text-lg font-normal leading-relaxed px-4">
              We've sent a confirmation link to ${email}.
            </p>
            <Link to="/login">
              <button className="w-full flex justify-center items-center py-4 px-6 rounded-full font-bold tracking-wide text-white bg-primary hover:bg-blue-600 shadow-glow hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                Back to Login
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-main mb-3 tracking-tight">
            {t('create_account')}
          </h2>
          <p className="text-text-sub font-normal text-base">
            {t('register_subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-text-main ml-1">
              {t('full_name_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full pl-11 pr-5 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                placeholder={t('name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-text-main ml-1">
              {t('password_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-main ml-1">
              {t('confirm_password_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <RefreshCw className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <LoadingButton loading={loading} type="submit">
              {t('btn_register')}
            </LoadingButton>
          </div>
        </form>

        {/* Google Sign-in Button */}
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
          onClick={() => loginWithGoogle()}
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
          {t('link_have_account')}{' '}
          <Link to="/login" className="font-bold text-primary hover:text-blue-700 transition-colors ml-1">
            {t('btn_login')}
          </Link>
        </p>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            By clicking "Sign Up", you agree to our <a href="#!" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#!" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
