/**
 * Locale Formatter Utilities
 * Format numbers, currency, and dates according to the selected language
 */

/**
 * Get current locale from i18n
 * @returns {string} Locale code (id-ID or en-US)
 */
export const getCurrentLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'id';
  return lang === 'id' ? 'id-ID' : 'en-US';
};

/**
 * Format number with locale
 * Indonesian: 1.000,50
 * English: 1,000.50
 */
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  const locale = getCurrentLocale();
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format currency (Rupiah)
 * Indonesian: Rp 1.000.000
 * English: Rp 1,000,000
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? 'Rp 0' : '0';
  }
  
  const locale = getCurrentLocale();
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return showSymbol ? `Rp ${formatted}` : formatted;
};

/**
 * Format date
 * Indonesian: 17 Jan 2025
 * English: Jan 17, 2025
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getCurrentLocale();
  
  const formats = {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  };
  
  return new Intl.DateTimeFormat(locale, formats[format] || formats.medium).format(dateObj);
};

/**
 * Format date and time
 * Indonesian: 17 Jan 2025 14.30
 * English: Jan 17, 2025 2:30 PM
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getCurrentLocale();
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en-US'
  }).format(dateObj);
};

/**
 * Format time only
 * Indonesian: 14.30
 * English: 2:30 PM
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getCurrentLocale();
  
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en-US'
  }).format(dateObj);
};

/**
 * Format relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date, t) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return t('time.justNow');
  } else if (diffMins < 60) {
    return `${diffMins} ${t('time.minutesAgo')}`;
  } else if (diffHours < 24) {
    return `${diffHours} ${t('time.hoursAgo')}`;
  } else if (diffDays === 1) {
    return t('time.yesterday');
  } else if (diffDays < 30) {
    return `${diffDays} ${t('time.daysAgo')}`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Parse formatted number back to float
 */
export const parseFormattedNumber = (formattedNumber) => {
  if (!formattedNumber) return 0;
  
  // Remove currency symbols and spaces
  let cleaned = formattedNumber.toString().replace(/[^\d,.-]/g, '');
  
  // Detect if using Indonesian format (comma as decimal separator)
  const locale = getCurrentLocale();
  if (locale === 'id-ID') {
    // Replace dot with nothing (thousands separator), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Remove commas (thousands separator)
    cleaned = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(cleaned) || 0;
};
