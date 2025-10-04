



import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiJobGroupTrainingNeedsReport, AgencyType, AiReportSummary, JobGroup, JobGroupTrainingNeed, QUESTION_TEXT_MAPPING } from '../types';
import { AI_JOB_GROUP_TRAINING_NEEDS_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, CalendarDaysIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  onClose: () => void;
}

const aiReportSummarySchema = {
    type: Type.OBJECT,
    properties: {
        totalGapsDetected: { type: Type.NUMBER },
        criticalGapsCount: { type: Type.NUMBER },
        staffCategoryDistribution: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                },
                required: ["category", "count"],
            }
        },
        topImprovementAreas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING },
                    reason: { type: Type.STRING },
                },
                required: ["area", "reason"],
            }
        },
        concludingIntervention: { type: Type.STRING },
    },
    required: ["totalGapsDetected", "criticalGapsCount", "staffCategoryDistribution", "topImprovementAreas", "concludingIntervention"]
};

const aiJobGroupTrainingNeedsReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        jobGroupNeeds: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    jobGroup: { type: Type.STRING, enum: ['Senior Executive Managers', 'Supervisors', 'Administration', 'Finance', 'Economics', 'ICT Officers', 'Field Officers', 'Executive Secretaries', 'Support Staff'] },
                    description: { type: Type.STRING },
                    identifiedNeeds: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                rationale: { type: Type.STRING },
                                recommendedYear: { type: Type.NUMBER },
                            },
                            required: ["skill", "rationale", "recommendedYear"]
                        }
                    }
                },
                required: ["jobGroup", "description", "identifiedNeeds"]
            }
        },
        summary: aiReportSummarySchema
    },
    required: ["executiveSummary", "jobGroupNeeds", "summary"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);


export const TrainingCalendarReport: React.FC<ReportProps> = ({ data, agencyType, onClose }) => {
    const [report, setReport] = useState<AiJobGroupTrainingNeedsReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const yearHeaders = [2025, 2026, 2027, 2028, 2029];
    const jobGroupOrder: JobGroup[] = [
        'Senior Executive Managers', 'Supervisors', 'Administration', 'Finance',
        'Economics', 'ICT Officers', 'Field Officers', 'Executive Secretaries', 'Support Staff'
    ];

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const promptContext = agencyType !== 'All Agencies'
                    ? `The analysis and recommendations should be specifically tailored for a '${agencyType}'.`
                    : 'The analysis and recommendations should be general and applicable to all types of public service agencies.';

                const promptText = `You MUST use this mapping to understand the question codes in the data.
QUESTION MAPPING:
${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}

Please analyze the following Capability Needs Analysis (CNA) survey data and generate a Training Needs by Job Group report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_JOB_GROUP_TRAINING_NEEDS_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiJobGroupTrainingNeedsReportSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiJobGroupTrainingNeedsReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("AI Training Calendar Report Error:", e);
                setError("An error occurred while generating the AI analysis for the training calendar.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, agencyType]);

    const dataForCalendar = useMemo(() => {
        if (!report) return {};
        const calendarData: Record<JobGroup, Record<number, JobGroupTrainingNeed[]>> = {} as any;
        
        jobGroupOrder.forEach(jobGroup => {
            const groupData = report.jobGroupNeeds.find(g => g.jobGroup === jobGroup);
            if (groupData) {
                calendarData[jobGroup] = {};
                groupData.identifiedNeeds.forEach(need => {
                    if (!calendarData[jobGroup][need.recommendedYear]) {
                        calendarData[jobGroup][need.recommendedYear] = [];
                    }
                    calendarData[jobGroup][need.recommendedYear].push(need);
                });
            }
        });
        
        return calendarData;
    }, [report, jobGroupOrder]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("AI report not available");
        
        const tableHeaders = ['Job Group', ...yearHeaders.map(String)];
        
        const tableRows = Object.entries(dataForCalendar).map(([jobGroup, yearData]) => {
            const row = [jobGroup];
            yearHeaders.forEach(year => {
                const needs = yearData[year];
                row.push(needs ? needs.map(n => n.skill).join('; ') : '');
            });
            return row;
        });
        
        const mainTable = {
            type: 'table' as const,
            headers: tableHeaders,
            rows: tableRows,
        };
        
        return {
            title: "Five-Year Training Calendar",
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { title: "Training Calendar (2025-2029)", content: [mainTable] }
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
            }
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report. Data may still be loading or an error occurred.");
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-fuchsia-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Building Training Calendar</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing and scheduling training activities...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px]">
                    <XIcon className="w-16 h-16 text-red-500" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }
        
        if (report) {
            return (
                 <div className="space-y-6">
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                    
                    <ReportSection title="Training Calendar (2025-2029)">
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-200 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-slate-200 dark:bg-slate-700/50">Job Group</th>
                                        {yearHeaders.map(year => <th key={year} className="p-3 font-semibold text-slate-800 dark:text-slate-200 text-center w-1/6">{year}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(dataForCalendar).map(([jobGroup, yearData]) => (
                                        <tr key={jobGroup} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="p-3 font-bold align-top text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800/50">{jobGroup}</td>
                                            {yearHeaders.map(year => (
                                                <td key={year} className="p-2 align-top border-l border-slate-200 dark:border-slate-700">
                                                    {yearData[year] && yearData[year].length > 0 ? (
                                                        <ul className="space-y-2 text-xs">
                                                            {yearData[year].map((need, index) => (
                                                                <li key={index} className="p-1.5 bg-blue-100/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md">
                                                                    <p className="font-semibold">{need.skill}</p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="h-full w-full"></div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                </div>
            );
        }
        
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <CalendarDaysIcon className="w-7 h-7 text-fuchsia-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Five-Year Training Calendar</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 sm:p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};