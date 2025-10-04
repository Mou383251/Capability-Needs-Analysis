import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING, AiLndFrameworkReport, LndFrameworkItem } from '../types';
import { KRA_DATA } from '../data/kra';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { INFORMAL_TRAINING_TYPES_CONTEXT, PERFORMANCE_APPRAISAL_COMPETENCIES_CONTEXT, SDG_ALIGNMENT_CONTEXT, MTDP4_ALIGNMENT_CONTEXT } from '../constants';

// --- Types for this specific report ---
interface ReportProps {
    data: OfficerRecord[];
    agencyType: AgencyType;
    agencyName: string;
    onClose: () => void;
}

// --- AI Schema and Prompt ---
const AI_PROMPT_INSTRUCTIONS = `
You are an expert Learning & Development strategist for the Papua New Guinea (PNG) public service.
Your task is to analyze the entire provided CNA dataset and generate a comprehensive, consolidated Learning & Development Plan that strictly follows the "Professional Development Based on 70%" framework.

${PERFORMANCE_APPRAISAL_COMPETENCIES_CONTEXT}

**FRAMEWORK RULES (MANDATORY):**
1.  **MODEL:** All recommendations must be based on the 70:20:10 model.
2.  **PRIORITIZE INFORMAL/LOW-COST:** You must prioritize low-cost or no-cost internal development opportunities (70% and 20% components) before recommending formal, costly training (10% component). You MUST use the provided list of Informal Training Types for inspiration.
3.  **STRUCTURE:** The output MUST be a table with the following exact columns:
    - Capability Categories
    - Description & Priority KRA
    - To Develop/Provide (70%)
    - Who Will You Ask for Help & How (20%)
    - Formal Training & Self Study (10%)
    - Who to Attend Training
    - When
    - L&D Provider
    - Budget

**ANALYSIS & CONTENT GENERATION LOGIC:**
1.  **Analyze Gaps:** Review all \`capabilityRatings\` and TNA responses (H7, H8, H9) from the entire dataset to identify the most critical and common training needs across the organization.
2.  **Consolidate Needs:** Group similar individual gaps into broader strategic training initiatives. For example, multiple low scores on questions B3 and A3 should be consolidated into one initiative about "Understanding Organizational Goals".
3.  **Populate the Framework Table:** For each consolidated training initiative, create one row and populate the columns as follows:
    - **Capability Categories:** Classify the initiative based on the primary CNA questionnaire section it addresses. Use one of the following exact section titles. For example, if a gap relates to question A1, the category must be 'Section A: Strategic Alignment'.
        - 'Section A: Strategic Alignment'
        - 'Section B: Operational Effectiveness & Values'
        - 'Section C: Leadership & Development'
        - 'Section D: Performance Management'
        - 'Section E: ICT Capability'
        - 'Section F: Public Finance Management'
        - 'Section G: Communication & Stakeholder Engagement'
        - 'Section H: Training Needs Analysis'
    - **Description & Priority KRA:** Write a brief description of the capability gap. Then, align this gap with the SINGLE most relevant Key Result Area (KRA) from the provided KRA list. **Finally, state which UN SDG and MTDP IV SPA the capability supports.** Format as "Description - KRA: [KRA Name] - Supports SDG: [SDG Name] - Aligns with MTDP IV SPA: [SPA Name]". **When the initiative relates to 'Section A: Strategic Alignment', you MUST also incorporate the following interpretation: a high score in understanding the corporate plan implies the officer also understands how the plan aligns with the Department's other plans, the Medium Term Development Plan IV (MTDP IV), PNG Vision 2050, and the Sustainable Development Goals (SDGs). A low score indicates a critical disconnect from the broader national strategic direction.**
    - **To Develop/Provide (70%):** Suggest practical, workplace-based learning activities. These MUST be primarily informal, low-cost options drawn from the 'Informal Training Types' list provided below.
    - **Who Will You Ask for Help & How (20%):** Suggest social learning activities. These MUST be primarily informal, low-cost options drawn from the 'Informal Training Types' list provided below.
    - **Formal Training & Self Study (10%):** Suggest formal courses only when significant gaps are identified. Include self-study options.
    - **Who to Attend Training:** Specify the target audience (e.g., "All Junior Officers", "Managers in Corporate Services", "All Staff").
    - **When:** Propose a realistic timeline (e.g., "Q3 2025", "Ongoing").
    - **L&D Provider:** Name a plausible provider (e.g., "Internal HR Division", "SILAG", "Mentoring Program Lead").
    - **Budget:** Provide a realistic cost estimate in PNG Kina (PGK), formatted as a string (e.g., "K15,000.00", "No direct cost").
4.  **Executive Summary:** Write a brief, high-level summary of the plan's key focus areas, the strategic approach (emphasizing the 70:20:10 model), and the expected impact on organizational capability. **You MUST also mention how the plan's focus areas align with key UN Sustainable Development Goals (SDGs) and the MTDP IV.**

**CONTEXT: INFORMAL TRAINING TYPES**
${INFORMAL_TRAINING_TYPES_CONTEXT}

**CONTEXT: STRATEGIC ALIGNMENT**
${SDG_ALIGNMENT_CONTEXT}
${MTDP4_ALIGNMENT_CONTEXT}

**ADDITIONAL TASK 1: PUBLIC SERVICE INDUCTION PLAN (MANDATORY)**
In addition to the main framework plan, you MUST generate a separate 5-year plan for the "Certificate II in Government (Public Service Induction)" program, from 2026 to 2030.

**Induction Plan Rules:**
1.  **DATA SOURCE:** Analyze the provided CNA data to identify all officers with an \`employmentStatus\` of "Probation". These are the primary candidates.
2.  **TABLE STRUCTURE:** Create an array of objects, one for each year from 2026 to 2030, with the specified fields.
3.  **POPULATION LOGIC:**
    - **For 2026:** Populate with all probation officers identified from the CNA data.
    - **For 2027-2030:** Use reasonable placeholder estimates for officer numbers (e.g., 2-5) and set names to "To be identified by HR".
    - **Comments:** The default comment MUST be: "HR to identify probation officers for induction training yearly".

**ADDITIONAL TASK 2: SKILLS & COMPETENCY-BASED TRAINING PLAN (MANDATORY)**
Generate a separate 5-year plan for common skills and competency-based training, from 2026 to 2030.

**Skills Plan Rules:**
1.  **DATA SOURCE:** Analyze CNA data (\`technicalCapabilityGaps\`, \`leadershipCapabilityGaps\`, \`ictSkills\`, \`tnaDesiredCourses\`, and low-scoring ratings) to identify needs for programs like: 'Time Management', 'SME Financial & Digital Literacy', 'Client/Customer Care', 'Computing Skills', 'TB/TB Dot Skills Training', 'STI/HIV Skills Training'.
2.  **TABLE STRUCTURE:** Create an array of objects for each program each year with the specified fields.
3.  **POPULATION LOGIC:**
    - **For 2026:** Populate the table with programs relevant to identified gaps. Determine the 'Total No. of Officers' for each program by analyzing the data.
    - **For 2027-2030:** Create placeholder entries for recurring, essential training with estimated officer numbers.
    - **Costs:** Estimate a 'Unit Cost (K) per Quarter' per officer/session and calculate 'Estimated Total Cost (K)'. For internal workshops, costs should be "–".
    - **Comments:** For internal workshops, use "HQ to organise internal workshop for this training". Otherwise, use "–".

**ADDITIONAL TASK 3: IN-COUNTRY SHORT TERM TRAINING PLAN (MANDATORY)**
Generate a separate 5-year plan for in-country short-term training, from 2026 to 2030.

**In-Country Plan Rules:**
1.  **DATA SOURCE:** Analyze CNA data to identify needs for short-term, specialized professional development.
2.  **GROUPING (CRITICAL):** You MUST group all training entries by the functional division of the target officers. The final output for this section must be an array of objects, where each object represents a division and contains its list of training items. Use the following divisions: 'Executive Branch', 'Corporate Services', 'Allied Health Workers', 'Nursing', 'Community Health Workers', 'Districts'.
3.  **TABLE STRUCTURE:** For each training item within a division, create an object with the specified fields.
4.  **POPULATION LOGIC:**
    - Pull the 'Total No. of Officers' from the CNA data based on identified needs.
    - Automatically calculate 'Total Cost (K)' by multiplying 'Unit Cost (K)/Yr' with 'Total No. of Officers'. Format the output as a string (e.g., "K5,000").
    - If a program is identified as being 'donor-funded', the 'Comments' field MUST contain "Donor funded", and both cost fields should be "–".

**ADDITIONAL TASK 4: OVERSEAS LONG TERM TRAINING PLAN (MANDATORY)**
Finally, generate a separate training plan for "Overseas Long Term Training" for the period 2025-2028.

**Overseas Plan Rules:**
1.  **DATA SOURCE:** You MUST use the provided CNA data to identify suitable candidates. Validate their position and status against the Establishment data. Candidates should ideally be high-performers (SPA rating 4 or 5) in senior roles ('Senior Officer', 'Manager', 'Senior Management') with clear long-term career goals expressed in their TNA responses.
2.  **STRUCTURE:** The output MUST be grouped by the officer's functional division from the CNA data.
3.  **DATA MAPPING:**
    - \`officer\`: The officer's name from the CNA data.
    - \`profession\`: The officer's position from the CNA data.
    - \`program\`: Propose a relevant postgraduate program (e.g., Master's degree) based on the officer's role and their \`tnaDesiredCourses\`.
    - \`provider\`: Set to "Donor".
    - \`duration\`: Set to "2 years".
    - \`studyYears\`: This MUST be an array of two consecutive numbers representing the study period. The start year must be between 2025 and 2027 to ensure the plan fits within the 2025-2028 period. Prioritize higher performers for earlier start dates.
    - \`totalOfficers\`: Set to 1.
    - \`unitCost\`: Set to "40,000".
    - \`totalCost\`: Set to "40,000".
    - \`comments\`: Briefly note the rationale for selection (e.g., "High performer, succession planning").

**OUTPUT RULES:**
- The output MUST be a valid JSON object strictly adhering to the schema.
- The \`frameworkPlan\` array should contain 8-12 prioritized initiatives.
`;

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        frameworkPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    capabilityCategory: { type: Type.STRING },
                    descriptionAndKRA: { type: Type.STRING },
                    develop70: { type: Type.STRING },
                    help20: { type: Type.STRING },
                    formal10: { type: Type.STRING },
                    whoToAttend: { type: Type.STRING },
                    when: { type: Type.STRING },
                    provider: { type: Type.STRING },
                    budget: { type: Type.STRING },
                },
                required: ["capabilityCategory", "descriptionAndKRA", "develop70", "help20", "formal10", "whoToAttend", "when", "provider", "budget"]
            }
        },
        inductionProgramPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    year: { type: Type.NUMBER },
                    program: { type: Type.STRING },
                    provider: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    numberOfOfficers: { type: Type.NUMBER },
                    officerNames: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING },
                    grandTotalCost: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
                required: ["year", "program", "provider", "duration", "numberOfOfficers", "officerNames", "estimatedCost", "grandTotalCost", "comments"]
            }
        },
        skillsAndCompetencyPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    year: { type: Type.NUMBER },
                    program: { type: Type.STRING },
                    provider: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    deliveryMode: { type: Type.STRING },
                    yearOfStudy: { type: Type.STRING },
                    totalOfficers: { type: Type.NUMBER },
                    unitCost: { type: Type.STRING },
                    estimatedTotalCost: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
                required: ["year", "program", "provider", "duration", "deliveryMode", "yearOfStudy", "totalOfficers", "unitCost", "estimatedTotalCost", "comments"]
            }
        },
        inCountryShortTermPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    trainingItems: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                year: { type: Type.NUMBER },
                                profession: { type: Type.STRING },
                                program: { type: Type.STRING },
                                provider: { type: Type.STRING },
                                duration: { type: Type.STRING },
                                yearOfStudy: { type: Type.STRING },
                                totalOfficers: { type: Type.NUMBER },
                                unitCost: { type: Type.STRING },
                                totalCost: { type: Type.STRING },
                                comments: { type: Type.STRING },
                            },
                            required: ["year", "profession", "program", "provider", "duration", "yearOfStudy", "totalOfficers", "unitCost", "totalCost", "comments"]
                        }
                    }
                },
                required: ["division", "trainingItems"]
            }
        },
        overseasLongTermPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    subDivision: { type: Type.STRING },
                    trainingItems: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                officer: { type: Type.STRING },
                                profession: { type: Type.STRING },
                                program: { type: Type.STRING },
                                provider: { type: Type.STRING },
                                duration: { type: Type.STRING },
                                studyYears: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                totalOfficers: { type: Type.NUMBER },
                                unitCost: { type: Type.STRING },
                                totalCost: { type: Type.STRING },
                                comments: { type: Type.STRING },
                            },
                            required: ["officer", "profession", "program", "provider", "duration", "studyYears", "totalOfficers", "unitCost", "totalCost", "comments"]
                        }
                    }
                },
                required: ["division", "trainingItems"]
            }
        }
    },
    required: ["executiveSummary", "frameworkPlan", "inductionProgramPlan", "skillsAndCompetencyPlan", "inCountryShortTermPlan", "overseasLongTermPlan"]
};

