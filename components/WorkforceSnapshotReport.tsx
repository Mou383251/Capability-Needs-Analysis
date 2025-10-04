import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiWorkforceSnapshotReport, AgencyType, AiLearningSolution, AiReportSummary, PerformanceRatingLevel, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_WORKFORCE_SNAPSHOT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, CameraIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiLearningSolutionSchema = {
    type: Type.OBJECT,
    properties: {
        experiential70: { type: Type.STRING },
        social20: { type: Type.STRING },
        formal10: { type: Type.STRING },
    },
    required: ["experiential70", "social20", "formal10"]
};

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

const aiWorkforceSnapshotSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        workforceDistribution: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, enum: ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level', 'Not Rated'] },
                    count: { type: Type.NUMBER },
                    percentage: { type: Type.NUMBER },
                },
                 required: ["category", "count", "percentage"],
            }
        },
        competencyAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    domain: { type: Type.STRING },
                    averageCurrentScore: { type: Type.NUMBER },
                    averageDesiredScore: { type: Type.NUMBER },
                    keyFinding: { type: Type.STRING },
                },
                 required: ["domain", "averageCurrentScore", "averageDesiredScore", "keyFinding"],
            }
        },
        mostCommonLearningGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    gap: { type: Type.STRING },
                    frequency: { type: Type.NUMBER },
                },
                 required: ["gap", "frequency"],
            }
        },
        recommendedLdFocusAreas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    learningSolution: aiLearningSolutionSchema,
                },
                required: ["area", "rationale", "learningSolution"],
            }
        },
        strategicAlignmentInsights: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                gesiFocus: { type: Type.STRING },
                shrmFocus: { type: Type.STRING },
            },
            required: ["summary", "gesiFocus", "shrmFocus"],
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "workforceDistribution", "competencyAnalysis", "mostCommonLearningGaps", "recommendedLdFocusAreas", "strategicAlignmentInsights", "summary", "successionPlan"]
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

const ProficiencyBar: React.FC<{ current: number; desired: number; max?: number }> = ({ current, desired, max = 10 }) => {
    const currentPercentage = (current / max) * 100;
    const desiredPercentage = (desired / max) * 100;
    const gapScore = desired - current;
    const gapPercentage = (gapScore / max) * 100;

    const getGapCategory = (score: number) => {
        if (score <= 1) return { text: 'No Gap', color: 'text-green-600 dark:text-green-400' };
        if (score <= 2) return { text: 'Minor Gap', color: 'text-amber-600 dark:text-amber-400' };
        if (score <= 5) return { text: 'Moderate Gap', color: 'text-orange-600 dark:text-orange-400' };
        return { text: 'Critical Gap', color: 'text-red-600 dark:text-red-400' };
    };
    const category = getGapCategory(gapScore);

    return (
        <div className="my-2">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-5 relative">
                <div className="bg-slate-400/50 dark:bg-slate-500/50 h-5 rounded-full absolute top-0" style={{ width: `${desiredPercentage}%` }} title={`Desired: ${desired.toFixed(1)}/${max}`}></div>
                <div className="bg-blue-600 h-5 rounded-l-full relative" style={{ width: `${currentPercentage}%` }} title={`Current: ${current.toFixed(1)}/${max}`}></div>
            </div>
             <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                <span>Gap: <span className="font-bold text-red-600 dark:text-red-400">{gapPercentage.toFixed(0)}%</span></span>
                <span className={`font-semibold ${category.color}`}>{category.text}</span>
            </div>
        </div>
    );
};

export const WorkforceSnapshotReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiWorkforceSnapshotReport | null>(null);
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

