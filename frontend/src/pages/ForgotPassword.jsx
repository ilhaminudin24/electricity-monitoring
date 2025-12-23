import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Zap, CheckCircle, Mail } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthCard from '../components/auth/AuthCard';
import LoadingButton from '../components/auth/LoadingButton';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const getErrorMessage = (error) => {
    if (error.message.includes('User not found')) return t('validation_extra.userNotFound');
    if (error.message.includes('Too many requests')) return 'Too many requests. Please try again later.';
    return error.message;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email) {
      return setError(t('validation.emailRequired'));
    }

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setEmailSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }

    setLoading(false);
  }

  return (
    <AuthLayout>
      <LanguageSwitcher variant="floating" />
      <AuthCard>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="CatatToken.ID" className="h-12 object-contain" />
        </div>

        {!emailSent ? (
          <>
            {/* Title & Subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
                {t('forgot_pass_title')}
              </h2>
              <p className="text-text-sub font-normal">
                {t('forgot_pass_subtitle')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Reset Password Form */}
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
                    placeholder={t('email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <LoadingButton loading={loading} type="submit">
                  {t('btn_send_reset')}
                </LoadingButton>
              </div>
            </form>

            {/* Back to Login Link */}
            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="text-sm font-bold text-primary hover:text-blue-700 transition-colors"
              >
                {t('back_to_login')}
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center py-4">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Success Title */}
              <h2 className="text-2xl font-bold text-text-main mb-3 tracking-tight">
                {t('password_reset_sent')}
              </h2>

              {/* Success Message */}
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-green-700 text-left font-medium">
                    {t('password_reset_sent_msg')}
                  </p>
                </div>
              </div>

              {/* Back to Login Button */}
              <Link to="/login">
                <LoadingButton type="button" className="rounded-full">
                  {t('back_to_login')}
                </LoadingButton>
              </Link>
            </div>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}