// --- Sub-components ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

// --- Main Component ---
export const TrainingNeedsAnalysisReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiLndFrameworkReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                const promptText = `Please analyze the following CNA data to generate a consolidated L&D Plan.\n\nCONTEXT: ${promptContext}\n\nKRA DATA (for alignment):\n${JSON.stringify(KRA_DATA, null, 2)}\n\nCNA DATA:\n${JSON.stringify(data, null, 2)}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                    config: {
                        systemInstruction: AI_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });
                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error("L&D Framework Report Error:", e);
                setError("An error occurred while generating the AI analysis. The model may have returned an unexpected format or been blocked.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, promptContext, agencyName, agencyType]);

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            { 
                title: "L&D Framework Plan", 
                content: [{ 
                    type: 'table', 
                    headers: [
                        'Capability Category', 'Description & Priority KRA', '70% (Workplace)', '20% (Social)', '10% (Formal)',
                        'Target Audience', 'When', 'Provider', 'Budget (PGK)'
                    ], 
                    rows: report.frameworkPlan.map(item => [
                        item.capabilityCategory, item.descriptionAndKRA, item.develop70, item.help20, item.formal10,
                        item.whoToAttend, item.when, item.provider, item.budget
                    ])
                }],
                orientation: 'landscape' 
            }
        ];

        if (report.inductionProgramPlan) {
            sections.push({
                title: "Formal Qualification Program: Public Service Induction",
                content: [{
                    type: 'table',
                    headers: ['Year', 'Program', 'Provider', 'Duration', 'No. of Officers', 'Officer Names', 'Est. Cost/Officer (K)', 'Total Cost (K)', 'Comments'],
                    rows: report.inductionProgramPlan.map(item => [
                        item.year, item.program, item.provider, item.duration, item.numberOfOfficers, item.officerNames, item.estimatedCost, item.grandTotalCost, item.comments
                    ])
                }],
                orientation: 'landscape'
            });
        }

        if (report.skillsAndCompetencyPlan) {
             sections.push({
                title: "Skills & Competency-Based Training",
                content: [{
                    type: 'table',
                    headers: ['Year', 'Program', 'Provider', 'Duration', 'Delivery Mode', 'Year of Study', 'Total No. of Officers', 'Unit Cost (K)', 'Estimated Total Cost (K)', 'Comments'],
                    rows: report.skillsAndCompetencyPlan.map(item => [
                        item.year, item.program, item.provider, item.duration, item.deliveryMode, item.yearOfStudy, item.totalOfficers, item.unitCost, item.estimatedTotalCost, item.comments
                    ])
                }],
                orientation: 'landscape'
            });
        }
        
        if (report.inCountryShortTermPlan) {
            report.inCountryShortTermPlan.forEach(divisionGroup => {
                sections.push({
                    title: `In-Country Short Term Training: ${divisionGroup.division}`,
                    content: [{
                        type: 'table',
                        headers: ['Year', 'Profession', 'Program', 'Provider', 'Duration', 'Year of Study', 'Total Officers', 'Unit Cost (K)/Yr', 'Total Cost (K)', 'Comments'],
                        rows: divisionGroup.trainingItems.map(item => [
                            item.year,
                            item.profession,
                            item.program,
                            item.provider,
                            item.duration,
                            item.yearOfStudy,
                            item.totalOfficers,
                            item.unitCost,
                            item.totalCost,
                            item.comments,
                        ])
                    }],
                    orientation: 'landscape'
                });
            });
        }
        
        if (report.overseasLongTermPlan) {
            const yearRange = [2025, 2026, 2027, 2028];
            report.overseasLongTermPlan.forEach(divisionGroup => {
                sections.push({
                    title: `Overseas Long Term Training: ${divisionGroup.subDivision ? `${divisionGroup.division} - ${divisionGroup.subDivision}` : divisionGroup.division}`,
                    content: [{
                        type: 'table',
                        headers: ['Officer', 'Profession', 'Program', 'Provider', 'Duration', ...yearRange.map(String), 'Total Officers', 'Unit Cost (K)/Yr', 'Total Cost (K)', 'Comments'],
                        rows: divisionGroup.trainingItems.map(item => [
                            item.officer,
                            item.profession,
                            item.program,
                            item.provider,
                            item.duration,
                            ...yearRange.map(year => (item.studyYears.includes(year) ? '✓' : '')),
                            item.totalOfficers,
                            item.unitCost,
                            item.totalCost,
                            item.comments,
                        ])
                    }],
                    orientation: 'landscape'
                });
            });
        }
    
        return {
            title: "Consolidated Learning & Development Plan",
            sections
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
                <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating New L&D Report...</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is creating a consolidated plan using the 70:20:10 framework.</p>
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
                <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                
                <ReportSection title="Consolidated L&D Framework Plan">
                    <p className="mb-4">This table presents the core of the L&D strategy, built on the 70:20:10 model. It consolidates all identified organizational capability gaps into prioritized, actionable training initiatives. Each row outlines a specific capability area, links it to a Key Result Area (KRA), and provides a blended learning solution that prioritizes low-cost, high-impact experiential (70%) and social (20%) learning before formal training (10%).</p>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-200 dark:bg-blue-800/50">
                                <tr>
                                    {['Capability Category', 'Description & KRA', 'To Develop/Provide (70%)', 'Who to Ask for Help (20%)', 'Formal Training (10%)', 'Who to Attend', 'When', 'Provider', 'Budget'].map(h => (
                                        <th key={h} className="p-2 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {report.frameworkPlan.map((item, index) => (
                                    <tr key={index} className="bg-white dark:bg-slate-900/50">
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top font-semibold">{item.capabilityCategory}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.descriptionAndKRA}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.develop70}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.help20}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.formal10}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.whoToAttend}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.when}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.provider}</td>
                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.budget}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ReportSection>
                
                {report.inductionProgramPlan && (
                    <ReportSection title="Formal Qualification Program Details: Public Service Induction (10%)">
                        <p className="mb-4">This section outlines the mandatory 5-year plan for the 'Certificate II in Government (Public Service Induction)'. It identifies current officers on probation and provides a forecast for future new hires, ensuring all incoming staff receive foundational knowledge of public service procedures, ethics, and values.</p>
                        <div className="mb-2 text-sm">
                            <p><strong>PROGRAM:</strong> Certificate II in Government (Public Service Induction)</p>
                            <p><strong>YEAR RANGE:</strong> 2026–2030</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-200 dark:bg-blue-800/50">
                                    <tr>
                                        {['Year', 'Program', 'Training Provider', 'Duration', 'No. of Officers', 'Officer Names', 'Estimated Cost (K)', 'Grand Total Cost (K)', 'Comments'].map(h => (
                                            <th key={h} className="p-2 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.inductionProgramPlan.map((item, index) => (
                                        <tr key={index} className="bg-white dark:bg-slate-900/50">
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top font-semibold">{item.year}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.program}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.provider}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.duration}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top text-center">{item.numberOfOfficers}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.officerNames}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.estimatedCost}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.grandTotalCost}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.comments}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                )}

                {report.skillsAndCompetencyPlan && (
                    <ReportSection title="Skills & Competency-Based Training (10% Formal / 70% Workplace)">
                        <p className="mb-4">This plan addresses common, cross-cutting skills and competencies required across various roles within the organization. It includes both technical skills (e.g., computing) and soft skills (e.g., customer service), with a mix of internal workshops and external courses planned over a 5-year period to build a baseline of essential capabilities.</p>
                         <div className="mb-2 text-sm">
                            <p><strong>PROGRAM CATEGORY:</strong> Skills & Competency-Based Training</p>
                            <p><strong>YEAR RANGE:</strong> 2026–2030</p>
                        </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-200 dark:bg-blue-800/50">
                                    <tr>
                                        {['Year', 'Program', 'Provider', 'Duration', 'Delivery Mode', 'Year of Study', 'Total Officers', 'Unit Cost (K)', 'Est. Total Cost (K)', 'Comments'].map(h => (
                                            <th key={h} className="p-2 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.skillsAndCompetencyPlan.map((item, index) => (
                                        <tr key={index} className="bg-white dark:bg-slate-900/50">
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.year}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top font-semibold">{item.program}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.provider}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.duration}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.deliveryMode}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top text-center">{item.yearOfStudy}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top text-center">{item.totalOfficers}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.unitCost}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.estimatedTotalCost}</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.comments}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                )}

                {report.inCountryShortTermPlan && (
                    <ReportSection title="In-Country Short Term Training (10% Formal)">
                        <p className="mb-4">This table details specialized, short-term professional development opportunities available within Papua New Guinea. The plan is organized by functional division to address specific technical and operational needs, such as clinical skills for health workers or administrative skills for corporate services, leveraging local providers and expertise.</p>
                        <div className="mb-2 text-sm">
                            <p><strong>PROGRAM CATEGORY:</strong> In-Country Short Term Training</p>
                            <p><strong>YEAR RANGE:</strong> 2026–2030</p>
                        </div>
                        <div className="space-y-6">
                            {report.inCountryShortTermPlan.map((divisionGroup, index) => (
                                <div key={index}>
                                    <h4 className="font-bold text-md mb-2 text-slate-800 dark:text-slate-200">{divisionGroup.division}</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-200 dark:bg-blue-800/50">
                                                <tr>
                                                    {['Year', 'Profession', 'Program', 'Provider', 'Duration', 'Year of Study', 'Total Officers', 'Unit Cost (K)/Yr', 'Total Cost (K)', 'Comments'].map(h => (
                                                        <th key={h} className="p-2 border border-slate-300 dark:border-slate-600 font-semibold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {divisionGroup.trainingItems.map((item, itemIndex) => (
                                                    <tr key={itemIndex} className="bg-white dark:bg-slate-900/50">
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.year}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top font-semibold">{item.profession}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.program}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.provider}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.duration}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top text-center">{item.yearOfStudy}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top text-center">{item.totalOfficers}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.unitCost}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.totalCost}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 align-top">{item.comments}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                )}

                {report.overseasLongTermPlan && (
                    <ReportSection title="Overseas Long Term Training">
                        <p className="mb-4">This strategic plan identifies high-performing senior officers for long-term, formal qualifications at overseas institutions, typically funded by donor partners. The goal is to build a strong leadership pipeline and introduce international best practices by investing in the advanced education of future executives.</p>
                        <div className="mb-2 text-sm">
                            <p><strong>YEAR:</strong> 2025 - 2028</p>
                        </div>
                        <div className="space-y-6">
                            {report.overseasLongTermPlan.map((divisionGroup, index) => {
                                const yearRange = [2025, 2026, 2027, 2028];
                                const divisionTotalOfficers = divisionGroup.trainingItems.reduce((sum, item) => sum + item.totalOfficers, 0);
                                const divisionTotalCost = divisionGroup.trainingItems.reduce((sum, item) => {
                                    const cost = parseFloat(item.totalCost.replace(/[^0-9.-]+/g, ''));
                                    return sum + (isNaN(cost) ? 0 : cost);
                                }, 0);

                                return (
                                    <div key={index}>
                                        <div className="text-center font-bold text-sm bg-gray-200 dark:bg-blue-900/50 p-1 my-2 border-y border-gray-300 dark:border-blue-700">
                                            {divisionGroup.division}
                                        </div>
                                        {divisionGroup.subDivision && (
                                            <div className="text-center font-semibold text-sm bg-gray-100 dark:bg-blue-950/50 p-1 mb-2 border-b border-gray-300 dark:border-blue-700">
                                                {divisionGroup.subDivision}
                                            </div>
                                        )}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-slate-200 dark:bg-blue-800/50">
                                                    <tr>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">OFFICER</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">PROFESSION</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">PROGRAM</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">TRAINING PROVIDER</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">DURATION</th>
                                                        <th colSpan={yearRange.length} className="p-2 border border-slate-300 dark:border-slate-600 text-center">YEAR OF STUDY</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">TOTAL NO. OF OFFICERS</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">UNIT COST (K)/YR</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">TOTAL COST (K)</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 dark:border-slate-600 align-bottom">COMMENTS</th>
                                                    </tr>
                                                    <tr>
                                                        {yearRange.map(year => <th key={year} className="p-2 border border-slate-300 dark:border-slate-600 text-center">{year}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {divisionGroup.trainingItems.map((item, itemIndex) => (
                                                        <tr key={itemIndex} className="bg-white dark:bg-slate-900/50">
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.officer}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.profession}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.program}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.provider}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.duration}</td>
                                                            {yearRange.map(year => (
                                                                <td key={year} className={`p-2 border border-slate-300 dark:border-slate-600 text-center ${item.studyYears.includes(year) ? 'bg-sky-200 dark:bg-sky-800' : ''}`}></td>
                                                            ))}
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600 text-center">{item.totalOfficers}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600 text-right">{item.unitCost}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600 text-right">{item.totalCost}</td>
                                                            <td className="p-2 border border-slate-300 dark:border-slate-600">{item.comments}</td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-100 dark:bg-blue-950/50 font-bold">
                                                        <td colSpan={5} className="p-2 border border-slate-300 dark:border-slate-600 text-right">TOTAL</td>
                                                        <td colSpan={yearRange.length} className="p-2 border border-slate-300 dark:border-slate-600"></td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 text-center">{divisionTotalOfficers}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600"></td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600 text-right">K {divisionTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-600"></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Grand Total Row */}
                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left text-xs border-collapse">
                                    <tbody>
                                        <tr className="bg-slate-200 dark:bg-blue-800/50 font-extrabold text-sm">
                                            <td colSpan={5 + [2025, 2026, 2027, 2028].length} className="p-2 border border-slate-300 dark:border-slate-600 text-right">GRAND TOTAL</td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 text-center">
                                                {report.overseasLongTermPlan.reduce((sum, div) => sum + div.trainingItems.reduce((s, i) => s + i.totalOfficers, 0), 0)}
                                            </td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600"></td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600 text-right">
                                                K {report.overseasLongTermPlan.reduce((sum, div) => sum + div.trainingItems.reduce((s, i) => s + parseFloat(i.totalCost.replace(/[^0-9.-]+/g, '') || '0'), 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-2 border border-slate-300 dark:border-slate-600"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </ReportSection>
                )}
            </div>
        );
        return null;
    };


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">L&amp;D Framework Report</h1>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini. Please verify critical information.</p>
                </footer>
            </div>
        </div>
    );
};
