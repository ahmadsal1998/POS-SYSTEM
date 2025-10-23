import React from 'react';
import { QuickActionProps } from '../types';

const QuickActionCard: React.FC<QuickActionProps> = ({ title, icon, colorClass, path }) => {
  // Add dark mode variants for gray buttons
  const adaptedColorClass = colorClass.includes('bg-gray-200')
    ? `${colorClass} dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200`
    : colorClass;
    
  return (
    <button
      onClick={() => console.log(`Navigating to ${path}`)} // Placeholder for actual navigation
      className={`flex items-center justify-center p-4 rounded-lg shadow-sm text-center transition-all duration-200
        ${adaptedColorClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      <div className="flex flex-col items-center">
        <div className="mb-2">{icon}</div>
        <span className="font-medium text-sm">{title}</span>
      </div>
    </button>
  );
};

export default QuickActionCard;