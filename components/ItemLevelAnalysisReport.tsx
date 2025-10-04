import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiDetailedCapabilityReport, AgencyType, CapabilityItemAnalysis, AiReportSummary, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_DETAILED_CAPABILITY_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ChevronDownIcon, ChartBarSquareIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

// --- Types for this Report ---
interface QuestionStats {
    questionCode: string;
    questionText: string;
    responseCount: number;
    totalPossible: number;
    averageScore: number;
    modalScore: number;
    variance: number;
    tally: Record<number, number>; // e.g., { 10: 5, 9: 10, ... }
}

interface AiNarrativeContent {
    introduction: string;
    visualSummaryCommentary: string;
    priorityGaps: {
        questionCode: string;
        reason: string;
    }[];
}

// --- AI Schema and Prompt ---
const AI_PROMPT_INSTRUCTIONS = `
You are an expert data analyst for the PNG public service. You will receive pre-calculated statistics from a CNA survey. Your task is to generate narrative insights.

**YOUR TASK:**
1.  **Introduction:** Write a brief introduction (2-3 sentences) explaining that the following report breaks down each survey question by response frequency to identify specific trends.
2.  **Visual Summary Commentary:** Analyze the provided Top 5 and Bottom 5 questions. Write a short paragraph identifying any overarching patterns or trends (e.g., "A clear pattern emerges in Section C, where items related to leadership consistently scored low, suggesting a systemic challenge in management capability.").
3.  **Gap Identification:** Review all the provided question statistics. Identify up to 10 priority gap areas based on a combination of low average ratings (below 5.5) and high variance (indicating inconsistent understanding). For each, provide a brief 'reason'.

**OUTPUT FORMAT:**
- You MUST return a single, valid JSON object that strictly adheres to the schema.
- Do not add any other text, explanations, or markdown.
`;

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING },
        visualSummaryCommentary: { type: Type.STRING },
        priorityGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionCode: { type: Type.STRING },
                    reason: { type: Type.STRING },
                },
                required: ["questionCode", "reason"]
            }
        },
    },
    required: ["introduction", "visualSummaryCommentary", "priorityGaps"]
};


