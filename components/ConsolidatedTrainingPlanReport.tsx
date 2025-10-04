import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

interface AiGeneratedContent {
    executiveSummary: string;
    conclusionAndRecommendations: string;
}

const aiConsolidatedStrategicPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of all findings, starting with the total number of respondents and the overall state of organizational capability." },
        conclusionAndRecommendations: { type: Type.STRING, description: "A concluding summary with 3-5 key, actionable bullet points for leadership." }
    },
    required: ["executiveSummary", "conclusionAndRecommendations"]
};

// --- Sub-Components for Rendering ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; anchorId: string }> = ({ title, children, anchorId }) => (
    <div className="pt-4 mb-4" id={anchorId}>
        <h2 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 pb-1">{title}</h2>
        <div className="text-slate-700 dark:text-slate-300 text-sm space-y-2">{children}</div>
    </div>
);


const CoverPage: React.FC<{ agencyName: string }> = ({ agencyName }) => (
    <div className="text-center mb-6">
        <h1 className="text-center font-bold text-xl mb-4 text-slate-900 dark:text-white uppercase tracking-wider">Consolidated Strategic Plan Report</h1>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{agencyName}</p>
    </div>
);

const TableOfContents: React.FC<{ sections: { id: string, title: string }[] }> = ({ sections }) => (
    <ReportSection title="Table of Contents" anchorId="toc">
        <ul className="list-none p-0 space-y-2">
            {sections.map(section => (
                <li key={section.id}>
                    <a href={`#${section.id}`} className="text-blue-600 hover:underline">{section.title}</a>
                </li>
            ))}
        </ul>
    </ReportSection>
);

