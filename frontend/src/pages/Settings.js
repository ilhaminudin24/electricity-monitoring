import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getSettings, 
  updateSettings, 
  getAvailableTariffs, 
  getTariffRateById,
  resetToDefaults 
} from '../utils/settings';
import { formatRupiah } from '../utils/rupiah';

const Settings = () => {
  const { t } = useTranslation();
  const [tariffMode, setTariffMode] = useState('preset'); // 'preset' or 'custom'
  const [selectedGroup, setSelectedGroup] = useState('R1');
  const [selectedSubcategory, setSelectedSubcategory] = useState('R1_1300');
  const [currentRate, setCurrentRate] = useState(1444.70);
  const [adminFee, setAdminFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [customTariffName, setCustomTariffName] = useState('');
  const [customRate, setCustomRate] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const tariffsData = getAvailableTariffs();
  const selectedGroupData = tariffsData.tariffGroups.find(g => g.id === selectedGroup);

  useEffect(() => {
    // Load current settings
    const currentSettings = getSettings();
    setTariffMode(currentSettings.tariffType || 'preset');
    setSelectedGroup(currentSettings.selectedTariffGroup || 'R1');
    setSelectedSubcategory(currentSettings.selectedTariffSubcategory || 'R1_1300');
    setAdminFee(currentSettings.adminFee || 0);
    setTax(currentSettings.tax || 0);
    setCustomTariffName(currentSettings.customTariffName || '');
    setCustomRate(currentSettings.customTariffRate || 0);
    
    // Set current rate based on mode
    if (currentSettings.tariffType === 'custom') {
      setCurrentRate(currentSettings.customTariffRate || 0);
    } else {
      const rate = getTariffRateById(currentSettings.selectedTariffSubcategory || 'R1_1300');
      setCurrentRate(rate);
    }
  }, []);

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    
    // Auto-select first subcategory
    const group = tariffsData.tariffGroups.find(g => g.id === groupId);
    if (group && group.subcategories.length > 0) {
      const firstSubcat = group.subcategories[0];
      setSelectedSubcategory(firstSubcat.id);
      setCurrentRate(firstSubcat.rate);
    }
  };

  const handleSubcategoryChange = (e) => {
    const subcatId = e.target.value;
    setSelectedSubcategory(subcatId);
    const rate = getTariffRateById(subcatId);
    setCurrentRate(rate);
  };

  const handleModeChange = (mode) => {
    setTariffMode(mode);
    setError('');
    setSuccess(false);
    
    if (mode === 'preset') {
      const rate = getTariffRateById(selectedSubcategory);
      setCurrentRate(rate);
    } else {
      setCurrentRate(customRate || 0);
    }
  };

  const handleCustomRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setCustomRate(value);
    if (tariffMode === 'custom') {
      setCurrentRate(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (tariffMode === 'preset' && !selectedSubcategory) {
      setError(t('settings.validation.selectTariff'));
      return;
    }

    if (tariffMode === 'custom') {
      if (!customTariffName.trim()) {
        setError(t('settings.validation.enterTariffName'));
        return;
      }
      if (customRate <= 0) {
        setError(t('settings.validation.tariffRatePositive'));
        return;
      }
    }

    if (adminFee < 0) {
      setError(t('settings.validation.adminFeeNonNegative'));
      return;
    }

    if (tax < 0 || tax > 100) {
      setError(t('settings.validation.taxRange'));
      return;
    }

    try {
      setLoading(true);
      
      const newSettings = {
        tariffType: tariffMode,
        selectedTariffGroup: selectedGroup,
        selectedTariffSubcategory: selectedSubcategory,
        adminFee: parseFloat(adminFee) || 0,
        tax: parseFloat(tax) || 0,
        customTariffName: customTariffName,
        customTariffRate: parseFloat(customRate) || 0,
        tariffPerKwh: currentRate,
      };
      
      updateSettings(newSettings);
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t('settings.failedToSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaults = resetToDefaults();
    setTariffMode(defaults.tariffType);
    setSelectedGroup(defaults.selectedTariffGroup);
    setSelectedSubcategory(defaults.selectedTariffSubcategory);
    setCurrentRate(defaults.tariffPerKwh);
    setAdminFee(defaults.adminFee);
    setTax(defaults.tax);
    setCustomTariffName(defaults.customTariffName);
    setCustomRate(defaults.customTariffRate);
    
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleConvertToCustom = () => {
    setTariffMode('custom');
    setCustomRate(currentRate);
    
    // Generate name from current selection
    if (selectedGroupData) {
      const subcat = selectedGroupData.subcategories.find(s => s.id === selectedSubcategory);
      if (subcat) {
        setCustomTariffName(`${selectedGroupData.name} - ${subcat.name}`);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h2>
        <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">✓ {t('settings.savedSuccessfully')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tariff Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.tariffConfiguration')}</h3>
          
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('preset')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                tariffMode === 'preset'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-sm">⚡ {t('settings.plnTariff')}</div>
                <div className="text-xs mt-1 opacity-75">{t('settings.useOfficialRates')}</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('custom')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                tariffMode === 'custom'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className="text-sm">✏️ {t('settings.custom')}</div>
                <div className="text-xs mt-1 opacity-75">{t('settings.manualInput')}</div>
              </div>
            </button>
          </div>

          {/* PLN Preset Tariff */}
          {tariffMode === 'preset' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.tariffGroup')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {tariffsData.tariffGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGroupData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.powerCapacity')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={handleSubcategoryChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {selectedGroupData.subcategories.map(subcat => (
                      <option key={subcat.id} value={subcat.id}>
                        {subcat.name} - {formatRupiah(subcat.rate)}/kWh
                        {subcat.isSubsidized && ' (Subsidized)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-900">{t('settings.currentEffectiveRate')}</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {formatRupiah(currentRate)}
                      <span className="text-sm font-normal text-blue-600">{t('units.perKwh')}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConvertToCustom}
                    className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                  >
                    {t('settings.convertToCustom')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Tariff */}
          {tariffMode === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.tariffName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTariffName}
                  onChange={(e) => setCustomTariffName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('settings.tariffNamePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.pricePerKwh')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customRate}
                  onChange={handleCustomRateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1444.70"
                  required
                  min="0"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900">{t('settings.customRateSet')}</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {formatRupiah(currentRate)}
                  <span className="text-sm font-normal text-green-600">{t('units.perKwh')}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Fees */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.additionalFees')}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.adminFee')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={adminFee}
                onChange={(e) => setAdminFee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('settings.adminFeePlaceholder')}
                min="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('settings.adminFeeDesc')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.tax')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('settings.taxPlaceholder')}
                min="0"
                max="100"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('settings.taxDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Calculation Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 {t('settings.calculationFormula')}</h3>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-700">{t('formulaLabels.tokenAmount')} =</p>
            <p className="text-gray-900 font-medium mt-1">
              ({t('formulaLabels.tokenCost')} - {t('formulaLabels.adminFee')} - {t('formulaLabels.taxAmount')}) / {t('formulaLabels.tariffRate')}
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">{t('settings.exampleCalculation')}</p>
            <p className="text-xs text-blue-800">
              {t('formulaLabels.tokenCost')} = Rp 200,000
              <br />
              {t('formulaLabels.adminFee')} = {formatRupiah(adminFee)}
              <br />
              {t('settings.tax')} ({tax}%) = {formatRupiah((200000 * parseFloat(tax || 0)) / 100)}
              <br />
              {t('formulaLabels.tariffRate')} = {formatRupiah(currentRate)}{t('units.perKwh')}
            </p>
            <p className="text-sm font-bold text-blue-900 mt-2">
              {t('settings.result')} = {(
                (200000 - parseFloat(adminFee || 0) - (200000 * parseFloat(tax || 0)) / 100) / 
                currentRate
              ).toFixed(2)} {t('units.kwh')}
            </p>
          </div>
        </div>

        {/* Action Buttons - Sticky on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-0 md:p-0 md:bg-transparent">
          <div className="max-w-3xl mx-auto flex justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('settings.resetToDefaults')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.saving') : t('settings.saveSettings')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;

