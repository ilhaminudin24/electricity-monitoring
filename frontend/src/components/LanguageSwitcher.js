import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    // No page refresh needed - i18n will trigger re-render
  };

  const currentLang = i18n.language || 'id';

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => changeLanguage('id')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'id'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        title="Bahasa Indonesia"
      >
        <span className="hidden sm:inline">🇮🇩 ID</span>
        <span className="sm:hidden">🇮🇩</span>
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
        title="English"
      >
        <span className="hidden sm:inline">🇺🇸 EN</span>
        <span className="sm:hidden">🇺🇸</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
