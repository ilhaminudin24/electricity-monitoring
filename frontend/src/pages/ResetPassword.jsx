import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { AlertCircle, Zap, CheckCircle, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';

import AuthCard from '../components/auth/AuthCard';
import LoadingButton from '../components/auth/LoadingButton';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ResetPassword() {
    const { t } = useTranslation();


    // State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verify session on mount (Supabase handles hash fragment automatically)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If there is no session, it means the recovery link was invalid or expired
                // However, Supabase sometimes takes a moment to persist the session from the URL
                // We'll give it a short buffer or just show the form (update will fail if no session)
                setError(t('validation_extra.invalidToken'));
            }
            setVerifying(false);
        };

        // Short delay to allow Supabase client to process the URL hash
        setTimeout(checkSession, 500);
    }, [t]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!newPassword) {
            return setError(t('validation.passwordTooShort'));
        }

        if (newPassword.length < 6) {
            return setError(t('validation.passwordTooShort'));
        }

        if (newPassword !== confirmPassword) {
            return setError(t('validation.passwordsDoNotMatch'));
        }

        try {
            setError('');
            setLoading(true);

            // Update user password using Supabase
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err) {
            setError(err.message || t('validation_extra.invalidToken'));
        }

        setLoading(false);
    };

    // Loading state while verifying
    if (verifying) {
        return (
            <AuthLayout>
                <AuthCard>
                    <div className="text-center py-12">
                        <div className="flex justify-center mb-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-text-sub font-medium">Verifying session...</p>
                    </div>
                </AuthCard>
            </AuthLayout>
        );
    }

    // Success state
    if (success) {
        return (
            <AuthLayout>
                <AuthCard>
                    <div className="flex justify-center mb-8">
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="CatatToken.ID" className="h-12 object-contain" />
                    </div>

                    <div className="text-center py-4">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-text-main mb-3 tracking-tight">
                            {t('password_reset_success')}
                        </h2>

                        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm text-green-700 font-medium">{t('password_reset_success_msg')}</p>
                        </div>

                        <Link to="/dashboard">
                            <LoadingButton type="button" className="rounded-full">
                                {t('btn_go_dashboard')}
                            </LoadingButton>
                        </Link>
                    </div>
                </AuthCard>
            </AuthLayout>
        );
    }

    // Main reset password form
    return (
        <AuthLayout>
            <LanguageSwitcher variant="floating" />
            <AuthCard>
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="CatatToken.ID" className="h-12 object-contain" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
                        {t('reset_pass_title')}
                    </h2>
                    <p className="text-text-sub font-normal">
                        {t('reset_pass_subtitle')}
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
                    {/* New Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-text-main ml-1">
                            {t('new_password_label')}
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                className="w-full px-5 py-3.5 pr-12 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                                placeholder={t('new_password_placeholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        <PasswordStrengthMeter password={newPassword} />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-main ml-1">
                            {t('confirm_new_password_label')}
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                className="w-full px-5 py-3.5 pr-12 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white hover:bg-gray-50/50 text-text-main placeholder-gray-400"
                                placeholder={t('confirm_new_password_placeholder')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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
                            {t('btn_reset_password')}
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
            </AuthCard>
        </AuthLayout>
    );
}
