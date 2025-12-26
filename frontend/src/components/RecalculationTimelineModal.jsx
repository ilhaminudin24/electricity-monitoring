import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import {
    AlertTriangle,
    X,
    ArrowRight,
    Zap,
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Undo2
} from 'lucide-react';

/**
 * Enhanced modal with visual timeline for backdate recalculation
 * Shows before/after states and provides clear feedback on impact
 */
const RecalculationTimelineModal = ({
    isOpen,
    onClose,
    onConfirm,
    backdateDate,
    affectedEvents = [],
    newTopupKwh = 0,
    tokenCost = 0,
    loading = false,
    validationIssues = []
}) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'id' ? idLocale : enUS;

    if (!isOpen) return null;

    // Separate topups from meter readings
    const topups = affectedEvents.filter(e => e.is_topup || e.event_type === 'TOPUP');
    const readings = affectedEvents.filter(e => !e.is_topup && e.event_type !== 'TOPUP');

    const hasBlockingIssues = validationIssues.some(i => i.severity === 'BLOCK');

    // Format date for display
    const formattedBackdate = backdateDate
        ? format(new Date(backdateDate), 'dd MMMM yyyy', { locale })
        : '';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">

                {/* Header */}
                <div className={`px-6 py-5 border-b ${hasBlockingIssues
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-xl ${hasBlockingIssues
                            ? 'bg-red-100 dark:bg-red-800/40'
                            : 'bg-amber-100 dark:bg-amber-800/40'
                            }`}>
                            {hasBlockingIssues
                                ? <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                : <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            }
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-bold ${hasBlockingIssues
                                ? 'text-red-800 dark:text-red-300'
                                : 'text-amber-800 dark:text-amber-300'
                                }`}>
                                {hasBlockingIssues
                                    ? t('recalculation.blocked', 'Operasi Tidak Dapat Dilakukan')
                                    : t('recalculation.title', 'Penyesuaian Data Diperlukan')
                                }
                            </h3>
                            <p className={`text-sm mt-1 ${hasBlockingIssues
                                ? 'text-red-700/80 dark:text-red-400/70'
                                : 'text-amber-700/80 dark:text-amber-400/70'
                                }`}>
                                {t('recalculation.backdateTo', { date: formattedBackdate })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1 rounded-lg transition-colors ${hasBlockingIssues
                                ? 'hover:bg-red-200/50 dark:hover:bg-red-800/30'
                                : 'hover:bg-amber-200/50 dark:hover:bg-amber-800/30'
                                }`}
                        >
                            <X className={`w-5 h-5 ${hasBlockingIssues
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                                }`} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Validation Errors */}
                    {hasBlockingIssues && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {t('recalculation.validationError', 'Data akan menjadi tidak valid')}
                            </h4>
                            <ul className="space-y-1">
                                {validationIssues.filter(i => i.severity === 'BLOCK').map((issue, idx) => (
                                    <li key={idx} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {issue.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* New Top-up Summary */}
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-800/40 rounded-lg">
                                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                    {t('recalculation.newTopup', 'Top-up Baru')}
                                </p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                                    +{newTopupKwh.toFixed(2)} kWh
                                    {tokenCost > 0 && (
                                        <span className="text-sm font-normal text-green-600 dark:text-green-500 ml-2">
                                            (Rp {tokenCost.toLocaleString('id-ID')})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('recalculation.affectedReadings', 'Catatan Terpengaruh')}
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {affectedEvents.length}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('recalculation.topupsAffected', 'Top-up Lain Terpengaruh')}
                            </p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {topups.length}
                            </p>
                        </div>
                    </div>

                    {/* Timeline Visualization */}
                    {!hasBlockingIssues && affectedEvents.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                {t('recalculation.timeline', 'Perubahan Posisi Meter')}
                            </h4>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                                                {t('recalculation.date', 'Tanggal')}
                                            </th>
                                            <th className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">
                                                {t('recalculation.type', 'Tipe')}
                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">
                                                {t('recalculation.before', 'Sebelum')}
                                            </th>
                                            <th className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">

                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">
                                                {t('recalculation.after', 'Sesudah')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {affectedEvents.slice(0, 8).map((event, index) => {
                                            const isTopup = event.is_topup || event.event_type === 'TOPUP';
                                            const currentKwh = event.calculated_position || event.current_kwh || 0;
                                            const newKwh = currentKwh + newTopupKwh;
                                            const eventDate = format(
                                                new Date(event.event_date),
                                                'dd MMM yyyy',
                                                { locale }
                                            );

                                            return (
                                                <tr
                                                    key={event.id || index}
                                                    className="border-t border-gray-200 dark:border-gray-700"
                                                >
                                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                        {eventDate}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {isTopup ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                                                                <Zap className="w-3 h-3" />
                                                                Top-up
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                                                <Activity className="w-3 h-3" />
                                                                Reading
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">
                                                        {currentKwh.toFixed(1)} kWh
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                            {newKwh.toFixed(1)} kWh
                                                        </span>
                                                        <span className="text-xs text-green-500 ml-1">
                                                            (+{newTopupKwh.toFixed(1)})
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {affectedEvents.length > 8 && (
                                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                                <td colSpan={5} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400 italic">
                                                    ...dan {affectedEvents.length - 8} catatan lainnya
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Info Notes */}
                    {!hasBlockingIssues && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>{t('recalculation.consumptionUnchanged', 'Konsumsi harian Anda tetap sama')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>{t('recalculation.undoAvailable', 'Perubahan dapat dibatalkan dalam 24 jam')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
                    >
                        {t('recalculation.cancel', 'Batal')}
                    </button>

                    {!hasBlockingIssues && (
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {t('recalculation.confirm', 'Lanjutkan & Update Semua')}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default RecalculationTimelineModal;
