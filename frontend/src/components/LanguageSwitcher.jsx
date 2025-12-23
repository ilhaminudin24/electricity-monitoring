import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(newLang);
  };

  const isIndonesian = i18n.language === 'id';

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-white text-sm font-medium text-text-main group"
        aria-label="Toggle Language"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-gray-100">
          {isIndonesian ? (
            <span className="text-base" role="img" aria-label="Indonesian Flag">🇮🇩</span>
          ) : (
            <span className="text-base" role="img" aria-label="UK Flag">🇺🇸</span>
          )}
        </div>
        <span className="font-bold text-gray-700 group-hover:text-primary transition-colors">
          {isIndonesian ? 'ID' : 'EN'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {/* Simple Text Toggle or Icons */}
        {isIndonesian ? (
          <span className="text-lg" role="img" aria-label="Indonesian Flag">🇮🇩</span>
        ) : (
          <span className="text-lg" role="img" aria-label="UK Flag">🇺🇸</span>
        )}
      </div>
      <span className="text-sm font-semibold text-text-sub min-w-[20px] hidden sm:inline">
        {isIndonesian ? 'ID' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
