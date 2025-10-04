import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING, EstablishmentRecord } from '../types';
import { AI_AUTOMATED_ESTABLISHMENT_SUMMARY_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, BuildingOfficeIcon, InformationCircleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, exportToCsv, copyForSheets } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[]; // This is the CNA data
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

interface EstablishmentSummaryItem {
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: string;
    cnaSubmitted: 'Submitted' | 'TBD' | 'N/A';
}

interface SummaryStats {
    totalPositions: number;
    confirmedOfficers: number;
    cnaSubmittedCount: number;
    eligibleForTraining: number;
    vacantPositions: number;
    stcOfficers: number;
    attendedTraining: number;
}

interface AiEstablishmentSummaryReport {
    establishmentList: EstablishmentSummaryItem[];
    summaryStats: SummaryStats;
}

const aiAutomatedEstablishmentSummarySchema = {
    type: Type.OBJECT,
    properties: {
        establishmentList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    status: { type: Type.STRING },
                    cnaSubmitted: { type: Type.STRING, enum: ['Submitted', 'TBD', 'N/A'] },
                },
                required: ["positionNumber", "grade", "designation", "occupant", "status", "cnaSubmitted"]
            }
        },
        summaryStats: {
            type: Type.OBJECT,
            properties: {
                totalPositions: { type: Type.NUMBER },
                confirmedOfficers: { type: Type.NUMBER },
                cnaSubmittedCount: { type: Type.NUMBER },
                eligibleForTraining: { type: Type.NUMBER },
                vacantPositions: { type: Type.NUMBER },
                stcOfficers: { type: Type.NUMBER },
                attendedTraining: { type: Type.NUMBER },
            },
            required: ["totalPositions", "confirmedOfficers", "cnaSubmittedCount", "eligibleForTraining", "vacantPositions", "stcOfficers", "attendedTraining"]
        }
    },
    required: ["establishmentList", "summaryStats"]
};

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white dark:bg-blue-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    </div>
);


export const AutomatedEstablishmentSummary: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiEstablishmentSummaryReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all public service agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateForm = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
             if (!establishmentData || establishmentData.length === 0) {
                 setError("No establishment data available to generate this report. Please import your data first.");
                 setLoading(false);
                 return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following CNA and Establishment data to populate the Establishment Summary form.\n\nCONTEXT: ${promptContext}\n\nCNA DATA (contains submission status and training history):\n${JSON.stringify(data, null, 2)}\n\nESTABLISHMENT DATA (master list of all positions):\n${JSON.stringify(establishmentData, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_AUTOMATED_ESTABLISHMENT_SUMMARY_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedEstablishmentSummarySchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as AiEstablishmentSummaryReport;
                setReport(result);
            } catch (e) {
                console.error("AI Automated Establishment Summary Error:", e);
                setError("An error occurred while generating the automated summary. The AI may have returned an unexpected format.");
            } finally {
                setLoading(false);
            }
        };
        generateForm();
    }, [data, establishmentData, promptContext]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report data not available.");

        const mainTableHeaders = ['Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submitted (Yes/No)'];
        const mainTableRows = report.establishmentList.map(o => [
            o.positionNumber, o.grade, o.designation, o.occupant, o.status, o.cnaSubmitted
        ]);
        
        const statsTableHeaders = ['Statistic', 'Value'];
        const statsTableRows = Object.entries(report.summaryStats).map(([key, value]) => {
            // Format key to be more readable
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return [formattedKey, value];
        });

        return {
            title: "Establishment Summary",
            sections: [
                { title: "Establishment Details", content: [{ type: 'table', headers: mainTableHeaders, rows: mainTableRows }] },
                { title: "Summary Statistics", content: [{ type: 'table', headers: statsTableHeaders, rows: statsTableRows }] }
            ]
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
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-blue-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating Establishment Summary...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing records and calculating key statistics.</p>
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
        if (report) return (
             <div className="space-y-6">
                <div className="flex items-start gap-3 p-3 text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <InformationCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>AI-Generated Content:</strong> This summary is automatically generated. The list of positions is taken from your imported establishment data. The <strong>'CNA Submitted'</strong> status is determined by cross-referencing against your CNA data. If information was incomplete in your source files, some fields may be marked as 'Vacant' or 'N/A' and require manual verification. The <strong>'Eligible Officers (Manual Form)'</strong> can be used to create and update detailed records.
                    </div>
                </div>
                 <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                        <StatCard title="Total Positions" value={report.summaryStats.totalPositions} />
                        <StatCard title="Confirmed Officers" value={report.summaryStats.confirmedOfficers} />
                        <StatCard title="CNA Submitted" value={report.summaryStats.cnaSubmittedCount} />
                        <StatCard title="Eligible for Training" value={report.summaryStats.eligibleForTraining} />
                        <StatCard title="Vacant Positions" value={report.summaryStats.vacantPositions} />
                        <StatCard title="Other Contracts (STC)" value={report.summaryStats.stcOfficers} />
                        <StatCard title="Attended Training" value={report.summaryStats.attendedTraining} />
                    </div>
                </div>
                <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Establishment List</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-200 dark:bg-blue-800/50">
                                <tr>
                                    {['Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submitted (Yes/No)'].map(h => 
                                        <th key={h} className="p-2 font-semibold">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {report.establishmentList.map((officer, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-blue-800 hover:bg-gray-50 dark:hover:bg-blue-900/20">
                                        <td className="p-2">{officer.positionNumber}</td>
                                        <td className="p-2">{officer.grade}</td>
                                        <td className="p-2 font-semibold">{officer.designation}</td>
                                        <td className="p-2">{officer.occupant || 'VACANT'}</td>
                                        <td className="p-2">{officer.status}</td>
                                        <td className="p-2 text-center">{officer.cnaSubmitted}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <BuildingOfficeIcon className="w-7 h-7 text-blue-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stage 3: Establishment Summary</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Automated Form</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Form automatically populated by Google Gemini. Please review for accuracy.</p>
                </footer>
            </div>
        </div>
    );
};