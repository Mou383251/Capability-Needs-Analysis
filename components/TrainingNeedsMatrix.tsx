import React, { useState, useMemo } from 'react';
import { OfficerRecord, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, TableCellsIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyName: string;
  onClose: () => void;
}

export const TrainingNeedsMatrix: React.FC<ReportProps> = ({ data, agencyName, onClose }) => {
    const allDivisions = useMemo(() => [...new Set(data.map(o => o.division))].sort(), [data]);
    const [selectedDivision, setSelectedDivision] = useState<string>('All');
    
    const matrixData = useMemo(() => {
        const filteredOfficers = selectedDivision === 'All'
            ? data
            : data.filter(o => o.division === selectedDivision);

        const gapMap: Map<string, { text: string; officers: string[] }> = new Map();
        
        filteredOfficers.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if (rating.gapScore >= 3) { // Moderate or Critical gap
                    const questionCode = rating.questionCode;
                    if (!gapMap.has(questionCode)) {
                        gapMap.set(questionCode, {
                            text: QUESTION_TEXT_MAPPING[questionCode] || questionCode,
                            officers: []
                        });
                    }
                    gapMap.get(questionCode)!.officers.push(officer.name);
                }
            });
        });

        const uniqueGaps = Array.from(gapMap.keys()).sort((a, b) => 
            (gapMap.get(b)?.officers.length ?? 0) - (gapMap.get(a)?.officers.length ?? 0)
        );

        const officersWithGaps = filteredOfficers.filter(o => o.capabilityRatings.some(r => r.gapScore >= 3));

        return {
            officers: officersWithGaps,
            gaps: uniqueGaps,
            gapMap,
        };
    }, [data, selectedDivision]);

    const getReportDataForExport = (): ReportData => {
        const { officers, gaps, gapMap } = matrixData;
        const headers = ['Officer Name', 'Position', ...gaps.map(g => gapMap.get(g)?.text || g)];
        const rows = officers.map(officer => {
            return [
                officer.name,
                officer.position,
                ...gaps.map(gapCode => {
                    const gap = gapMap.get(gapCode);
                    return gap?.officers.includes(officer.name) ? '✔️' : '';
                })
            ];
        });
        
        return {
            title: `Training Needs Matrix - ${selectedDivision === 'All' ? agencyName : selectedDivision}`,
            sections: [{
                title: 'Training Needs Matrix',
                content: [{
                    type: 'table',
                    headers,
                    rows
                }],
                orientation: 'landscape'
            }]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(reportData);
            else if (format === 'sheets') copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(err.toString()));
            else if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <TableCellsIcon className="w-7 h-7 text-teal-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Needs Matrix</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                   <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex-1 flex flex-col min-h-0">
                       <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                           <label htmlFor="division-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Division:</label>
                           <select
                               id="division-filter"
                               value={selectedDivision}
                               onChange={(e) => setSelectedDivision(e.target.value)}
                               className="p-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                           >
                               <option value="All">All Divisions</option>
                               {allDivisions.map(div => <option key={div} value={div}>{div}</option>)}
                           </select>
                       </div>
                       <div className="overflow-auto flex-1">
                           <table className="w-full text-left text-xs border-collapse">
                               <thead className="bg-gray-200 dark:bg-gray-700/50 sticky top-0 z-10">
                                   <tr>
                                       <th className="p-2 font-semibold border border-slate-300 dark:border-slate-600 sticky left-0 bg-gray-200 dark:bg-gray-700/50 z-20">Officer</th>
                                       {matrixData.gaps.map(gapCode => (
                                           <th key={gapCode} className="p-2 font-semibold border border-slate-300 dark:border-slate-600 align-bottom min-w-[100px]">
                                               <div className="[writing-mode:vertical-lr] transform rotate-180 h-32">
                                                   <span title={matrixData.gapMap.get(gapCode)?.text}>{matrixData.gapMap.get(gapCode)?.text}</span>
                                               </div>
                                           </th>
                                       ))}
                                   </tr>
                               </thead>
                               <tbody>
                                   {matrixData.officers.map(officer => (
                                       <tr key={officer.email} className="border-b border-gray-200 dark:border-gray-700">
                                           <td className="p-2 border border-slate-300 dark:border-slate-600 sticky left-0 bg-white dark:bg-gray-800/50 z-10">
                                               <p className="font-semibold">{officer.name}</p>
                                               <p className="text-gray-500 dark:text-gray-400 text-[10px]">{officer.position}</p>
                                           </td>
                                           {matrixData.gaps.map(gapCode => (
                                               <td key={`${officer.email}-${gapCode}`} className="p-2 border border-slate-300 dark:border-slate-600 text-center">
                                                   {matrixData.gapMap.get(gapCode)?.officers.includes(officer.name) && (
                                                       <span className="text-green-600 font-bold" title="Gap Identified">✔️</span>
                                                   )}
                                               </td>
                                           ))}
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                           {matrixData.officers.length === 0 && (
                                <div className="text-center p-8 text-gray-500">No officers with moderate or critical gaps found for the selected division.</div>
                           )}
                       </div>
                   </div>
                </main>
            </div>
        </div>
    );
};
