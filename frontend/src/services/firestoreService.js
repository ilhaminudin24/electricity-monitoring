/**
 * Firestore Service
 * CRUD operations for meter readings
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { calculateTokenAmount } from '../utils/settings';

const COLLECTION_NAME = 'readings';

/**
 * Convert Firestore timestamp to JavaScript Date
 */
const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // If it's a number (milliseconds), convert to Date
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return null;
};

/**
 * Convert date to Firestore timestamp
 */
const dateToTimestamp = (date) => {
  if (!date) return serverTimestamp();
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  if (typeof date === 'number') {
    return Timestamp.fromMillis(date);
  }
  if (typeof date === 'string') {
    // Parse ISO string or SQLite format
    const dateObj = new Date(date);
    return Timestamp.fromDate(dateObj);
  }
  return serverTimestamp();
};

/**
 * Create a new meter reading
 * @param {Object} readingData - Reading data
 * @param {number} readingData.reading_kwh - Meter reading in kWh
 * @param {number} readingData.token_cost - Token cost in Rupiah
 * @param {string} readingData.notes - Optional notes
 * @param {string|Date} readingData.created_at - Date/time (optional, defaults to now)
 * @returns {Promise<string>} Document ID
 */
export const addReading = async (readingData) => {
  try {
    console.log('🔵 [Firestore] Starting addReading...', new Date().toISOString());
    const startTime = performance.now();
    
    const { reading_kwh, token_cost, notes, created_at } = readingData;

    // Auto-calculate token amount if token cost is provided
    const token_amount = token_cost ? calculateTokenAmount(token_cost) : null;

    // Prepare data for Firestore
    const data = {
      reading_kwh: parseFloat(reading_kwh),
      token_cost: token_cost ? parseFloat(token_cost) : null,
      token_amount: token_amount ? parseFloat(token_amount.toFixed(2)) : null,
      notes: notes || null,
      created_at: created_at ? dateToTimestamp(created_at) : serverTimestamp(),
    };

    console.log('📝 [Firestore] Prepared data:', data);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ [Firestore] Reading added with ID: ${docRef.id} in ${duration}s`);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ [Firestore] Error adding reading:', error);
    throw new Error('Failed to add reading: ' + error.message);
  }
};

/**
 * Update an existing meter reading
 * @param {string} id - Document ID
 * @param {Object} readingData - Updated reading data
 * @returns {Promise<void>}
 */
export const updateReading = async (id, readingData) => {
  try {
    const { reading_kwh, token_cost, notes, created_at } = readingData;

    // Auto-calculate token amount if token cost is provided
    const token_amount = token_cost ? calculateTokenAmount(token_cost) : null;

    // Prepare update data
    const updateData = {
      reading_kwh: parseFloat(reading_kwh),
      token_cost: token_cost ? parseFloat(token_cost) : null,
      token_amount: token_amount ? parseFloat(token_amount.toFixed(2)) : null,
      notes: notes || null,
    };

    // Only update created_at if provided
    if (created_at) {
      updateData.created_at = dateToTimestamp(created_at);
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating reading:', error);
    throw new Error('Failed to update reading: ' + error.message);
  }
};

/**
 * Delete a meter reading
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
export const deleteReading = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reading:', error);
    throw new Error('Failed to delete reading: ' + error.message);
  }
};

/**
 * Get all meter readings, ordered by created_at descending
 * @param {Function} callback - Optional real-time listener callback
 * @returns {Promise<Array>|Function} Array of readings (Promise) or unsubscribe function (if callback provided)
 */
export const getAllReadings = (callback = null) => {
  const readingsRef = collection(db, COLLECTION_NAME);
  const q = query(readingsRef, orderBy('created_at', 'desc'));

  if (callback && typeof callback === 'function') {
    // Real-time listener - returns unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const readings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToDate(doc.data().created_at),
      }));
      callback(readings);
    }, (error) => {
      console.error('Error in real-time listener:', error);
      callback([]);
    });
  } else {
    // One-time fetch - returns Promise
    return getDocs(q).then((snapshot) => {
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: timestampToDate(doc.data().created_at),
      }));
    }).catch((error) => {
      console.error('Error fetching readings:', error);
      throw new Error('Failed to fetch readings: ' + error.message);
    });
  }
};

/**
 * Get the latest meter reading
 * @returns {Promise<Object|null>} Latest reading or null
 */
export const getLatestReading = async () => {
  try {
    const readings = await getAllReadings();
    return readings.length > 0 ? readings[0] : null;
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    throw new Error('Failed to fetch latest reading: ' + error.message);
  }
};

/**
 * Get reading by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>} Reading or null
 */
export const getReadingById = async (id) => {
  try {
    const { getDoc } = await import('firebase/firestore');
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        created_at: timestampToDate(docSnap.data().created_at),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching reading by ID:', error);
    throw new Error('Failed to fetch reading: ' + error.message);
  }
};

