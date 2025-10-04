import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiFiveYearPlan, AgencyType, AiReportSummary, EmployeeTrainingPlan, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_FIVE_YEAR_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, CalendarDaysIcon } from './icons';
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

const aiFiveYearPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        trainingPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    proposedCourse: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    fundingSource: { type: Type.STRING },
                    trainingYear: { type: Type.NUMBER },
                },
                required: ["division", "positionNumber", "grade", "designation", "occupant", "proposedCourse", "institution", "fundingSource", "trainingYear"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "trainingPlan", "summary", "successionPlan"],
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

export const FiveYearPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiFiveYearPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const yearHeaders = [2025, 2026, 2027, 2028, 2029];

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

Please analyze the following Capability Needs Analysis (CNA) survey data and generate a five-year plan. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_FIVE_YEAR_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiFiveYearPlanSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiFiveYearPlan;
                
                // Sort the data as requested by the AI prompt
                parsedReport.trainingPlan.sort((a, b) => {
                    const courseCompare = a.proposedCourse.localeCompare(b.proposedCourse);
                    if (courseCompare !== 0) return courseCompare;

                    const divisionCompare = a.division.localeCompare(b.division);
                    if (divisionCompare !== 0) return divisionCompare;

                    const institutionCompare = a.institution.localeCompare(b.institution);
                    if (institutionCompare !== 0) return institutionCompare;
                    
                    const fundingCompare = a.fundingSource.localeCompare(b.fundingSource);
                    if (fundingCompare !== 0) return fundingCompare;

                    return a.trainingYear - b.trainingYear;
                });

                setReport(parsedReport);

            } catch (e) {
                console.error("5-Year Plan Error:", e);
                setError("An error occurred while generating the system analysis for the 5-year plan. Please check the console for details or try again.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
    
        const trainingPlanTable = {
            type: 'table' as const,
            headers: ['Proposed Training Course', 'Division', 'Institution', 'Funding Source', 'Occupant', 'Designation', 'Grade', ...yearHeaders.map(String)],
            rows: report.trainingPlan.map(plan => [
                plan.proposedCourse,
                plan.division,
                plan.institution,
                plan.fundingSource,
                plan.occupant,
                plan.designation,
                plan.grade,
                ...yearHeaders.map(year => (plan.trainingYear === year ? '✓' : ''))
            ]),
        };
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary], orientation: 'portrait' },
            { title: "Detailed 5-Year L&D Training Plan", content: [trainingPlanTable], orientation: 'landscape' }
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
                ],
                orientation: 'portrait'
            });
        }

        return {
            title: "Strategic Five-Year Training Plan",
            sections
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf':
                    exportToPdf(reportData);
                    break;
                case 'docx':
                    exportToDocx(reportData);
                    break;
                case 'xlsx':
                    exportToXlsx(reportData);
                    break;
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
                    <SparklesIcon className="w-16 h-16 text-amber-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Forecasting 5-Year Plan</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">The system is analyzing long-term trends and building the strategic roadmap...</p>
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
                <>
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                    <ReportSection title="Detailed 5-Year L&D Training Plan">
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-200 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-2 font-semibold">Proposed Training Course</th>
                                        <th className="p-2 font-semibold">Division</th>
                                        <th className="p-2 font-semibold">Institution</th>
                                        <th className="p-2 font-semibold">Funding Source</th>
                                        <th className="p-2 font-semibold">Occupant</th>
                                        <th className="p-2 font-semibold">Designation</th>
                                        <th className="p-2 font-semibold">Grade</th>
                                        {yearHeaders.map(year => <th key={year} className="p-2 font-semibold text-center">{year}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.trainingPlan.map((plan, index) => (
                                        <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-2 font-semibold">{plan.proposedCourse}</td>
                                            <td className="p-2">{plan.division}</td>
                                            <td className="p-2">{plan.institution}</td>
                                            <td className="p-2">{plan.fundingSource}</td>
                                            <td className="p-2 font-semibold">{plan.occupant}</td>
                                            <td className="p-2">{plan.designation}</td>
                                            <td className="p-2">{plan.grade}</td>
                                            {yearHeaders.map(year => (
                                                <td key={year} className="p-2 text-center">
                                                    {plan.trainingYear === year && (
                                                        <span className="text-green-600 font-bold text-lg" title={`Scheduled for ${year}`}>✓</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                </>
            );
        }
        
        return null;
    }


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-full lg:max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <CalendarDaysIcon className="w-7 h-7 text-amber-600" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System-Generated 5-Year L&D Plan</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by the system. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};