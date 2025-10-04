import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiTrainingPlan, TrainingPlanItem, QUESTION_TEXT_MAPPING, AgencyType } from '../types';
import { AI_TRAINING_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToXlsx, ReportData, exportToDocx } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiTrainingPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        trainingPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    trainingArea: { type: Type.STRING },
                    targetAudience: { type: Type.STRING, enum: ['Junior Officer', 'Senior Officer', 'Manager', 'Senior Management', 'All Staff'] },
                    deliveryMethod: { type: Type.STRING, enum: ['Workshop', 'Mentoring', 'On-the-Job', 'E-Learning', 'Secondment'] },
                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    quarter: { type: Type.STRING, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
                    year: { type: Type.NUMBER },
                    estimatedCost: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                },
                required: ["trainingArea", "targetAudience", "deliveryMethod", "priority", "quarter", "year", "estimatedCost", "rationale"]
            }
        }
    },
    required: ["executiveSummary", "trainingPlan"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">{children}</div>
    </div>
);

const PriorityBadge: React.FC<{ level: 'High' | 'Medium' | 'Low' }> = ({ level }) => {
    const styles = {
        High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[level]}`}>{level}</span>;
};

export const TrainingPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiTrainingPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following CNA data and generate a consolidated training plan.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand the question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_TRAINING_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTrainingPlanSchema,
                    },
                });
                // FIX: Add type assertion to ensure TypeScript knows the shape of the parsed JSON object.
                setReport(JSON.parse(response.text.trim()) as AiTrainingPlan);
            } catch (e) {
                console.error("AI Training Plan Error:", e);
                setError("An error occurred while generating the AI analysis for the training plan.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, promptContext]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        
        const tableHeaders = ['Training Area', 'Target Audience', 'Delivery Method', 'Priority', 'Quarter', 'Est. Cost (PGK)', 'Rationale'];
        const tableRows = report.trainingPlan.map(item => [
            item.trainingArea,
            item.targetAudience,
            item.deliveryMethod,
            item.priority,
            item.quarter,
            item.estimatedCost,
            item.rationale
        ]);

        return {
            title: `Annual Training Plan - ${report.trainingPlan[0]?.year || '2026'}`,
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { 
                    title: "Detailed Training Plan", 
                    content: [{
                        type: 'table',
                        headers: tableHeaders,
                        rows: tableRows
                    }] 
                }
            ]
        };
    };
    
    const handleExport = (format: 'pdf' | 'xlsx' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if(format === 'pdf') {
                 exportToPdf(reportData);
            } else if (format === 'xlsx') {
                 exportToXlsx(reportData);
            } else if (format === 'docx') {
                 exportToDocx(reportData);
            }
        } catch(e) {
             console.error("Export failed:", e);
             alert("Could not export report.");
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Generating Consolidated Plan...</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Gemini is synthesizing all CNA data into a strategic training plan.</p>
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
                <div className="space-y-6">
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                    <ReportSection title={`Detailed Annual Training Plan - ${report.trainingPlan[0]?.year || 2026}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-200 dark:bg-gray-700/50 text-xs uppercase">
                                    <tr>
                                        <th className="p-2 font-semibold">Training Area</th>
                                        <th className="p-2 font-semibold">Target Audience</th>
                                        <th className="p-2 font-semibold">Method</th>
                                        <th className="p-2 font-semibold">Priority</th>
                                        <th className="p-2 font-semibold">Quarter</th>
                                        <th className="p-2 font-semibold">Est. Cost</th>
                                        <th className="p-2 font-semibold">Rationale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.trainingPlan.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20">
                                            <td className="p-2 font-semibold">{item.trainingArea}</td>
                                            <td className="p-2">{item.targetAudience}</td>
                                            <td className="p-2">{item.deliveryMethod}</td>
                                            <td className="p-2"><PriorityBadge level={item.priority} /></td>
                                            <td className="p-2">{item.quarter}</td>
                                            <td className="p-2">{item.estimatedCost}</td>
                                            <td className="p-2 text-xs">{item.rationale}</td>
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
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consolidated Training Plan</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};