import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING, EstablishmentRecord } from '../types';
import { AI_AUTOMATED_ELIGIBILITY_FORM_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ClipboardDocumentListIcon, InformationCircleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, exportToCsv, copyForSheets } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[]; // This is the CNA data
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

interface AutomatedEligibleOfficer {
    branchDivision: string;
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: string;
    cnaSubmitted: 'Yes' | 'No';
    beenSentForStudies: 'Yes' | 'No';
    institution: string;
    course: string;
    year2025: boolean;
    year2026: boolean;
    year2027: boolean;
    year2028: boolean;
    year2029: boolean;
}

const aiAutomatedFormSchema = {
    type: Type.OBJECT,
    properties: {
        officers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    branchDivision: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    status: { type: Type.STRING },
                    cnaSubmitted: { type: Type.STRING, enum: ['Yes', 'No'] },
                    beenSentForStudies: { type: Type.STRING, enum: ['Yes', 'No'] },
                    institution: { type: Type.STRING },
                    course: { type: Type.STRING },
                    year2025: { type: Type.BOOLEAN },
                    year2026: { type: Type.BOOLEAN },
                    year2027: { type: Type.BOOLEAN },
                    year2028: { type: Type.BOOLEAN },
                    year2029: { type: Type.BOOLEAN },
                },
                required: ["branchDivision", "positionNumber", "grade", "designation", "occupant", "status", "cnaSubmitted", "beenSentForStudies", "institution", "course", "year2025", "year2026", "year2027", "year2028", "year2029"]
            }
        }
    },
    required: ["officers"]
};

export const AutomatedEligibilityForm: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [eligibleOfficers, setEligibleOfficers] = useState<AutomatedEligibleOfficer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const yearHeaders = [2025, 2026, 2027, 2028, 2029];

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all public service agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateForm = async () => {
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
                const promptText = `Please analyze the following CNA and Establishment data to populate the training eligibility form.\n\nCONTEXT: ${promptContext}\n\nCNA DATA (contains submission status, training history, and capability gaps):\n${JSON.stringify(data, null, 2)}\n\nESTABLISHMENT DATA (master list of all positions and their status):\n${JSON.stringify(establishmentData, null, 2)}`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_AUTOMATED_ELIGIBILITY_FORM_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedFormSchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as { officers: AutomatedEligibleOfficer[] };
                setEligibleOfficers(result.officers);
            } catch (e) {
                console.error("AI Automated Form Error:", e);
                setError("An error occurred while generating the automated form. The AI may have returned an unexpected format.");
            } finally {
                setLoading(false);
            }
        };
        generateForm();
    }, [data, establishmentData, promptContext]);

    const getReportDataForExport = (): ReportData => {
        const tableHeaders = ['Branch/Division', 'Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submitted', 'Been Sent for Studies', 'Institution', 'Course', ...yearHeaders.map(String)];
        
        const tableRows = eligibleOfficers.map(o => [
            o.branchDivision,
            o.positionNumber,
            o.grade,
            o.designation,
            o.occupant,
            o.status,
            o.cnaSubmitted,
            o.beenSentForStudies,
            o.institution,
            o.course,
            ...yearHeaders.map(year => (o as any)[`year${year}`] ? '✓' : '')
        ]);

        return {
            title: "Eligible Officers for Training",
            sections: [{ title: "Automated Eligibility List", content: [{ type: 'table', headers: tableHeaders, rows: tableRows }] }]
        };
    };
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(reportData);
            else if (format === 'sheets') copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(err.toString()));
            else if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };

    const getStatusClass = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'confirmed') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        if (lowerStatus === 'probation') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        if (lowerStatus === 'acting') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        return 'bg-gray-100 text-gray-800 dark:bg-blue-800 dark:text-gray-300'; // for other, displaced, etc.
    };
    
    const getCnaClass = (cna: 'Yes' | 'No') => {
        if (cna === 'Yes') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    };


    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-blue-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Populating Automated Form...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is analyzing data and identifying eligible officers.</p>
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
        return (
            <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-4 sm:p-6">
                <div className="flex items-start gap-3 p-3 mb-4 text-sm text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <InformationCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>AI-Generated Content:</strong> This list is automatically generated. Fields such as <strong>'Institution'</strong>, <strong>'Course'</strong>, and the proposed <strong>'Training Years'</strong> are AI recommendations based on the CNA data provided. If information was missing in the source file, these fields may be generic or require your input. Please review each record. You can make corrections and add missing details using the <strong>'Eligible Officers (Manual Form)'</strong> found in the 'Planning & Forms' menu.
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-200 dark:bg-blue-800/50">
                            <tr>
                                {['Branch/Division', 'Position No.', 'Grade', 'Designation', 'Occupant', 'Status', 'CNA Submitted', 'Been Sent for Studies', 'Institution', 'Course', ...yearHeaders].map(h => 
                                    <th key={h} className="p-2 font-semibold">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {eligibleOfficers.map((officer, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-blue-800 hover:bg-gray-50 dark:hover:bg-blue-900/20">
                                    <td className="p-2">{officer.branchDivision}</td>
                                    <td className="p-2">{officer.positionNumber}</td>
                                    <td className="p-2">{officer.grade}</td>
                                    <td className="p-2 font-semibold">{officer.designation}</td>
                                    <td className="p-2">{officer.occupant}</td>
                                    <td className="p-2"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(officer.status)}`}>{officer.status}</span></td>
                                    <td className="p-2"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCnaClass(officer.cnaSubmitted)}`}>{officer.cnaSubmitted}</span></td>
                                    <td className="p-2">{officer.beenSentForStudies}</td>
                                    <td className="p-2">{officer.institution}</td>
                                    <td className="p-2">{officer.course}</td>
                                    {yearHeaders.map(year => (
                                        <td key={year} className="p-2 text-center">
                                            <input type="checkbox" checked={(officer as any)[`year${year}`]} readOnly className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-default" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {eligibleOfficers.length === 0 && <p className="text-center p-8 text-gray-500">No non-vacant officers found in the establishment data.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ClipboardDocumentListIcon className="w-7 h-7 text-blue-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stage 2: Eligible Officers for Training</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Automated Form</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Form automatically populated by Google Gemini. Please review for accuracy.</p>
                </footer>
            </div>
        </div>
    );
};