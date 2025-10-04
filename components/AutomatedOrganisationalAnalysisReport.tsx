import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AgencyType, QUESTION_TEXT_MAPPING, GradingGroup } from '../types';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

// --- AI Schema ---
const aiGeneratedSectionsSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        swotAnalysis: {
            type: Type.OBJECT,
            properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
        },
        organisationalCapabilityInsights: { type: Type.STRING },
        qualificationSkillsAlignment: { type: Type.STRING },
        functionalDuplicationStructuralGaps: { type: Type.STRING },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["executiveSummary", "swotAnalysis", "organisationalCapabilityInsights", "qualificationSkillsAlignment", "functionalDuplicationStructuralGaps", "recommendations"]
};

interface AiGeneratedSections {
    executiveSummary: string;
    swotAnalysis: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    organisationalCapabilityInsights: string;
    qualificationSkillsAlignment: string;
    functionalDuplicationStructuralGaps: string;
    recommendations: string[];
}


// --- Sub-components ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6 break-after-page ${className}`}>
        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 border-b border-slate-200 dark:border-blue-800 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white dark:bg-blue-900/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 ${className}`}>
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <div>{children}</div>
    </div>
);


// --- Main Component ---
export const AutomatedOrganisationalAnalysisReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<AiGeneratedSections | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const distributionChartRef = useRef<HTMLCanvasElement>(null);
    const statusChartRef = useRef<HTMLCanvasElement>(null);
    const experienceChartRef = useRef<HTMLCanvasElement>(null);

    const preProcessedData = useMemo(() => {
        // 2. Organisational Composition Profile
        const totalPositions = establishmentData.length;
        const vacantPositions = establishmentData.filter(p => p.status === 'Vacant' || p.occupant.toLowerCase() === 'vacant' || p.occupant.includes('*****VACANT*****') || (p.occupant || '').trim() === '').length;
        const filledPositions = totalPositions - vacantPositions;

        const distributionByGrade = establishmentData.reduce((acc, p) => {
            const grade = p.grade.split('-')[0].trim();
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const distributionByDivision = establishmentData.reduce((acc, p) => {
            acc[p.division] = (acc[p.division] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const distributionByStatus = establishmentData.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const experienceBrackets = data.reduce((acc, p) => {
            const years = p.yearsOfExperience;
            if (years === undefined) return acc;
            const bracket = years <= 2 ? '0-2 Yrs' : years <= 5 ? '3-5 Yrs' : years <= 10 ? '6-10 Yrs' : '10+ Yrs';
            acc[bracket] = (acc[bracket] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 3. Participation Coverage Analysis
        const filledPositionsByDivision = establishmentData
            .filter(p => p.status !== 'Vacant' && p.occupant.toLowerCase() !== 'vacant' && p.occupant.trim() !== '' && !p.occupant.includes('*****VACANT*****'))
            .reduce((acc, p) => {
                acc[p.division] = (acc[p.division] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
        const participationByDivision = Object.keys(distributionByDivision).map(div => {
            const totalStaffInDiv = filledPositionsByDivision[div] || 0;
            const participantsInDiv = data.filter(p => p.division === div).length;
            const rate = totalStaffInDiv > 0 ? (participantsInDiv / totalStaffInDiv) * 100 : 0;
            return { division: div, total: totalStaffInDiv, participants: participantsInDiv, rate: rate.toFixed(1) + '%' };
        }).sort((a,b) => parseFloat(a.rate) - parseFloat(b.rate));

        const totalParticipants = data.length;
        const overallResponseRate = filledPositions > 0 ? (totalParticipants / filledPositions) * 100 : 0;

        // 4. Organisational Capability Insights
        const capabilityByDivision = Object.keys(distributionByDivision).map(div => {
            const officersInDiv = data.filter(p => p.division === div);
            if (officersInDiv.length === 0) return { division: div, avg: 0, strengths: [], weaknesses: [] };
            
            const allRatings = officersInDiv.flatMap(o => o.capabilityRatings);
            const avg = allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.currentScore, 0) / allRatings.length : 0;

            const scoreMap: Record<string, number[]> = {};
            allRatings.forEach(r => {
                if(!scoreMap[r.questionCode]) scoreMap[r.questionCode] = [];
                scoreMap[r.questionCode].push(r.currentScore);
            });
            
            const avgScoresByQuestion = Object.entries(scoreMap).map(([code, scores]) => ({
                text: QUESTION_TEXT_MAPPING[code] || code,
                avg: scores.reduce((a,b) => a+b, 0) / scores.length
            }));

            const strengths = avgScoresByQuestion.sort((a,b) => b.avg - a.avg).slice(0,2);
            const weaknesses = avgScoresByQuestion.sort((a,b) => a.avg - b.avg).slice(0,2);
            
            return { division: div, avg: avg.toFixed(2), strengths, weaknesses };
        });

        return {
            totalPositions, vacantPositions, filledPositions, distributionByGrade,
            distributionByDivision, distributionByStatus, experienceBrackets,
            participationByDivision, capabilityByDivision,
            totalParticipants, overallResponseRate
        };
    }, [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const promptText = `
                Analyze the provided data to generate a comprehensive Organisational Analysis Report.
                
                **CONTEXT:**
                - Agency: ${agencyName} (${agencyType})
                - Total Participants in CNA: ${data.length}
                - Pre-analyzed data (composition, participation, capability averages) is provided below.
                
                **PRE-ANALYZED DATA:**
                ${JSON.stringify({
                    composition: { 
                        totalPositions: preProcessedData.totalPositions, 
                        vacantPositions: preProcessedData.vacantPositions 
                    },
                    participation: preProcessedData.participationByDivision,
                    capability: preProcessedData.capabilityByDivision
                }, null, 2)}
                
                **RAW DATA SAMPLES (for deeper analysis):**
                - Establishment Sample: ${JSON.stringify(establishmentData.slice(0, 20), null, 2)}
                - CNA Sample: ${JSON.stringify(data.slice(0, 20).map(o => ({ position: o.position, grade: o.grade, jobQualification: o.jobQualification, yearsOfExperience: o.yearsOfExperience, division: o.division })), null, 2)}
                
                **YOUR TASK:**
                Based on all the provided context and data, generate the following sections:
                1.  **Executive Summary:** A concise overview of the key findings.
                2.  **SWOT Analysis:** A SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for the organization based on the CNA and establishment data. Strengths and Weaknesses should be internal factors (e.g., high experience levels, critical skill gaps). Opportunities and Threats should be external factors (e.g., new government policies, lack of funding for training).
                3.  **Organisational Capability Insights:** A comprehensive narrative analysis of the organization's capabilities. Use both the CNA and Establishment data. Discuss overall proficiency, identify key strengths and weaknesses across different divisions, and highlight any notable trends in skills or performance ratings. This should be a detailed paragraph, not just a list.
                4.  **Qualification & Skills Alignment:** An analysis of mismatches between officer qualifications/experience and their roles.
                5.  **Functional Duplication & Structural Gaps:** An analysis of potential role overlaps or structural inefficiencies based on job titles and divisions.
                6.  **Recommendations:** A list of actionable recommendations.
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: aiGeneratedSectionsSchema,
                    },
                });
                // FIX: Add type assertion to ensure TypeScript knows the shape of the parsed JSON object.
                setAiContent(JSON.parse(response.text.trim()) as AiGeneratedSections);
            } catch (e) {
                console.error("Automated Organisational Analysis Report Error:", e);
                setError("An error occurred while generating the AI-powered sections of the report.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, establishmentData, agencyName, agencyType, preProcessedData]);

    const getReportDataForExport = (): ReportData => {
        const chartWidth = 180;
        const doughnutWidth = 90;

        const getImageData = (ref: React.RefObject<HTMLCanvasElement>, width: number) => {
            if (ref.current) {
                const dataUrl = ref.current.toDataURL('image/png');
                const height = (ref.current.height / ref.current.width) * width;
                return { type: 'image' as const, dataUrl, width, height };
            }
            return 'Chart not available';
        };

        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [aiContent?.executiveSummary || 'N/A'], headingStyle: 'Blue' },
            {
                title: "SWOT Analysis",
                content: [
                    `Strengths:\n- ${aiContent?.swotAnalysis.strengths.join('\n- ') || 'N/A'}`,
                    `\nWeaknesses:\n- ${aiContent?.swotAnalysis.weaknesses.join('\n- ') || 'N/A'}`,
                    `\nOpportunities:\n- ${aiContent?.swotAnalysis.opportunities.join('\n- ') || 'N/A'}`,
                    `\nThreats:\n- ${aiContent?.swotAnalysis.threats.join('\n- ') || 'N/A'}`,
                ],
                headingStyle: 'Green'
            },
            {
                title: "Organisational Composition Profile",
                content: [
                    `Total Positions: ${preProcessedData.totalPositions}, Filled: ${preProcessedData.filledPositions}, Vacant: ${preProcessedData.vacantPositions}`,
                    '\n**Distribution by Division**',
                    getImageData(distributionChartRef, chartWidth),
                    { type: 'table', headers: ['Division', 'Position Count'], rows: Object.entries(preProcessedData.distributionByDivision) },
                    '\n**Distribution by Status**',
                    getImageData(statusChartRef, doughnutWidth),
                    { type: 'table', headers: ['Status', 'Count'], rows: Object.entries(preProcessedData.distributionByStatus) },
                    '\n**Distribution by Experience**',
                    getImageData(experienceChartRef, doughnutWidth),
                    { type: 'table', headers: ['Experience Bracket', 'Count'], rows: Object.entries(preProcessedData.experienceBrackets) },
                ],
                headingStyle: 'Green'
            },
            { 
                title: "Participation Coverage Analysis", 
                content: [
                    `Overall Response Rate: ${preProcessedData.overallResponseRate.toFixed(1)}% (${preProcessedData.totalParticipants} of ${preProcessedData.filledPositions} filled positions).`,
                    { type: 'table', headers: ['Division', 'Total Staff (Filled)', 'CNA Participants', 'Response Rate (%)'], rows: preProcessedData.participationByDivision.map(p => [p.division, p.total, p.participants, p.rate]) }
                ], 
                headingStyle: 'Green' 
            },
            { title: "Organisational Capability Insights", content: [aiContent?.organisationalCapabilityInsights || 'N/A'], headingStyle: 'Blue' },
            { title: "Qualification & Skills Alignment", content: [aiContent?.qualificationSkillsAlignment || 'N/A'], headingStyle: 'Blue' },
            { title: "Functional Duplication & Structural Gaps", content: [aiContent?.functionalDuplicationStructuralGaps || 'N/A'], headingStyle: 'Blue' },
            { title: "Recommendations", content: [`- ${aiContent?.recommendations.join('\n- ') || 'N/A'}`], headingStyle: 'Green' },
        ];
        return {
            title: "Automated Organisational Analysis",
            sections
        };
    };
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
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
        if (!preProcessedData) return <div>Preparing data...</div>;
        return (
            <div className="space-y-6">
                <ReportSection title="1. Executive Summary">
                    {loading ? <p>Generating AI summary...</p> : error ? <p className="text-red-500">{error}</p> : <p>{aiContent?.executiveSummary}</p>}
                </ReportSection>

                <ReportSection title="2. Organisational Composition Profile">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ChartCard title="By Division" className="lg:col-span-2"><ChartComponent chartRef={distributionChartRef} type="bar" data={{ labels: Object.keys(preProcessedData.distributionByDivision), datasets: [{ label: 'Count', data: Object.values(preProcessedData.distributionByDivision), backgroundColor: '#3B82F6'}] }} /></ChartCard>
                        <ChartCard title="By Status"><ChartComponent chartRef={statusChartRef} type="doughnut" data={{ labels: Object.keys(preProcessedData.distributionByStatus), datasets: [{ label: 'Count', data: Object.values(preProcessedData.distributionByStatus), backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#6b7280']}] }} /></ChartCard>
                        <ChartCard title="By Experience"><ChartComponent chartRef={experienceChartRef} type="doughnut" data={{ labels: Object.keys(preProcessedData.experienceBrackets), datasets: [{ label: 'Count', data: Object.values(preProcessedData.experienceBrackets), backgroundColor: ['#84CC16', '#22C55E', '#10B981', '#0D9488']}] }} /></ChartCard>
                    </div>
                </ReportSection>

                <ReportSection title="3. Participation Coverage Analysis">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-blue-950/50">
                                <tr>
                                    <th className="p-2 font-semibold">Division</th>
                                    <th className="p-2 font-semibold text-center">Total Staff (Filled Positions)</th>
                                    <th className="p-2 font-semibold text-center">CNA Participants</th>
                                    <th className="p-2 font-semibold text-center">Response Rate (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preProcessedData.participationByDivision.map(p => (
                                    <tr key={p.division} className="border-b border-slate-200 dark:border-blue-800">
                                        <td className="p-2">{p.division}</td>
                                        <td className="p-2 text-center">{p.total}</td>
                                        <td className="p-2 text-center">{p.participants}</td>
                                        <td className="p-2 text-center">{p.rate}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-200 dark:bg-blue-950/50 font-bold">
                                <tr>
                                    <td className="p-2">Total Organisation</td>
                                    <td className="p-2 text-center">{preProcessedData.filledPositions}</td>
                                    <td className="p-2 text-center">{preProcessedData.totalParticipants}</td>
                                    <td className="p-2 text-center">{preProcessedData.overallResponseRate.toFixed(1)}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </ReportSection>
                
                 <ReportSection title="4. SWOT Analysis">
                    {loading ? <p>Generating AI analysis...</p> : error ? <p className="text-red-500">{error}</p> : aiContent && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h4 className="font-bold text-green-800 dark:text-green-200">Strengths</h4>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    {aiContent.swotAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <h4 className="font-bold text-red-800 dark:text-red-200">Weaknesses</h4>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    {aiContent.swotAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h4 className="font-bold text-blue-800 dark:text-blue-200">Opportunities</h4>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    {aiContent.swotAnalysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                                </ul>
                            </div>
                            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Threats</h4>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    {aiContent.swotAnalysis.threats.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </ReportSection>

                <ReportSection title="5. Organisational Capability Insights">
                    {loading ? <p>Generating AI analysis...</p> : error ? <p className="text-red-500">{error}</p> : <p className="whitespace-pre-wrap">{aiContent?.organisationalCapabilityInsights}</p>}
                </ReportSection>
                
                <ReportSection title="6. Qualification & Skills Alignment">
                    {loading ? <p>Generating AI analysis...</p> : error ? <p className="text-red-500">{error}</p> : <p className="whitespace-pre-wrap">{aiContent?.qualificationSkillsAlignment}</p>}
                </ReportSection>

                <ReportSection title="7. Functional Duplication & Structural Gaps">
                    {loading ? <p>Generating AI analysis...</p> : error ? <p className="text-red-500">{error}</p> : <p className="whitespace-pre-wrap">{aiContent?.functionalDuplicationStructuralGaps}</p>}
                </ReportSection>

                <ReportSection title="8. Recommendations">
                     {loading ? <p>Generating AI recommendations...</p> : error ? <p className="text-red-500">{error}</p> : <ul className="list-disc list-inside space-y-2">{aiContent?.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                </ReportSection>

            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <SparklesIcon className="w-7 h-7 text-amber-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automated Organisational Analysis</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-4 sm:p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};