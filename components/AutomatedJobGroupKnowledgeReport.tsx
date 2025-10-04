import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, JobGroupKnowledgeRecord } from '../types';
import { AI_AUTOMATED_JOB_GROUP_KNOWLEDGE_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, AcademicCapIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, exportToCsv, copyForSheets } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  onClose: () => void;
}

const aiAutomatedJobGroupKnowledgeSchema = {
    type: Type.OBJECT,
    properties: {
        records: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    jobGroup: { type: Type.STRING, enum: ['Senior Executive Managers', 'Senior/Middle Managers', 'Supervisors', 'All Line Staff', 'Executive Secretaries'] },
                    educationalProgramme: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    location: { type: Type.STRING },
                    duration: { type: Type.STRING, enum: ['Less than 6 months', '6 to 12 months', '1 to 2 years', 'More than 2 years'] },
                    fundingSource: { type: Type.STRING, enum: ['Department', 'GoPNG', 'Donor Agency', 'Self-funded', 'Other'] },
                    years: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                },
                required: ["jobGroup", "educationalProgramme", "institution", "location", "duration", "fundingSource", "years"]
            }
        }
    },
    required: ["records"]
};

export const AutomatedJobGroupKnowledgeReport: React.FC<ReportProps> = ({ data, onClose }) => {
    const [report, setReport] = useState<JobGroupKnowledgeRecord[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const yearOptions = [2023, 2024, 2025, 2026];

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following CNA data to generate a Job Group Knowledge Improvement plan.\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_AUTOMATED_JOB_GROUP_KNOWLEDGE_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedJobGroupKnowledgeSchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as { records: Omit<JobGroupKnowledgeRecord, 'id'>[] };
                const recordsWithId = result.records.map(rec => ({ ...rec, id: crypto.randomUUID() }));
                setReport(recordsWithId);

            } catch (e) {
                console.error("AI Job Group Knowledge Report Error:", e);
                setError("An error occurred while generating the AI analysis for the Job Group Knowledge Improvement plan.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        const tableHeaders = ["Job Group", "Educational Programme", "Institution", "Location", "Duration", "Funding Source", ...yearOptions.map(String)];
        const tableRows = report.map(rec => [
            rec.jobGroup, rec.educationalProgramme, rec.institution, rec.location, rec.duration, rec.fundingSource,
            ...yearOptions.map(year => (rec.years.includes(year) ? '✓' : ''))
        ]);
        return {
            title: "Job Group Knowledge Improvement Plan",
            sections: [{ title: "AI-Generated Knowledge Improvement Plan", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
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
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-green-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating Knowledge Plan...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing qualification gaps to suggest educational programs.</p>
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
        if (report) {
            return (
                 <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-200 dark:bg-slate-700/50">
                                <tr>
                                    {['Job Group', 'Educational Programme', 'Institution', 'Location', 'Duration', 'Funding Source', ...yearOptions.map(String)].map(h => 
                                        <th key={h} className="p-2 font-semibold">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {report.map(rec => (
                                    <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-2">{rec.jobGroup}</td>
                                        <td className="p-2 font-semibold">{rec.educationalProgramme}</td>
                                        <td className="p-2">{rec.institution}</td>
                                        <td className="p-2">{rec.location}</td>
                                        <td className="p-2">{rec.duration}</td>
                                        <td className="p-2">{rec.fundingSource}</td>
                                        {yearOptions.map(year => (
                                            <td key={year} className="p-2 text-center">{rec.years.includes(year) ? '✓' : ''}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {report.length === 0 && <div className="text-center p-8 text-slate-500">The AI could not generate any knowledge improvement records from the provided data.</div>}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-7 h-7 text-green-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Generated Job Group Knowledge Plan</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close form">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};