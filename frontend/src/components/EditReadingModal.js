import React, { useState, useEffect } from 'react';
import { formatRupiah, parseRupiah, formatRupiahInput } from '../utils/rupiah';
import { calculateTokenAmount } from '../utils/settings';
import { toDateTimeLocalInput, fromDateTimeLocalInput, toLocalISOString } from '../utils/date';

const EditReadingModal = ({ isOpen, onClose, reading, onSave }) => {
  const [formData, setFormData] = useState({
    reading_kwh: '',
    token_cost: '',
    token_cost_display: '',
    notes: '',
    created_at: '',
  });
  const [calculatedTokenAmount, setCalculatedTokenAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reading && isOpen) {
      // Pre-fill form with existing reading data
      const tokenCost = reading.token_cost ? formatRupiahInput(reading.token_cost) : '';
      const dateTimeInput = reading.created_at ? toDateTimeLocalInput(reading.created_at) : '';

      setFormData({
        reading_kwh: reading.reading_kwh || '',
        token_cost: tokenCost,
        token_cost_display: reading.token_cost ? formatRupiah(reading.token_cost) : '',
        notes: reading.notes || '',
        created_at: dateTimeInput,
      });

      // Calculate token amount if token cost exists
      if (reading.token_cost) {
        const calculated = calculateTokenAmount(reading.token_cost);
        setCalculatedTokenAmount(calculated);
      } else {
        setCalculatedTokenAmount(null);
      }
    }
  }, [reading, isOpen]);

  // Auto-calculate token amount when token cost changes
  useEffect(() => {
    if (formData.token_cost) {
      const numericCost = parseRupiah(formData.token_cost);
      if (numericCost > 0) {
        const calculated = calculateTokenAmount(numericCost);
        setCalculatedTokenAmount(calculated);
      } else {
        setCalculatedTokenAmount(null);
      }
    } else {
      setCalculatedTokenAmount(null);
    }
  }, [formData.token_cost]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'token_cost') {
      const numericValue = parseRupiah(value);
      const formatted = numericValue > 0 ? formatRupiahInput(numericValue) : '';
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
        token_cost_display: numericValue > 0 ? formatRupiah(numericValue) : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required field
    if (!formData.reading_kwh || formData.reading_kwh === '') {
      setError('Meter reading (kWh) is required');
      return;
    }

    // Validate numeric fields
    if (formData.reading_kwh && isNaN(parseFloat(formData.reading_kwh))) {
      setError('Meter reading must be a valid number');
      return;
    }

    const tokenCostNumeric = formData.token_cost ? parseRupiah(formData.token_cost) : null;
    if (tokenCostNumeric !== null && (isNaN(tokenCostNumeric) || tokenCostNumeric < 0)) {
      setError('Token cost must be a valid number');
      return;
    }

    try {
      setLoading(true);

      // Convert datetime-local input to ISO format
      const created_at = formData.created_at
        ? fromDateTimeLocalInput(formData.created_at)
        : null;

      // Convert to SQLite datetime format (YYYY-MM-DD HH:MM:SS)
      const sqliteDateTime = created_at
        ? created_at.replace('T', ' ').slice(0, 19)
        : null;

      const payload = {
        reading_kwh: parseFloat(formData.reading_kwh),
        token_amount: calculatedTokenAmount ? calculatedTokenAmount : null,
        token_cost: tokenCostNumeric,
        notes: formData.notes || null,
        created_at: sqliteDateTime,
      };

      await onSave(reading.id, payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update reading. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Reading</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="created_at" className="block text-sm font-medium text-gray-700">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="created_at"
                name="created_at"
                value={formData.created_at}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label htmlFor="reading_kwh" className="block text-sm font-medium text-gray-700">
                Meter Reading (kWh) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="reading_kwh"
                name="reading_kwh"
                value={formData.reading_kwh}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Enter current meter reading"
              />
            </div>

            <div>
              <label htmlFor="token_cost" className="block text-sm font-medium text-gray-700">
                Token Cost (Rupiah) <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="token_cost"
                  name="token_cost"
                  value={formData.token_cost}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border pr-20"
                  placeholder="Enter token cost (e.g., 200000)"
                />
                {formData.token_cost_display && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">{formData.token_cost_display}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="token_amount" className="block text-sm font-medium text-gray-700">
                Token Amount (kWh) <span className="text-gray-400 text-xs">(auto-calculated)</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="token_amount"
                  name="token_amount"
                  value={calculatedTokenAmount ? calculatedTokenAmount.toFixed(2) : ''}
                  readOnly
                  disabled
                  className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm px-3 py-2 border bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Will be calculated automatically"
                />
                {calculatedTokenAmount && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-sm font-medium">✓ Calculated</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReadingModal;

