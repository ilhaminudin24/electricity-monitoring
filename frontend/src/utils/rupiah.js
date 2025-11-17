/**
 * Indonesian Rupiah formatting utilities
 * Now uses locale-aware formatting
 */

import { formatCurrency, parseFormattedNumber } from './localeFormatter';

/**
 * Format number as Rupiah (locale-aware)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string like "Rp 200.000" (ID) or "Rp 200,000" (EN)
 */
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount;
  
  if (isNaN(num) || num === 0) {
    return '-';
  }

  return formatCurrency(num, true);
};

/**
 * Parse Rupiah formatted string to number
 * @param {string} rupiahString - Formatted string like "Rp 200.000" or "200000"
 * @returns {number} Numeric value
 */
export const parseRupiah = (rupiahString) => {
  if (!rupiahString) return 0;
  
  return parseFormattedNumber(rupiahString);
};

/**
 * Format number for input field (without currency symbol, with thousand separators)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string like "200.000" (ID) or "200,000" (EN)
 */
export const formatRupiahInput = (amount) => {
  if (!amount && amount !== 0) return '';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount;
  
  if (isNaN(num)) return '';
  
  return formatCurrency(num, false);
};

