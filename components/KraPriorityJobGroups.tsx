import React from 'react';
import { KRA_JOB_GROUP_EXAMPLES } from '../data/kra';
import { XIcon, PresentationChartLineIcon } from './icons';

interface ReportProps {
    onClose: () => void;
}

export const KraPriorityJobGroups: React.FC<ReportProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KRA Priority Job Groups (Reference)</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            This table provides examples of job titles that fall under each KRA Area for staffing plan purposes.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-200 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="p-2 font-semibold w-1/3">KRA Area</th>
                                        <th className="p-2 font-semibold w-2/3">Priority Job Group Examples</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {KRA_JOB_GROUP_EXAMPLES.map(item => (
                                        <tr key={item.kraArea} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-semibold align-top">{item.kraArea}</td>
                                            <td className="p-2 align-top whitespace-pre-wrap">{item.jobExamples}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};