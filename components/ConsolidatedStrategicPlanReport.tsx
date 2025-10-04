import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING, GradingGroup } from '../types';
import { AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS, AI_TRAINING_OBJECTIVES_PROMPT_INSTRUCTIONS, AI_TRAINING_CATEGORIES_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  organizationalContext: string;
  strategicDocumentContext: string;
  assessmentProcessContext: string;
  capacityAnalysisContext: string;
  cnaCommunicationContext: string;
  onClose: () => void;
}

interface AiGeneratedContent {
    executiveSummary: string;
    conclusionAndRecommendations: string;
}

interface KeySkillsGap {
    category: 'Functional' | 'Technical' | 'Leadership/Management' | 'Compliance';
    gaps: {
        skill: string;
        description: string;
        priority: 'High' | 'Medium' | 'Low';
    }[];
}

interface TrainingObjective {
    objective: string;
    outcomes: string[];
}

interface CategorizedTrainingItem {
    trainingName: string;
    rationale: string;
    targetAudience: string;
}

interface AiTrainingCategories {
    corporate: CategorizedTrainingItem[];
    technical: CategorizedTrainingItem[];
    compliance: CategorizedTrainingItem[];
    developmental: CategorizedTrainingItem[];
}


const aiConsolidatedStrategicPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of all findings, starting with the total number of respondents and the overall state of organizational capability." },
        conclusionAndRecommendations: { type: Type.STRING, description: "A concluding summary with 3-5 key, actionable bullet points for leadership." }
    },
    required: ["executiveSummary", "conclusionAndRecommendations"]
};

const AI_INTRODUCTION_PROMPT_INSTRUCTIONS = `
You are a strategic planner for the Government of Papua New Guinea.
Your task is to write a compelling introductory section for a Consolidated Strategic Plan Report.
You will be given the agency's name and user-provided context about the organization and its strategic documents.

The introduction MUST address three key areas:
1.  **Mandate & Priorities:** Briefly state the mandate of the agency (e.g., "[Agency Name]'s mandate is to...") and its key strategic priorities. Infer these from the provided context.
2.  **Strategic Linkage:** Explicitly state how this Training Plan is linked to the agency's Corporate Plan, Annual Management Plan, and broader Government of PNG reform agendas like Vision 2050, MTDP IV, and the National Public Sector Training Policy/HRD Strategy.
3.  **Importance of Capacity Building:** Conclude with a strong statement on the critical importance of continuous capacity building and workforce development for achieving these strategic goals and improving service delivery.

The output must be a single JSON object with one key: "introductionText". The value should be a well-structured string with paragraphs separated by double newlines (\\n\\n).
`;

const aiIntroductionSchema = {
    type: Type.OBJECT,
    properties: {
        introductionText: { type: Type.STRING }
    },
    required: ["introductionText"]
};

const AI_SKILLS_GAP_PROMPT_INSTRUCTIONS = `
You are an expert HR analyst for the PNG public service. Your task is to analyze CNA data to summarize key skills gaps, classify them, and highlight priorities.

**ANALYSIS:**
1.  Review all officer data, focusing on capability ratings with a gap score >= 3, technical/leadership gaps, and TNA priorities.
2.  Synthesize these individual gaps into organizational-level skill deficiencies.

**YOUR TASK:**
For each of the four categories below, identify the top 2-3 most significant skills gaps. For each gap, provide a brief description and assign a priority level (High, Medium, Low) based on how directly it affects organizational performance.

**CATEGORIES:**
1.  **Functional:** Core operational skills needed to deliver services (e.g., financial reporting, program management).
2.  **Technical:** Specialized, job-specific skills (e.g., using specific software, scientific analysis).
3.  **Leadership/Management:** Skills related to supervising staff, strategic thinking, and managing resources.
4.  **Compliance:** Knowledge of and adherence to laws, policies, and procedures (e.g., PFMA, GESI).

**OUTPUT FORMAT:**
Return a single JSON object with one key: "keySkillsGaps". The value must be an array of objects, one for each of the four categories, strictly following the schema.
`;

