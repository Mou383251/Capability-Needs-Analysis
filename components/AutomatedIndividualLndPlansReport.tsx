import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, IndividualLndPlan, AgencyType } from '../types';
// FIX: Corrected the prompt instruction to one designed for multiple officers.
import { AI_AUTOMATED_INDIVIDUAL_LND_PLANS_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, IdentificationIcon, UserCircleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
    data: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyName: string;
    agencyType: AgencyType;
    onClose: () => void;
}

// NOTE: A full schema for IndividualLndPlan is very large. This is a simplified version for brevity.
// A production implementation would have a complete schema matching the type.
const aiAutomatedIndividualLndPlansSchema = {
    type: Type.OBJECT,
    properties: {
        plans: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    officer: {
                        type: Type.OBJECT,
                        properties: {
                            positionNumber: { type: Type.STRING },
                            division: { type: Type.STRING },
                            grade: { type: Type.STRING },
                            designation: { type: Type.STRING },
                            occupant: { type: Type.STRING },
                            status: { type: Type.STRING },
                        },
                        required: ["positionNumber", "division", "grade", "designation", "occupant", "status"]
                    },
                    age: { type: Type.NUMBER },
                    performanceCategory: { type: Type.STRING },
                    promotionPotential: { type: Type.STRING },
                    // Simplified for this example
                    trainingNeeds: { type: Type.OBJECT }, 
                    coreCompetencies: { type: Type.ARRAY, items: { type: Type.OBJECT } },
                },
                 required: ["id", "officer", "age", "performanceCategory", "promotionPotential", "trainingNeeds", "coreCompetencies"]
            }
        }
    },
    required: ["plans"]
};

export const AutomatedIndividualLndPlansReport: React.FC<ReportProps> = ({ data, establishmentData, agencyName, agencyType, onClose }) => {
    const [report, setReport] = useState<IndividualLndPlan[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<IndividualLndPlan | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following data to generate an Individual L&D Plan for each officer.\n\nAGENCY CONTEXT: ${agencyName} (${agencyType})\n\nCNA DATA:\n${JSON.stringify(data, null, 2)}\n\nESTABLISHMENT DATA:\n${JSON.stringify(establishmentData, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_AUTOMATED_INDIVIDUAL_LND_PLANS_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedIndividualLndPlansSchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as { plans: IndividualLndPlan[] };
                setReport(result.plans);
            } catch (e) {
                console.error("AI Automated Individual L&D Plans Error:", e);
                setError("An error occurred while generating the AI analysis for the individual L&D plans.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, establishmentData, agencyName, agencyType]);
    
    const renderContent = () => {
        if (loading) return <div className="text-center p-8"><SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-amber-500" /> <p className="mt-2">Generating individual plans...</p></div>;
        if (error) return <div className="p-8 bg-red-100 text-red-700 rounded-md text-center"><strong>Error:</strong> {error}</div>;
        if (!report || report.length === 0) return <div className="text-center p-8">No L&D plans could be generated from the provided data.</div>;
        
        return (
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">The AI has generated {report.length} individual L&D plans. Select an officer to view their detailed plan.</p>
                <ul className="space-y-2">
                    {report.map(plan => (
                        <li key={plan.id}>
                            <button onClick={() => setSelectedPlan(plan)} className="w-full text-left p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-3">
                                <UserCircleIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{plan.officer.occupant}</p>
                                    <p className="text-xs text-slate-500">{plan.officer.designation} - {plan.officer.grade}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderDetailView = () => {
        if (!selectedPlan) return null;
        
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setSelectedPlan(null)}>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold">L&D Plan for {selectedPlan.officer.occupant}</h3>
                        <button onClick={() => setSelectedPlan(null)}><XIcon className="w-6 h-6"/></button>
                    </header>
                    <main className="p-4 overflow-y-auto space-y-4">
                        {/* Simplified Detail View */}
                        <div className="text-sm">
                           <p><strong>Performance:</strong> {selectedPlan.performanceCategory}</p>
                           <p><strong>Promotion Potential:</strong> {selectedPlan.promotionPotential}</p>
                           <p><strong>Total Training Needs Identified:</strong> {Object.values(selectedPlan.trainingNeeds).flat().length}</p>
                           <h4 className="font-bold mt-2">Core Competencies Focus:</h4>
                           <ul className="list-disc list-inside">{selectedPlan.coreCompetencies.map((c,i) => <li key={i}>{c.skill} (Target: {c.year})</li>)}</ul>
                        </div>
                    </main>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            {renderDetailView()}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <IdentificationIcon className="w-7 h-7 text-amber-600" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Generated Individual L&D Plans</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};