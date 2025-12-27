import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRupiah, parseRupiah, formatRupiahInput } from '../utils/rupiah';
import { calculateTokenAmount } from '../utils/settings';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '../utils/date';
import { validateReading, getValidationMessage } from '../utils/validationService';
import { Zap, Activity, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  getEventsAfterDate,
  previewBackdateImpact,
  validateBackdateOperation
} from '../services/eventService';

const EditReadingModal = ({ isOpen, onClose, reading, onSave, onRecalculationNeeded }) => {
  const { t } = useTranslation();
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

  // Validation state
  const [prevReading, setPrevReading] = useState(null);
  const [validationHint, setValidationHint] = useState(null);

  // Anomaly blocking state (for reading mode - same as InputForm)
  const [isBlocked, setIsBlocked] = useState(false);

  // Determine if this is a Top Up entry
  const isTopUp = reading?.token_cost && reading.token_cost > 0;

  useEffect(() => {
    if (reading && isOpen) {
      const kwhValue = reading.kwh_value || reading.reading_kwh || '';
      const tokenCost = reading.token_cost ? formatRupiahInput(reading.token_cost) : '';

      let dateTimeInput = '';
      const dateValue = reading.date || reading.created_at;
      if (dateValue) {
        if (dateValue instanceof Date) {
          dateTimeInput = toDateTimeLocalInput(dateValue);
        } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          dateTimeInput = toDateTimeLocalInput(dateValue.toDate());
        } else {
          dateTimeInput = toDateTimeLocalInput(new Date(dateValue));
        }
      }

      setFormData({
        reading_kwh: kwhValue,
        token_cost: tokenCost,
        token_cost_display: reading.token_cost ? formatRupiah(reading.token_cost) : '',
        notes: reading.notes || '',
        created_at: dateTimeInput,
      });

      if (reading.token_cost) {
        calculateTokenAmount(reading.token_cost)
          .then(calculated => setCalculatedTokenAmount(calculated))
          .catch(() => setCalculatedTokenAmount(null));
      }

      // Fetch Previous Reading for Validation
      const fetchPrevReading = async () => {
        if (!reading) return;

        try {
          // Find the reading immediately BEFORE the current one
          const { data, error } = await supabase
            .from('electricity_readings')
            .select('kwh_value')
            .eq('user_id', reading.user_id || reading.userId)
            .lt('date', reading.date) // Older than current
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setPrevReading(data.kwh_value);
          } else {
            setPrevReading(null);
          }
        } catch (err) {
          console.error('Error fetching prev reading:', err);
        }
      };

      fetchPrevReading();

    }
  }, [reading, isOpen]);

  useEffect(() => {
    const calculate = async () => {
      if (formData.token_cost) {
        const numericCost = parseRupiah(formData.token_cost);
        if (numericCost > 0) {
          try {
            const calculated = await calculateTokenAmount(numericCost);
            setCalculatedTokenAmount(calculated);
          } catch {
            setCalculatedTokenAmount(null);
          }
        } else {
          setCalculatedTokenAmount(null);
        }
      } else {
        setCalculatedTokenAmount(null);
      }
    };
    calculate();
  }, [formData.token_cost]);

  // Real-time validation for EDIT
  useEffect(() => {
    if (!isTopUp && formData.reading_kwh && prevReading) {
      const val = parseFloat(formData.reading_kwh);
      // We use isTopUpMode=false because even if user is switching tab, 
      // visual validation helps for 'Record Reading' tab
      const result = validateReading(val, prevReading, false);
      if (!isNaN(val)) {
        setValidationHint(result);
      } else {
        setValidationHint(null);
      }
    } else {
      setValidationHint(null);
    }
  }, [formData.reading_kwh, prevReading, isTopUp]);

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

    if (!formData.reading_kwh || formData.reading_kwh === '') {
      setError(t('input.validation.meterReadingRequired', 'Meter reading is required'));
      return;
    }

    if (formData.reading_kwh && isNaN(parseFloat(formData.reading_kwh))) {
      setError(t('input.validation.meterReadingInvalid', 'Invalid meter reading'));
      return;
    }

    const tokenCostNumeric = formData.token_cost ? parseRupiah(formData.token_cost) : null;
    if (tokenCostNumeric !== null && (isNaN(tokenCostNumeric) || tokenCostNumeric < 0)) {
      setError(t('input.validation.tokenCostInvalid', 'Invalid token cost'));
      return;
    }

    // BUSINESS LOGIC VALIDATION (HARD BLOCK for reading mode - same as InputForm)
    if (!isTopUp && prevReading) {
      const validationResult = validateReading(
        parseFloat(formData.reading_kwh),
        prevReading,
        false
      );

      if (validationResult.isBlocking) {
        setError(t('validation.readingMustBeLower', { lastReading: prevReading }) +
          ' ' + t('validation.useTopUpInstead', 'Jika Anda melakukan top-up, silakan edit entry sebagai Top Up.'));
        setIsBlocked(true);
        return; // HARD STOP
      }
    }

    try {
      setLoading(true);
      const created_at = formData.created_at
        ? new Date(fromDateTimeLocalInput(formData.created_at))
        : null;

      const payload = {
        date: created_at ? new Date(fromDateTimeLocalInput(formData.created_at)).toISOString() : new Date().toISOString(),
        kwh: parseFloat(formData.reading_kwh),
        reading_kwh: parseFloat(formData.reading_kwh),
        token_cost: tokenCostNumeric,
        token_amount: calculatedTokenAmount || null,
        notes: formData.notes || null,
        created_at: created_at,
      };

      // Check for backdate recalculation (Top-Up mode only)
      if (isTopUp && onRecalculationNeeded) {
        const userId = reading.user_id || reading.userId;
        const eventsAfter = await getEventsAfterDate(userId, formData.created_at);

        if (eventsAfter.length > 0) {
          // Calculate kWh difference (new - old)
          const oldKwh = reading.token_amount || 0;
          const newKwh = calculatedTokenAmount || 0;
          const kwhDiff = newKwh - oldKwh;

          if (Math.abs(kwhDiff) > 0.01) { // Only trigger if there's an actual difference
            // Validate that this edit won't cause illogical data
            const validation = await validateBackdateOperation(
              userId,
              formData.created_at,
              kwhDiff
            );

            // Get preview of impact
            const preview = await previewBackdateImpact(
              userId,
              formData.created_at,
              kwhDiff
            );

            // Delegate to parent component
            onRecalculationNeeded({
              readingId: reading.id,
              payload,
              affectedReadings: preview,
              kwhOffset: kwhDiff,
              validationIssues: validation.issues || [],
              backdateDate: formData.created_at,
              tokenCost: tokenCostNumeric || 0
            });
            setLoading(false);
            return; // Wait for parent to handle confirmation
          }
        }
      }

      // No backdate recalculation needed, proceed with save
      await onSave(reading.id, payload);
      onClose();
    } catch (err) {
      let errorMessage = t('history.updateFailed', 'Failed to update');
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isTopUp ? t('input.editTopUp') : t('input.editReading')}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isTopUp ? t('input.updateTopUpDetails') : t('input.updateMeterReading')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode-Locked Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
            <div
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${!isTopUp
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Activity className="w-4 h-4" />
              {t('input.tabRecordReading')}
            </div>
            <div
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isTopUp
                ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm'
                : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              <Zap className="w-4 h-4" />
              {t('input.tabTopUp')}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
              <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 mt-0.5">
                <X className="w-3 h-3" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Error</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TOP UP MODE */}
            {isTopUp && (
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                  <label className="block text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-2">
                    {t('input.nominalToken')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                    <input
                      type="text"
                      name="token_cost"
                      value={formData.token_cost}
                      onChange={handleChange}
                      className="block w-full pl-12 rounded-xl border-yellow-200 dark:border-yellow-900/30 bg-white dark:bg-yellow-900/5 focus:border-yellow-400 focus:ring-yellow-400 sm:text-lg font-bold px-4 py-3 border transition-colors"
                      placeholder="100.000"
                    />
                  </div>
                  {calculatedTokenAmount && (
                    <div className="mt-3 flex items-center justify-between text-sm text-yellow-800 dark:text-yellow-300 px-1">
                      <span>{t('input.getElectricity')}:</span>
                      <span className="font-bold">+{calculatedTokenAmount.toFixed(2)} kWh</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-[#1a2332] text-gray-500">{t('input.autoCalculation')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Date Input - Common */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t('input.date', 'Date')}
              </label>
              <input
                type="datetime-local"
                name="created_at"
                value={formData.created_at}
                onChange={handleChange}
                required
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 border transition-colors"
              />
            </div>

            {/* Meter Reading Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {isTopUp ? t('input.newMeterPosition') : t('input.meterReading')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  name="reading_kwh"
                  value={formData.reading_kwh}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-xl sm:text-lg font-bold px-4 py-3 border transition-colors ${isTopUp
                    ? 'border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-300 focus:border-blue-400 focus:ring-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-primary'
                    }`}
                  placeholder="0000.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kWh</span>
              </div>
            </div>

            {/* Validation Hint for Edit */}
            {!isTopUp && validationHint && (
              <div className={`text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${validationHint.isValid
                ? 'hidden' // Don't show success in edit modal to save space, only warnings
                : 'bg-red-50 text-red-700'
                }`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {t('validation.readingMustBeLower', { lastReading: prevReading })}
                </span>
              </div>
            )}

            {/* Notes - Optional */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t('input.notes', 'Notes')} <span className="text-gray-400 text-xs normal-case">({t('common.optional', 'Optional')})</span>
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 border transition-colors resize-none"
                placeholder={t('input.notesPlaceholder', 'Add a note...')}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isTopUp
                  ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30 text-gray-900'
                  : 'bg-primary hover:bg-blue-600 shadow-primary/30 text-white'
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isTopUp ? t('input.updateTopUp') : t('input.saveReading')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditReadingModal;
