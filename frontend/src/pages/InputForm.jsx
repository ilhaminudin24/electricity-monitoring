import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { addReading, getLastReading, getLastReadingBeforeDate, checkReadingExists, deleteReading, updateReading, getReadingsAfterDate, bulkUpdateReadingsKwh } from '../services/supabaseService';
import DuplicateDateModal from '../components/DuplicateDateModal';
import BackdateRecalculationModal from '../components/BackdateRecalculationModal';
import EditReadingModal from '../components/EditReadingModal';
import { formatRupiah, parseRupiah, formatRupiahInput } from '../utils/rupiah';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '../utils/date';
import { calculateTokenAmount } from '../utils/settings';
import { validateReading, VALIDATION_RESULT, getValidationMessage } from '../utils/validationService';
import ReadingAnomalyModal from '../components/ReadingAnomalyModal';
import { Camera, Zap, ClipboardList, ArrowRight, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const InputForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('record'); // 'record' | 'topup'
  const [lastReadingVal, setLastReadingVal] = useState(0);

  const [formData, setFormData] = useState({
    reading_kwh: '',
    date: toDateTimeLocalInput(new Date()), // Default to now
    token_amount: '',
    token_cost: '',
    token_cost_display: '', // For formatted display
    notes: '',
  });

  // Date validation: max = today, min = 30 days ago
  const maxDate = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 30);
  const maxDateStr = toDateTimeLocalInput(maxDate);
  const minDateStr = toDateTimeLocalInput(minDate);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [calculatedTokenAmount, setCalculatedTokenAmount] = useState(null);

  // Duplicate date modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateReading, setDuplicateReading] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  // Edit modal state (for duplicate resolution)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  // Validation state
  const [validationHint, setValidationHint] = useState(null);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [anomalyDetails, setAnomalyDetails] = useState(null);

  // Backdate recalculation state
  const [showRecalculationModal, setShowRecalculationModal] = useState(false);
  const [affectedReadings, setAffectedReadings] = useState([]);
  const [kwhOffset, setKwhOffset] = useState(0);

  // Fetch last reading BEFORE the selected date (date-aware validation)
  // This ensures validation compares against the correct previous reading
  useEffect(() => {
    async function fetchLastReadingBeforeDate() {
      if (currentUser && formData.date) {
        try {
          // Use the selected date for date-aware lookup
          const selectedDate = formData.date;
          const last = await getLastReadingBeforeDate(currentUser.id, selectedDate);
          if (last) {
            const kwhVal = last.kwh_value || last.reading_kwh || 0;
            setLastReadingVal(kwhVal);
          } else {
            // No previous reading found before this date
            setLastReadingVal(0);
          }
        } catch (e) {
          console.error("Failed to fetch last reading before date", e);
          // Fallback: try to get absolute last reading
          try {
            const fallback = await getLastReading(currentUser.id);
            if (fallback) {
              setLastReadingVal(fallback.kwh_value || fallback.reading_kwh || 0);
            }
          } catch (fallbackErr) {
            console.error("Fallback also failed", fallbackErr);
          }
        }
      }
    }
    fetchLastReadingBeforeDate();
  }, [currentUser, formData.date]);

  // Auto-calculate token amount and NEW METER READING when token cost changes
  useEffect(() => {
    const calculate = async () => {
      if (formData.token_cost) {
        const numericCost = parseRupiah(formData.token_cost);
        if (numericCost > 0) {
          try {
            // Use async calculation
            const calculated = await calculateTokenAmount(numericCost);

            if (calculated !== null && typeof calculated === 'number') {
              setCalculatedTokenAmount(calculated);

              // Smart Pre-fill: If in Top Up mode, auto-fill reading_kwh
              if (activeTab === 'topup') {
                const projectedReading = lastReadingVal + calculated;
                setFormData((prev) => ({
                  ...prev,
                  token_amount: calculated.toFixed(2),
                  reading_kwh: projectedReading.toFixed(2)
                }));
              } else {
                setFormData((prev) => ({
                  ...prev,
                  token_amount: calculated.toFixed(2),
                }));
              }

            } else {
              setCalculatedTokenAmount(null);
              // Reset if invalid
              setFormData((prev) => ({ ...prev, token_amount: '' }));
            }
          } catch (error) {
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
  }, [formData.token_cost, activeTab, lastReadingVal]);

  // Real-time validation hint
  useEffect(() => {
    if (activeTab === 'record' && formData.reading_kwh && lastReadingVal > 0) {
      const val = parseFloat(formData.reading_kwh);
      const result = validateReading(val, lastReadingVal, false);

      // Only show meaningful hints
      if (!isNaN(val)) {
        setValidationHint(result);
      } else {
        setValidationHint(null);
      }
    } else {
      setValidationHint(null);
    }
  }, [formData.reading_kwh, lastReadingVal, activeTab]);

  // Reset form when switching tabs, but keep date
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      reading_kwh: '',
      token_amount: '',
      token_cost: '',
      token_cost_display: '',
      notes: ''
    }));
    setCalculatedTokenAmount(null);
    setError('');
    setSuccess(false);
  }, [activeTab]);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Photo size must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentUser) {
      setError("You must be logged in to submit a reading.");
      return;
    }

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

    // Token cost is already parsed
    const tokenCostNumeric = formData.token_cost ? parseRupiah(formData.token_cost) : null;
    if (tokenCostNumeric !== null && (isNaN(tokenCostNumeric) || tokenCostNumeric < 0)) {
      setError(t('input.validation.tokenCostInvalid'));
      return;
    }

    // BUSINESS LOGIC VALIDATION (HARD BLOCK)
    if (activeTab === 'record') {
      const validationResult = validateReading(
        parseFloat(formData.reading_kwh),
        lastReadingVal,
        false
      );

      // Check for BLOCKING condition
      if (validationResult.isBlocking) {
        setAnomalyDetails(validationResult);
        setShowAnomalyModal(true);
        setLoading(false);
        return; // HARD STOP
      }
    }

    try {
      setLoading(true);

      // Prepare data for Supabase
      const readingData = {
        date: formData.date ? fromDateTimeLocalInput(formData.date) : new Date().toISOString(),
        kwh: parseFloat(formData.reading_kwh),
        token_cost: formData.token_cost ? parseRupiah(formData.token_cost) : null,
        token_amount: parseFloat(formData.token_amount) || null,
        notes: formData.notes || null
      };

      // Check for existing reading on same date
      const existingReading = await checkReadingExists(currentUser.id, formData.date);
      if (existingReading) {
        // Show duplicate modal instead of proceeding
        setDuplicateReading(existingReading);
        setPendingSubmission(readingData);
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      // No duplicate, check for backdate recalculation (Top-Up mode only)
      if (activeTab === 'topup') {
        const readingsAfter = await getReadingsAfterDate(currentUser.id, formData.date);

        if (readingsAfter.length > 0) {
          // Calculate offset = kWh purchased
          const purchasedKwh = parseFloat(formData.token_amount) || calculatedTokenAmount || 0;

          setAffectedReadings(readingsAfter);
          setKwhOffset(purchasedKwh);
          setPendingSubmission(readingData);
          setShowRecalculationModal(true);
          setLoading(false);
          return; // Wait for modal confirmation
        }
      }

      // No backdate recalculation needed, proceed with save
      await saveReading(readingData);
    } catch (err) {
      let errorMessage = t('input.validation.failedToSave');
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Extracted save logic for reuse
  const saveReading = async (readingData) => {
    // Add timeout to prevent hanging
    const savePromise = addReading(currentUser.id, readingData, photoFile);
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
    setPhotoFile(null);
    setPhotoPreview(null);
    setCalculatedTokenAmount(null);

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  // Handle Edit Existing from duplicate modal
  const handleEditExisting = () => {
    setShowDuplicateModal(false);
    // Directly open the edit modal for the conflicting reading
    setEditingReading(duplicateReading);
    setShowEditModal(true);
  };

  const handleEditSave = async (id, updates) => {
    try {
      setLoading(true);
      await updateReading(id, updates);
      setSuccess(true);
      setShowEditModal(false);
      setEditingReading(null);
      setDuplicateReading(null);
      setPendingSubmission(null);

      // Navigate to dashboard or refresh? 
      // User likely satisfied with editing the existing one.
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update reading');
    } finally {
      setLoading(false);
    }
  };

  // Handle Replace from duplicate modal
  const handleReplace = async () => {
    setShowDuplicateModal(false);
    if (!duplicateReading || !pendingSubmission) return;

    try {
      setLoading(true);
      // Delete existing reading first
      await deleteReading(duplicateReading.id);
      // Then save new one
      await saveReading(pendingSubmission);
    } catch (err) {
      let errorMessage = t('input.validation.failedToSave');
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setPendingSubmission(null);
      setDuplicateReading(null);
    }
  };

  const handleSwitchToTopUp = () => {
    // preserving the reading value user typed
    const currentReading = formData.reading_kwh;

    // Switch to top up tab
    setActiveTab('topup');
    setShowAnomalyModal(false);

    // Wait for state update then pre-fill
    // We need to use setTimeout to allow the tab switch (and effect reset) to happen first
    // Note: The existing useEffect resets form on tab change, so we override it after
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        reading_kwh: currentReading,
        // Optional: Pre-fill a guess for token amount if we wanted to be fancy, 
        // but safer to let user input cost
      }));
    }, 50);
  };

  // Handle backdate recalculation confirmation
  const handleRecalculationConfirm = async () => {
    try {
      setLoading(true);
      setShowRecalculationModal(false);

      // 1. Save the new backdate top-up reading
      await saveReading(pendingSubmission);

      // 2. Update all affected readings (add offset to kwh_value)
      const updates = affectedReadings.map(reading => ({
        id: reading.id,
        kwh_value: reading.kwh_value + kwhOffset
      }));

      await bulkUpdateReadingsKwh(updates);

      // Success - clear backdate state
      setAffectedReadings([]);
      setKwhOffset(0);
      setPendingSubmission(null);

    } catch (err) {
      setError(err.message || 'Failed to update readings');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-10">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('input.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('input.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'record'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <ClipboardList className="w-4 h-4" />
          {t('input.tabRecordReading')}
        </button>
        <button
          onClick={() => setActiveTab('topup')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'topup'
            ? 'bg-white text-energy-yellow shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Zap className="w-4 h-4" />
          {t('input.tabTopUp')}
        </button>
      </div>

      <div className="bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <div className="p-1 bg-red-100 rounded-full text-red-600 mt-0.5">
              <Zap className="w-3 h-3" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-800">Error</h4>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {t('input.savedSuccessfully')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Date Input - Common */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t('input.date')}
            </label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={minDateStr}
              max={maxDateStr}
              required
              className="block w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary sm:text-sm px-4 py-3 border transition-colors"
            />
          </div>

          {/* TOP UP MODE SPECIFIC INPUTS */}
          {activeTab === 'topup' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                <label className="block text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2">
                  {t('input.nominalToken')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                  <input
                    type="text"
                    name="token_cost"
                    value={formData.token_cost}
                    onChange={handleChange}
                    className="block w-full pl-12 rounded-xl border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400 sm:text-lg font-bold px-4 py-3 border transition-colors"
                    placeholder="100.000"
                    autoFocus
                  />
                </div>
                {calculatedTokenAmount && (
                  <div className="mt-3 flex items-center justify-between text-sm text-yellow-800 px-1">
                    <span>{t('input.getElectricity')}:</span>
                    <span className="font-bold">+{calculatedTokenAmount.toFixed(2)} kWh</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('input.autoCalculation')}</span>
                </div>
              </div>
            </div>
          )}

          {/* METER READING INPUT */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {activeTab === 'topup' ? t('input.newMeterPosition') : t('input.meterReading')}
            </label>

            {activeTab === 'topup' && lastReadingVal > 0 && formData.token_cost && (
              <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                {t('input.lastReading')}: <b>{lastReadingVal}</b> + {t('input.newAmount')}: <b>{calculatedTokenAmount?.toFixed(2) || 0}</b>
              </div>
            )}

            <div className="relative">
              <input
                type="number"
                step="0.01"
                name="reading_kwh"
                value={formData.reading_kwh}
                onChange={handleChange}
                required
                className={`block w-full rounded-xl sm:text-lg font-bold px-4 py-3 border transition-colors ${validationHint?.status === 'WARNING_READING_INCREASED'
                  ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-200'
                  : activeTab === 'topup'
                    ? 'border-blue-200 bg-blue-50/50 text-blue-900 focus:border-blue-400 focus:ring-blue-400'
                    : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary'
                  }`}
                placeholder="0000.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kWh</span>
            </div>

            {/* Validation Hint Message */}
            {activeTab === 'record' && validationHint && (
              <div className={`mt-2 text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${validationHint.isValid
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
                }`}>
                {validationHint.isValid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>
                  {validationHint.isValid
                    ? t('validation.readingLooksGood', { consumption: validationHint.consumption })
                    : t('validation.readingMustBeLower', { lastReading: validationHint.lastReading })
                  }
                </span>
              </div>
            )}

            {activeTab === 'topup' && (
              <p className="text-xs text-gray-400 mt-2">
                {t('input.meterNote')}
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t('input.evidencePhoto')}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary hover:bg-gray-50 transition-colors cursor-pointer relative">

              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handlePhotoChange}
              />

              <div className="space-y-1 text-center">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="mx-auto h-32 object-cover rounded-lg shadow-sm" />
                    <p className="text-xs text-gray-500 mt-2">{photoFile?.name}</p>
                    <div className="mt-2 text-primary font-bold text-sm">{t('input.tapToChange')}</div>
                  </div>
                ) : (
                  <>
                    <Camera className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center mt-2">
                      <span className="font-medium text-primary">{t('input.uploadPhoto')}</span>
                    </div>
                    <p className="text-xs text-gray-500">{t('input.photoLimit')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === 'topup'
              ? 'bg-energy-yellow hover:bg-yellow-500 shadow-yellow-500/30 text-gray-900'
              : 'bg-primary hover:bg-blue-600 shadow-primary/30 text-white'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {activeTab === 'topup' ? t('input.confirmTopUp') : t('input.saveReading')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>

      {/* Duplicate Date Modal */}
      <DuplicateDateModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setPendingSubmission(null);
          setDuplicateReading(null);
        }}
        existingReading={duplicateReading}
        onEditExisting={handleEditExisting}
        onReplace={handleReplace}
      />

      {/* Edit Reading Modal (for direct resolution) */}
      <EditReadingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReading(null);
        }}
        reading={editingReading}
        onSave={handleEditSave}
      />

      {/* Validation Anomaly Modal (Hard Block) */}
      <ReadingAnomalyModal
        isOpen={showAnomalyModal}
        onClose={() => setShowAnomalyModal(false)}
        details={anomalyDetails}
        onSwitchToTopUp={handleSwitchToTopUp}
      />

      {/* Backdate Recalculation Modal */}
      <BackdateRecalculationModal
        isOpen={showRecalculationModal}
        onClose={() => {
          setShowRecalculationModal(false);
          setAffectedReadings([]);
          setKwhOffset(0);
          setPendingSubmission(null);
        }}
        onConfirm={handleRecalculationConfirm}
        backdateDate={formData.date}
        affectedReadings={affectedReadings}
        kwhOffset={kwhOffset}
        loading={loading}
      />
    </div>
  );
};

// Helper icon component since we are using lucide-react and it might not be imported in some contexts if I missed it
const CheckCircle = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default InputForm;

