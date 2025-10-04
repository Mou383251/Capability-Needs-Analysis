import React, { useState } from 'react';
import { CnaOverview } from './cna/CnaOverview';
import { CnaProcessGuide } from './cna/CnaProcessGuide';
import { CnaQuestionnaire } from './cna/CnaQuestionnaire';
import { CnaAnalysisGuide } from './cna/CnaAnalysisGuide';
import { CnaLndPlanning } from './cna/CnaLndPlanning';
import { CnaResources } from './cna/CnaResources';

type CnaTab = 'overview' | 'process' | 'questionnaire' | 'analysis' | 'planning' | 'resources';

const TABS: { id: CnaTab; label: string }[] = [
    { id: 'overview', label: 'CNA Overview' },
    { id: 'process', label: 'Process Guide' },
    { id: 'questionnaire', label: 'Questionnaire' },
    { id: 'analysis', label: 'Analysis Guide' },
    { id: 'planning', label: 'L&D Planning' },
    { id: 'resources', label: 'Resources' },
];

export const CnaPolicyToolkit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CnaTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <CnaOverview />;
            case 'process': return <CnaProcessGuide />;
            case 'questionnaire': return <CnaQuestionnaire />;
            case 'analysis': return <CnaAnalysisGuide />;
            case 'planning': return <CnaLndPlanning />;
            case 'resources': return <CnaResources />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-blue-950/50 flex-1 flex flex-col">
            <header className="bg-white dark:bg-blue-900 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-blue-800">
                <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                        Capability Needs Analysis (CNA) Toolkit
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        A guide to conducting effective CNAs and translating data into strategic L&D plans.
                    </p>
                </div>
                <nav className="px-4 sm:px-6 lg:px-8 -mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-blue-700'
                            }`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>
            <main className="flex-1 p-6">
                <div className="animate-fade-in">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
