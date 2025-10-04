import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiAutomatedLndReport, QUESTION_TEXT_MAPPING, AgencyType, AiLearningSolution, LearningRecommendation, OfficerAutomatedLndPlan } from '../types';
import { AI_AUTOMATED_LND_RECOMMENDATIONS_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ChevronDownIcon, LightBulbIcon } from './icons';
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

const aiAutomatedLndReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        officerPlans: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    officerName: { type: Type.STRING },
                    officerPosition: { type: Type.STRING },
                    learningRecommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skillArea: { type: Type.STRING },
                                questionCode: { type: Type.STRING },
                                rating: { type: Type.NUMBER },
                                category: { type: Type.STRING, enum: ['Low', 'Fair', 'High'] },
                                recommendation: aiLearningSolutionSchema
                            },
                            required: ["skillArea", "questionCode", "rating", "category", "recommendation"]
                        }
                    }
                },
                required: ["officerName", "officerPosition", "learningRecommendations"]
            }
        }
    },
    required: ["executiveSummary", "officerPlans"]
};

const AccordionItem: React.FC<{ title: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="border-b border-gray-200 dark:border-blue-800 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-blue-900"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid grid-rows-[0fr] transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : ''}`}>
                <div className="overflow-hidden">
                    <div className="p-4 pt-0 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-blue-900/50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecommendationView: React.FC<{ rec: LearningRecommendation }> = ({ rec }) => {
    const categoryStyles = {
        Low: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        High: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return (
        <div className="p-3 bg-white dark:bg-blue-950/40 rounded-md text-sm border border-gray-200 dark:border-blue-800">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{rec.skillArea}</p>
                    <p className="text-xs text-gray-400">({rec.questionCode})</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-bold">Rating: {rec.rating}/10</p>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryStyles[rec.category]}`}>{rec.category}</span>
                </div>
            </div>
            <div className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-blue-800 pt-2">
                <div><p className="font-bold">10% (Formal):</p><p className="pl-4">{rec.recommendation.formal10}</p></div>
                <div><p className="font-bold">20% (Social):</p><p className="pl-4">{rec.recommendation.social20}</p></div>
                <div><p className="font-bold">70% (Experiential):</p><p className="pl-4">{rec.recommendation.experiential70}</p></div>
            </div>
        </div>
    );
};

export const AutomatedLndRecommendationsReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiAutomatedLndReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') { return `The analysis should be tailored for a '${agencyName}', a '${agencyType}'.`; }
        if (agencyType !== 'All Agencies') { return `The analysis should be tailored for a '${agencyType}'.`; }
        return 'The analysis should be general for all public service agencies.';
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
                const promptText = `Please analyze the following CNA data and generate automated L&D recommendations for all officers with identified gaps.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_AUTOMATED_LND_RECOMMENDATIONS_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedLndReportSchema,
                    },
                });
                // FIX: Add type assertion to ensure TypeScript knows the shape of the parsed JSON object.
                setReport(JSON.parse(response.text.trim()) as AiAutomatedLndReport);
            } catch (e) {
                console.error("Automated L&D Report Error:", e);
                setError("An error occurred while generating the AI analysis. The model may have returned an unexpected format.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, promptContext]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        const tableHeaders = ['Officer Name', 'Position', 'Skill Area / Gap', 'Rating', 'Category', '10% Formal', '20% Social', '70% Experiential'];
        const tableRows = report.officerPlans.flatMap(plan =>
            plan.learningRecommendations.map(rec => [
                plan.officerName,
                plan.officerPosition,
                rec.skillArea,
                rec.rating,
                rec.category,
                rec.recommendation.formal10,
                rec.recommendation.social20,
                rec.recommendation.experiential70,
            ])
        );
        return {
            title: "Automated L&D Recommendations",
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { title: "Detailed Recommendations", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }
            ]
        };
    };
    
    const handleExport = (format: 'pdf' | 'xlsx' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if(format === 'pdf') exportToPdf(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
             console.error("Export failed:", e);
             alert("Could not export report.");
        }
    };

    const renderContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-teal-500 animate-pulse" />
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Generating All L&D Plans...</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Gemini is analyzing all officer gaps to create personalized 70:20:10 recommendations.</p>
            </div>
        );
        if (error) return (
            <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px] text-center">
                <XIcon className="w-16 h-16 text-red-500 mx-auto" />
                <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
        if (report) return (
            <div className="space-y-6">
                <div className="p-4 bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Executive Summary</h2>
                    <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">{report.executiveSummary}</p>
                </div>
                <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 overflow-hidden">
                    {report.officerPlans.map(plan => (
                        <AccordionItem
                            key={plan.officerName}
                            isOpen={openAccordion === plan.officerName}
                            onToggle={() => setOpenAccordion(openAccordion === plan.officerName ? null : plan.officerName)}
                            title={<>
                                <span className="font-bold">{plan.officerName}</span>
                                <span className="text-sm text-gray-500 ml-2">{plan.officerPosition}</span>
                                <span className="ml-4 px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                                    {plan.learningRecommendations.length} Recommendations
                                </span>
                            </>}
                        >
                           <div className="space-y-3">
                                {plan.learningRecommendations.map((rec, index) => <RecommendationView key={index} rec={rec} />)}
                           </div>
                        </AccordionItem>
                    ))}
                </div>
            </div>
        );
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <LightBulbIcon className="w-7 h-7 text-teal-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automated L&D Recommendations</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};