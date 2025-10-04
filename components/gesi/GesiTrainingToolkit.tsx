import React from 'react';
import { DocumentArrowUpIcon } from '../icons';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-300 dark:border-gray-700 pb-2">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

const DownloadableItem: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900/40 rounded-md border border-gray-200 dark:border-gray-700">
        <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
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

export const GesiTrainingToolkit: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Section title="GESI Training Recommendations">
                <p>
                    Integrating GESI into the public service requires continuous learning and capacity building. The following areas should be incorporated into agency training plans:
                </p>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>Staff Induction:</strong> All new public servants must receive mandatory training on the GESI Policy, Code of Conduct, and their responsibilities in fostering an inclusive workplace.
                    </li>
                    <li>
                        <strong>Performance Management:</strong> Managers and supervisors should be trained on how to set GESI-sensitive Key Performance Indicators (KPIs) and how to conduct performance appraisals free from bias.
                    </li>
                    <li>
                        <strong>Recruitment & Selection:</strong> All hiring managers and selection panel members must undergo training on fair, merit-based, and inclusive recruitment practices to mitigate unconscious bias.
                    </li>
                     <li>
                        <strong>Disciplinary Processes:</strong> Officers involved in handling disciplinary cases must be trained on GESI principles to ensure all complaints, especially those related to harassment and discrimination, are handled sensitively and impartially.
                    </li>
                </ul>
            </Section>

            <Section title="Downloadable Templates & Checklists">
                <p>
                    These templates are designed to help agencies operationalize the GESI Policy. They can be adapted to suit specific departmental contexts.
                </p>
                <div className="space-y-3 mt-4">
                    <DownloadableItem 
                        title="Workplace GESI Policy Template"
                        description="A customizable template for your department's internal GESI policy."
                    />
                    <DownloadableItem 
                        title="Complaint Handling Checklist"
                        description="A step-by-step guide for managers on handling GESI-related grievances."
                    />
                    <DownloadableItem 
                        title="Sample GESI KPIs for Managers"
                        description="Examples of Key Performance Indicators to include in Staff Performance Appraisals."
                    />
                     <DownloadableItem 
                        title="Inclusive Meeting Checklist"
                        description="A checklist to ensure meetings are conducted in an inclusive and accessible manner."
                    />
                </div>
            </Section>
        </div>
    );
};