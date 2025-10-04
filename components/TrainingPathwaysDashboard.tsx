import React from 'react';
import { AgencyType } from '../types';
import { SparklesIcon, BookOpenIcon, BriefcaseIcon, UsersIcon, ComputerDesktopIcon, ScaleIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, LightBulbIcon, ChartBarSquareIcon } from './icons';

interface DashboardProps {
  agencyType: AgencyType;
  setAgencyType: (type: AgencyType) => void;
  agencyName: string;
  setAgencyName: (name: string) => void;
  onSelectCategory: (category: string) => void;
  onGeneratePlan: () => void;
  onShowAutomatedLndReport: () => void;
  onShowProjectionReport: () => void;
}

const AgencyFilter: React.FC<{
  agencyType: AgencyType;
  setAgencyType: (type: AgencyType) => void;
  agencyName: string;
  setAgencyName: (name: string) => void;
}> = ({ agencyType, setAgencyType, agencyName, setAgencyName }) => {
  const types: AgencyType[] = ["All Agencies", "National Agency", "National Department", "Provincial Administration", "Provincial Health Authority", "Local Level Government", "Other"];
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as AgencyType;
      setAgencyType(newType);
      if (newType === 'All Agencies') {
          setAgencyName('');
      }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
        <select
            id="agency-type-selector"
            value={agencyType}
            onChange={handleTypeChange}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md shadow-sm"
        >
            {types.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        {agencyType !== 'All Agencies' && (
             <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder={`Enter name of ${agencyType}...`}
                className="block w-full sm:w-64 pl-3 pr-3 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md shadow-sm animate-fade-in"
             />
        )}
    </div>
  );
};


const trainingCategories = [
    { name: "Core Public Service Competencies", icon: BookOpenIcon, color: "text-blue-500" },
    { name: "Technical & Functional Skills", icon: BriefcaseIcon, color: "text-teal-500" },
    { name: "Leadership & Management Development", icon: UsersIcon, color: "text-purple-500" },
    { name: "ICT & Digital Transformation", icon: ComputerDesktopIcon, color: "text-sky-500" },
    { name: "Public Policy & Governance", icon: ScaleIcon, color: "text-amber-500" },
    { name: "Soft Skills & Personal Effectiveness", icon: ChatBubbleLeftRightIcon, color: "text-indigo-500" },
    { name: "Cross-Cutting & Global Priorities", icon: GlobeAltIcon, color: "text-rose-500" }
];

const CategoryButton: React.FC<{
    category: { name: string, icon: React.ElementType, color: string },
    onClick: () => void
}> = ({ category, onClick }) => {
    const Icon = category.icon;
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
        >
            <Icon className={`w-12 h-12 mb-4 ${category.color} transition-colors duration-300`} />
            <span className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {category.name}
            </span>
        </button>
    );
};

export const TrainingPathwaysDashboard: React.FC<DashboardProps> = ({ agencyType, setAgencyType, agencyName, setAgencyName, onSelectCategory, onGeneratePlan, onShowAutomatedLndReport, onShowProjectionReport }) => {
    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 flex-1">
             <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                                Training Pathways Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Select a category to view tailored training pathways or generate a consolidated plan.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <AgencyFilter agencyType={agencyType} setAgencyType={setAgencyType} agencyName={agencyName} setAgencyName={setAgencyName} />
                             <div className="flex items-center gap-2">
                                <button
                                    onClick={onShowProjectionReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-colors text-sm"
                                >
                                    <ChartBarSquareIcon className="w-5 h-5" />
                                    <span>Competency Projection</span>
                                </button>
                                <button
                                    onClick={onShowAutomatedLndReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-colors text-sm"
                                >
                                    <LightBulbIcon className="w-5 h-5" />
                                    <span>Automated L&D Plans</span>
                                </button>
                                <button
                                    onClick={onGeneratePlan}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-colors text-sm"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Generate Consolidated Training Plan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {trainingCategories.map(category => (
                        <CategoryButton
                            key={category.name}
                            category={category}
                            onClick={() => onSelectCategory(category.name)}
                        />
                   ))}
                </div>
            </main>
        </div>
    );
};
