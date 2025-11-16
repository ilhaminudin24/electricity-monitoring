/**
 * Indonesian Rupiah formatting utilities
 * Locale: id-ID
 */

/**
 * Format number as Indonesian Rupiah
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string like "Rp 200.000"
 */
export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount;
  
  if (isNaN(num) || num === 0) {
    return '-';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Parse Rupiah formatted string to number
 * @param {string} rupiahString - Formatted string like "Rp 200.000" or "200000"
 * @returns {number} Numeric value
 */
export const parseRupiah = (rupiahString) => {
  if (!rupiahString) return 0;
  
  // Remove all non-digit characters
  const cleaned = rupiahString.toString().replace(/[^\d]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
};

/**
 * Format number for input field (without currency symbol, with thousand separators)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted string like "200.000"
 */
export const formatRupiahInput = (amount) => {
  if (!amount && amount !== 0) return '';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount;
  
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

