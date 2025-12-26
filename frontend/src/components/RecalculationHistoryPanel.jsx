import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import {
    Clock,
    Undo2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle,
    History
} from 'lucide-react';
import { getPendingRollbacks, rollbackRecalculation } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Panel showing recent recalculation batches with undo option
 * Displays in History page or Settings sidebar
 */
const RecalculationHistoryPanel = ({ className = '' }) => {
    const { t, i18n } = useTranslation();
    const { currentUser } = useAuth();
    const locale = i18n.language === 'id' ? idLocale : enUS;

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [rollingBack, setRollingBack] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch pending rollbacks
    useEffect(() => {
        const fetchBatches = async () => {
            if (!currentUser) return;

            setLoading(true);
            try {
                const data = await getPendingRollbacks(currentUser.id);
                setBatches(data);
            } catch (err) {
                console.error('Error fetching rollback batches:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, [currentUser]);

    const handleRollback = async (batchId) => {
        if (!currentUser) return;

        const reason = prompt(t('recalculation.rollbackReason', 'Alasan pembatalan (opsional):'));

        setRollingBack(batchId);
        setError(null);
        setSuccess(null);

        try {
            await rollbackRecalculation(batchId, reason || 'User requested rollback', currentUser.id);
            setBatches(prev => prev.filter(b => b.id !== batchId));
            setSuccess(t('recalculation.rollbackSuccess', 'Perubahan berhasil dibatalkan'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || t('recalculation.rollbackFailed', 'Gagal membatalkan perubahan'));
        } finally {
            setRollingBack(null);
        }
    };

    const getTimeRemaining = (canRollbackUntil) => {
        const until = new Date(canRollbackUntil);
        const now = new Date();

        if (until <= now) return null;

        return formatDistanceToNow(until, {
            locale,
            addSuffix: false
        });
    };

    const getTriggerLabel = (triggerType) => {
        switch (triggerType) {
            case 'BACKDATE_TOPUP':
                return t('recalculation.triggerBackdate', 'Top-up Backdate');
            case 'EDIT_TOPUP':
                return t('recalculation.triggerEdit', 'Edit Top-up');
            case 'DELETE_TOPUP':
                return t('recalculation.triggerDelete', 'Hapus Top-up');
            case 'MANUAL_CORRECTION':
                return t('recalculation.triggerManual', 'Koreksi Manual');
            default:
                return triggerType;
        }
    };

    if (loading) {
        return (
            <div className={`p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
                <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    <span className="text-sm">{t('common.loading', 'Memuat...')}</span>
                </div>
            </div>
        );
    }

    if (batches.length === 0) {
        return null; // Don't show if no pending rollbacks
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                        {t('recalculation.pendingRollbacks', 'Perubahan yang Dapat Dibatalkan')}
                    </h3>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        {success}
                    </div>
                </div>
            )}
            {error && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            {/* Batches List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {batches.map((batch) => {
                    const isExpanded = expandedBatch === batch.id;
                    const timeRemaining = getTimeRemaining(batch.can_rollback_until);
                    const affectedEvents = batch.affected_events || [];

                    return (
                        <div key={batch.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {getTriggerLabel(batch.trigger_type)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                            {batch.events_count} {t('recalculation.records', 'catatan')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(batch.created_at), 'dd MMM yyyy, HH:mm', { locale })}
                                        {timeRemaining && (
                                            <span className="text-amber-600 dark:text-amber-400">
                                                • Sisa {timeRemaining}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRollback(batch.id)}
                                        disabled={rollingBack === batch.id}
                                        className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {rollingBack === batch.id ? (
                                            <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                        ) : (
                                            <Undo2 className="w-3 h-3" />
                                        )}
                                        {t('recalculation.undo', 'Batalkan')}
                                    </button>

                                    <button
                                        onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && affectedEvents.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                        {t('recalculation.affectedDetails', 'Detail Perubahan')}
                                    </p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {affectedEvents.slice(0, 5).map((e, idx) => (
                                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                <span>
                                                    {format(new Date(e.event_date), 'dd MMM', { locale })}
                                                    <span className="text-gray-400 dark:text-gray-500 ml-1">
                                                        ({e.event_type})
                                                    </span>
                                                </span>
                                                <span>
                                                    {e.old_kwh?.toFixed(1)} → {e.new_kwh?.toFixed(1)} kWh
                                                </span>
                                            </div>
                                        ))}
                                        {affectedEvents.length > 5 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
                                                ...dan {affectedEvents.length - 5} lainnya
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecalculationHistoryPanel;