// --- Sub-components ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; anchorId: string, headingStyle?: 'Blue' | 'Green' }> = ({ title, children, anchorId, headingStyle }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6 break-after-page" id={anchorId}>
        <h2 className={`text-xl font-bold mb-4 border-b border-slate-200 dark:border-blue-800 pb-3 ${headingStyle === 'Blue' ? 'text-blue-600 dark:text-blue-400' : headingStyle === 'Green' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const RatingTallyTable: React.FC<{ stats: QuestionStats }> = ({ stats }) => {
    const totalResponses = stats.responseCount;
    if (totalResponses === 0) return <p>No responses for this item.</p>;

    const getScoreColor = (score: number) => {
        if (score > 7) return 'text-green-600 dark:text-green-400 font-semibold';
        if (score < 5) return 'text-red-600 dark:text-red-400 font-semibold';
        return 'text-yellow-600 dark:text-yellow-400 font-semibold';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs my-2">
                <thead className="bg-slate-100 dark:bg-blue-950/50">
                    <tr>
                        <th className="p-1.5 font-semibold">Rating</th>
                        <th className="p-1.5 font-semibold">Response Count</th>
                        <th className="p-1.5 font-semibold">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(stats.tally).sort(([scoreA], [scoreB]) => Number(scoreB) - Number(scoreA)).map(([score, count]) => (
                        <tr key={score} className="border-b border-slate-200 dark:border-blue-800">
                            <td className={`p-1.5 ${getScoreColor(Number(score))}`}>{score}</td>
                            <td className="p-1.5">{count}</td>
                            <td className="p-1.5">{((count as number / totalResponses) * 100).toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- Main Component ---
interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

export const ItemLevelAnalysisReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<AiNarrativeContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const analysisData = useMemo(() => {
        const questionScores: Record<string, number[]> = {};
        
        data.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if (!questionScores[rating.questionCode]) {
                    questionScores[rating.questionCode] = [];
                }
                questionScores[rating.questionCode].push(rating.currentScore);
            });
        });

        const analyzedQuestions: QuestionStats[] = Object.entries(questionScores).map(([code, scores]) => {
            const responseCount = scores.length;
            const sum = scores.reduce((a, b) => a + b, 0);
            const averageScore = responseCount > 0 ? sum / responseCount : 0;
            const mean = averageScore;
            const variance = responseCount > 0 ? scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / responseCount : 0;

            const tally: Record<number, number> = {};
            for (let i = 1; i <= 10; i++) tally[i] = 0;
            scores.forEach(score => {
                tally[score] = (tally[score] || 0) + 1;
            });
            
            const modalScore = Object.entries(tally).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

            return {
                questionCode: code,
                questionText: QUESTION_TEXT_MAPPING[code] || `Unknown Question (${code})`,
                responseCount,
                totalPossible: data.length,
                averageScore,
                modalScore: Number(modalScore),
                variance,
                tally,
            };
        });

        const sections = analyzedQuestions.reduce((acc, q) => {
            const sectionLetter = q.questionCode.charAt(0);
            if (!acc[sectionLetter]) acc[sectionLetter] = [];
            acc[sectionLetter].push(q);
            return acc;
        }, {} as Record<string, QuestionStats[]>);

        Object.values(sections).forEach(s => s.sort((a,b) => a.questionCode.localeCompare(b.questionCode, undefined, { numeric: true })));

        const top5Highest = [...analyzedQuestions].sort((a, b) => b.averageScore - a.averageScore).slice(0, 5);
        const top5Lowest = [...analyzedQuestions].sort((a, b) => a.averageScore - b.averageScore).slice(0, 5);

        return { analyzedQuestions, sections, top5Highest, top5Lowest };
    }, [data]);


    useEffect(() => {
        const generateNarratives = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptDataForAI = {
                    totalRespondents: data.length,
                    top5Highest: analysisData.top5Highest.map(q => ({ code: q.questionCode, text: q.questionText, avg: q.averageScore })),
                    top5Lowest: analysisData.top5Lowest.map(q => ({ code: q.questionCode, text: q.questionText, avg: q.averageScore })),
                    allQuestionStats: analysisData.analyzedQuestions.map(q => ({ code: q.questionCode, avg: q.averageScore, variance: q.variance })),
                };
                const prompt = `Please generate narrative insights based on the following pre-calculated CNA data:\n${JSON.stringify(promptDataForAI, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });
                
                // FIX: Add type assertion to ensure TypeScript knows the shape of the parsed JSON object.
                setAiContent(JSON.parse(response.text.trim()) as AiNarrativeContent);
            } catch (e) {
                console.error("Item-Level Analysis Report Error:", e);
                setError("An error occurred while generating AI narratives.");
            } finally {
                setLoading(false);
            }
        };

        if (analysisData.analyzedQuestions.length > 0) {
            generateNarratives();
        } else {
            setLoading(false);
        }
    }, [analysisData, data.length]);


    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        alert(`Exporting to ${format} is not yet implemented for this detailed report format.`);
    };

    const renderContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-full p-8 min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                <h2 className="mt-4 text-2xl font-bold">Performing Detailed Analysis...</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Gemini is analyzing each question. This may take a moment.</p>
            </div>
        );
        if (error) return <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-center"><h2 className="text-xl font-bold text-red-700">Analysis Failed</h2><p>{error}</p></div>;
        if (!aiContent || analysisData.analyzedQuestions.length === 0) return <div className="p-8 text-center">No capability rating data found to analyze.</div>;
        
        const SECTION_TITLES: Record<string, string> = { A: 'Strategic Understanding', B: 'Systems and Processes', C: 'Staff Engagement', D: 'Performance', E: 'Workforce Planning', F: 'Learning & Development', G: 'Culture & Leadership', H: 'Training Needs' };

        return (
            <div className="space-y-6">
                <ReportSection title="1. Introduction" anchorId="intro"><p>{aiContent.introduction}</p></ReportSection>
                
                <ReportSection title="Visual Summary & Priority Gaps" anchorId="summary" headingStyle="Green">
                    <p>{aiContent.visualSummaryCommentary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                            <h4 className="font-bold text-green-800 dark:text-green-200">Top 5 Highest-Rated Items</h4>
                            <ul className="list-disc list-inside text-xs">
                                {analysisData.top5Highest.map(q => <li key={q.questionCode}><strong>{q.questionCode}:</strong> {q.questionText} (Avg: {q.averageScore.toFixed(2)})</li>)}
                            </ul>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-700">
                             <h4 className="font-bold text-red-800 dark:text-red-200">Bottom 5 Lowest-Rated Items</h4>
                             <ul className="list-disc list-inside text-xs">
                                {analysisData.top5Lowest.map(q => <li key={q.questionCode}><strong>{q.questionCode}:</strong> {q.questionText} (Avg: {q.averageScore.toFixed(2)})</li>)}
                            </ul>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold">Identified Priority Gaps</h4>
                        <ul className="list-disc list-inside text-sm">
                            {aiContent.priorityGaps.map(g => {
                                const questionText = QUESTION_TEXT_MAPPING[g.questionCode] || g.questionCode;
                                return <li key={g.questionCode}><strong>{g.questionCode} ({questionText}):</strong> {g.reason}</li>
                            })}
                        </ul>
                    </div>
                </ReportSection>

                {Object.entries(analysisData.sections).sort(([a],[b]) => a.localeCompare(b)).map(([sectionLetter, questions]) => (
                    <ReportSection key={sectionLetter} title={`Section ${sectionLetter}: ${SECTION_TITLES[sectionLetter] || 'Analysis'}`} anchorId={`section-${sectionLetter}`} headingStyle="Blue">
                        {questions.map(q => (
                             <div key={q.questionCode} className="mb-4 p-3 bg-slate-50 dark:bg-blue-950/50 rounded-md border border-slate-200 dark:border-blue-800">
                                <h4 className="font-bold">{q.questionCode} – {q.questionText}</h4>
                                <div className="my-2 p-2 border-y border-slate-200 dark:border-blue-800 flex justify-around text-xs font-semibold">
                                     <span className={q.averageScore < 5 ? 'text-red-500' : q.averageScore < 7.5 ? 'text-yellow-500' : 'text-green-500'}>Average Rating: {q.averageScore.toFixed(2)}</span>
                                     <span>Most Common Response: {q.modalScore}</span>
                                     <span>Response Count: {q.responseCount}/{q.totalPossible}</span>
                                </div>
                                <RatingTallyTable stats={q} />
                            </div>
                        ))}
                    </ReportSection>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Item-Level Questionnaire Analysis</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis by Google Gemini.</p>
                </footer>
            </div>
        </div>
    );
};