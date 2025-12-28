import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getAllReadings, getUserSettings, getReadingsAfterDate } from '../services/supabaseService';
import { formatDateTimeLocal } from '../utils/date';
import { formatRupiah } from '../utils/rupiah';
import {
  Search,
  Plus,
  ChevronDown,
  Image as ImageIcon,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Download
} from 'lucide-react';
import { downloadCSV } from '../utils/exportUtils';
import EditReadingModal from '../components/EditReadingModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import RecalculationHistoryPanel from '../components/RecalculationHistoryPanel';
import RecalculationTimelineModal from '../components/RecalculationTimelineModal';
import { useNavigate } from 'react-router-dom';
import {
  addEvent,
  updateEvent,
  deleteEvent,
  performCascadingRecalculation,
  EVENT_TYPES,
  TRIGGER_TYPES
} from '../services/eventService';

const History = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tariff, setTariff] = useState(1444.70); // Default fallback

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('12m'); // '12m', '30d', 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'topup', 'reading'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);

  // Recalculation State (same as InputForm)
  const [showRecalculationModal, setShowRecalculationModal] = useState(false);
  const [affectedReadings, setAffectedReadings] = useState([]);
  const [kwhOffset, setKwhOffset] = useState(0);
  const [validationIssues, setValidationIssues] = useState([]);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [recalculationBackdateDate, setRecalculationBackdateDate] = useState(null);
  const [recalculationTokenCost, setRecalculationTokenCost] = useState(0);
  const [recalculationLoading, setRecalculationLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // Fetch settings for tariff
      const settings = await getUserSettings(currentUser.id);
      if (settings?.tariffPerKwh) {
        setTariff(settings.tariffPerKwh);
      }

      // Fetch last 1000 readings
      const data = await getAllReadings(currentUser.id, 1000);
      setReadings(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate consumption for each reading by comparing with previous reading
  const readingsWithConsumption = useMemo(() => {
    if (readings.length === 0) return [];

    // Sort by date descending (newest first) - this is how it comes from API
    const sorted = [...readings].sort((a, b) => new Date(b.date) - new Date(a.date));

    return sorted.map((reading, index) => {
      const nextReading = sorted[index + 1]; // Previous in time (older)
      const isTopUp = reading.token_cost && reading.token_cost > 0;

      let consumption = 0;
      let consumptionDisplay = '';

      if (isTopUp) {
        // For Top Up: Show the kWh added (token_amount or calculate from difference)
        if (reading.token_amount) {
          consumption = reading.token_amount;
        } else if (nextReading) {
          // Estimate: current meter - previous meter (should be positive for top-up)
          consumption = reading.kwh_value - nextReading.kwh_value;
        }
        consumptionDisplay = consumption > 0 ? `+${consumption.toFixed(1)}` : '—';
      } else {
        // For Regular Reading: previous meter - current meter = consumption
        if (nextReading) {
          consumption = nextReading.kwh_value - reading.kwh_value;
          // If negative, it means meter went up (shouldn't happen for regular reading)
          if (consumption < 0) consumption = 0;
        }
        consumptionDisplay = consumption > 0 ? consumption.toFixed(1) : '—';
      }

      // Calculate cost
      let cost = 0;
      if (isTopUp) {
        cost = reading.token_cost; // Show the actual token cost paid
      } else {
        cost = consumption * tariff; // consumption × tariff
      }

      return {
        ...reading,
        isTopUp,
        consumption,
        consumptionDisplay,
        calculatedCost: cost
      };
    });
  }, [readings, tariff]);

  // Filtering Logic
  const filteredReadings = useMemo(() => {
    let result = [...readingsWithConsumption];

    // 1. Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.notes && r.notes.toLowerCase().includes(lowerQuery)) ||
        r.kwh_value.toString().includes(lowerQuery) ||
        formatDateTimeLocal(r.date).toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Date Range
    const now = new Date();
    if (dateRange === '30d') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      result = result.filter(r => new Date(r.date) >= thirtyDaysAgo);
    } else if (dateRange === '12m') {
      const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
      result = result.filter(r => new Date(r.date) >= twelveMonthsAgo);
    }

    // 3. Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(r => {
        return typeFilter === 'topup' ? r.isTopUp : !r.isTopUp;
      });
    }

    return result;
  }, [readingsWithConsumption, searchQuery, dateRange, typeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReadings.length / pageSize);
  const paginatedReadings = filteredReadings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, typeFilter, pageSize]);

  // Handlers
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
      console.log('📝 handleSaveEdit called with:', { id, payload });
      
      // Use event sourcing - void old event and create new one
      // Note: EditReadingModal sends 'kwh' not 'kwh_value'
      const result = await updateEvent(currentUser.id, id, {
        kwhAmount: payload.kwh || payload.reading_kwh || payload.kwh_value,
        tokenCost: payload.token_cost,
        notes: payload.notes,
        eventDate: payload.date
      }, 'User edited from history');

      // Check if recalculation is needed
      if (result.requiresRecalculation && result.affectedCount > 0) {
        await performCascadingRecalculation(
          currentUser.id,
          result.newEvent.id,
          TRIGGER_TYPES.EDIT_TOPUP,
          result.affectedEvents,
          0 // Positions recalculated from events
        );
      }

      // Small delay to allow materialized view to refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      await loadData();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating reading:', error);
      // TODO: Show error toast
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedReading) {
      try {
        console.log('🗑️ Starting delete process for reading:', selectedReading);

        // Use event sourcing - soft delete via voiding
        const result = await deleteEvent(currentUser.id, selectedReading.id, 'User deleted from history');
        console.log('✅ deleteEvent returned:', result);

        // Small delay to allow materialized view to refresh
        // The trigger should auto-refresh, but we add a small delay to ensure it completes
        console.log('⏳ Waiting 500ms for materialized view refresh...');
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🔄 Reloading data...');
        await loadData();
        console.log('✅ Data reloaded');

        setDeleteModalOpen(false);
        console.log('✅ Delete process complete');
      } catch (error) {
        console.error('❌ Error deleting reading:', error);
        // TODO: Show error toast
      }
    }
  };

  const viewImage = (url) => {
    if (url) window.open(url, '_blank');
  };

  const handleExport = () => {
    if (!filteredReadings.length) return;

    // Prepare data for export
    const exportData = filteredReadings.map(r => ({
      date: formatDateTimeLocal(r.date),
      type: r.isTopUp ? 'Top Up' : 'Reading',
      meter_reading_kwh: r.kwh_value,
      consumption_kwh: r.consumptionDisplay === '—' ? 0 : r.consumption,
      token_cost_idr: r.token_cost || 0,
      calculated_cost_idr: r.calculatedCost || 0,
      notes: r.notes || ''
    }));

    const headers = [
      { key: 'date', label: 'Date/Time' },
      { key: 'type', label: 'Type' },
      { key: 'meter_reading_kwh', label: 'Meter Reading (kWh)' },
      { key: 'consumption_kwh', label: 'Consumption/Token (kWh)' },
      { key: 'token_cost_idr', label: 'Token Cost (IDR)' },
      { key: 'calculated_cost_idr', label: 'Est. Cost (IDR)' },
      { key: 'notes', label: 'Notes' }
    ];

    const filename = `electricity_readings_${new Date().toISOString().split('T')[0]}`;
    downloadCSV(exportData, filename, headers);
  };

  // Handle recalculation needed callback from EditReadingModal
  const handleRecalculationNeeded = (data) => {
    setEditingId(data.readingId);
    setPendingEditPayload(data.payload);
    setAffectedReadings(data.affectedReadings);
    setKwhOffset(data.kwhOffset);
    setValidationIssues(data.validationIssues);
    setRecalculationBackdateDate(data.backdateDate);
    setRecalculationTokenCost(data.tokenCost);
    setEditModalOpen(false); // Close edit modal
    setShowRecalculationModal(true); // Open recalculation modal
  };

  // Handle recalculation confirmation - simplified for event sourcing
  const handleRecalculationConfirm = async () => {
    try {
      setRecalculationLoading(true);

      // Use event sourcing - update the event
      const result = await updateEvent(currentUser.id, editingId, {
        kwhAmount: kwhOffset,
        tokenCost: recalculationTokenCost,
        notes: pendingEditPayload.notes,
        eventDate: pendingEditPayload.date
      }, 'User edited with backdate recalculation');

      // Perform cascading recalculation if needed
      if (result.requiresRecalculation && result.affectedCount > 0) {
        await performCascadingRecalculation(
          currentUser.id,
          result.newEvent.id,
          TRIGGER_TYPES.BACKDATE_TOPUP,
          result.affectedEvents,
          kwhOffset
        );
      }

      // Materialized view auto-refreshes - no manual updates needed!

      // Reload data and cleanup
      await loadData();
      setShowRecalculationModal(false);
      setAffectedReadings([]);
      setKwhOffset(0);
      setValidationIssues([]);
      setPendingEditPayload(null);
      setEditingId(null);
      setRecalculationBackdateDate(null);
      setRecalculationTokenCost(0);
      setSelectedReading(null);

    } catch (err) {
      console.error('Recalculation error:', err);
      // TODO: Show error toast
    } finally {
      setRecalculationLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Breadcrumbs */}
      <nav className="hidden md:flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>{t('nav.dashboard')}</span>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 dark:text-white">{t('history.title')}</span>
      </nav>

      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900 dark:text-white">{t('history.title', 'Reading History')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            {t('history.subtitle', 'Past readings and consumption data')}
          </p>
        </div>
        <button
          onClick={() => navigate('/input')}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t('history.addReading', 'Add New Reading')}</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-white dark:bg-[#151f2e] p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border-none bg-gray-50 dark:bg-white/5 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
            placeholder={t('history.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={filteredReadings.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered data to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Date Range */}
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 dark:bg-white/5 border-none text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg py-2.5 pl-4 pr-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 focus:ring-2 focus:ring-primary/50"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="12m">{t('history.last12Months')}</option>
              <option value="30d">{t('history.last30Days')}</option>
              <option value="all">{t('history.allTime')}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 dark:bg-white/5 border-none text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg py-2.5 pl-4 pr-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 focus:ring-2 focus:ring-primary/50"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">{t('history.allTypes')}</option>
              <option value="topup">⚡ {t('history.topUp')}</option>
              <option value="reading">📊 {t('history.reading')}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Recalculation History Panel (24-hour Undo) */}
      <RecalculationHistoryPanel className="animate-fadeIn" />

      {/* Data Table Card */}
      <div className="bg-white dark:bg-[#151f2e] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('history.date')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('history.type')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden lg:table-cell">{t('history.meter')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('history.consumption')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('history.cost')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center hidden sm:table-cell">{t('history.proof')}</th>
                <th className="py-5 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">{t('history.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    {t('history.loadingHistory')}
                  </td>
                </tr>
              ) : paginatedReadings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>{t('history.noReadingsFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReadings.map((reading) => {
                  const dateObj = new Date(reading.date || reading.created_at);

                  return (
                    <tr
                      key={reading.id}
                      className={`hover:bg-primary/5 transition-colors group ${reading.isTopUp ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''}`}
                    >
                      {/* Date */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        {reading.isTopUp ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Zap className="w-3 h-3" />
                            {t('history.topUp')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Activity className="w-3 h-3" />
                            {t('history.reading')}
                          </span>
                        )}
                      </td>

                      {/* Meter Reading - Hidden on mobile */}
                      <td className="py-5 px-6 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {reading.kwh_value} kWh
                        </span>
                      </td>

                      {/* Consumption */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        <span className={`text-sm font-bold tabular-nums ${reading.isTopUp
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                          }`}>
                          {reading.consumptionDisplay} {reading.consumptionDisplay !== '—' && 'kWh'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-5 px-6 whitespace-nowrap">
                        <span className={`text-sm font-medium tabular-nums ${reading.isTopUp
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-gray-600 dark:text-gray-300'
                          }`}>
                          {reading.calculatedCost > 0 ? formatRupiah(reading.calculatedCost) : '—'}
                        </span>
                      </td>

                      {/* Proof - Hidden on mobile */}
                      <td className="py-5 px-6 whitespace-nowrap text-center hidden sm:table-cell">
                        {reading.meter_photo_url ? (
                          <button
                            onClick={() => viewImage(reading.meter_photo_url)}
                            className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"
                            title="View Proof"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        ) : (
                          <div className="text-gray-300 dark:text-gray-700 inline-block p-2">
                            <ImageOff className="w-5 h-5 opacity-50" />
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <button
                            onClick={() => handleEdit(reading)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                            title={t('history.edit', 'Edit')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(reading)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title={t('history.delete', 'Delete')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredReadings.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('history.rowsPerPage')}:</span>
              <select
                className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 font-medium focus:ring-0 cursor-pointer pr-8"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredReadings.length)} of {filteredReadings.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditReadingModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedReading(null);
        }}
        reading={selectedReading}
        onSave={handleSaveEdit}
        onRecalculationNeeded={handleRecalculationNeeded}
      />

      {/* Recalculation Timeline Modal (same as InputForm) */}
      <RecalculationTimelineModal
        isOpen={showRecalculationModal}
        onClose={() => {
          setShowRecalculationModal(false);
          setAffectedReadings([]);
          setKwhOffset(0);
          setValidationIssues([]);
          setPendingEditPayload(null);
          setEditingId(null);
          setRecalculationBackdateDate(null);
          setRecalculationTokenCost(0);
        }}
        onConfirm={handleRecalculationConfirm}
        backdateDate={recalculationBackdateDate}
        affectedEvents={affectedReadings}
        newTopupKwh={kwhOffset}
        tokenCost={recalculationTokenCost}
        loading={recalculationLoading}
        validationIssues={validationIssues}
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
