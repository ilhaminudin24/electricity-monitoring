import React from 'react';
import { useTranslation } from 'react-i18next';

const PasswordStrengthMeter = ({ password }) => {
    const { t } = useTranslation();

    const getStrength = (pwd) => {
        if (!pwd) return { level: 0, text: '', color: '' };

        let strength = 0;
        if (pwd.length >= 6) strength++;
        if (pwd.length >= 10) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

        if (strength <= 2) {
            return {
                level: 1,
                text: t('password_strength.weak'),
                color: 'bg-red-500',
                width: 'w-1/3'
            };
        } else if (strength <= 3) {
            return {
                level: 2,
                text: t('password_strength.medium'),
                color: 'bg-yellow-500',
                width: 'w-2/3'
            };
        } else {
            return {
                level: 3,
                text: t('password_strength.strong'),
                color: 'bg-green-500',
                width: 'w-full'
            };
        }
    };

    const strength = getStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">
                    {t('password_strength.label')}
                </span>
                <span className={`text-xs font-medium ${strength.level === 1 ? 'text-red-600' :
                    strength.level === 2 ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                    {strength.text}
                </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${strength.color} transition-all duration-300 ${strength.width}`}
                />
            </div>
        </div>
    );
};

export default PasswordStrengthMeter;
