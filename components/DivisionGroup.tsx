import React, { useState } from 'react';
import { OfficerRecord } from '../types';
import { StaffCard } from './StaffCard';
import { ChevronDownIcon } from './icons';

interface DivisionGroupProps {
  divisionName: string;
  officers: OfficerRecord[];
  onViewSummary: (officer: OfficerRecord) => void;
  onSuggestTraining: (officer: OfficerRecord) => void;
  loadingSuggestionsFor: string | null;
}

export const DivisionGroup: React.FC<DivisionGroupProps> = ({ divisionName, officers, onViewSummary, onSuggestTraining, loadingSuggestionsFor }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => setIsOpen(!isOpen);

  const highUrgencyCount = officers.filter(o => o.urgency === 'High').length;

  return (
    <div className="bg-gray-50 dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 mb-6 overflow-hidden">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center p-4 bg-white dark:bg-blue-900 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center flex-wrap">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mr-4">{divisionName}</h2>
            <span className="mr-2 mt-1 sm:mt-0 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-blue-800 rounded-full">
                {officers.length} officer{officers.length !== 1 && 's'}
            </span>
            {highUrgencyCount > 0 && (
                 <span className="mt-1 sm:mt-0 px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-full">
                    {highUrgencyCount} high urgency
                </span>
            )}
        </div>
        <ChevronDownIcon
          className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[20000px]' : 'max-h-0'}`}
        style={{ transitionProperty: 'max-height, padding' }}
      >
        <div className="p-4">
          {officers.map(officer => (
            <StaffCard 
              key={officer.email} 
              officer={officer} 
              onViewSummary={onViewSummary}
              onSuggestTraining={onSuggestTraining}
              isLoadingSuggestions={loadingSuggestionsFor === officer.email}
            />
          ))}
        </div>
      </div>
    </div>
  );
};