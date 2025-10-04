import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiAnnualTrainingPlan, AnnualTrainingPlanItem, AgencyType, AiReportSummary, FundingSource, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_ANNUAL_TRAINING_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ChartBarSquareIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
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

const successionCandidateSchema = {
    type: Type.OBJECT,
    properties: {
        roleOrPosition: { type: Type.STRING },
        potentialSuccessors: { type: Type.ARRAY, items: { type: Type.STRING } },
        readinessLevel: { type: Type.STRING, enum: ['Ready Now', '1-2 Years', '3-5 Years', 'Long-term'] },
        developmentNeeds: { type: Type.STRING },
        estimatedTimeline: { type: Type.STRING },
    },
    required: ["roleOrPosition", "potentialSuccessors", "readinessLevel", "developmentNeeds", "estimatedTimeline"]
};

const aiAnnualTrainingPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        year: { type: Type.NUMBER },
        trainingPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    fundingSource: { type: Type.STRING, enum: ['Internal Budget', 'Donor Funded', 'GoPNG', 'Other (Specify)'] },
                    trainingTitle: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING },
                    justification: { type: Type.STRING },
                },
                required: ["division", "fundingSource", "trainingTitle", "targetAudience", "estimatedCost", "justification"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "year", "trainingPlan", "summary", "successionPlan"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="pt-4 mb-4">
        <h2 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 pb-1">{title}</h2>
        <div className="text-slate-700 dark:text-slate-300 text-sm space-y-2">{children}</div>
    </div>
);


export const AnnualTrainingPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiAnnualTrainingPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis and recommendations should be specifically tailored for the '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis and recommendations should be specifically tailored for a '${agencyType}'.`;
        }
        return 'The analysis and recommendations should be general and applicable to all types of public service agencies.';
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
                const promptText = `Please analyze the following CNA data to generate a consolidated Annual Training Plan for 2026.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_ANNUAL_TRAINING_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAnnualTrainingPlanSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiAnnualTrainingPlan;
                setReport(parsedReport);
            } catch (e) {
                console.error("AI Annual Training Plan Report Error:", e);
                setError("An error occurred while generating the AI analysis for the annual training plan.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");

        const planTable = {
            type: 'table' as const,
            headers: ['Division', 'Training Title', 'Target Audience', 'Funding Source', 'Estimated Cost (PGK)', 'Justification'],
            rows: report.trainingPlan.map(item => [
                item.division,
                item.trainingTitle,
                item.targetAudience,
                item.fundingSource,
                item.estimatedCost,
                item.justification
            ])
        };

        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            { title: `Annual Training Plan - ${report.year}`, content: [planTable], orientation: 'landscape' }
        ];

        if (report.successionPlan) {
            sections.push({
                title: "Succession Planning",
                content: [{
                    type: 'table',
                    headers: ['Role / Position', 'Potential Successor(s)', 'Readiness Level', 'Development Needs / Actions', 'Estimated Timeline'],
                    rows: report.successionPlan.map(plan => [
                        plan.roleOrPosition,
                        plan.potentialSuccessors.join(', '),
                        plan.readinessLevel,
                        plan.developmentNeeds,
                        plan.estimatedTimeline
                    ])
                }],
                orientation: 'landscape'
            });
        }
        
        return {
            title: `Annual Training Plan - ${report.year}`,
            sections
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-yellow-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating Annual Plan...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing CNA data to create the training plan for 2026.</p>
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
                <div className="p-4 bg-white dark:bg-slate-900">
                    <h1 className="text-center font-bold text-lg mb-4 text-slate-900 dark:text-white uppercase tracking-wider">{`Annual Training Plan - ${report.year}`}</h1>
                    
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                    
                    <ReportSection title="Detailed Training Plan">
                        <div className="overflow-x-auto border border-slate-300 dark:border-slate-600">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    <tr>
                                        {['Division', 'Training Title', 'Target Audience', 'Funding Source', 'Estimated Cost (PGK)', 'Justification'].map(h => 
                                            <th key={h} className="p-1 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.trainingPlan.map((item, index) => (
                                        <tr key={index} className="bg-white dark:bg-slate-900">
                                            <td className="p-1 border border-slate-300 dark:border-slate-600">{item.division}</td>
                                            <td className="p-1 border border-slate-300 dark:border-slate-600 font-semibold">{item.trainingTitle}</td>
                                            <td className="p-1 border border-slate-300 dark:border-slate-600">{item.targetAudience}</td>
                                            <td className="p-1 border border-slate-300 dark:border-slate-600">{item.fundingSource}</td>
                                            <td className="p-1 border border-slate-300 dark:border-slate-600">{item.estimatedCost}</td>
                                            <td className="p-1 border border-slate-300 dark:border-slate-600">{item.justification}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>

                    {report.successionPlan && (
                        <ReportSection title="Succession Planning">
                            <div className="overflow-x-auto border border-slate-300 dark:border-slate-600">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            {['Role / Position', 'Potential Successor(s)', 'Readiness Level', 'Development Needs / Actions', 'Estimated Timeline'].map(h =>
                                             <th key={h} className="p-1 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.successionPlan.map((plan, index) => (
                                            <tr key={index} className="bg-white dark:bg-slate-900">
                                                <td className="p-1 border border-slate-300 dark:border-slate-600 font-semibold">{plan.roleOrPosition}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{plan.potentialSuccessors.join(', ')}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{plan.readinessLevel}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{plan.developmentNeeds}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{plan.estimatedTimeline}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ReportSection>
                    )}
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
                        <ChartBarSquareIcon className="w-7 h-7 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Annual Training Plan</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};
