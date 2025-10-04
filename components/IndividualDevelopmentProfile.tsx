import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiIndividualDevelopmentPlan, TrainingNeedCategory, AiLearningSolution, QUESTION_TEXT_MAPPING } from '../types';
import { AI_INDIVIDUAL_DEVELOPMENT_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
// FIX: Corrected import for export functions and added missing imports for export functionality.
import { XIcon, SparklesIcon, UserCircleIcon, CalendarDaysIcon, IdentificationIcon, AcademicCapIcon, BuildingOfficeIcon, ChevronDownIcon } from './icons';
import { ReportData, exportToPdf, exportToDocx, exportToXlsx } from '../utils/export';
import { ExportMenu } from './ExportMenu';

interface SummaryProps {
  officer: OfficerRecord;
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

const aiIndividualDevelopmentPlanSchema = {
    type: Type.OBJECT,
    properties: {
        officerStatus: { type: Type.STRING },
        age: { type: Type.NUMBER },
        performanceCategory: { type: Type.STRING, enum: ['Excellent', 'Satisfactory', 'Unsatisfactory'] },
        promotionPotential: { type: Type.STRING, enum: ['Overdue for Promotion', 'Promotion Now', 'Needs Development', 'Not Promotable'] },
        plan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, enum: ['Qualifications & Experience', 'Skills', 'Knowledge'] },
                    needs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                perceivedArea: { type: Type.STRING },
                                jobRequirement: { type: Type.STRING },
                                proposedCourse: { type: Type.STRING },
                                institution: { type: Type.STRING },
                                fundingSource: { type: Type.STRING },
                                yearOfCommencement: { type: Type.NUMBER },
                                remarks: { type: Type.STRING },
                                learningSolution: aiLearningSolutionSchema,
                            },
                             required: ["perceivedArea", "jobRequirement", "proposedCourse", "institution", "fundingSource", "yearOfCommencement", "remarks", "learningSolution"]
                        }
                    }
                },
                required: ["category", "needs"]
            }
        }
    },
    required: ["officerStatus", "age", "performanceCategory", "promotionPotential", "plan"]
};


