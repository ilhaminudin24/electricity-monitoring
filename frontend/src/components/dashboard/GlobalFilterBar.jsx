import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

const GlobalFilterBar = ({ currentFilter, onFilterChange }) => {
    const { t } = useTranslation();
    const getButtonStyle = (range) => {
        const isActive = currentFilter === range;
        return `px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive
            ? 'bg-primary text-white shadow-md'
            : 'text-text-sub hover:bg-gray-100 dark:hover:bg-gray-800'
            }`;
    };

    const getLabel = (range) => {
        switch (range) {
            case 'day': return t('dashboard.today');
            case 'week': return t('dashboard.thisWeek');
            case 'month': return t('dashboard.thisMonth');
            default: return range;
        }
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-text-sub">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{t('dashboard.view')}:</span>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-full">
                {['day', 'week', 'month'].map(range => (
                    <button
                        key={range}
                        onClick={() => onFilterChange(range)}
                        className={getButtonStyle(range)}
                    >
                        {getLabel(range)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GlobalFilterBar;
