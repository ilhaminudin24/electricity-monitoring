/**
 * Settings management for electricity monitoring app
 * Stores configurable values in localStorage
 */

import plnTariffsData from '../config/plnTariffs.json';

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
 * Update settings
 */
export const updateSettings = (newSettings) => {
  try {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    
    // If switching to preset mode, update tariffPerKwh from selected tariff
    if (updated.tariffType === 'preset' && updated.selectedTariffSubcategory) {
      updated.tariffPerKwh = getTariffRateById(updated.selectedTariffSubcategory);
    }
    
    // If switching to custom mode, use custom rate
    if (updated.tariffType === 'custom' && updated.customTariffRate > 0) {
      updated.tariffPerKwh = updated.customTariffRate;
    }
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving settings:', error);
    return getSettings();
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
 * Calculate Token Amount (kWh) from Token Cost
 * Formula: kWh = (TokenCost - AdminFee - Tax) / TarifPerKWh
 */
export const calculateTokenAmount = (tokenCost) => {
  if (!tokenCost || tokenCost <= 0) {
    return null;
  }

  const settings = getSettings();
  const adminFee = settings.adminFee || 0;
  const taxAmount = (tokenCost * (settings.tax || 0)) / 100;
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

