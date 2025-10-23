import React from 'react';
import { MetricCardProps } from '../types';

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, bgColor, valueColor }) => {
  // Simple mapping for dark mode icon backgrounds. Could be more sophisticated.
  const darkBgColor = bgColor.replace('-100', '-900/50');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex items-center space-x-4 space-x-reverse">
      <div className={`p-3 rounded-full ${bgColor} ${valueColor} ${darkBgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-xl font-semibold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;