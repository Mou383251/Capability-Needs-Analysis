import React, { useState } from 'react';
import { GesiAnimatedBanner } from './gesi/GesiAnimatedBanner';
import { GesiOverview } from './gesi/GesiOverview';
import { GesiPolicyNavigator } from './gesi/GesiPolicyNavigator';
import { GesiTrainingToolkit } from './gesi/GesiTrainingToolkit';
import { GesiRolesMap } from './gesi/GesiRolesMap';
import { GesiDashboard } from './gesi/GesiDashboard';
import { GesiLeadership } from './gesi/GesiLeadership';
import { GesiResources } from './gesi/GesiResources';
import { GesiComplianceTool } from './gesi/GesiComplianceTool';

type GesiTab = 
    | 'overview' 
    | 'navigator' 
    | 'training' 
    | 'roles' 
    | 'dashboard' 
    | 'leadership' 
    | 'resources' 
    | 'compliance';

const TABS: { id: GesiTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'navigator', label: 'Policy Navigator' },
    { id: 'training', label: 'Training Toolkit' },
    { id: 'roles', label: 'Roles & Responsibilities' },
    { id: 'dashboard', label: 'GESI Dashboard' },
    { id: 'leadership', label: 'Leadership & Values' },
    { id: 'resources', label: 'Resources' },
    { id: 'compliance', label: 'Compliance Checker' },
];

export const GesiPolicyToolkit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<GesiTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <GesiOverview />;
            case 'navigator': return <GesiPolicyNavigator />;
            case 'training': return <GesiTrainingToolkit />;
            case 'roles': return <GesiRolesMap />;
            case 'dashboard': return <GesiDashboard />;
            case 'leadership': return <GesiLeadership />;
            case 'resources': return <GesiResources />;
            case 'compliance': return <GesiComplianceTool />;
            default: return null;
        }
    };
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 flex-1 flex flex-col">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                        National Public Service GESI Policy Toolkit
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        An interactive resource for understanding and implementing Gender Equity & Social Inclusion.
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
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                            }`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>
            
            <GesiAnimatedBanner />

            <main className="flex-1 p-6">
                <div className="animate-fade-in">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
