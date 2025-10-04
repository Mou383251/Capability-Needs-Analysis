import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, IndividualLndPlanRecord, AgencyType } from '../types';
// FIX: Import the newly created constant for this report.
import { AI_AUTOMATED_INDIVIDUAL_PLANS_V2_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, IdentificationIcon, UserCircleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
    data: OfficerRecord[];
    agencyName: string;
    agencyType: AgencyType;
    onClose: () => void;
}

const lndTrainingNeedSchema = {
    type: Type.OBJECT,
    properties: {
        perceivedArea: { type: Type.STRING },
        jobRequirement: { type: Type.STRING },
        proposedCourse: { type: Type.STRING },
        institution: { type: Type.STRING },
        fundingSource: { type: Type.STRING },
        yearOfCommencement: { type: Type.NUMBER },
        remarks: { type: Type.STRING },
    },
     required: ["perceivedArea", "jobRequirement", "proposedCourse", "institution", "fundingSource", "yearOfCommencement", "remarks"]
};

const aiAutomatedIndividualPlansV2Schema = {
    type: Type.OBJECT,
    properties: {
        plans: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    organizationName: { type: Type.STRING },
                    division: { type: Type.STRING },
                    officerName: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    dateOfBirth: { type: Type.STRING },
                    officerStatus: { type: Type.STRING },
                    highestQualification: { type: Type.STRING },
                    commencementDate: { type: Type.STRING },
                    gradeLevel: { type: Type.STRING },
                    trainingNeeds: {
                        type: Type.OBJECT,
                        properties: {
                            longTerm: { type: Type.ARRAY, items: lndTrainingNeedSchema },
                            shortTerm: { type: Type.ARRAY, items: lndTrainingNeedSchema },
                        },
                        required: ["longTerm", "shortTerm"]
                    },
                    knowledgeChecklist: {
                        type: Type.OBJECT,
                        properties: {
                            'Project Management': { type: Type.BOOLEAN },
                            'GESI Skills': { type: Type.BOOLEAN },
                            'Legislative Knowledge (Cocoa Act, PSMA, General Orders, PFMA, PNG Constitution)': { type: Type.BOOLEAN },
                            'Government Policy Familiarity': { type: Type.BOOLEAN },
                            'International Trade & Certification': { type: Type.BOOLEAN },
                            'Sustainability & Compliance': { type: Type.BOOLEAN },
                        },
                    },
                    otherKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
                    ageGroup: { type: Type.STRING },
                    performanceLevel: { type: Type.STRING },
                    promotionPotential: { type: Type.STRING },
                },
                 required: ["organizationName", "division", "officerName", "positionNumber", "designation", "dateOfBirth", "officerStatus", "highestQualification", "commencementDate", "gradeLevel", "trainingNeeds", "knowledgeChecklist", "otherKnowledge", "ageGroup", "performanceLevel", "promotionPotential"]
            }
        }
    },
    required: ["plans"]
};

export const AutomatedIndividualPlansReportV2: React.FC<ReportProps> = ({ data, agencyName, agencyType, onClose }) => {
    const [report, setReport] = useState<IndividualLndPlanRecord[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<IndividualLndPlanRecord | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following data to generate an Individual L&D Plan (V2 format) for each officer.\n\nAGENCY CONTEXT: ${agencyName} (${agencyType})\n\nCNA DATA:\n${JSON.stringify(data, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_AUTOMATED_INDIVIDUAL_PLANS_V2_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedIndividualPlansV2Schema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as { plans: Omit<IndividualLndPlanRecord, 'id'>[] };
                const plansWithIds = result.plans.map(p => ({ ...p, id: p.positionNumber || crypto.randomUUID() }));
                setReport(plansWithIds);
            } catch (e) {
                console.error("AI Automated Individual L&D Plans V2 Error:", e);
                setError("An error occurred while generating the AI analysis for the individual L&D plans (V2).");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, agencyName, agencyType]);
    
    const renderContent = () => {
        if (loading) return <div className="text-center p-8"><SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-amber-500" /> <p className="mt-2">Generating individual plans (V2)...</p></div>;
        if (error) return <div className="p-8 bg-red-100 text-red-700 rounded-md text-center"><strong>Error:</strong> {error}</div>;
        if (!report || report.length === 0) return <div className="text-center p-8">No L&D plans could be generated from the provided data.</div>;
        
        return (
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">The AI has generated {report.length} individual L&D plans (V2 Format). Select an officer to view their detailed plan.</p>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {report.map(plan => (
                        <li key={plan.id}>
                            <button onClick={() => setSelectedPlan(plan)} className="w-full text-left p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-3">
                                <UserCircleIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{plan.officerName}</p>
                                    <p className="text-xs text-slate-500">{plan.designation} - {plan.gradeLevel}</p>
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
        
        const allNeeds = [
            ...(selectedPlan.trainingNeeds.longTerm || []).map(n => ({...n, type: 'Long-Term'})),
            ...(selectedPlan.trainingNeeds.shortTerm || []).map(n => ({...n, type: 'Short-Term'}))
        ];

        return (
            <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4" onClick={() => setSelectedPlan(null)}>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold">L&D Plan (V2): {selectedPlan.officerName}</h3>
                        <button onClick={() => setSelectedPlan(null)}><XIcon className="w-6 h-6"/></button>
                    </header>
                    <main className="p-4 overflow-y-auto space-y-4 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-slate-200 dark:bg-slate-800 rounded-md">
                            <div><strong>Position:</strong> {selectedPlan.designation} ({selectedPlan.positionNumber})</div>
                            <div><strong>Status:</strong> {selectedPlan.officerStatus}</div>
                            <div><strong>Highest Qualification:</strong> {selectedPlan.highestQualification}</div>
                            <div><strong>Age Group:</strong> {selectedPlan.ageGroup}</div>
                            <div><strong>Performance:</strong> {selectedPlan.performanceLevel}</div>
                            <div><strong>Promotion Potential:</strong> {selectedPlan.promotionPotential}</div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Training Needs ({allNeeds.length})</h4>
                            <div className="overflow-x-auto border rounded-md">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-200 dark:bg-slate-800"><tr>{["Type", "Course", "Justification", "Year", "Funding"].map(h=><th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
                                    <tbody>{allNeeds.map((n, i) => <tr key={i} className="border-t"><td className="p-2">{n.type}</td><td className="p-2 font-semibold">{n.proposedCourse}</td><td className="p-2">{n.jobRequirement}</td><td className="p-2">{n.yearOfCommencement}</td><td className="p-2">{n.fundingSource}</td></tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Knowledge Competencies</h4>
                            <ul className="list-disc list-inside">
                               {Object.entries(selectedPlan.knowledgeChecklist).filter(([,v])=>v).map(([k]) => <li key={k}>{k}</li>)}
                               {selectedPlan.otherKnowledge.map(k => <li key={k}><em>{k} (Other)</em></li>)}
                            </ul>
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
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Generated Individual L&amp;D Plans (V2)</h1>
                    </div>
                    {/* Simplified export for this view */}
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};