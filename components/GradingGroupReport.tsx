import React, { useState, useMemo } from 'react';
import { OfficerRecord } from '../types';
import { XIcon, PresentationChartLineIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  onClose: () => void;
}

export const GradingGroupReport: React.FC<ReportProps> = ({ data, onClose }) => {
    const [filter, setFilter] = useState('');

    const classifiedData = useMemo(() => {
        return data.map(officer => ({
            name: officer.name,
            position: officer.position,
            division: officer.division,
            grade: officer.grade,
            gradingGroup: officer.gradingGroup || 'Other',
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [data]);

    const filteredData = useMemo(() => {
        const lowerCaseFilter = filter.toLowerCase();
        if (!lowerCaseFilter) return classifiedData;
        return classifiedData.filter(officer => 
            Object.values(officer).some(value => 
                String(value).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [classifiedData, filter]);

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['Name', 'Position', 'Division', 'Grade', 'Grading Group'];
        const tableRows = filteredData.map(o => [o.name, o.position, o.division, o.grade, o.gradingGroup]);
        
        return {
            title: "Officer Grading Group Report",
            sections: [{ 
                title: "Officer Classification by Grade", 
                content: [{
                    type: 'table',
                    headers: tableHeaders,
                    rows: tableRows
                }] 
            }]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
             switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
                case 'csv': exportToCsv(reportData); break;
                case 'sheets': copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(err.toString())); break;
            }
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Officer Grading Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 sm:p-6">
                    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-4">
                         <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Filter by name, position, grade, group..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full max-w-md p-2 text-sm border-gray-300 dark:border-blue-700 bg-white dark:bg-blue-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-200 dark:bg-blue-800/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3 font-semibold">Name</th>
                                        <th className="p-3 font-semibold">Position</th>
                                        <th className="p-3 font-semibold">Division</th>
                                        <th className="p-3 font-semibold">Grade</th>
                                        <th className="p-3 font-semibold">Grading Group</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((officer, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-blue-800 hover:bg-gray-50 dark:hover:bg-blue-900/20">
                                            <td className="p-2 font-semibold">{officer.name}</td>
                                            <td className="p-2">{officer.position}</td>
                                            <td className="p-2">{officer.division}</td>
                                            <td className="p-2">{officer.grade}</td>
                                            <td className="p-2 font-bold text-blue-600 dark:text-blue-400">{officer.gradingGroup}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredData.length === 0 && (
                                <div className="text-center p-8 text-gray-500">No officers match the current filter.</div>
                            )}
                        </div>
                    </div>
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Officer data classified based on provided grading rules.</p>
                </footer>
            </div>
        </div>
    );
};