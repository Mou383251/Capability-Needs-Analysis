import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiTalentCardReport, AiLearningSolution, PerformanceRatingLevel, AiReportSummary, SpaSummary, CapabilityAnalysisItem, QUESTION_TEXT_MAPPING, AiProgressionAnalysis } from '../types';
import { AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, UserCircleIcon, GlobeAltIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv, exportToJson } from '../utils/export';

interface ProfileProps {
  officer: OfficerRecord;
  establishmentData: EstablishmentRecord[];
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

const aiProgressionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        currentPositionSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingCurrentSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        nextPositionSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        progressionSummary: { type: Type.STRING },
    },
    required: ["currentPositionSkills", "missingCurrentSkills", "nextPositionSkills", "progressionSummary"]
};

const aiTalentCardReportSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING, description: "A brief introductory paragraph summarizing the officer's background details for context." },
        employeeId: { type: Type.STRING },
        division: { type: Type.STRING },
        spaSummary: {
            type: Type.OBJECT,
            properties: {
                performanceRating: { type: Type.STRING },
                performanceCategory: { type: Type.STRING, enum: ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level', 'Not Rated'] },
                explanation: { type: Type.STRING },
            },
            required: ["performanceRating", "performanceCategory", "explanation"]
        },
        capabilityAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    domain: { type: Type.STRING },
                    currentScore: { type: Type.NUMBER, description: "The calculated current performance score for this domain, from 0-10." },
                    gapScore: { type: Type.NUMBER, description: "The calculated gap score for this domain (10 - currentScore)." },
                    learningSolution: aiLearningSolutionSchema,
                    sdgAlignment: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                sdgNumber: { type: Type.NUMBER },
                                sdgName: { type: Type.STRING },
                            },
                            required: ["sdgNumber", "sdgName"],
                        }
                    }
                },
                required: ["domain", "currentScore", "gapScore", "learningSolution"]
            }
        },
        progressionAnalysis: aiProgressionAnalysisSchema,
        summary: aiReportSummarySchema,
    },
    required: ["introduction", "employeeId", "division", "spaSummary", "capabilityAnalysis", "progressionAnalysis", "summary"]
};


const LearningSolutionView: React.FC<{ solution: AiLearningSolution }> = ({ solution }) => (
    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
        <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">70% Exp:</span><p>{solution.experiential70}</p></li>
        <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">20% Social:</span><p>{solution.social20}</p></li>
        <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">10% Formal:</span><p>{solution.formal10}</p></li>
    </ul>
);

const GapScoreDisplay: React.FC<{ currentScore: number, gapScore: number }> = ({ currentScore, gapScore }) => {
    const getGapCategory = (score: number) => {
        if (score <= 1) return { text: 'No Gap', color: 'text-green-600 dark:text-green-400' };
        if (score <= 2) return { text: 'Minor Gap', color: 'text-amber-600 dark:text-amber-400' };
        if (score <= 5) return { text: 'Moderate Gap', color: 'text-orange-600 dark:text-orange-400' };
        return { text: 'Critical Gap', color: 'text-red-600 dark:text-red-400' };
    };
    const category = getGapCategory(gapScore);
    const gapPercentage = (gapScore / 10) * 100;

    return (
        <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div>
                <span>Score: <b className="text-slate-700 dark:text-slate-200">{currentScore.toFixed(1)}/10</b></span>
            </div>
             <div>
                <span className="mr-2 font-bold text-red-600 dark:text-red-400">Gap: {gapPercentage.toFixed(0)}%</span>
                <span className={`font-semibold ${category.color}`}>({category.text})</span>
            </div>
        </div>
    );
};

const SummarySection: React.FC<{ summary: AiReportSummary | undefined }> = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="mt-6 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Profile Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Key Gaps</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Total Gaps Detected: <strong>{summary.totalGapsDetected}</strong></li>
                        <li className="text-red-600 dark:text-red-400">Critical Gaps (Priority): <strong>{summary.criticalGapsCount}</strong></li>
                    </ul>
                </div>
                 <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Development Focus</h4>
                     <ul className="list-disc list-inside space-y-1">
                        {summary.topImprovementAreas?.map(area => (
                            <li key={area.area}><strong>{area.area}</strong></li>
                        ))}
                    </ul>
                </div>
                 <div className="md:col-span-2 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Primary Intervention Strategy</h4>
                    <p className="italic">{summary.concludingIntervention}</p>
                </div>
            </div>
        </div>
    );
};

