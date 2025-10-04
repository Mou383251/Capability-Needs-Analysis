import React, { useMemo } from 'react';
import { EligibleOfficer } from '../types';
import { XIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
    division: string;
    officers: EligibleOfficer[];
    onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    </div>
);

export const RealtimeSummaryReport: React.FC<ReportProps> = ({ division, officers, onClose }) => {

    const summary = useMemo(() => {
        const totalPositions = officers.length;
        const confirmedPositions = officers.filter(o => o.status === 'Confirmed').length;
        const vacantPositions = officers.filter(o => o.status === 'Vacant').length;
        const displacedUnattached = officers.filter(o => o.status === 'Displaced' || o.status === 'Unattached').length;
        const cnaSubmitted = officers.filter(o => o.cnaSubmission === 'Yes').length;
        const cnaNotSubmitted = totalPositions - cnaSubmitted;
        const sentForStudies = officers.filter(o => o.beenSentForStudies === 'Yes').length;
        const notSentForStudies = totalPositions - sentForStudies;
        const attendedFurtherTraining = officers.filter(o => o.attendedFurtherTraining === 'Yes').length;
        const eligibleForTraining = officers.filter(o => o.status === 'Confirmed' && o.cnaSubmission === 'Yes').length;
        const stcIneligible = officers.filter(o => o.status === 'Probation' || o.status === 'Other').length;
        const priorityFills = officers.filter(o => o.notes?.toLowerCase().includes('priority')).length;
        const criticalRoles = officers.filter(o => o.notes?.toLowerCase().includes('critical')).length;

        return {
            "Total Positions on Establishment": totalPositions,
            "Confirmed Positions": confirmedPositions,
            "Vacant Positions": vacantPositions,
            "Displaced/Unattached Positions": displacedUnattached,
            "CNA Submitted": cnaSubmitted,
            "CNA Not Submitted": cnaNotSubmitted,
            "Been Sent for Studies": sentForStudies,
            "Not Sent for Studies": notSentForStudies,
            "Officers Attended Further Training": attendedFurtherTraining,
            "Officers Eligible for Training": eligibleForTraining,
            "STC/Ineligible": stcIneligible,
            "Priority Fills": priorityFills,
            "Critical Roles": criticalRoles
        };
    }, [officers]);

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['Metric', 'Value'];
        const tableRows: (string | number)[][] = Object.entries(summary);
        return {
            title: `Real-time Summary for ${division}`,
            sections: [
                {
                    title: 'Summary Statistics',
                    content: [{
                        type: 'table',
                        headers: tableHeaders,
                        rows: tableRows,
                    }]
                }
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        const reportData = getReportDataForExport();
        switch (format) {
            case 'pdf': exportToPdf(reportData); break;
            case 'docx': exportToDocx(reportData); break;
            case 'xlsx': exportToXlsx(reportData); break;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Real-time Summary</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{division} Division</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close summary">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="p-6 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(summary).map(([title, value]) => (
                            <StatCard key={title} title={title} value={value} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
