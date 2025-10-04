import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiTrainingPathwayReport, GradingGroup, QUESTION_TEXT_MAPPING, TrainingPathway, AgencyType } from '../types';
import { AI_TRAINING_CATEGORY_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon } from './icons';

interface ModalProps {
  data: OfficerRecord[];
  categoryName: string;
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiTrainingPathwayReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        pathwaysByGrade: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    grade: { type: Type.STRING, enum: ['Junior Officer', 'Senior Officer', 'Manager', 'Senior Management'] },
                    description: { type: Type.STRING },
                    recommendedCourses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                rationale: { type: Type.STRING },
                                deliveryMethod: { type: Type.STRING },
                            },
                            required: ["title", "rationale", "deliveryMethod"]
                        }
                    }
                },
                required: ["grade", "description", "recommendedCourses"]
            }
        }
    },
    required: ["executiveSummary", "pathwaysByGrade"]
};

const GradePathwayCard: React.FC<{ pathway: TrainingPathway }> = ({ pathway }) => {
    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{pathway.grade}</h3>
            <p className="text-sm italic text-gray-600 dark:text-gray-400 my-2">{pathway.description}</p>
            <div className="space-y-3 mt-3">
                {pathway.recommendedCourses.map((course, index) => (
                    <div key={index} className="p-3 bg-gray-100 dark:bg-gray-900/40 rounded-md text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{course.title}</p>
                        <p className="text-xs text-gray-500 my-1">{course.rationale}</p>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">{course.deliveryMethod}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TrainingCategoryModal: React.FC<ModalProps> = ({ data, categoryName, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiTrainingPathwayReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all agencies.';
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
                
                const instructions = AI_TRAINING_CATEGORY_PROMPT_INSTRUCTIONS.replace(/{CATEGORY_NAME}/g, categoryName);
                const promptText = `Please analyze the following CNA data for the training category "${categoryName}".\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand the question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: instructions,
                        responseMimeType: "application/json",
                        responseSchema: aiTrainingPathwayReportSchema,
                    },
                });
                // FIX: Add type assertion to ensure TypeScript knows the shape of the parsed JSON object.
                setReport(JSON.parse(response.text.trim()) as AiTrainingPathwayReport);
            } catch (e) {
                console.error("AI Training Pathway Error:", e);
                setError("An error occurred while generating the AI analysis for this training pathway.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, categoryName, promptContext]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Building Training Pathway...</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Gemini is analyzing CNA data for "{categoryName}".</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px] text-center">
                    <XIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }
        if (report) {
            const gradeOrder: GradingGroup[] = ['Junior Officer', 'Senior Officer', 'Manager', 'Senior Management'];
            const sortedPathways = [...report.pathwaysByGrade].sort((a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade));

            return (
                <div className="space-y-6">
                    <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Executive Summary</h2>
                        <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">{report.executiveSummary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedPathways.map(pathway => <GradePathwayCard key={pathway.grade} pathway={pathway} />)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <SparklesIcon className="w-7 h-7 text-purple-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Pathway</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{categoryName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};