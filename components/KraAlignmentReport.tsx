import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord } from '../types';
import { AI_KRA_ALIGNMENT_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { KRA_DATA } from '../data/kra';
import { XIcon, SparklesIcon, PresentationChartLineIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, exportToCsv, copyForSheets } from '../utils/export';

interface ReportProps {
  cnaData: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  onClose: () => void;
}

interface KraAlignmentRecord {
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: string;
    cnaSubmission: 'Submitted' | 'TBD' | 'N/A';
    kraAlignment: string;
}

const aiKraAlignmentReportSchema = {
    type: Type.OBJECT,
    properties: {
        alignmentReport: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    status: { type: Type.STRING },
                    cnaSubmission: { type: Type.STRING, enum: ['Submitted', 'TBD', 'N/A'] },
                    kraAlignment: { type: Type.STRING },
                },
                required: ["positionNumber", "grade", "designation", "occupant", "status", "cnaSubmission", "kraAlignment"]
            }
        }
    },
    required: ["alignmentReport"]
};

export const KraAlignmentReport: React.FC<ReportProps> = ({ cnaData, establishmentData, onClose }) => {
    const [reportData, setReportData] = useState<KraAlignmentRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            if (!establishmentData || establishmentData.length === 0) {
                setError("No establishment data available to generate this report.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following datasets to create a KRA Alignment report.\n\nESTABLISHMENT DATA (master list):\n${JSON.stringify(establishmentData, null, 2)}\n\nCNA DATA (for submission status):\n${JSON.stringify(cnaData, null, 2)}\n\nKRA DATA (for alignment context):\n${JSON.stringify(KRA_DATA, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_KRA_ALIGNMENT_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiKraAlignmentReportSchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as { alignmentReport: KraAlignmentRecord[] };
                setReportData(result.alignmentReport);
            } catch (e) {
                console.error("AI KRA Alignment Report Error:", e);
                setError("An error occurred while generating the AI analysis for the KRA alignment report.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [cnaData, establishmentData]);

    const filteredReport = useMemo(() => {
        if (!filter) return reportData;
        const lowerCaseFilter = filter.toLowerCase();
        return reportData.filter(record => 
            Object.values(record).some(val => 
                String(val).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [reportData, filter]);
    
    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submission', 'AI-Suggested KRA'];
        const tableRows = filteredReport.map(r => [r.positionNumber, r.grade, r.designation, r.occupant, r.status, r.cnaSubmission, r.kraAlignment]);
        return {
            title: "KRA Establishment Alignment Report",
            sections: [{ title: "KRA Alignment", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        const dataToExport = getReportDataForExport();
        if (format === 'csv') exportToCsv(dataToExport);
        else if (format === 'sheets') copyForSheets(dataToExport).then(msg => alert(msg)).catch(err => alert(err.toString()));
        else if (format === 'pdf') exportToPdf(dataToExport);
        else if (format === 'docx') exportToDocx(dataToExport);
        else if (format === 'xlsx') exportToXlsx(dataToExport);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-green-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Aligning Establishment to KRAs...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing each position's strategic relevance.</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px] text-center">
                    <XIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }
        return (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{`KRA Alignment (${filteredReport.length} records)`}</h2>
                    <input
                        type="text"
                        placeholder="Filter results..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full max-w-sm p-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-200 dark:bg-gray-700/50">
                            <tr>
                                {['Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submission', 'AI-Suggested KRA'].map(h => 
                                    <th key={h} className="p-2 font-semibold">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReport.map((record, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-2">{record.positionNumber}</td>
                                    <td className="p-2">{record.grade}</td>
                                    <td className="p-2 font-semibold">{record.designation}</td>
                                    <td className="p-2">{record.occupant}</td>
                                    <td className="p-2">{record.status}</td>
                                    <td className="p-2">{record.cnaSubmission}</td>
                                    <td className="p-2 font-bold text-blue-600 dark:text-blue-400">{record.kraAlignment}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KRA Establishment Alignment Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};