// --- Main Component ---
export const ConsolidatedStrategicPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<AiGeneratedContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // --- Data Analysis Memos ---
    const organizationalProfile = useMemo(() => {
        const totalOfficers = data.length;
        const gradingGroups = data.reduce((acc: Record<string, number>, o: OfficerRecord) => {
            const group = o.gradingGroup || 'Other';
            acc[group] = (acc[group] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const performanceLevels = data.reduce((acc: Record<string, number>, o: OfficerRecord) => {
            const level = o.performanceRatingLevel || 'Not Rated';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return { totalOfficers, gradingGroups, performanceLevels };
    }, [data]);

    const sectionAnalysis = useMemo(() => {
        const ratingsByCode: Record<string, { scores: number[], count: number }> = {};
        Object.keys(QUESTION_TEXT_MAPPING).forEach(code => {
            ratingsByCode[code] = { scores: [], count: 0 };
        });
        
        data.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if(ratingsByCode[rating.questionCode]) {
                    ratingsByCode[rating.questionCode].scores.push(rating.currentScore);
                    ratingsByCode[rating.questionCode].count++;
                }
            });
        });

        return Object.entries(ratingsByCode)
            .filter(([, val]) => val.count > 0)
            .map(([code, val]) => ({
                code,
                text: QUESTION_TEXT_MAPPING[code],
                average: val.scores.reduce((a, b) => a + b, 0) / val.count,
            }));
    }, [data]);

    const trainingNeedsSummary = useMemo(() => {
        return [...sectionAnalysis]
            .sort((a, b) => a.average - b.average)
            .slice(0, 10);
    }, [sectionAnalysis]);

    // --- End Data Analysis Memos ---

    useEffect(() => {
        const generateContent = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following CNA data for ${agencyName} and generate a concise executive summary and a set of recommendations.\n\nDATA:\n${JSON.stringify(data.slice(0, 50), null, 2)}`; // Send a subset to avoid exceeding limits
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiConsolidatedStrategicPlanSchema,
                    },
                });
                setAiContent(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error("AI Consolidated Report Error:", e);
                setError("An error occurred while generating the AI summary and recommendations.");
            } finally {
                setLoading(false);
            }
        };
        generateContent();
    }, [data, agencyName]);
    
    const sectionsForToc = [
        { id: 'summary', title: 'Executive Summary' },
        { id: 'profile', title: 'Organizational Profile' },
        { id: 'analysis', title: 'Section-by-Section Analysis' },
        { id: 'needs', title: 'Training Needs Summary' },
        { id: 'officers', title: 'Individual Officer Profiles' },
        { id: 'conclusion', title: 'Conclusion and Recommendations' },
        { id: 'annex-data', title: 'Annex: Raw Data' },
        { id: 'annex-cna', title: 'Annex: CNA Questionnaire' },
    ];
    
    const getReportDataForExport = (): ReportData => {
        return {
            title: `Consolidated Strategic Plan Report - ${agencyName}`,
            sections: [
                { title: 'Executive Summary', content: [aiContent?.executiveSummary || ''] },
                { title: 'Organizational Profile', content: [`Total Officers: ${organizationalProfile.totalOfficers}`] },
                { title: 'Training Needs Summary', content: [{ type: 'table', headers: ['Code', 'Need', 'Avg Score'], rows: trainingNeedsSummary.map(n => [n.code, n.text, n.average.toFixed(2)]) }] },
                { title: 'Conclusion and Recommendations', content: [aiContent?.conclusionAndRecommendations || ''] },
                { title: 'Annex: CNA Questionnaire', content: [{ type: 'table', headers: ['Code', 'Question'], rows: Object.entries(QUESTION_TEXT_MAPPING) }] },
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };

    const renderContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-full p-8 min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                <h2 className="mt-4 text-2xl font-bold">Generating Consolidated Report...</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while the AI compiles and analyzes the data.</p>
            </div>
        );
        if (error) return <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">Error: {error}</div>;
        
        return (
            <div ref={contentRef} className="p-4 bg-white dark:bg-slate-900">
                <CoverPage agencyName={agencyName} />
                <TableOfContents sections={sectionsForToc} />
                <ReportSection title="Executive Summary" anchorId="summary">
                    <p>{aiContent?.executiveSummary || "Generating..."}</p>
                </ReportSection>
                <ReportSection title="Organizational Profile" anchorId="profile">
                    <p>Total Respondents: <strong>{organizationalProfile.totalOfficers}</strong></p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <h4 className="font-bold mb-2">Grading Group Distribution</h4>
                            <ChartComponent type="doughnut" data={{ labels: Object.keys(organizationalProfile.gradingGroups), datasets: [{ label: 'Grading Group Distribution', data: Object.values(organizationalProfile.gradingGroups), backgroundColor: ['#6B7280', '#71717A', '#A1A1AA', '#D4D4D8'] }]}} />
                        </div>
                         <div>
                            <h4 className="font-bold mb-2">Performance Level Distribution</h4>
                            <ChartComponent type="bar" data={{ labels: Object.keys(organizationalProfile.performanceLevels), datasets: [{ label: 'Count', data: Object.values(organizationalProfile.performanceLevels), backgroundColor: '#6B7280'}]}} />
                        </div>
                    </div>
                </ReportSection>
                <ReportSection title="Section-by-Section Analysis" anchorId="analysis">
                    <div className="overflow-x-auto border border-slate-300 dark:border-slate-600">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <tr>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Code</th>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Question</th>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Average Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sectionAnalysis.map(s => (
                                    <tr key={s.code} className="bg-white dark:bg-slate-900">
                                        <td className="p-1 border border-slate-300 dark:border-slate-600 font-mono">{s.code}</td>
                                        <td className="p-1 border border-slate-300 dark:border-slate-600">{s.text}</td>
                                        <td className="p-1 border border-slate-300 dark:border-slate-600 font-bold">{s.average.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ReportSection>
                <ReportSection title="Training Needs Summary" anchorId="needs">
                     <p>Top 10 priority training areas based on lowest average scores.</p>
                     <div className="overflow-x-auto border border-slate-300 dark:border-slate-600">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <tr>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Code</th>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Need</th>
                                    <th className="p-1 border border-slate-300 dark:border-slate-600">Average Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainingNeedsSummary.map(n => (
                                    <tr key={n.code} className="bg-white dark:bg-slate-900">
                                        <td className="p-1 border border-slate-300 dark:border-slate-600 font-mono">{n.code}</td>
                                        <td className="p-1 border border-slate-300 dark:border-slate-600">{n.text}</td>
                                        <td className="p-1 border border-slate-300 dark:border-slate-600 font-bold text-red-600">{n.average.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ReportSection>
                 <ReportSection title="Individual Officer Profiles" anchorId="officers">
                    <div className="space-y-2">
                        {data.map(officer => (
                             <details key={officer.email} className="p-2 border rounded border-slate-300 dark:border-slate-600">
                                 <summary className="cursor-pointer font-semibold">{officer.name} - <span className="font-normal">{officer.position} ({officer.grade})</span></summary>
                                 <ul className="list-disc list-inside text-xs mt-2">
                                     {officer.capabilityRatings.filter(r => r.gapScore >= 6).map(r => <li key={r.questionCode}>Critical Gap: {QUESTION_TEXT_MAPPING[r.questionCode]} (Score: {r.currentScore})</li>)}
                                     {officer.capabilityRatings.filter(r => r.gapScore >= 3 && r.gapScore < 6).map(r => <li key={r.questionCode}>Moderate Gap: {QUESTION_TEXT_MAPPING[r.questionCode]} (Score: {r.currentScore})</li>)}
                                 </ul>
                             </details>
                        ))}
                    </div>
                </ReportSection>
                <ReportSection title="Conclusion and Recommendations" anchorId="conclusion">
                    <div dangerouslySetInnerHTML={{ __html: aiContent?.conclusionAndRecommendations.replace(/\n/g, '<br />') || "Generating..." }} />
                </ReportSection>
                <ReportSection title="Annex: Raw Data" anchorId="annex-data">...</ReportSection>
                <ReportSection title="Annex: CNA Questionnaire" anchorId="annex-cna">...</ReportSection>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold">Consolidated Strategic Plan Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as any)} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50">{renderContent()}</main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-100 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};