Please analyze the following aggregated CNA data and generate a Workforce Snapshot report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_WORKFORCE_SNAPSHOT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiWorkforceSnapshotSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiWorkforceSnapshotReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("AI Workforce Snapshot Report Error:", e);
                setError("An error occurred while generating the AI analysis for the workforce snapshot. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("AI report not available");
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            {
                title: "Workforce Performance Distribution",
                content: [{
                    type: 'table',
                    headers: ['Category', 'Number of Officers', 'Percentage of Workforce'],
                    rows: report.workforceDistribution.map(d => [d.category, d.count, `${d.percentage.toFixed(1)}%`])
                }]
            },
            {
                title: "Competency Domain Analysis",
                content: [{
                    type: 'table',
                    headers: ['Domain', 'Avg. Current', 'Avg. Desired', 'Key Finding'],
                    rows: report.competencyAnalysis.map(c => [c.domain, c.averageCurrentScore.toFixed(2), c.averageDesiredScore.toFixed(2), c.keyFinding])
                }]
            },
            {
                title: "Most Common Learning Gaps",
                content: [{
                    type: 'table',
                    headers: ['Gap', 'Frequency (% of workforce)'],
                    rows: report.mostCommonLearningGaps.map(g => [g.gap, `${g.frequency.toFixed(1)}%`])
                }]
            },
            {
                title: "Recommended L&D Focus Areas",
                content: report.recommendedLdFocusAreas.map(area => 
                    `${area.area}:\n- Rationale: ${area.rationale}\n- 70% Plan: ${area.learningSolution.experiential70}\n- 20% Plan: ${area.learningSolution.social20}\n- 10% Plan: ${area.learningSolution.formal10}`
                )
            },
            {
                title: "Strategic Alignment & HR Insights",
                content: [
                    report.strategicAlignmentInsights.summary,
                    `GESI Focus:\n${report.strategicAlignmentInsights.gesiFocus}`,
                    `SHRM Focus:\n${report.strategicAlignmentInsights.shrmFocus}`
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
            title: "Workforce Snapshot Report",
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
                    <SparklesIcon className="w-16 h-16 text-gray-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Creating Workforce Snapshot</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is aggregating and analyzing the entire dataset...</p>
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
            const distMap: Record<PerformanceRatingLevel, { style: string }> = {
                'Well Above Required': { style: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
                'Above Required': { style: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
                'At Required Level': { style: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
                'Below Required Level': { style: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
                'Well Below Required Level': { style: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
                'Not Rated': { style: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
            };

            return (
                 <div className="space-y-6">
                    <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                    
                    <ReportSection title="Workforce Performance Distribution">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {report.workforceDistribution.map(item => (
                                <div key={item.category} className={`p-4 rounded-lg text-center ${distMap[item.category as PerformanceRatingLevel]?.style || ''}`}>
                                    <p className="text-3xl font-bold">{item.count}</p>
                                    <p className="text-sm font-semibold">{item.category}</p>
                                    <p className="text-xs">({item.percentage.toFixed(1)}% of workforce)</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    <ReportSection title="Competency Domain Analysis">
                        <div className="space-y-4">
                            {report.competencyAnalysis.map(domain => (
                                <div key={domain.domain}>
                                    <h4 className="font-bold">{domain.domain}</h4>
                                    <ProficiencyBar current={domain.averageCurrentScore} desired={domain.averageDesiredScore} max={10} />
                                    <p className="text-xs italic">{domain.keyFinding}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    <ReportSection title="Top 5 Most Common Learning Gaps">
                        <ol className="list-decimal list-inside space-y-2">
                            {report.mostCommonLearningGaps.map(gap => (
                                <li key={gap.gap}>
                                    <span className="font-semibold">{gap.gap}</span> - <span className="text-sm text-slate-500">Affects ~{gap.frequency.toFixed(0)}% of the workforce</span>
                                </li>
                            ))}
                        </ol>
                    </ReportSection>

                    <ReportSection title="Recommended L&D Focus Areas">
                         <div className="space-y-4">
                            {report.recommendedLdFocusAreas.map(area => (
                                <div key={area.area} className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                                    <h4 className="font-semibold text-blue-700 dark:text-blue-400">{area.area}</h4>
                                    <p className="text-xs italic mt-1 mb-2">{area.rationale}</p>
                                    <div className="space-y-1 text-xs">
                                        <p><strong className="w-16 inline-block">70% Exp:</strong> {area.learningSolution.experiential70}</p>
                                        <p><strong className="w-16 inline-block">20% Social:</strong> {area.learningSolution.social20}</p>
                                        <p><strong className="w-16 inline-block">10% Formal:</strong> {area.learningSolution.formal10}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    <ReportSection title="Strategic Alignment & HR Insights">
                        <p className="mb-3">{report.strategicAlignmentInsights.summary}</p>
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">GESI Focus</h4>
                                <p>{report.strategicAlignmentInsights.gesiFocus}</p>
                            </div>
                            <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200">SHRM Focus</h4>
                                <p>{report.strategicAlignmentInsights.shrmFocus}</p>
                            </div>
                        </div>
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
                        <CameraIcon className="w-7 h-7 text-gray-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Powered Workforce Snapshot</h1>
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