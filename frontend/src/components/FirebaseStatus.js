import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const FirebaseStatus = () => {
  const [status, setStatus] = useState({
    connected: null,
    loading: true,
    latency: null,
    error: null,
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus({ connected: null, loading: true, latency: null, error: null });
    
    try {
      console.log('🔍 Checking Firebase connection...');
      const startTime = performance.now();
      
      // Try to read from Firestore
      const q = query(collection(db, 'readings'), limit(1));
      await getDocs(q);
      
      const endTime = performance.now();
      const latency = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Firebase connected! Latency: ${latency}s`);
      setStatus({
        connected: true,
        loading: false,
        latency: parseFloat(latency),
        error: null,
      });
    } catch (error) {
      console.error('❌ Firebase connection error:', error);
      setStatus({
        connected: false,
        loading: false,
        latency: null,
        error: error.message,
      });
    }
  };

  if (status.loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-sm text-blue-800">Checking Firebase connection...</span>
        </div>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-green-800">
                ✅ Firebase Connected
              </p>
              <p className="text-xs text-green-600 mt-1">
                Latency: {status.latency}s {status.latency > 2 ? '(Slow connection)' : '(Good)'}
              </p>
            </div>
          </div>
          <button
            onClick={checkConnection}
            className="text-xs text-green-700 hover:text-green-900 underline"
          >
            Recheck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-3 w-3 bg-red-500 rounded-full mr-3"></div>
          <div>
            <p className="text-sm font-medium text-red-800">
              ❌ Firebase Connection Failed
            </p>
            <p className="text-xs text-red-600 mt-1">
              {status.error || 'Unable to connect to Firebase'}
            </p>
          </div>
        </div>
        <button
          onClick={checkConnection}
          className="text-xs text-red-700 hover:text-red-900 underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default FirebaseStatus;
