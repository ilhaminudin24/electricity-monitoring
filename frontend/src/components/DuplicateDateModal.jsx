import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

/**
 * Modal shown when user tries to input a reading for a date that already has one.
 * Offers two options: Edit Existing or Replace With New.
 */
const DuplicateDateModal = ({
    isOpen,
    onClose,
    existingReading,
    onEditExisting,
    onReplace
}) => {
    const { t } = useTranslation();

    if (!isOpen || !existingReading) return null;

    // Format the date and time for display
    const readingDate = new Date(existingReading.date || existingReading.created_at);
    // Adjust for timezone if needed, but existingReading.date from Supabase is YYYY-MM-DD usually.
    // If it's a full ISO string, new Date() works.
    const formattedDate = format(readingDate, 'MMM d, yyyy');

    // For time, we might still want created_at if date is just a date string
    const timeDate = existingReading.created_at ? new Date(existingReading.created_at) : readingDate;
    const formattedTime = format(timeDate, 'h:mm a');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-b border-amber-100 dark:border-amber-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('input.duplicateDate.title', 'Reading Already Exists')}
                            </h2>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                {t('input.duplicateDate.message', 'You already have a reading for {{date}}', { date: formattedDate })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Existing reading info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm font-medium">
                                {t('input.duplicateDate.existingValue', 'Current meter reading: {{kwh}} kWh', {
                                    kwh: existingReading.kwh_value?.toFixed(1) || '0'
                                })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">
                                {t('input.duplicateDate.recordedAt', 'Recorded at: {{time}}', { time: formattedTime })}
                            </span>
                        </div>
                        {existingReading.token_cost && existingReading.token_cost > 0 && (
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mt-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">
                                    Top Up: Rp {existingReading.token_cost.toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Question */}
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                        {t('input.duplicateDate.whatToDo', 'What would you like to do?')}
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Edit Existing */}
                        <button
                            onClick={onEditExisting}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {t('input.duplicateDate.editExisting', 'Edit Existing')}
                            </span>
                        </button>

                        {/* Replace */}
                        <button
                            onClick={onReplace}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                {t('input.duplicateDate.replaceWithNew', 'Replace With New')}
                            </span>
                        </button>
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                    >
                        {t('input.duplicateDate.cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateDateModal;
