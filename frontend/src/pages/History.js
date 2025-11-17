import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllReadings, updateReading, deleteReading } from '../services/firestoreService';
import { formatRupiah } from '../utils/rupiah';
import { formatDateTimeLocal } from '../utils/date';
import EditReadingModal from '../components/EditReadingModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const History = () => {
  const { t } = useTranslation();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);

  const loadReadings = useCallback(async () => {
    try {
      setLoading(true);
      const readings = await getAllReadings();
      setReadings(readings);
    } catch (err) {
      setError(t('history.loadingHistory'));
      console.error('Error loading readings:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // Option 1: One-time fetch (current)
    loadReadings();
    
    // Option 2: Real-time listener (uncomment to enable)
    // const unsubscribe = getAllReadings((updatedReadings) => {
    //   setReadings(updatedReadings);
    //   setLoading(false);
    // });
    // return () => {
    //   if (unsubscribe) unsubscribe();
    // };
  }, [loadReadings]);

  const handleEdit = (reading) => {
    setSelectedReading(reading);
    setEditModalOpen(true);
  };

  const handleDelete = (reading) => {
    setSelectedReading(reading);
    setDeleteModalOpen(true);
  };

  const handleSaveEdit = async (id, payload) => {
    try {
      await updateReading(id, payload);
      await loadReadings(); // Refresh the list
      setEditModalOpen(false);
      setSelectedReading(null);
    } catch (err) {
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedReading) return;

    try {
      await deleteReading(selectedReading.id);
      await loadReadings(); // Refresh the list
      setDeleteModalOpen(false);
      setSelectedReading(null);
    } catch (err) {
      setError(t('history.deleteFailed'));
      console.error('Error deleting reading:', err);
      setDeleteModalOpen(false);
      setSelectedReading(null);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">{t('history.loadingHistory')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{t('history.title')}</h2>
        <p className="text-gray-600 mt-1">{t('history.subtitle')}</p>
      </div>

      {readings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">{t('history.noHistory')}</p>
          <p className="text-gray-400 text-sm mt-2">
            {t('history.startRecording')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.reading')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.tokenAmount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.tokenCost')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.notes')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('history.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTimeLocal(reading.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parseFloat(reading.reading_kwh).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.token_amount ? `${parseFloat(reading.token_amount).toFixed(2)} ${t('units.kwh')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.token_cost ? formatRupiah(reading.token_cost) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {reading.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(reading)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                          title={t('history.edit')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(reading)}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                          title={t('history.delete')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditReadingModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedReading(null);
        }}
        reading={selectedReading}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedReading(null);
        }}
        onConfirm={handleConfirmDelete}
        reading={selectedReading}
      />
    </div>
  );
};

export default History;