export const IndividualDevelopmentProfile: React.FC<SummaryProps> = ({ officer, agencyName, onClose }) => {
    
    const [report, setReport] = useState<AiIndividualDevelopmentPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

Please generate an Individual Development Plan for the following officer:\n${JSON.stringify(officer, null, 2)}`;
                
                const systemInstruction = AI_INDIVIDUAL_DEVELOPMENT_PLAN_PROMPT_INSTRUCTIONS.replace('{AGENCY_NAME}', agencyName);
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: systemInstruction,
                        responseMimeType: "application/json",
                        responseSchema: aiIndividualDevelopmentPlanSchema,
                    },
                });

                const jsonStr = response.text.trim();
                const parsedReport = JSON.parse(jsonStr) as AiIndividualDevelopmentPlan;
                setReport(parsedReport);

            } catch (e) {
                console.error("AI Individual Development Plan Error:", e);
                setError("An error occurred while generating the AI development plan. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [officer, agencyName]);

    const toggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const InfoItem: React.FC<{ icon: React.ElementType, label: string, value?: string | number }> = ({ icon: Icon, label, value }) => (
        <div className="flex items-start">
            <Icon className="w-4 h-4 text-slate-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
                <p className="font-semibold text-slate-600 dark:text-slate-400">{label}</p>
                <p className="text-slate-800 dark:text-slate-200">{value || 'N/A'}</p>
            </div>
        </div>
    );
    
     const LegendBox: React.FC<{ title: string, content: string | React.ReactNode, bgColorClass?: string }> = ({ title, content, bgColorClass = 'bg-white dark:bg-slate-800' }) => (
        <div className={`p-2 border border-slate-300 dark:border-slate-600 ${bgColorClass}`}>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</p>
            <div className="text-xs text-slate-600 dark:text-slate-400">{content}</div>
        </div>
    );

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
    
        const officerDetails: (string | number | undefined)[][] = [
            ['Division', officer.division],
            ['Name', officer.name],
            ['Designation', officer.gradingGroup],
            ['Position No.', officer.positionNumber],
            ['Grade', officer.grade],
            ['Date of Birth', officer.dateOfBirth],
            ['Commencement Date', officer.commencementDate],
            ['Highest Qualification', officer.jobQualification],
            ['Officer Status', report.officerStatus],
        ];
        
        const performanceDetails: (string | number)[][] = [
            ['Age', `${report.age} years`],
            ['Current Performance', report.performanceCategory],
            ['Promotion Potential', report.promotionPotential],
        ];
    
        const trainingNeedsRows = report.plan.flatMap(category => 
            category.needs.map(need => [
                category.category,
                need.perceivedArea,
                need.jobRequirement,
                need.proposedCourse, 
                need.institution,
                need.fundingSource,
                need.yearOfCommencement,
                need.remarks,
                need.learningSolution.experiential70,
                need.learningSolution.social20,
                need.learningSolution.formal10,
            ])
        );
        
        const trainingNeedsHeaders = [
            'Category', 'Perceived Area', 'Job Requirement', 'Proposed Course', 
            'Institution', 'Funding Source', 'Year', 'Remarks',
            '70% Experiential', '20% Social', '10% Formal'
        ];
    
        return {
            title: `Training & Development Plan - ${officer.name}`,
            sections: [
                { title: "Officer Details", content: [{ type: 'table', headers: ['Field', 'Value'], rows: officerDetails }] },
                { title: "Performance Summary", content: [{ type: 'table', headers: ['Metric', 'Value'], rows: performanceDetails }] },
                { 
                    title: "Training & Development Needs", 
                    content: [{ type: 'table', headers: trainingNeedsHeaders, rows: trainingNeedsRows }],
                    orientation: 'landscape'
                }
            ]
        };
    };
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
            }
        } catch (e) {
            console.error("Export failed:", e);
            alert("Could not export report data.");
        }
    };


    const renderContent = () => {
        if (loading) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[500px]">
                    <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Building Individual Plan</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is preparing the Training & Development Plan for {officer.name}...</p>
                </div>
            )
        }
        
        if (error) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[500px] bg-red-50 dark:bg-red-900/20">
                    <XIcon className="w-16 h-16 text-red-500" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            )
        }
        
        if (!report) return null;
        
        return (
            <div className="p-4 bg-white dark:bg-slate-900">
                <h1 className="text-center font-bold text-lg mb-2 text-slate-900 dark:text-white uppercase tracking-wider">TRAINING & DEVELOPMENT PLAN 2026 - 2029</h1>

                {/* Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 border border-slate-300 dark:border-slate-600 p-2 text-sm mb-4">
                    <InfoItem icon={BuildingOfficeIcon} label="Division" value={officer.division} />
                    <InfoItem icon={UserCircleIcon} label="Name" value={officer.name} />
                    <InfoItem icon={IdentificationIcon} label="Designation" value={officer.gradingGroup} />
                    <InfoItem icon={IdentificationIcon} label="Position No." value={officer.positionNumber} />
                    <InfoItem icon={IdentificationIcon} label="Grading Group" value={officer.grade} />
                    <InfoItem icon={CalendarDaysIcon} label="Date of Birth" value={officer.dateOfBirth} />
                    <InfoItem icon={CalendarDaysIcon} label="Commencement Date" value={officer.commencementDate} />
                    <InfoItem icon={AcademicCapIcon} label="Highest Qualification" value={officer.jobQualification} />
                    <InfoItem icon={UserCircleIcon} label="Officer Status" value={report.officerStatus} />
                </div>
                
                {/* Main Table */}
                <div className="overflow-x-auto border border-slate-300 dark:border-slate-600">
                     <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Perceived Areas of Training</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Job Requirements</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Proposed Training Courses</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Institution</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Funding Source</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Year of Commencement</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600">Remarks</th>
                                <th className="p-1 border border-slate-300 dark:border-slate-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.plan.map(category => (
                                <React.Fragment key={category.category}>
                                    <tr>
                                        <td colSpan={8} className="p-1 font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">{category.category}</td>
                                    </tr>
                                    {category.needs.map((need, index) => {
                                        const rowKey = `${category.category}-${index}`;
                                        const isExpanded = expandedRows.has(rowKey);
                                        return (
                                        <React.Fragment key={rowKey}>
                                            <tr className="bg-white dark:bg-slate-900">
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.perceivedArea}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.jobRequirement}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.proposedCourse}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.institution}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.fundingSource}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.yearOfCommencement}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600">{need.remarks}</td>
                                                <td className="p-1 border border-slate-300 dark:border-slate-600 text-center">
                                                    <button onClick={() => toggleRow(rowKey)} aria-expanded={isExpanded} className="p-1">
                                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                    <td colSpan={8} className="p-2 border border-slate-300 dark:border-slate-600">
                                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-md">
                                                            <h4 className="font-bold text-sm mb-2 text-slate-700 dark:text-slate-200">70:20:10 Learning Solution:</h4>
                                                            <div className="space-y-1.5 text-xs">
                                                                <p><strong>70% Experiential:</strong> {need.learningSolution.experiential70}</p>
                                                                <p><strong>20% Social:</strong> {need.learningSolution.social20}</p>
                                                                <p><strong>10% Formal:</strong> {need.learningSolution.formal10}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )})}
                                    {category.needs.length === 0 && (
                                         <tr><td colSpan={8} className="p-1 text-center italic text-slate-500 border border-slate-300 dark:border-slate-600">No specific needs identified in this category.</td></tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Legends */}
                <div className="grid grid-cols-3 gap-px mt-4 border border-slate-300 dark:border-slate-600 bg-slate-300 dark:bg-slate-600">
                    <LegendBox title="Age" content={`${report.age} years`} />
                    <LegendBox title="Current Performance" content={
                        <ul>
                            <li>E: Excellent (86-100%) - {report.performanceCategory === 'Excellent' ? '✓' : ''}</li>
                            <li>S: Satisfactory (50-85%) - {report.performanceCategory === 'Satisfactory' ? '✓' : ''}</li>
                            <li>U: Unsatisfactory (0-49%) - {report.performanceCategory === 'Unsatisfactory' ? '✓' : ''}</li>
                        </ul>
                    } />
                    <LegendBox title="Promotion Potential" content={
                         <ul>
                            <li>OP: Overdue for Promotion - {report.promotionPotential === 'Overdue for Promotion' ? '✓' : ''}</li>
                            <li>PN: Promotion Now - {report.promotionPotential === 'Promotion Now' ? '✓' : ''}</li>
                            <li>ND: Needs Development - {report.promotionPotential === 'Needs Development' ? '✓' : ''}</li>
                            <li>NP: Not Promotable - {report.promotionPotential === 'Not Promotable' ? '✓' : ''}</li>
                        </ul>
                    } />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Individual Development Plan</h1>
                        <p className="text-md text-slate-600 dark:text-slate-400">
                            {officer.name} - {officer.position} ({officer.grade})
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close summary">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};