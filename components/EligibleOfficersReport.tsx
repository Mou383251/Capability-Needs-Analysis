import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiEligibleOfficersReport, AgencyType, EstablishmentRecord, AiReportSummary, QUESTION_TEXT_MAPPING, EligibleOfficer, SuccessionCandidate } from '../types';
import { AI_ELIGIBLE_OFFICERS_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ClipboardDocumentListIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
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

const aiEligibleOfficersReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        eligibleOfficers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    branch: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Confirmed', 'Probation', 'Other', 'Acting', 'Unattached', 'Displaced', 'Vacant'] },
                    cnaSubmission: { type: Type.STRING, enum: ['Yes', 'No'] },
                    beenSentForStudies: { type: Type.STRING, enum: ['Yes', 'No'] },
                    studiedWhere: { type: Type.STRING },
                    courseDetails: { type: Type.STRING },
                    trainingYear: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                },
                required: ["branch", "positionNumber", "grade", "designation", "occupant", "status", "cnaSubmission", "beenSentForStudies", "studiedWhere", "courseDetails", "trainingYear"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "eligibleOfficers", "summary", "successionPlan"],
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">{children}</div>
    </div>
);

export const EligibleOfficersReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiEligibleOfficersReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    const yearHeaders = [2025, 2026, 2027, 2028, 2029];
    
    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for the '${agencyName}', a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general for all public service agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            if (!establishmentData || establishmentData.length === 0) {
                 setError("No establishment data available to generate this report. Please import your data first.");
                 setLoading(false);
                 return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following CNA and Establishment data to generate an Eligible Officers Report.\n\nCONTEXT: ${promptContext}\n\nCNA DATA (for submission status & needs):\n${JSON.stringify(data, null, 2)}\n\nESTABLISHMENT DATA (for officer list):\n${JSON.stringify(establishmentData, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_ELIGIBLE_OFFICERS_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiEligibleOfficersReportSchema,
                    },
                });
                const parsedReport = JSON.parse(response.text.trim()) as AiEligibleOfficersReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("AI Eligible Officers Report Error:", e);
                setError("An error occurred while generating the AI analysis for the eligible officers report.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, establishmentData, promptContext]);
    
    const filteredOfficers = useMemo(() => {
        if (!report?.eligibleOfficers) return [];
        const lowerCaseFilter = filter.toLowerCase();
        return report.eligibleOfficers.filter(officer => 
            Object.values(officer).some(val => 
                String(val).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [report, filter]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("AI report not available");
        
        const tableHeaders = ['Branch/Division', 'Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submission', 'Previously Sent for Training', 'Institution', 'Course Name', ...yearHeaders.map(String)];
        
        const tableRows = filteredOfficers.map(o => [
            o.branch, o.positionNumber, o.grade, o.designation, o.occupant, o.status, o.cnaSubmission,
            o.beenSentForStudies, o.studiedWhere, o.courseDetails,
            ...yearHeaders.map(year => (o.trainingYear.includes(year) ? '✓' : ''))
        ]);

        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            { title: "Eligible Officers List", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }], orientation: 'landscape' }
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
            title: "Eligible Officers for Training Summary",
            sections
        };
    };
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
                case 'csv': exportToCsv(reportData); break;
                case 'sheets': copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(err.toString())); break;
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
                    <SparklesIcon className="w-16 h-16 text-cyan-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Analyzing Eligibility...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is cross-referencing CNA and establishment data...</p>
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
                    <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{`Eligible Officers (${filteredOfficers.length})`}</h2>
                            <input
                                type="text"
                                placeholder="Filter results..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full max-w-sm p-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-200 dark:bg-gray-700/50">
                                    <tr>
                                        {['Branch/Division', 'Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submission', 'Previously Sent for Training', 'Institution', 'Course Name', ...yearHeaders].map(h => 
                                            <th key={h} className="p-2 font-semibold">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOfficers.map((officer, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="p-2">{officer.branch}</td>
                                            <td className="p-2">{officer.positionNumber}</td>
                                            <td className="p-2">{officer.grade}</td>
                                            <td className="p-2 font-semibold">{officer.designation}</td>
                                            <td className="p-2">{officer.occupant}</td>
                                            <td className="p-2">{officer.status}</td>
                                            <td className="p-2">{officer.cnaSubmission}</td>
                                            <td className="p-2">{officer.beenSentForStudies}</td>
                                            <td className="p-2">{officer.studiedWhere}</td>
                                            <td className="p-2">{officer.courseDetails}</td>
                                            {yearHeaders.map(year => (
                                                <td key={year} className="p-2 text-center text-green-600 font-bold">
                                                    {officer.trainingYear.includes(year) ? '✓' : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredOfficers.length === 0 && <p className="text-center p-8 text-gray-500">No officers match the current filter.</p>}
                        </div>
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
                        <ClipboardDocumentListIcon className="w-7 h-7 text-cyan-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Eligible Officers Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
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