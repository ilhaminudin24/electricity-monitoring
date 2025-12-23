/**
 * Settings management for electricity monitoring app
 * Stores configurable values in localStorage
 */

// import { updateUserSettings as saveSupabaseSettings } from '../services/supabaseService';
// import { supabase } from '../supabaseClient';

// Use Supabase for sync
// const useCloudSync = true;

// PLN Tariff Data
const plnTariffsData = {
  tariffGroups: [
    {
      id: 'R1',
      name: 'R1',
      description: 'Rumah Tangga Daya Rendah',
      subcategories: [
        { id: 'R1_450', name: '450 VA', rate: 415, isSubsidized: true },
        { id: 'R1_900', name: '900 VA', rate: 1352, isSubsidized: true },
        { id: 'R1_1300', name: '1300 VA', rate: 1444.70, isSubsidized: true },
        { id: 'R1_2200', name: '2200 VA', rate: 1444.70, isSubsidized: true },
      ]
    },
    {
      id: 'R2',
      name: 'R2',
      description: 'Rumah Tangga Daya Sedang',
      subcategories: [
        { id: 'R2_3500', name: '3500 VA', rate: 1444.70 },
        { id: 'R2_4400', name: '4400 VA', rate: 1444.70 },
        { id: 'R2_5500', name: '5500 VA', rate: 1444.70 },
        { id: 'R2_6600', name: '6600 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'R3',
      name: 'R3',
      description: 'Rumah Tangga Daya Tinggi',
      subcategories: [
        { id: 'R3_6600', name: '6600 VA', rate: 1444.70 },
        { id: 'R3_10600', name: '10600 VA', rate: 1444.70 },
        { id: 'R3_13200', name: '13200 VA', rate: 1444.70 },
        { id: 'R3_16500', name: '16500 VA', rate: 1444.70 },
        { id: 'R3_23000', name: '23000 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'B1',
      name: 'B1',
      description: 'Bisnis Daya Rendah',
      subcategories: [
        { id: 'B1_5300', name: '5300 VA', rate: 1444.70 },
        { id: 'B1_8900', name: '8900 VA', rate: 1444.70 },
        { id: 'B1_13200', name: '13200 VA', rate: 1444.70 },
        { id: 'B1_17900', name: '17900 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'B2',
      name: 'B2',
      description: 'Bisnis Daya Sedang',
      subcategories: [
        { id: 'B2_24000', name: '24000 VA', rate: 1444.70 },
        { id: 'B2_30000', name: '30000 VA', rate: 1444.70 },
        { id: 'B2_38100', name: '38100 VA', rate: 1444.70 },
        { id: 'B2_41500', name: '41500 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'B3',
      name: 'B3',
      description: 'Bisnis Daya Tinggi',
      subcategories: [
        { id: 'B3_53000', name: '53000 VA', rate: 1444.70 },
        { id: 'B3_66500', name: '66500 VA', rate: 1444.70 },
        { id: 'B3_77000', name: '77000 VA', rate: 1444.70 },
        { id: 'B3_90000', name: '90000 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'I',
      name: 'I',
      description: 'Industri',
      subcategories: [
        { id: 'I_131000', name: '131000 VA', rate: 1444.70 },
        { id: 'I_197000', name: '197000 VA', rate: 1444.70 },
      ]
    },
    {
      id: 'P1',
      name: 'P1',
      description: 'Pemerintah',
      subcategories: [
        { id: 'P1_200000', name: '200000 VA', rate: 1444.70 },
        { id: 'P1_266000', name: '266000 VA', rate: 1444.70 },
        { id: 'P1_332000', name: '332000 VA', rate: 1444.70 },
      ]
    }
  ]
};


// Initialize on load
// initializeFirebaseSettings(); - Removed for Supabase


const SETTINGS_KEY = 'electricity_monitoring_settings';

const DEFAULT_SETTINGS = {
  tariffType: 'preset', // 'preset' or 'custom'
  selectedTariffGroup: 'R1',
  selectedTariffSubcategory: 'R1_1300',
  tariffPerKwh: 1444.70, // Default PLN R1 1300 VA tariff
  adminFee: 0, // Pajak/Admin fees (default 0)
  customTariffName: '',
  customTariffRate: 0,
  tax: 0, // Optional tax percentage
  monthlyBudget: 500000, // Default Rp 500.000/bulan
  budgetAlertThreshold: 85, // Alert when usage > 85% of budget
};

/**
 * Get all available PLN tariffs
 */
export const getAvailableTariffs = () => {
  return plnTariffsData;
};

/**
 * Find tariff rate by ID
 */
export const getTariffRateById = (tariffId) => {
  const tariffs = plnTariffsData.tariffGroups;

  for (const group of tariffs) {
    const subcategory = group.subcategories.find(sub => sub.id === tariffId);
    if (subcategory) {
      return subcategory.rate;
    }
  }

  return DEFAULT_SETTINGS.tariffPerKwh;
};

/**
 * Get tariff group and subcategory details
 */
export const getTariffDetails = (tariffId) => {
  const tariffs = plnTariffsData.tariffGroups;

  for (const group of tariffs) {
    const subcategory = group.subcategories.find(sub => sub.id === tariffId);
    if (subcategory) {
      return {
        group: group,
        subcategory: subcategory
      };
    }
  }

  return null;
};

/**
 * Get all settings
 */
export const getSettings = () => {
  // Fallback to localStorage


  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure backward compatibility
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Get current effective tariff rate
 */
export const getTariffPerKwh = () => {
  const settings = getSettings();
  return settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh;
};

/**
 * Get admin fee
 */
export const getAdminFee = () => {
  return getSettings().adminFee || 0;
};

/**
 * Get tax (as decimal, e.g., 10% = 0.10)
 */
export const getTax = () => {
  const settings = getSettings();
  return (settings.tax || 0) / 100;
};

/**
 * Get monthly budget setting
 */
export const getMonthlyBudget = () => {
  const settings = getSettings();
  return settings.monthlyBudget || 500000;
};

/**
 * Calculate proportional budget based on time range
 * @param {string} timeRange - 'day' | 'week' | 'month'
 * @returns {number} Budget amount for the specified period
 */
export const getBudgetForPeriod = (timeRange) => {
  const monthlyBudget = getMonthlyBudget();

  switch (timeRange) {
    case 'day':
      // 'day' filter shows last 7 days, so use 7-day budget
      return (monthlyBudget / 30) * 7;
    case 'week':
      // 'week' filter shows 4 weeks, so use ~1 month budget
      return monthlyBudget;
    case 'month':
      // 'month' filter shows 6 months, so use 6x monthly budget
      return monthlyBudget * 6;
    default:
      return monthlyBudget;
  }
};

/**
 * Get budget alert threshold (percentage)
 */
export const getBudgetAlertThreshold = () => {
  const settings = getSettings();
  return settings.budgetAlertThreshold || 85;
};

/**
 * Calculate Token Amount (kWh) from Token Cost
 * Uses tiered tariff system if enabled, otherwise falls back to single rate
 * Formula: kWh = (TokenCost - AdminFee - Tax) / EffectiveTariff
 */
export const calculateTokenAmount = async (tokenCost, options = {}) => {
  if (!tokenCost || tokenCost <= 0) {
    return null;
  }

  const settings = getSettings();
  const adminFee = settings.adminFee || 0;
  const taxPercent = settings.tax || 0;

  // Check if tiered system is enabled
  const useGlobalTariffTiers = settings.useGlobalTariffTiers !== false; // Default to true
  const featureEnabled = options.featureEnabled !== false; // Allow override

  if (useGlobalTariffTiers && featureEnabled) {
    try {
      // Use tiered calculation
      const { estimateKwhFromTokenCost } = await import('./tariff');
      const result = await estimateKwhFromTokenCost({
        tokenCost,
        adminFee,
        taxPercent,
        fallbackRate: settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh
      });

      return result.kwh;
    } catch (error) {
      // Fall through to legacy calculation
    }
  }

  // Legacy calculation (fallback)
  const taxAmount = (tokenCost * taxPercent) / 100;
  const tariff = settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh;
  const effectiveCost = tokenCost - adminFee - taxAmount;
  const tokenAmount = effectiveCost / tariff;

  return Math.max(0, tokenAmount); // Ensure non-negative
};

/**
 * Reset to default settings
 */
export const resetToDefaults = () => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Update settings
 */
export const updateSettings = (newSettings) => {
  try {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error updating settings:', error);
    return newSettings;
  }
};
