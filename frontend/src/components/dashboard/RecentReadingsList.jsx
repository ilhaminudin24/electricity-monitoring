
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Zap, FileText, ClipboardList } from 'lucide-react';

const RecentReadingsList = ({ readings = [] }) => {
    const { t } = useTranslation();

    // Take top 3 readings
    const recentReadings = readings.slice(0, 3);

    if (recentReadings.length === 0) {
        return (
            <div className="flex-1 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6 flex items-center justify-center">
                <p className="text-text-sub">{t('dashboard.noRecentReadings')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-white dark:bg-background-dark rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
                {t('dashboard.recentHistory')}
            </h3>
            <div className="flex flex-col gap-1">
                {recentReadings.map((reading, index) => {
                    const dateObj = new Date(reading.date || reading.created_at);
                    const timeStr = format(dateObj, 'HH:mm');
                    const dateStr = format(dateObj, 'dd MMM');

                    // Icon logic: if notes contain keywords, maybe change icon? 
                    // For now, alternate valid icons or just use Zap
                    return (
                        <div key={reading.id || index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                    {reading.notes ? <FileText className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-main dark:text-gray-200">
                                        {reading.notes || t('dashboard.meterReading')}
                                    </p>
                                    <p className="text-xs text-text-sub">
                                        {dateStr} • {timeStr}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-text-main dark:text-gray-200">
                                    {reading.kwh_value || reading.usage_kwh} kWh
                                </p>
                                <p className="text-xs text-text-sub">{t('dashboard.recorded')}</p>
                            </div>
                        </div>
                    )
                })}

                <Link to="/history">
                    <button className="w-full mt-2 py-3 text-sm text-primary font-bold hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2 group">
                        {t('dashboard.viewFullHistory')}
                        <ClipboardList className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default RecentReadingsList;
