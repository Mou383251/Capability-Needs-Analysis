import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiTalentSegmentationReport, AgencyType, AiReportSummary, PerformanceRatingLevel, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_TALENT_SEGMENTATION_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, IdentificationIcon } from './icons';
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

const aiTalentSegmentationReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of the workforce's talent distribution and the key strategic implications." },
        talentSegments: {
            type: Type.ARRAY,
            description: "An array of objects, one for each of the five segments.",
            items: {
                type: Type.OBJECT,
                properties: {
                    segmentName: { type: Type.STRING, enum: ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level', 'Not Rated'] },
                    description: { type: Type.STRING, description: "A brief explanation of what this segment represents." },
                    criteria: { type: Type.STRING, description: "The key factors used to cluster employees into this group." },
                    count: { type: Type.NUMBER, description: "The number of employees in the segment." },
                    percentage: { type: Type.NUMBER, description: "The percentage of the total workforce in this segment." },
                    representativeProfiles: {
                        type: Type.ARRAY,
                        description: "An array of 2-3 anonymized example profiles.",
                        items: { type: Type.STRING }
                    },
                    recommendedStrategies: {
                        type: Type.ARRAY,
                        description: "An array of recommended talent development strategies.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                strategy: { type: Type.STRING, description: "The recommended talent development action." },
                                rationale: { type: Type.STRING, description: "The rationale for the strategy in the PNG context." }
                            },
                            required: ["strategy", "rationale"]
                        }
                    }
                },
                required: ["segmentName", "description", "criteria", "count", "percentage", "representativeProfiles", "recommendedStrategies"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "talentSegments", "summary", "successionPlan"]
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

const SegmentCard: React.FC<{ segment: AiTalentSegmentationReport['talentSegments'][0] }> = ({ segment }) => {
    const colorStyles: Record<PerformanceRatingLevel, string> = {
        'Well Above Required': 'border-green-500/50 bg-green-50/50 dark:bg-green-900/10',
        'Above Required': 'border-teal-500/50 bg-teal-50/50 dark:bg-teal-900/10',
        'At Required Level': 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10',
        'Below Required Level': 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10',
        'Well Below Required Level': 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10',
        'Not Rated': 'border-slate-500/50 bg-slate-50/50 dark:bg-slate-900/10',
    };
     const titleColorStyles: Record<PerformanceRatingLevel, string> = {
        'Well Above Required': 'text-green-700 dark:text-green-300',
        'Above Required': 'text-teal-700 dark:text-teal-300',
        'At Required Level': 'text-amber-700 dark:text-amber-300',
        'Below Required Level': 'text-orange-700 dark:text-orange-300',
        'Well Below Required Level': 'text-red-700 dark:text-red-300',
        'Not Rated': 'text-slate-700 dark:text-slate-300',
    };

    return (
        <div className={`rounded-lg border-l-4 p-4 ${colorStyles[segment.segmentName]}`}>
            <h3 className={`text-lg font-bold ${titleColorStyles[segment.segmentName]}`}>{segment.segmentName}</h3>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{segment.count} Officers ({segment.percentage.toFixed(1)}%)</div>
            <p className="text-xs text-slate-500 italic mt-1 mb-3">{segment.description}</p>
            
            <div className="text-xs mb-3">
                <p className="font-bold">Clustering Criteria:</p>
                <p className="text-slate-600 dark:text-slate-400">{segment.criteria}</p>
            </div>

            <div className="text-xs mb-4">
                <p className="font-bold">Representative Profiles:</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400">
                    {segment.representativeProfiles.map((p,i) => <li key={i}>{p}</li>)}
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-2">Recommended Strategies (PNG Context)</h4>
                <ul className="space-y-3 text-sm">
                    {segment.recommendedStrategies.map((s,i) => (
                        <li key={i} className="p-2 bg-slate-100 dark:bg-slate-800/60 rounded-md">
                            <p className="font-semibold">{s.strategy}</p>
                            <p className="text-xs italic text-slate-500">{s.rationale}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


export const TalentSegmentationReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiTalentSegmentationReport | null>(null);
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

Please analyze the following Capability Needs Analysis (CNA) survey data and generate a Talent Segmentation Report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_TALENT_SEGMENTATION_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTalentSegmentationReportSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiTalentSegmentationReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("Talent Segmentation Report Error:", e);
                setError("An error occurred while generating the system analysis for the talent segmentation report. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");

        const segmentSections = report.talentSegments.map(segment => ({
            title: `Segment: ${segment.segmentName}`,
            content: [
                `Description: ${segment.description}`,
                `Count: ${segment.count} (${segment.percentage.toFixed(1)}%)`,
                `Criteria: ${segment.criteria}`,
                {
                    type: 'table' as const,
                    headers: ['Strategy', 'Rationale (PNG Context)'],
                    rows: segment.recommendedStrategies.map(s => [s.strategy, s.rationale])
                }
            ]
        }));
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            ...segmentSections
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
            title: "Talent Segmentation Report",
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
                    <SparklesIcon className="w-16 h-16 text-indigo-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Segmenting Talent Pools</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">The system is clustering staff based on performance and potential...</p>
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
            const order: PerformanceRatingLevel[] = ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level', 'Not Rated'];
            
            return (
                 <div className="space-y-6">
                    <ReportSection title="Executive Summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                     <ReportSection title="Talent Segments">
                        <div className="space-y-6">
                            {report.talentSegments.sort((a,b) => order.indexOf(a.segmentName) - order.indexOf(b.segmentName)).map(segment => (
                                <SegmentCard key={segment.segmentName} segment={segment} />
                            ))}
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
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <IdentificationIcon className="w-7 h-7 text-indigo-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Talent Segmentation Report</h1>
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