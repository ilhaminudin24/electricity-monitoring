import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Edit2,
  Settings as SettingsIcon,
  Banknote,
  Percent,
  User as UserIcon,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  Calculator
} from 'lucide-react';
import {
  getSettings,
  updateSettings,
  resetToDefaults
} from '../utils/settings';
import { formatRupiah } from '../utils/rupiah';
import { getUserProfile, updateUserProfile, getUserSettings, ensureUserProfile } from '../services/supabaseService';

const Settings = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Settings State
  const [adminFee, setAdminFee] = useState('');
  const [tax, setTax] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState('');

  // Profile State
  const [userProfile, setUserProfile] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
      // 1. Load Local Settings
      const localSettings = getSettings();
      setAdminFee(localSettings.adminFee || 0);
      setTax(localSettings.tax || 0);
      setMonthlyBudget(localSettings.monthlyBudget || 500000);
      setBudgetAlertThreshold(localSettings.budgetAlertThreshold || 85);

      if (currentUser) {
        try {
          // 2. Ensure Profile & Fetch Role
          const profile = await getUserProfile(currentUser.id);

          if (profile) {
            setUserProfile(profile);
            setEditDisplayName(profile.display_name || '');
          } else {
            // Fallback if profile fetch fails but user exists
            const newProfile = await ensureUserProfile(currentUser.id, currentUser.email);
            setUserProfile(newProfile);
            setEditDisplayName(newProfile?.display_name || '');
          }

          // 3. Sync Cloud Settings
          const cloudSettings = await getUserSettings(currentUser.id);
          if (cloudSettings) {
            const merged = { ...localSettings, ...cloudSettings };
            await updateSettings(merged);
            setAdminFee(merged.adminFee || 0);
            setTax(merged.tax || 0);
            setMonthlyBudget(merged.monthlyBudget || 500000);
            setBudgetAlertThreshold(merged.budgetAlertThreshold || 85);
          }
        } catch (err) {
          console.error("Failed to load profile/settings:", err);
        }
      }
      setProfileLoading(false);
    };
    loadData();
  }, [currentUser]);

  // Save Config
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (parseFloat(adminFee) < 0) {
      setError(t('settings.validation.adminFeeNonNegative') || 'Admin fee must be positive');
      return;
    }
    if (parseFloat(tax) < 0 || parseFloat(tax) > 100) {
      setError(t('settings.validation.taxRange') || 'Tax must be between 0 and 100');
      return;
    }
    if (parseFloat(monthlyBudget) < 0) {
      setError(t('settings.validation.budgetNonNegative') || 'Monthly budget must be positive');
      return;
    }
    if (parseFloat(budgetAlertThreshold) < 0 || parseFloat(budgetAlertThreshold) > 100) {
      setError(t('settings.validation.thresholdRange') || 'Alert threshold must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);

      const newSettings = {
        adminFee: parseFloat(adminFee) || 0,
        tax: parseFloat(tax) || 0,
        monthlyBudget: parseFloat(monthlyBudget) || 500000,
        budgetAlertThreshold: parseFloat(budgetAlertThreshold) || 85,
      };

      await updateSettings(newSettings); // Updates Local + Cloud via utils

      setSuccess(true);
      // Auto redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(t('settings.failedToSave') || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Reset Form
  const handleCancel = async () => {
    // Reload from source of truth (Local Storage is easiest sync point since we just saved to it or loaded from it)
    const current = getSettings();
    setAdminFee(current.adminFee || 0);
    setTax(current.tax || 0);
    setMonthlyBudget(current.monthlyBudget || 500000);
    setBudgetAlertThreshold(current.budgetAlertThreshold || 85);
  };

  // Derived values for budget preview
  const dailyBudget = monthlyBudget ? parseFloat(monthlyBudget) / 30 : 0;
  const weeklyBudget = monthlyBudget ? (parseFloat(monthlyBudget) / 30) * 7 : 0;

  // Profile Update
  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      await updateUserProfile(currentUser.id, {
        display_name: editDisplayName
      });

      // Refresh local state
      setUserProfile(prev => ({ ...prev, display_name: editDisplayName }));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    }
  };


  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8 lg:p-12 flex flex-col gap-8 pb-24">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center">
        <Link to="/dashboard" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors">
          {t('settings.home')}
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className="text-slate-900 dark:text-white text-sm font-medium">{t('settings.breadcrumb')}</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          {t('settings.title', 'Settings & Configuration')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-2xl">
          {t('settings.subtitle', 'Manages your profile settings.')}
        </p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-4 ring-slate-50 dark:ring-slate-800 overflow-hidden">
                {userProfile?.photo_url ? (
                  <img src={userProfile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-400" />
                  // Or use the initial placeholder logic from Sidebar if preferred, but SVG is cleaner fallback
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-110">
                <Edit2 className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                {loading && profileLoading ? 'Loading...' : (userProfile?.display_name || 'User')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                {currentUser?.email}
              </p>
              {/* Role Badge */}
              <div className={`
                        inline-flex items-center justify-center sm:justify-start gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full w-fit mx-auto sm:mx-0
                        ${userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'}
                    `}>
                <div className={`w-1.5 h-1.5 rounded-full ${userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                {userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? t('settings.superAdmin') : t('settings.user')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
          >
            {t('settings.editProfile')}
          </button>
        </div>
      </section>

      {/* Settings Form */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">{t('settings.baseRatesFees')}</h2>
          <SettingsIcon className="w-5 h-5 text-slate-300" />
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <p className="text-sm text-green-800 font-medium">{t('settings.savedSuccessfully', 'Configuration saved successfully.')}</p>
            </div>
          )}

          <div className="flex flex-col gap-8 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Admin Fee Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="admin-fee" className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  {t('settings.adminFee', 'Admin Fee')}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    name="admin-fee"
                    id="admin-fee"
                    className="block w-full rounded-xl border-0 py-3 pl-12 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-800 dark:ring-slate-700 dark:text-white sm:text-sm sm:leading-6 transition-shadow"
                    placeholder="2.500"
                    value={adminFee}
                    onChange={(e) => setAdminFee(e.target.value)}
                    min="0"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <Banknote className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('settings.adminFeeDesc', 'Fixed fee applied per transaction.')}
                </p>
              </div>

              {/* Tax Percentage Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="tax-rate" className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  {t('settings.tax', 'Tax Percentage')}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="tax-rate"
                    id="tax-rate"
                    className="block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-800 dark:ring-slate-700 dark:text-white sm:text-sm sm:leading-6 transition-shadow"
                    placeholder="11"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-slate-500 dark:text-slate-400 font-bold sm:text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('settings.taxDesc', 'Value Added Tax applied to total bill.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Budget Configuration Section */}
      < section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden" >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
            {t('settings.budgetConfig', 'Budget Configuration')}
          </h2>
          <Wallet className="w-5 h-5 text-slate-300" />
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-8 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Monthly Budget Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="monthly-budget" className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  {t('settings.monthlyBudget', 'Monthly Budget')}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    name="monthly-budget"
                    id="monthly-budget"
                    className="block w-full rounded-xl border-0 py-3 pl-12 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-800 dark:ring-slate-700 dark:text-white sm:text-sm sm:leading-6 transition-shadow"
                    placeholder="500.000"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    min="0"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <Wallet className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('settings.monthlyBudgetDesc', 'Your target electricity spending per month.')}
                </p>
              </div>

              {/* Alert Threshold Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="budget-threshold" className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  {t('settings.alertThreshold', 'Alert Threshold')}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    name="budget-threshold"
                    id="budget-threshold"
                    className="block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-800 dark:ring-slate-700 dark:text-white sm:text-sm sm:leading-6 transition-shadow"
                    placeholder="85"
                    value={budgetAlertThreshold}
                    onChange={(e) => setBudgetAlertThreshold(e.target.value)}
                    min="0"
                    max="100"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-slate-500 dark:text-slate-400 font-bold sm:text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('settings.alertThresholdDesc', 'Show warning when usage exceeds this percentage.')}
                </p>
              </div>
            </div>

            {/* Budget Preview Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-slate-700 dark:text-slate-300 font-semibold">
                  {t('settings.budgetPreview', 'Budget Preview')}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('settings.daily')}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatRupiah(dailyBudget)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('settings.weekly')}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatRupiah(weeklyBudget)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('settings.monthly')}</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(parseFloat(monthlyBudget) || 0)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>
                    {t('settings.alertNote', 'Progress bar turns yellow at')} {budgetAlertThreshold - 35}%, {t('settings.andRed', 'and red at')} {budgetAlertThreshold}%
                  </span>
                </div>
              </div>

              {/* Save/Cancel Buttons - Moved here for better UX */}
              <div className="pt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.saving', 'Saving...') : t('settings.saveSettings', 'Save Configuration')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section >

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.editProfile')}</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('settings.displayName')}</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-full"
                >
                  {t('settings.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div >
  );
};

export default Settings;

