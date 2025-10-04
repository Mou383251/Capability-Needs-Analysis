import React, { useState, useMemo } from 'react';
import { EligibleOfficer } from '../types';
import { XIcon, ClipboardDocumentListIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, exportToCsv, copyForSheets, ReportData } from '../utils/export';

type ReportType = 'full' | 'eligible' | 'cna' | 'yearly';

interface ReportProps {
    division: string;
    officers: EligibleOfficer[];
    yearHeaders: number[];
    onClose: () => void;
}

const ReportView: React.FC<{ headers: string[], rows: (string | number)[][] }> = ({ headers, rows }) => {
    return (
        <div className="overflow-auto border border-slate-300 dark:border-slate-600 rounded-lg">
            <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-700/50 sticky top-0 z-10">
                    <tr>
                        {headers.map(header => <th key={header} className="p-2 truncate font-semibold">{header}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="p-2 truncate">{String(cell ?? '')}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length === 0 && <div className="text-center p-8 text-slate-500">No data available for this report type.</div>}
        </div>
    );
};


export const ReportingSuiteModal: React.FC<ReportProps> = ({ division, officers, yearHeaders, onClose }) => {
    const [currentReport, setCurrentReport] = useState<ReportType>('full');

    const reportData = useMemo((): { title: string, headers: string[], rows: (string|number)[][] } => {
        switch (currentReport) {
            case 'eligible':
                return {
                    title: 'Eligible Officers Summary',
                    headers: ['Occupant', 'Designation', 'Position No.', 'Status', 'CNA Submission'],
                    rows: officers
                        .filter(o => o.status === 'Confirmed' && o.cnaSubmission === 'Yes')
                        .map(o => [o.occupant, o.designation, o.positionNumber, o.status, o.cnaSubmission])
                };
            case 'cna':
                 return {
                    title: 'Establishment CNA Checklist',
                    headers: ['Occupant', 'Designation', 'Position No.', 'Status', 'CNA Submission'],
                    rows: officers.map(o => [o.occupant, o.designation, o.positionNumber, o.status, o.cnaSubmission])
                };
            case 'yearly':
                return {
                    title: 'Year-by-Year Training Activities',
                    headers: ['Occupant', 'Designation', 'Training Details', 'Planned Year'],
                    rows: officers
                        .flatMap(o => o.trainingYear.map(year => ([o.occupant, o.designation, o.courseDetails || 'General Development', year])))
                        .sort((a, b) => (a[3] as number) - (b[3] as number))
                };
            case 'full':
            default:
                return {
                    title: 'Full Training Plan Report',
                    headers: ['Branch/Division', 'Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA', 'Studies?', ...yearHeaders.map(String), 'Notes'],
                    rows: officers.map(o => [
                        o.branch, o.positionNumber, o.grade, o.designation, o.occupant, o.status, o.cnaSubmission,
                        o.beenSentForStudies,
                        ...yearHeaders.map(year => (o.trainingYear.includes(year) ? '✓' : '')),
                        o.notes || ''
                    ])
                };
        }
    }, [currentReport, officers, yearHeaders]);
    
    const getReportDataForExport = (): ReportData => {
        return {
            title: `${reportData.title} - ${division}`,
            sections: [{
                title: reportData.title,
                content: [{
                    type: 'table',
                    headers: reportData.headers,
                    rows: reportData.rows,
                }],
                orientation: 'landscape'
            }]
        }
    };
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const exportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(exportData);
            else if (format === 'sheets') copyForSheets(exportData).then(msg => alert(msg)).catch(err => alert(err.toString()));
            else if (format === 'pdf') exportToPdf(exportData);
            else if (format === 'docx') exportToDocx(exportData);
            else if (format === 'xlsx') exportToXlsx(exportData);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };

    const TabButton: React.FC<{ reportType: ReportType, label: string }> = ({ reportType, label }) => (
        <button
            onClick={() => setCurrentReport(reportType)}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${currentReport === reportType ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full flex flex-col h-[90vh]">
                 <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reporting Suite</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{division} Division</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close reporting suite">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="p-6 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <TabButton reportType="full" label="Full Training Plan" />
                        <TabButton reportType="eligible" label="Eligible Officers Summary" />
                        <TabButton reportType="cna" label="Establishment CNA Checklist" />
                        <TabButton reportType="yearly" label="Year-by-Year Activities" />
                    </div>
                    <div className="flex-1 min-h-0">
                       <ReportView headers={reportData.headers} rows={reportData.rows} />
                    </div>
                </main>
            </div>
        </div>
    );
};