const aiSkillsGapSchema = {
    type: Type.OBJECT,
    properties: {
        keySkillsGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, enum: ['Functional', 'Technical', 'Leadership/Management', 'Compliance'] },
                    gaps: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                skill: { type: Type.STRING },
                                description: { type: Type.STRING },
                                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                            },
                            required: ["skill", "description", "priority"]
                        }
                    }
                },
                required: ["category", "gaps"]
            }
        }
    },
    required: ["keySkillsGaps"]
};

const aiTrainingObjectivesSchema = {
    type: Type.OBJECT,
    properties: {
        trainingObjectives: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    objective: { type: Type.STRING },
                    outcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["objective", "outcomes"]
            }
        }
    },
    required: ["trainingObjectives"]
};

const categorizedTrainingItemSchema = {
    type: Type.OBJECT,
    properties: {
        trainingName: { type: Type.STRING },
        rationale: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
    },
    required: ["trainingName", "rationale", "targetAudience"]
};

const aiTrainingCategoriesSchema = {
    type: Type.OBJECT,
    properties: {
        corporate: { type: Type.ARRAY, items: categorizedTrainingItemSchema },
        technical: { type: Type.ARRAY, items: categorizedTrainingItemSchema },
        compliance: { type: Type.ARRAY, items: categorizedTrainingItemSchema },
        developmental: { type: Type.ARRAY, items: categorizedTrainingItemSchema },
    },
    required: ["corporate", "technical", "compliance", "developmental"]
};


