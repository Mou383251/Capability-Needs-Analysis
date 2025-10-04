import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiStrategicRecommendationsReport, AgencyType, AiReportSummary, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_STRATEGIC_RECOMMENDATIONS_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, LightBulbIcon } from './icons';
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

const aiStrategicRecsReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        estimatedROI: {
            type: Type.OBJECT,
            properties: {
                statement: { type: Type.STRING },
                metrics: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["statement", "metrics"]
        },
        strategicAlignment: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                recommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            principle: { type: Type.STRING },
                            action: { type: Type.STRING }
                        },
                        required: ["principle", "action"]
                    }
                },
                policyMisalignments: { type: Type.STRING },
                workforceRisks: { type: Type.STRING }
            },
            required: ["summary", "recommendations", "policyMisalignments", "workforceRisks"]
        },
        investmentPriorities: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    priority: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                },
                required: ["priority", "rationale"]
            }
        },
        systemsIntegration: {
            type: Type.OBJECT,
            properties: {
                recommendation: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["recommendation", "steps"]
        },
        recommendedFormats: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    format: { type: Type.STRING },
                    context: { type: Type.STRING }
                },
                required: ["format", "context"]
            }
        },
        individualLearningPlans: {
            type: Type.OBJECT,
            properties: {
                importance: { type: Type.STRING },
                implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["importance", "implementationSteps"]
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "estimatedROI", "strategicAlignment", "investmentPriorities", "systemsIntegration", "recommendedFormats", "individualLearningPlans", "summary", "successionPlan"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const SummarySection: React.FC<{ summary: AiReportSummary | undefined }> = ({ summary }) => {
    if (!summary) return null;

    return (
        <ReportSection title="Key Insights Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold">{summary.totalGapsDetected}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Total Gaps Detected</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.criticalGapsCount}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Critical Gaps (Priority)</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 text-center uppercase text-slate-500">Staff Categories</h4>
                    <div className="flex justify-around text-xs">
                        {summary.staffCategoryDistribution?.map(cat => (
                            <div key={cat.category} className="text-center">
                                <p className="font-bold text-lg">{cat.count}</p>
                                <p className="text-xs">{cat.category.replace(' Candidate', '')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Top 3 Improvement Areas</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {summary.topImprovementAreas?.map(area => (
                            <li key={area.area}><strong>{area.area}:</strong> {area.reason}</li>
                        ))}
                    </ul>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Concluding Recommendation</h4>
                    <p className="text-sm italic">{summary.concludingIntervention}</p>
                </div>
            </div>
        </ReportSection>
    );
};


export const StrategicRecommendationsReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiStrategicRecommendationsReport | null>(null);
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
                setError("API key is not configured. Please set the API_KEY environment variable.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const promptText = `You MUST use this mapping to understand the question codes in the data.
QUESTION MAPPING:
${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}

Please analyze the following Capability Needs Analysis (CNA) survey data and generate a Strategic L&D Recommendations Report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_STRATEGIC_RECOMMENDATIONS_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiStrategicRecsReportSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiStrategicRecommendationsReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("Strategic Recommendations Report Error:", e);
                setError("An error occurred while generating the system analysis for the strategic recommendations report. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            {
                title: "Estimated ROI",
                content: [
                    report.estimatedROI.statement,
                    `Key Metrics:\n${report.estimatedROI.metrics.map(m => `- ${m}`).join('\n')}`
                ]
            },
             {
                title: "Strategic HR Alignment",
                content: [
                    report.strategicAlignment.summary,
                     {
                        type: 'table',
                        headers: ['SHRM Principle', 'Action/Recommendation'],
                        rows: report.strategicAlignment.recommendations.map(r => [r.principle, r.action])
                    },
                    `Policy Misalignments:\n${report.strategicAlignment.policyMisalignments}`,
                    `Workforce Risks:\n${report.strategicAlignment.workforceRisks}`
                ]
            },
            {
                title: "Investment Priorities",
                content: [{
                    type: 'table',
                    headers: ['Priority Area', 'Rationale'],
                    rows: report.investmentPriorities.map(p => [p.priority, p.rationale])
                }]
            },
            {
                title: "Systems Integration (TNA & SPA)",
                content: [
                    report.systemsIntegration.recommendation,
                    `Implementation Steps:\n${report.systemsIntegration.steps.map(s => `- ${s}`).join('\n')}`
                ]
            },
            {
                title: "Recommended Training Formats (PNG Context)",
                content: [{
                    type: 'table',
                    headers: ['Format', 'Context / Best Use Case'],
                    rows: report.recommendedFormats.map(f => [f.format, f.context])
                }]
            },
            {
                title: "Individual Learning Plans",
                content: [
                    report.individualLearningPlans.importance,
                    `Implementation Steps:\n${report.individualLearningPlans.implementationSteps.map(s => `- ${s}`).join('\n')}`
                ]
            }
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

        if (report.summary) {
            sections.push({
                title: "Key Insights Summary",
                content: [
                    `Total Gaps Detected: ${report.summary.totalGapsDetected}`,
                    `Critical Gaps Count: ${report.summary.criticalGapsCount}`,
                    `Staff Distribution: ${report.summary.staffCategoryDistribution.map(s => `${s.category}: ${s.count}`).join(', ')}`,
                    `Top Improvement Areas:\n${report.summary.topImprovementAreas.map(s => `- ${s.area}: ${s.reason}`).join('\n')}`,
                    `Concluding Intervention: ${report.summary.concludingIntervention}`
                ]
            });
        }
        
        return {
            title: "Strategic Recommendations Report",
            sections,
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
                    <SparklesIcon className="w-16 h-16 text-pink-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Developing Strategy</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">The system is formulating high-level recommendations...</p>
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
                     <ReportSection title="Estimated Return on Investment (ROI)">
                        <p>{report.estimatedROI.statement}</p>
                        <h4 className="font-bold mt-3 mb-1">Key Metrics to Track:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {report.estimatedROI.metrics.map((metric, i) => <li key={i}>{metric}</li>)}
                         </ul>
                    </ReportSection>
                     <ReportSection title="Strategic HR & GESI Alignment">
                        <p>{report.strategicAlignment.summary}</p>
                        <div className="overflow-x-auto mt-4">
                           <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="p-2 font-semibold">SHRM Principle</th>
                                        <th className="p-2 font-semibold">Action/Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.strategicAlignment.recommendations.map((item, i) => (
                                         <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-semibold">{item.principle}</td>
                                            <td className="p-2">{item.action}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <h4 className="font-bold mt-4 mb-1">Potential Policy Misalignments</h4>
                        <p>{report.strategicAlignment.policyMisalignments}</p>
                        <h4 className="font-bold mt-4 mb-1">Identified Workforce Risks</h4>
                        <p>{report.strategicAlignment.workforceRisks}</p>
                    </ReportSection>
                     <ReportSection title="L&D Investment Priorities">
                        <ul className="space-y-3">
                        {report.investmentPriorities.map((item, i) => (
                            <li key={i} className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-md">
                                <p className="font-semibold">{item.priority}</p>
                                <p className="text-xs italic text-slate-500">{item.rationale}</p>
                            </li>
                        ))}
                        </ul>
                    </ReportSection>
                     <ReportSection title="Systems Integration: TNA & SPA">
                         <p className="font-semibold">{report.systemsIntegration.recommendation}</p>
                         <h4 className="font-bold mt-3 mb-1">Implementation Steps:</h4>
                         <ul className="list-decimal list-inside space-y-1">
                            {report.systemsIntegration.steps.map((step, i) => <li key={i}>{step}</li>)}
                         </ul>
                    </ReportSection>
                     <ReportSection title="Recommended Training Formats (PNG Context)">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="p-2 font-semibold">Format</th>
                                        <th className="p-2 font-semibold">Context / Best Use Case</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.recommendedFormats.map((item, i) => (
                                         <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                                            <td className="p-2 font-semibold text-blue-600 dark:text-blue-400">{item.format}</td>
                                            <td className="p-2">{item.context}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                    <ReportSection title="Individual Learning Plans">
                         <p className="font-semibold">{report.individualLearningPlans.importance}</p>
                         <h4 className="font-bold mt-3 mb-1">Implementation Steps:</h4>
                         <ul className="list-decimal list-inside space-y-1">
                            {report.individualLearningPlans.implementationSteps.map((step, i) => <li key={i}>{step}</li>)}
                         </ul>
                    </ReportSection>
                    {report.successionPlan && (
                        <ReportSection title="Succession Planning">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-200 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="p-2 font-semibold">Role / Position</th>
                                            <th className="p-2 font-semibold">Potential Successor(s)</th>
                                            <th className="p-2 font-semibold">Readiness Level</th>
                                            <th className="p-2 font-semibold">Development Needs / Actions</th>
                                            <th className="p-2 font-semibold">Estimated Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.successionPlan.map((plan, index) => (
                                            <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="p-2 font-semibold">{plan.roleOrPosition}</td>
                                                <td className="p-2">{plan.potentialSuccessors.join(', ')}</td>
                                                <td className="p-2">{plan.readinessLevel}</td>
                                                <td className="p-2">{plan.developmentNeeds}</td>
                                                <td className="p-2">{plan.estimatedTimeline}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ReportSection>
                    )}
                    <SummarySection summary={report.summary} />
                </div>
            );
        }
        
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <LightBulbIcon className="w-7 h-7 text-pink-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strategic L&D Recommendations</h1>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by the system. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};