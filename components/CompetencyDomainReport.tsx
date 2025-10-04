import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiCompetencyReport, AgencyType, AiReportSummary, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_COMPETENCY_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, AcademicCapIcon } from './icons';
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

const aiCompetencyReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of the competency analysis findings." },
        capabilityMaturitySummary: { type: Type.STRING, description: "A summary of organizational capability maturity, framed within the PNG public sector context, referencing challenges like geographic dispersion and resource constraints." },
        domains: {
            type: Type.ARRAY,
            description: "An array of objects, one for each competency domain.",
            items: {
                type: Type.OBJECT,
                properties: {
                    domainName: { type: Type.STRING, description: "The name of the competency domain." },
                    description: { type: Type.STRING, description: "A brief explanation of the domain's relevance." },
                    currentProficiency: { type: Type.NUMBER, description: "An aggregated score from 1 to 10 representing the current state." },
                    desiredProficiency: { type: Type.NUMBER, description: "An aggregated score from 1 to 10 representing the desired state (should always be 10)." },
                    strengths: {
                        type: Type.ARRAY,
                        description: "An array of strings detailing identified strengths.",
                        items: { type: Type.STRING }
                    },
                    gaps: {
                        type: Type.ARRAY,
                        description: "An array of strings detailing identified capability gaps.",
                        items: { type: Type.STRING }
                    },
                    recommendations: { type: Type.STRING, description: "High-level recommendations for bridging the gaps in this domain." }
                },
                required: ["domainName", "description", "currentProficiency", "desiredProficiency", "strengths", "gaps", "recommendations"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "capabilityMaturitySummary", "domains", "summary", "successionPlan"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const SummarySection: React.FC<{ summary: AiReportSummary | undefined }> = ({ summary }) => {
    if (!summary) return null;

    return (
        <ReportSection title="Key Insights Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-200/50 dark:bg-blue-950/50 rounded-lg text-center">
                    <p className="text-3xl font-bold">{summary.totalGapsDetected}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Total Gaps Detected</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-blue-950/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.criticalGapsCount}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Critical Gaps (Priority)</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-blue-950/50 rounded-lg">
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
                <div className="p-3 bg-slate-200/50 dark:bg-blue-950/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Top 3 Improvement Areas</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {summary.topImprovementAreas?.map(area => (
                            <li key={area.area}><strong>{area.area}:</strong> {area.reason}</li>
                        ))}
                    </ul>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-blue-950/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Concluding Recommendation</h4>
                    <p className="text-sm italic">{summary.concludingIntervention}</p>
                </div>
            </div>
        </ReportSection>
    );
};

const ProficiencyBar: React.FC<{ current: number; desired: number }> = ({ current, desired }) => {
    const currentPercentage = (current / 10) * 100;
    const desiredPercentage = (desired / 10) * 100;
    const gapScore = desired - current;
    const gapPercentage = (gapScore / 10) * 100;

    const getGapCategory = (score: number) => {
        if (score <= 1) return { text: 'No Gap', color: 'text-green-600 dark:text-green-400' };
        if (score <= 2) return { text: 'Minor Gap', color: 'text-amber-600 dark:text-amber-400' };
        if (score <= 5) return { text: 'Moderate Gap', color: 'text-orange-600 dark:text-orange-400' };
        return { text: 'Critical Gap', color: 'text-red-600 dark:text-red-400' };
    };
    const category = getGapCategory(gapScore);


    return (
        <div className="my-2">
            <div className="w-full bg-slate-200 dark:bg-blue-800 rounded-full h-5 relative">
                <div
                    className="bg-slate-400/50 dark:bg-slate-500/50 h-5 rounded-full absolute top-0"
                    style={{ width: `${desiredPercentage}%` }}
                    title={`Desired: ${desired}/10`}
                ></div>
                <div
                    className="bg-blue-600 h-5 rounded-l-full relative"
                    style={{ width: `${currentPercentage}%` }}
                    title={`Current: ${current}/10`}
                ></div>
                <div className="absolute w-full h-full top-0 flex justify-between items-center px-2 text-xs text-white font-bold">
                    <span className="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">{current.toFixed(1)}</span>
                    <span className="text-slate-800 dark:text-slate-200 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">{desired.toFixed(1)}</span>
                </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                <span>Gap: <span className="font-bold text-red-600 dark:text-red-400">{gapPercentage.toFixed(0)}%</span></span>
                <span className={`font-semibold ${category.color}`}>{category.text}</span>
            </div>
        </div>
    );
};

export const CompetencyDomainReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiCompetencyReport | null>(null);
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

Please analyze the following Capability Needs Analysis (CNA) survey data and generate a Competency Domain Analysis Report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_COMPETENCY_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiCompetencyReportSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiCompetencyReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("Competency Report Error:", e);
                setError("An error occurred while generating the system analysis for the competency report. Please check the console for details or try again.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        
        const domainSections = report.domains.map(domain => ({
            title: domain.domainName,
            content: [
                domain.description,
                `Current Proficiency: ${domain.currentProficiency.toFixed(1)}/10, Desired: ${domain.desiredProficiency.toFixed(1)}/10`,
                `Strengths:\n${domain.strengths.map(s => `- ${s}`).join('\n')}`,
                `Gaps:\n${domain.gaps.map(g => `- ${g}`).join('\n')}`,
                `Recommendations:\n${domain.recommendations}`,
            ]
        }));

        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            { title: "Organisational Capability Maturity", content: [report.capabilityMaturitySummary] },
            ...domainSections
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
            title: "Competency Domain Analysis Report",
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
                    <SparklesIcon className="w-16 h-16 text-teal-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Analyzing Competencies</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">The system is mapping CNA data to competency domains...</p>
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

                    <ReportSection title="Organisational Capability Maturity">
                        <p className="italic text-slate-600 dark:text-slate-400">{report.capabilityMaturitySummary}</p>
                    </ReportSection>
                    
                    {report.domains.map(domain => (
                        <ReportSection key={domain.domainName} title={domain.domainName}>
                             <p className="mb-4">{domain.description}</p>
                             <ProficiencyBar current={domain.currentProficiency} desired={domain.desiredProficiency} />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                 <div>
                                     <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">Strengths</h4>
                                     <ul className="list-disc list-inside space-y-1">
                                         {domain.strengths.map((item, i) => <li key={i}>{item}</li>)}
                                     </ul>
                                 </div>
                                  <div>
                                     <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-300">Capability Gaps</h4>
                                     <ul className="list-disc list-inside space-y-1">
                                         {domain.gaps.map((item, i) => <li key={i}>{item}</li>)}
                                     </ul>
                                 </div>
                             </div>
                             <div className="mt-4">
                                <h4 className="font-semibold mb-2">Recommendations</h4>
                                <p>{domain.recommendations}</p>
                             </div>
                        </ReportSection>
                    ))}
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
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-7 h-7 text-teal-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Competency Domain Analysis</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 sm:p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by the system. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};