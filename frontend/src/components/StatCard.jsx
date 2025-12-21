import React from 'react';

const StatCard = ({ title, value, unit = '', subtitle, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 mb-2 truncate">{title}</p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{value}</p>
            {unit && <span className="text-sm md:text-base text-gray-600 font-medium">{unit}</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`${colorClasses[color]} rounded-full p-2 md:p-3 flex-shrink-0 ml-2 shadow-md`}>
          <span className="text-lg md:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

