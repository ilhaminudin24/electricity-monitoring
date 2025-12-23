import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { AlertTriangle, X, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * Modal shown when user backdates a top-up and there are readings after that date
 * that need to be recalculated (add offset to their kWh values).
 */
const BackdateRecalculationModal = ({
    isOpen,
    onClose,
    onConfirm,
    backdateDate,
    affectedReadings = [],
    kwhOffset = 0,
    loading = false
}) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'id' ? idLocale : enUS;

    if (!isOpen || affectedReadings.length === 0) return null;

    // Format the backdate for display
    const formattedBackdate = backdateDate
        ? format(new Date(backdateDate), 'dd MMMM yyyy', { locale })
        : '';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header - Warning Style */}
                <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-5 border-b border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-800/40 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300">
                                {t('backdateRecalculation.title', 'Penyesuaian Data Diperlukan')}
                            </h3>
                            <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-1">
                                {t('backdateRecalculation.message', { date: formattedBackdate, defaultValue: `Anda menambahkan isi ulang untuk tanggal ${formattedBackdate}` })}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/30 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {t('backdateRecalculation.affectedReadings', { count: affectedReadings.length, defaultValue: `Ada ${affectedReadings.length} pembacaan setelah tanggal ini yang perlu disesuaikan:` })}
                    </p>

                    {/* Preview Table */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                                        {t('backdateRecalculation.tableHeaders.date', 'Tanggal')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">
                                        {t('backdateRecalculation.tableHeaders.current', 'Sekarang')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-400">
                                        {t('backdateRecalculation.tableHeaders.new', 'Menjadi')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {affectedReadings.slice(0, 5).map((reading, index) => {
                                    const currentKwh = reading.kwh_value || 0;
                                    const newKwh = currentKwh + kwhOffset;
                                    const readingDate = format(
                                        new Date(reading.date),
                                        'dd MMM yyyy',
                                        { locale }
                                    );

                                    return (
                                        <tr
                                            key={reading.id || index}
                                            className="border-t border-gray-200 dark:border-gray-700"
                                        >
                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                                {readingDate}
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">
                                                {currentKwh.toFixed(1)} kWh
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <span className="text-green-600 dark:text-green-400 font-medium">
                                                    {newKwh.toFixed(1)} kWh
                                                </span>
                                                <span className="text-xs text-green-500 ml-1">
                                                    (+{kwhOffset.toFixed(1)})
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {affectedReadings.length > 5 && (
                                    <tr className="border-t border-gray-200 dark:border-gray-700">
                                        <td colSpan={3} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400 italic">
                                            ...dan {affectedReadings.length - 5} pembacaan lainnya
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Note */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            <RefreshCw className="w-3 h-3 inline mr-1" />
                            {t('backdateRecalculation.consumptionNote', 'Konsumsi harian Anda tetap sama.')}
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {t('backdateRecalculation.cancel', 'Batal')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {t('backdateRecalculation.confirmUpdate', 'Simpan & Update Semua')}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BackdateRecalculationModal;
