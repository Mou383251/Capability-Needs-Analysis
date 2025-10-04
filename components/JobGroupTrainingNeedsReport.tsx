import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiJobGroupTrainingNeedsReport, AgencyType, AiReportSummary, JobGroup, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_JOB_GROUP_TRAINING_NEEDS_PROMPT_INSTRUCTIONS } from '../constants';
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
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "jobGroupNeeds", "summary", "successionPlan"]
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

const JobGroupCard: React.FC<{ group: AiJobGroupTrainingNeedsReport['jobGroupNeeds'][0] }> = ({ group }) => {
    const yearHeaders = [2025, 2026, 2027, 2028, 2029];
    
    const groupColors: Record<JobGroup, string> = {
        'Senior Executive Managers': 'border-red-500/50',
        'Supervisors': 'border-orange-500/50',
        'Administration': 'border-amber-500/50',
        'Finance': 'border-lime-500/50',
        'Economics': 'border-green-500/50',
        'ICT Officers': 'border-cyan-500/50',
        'Field Officers': 'border-blue-500/50',
        'Executive Secretaries': 'border-violet-500/50',
        'Support Staff': 'border-slate-500/50',
    };

    return (
        <div className={`rounded-lg border-l-4 p-4 bg-white dark:bg-slate-800/50 shadow-sm border border-slate-200 dark:border-slate-700 ${groupColors[group.jobGroup]}`}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{group.jobGroup}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-1 mb-3">{group.description}</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-200 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-2 font-semibold">Skill / Training Need</th>
                            <th className="p-2 font-semibold">Rationale</th>
                            {yearHeaders.map(year => <th key={year} className="p-2 font-semibold text-center">{year}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {group.identifiedNeeds.map((need, index) => (
                            <tr key={index} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <td className="p-2 font-semibold">{need.skill}</td>
                                <td className="p-2">{need.rationale}</td>
                                {yearHeaders.map(year => (
                                    <td key={year} className="p-2 text-center">
                                        {need.recommendedYear === year && (
                                            <span className="text-green-600 font-bold text-lg" title={`Recommended for ${year}`}>✓</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                         {group.identifiedNeeds.length === 0 && (
                            <tr><td colSpan={2 + yearHeaders.length} className="text-center p-4 italic text-slate-500">No specific training needs prioritized for this group based on current data.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const JobGroupTrainingNeedsReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiJobGroupTrainingNeedsReport | null>(null);
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
                console.error("AI Job Group Needs Report Error:", e);
                setError("An error occurred while generating the AI analysis for the job group needs report.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("AI report not available");
        
        const yearHeaders = [2025, 2026, 2027, 2028, 2029].map(String);
        
        const tableRows = report.jobGroupNeeds.flatMap(group => 
            group.identifiedNeeds.map(need => [
                group.jobGroup,
                need.skill,
                need.rationale,
                ...yearHeaders.map(year => (need.recommendedYear === parseInt(year) ? '✓' : ''))
            ])
        );

        const mainTable = {
            type: 'table' as const,
            headers: ['Job Group', 'Skill', 'Rationale', ...yearHeaders],
            rows: tableRows,
        };
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            { title: "Training Needs Plan (2025-2029)", content: [mainTable], orientation: 'landscape' }
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
            title: "Training Needs by Job Group",
            sections
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
                    <SparklesIcon className="w-16 h-16 text-yellow-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Analyzing Needs by Job Group</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is clustering officers and identifying group-specific training priorities...</p>
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
            const groupOrder: JobGroup[] = [
                'Senior Executive Managers',
                'Supervisors',
                'Administration',
                'Finance',
                'Economics',
                'ICT Officers',
                'Field Officers',
                'Executive Secretaries',
                'Support Staff'
            ];
            return (
                 <div className="space-y-6">
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                    
                    <div className="space-y-4">
                        {report.jobGroupNeeds.sort((a,b) => groupOrder.indexOf(a.jobGroup) - groupOrder.indexOf(b.jobGroup)).map(group => (
                           <JobGroupCard key={group.jobGroup} group={group} />
                        ))}
                    </div>

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
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-yellow-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Training Needs by Job Group</h1>
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