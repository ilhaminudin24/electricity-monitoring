import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getAllTariffTiersAdmin,
  createTariffTier,
  updateTariffTier,
  deleteTariffTier
} from '../../../services/tariffService';
import { formatRupiah } from '../../../utils/rupiah';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';

const TariffTiersEditor = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    min_nominal: '',
    max_nominal: '',
    effective_tariff: '',
    label: '',
    active: true
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const data = await getAllTariffTiersAdmin();
      setTiers(data);
    } catch (err) {
      setError(t('tariffTiers.failedToLoad', { error: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      min_nominal: '',
      max_nominal: '',
      effective_tariff: '',
      label: '',
      active: true
    });
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleEdit = (tier) => {
    setFormData({
      min_nominal: tier.min_nominal,
      max_nominal: tier.max_nominal || '',
      effective_tariff: tier.effective_tariff,
      label: tier.label || '',
      active: tier.active
    });
    setEditingId(tier.id);
    setShowAddForm(true);
  };

  const handleDelete = async (tierId) => {
    if (!window.confirm(t('tariffTiers.confirmDelete'))) return;

    try {
      await deleteTariffTier(tierId);
      setSuccess(t('tariffTiers.deletedSuccessfully'));
      await loadTiers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(t('tariffTiers.failedToDelete', { error: err.message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.min_nominal || formData.min_nominal <= 0) {
      setError(t('tariffTiers.validation.minNominalRequired'));
      return;
    }
    if (formData.max_nominal && Number(formData.max_nominal) < Number(formData.min_nominal)) {
      setError(t('tariffTiers.validation.maxMustBeGreater'));
      return;
    }
    if (!formData.effective_tariff || formData.effective_tariff <= 0) {
      setError(t('tariffTiers.validation.tariffRequired'));
      return;
    }

    try {
      const tierData = {
        min_nominal: Number(formData.min_nominal),
        max_nominal: formData.max_nominal ? Number(formData.max_nominal) : null,
        effective_tariff: Number(formData.effective_tariff),
        label: formData.label || null,
        active: formData.active
      };

      if (editingId) {
        await updateTariffTier(editingId, tierData);
        setSuccess(t('tariffTiers.updatedSuccessfully'));
      } else {
        await createTariffTier(tierData);
        setSuccess(t('tariffTiers.createdSuccessfully'));
      }

      setShowAddForm(false);
      await loadTiers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(t('tariffTiers.failedToSave', { error: err.message }));
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      min_nominal: '',
      max_nominal: '',
      effective_tariff: '',
      label: '',
      active: true
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading tariff tiers...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('tariffTiers.title')}</h1>
          <p className="text-slate-600 mt-1">{t('tariffTiers.subtitle')}</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('tariffTiers.addTier')}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? t('tariffTiers.editTier') : t('tariffTiers.addTier')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tariffTiers.minNominal')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.min_nominal}
                  onChange={(e) => setFormData({ ...formData, min_nominal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tariffTiers.maxNominal')} <span className="text-gray-400 text-xs">({t('common.optional')})</span>
                </label>
                <input
                  type="number"
                  value={formData.max_nominal}
                  onChange={(e) => setFormData({ ...formData, max_nominal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={t('tariffTiers.maxNominalPlaceholder')}
                  min={formData.min_nominal || 1}
                />
                <p className="mt-1 text-xs text-gray-500">{t('tariffTiers.maxNominalHint')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tariffTiers.effectiveTariff')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.effective_tariff}
                  onChange={(e) => setFormData({ ...formData, effective_tariff: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">{t('tariffTiers.effectiveTariffHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('tariffTiers.label')}
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={t('tariffTiers.labelPlaceholder')}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                {t('tariffTiers.active')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{t('tariffTiers.range')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{t('tariffTiers.effectiveTariff')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{t('tariffTiers.label')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{t('tariffTiers.status')}</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tiers.map((tier) => {
                const range = tier.max_nominal === null
                  ? `≥ ${tier.min_nominal.toLocaleString('id-ID')}`
                  : `${tier.min_nominal.toLocaleString('id-ID')} - ${tier.max_nominal.toLocaleString('id-ID')}`;
                
                return (
                  <tr key={tier.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{range}</td>
                    <td className="px-6 py-4">{formatRupiah(tier.effective_tariff)} / kWh</td>
                    <td className="px-6 py-4">{tier.label || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tier.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tier.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(tier)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tier.id)}
                          className="text-red-600 hover:text-red-900"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tiers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    {t('tariffTiers.noTiers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TariffTiersEditor;

