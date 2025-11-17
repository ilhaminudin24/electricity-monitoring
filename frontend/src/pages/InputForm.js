import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addReading } from '../services/firestoreService';
import { formatRupiah, parseRupiah, formatRupiahInput } from '../utils/rupiah';
import { calculateTokenAmount } from '../utils/settings';

const InputForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reading_kwh: '',
    token_amount: '',
    token_cost: '',
    token_cost_display: '', // For formatted display
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [calculatedTokenAmount, setCalculatedTokenAmount] = useState(null);

  // Auto-calculate token amount when token cost changes
  useEffect(() => {
    if (formData.token_cost) {
      const numericCost = parseRupiah(formData.token_cost);
      if (numericCost > 0) {
        const calculated = calculateTokenAmount(numericCost);
        setCalculatedTokenAmount(calculated);
        setFormData((prev) => ({
          ...prev,
          token_amount: calculated ? calculated.toFixed(2) : '',
        }));
      } else {
        setCalculatedTokenAmount(null);
        setFormData((prev) => ({
          ...prev,
          token_amount: '',
        }));
      }
    } else {
      setCalculatedTokenAmount(null);
      setFormData((prev) => ({
        ...prev,
        token_amount: '',
      }));
    }
  }, [formData.token_cost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for token_cost - format as Rupiah
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
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate required field
    if (!formData.reading_kwh || formData.reading_kwh === '') {
      setError(t('input.validation.meterReadingRequired'));
      return;
    }

    // Validate numeric fields
    if (formData.reading_kwh && isNaN(parseFloat(formData.reading_kwh))) {
      setError(t('input.validation.meterReadingInvalid'));
      return;
    }

    // Token cost is already parsed, so we validate the numeric value
    const tokenCostNumeric = formData.token_cost ? parseRupiah(formData.token_cost) : null;
    if (tokenCostNumeric !== null && (isNaN(tokenCostNumeric) || tokenCostNumeric < 0)) {
      setError(t('input.validation.tokenCostInvalid'));
      return;
    }

    try {
      setLoading(true);
      
      const tokenCostNumeric = formData.token_cost ? parseRupiah(formData.token_cost) : null;
      
      // Prepare data for Firestore
      const readingData = {
        reading_kwh: parseFloat(formData.reading_kwh),
        token_cost: tokenCostNumeric,
        notes: formData.notes || null,
        // created_at will be set to serverTimestamp() if not provided
      };
      
      // Add timeout to prevent hanging
      const savePromise = addReading(readingData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );
      
      await Promise.race([savePromise, timeoutPromise]);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        reading_kwh: '',
        token_amount: '',
        token_cost: '',
        token_cost_display: '',
        notes: '',
      });
      setCalculatedTokenAmount(null);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('❌ Error saving reading:', err);
      const errorMessage = err.message || t('input.validation.failedToSave');
      setError(errorMessage);
      
      // If it's a timeout or permission error, provide more helpful message
      if (err.message?.includes('timeout')) {
        setError(t('input.validation.requestTimeout'));
      } else if (err.message?.includes('permission') || err.message?.includes('insufficient')) {
        setError(t('input.validation.permissionDenied'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{t('input.title')}</h2>
        <p className="text-gray-600 mt-1">{t('input.subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✓ {t('input.savedSuccessfully')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reading_kwh" className="block text-sm font-medium text-gray-700">
              {t('input.meterReading')} <span className="text-red-500">*</span>
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
              placeholder={t('input.meterReadingPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="token_cost" className="block text-sm font-medium text-gray-700">
              {t('input.tokenCost')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="token_cost"
                name="token_cost"
                value={formData.token_cost}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border pr-20"
                placeholder={t('input.tokenCostPlaceholder')}
              />
              {formData.token_cost_display && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">{formData.token_cost_display}</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t('input.tokenWillCalculate')}
            </p>
          </div>

          <div>
            <label htmlFor="token_amount" className="block text-sm font-medium text-gray-700">
              {t('input.tokenAmount')} <span className="text-gray-400 text-xs">({t('input.autoCalculated')})</span>
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
                placeholder={t('input.tokenAmountPlaceholder')}
              />
              {calculatedTokenAmount && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-green-600 text-sm font-medium">✓ {t('input.calculated')}</span>
                </div>
              )}
            </div>
            {calculatedTokenAmount && (
              <p className="mt-1 text-xs text-green-600">
                {t('input.calculatedUsing')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t('input.notes')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder={t('input.notesPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? t('common.saving') : t('input.saveReading')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm;

