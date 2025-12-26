/**
 * Date utility functions that preserve local time without timezone conversion
 * All dates are treated as local time, never converted to UTC
 * Now supports locale-aware formatting
 */

import { formatDateTime as formatDateTimeLocale, getCurrentLocale } from './localeFormatter';

/**
 * Format datetime to locale format
 * Input: Date object, Firestore Timestamp, ISO string, or SQLite format
 * Output: "16 Nov 2025, 19:00" (id-ID) or "Nov 16, 2025, 7:00 PM" (en-US)
 */
export const formatDateTimeLocal = (dateInput) => {
  if (!dateInput) return 'N/A';

  try {
    let date;

    // Handle different input types
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      // Firestore Timestamp
      date = dateInput.toDate();
    } else if (typeof dateInput === 'string') {
      // String format
      let datePart, timePart;

      if (dateInput.includes('T')) {
        // ISO format
        [datePart, timePart] = dateInput.split('T');
      } else if (dateInput.includes(' ')) {
        // SQLite format
        [datePart, timePart] = dateInput.split(' ');
      } else {
        // Date only
        datePart = dateInput;
        timePart = '00:00:00';
      }

      if (!datePart) return 'N/A';

      const [year, month, day] = datePart.split('-').map(Number);
      const timeStr = timePart ? timePart.split('.')[0] : '00:00:00';
      const [hours, minutes] = timeStr.split(':').map(Number);

      // Create date object in local timezone
      date = new Date(year, month - 1, day, hours || 0, minutes || 0);
    } else {
      // Try to parse as Date
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return 'N/A';

    // Use locale-aware formatting
    return formatDateTimeLocale(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format date only (without time) to locale format
 */
export const formatDateLocal = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const [datePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const locale = getCurrentLocale();
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Parse datetime input to ISO string format without timezone conversion
 * Input: Date object or ISO string
 * Output: ISO string like "2025-11-16T19:00:00"
 */
export const toLocalISOString = (dateInput) => {
  if (!dateInput) return null;

  try {
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Parse ISO string and extract local components
      const [datePart, timePart] = dateInput.split('T');
      if (datePart) {
        const [year, month, day] = datePart.split('-').map(Number);
        const timeStr = timePart ? timePart.split('.')[0] : '00:00:00';
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        date = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
      } else {
        date = new Date(dateInput);
      }
    } else {
      return null;
    }

    if (isNaN(date.getTime())) return null;

    // Format as ISO string using local time components (no timezone conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting to local ISO:', error);
    return null;
  }
};

/**
 * Convert datetime to input format for datetime-local input
 * Input: Date object, ISO string, SQLite format, or Firestore Timestamp
 * Output: "2025-11-16T19:00" (format for datetime-local input)
 */
export const toDateTimeLocalInput = (dateInput) => {
  if (!dateInput) return '';

  try {
    let date;

    // Handle different input types
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      // Firestore Timestamp
      date = dateInput.toDate();
    } else if (typeof dateInput === 'string') {
      // String format
      if (dateInput.includes('T')) {
        date = new Date(dateInput);
      } else if (dateInput.includes(' ')) {
        // SQLite format
        date = new Date(dateInput.replace(' ', 'T'));
      } else {
        return '';
      }
    } else {
      return '';
    }

    if (isNaN(date.getTime())) return '';

    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting to datetime-local input:', error);
    return '';
  }
};

/**
 * Parse datetime-local input value to ISO string with timezone
 * Input: "2025-11-16T19:00" (from datetime-local input, represents LOCAL time)
 * Output: "2025-11-16T12:00:00.000Z" (UTC ISO string, correct point in time)
 * 
 * This is critical for Supabase timestamptz fields - the datetime-local input
 * represents local time, and we need to convert it to UTC for proper storage.
 */
export const fromDateTimeLocalInput = (inputValue) => {
  if (!inputValue) return null;

  try {
    // datetime-local format is usually YYYY-MM-DDTHH:mm
    // We must manually parse it to ensure it's treated as LOCAL time,
    // because new Date(string) behavior with ISO-like strings can be inconsistent (sometimes UTC).

    let date;

    // Check if format is likely YYYY-MM-DDTHH:mm
    if (inputValue.includes('T')) {
      const [datePart, timePart] = inputValue.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      // key step: use the constructor that treats arguments as local time
      date = new Date(year, month - 1, day, hours, minutes);
    } else {
      // Fallback
      date = new Date(inputValue);
    }

    if (isNaN(date.getTime())) {
      console.error('Invalid date from datetime-local input:', inputValue);
      return null;
    }

    // toISOString() returns UTC time with Z suffix
    // Since 'date' was constructed as local time, this will correctly convert to UTC
    // Example: 23:31 Jakarta (UTC+7) -> 16:31 UTC
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing datetime-local input:', error);
    return null;
  }
};

