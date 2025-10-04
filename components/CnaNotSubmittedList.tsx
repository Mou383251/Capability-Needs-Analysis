import React, { useMemo, useState } from 'react';
import { OfficerRecord, EstablishmentRecord } from '../types';
import { XIcon, ExclamationTriangleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, exportToCsv, copyForSheets, ReportData } from '../utils/export';

interface ReportProps {
  cnaData: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  onClose: () => void;
}

export const CnaNotSubmittedList: React.FC<ReportProps> = ({ cnaData, establishmentData, onClose }) => {
    const [filter, setFilter] = useState('');

    const nonSubmitters = useMemo(() => {
        const submittedPositionNumbers = new Set(cnaData.map(o => o.positionNumber));
        return establishmentData.filter(officer => 
            officer.status !== 'Vacant' && 
            officer.positionNumber && 
            !submittedPositionNumbers.has(officer.positionNumber)
        );
    }, [cnaData, establishmentData]);

    const filteredList = useMemo(() => {
        if (!filter) return nonSubmitters;
        const lowerCaseFilter = filter.toLowerCase();
        return nonSubmitters.filter(officer =>
            officer.division.toLowerCase().includes(lowerCaseFilter) ||
            officer.designation.toLowerCase().includes(lowerCaseFilter) ||
            officer.positionNumber.toLowerCase().includes(lowerCaseFilter) ||
            officer.occupant.toLowerCase().includes(lowerCaseFilter)
        );
    }, [nonSubmitters, filter]);
    
    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['Branch/Division', 'Designation', 'Position No.', 'Occupant'];
        const tableRows = filteredList.map(o => [o.division, o.designation, o.positionNumber, o.occupant]);
        
        return {
            title: "Officers with Outstanding CNA Submissions",
            sections: [{ 
                title: "List of Officers - CNA Not Submitted", 
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
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Officers - CNA Not Submitted</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
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
                                placeholder="Filter by division, designation, position..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full max-w-md p-2 text-sm border-gray-300 dark:border-blue-700 bg-white dark:bg-blue-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-200 dark:bg-blue-800/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3 font-semibold">Branch/Division</th>
                                        <th className="p-3 font-semibold">Designation</th>
                                        <th className="p-3 font-semibold">Position No.</th>
                                        <th className="p-3 font-semibold">Occupant</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredList.map((officer) => (
                                        <tr key={officer.positionNumber} className="border-b border-gray-200 dark:border-blue-800 hover:bg-gray-50 dark:hover:bg-blue-900/20">
                                            <td className="p-2">{officer.division}</td>
                                            <td className="p-2 font-semibold">{officer.designation}</td>
                                            <td className="p-2">{officer.positionNumber}</td>
                                            <td className="p-2">{officer.occupant}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredList.length === 0 && (
                                <div className="text-center p-8 text-gray-500">
                                    {nonSubmitters.length > 0 ? "No officers match the current filter." : "All officers have submitted their CNA."}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">This list is generated by comparing the establishment list with CNA submissions.</p>
                </footer>
            </div>
        </div>
    );
};