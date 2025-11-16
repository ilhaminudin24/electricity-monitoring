import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../utils/settings';
import FirebaseStatus from '../components/FirebaseStatus';

const Settings = () => {
  const [settings, setSettings] = useState({
    tariffPerKwh: 1444.70,
    adminFee: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load current settings
    const currentSettings = getSettings();
    setSettings(currentSettings);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate
    if (settings.tariffPerKwh <= 0) {
      setError('Tariff per kWh must be greater than 0');
      return;
    }

    if (settings.adminFee < 0) {
      setError('Admin fee cannot be negative');
      return;
    }

    try {
      setLoading(true);
      updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      tariffPerKwh: 1444.70,
      adminFee: 0,
    };
    setSettings(defaultSettings);
    updateSettings(defaultSettings);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Configure tariff and admin fees for token calculation</p>
      </div>

      {/* Firebase Connection Status */}
      <div className="mb-6">
        <FirebaseStatus />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">✓ Settings saved successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tariffPerKwh" className="block text-sm font-medium text-gray-700">
              Tariff per kWh (Rupiah) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              id="tariffPerKwh"
              name="tariffPerKwh"
              value={settings.tariffPerKwh}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="1444.70"
            />
            <p className="mt-1 text-xs text-gray-500">
              Default PLN R1 tariff: Rp 1,444.70 per kWh
            </p>
          </div>

          <div>
            <label htmlFor="adminFee" className="block text-sm font-medium text-gray-700">
              Admin Fee / Pajak (Rupiah) <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              id="adminFee"
              name="adminFee"
              value={settings.adminFee}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Additional fees or taxes deducted from token cost before calculation
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Calculation Formula</h3>
            <p className="text-xs text-blue-800">
              Token Amount (kWh) = (Token Cost - Admin Fee) / Tariff per kWh
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Example: If Token Cost = Rp 200,000, Admin Fee = 0, Tariff = 1,444.70
              <br />
              Token Amount = (200,000 - 0) / 1,444.70 = 138.40 kWh
            </p>
          </div>

          <div className="flex justify-between space-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