export const IndividualTalentCardReport: React.FC<ProfileProps> = ({ officer, establishmentData, onClose }) => {
    const [report, setReport] = useState<AiTalentCardReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `You MUST use this mapping to understand the question codes in the data.
QUESTION MAPPING:
${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}

You MUST use this establishment data to understand the organizational structure and potential career paths.
ESTABLISHMENT DATA:
${JSON.stringify(establishmentData, null, 2)}

Please generate a talent profile card for the following officer:\n${JSON.stringify(officer, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTalentCardReportSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiTalentCardReport;
                setReport(parsedReport);

            } catch (e) {
                console.error("AI Talent Card Error:", e);
                setError("An error occurred while generating the AI profile. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [officer, establishmentData]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");

        const capabilityTable = {
            type: 'table' as const,
            headers: ['Domain', 'Current Score', 'Gap Score', '70% Experiential', '20% Social', '10% Formal', 'SDG Alignment'],
            rows: report.capabilityAnalysis.map(item => [
                item.domain,
                item.currentScore.toFixed(1),
                item.gapScore.toFixed(1),
                item.learningSolution.experiential70,
                item.learningSolution.social20,
                item.learningSolution.formal10,
                item.sdgAlignment?.map(sdg => `SDG ${sdg.sdgNumber}: ${sdg.sdgName}`).join(', ') || 'N/A'
            ])
        };

        const sections: ReportData['sections'] = [
            { title: "Introduction", content: [report.introduction] },
            {
                title: "SPA Summary (Performance)",
                content: [
                    `Performance Rating: ${report.spaSummary.performanceRating}/5 (${report.spaSummary.performanceCategory})`,
                    `Explanation: ${report.spaSummary.explanation}`
                ]
            },
            { title: "Capability Analysis (Skills)", content: [capabilityTable], orientation: 'landscape' },
        ];
        
        if (report.progressionAnalysis) {
            sections.push({
                title: "Career Progression Analysis",
                content: [
                    `Progression Summary: ${report.progressionAnalysis.progressionSummary}`,
                    `\n**Current Skills:**\n${report.progressionAnalysis.currentPositionSkills.map(s => `- ${s}`).join('\n')}`,
                    `\n**Skills to Develop (Current Role):**\n${report.progressionAnalysis.missingCurrentSkills.map(s => `- ${s}`).join('\n')}`,
                    `\n**Skills for Next Level:**\n${report.progressionAnalysis.nextPositionSkills.map(s => `- ${s}`).join('\n')}`
                ]
            });
        }

        sections.push({
            title: "Profile Summary",
            content: [
                `Total Gaps Detected: ${report.summary.totalGapsDetected}`,
                `Critical Gaps: ${report.summary.criticalGapsCount}`,
                `Top Improvement Areas: ${report.summary.topImprovementAreas.map(a => a.area).join(', ')}`,
                `Primary Intervention: ${report.summary.concludingIntervention}`
            ]
        });


        return {
            title: `Talent Profile Card - ${officer.name}`,
            sections
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
                case 'csv': exportToCsv(reportData); break;
                case 'sheets': copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(err.toString())); break;
                case 'json': exportToJson({ report: report } as any); break;
            }
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report. Data may still be loading or an error occurred.");
        }
    };

    const renderCard = () => {
        if (!report) return null;

        const talentCategoryStyles: Record<string, string> = {
            'Well Above Required': 'text-green-600 dark:text-green-400',
            'Above Required': 'text-sky-600 dark:text-sky-400',
            'At Required Level': 'text-yellow-500 dark:text-yellow-400',
            'Below Required Level': 'text-orange-600 dark:text-orange-400',
            'Well Below Required Level': 'text-red-600 dark:text-red-400',
            'Not Rated': 'text-slate-500 dark:text-slate-400',
        };

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto border border-slate-200 dark:border-slate-700">
                
                <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">{report.introduction}</p>

                {/* SPA Summary Section */}
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">SPA Summary (Performance)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                             <p className="text-xs uppercase font-semibold text-slate-500">Performance Rating</p>
                             <p><span className={`font-bold text-lg ${talentCategoryStyles[report.spaSummary.performanceCategory]}`}>{report.spaSummary.performanceCategory}</span> ({report.spaSummary.performanceRating}/5)</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-semibold text-slate-500">AI Explanation</p>
                            <p className="italic text-slate-600 dark:text-slate-400">{report.spaSummary.explanation}</p>
                        </div>
                     </div>
                </div>


                {/* Capability Analysis Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Capability Analysis (Skills)</h3>
                    
                    <div className="space-y-4">
                        {report.capabilityAnalysis.map((gap, index) => (
                            <div key={index} className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-md text-blue-700 dark:text-blue-400">{gap.domain}</h4>
                                    <GapScoreDisplay currentScore={gap.currentScore} gapScore={gap.gapScore} />
                                </div>
                                <LearningSolutionView solution={gap.learningSolution} />
                                {gap.sdgAlignment && gap.sdgAlignment.length > 0 && (
                                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <h5 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                            <GlobeAltIcon className="w-4 h-4" />
                                            SDG Alignment
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {gap.sdgAlignment.map(sdg => (
                                                <span key={sdg.sdgNumber} className="px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-100 dark:bg-green-900/40 dark:text-green-200 rounded-full">
                                                    SDG {sdg.sdgNumber}: {sdg.sdgName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                         {report.capabilityAnalysis.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 p-2">No specific capability gaps requiring intervention were identified by the AI.</p>
                        )}
                    </div>
                </div>

                {/* Progression Analysis Section */}
                {report.progressionAnalysis && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Career Progression Analysis</h3>
                        <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase text-green-600 dark:text-green-400">Current Skills</h4>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {report.progressionAnalysis.currentPositionSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase text-orange-600 dark:text-orange-400">Skills to Develop (Current Role)</h4>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {report.progressionAnalysis.missingCurrentSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-1 uppercase text-blue-600 dark:text-blue-400">Skills for Next Level</h4>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {report.progressionAnalysis.nextPositionSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Progression Summary</h4>
                                <p className="text-sm italic text-slate-600 dark:text-slate-400">{report.progressionAnalysis.progressionSummary}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <SummarySection summary={report.summary} />
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-amber-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Building Talent Profile...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing {officer.name}'s data to create a unique profile card.</p>
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
        
        return renderCard();
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <UserCircleIcon className="w-7 h-7 text-amber-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Talent Profile Card</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{officer.name}</p>
                        </div>
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