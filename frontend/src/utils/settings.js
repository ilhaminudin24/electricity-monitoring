/**
 * Settings management for electricity monitoring app
 * Stores configurable values in localStorage
 */

const SETTINGS_KEY = 'electricity_monitoring_settings';

const DEFAULT_SETTINGS = {
  tariffPerKwh: 1444.70, // Default PLN R1 tariff
  adminFee: 0, // Pajak/Admin fees (default 0)
};

/**
 * Get all settings
 */
export const getSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving settings:', error);
    return getSettings();
  }
};

/**
 * Get tariff per kWh
 */
export const getTariffPerKwh = () => {
  return getSettings().tariffPerKwh;
};

/**
 * Get admin fee
 */
export const getAdminFee = () => {
  return getSettings().adminFee;
};

/**
 * Calculate Token Amount (kWh) from Token Cost
 * Formula: kWh = (TokenCost - PajakAdminEstimasi) / TarifPerKWh
 */
export const calculateTokenAmount = (tokenCost) => {
  if (!tokenCost || tokenCost <= 0) {
    return null;
  }

  const settings = getSettings();
  const adminFee = settings.adminFee || 0;
  const tariff = settings.tariffPerKwh || DEFAULT_SETTINGS.tariffPerKwh;

  const tokenAmount = (tokenCost - adminFee) / tariff;
  return Math.max(0, tokenAmount); // Ensure non-negative
};

