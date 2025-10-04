import React from 'react';
import { DocumentIcon, DocumentArrowUpIcon } from '../icons';

const ResourceLink: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div
        className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-700"
    >
        <div className="flex items-center gap-4">
            <DocumentIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
        <button
            disabled
            title="Download functionality is not yet implemented."
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            <DocumentArrowUpIcon className="w-4 h-4" />
            <span>Download</span>
        </button>
    </div>
);

export const CnaResources: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Templates & Resources</h2>
            <div className="space-y-4">
                <ResourceLink 
                    title="CNA Survey Template (.xlsx)"
                    description="A downloadable Excel template pre-formatted with the standard CNA questionnaire codes."
                />
                <ResourceLink 
                    title="L&D Plan Template (.docx)"
                    description="A Word document template for formalizing your annual Learning & Development plan."
                />
                <ResourceLink 
                    title="Individual Development Plan (IDP) Template (.docx)"
                    description="A template for managers and staff to create personalized development plans based on CNA and SPA results."
                />
                 <ResourceLink 
                    title="Guide to Writing SMART L&D Objectives (.pdf)"
                    description="A guide to help formulate effective and measurable objectives for your training initiatives."
                />
            </div>
        </div>
    );
};