import React from 'react';
import { DocumentIcon } from '../icons';

const ResourceLink: React.FC<{ title: string, description: string, isDownload?: boolean }> = ({ title, description, isDownload = false }) => (
    <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            alert(`Simulating ${isDownload ? 'download' : 'navigation'} for: ${title}`);
        }}
        className="block p-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
        <div className="flex items-center gap-4">
            <DocumentIcon className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    </a>
);

export const GesiResources: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
             <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Resources & Downloads</h2>
                <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    Access the full GESI policy and other key national documents that support and inform its implementation.
                </p>
            </div>
            <div className="space-y-4">
                <ResourceLink 
                    title="Download: Full GESI Policy (PDF)"
                    description="The complete National Public Service Gender Equity and Social Inclusion Policy document."
                    isDownload
                />
                 <ResourceLink 
                    title="National Policy for Women and Gender Equality 2011–2015"
                    description="The foundational policy document addressing gender equality in PNG."
                />
                 <ResourceLink 
                    title="National Disability Policy"
                    description="The policy framework for promoting the rights and inclusion of persons with disabilities."
                />
                 <ResourceLink 
                    title="Relevant Public Service General Orders"
                    description="Access the General Orders pertaining to conduct, leave, and other conditions of service."
                />
            </div>
        </div>
    );
};