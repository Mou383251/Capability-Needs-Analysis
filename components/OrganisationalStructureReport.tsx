import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiOrganisationalStructureReport, HierarchyNode } from '../types';
import { AI_ORGANISATIONAL_STRUCTURE_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, PresentationChartLineIcon, ExclamationTriangleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyName: string;
  onClose: () => void;
}

const aiReportSchema = {
    definitions: {
        hierarchyNode: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                level: { type: Type.STRING },
                manager: { type: Type.STRING },
                staffCount: { type: Type.NUMBER },
                cnaParticipationRate: { type: Type.NUMBER },
                notes: { type: Type.STRING },
                children: { 
                    type: Type.ARRAY, 
                    items: { $ref: "#/definitions/hierarchyNode" } 
                }
            },
            required: ["name", "level", "manager", "staffCount", "cnaParticipationRate", "children"]
        }
    },
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        adaptedHierarchy: { 
            type: Type.ARRAY, 
            items: { $ref: "#/definitions/hierarchyNode" } 
        },
        functionalDuplications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING },
                    unitsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                    observation: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                },
                required: ["area", "unitsInvolved", "observation", "recommendation"]
            }
        },
        structuralGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    gapType: { type: Type.STRING, enum: ['Critical Vacancy', 'Low CNA Participation', 'Missing Tier', 'Unclear Reporting Line'] },
                    description: { type: Type.STRING },
                    implication: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                },
                required: ["gapType", "description", "implication", "recommendation"]
            }
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["executiveSummary", "adaptedHierarchy", "functionalDuplications", "structuralGaps", "recommendations"]
};


const ReportSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-blue-800 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const HierarchyNodeView: React.FC<{ node: HierarchyNode }> = ({ node }) => (
    <div className="ml-4 pl-4 border-l-2 border-slate-300 dark:border-blue-700">
        <div className="font-bold">{node.name} <span className="text-xs font-normal text-slate-500">({node.level})</span></div>
        <div className="text-sm text-slate-600 dark:text-slate-400 pl-2">
            <p><strong>Manager:</strong> {node.manager}</p>
            <p><strong>Staff Count:</strong> {node.staffCount}</p>
            <p><strong>CNA Participation:</strong> {node.cnaParticipationRate.toFixed(0)}%</p>
            {node.notes && <p className="text-amber-600 dark:text-amber-400 italic"><strong>Note:</strong> {node.notes}</p>}
        </div>
        {node.children && node.children.length > 0 && (
            <div className="mt-2">
                {node.children.map(child => <HierarchyNodeView key={child.name} node={child} />)}
            </div>
        )}
    </div>
);


export const OrganisationalStructureReport: React.FC<ReportProps> = ({ data, establishmentData, agencyName, onClose }) => {
    const [report, setReport] = useState<AiOrganisationalStructureReport | null>(null);
    const [loading, setLoading] = useState(true);
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
                const prompt = `Please analyze the provided data for ${agencyName} to generate an Organisational Structure and Duplication Analysis Report.
                
                **Establishment Data (master list of all positions):**
                ${JSON.stringify(establishmentData, null, 2)}

                **CNA Data (for participation analysis):**
                ${JSON.stringify(data.map(o => ({ positionNumber: o.positionNumber, name: o.name, division: o.division })), null, 2)}
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_ORGANISATIONAL_STRUCTURE_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiReportSchema,
                    },
                });

                const parsedReport = JSON.parse(response.text.trim()) as AiOrganisationalStructureReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("Organisational Structure Report Error:", e);
                setError("An error occurred while generating the AI analysis for the organisational structure report.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, establishmentData, agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        alert(`Export to ${format} is not yet implemented for this report.`);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-slate-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold">Analyzing Organisational Structure...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is mapping reporting lines and identifying duplications.</p>
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
            return (
                <div className="space-y-6">
                    <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                    
                    <ReportSection title="Adapted Organisational Hierarchy">
                        {report.adaptedHierarchy.map(node => <HierarchyNodeView key={node.name} node={node} />)}
                    </ReportSection>

                    <ReportSection title="Functional Duplication Analysis">
                        <div className="space-y-4">
                            {report.functionalDuplications.map((item, index) => (
                                <div key={index} className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-200">{item.area}</h4>
                                    <p className="text-xs"><strong>Units Involved:</strong> {item.unitsInvolved.join(', ')}</p>
                                    <p className="mt-2 text-sm">{item.observation}</p>
                                    <p className="mt-2 text-sm"><strong>Recommendation:</strong> {item.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                     <ReportSection title="Structural Gaps Analysis">
                        <div className="space-y-4">
                            {report.structuralGaps.map((item, index) => (
                                <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                                    <h4 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5"/> {item.gapType}</h4>
                                    <p className="mt-2 text-sm">{item.description}</p>
                                    <p className="mt-2 text-sm"><strong>Implication:</strong> {item.implication}</p>
                                    <p className="mt-2 text-sm"><strong>Recommendation:</strong> {item.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>

                    <ReportSection title="Strategic Recommendations">
                        <ul className="list-decimal list-inside space-y-2">
                            {report.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                        </ul>
                    </ReportSection>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <PresentationChartLineIcon className="w-7 h-7 text-slate-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organisational Structure Analysis</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini.</p>
                </footer>
            </div>
        </div>
    );
};
