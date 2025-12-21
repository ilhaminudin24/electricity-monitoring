
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const AlertBox = ({ dailyUsage = [] }) => {
    const { t } = useTranslation();
    if (!dailyUsage || dailyUsage.length < 2) return null;

    // Calculate average of previous days (excluding yesterday)
    // Assumes dailyUsage is sorted new to old or old to new?
    // Let's rely on standard logic: find yesterday's entry.

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    // Find yesterday's usage
    const yesterdayEntry = dailyUsage.find(d => {
        // d.date might be string or Date object
        const dDate = typeof d.date === 'string' ? d.date.split('T')[0] : format(d.date, 'yyyy-MM-dd');
        return dDate === yesterdayStr;
    });

    if (!yesterdayEntry) return null;

    const yesterdayUsage = yesterdayEntry.usage_kwh;
    const otherDaysJson = dailyUsage.filter(d => d !== yesterdayEntry);

    if (otherDaysJson.length === 0) return null;

    const totalOther = otherDaysJson.reduce((acc, curr) => acc + curr.usage_kwh, 0);
    const avgOther = totalOther / otherDaysJson.length;

    // Spike detection threshold: 50% higher than average
    const threshold = 1.5;
    const isSpike = yesterdayUsage > (avgOther * threshold) && yesterdayUsage > 1; // Minimum 1 kWh to avoid noise

    if (!isSpike) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-red-900/20 flex items-center justify-center shrink-0 text-red-500 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">{t('dashboard.abnormalSpikeDetected')}</h4>
                <p className="text-red-600/80 dark:text-red-400/70 text-xs mt-1 leading-snug">
                    {t('dashboard.spikeMessage', { usage: yesterdayUsage.toFixed(1), percent: Math.round(((yesterdayUsage / avgOther) - 1) * 100) })}
                </p>
            </div>
        </div>
    );
};

export default AlertBox;