// --- Sub-Components for Rendering ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; headingStyle?: 'Blue' | 'Green'; anchorId: string }> = ({ title, children, headingStyle, anchorId }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6 break-after-page" id={anchorId}>
        <h2 className={`text-xl font-bold mb-4 border-b border-slate-200 dark:border-blue-800 pb-3 ${headingStyle === 'Blue' ? 'text-blue-600 dark:text-blue-400' : headingStyle === 'Green' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'}`}>
            {title}
        </h2>
        {/* Main text remains default (black/dark gray) */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const CoverPage: React.FC<{ agencyName: string }> = ({ agencyName }) => (
    <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8 text-center flex flex-col items-center justify-center h-[500px] rounded-lg shadow-lg">
        <div className="w-24 h-24 mb-6">
            {/* Placeholder for PNG Crest */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="rgba(255,255,255,0.1)" />
                <text x="50" y="55" textAnchor="middle" className="fill-current text-white/50" fontSize="12">PNG Crest</text>
            </svg>
        </div>
        <h1 className="text-4xl font-bold">Consolidated Strategic Plan Report</h1>
        <p className="text-2xl mt-2 text-green-300">{agencyName}</p>
        <div className="mt-auto text-xs text-blue-200">
            <p>Generated via CNA Reporting App</p>
            <p>Confidential Document</p>
        </div>
    </div>
);

const TableOfContents: React.FC<{ sections: { id: string, title: string }[] }> = ({ sections }) => (
    <ReportSection title="Table of Contents" anchorId="toc">
        <ul className="list-none p-0 space-y-2">
            {sections.map(section => (
                <li key={section.id}>
                    <a href={`#${section.id}`} className="text-blue-600 hover:underline">{section.title}</a>
                </li>
            ))}
        </ul>
    </ReportSection>
);

const CnaDescription = () => (
    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-2 mb-4 p-4 bg-slate-100 dark:bg-blue-950/40 rounded-md border border-slate-200 dark:border-blue-800">
        <h3 className="text-md font-bold not-prose text-slate-800 dark:text-slate-200">About the Capability Needs Analysis (CNA)</h3>
        <p>
            The Capacity Needs Analysis (CNA) is a strategic process used to assess the current and future workforce capabilities across the organization.
        </p>
        <p>It focuses on:</p>
        <ul className="list-disc list-inside">
            <li>Understanding current capacity and functional strengths,</li>
            <li>Identifying key challenges and workforce gaps,</li>
            <li>Clarifying the difference between existing capacity and future demands,</li>
            <li>Determining how identified gaps will be addressed through learning and development.</li>
        </ul>
        <p>
            The CNA enables the organization to plan and budget for workforce development by using real data to inform strategic decision-making, align staff capacity with goals, and design a three to five-year Learning and Development (L&D) Plan.
        </p>
    </div>
);

// --- Main Component ---
export const ConsolidatedStrategicPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, organizationalContext, strategicDocumentContext, assessmentProcessContext, capacityAnalysisContext, cnaCommunicationContext, onClose }) => {
    const [aiContent, setAiContent] = useState<AiGeneratedContent | null>(null);
    const [aiIntroduction, setAiIntroduction] = useState<string | null>(null);
    const [skillsGap, setSkillsGap] = useState<KeySkillsGap[] | null>(null);
    const [trainingObjectives, setTrainingObjectives] = useState<TrainingObjective[] | null>(null);
    const [trainingCategories, setTrainingCategories] = useState<AiTrainingCategories | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // --- Data Analysis Memos ---
    const organizationalProfile = useMemo(() => {
        const totalOfficers = data.length;
        const gradingGroups = data.reduce((acc: Record<string, number>, o: OfficerRecord) => {
            const group = o.gradingGroup || 'Other';
            acc[group] = (acc[group] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const performanceLevels = data.reduce((acc: Record<string, number>, o: OfficerRecord) => {
            const level = o.performanceRatingLevel || 'Not Rated';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return { totalOfficers, gradingGroups, performanceLevels };
    }, [data]);

    // --- End Data Analysis Memos ---

    useEffect(() => {
        const generateAllContent = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                 // --- Promise for Introduction ---
                const introPrompt = `Please write the introduction for the CNA report for ${agencyName}.
                **Organizational Context:** """${organizationalContext || "N/A"}"""
                **Strategic Document Context:** """${strategicDocumentContext || "N/A"}"""
                **CNA Data Sample (for context on needs):** """${JSON.stringify(data.slice(0, 20), null, 2)}"""`;

                const introductionPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: introPrompt,
                    config: {
                        systemInstruction: AI_INTRODUCTION_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiIntroductionSchema,
                    },
                });

                // --- Promise for Executive Summary ---
                const summaryPromptText = `Please analyze the following CNA data for ${agencyName} and generate a concise executive summary and a set of recommendations.
                **USER-PROVIDED ORGANIZATIONAL CONTEXT:** """${organizationalContext || "N/A"}"""
                **USER-PROVIDED STRATEGIC DOCUMENT CONTEXT:** """${strategicDocumentContext || "N/A"}"""
                You MUST incorporate key points from these contexts into your response.
                **CNA DATA (sample):** ${JSON.stringify(data.slice(0, 50), null, 2)}`;
                
                const summaryPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: summaryPromptText,
                    config: {
                        systemInstruction: AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiConsolidatedStrategicPlanSchema,
                    },
                });

                // --- Promise for Key Skills Gap Analysis ---
                const skillsGapPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `CNA DATA:\n${JSON.stringify(data.slice(0, 150))}`,
                    config: {
                        systemInstruction: AI_SKILLS_GAP_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSkillsGapSchema,
                    },
                });

                // --- Promise for Training Objectives ---
                const trainingObjectivesPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `CNA DATA:\n${JSON.stringify(data.slice(0, 150))}`,
                    config: {
                        systemInstruction: AI_TRAINING_OBJECTIVES_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTrainingObjectivesSchema,
                    },
                });

                // --- Promise for Training Categories ---
                const trainingCategoriesPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Analyze the following CNA data:\n${JSON.stringify(data.slice(0, 150))}`,
                    config: {
                        systemInstruction: AI_TRAINING_CATEGORIES_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTrainingCategoriesSchema,
                    },
                });

                // --- Await all promises ---
                const [
                    introResponse,
                    summaryResponse,
                    skillsGapResponse,
                    trainingObjectivesResponse,
                    trainingCategoriesResponse
                ] = await Promise.all([
                    introductionPromise,
                    summaryPromise,
                    skillsGapPromise,
                    trainingObjectivesPromise,
                    trainingCategoriesPromise
                ]);
                
                setAiIntroduction(JSON.parse(introResponse.text.trim()).introductionText);
                setAiContent(JSON.parse(summaryResponse.text.trim()));
                setSkillsGap(JSON.parse(skillsGapResponse.text.trim()).keySkillsGaps);
                setTrainingObjectives(JSON.parse(trainingObjectivesResponse.text.trim()).trainingObjectives);
                setTrainingCategories(JSON.parse(trainingCategoriesResponse.text.trim()));

            } catch (e) {
                console.error("AI Consolidated Report Error:", e);
                setError("An error occurred while generating the AI content. The model's response may have been blocked or malformed.");
            } finally {
                setLoading(false);
            }
        };
        generateAllContent();
    }, [data, agencyName, organizationalContext, strategicDocumentContext, assessmentProcessContext, capacityAnalysisContext, cnaCommunicationContext]);
    
    const sectionsForToc = [
        { id: 'introduction', title: '1. Introduction' },
        { id: 'summary', title: '2. Executive Summary' },
        { id: 'skills-gap', title: '3. Key Skills Gap Analysis' },
        { id: 'training-objectives', title: '4. Training Objectives & Learning Outcomes' },
        { id: 'methodology', title: '5. Methodology & Document Context' },
        { id: 'training-categories', title: '6. Training Categories' },
        { id: 'assessment-design', title: '7. Assessment Design' },
        { id: 'participation', title: '8. Assessment Participation Summary' },
        { id: 'implementation', title: '9. Implementation Overview' },
        { id: 'capacity', title: '10. Capacity Analysis Context & Gap Matrix' },
        { id: 'communication', title: '11. Stakeholder Engagement & Communication Efforts' },
        { id: 'context', title: '12. Organizational Context' },
        { id: 'profile', title: '13. Organizational Profile' },
        { id: 'conclusion', title: '14. Conclusion and Recommendations' },
    ];
    
    const getReportDataForExport = (): ReportData => {
        const sections: ReportData['sections'] = [
            { title: '1. Introduction', content: [aiIntroduction || ''], headingStyle: 'Blue' },
            { title: 'Executive Summary', content: [aiContent?.executiveSummary || ''], headingStyle: 'Blue' },
        ];
        
        if (skillsGap) {
            const content = skillsGap.flatMap(category => [
                `\n**${category.category}**`,
                {
                    type: 'table' as const,
                    headers: ['Skill', 'Description', 'Priority'],
                    rows: category.gaps.map(g => [g.skill, g.description, g.priority])
                }
            ]);
            sections.push({ title: 'Key Skills Gap Analysis', content, headingStyle: 'Green' });
        }
        
        if (trainingObjectives) {
            const content = trainingObjectives.map(obj => 
                `**Objective:** ${obj.objective}\n**Outcomes:**\n${obj.outcomes.map(o => `- ${o}`).join('\n')}`
            );
            sections.push({ title: 'Training Objectives & Learning Outcomes', content, headingStyle: 'Blue' });
        }

        if (trainingCategories) {
            if (trainingCategories.corporate.length > 0) sections.push({ title: 'Training Category: Corporate/Compulsory', content: [{ type: 'table', headers: ['Training', 'Audience', 'Rationale'], rows: trainingCategories.corporate.map(i => [i.trainingName, i.targetAudience, i.rationale]) }] });
            if (trainingCategories.technical.length > 0) sections.push({ title: 'Training Category: Technical/Functional', content: [{ type: 'table', headers: ['Training', 'Audience', 'Rationale'], rows: trainingCategories.technical.map(i => [i.trainingName, i.targetAudience, i.rationale]) }] });
            if (trainingCategories.compliance.length > 0) sections.push({ title: 'Training Category: Compliance', content: [{ type: 'table', headers: ['Training', 'Audience', 'Rationale'], rows: trainingCategories.compliance.map(i => [i.trainingName, i.targetAudience, i.rationale]) }] });
            if (trainingCategories.developmental.length > 0) sections.push({ title: 'Training Category: Developmental/Professional', content: [{ type: 'table', headers: ['Training', 'Audience', 'Rationale'], rows: trainingCategories.developmental.map(i => [i.trainingName, i.targetAudience, i.rationale]) }] });
        }
        
        sections.push({ title: 'Conclusion and Recommendations', content: [aiContent?.conclusionAndRecommendations || ''], headingStyle: 'Blue' });
        
        return {
            title: `Consolidated Strategic Plan Report - ${agencyName}`,
            sections
        };
    };

    const handleExport = (format: 'pdf' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    const renderContent = () => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-full p-8 min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                <h2 className="mt-4 text-2xl font-bold">Generating Consolidated Report...</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Please wait while the AI compiles and analyzes the data.</p>
            </div>
        );
        if (error) return <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">Error: {error}</div>;
        
        return (
            <div ref={contentRef}>
                <CoverPage agencyName={agencyName} />
                <TableOfContents sections={sectionsForToc} />
                <ReportSection title="1. Introduction" anchorId="introduction" headingStyle="Blue">
                    <p className="whitespace-pre-wrap">{aiIntroduction || "Generating..."}</p>
                </ReportSection>
                <ReportSection title="2. Executive Summary" anchorId="summary" headingStyle="Blue">
                    <CnaDescription />
                    <h3 className="text-md font-bold not-prose mb-2">AI-Generated Summary</h3>
                    <p>{aiContent?.executiveSummary || "Generating..."}</p>
                </ReportSection>
                <ReportSection title="3. Key Skills Gap Analysis" anchorId="skills-gap" headingStyle="Green">
                    {skillsGap ? (
                        <div className="space-y-4">
                            {skillsGap.map(category => (
                                <div key={category.category}>
                                    <h4 className="font-bold text-md mb-2">{category.category}</h4>
                                    <ul className="list-disc list-inside">
                                        {category.gaps.map(gap => <li key={gap.skill}><strong>{gap.skill} (Priority: {gap.priority}):</strong> {gap.description}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : "Generating..."}
                </ReportSection>
                 <ReportSection title="4. Training Objectives & Learning Outcomes" anchorId="training-objectives" headingStyle="Blue">
                    {trainingObjectives ? (
                        <div className="space-y-4">
                            {trainingObjectives.map(item => (
                                <div key={item.objective}>
                                    <h4 className="font-bold text-md mb-2">{item.objective}</h4>
                                    <ul className="list-disc list-inside">
                                        {item.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : "Generating..."}
                </ReportSection>
                <ReportSection title="5. Methodology & Document Context" anchorId="methodology" headingStyle="Green">
                   <h3 className="text-md font-bold not-prose mb-2">Methodology</h3>
                   <p>This report utilizes a mixed-methods approach to analyze both quantitative and qualitative data gathered through the Capability Needs Analysis (CNA) survey.</p>
                   <h3 className="text-md font-bold not-prose mt-4 mb-2">User-Provided Strategic Document Context</h3>
                   <p className="whitespace-pre-wrap p-3 bg-slate-100 dark:bg-blue-950/40 rounded-md border">{strategicDocumentContext || "No context on strategic documents was provided."}</p>
                </ReportSection>
                <ReportSection title="6. Training Categories" anchorId="training-categories" headingStyle="Green">
                    <p>Based on the analysis of identified needs, all training requirements have been organized into the following strategic categories to facilitate planning and budgeting.</p>
                    {trainingCategories ? (
                        <div className="space-y-6 mt-4">
                            {Object.entries(trainingCategories).map(([category, items]) => {
                                if (!items || (items as any[]).length === 0) return null;
                                const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
                                return (
                                    <div key={category}>
                                        <h4 className="font-bold text-md mb-2">{categoryTitle} Training</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-200 dark:bg-blue-950/50">
                                                    <tr>
                                                        <th className="p-2">Training/Program Name</th>
                                                        <th className="p-2">Target Audience</th>
                                                        <th className="p-2">Rationale</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(items as CategorizedTrainingItem[]).map((item, index) => (
                                                        <tr key={index} className="border-b border-slate-200 dark:border-slate-700">
                                                            <td className="p-2 font-semibold">{item.trainingName}</td>
                                                            <td className="p-2">{item.targetAudience}</td>
                                                            <td className="p-2">{item.rationale}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : "Generating..."}
                </ReportSection>
                <ReportSection title="7. Assessment Design" anchorId="assessment-design" headingStyle="Green">
                   <p>The CNA was designed to be a comprehensive self-assessment tool. The questionnaire is structured into key sections reflecting the core operational and strategic functions of a public service agency in Papua New Guinea.</p>
                </ReportSection>
                <ReportSection title="8. Assessment Participation Summary" anchorId="participation" headingStyle="Green">
                    <h3 className="text-md font-bold not-prose mb-2">User-Provided Context</h3>
                    <p className="whitespace-pre-wrap p-3 bg-slate-100 dark:bg-blue-950/40 rounded-md border">{assessmentProcessContext || "No context on the assessment process was provided."}</p>
                </ReportSection>
                <ReportSection title="9. Implementation Overview" anchorId="implementation" headingStyle="Green">
                   <p>The findings from this report are intended to directly inform the creation of a multi-year Learning & Development (L&D) Plan.</p>
                </ReportSection>
                <ReportSection title="10. Capacity Analysis Context & Gap Matrix" anchorId="capacity" headingStyle="Green">
                    <h3 className="text-md font-bold not-prose mb-2">User-Provided Context</h3>
                    <p className="whitespace-pre-wrap p-3 bg-slate-100 dark:bg-blue-950/40 rounded-md border">{capacityAnalysisContext || "No context on the capacity analysis was provided."}</p>
                </ReportSection>
                <ReportSection title="11. Stakeholder Engagement & Communication Efforts" anchorId="communication" headingStyle="Green">
                    <h3 className="text-md font-bold not-prose mb-2">User-Provided Context</h3>
                    <p className="whitespace-pre-wrap p-3 bg-slate-100 dark:bg-blue-950/40 rounded-md border">{cnaCommunicationContext || "No context provided."}</p>
                </ReportSection>
                <ReportSection title="12. Organizational Context" anchorId="context" headingStyle="Green">
                    <h3 className="text-md font-bold not-prose mb-2">User-Provided Context</h3>
                    <p className="whitespace-pre-wrap p-3 bg-slate-100 dark:bg-blue-950/40 rounded-md border">{organizationalContext || "No context provided."}</p>
                </ReportSection>
                <ReportSection title="13. Organizational Profile" anchorId="profile" headingStyle="Green">
                    <p>Total Respondents: <strong>{organizationalProfile.totalOfficers}</strong></p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <h4 className="font-bold mb-2">Grading Group Distribution</h4>
                            <ChartComponent type="doughnut" data={{ labels: Object.keys(organizationalProfile.gradingGroups), datasets: [{ label: 'Grading Group Distribution', data: Object.values(organizationalProfile.gradingGroups), backgroundColor: ['#6B7280', '#71717A', '#A1A1AA', '#D4D4D8'] }]}} />
                        </div>
                         <div>
                            <h4 className="font-bold mb-2">Performance Level Distribution</h4>
                            <ChartComponent type="bar" data={{ labels: Object.keys(organizationalProfile.performanceLevels), datasets: [{ label: 'Count', data: Object.values(organizationalProfile.performanceLevels), backgroundColor: '#6B7280'}]}} />
                        </div>
                    </div>
                </ReportSection>
                <ReportSection title="14. Conclusion and Recommendations" anchorId="conclusion" headingStyle="Blue">
                    <div dangerouslySetInnerHTML={{ __html: aiContent?.conclusionAndRecommendations.replace(/\n/g, '<br />') || "Generating..." }} />
                </ReportSection>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold">Consolidated Strategic Plan Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as any)} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-blue-800"><XIcon className="w-6 h-6" /></button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};