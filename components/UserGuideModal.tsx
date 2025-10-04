import React from 'react';
import { XIcon } from './icons';
import { QUESTION_TEXT_MAPPING } from '../types';

interface ModalProps {
    onClose: () => void;
}

const GuideSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-300 dark:border-slate-700 pb-2">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-2">
            {children}
        </div>
    </div>
);

const QuestionMappingSection: React.FC = () => {
    const hasQuestions = Object.keys(QUESTION_TEXT_MAPPING).length > 0;

    if (!hasQuestions) {
        return (
            <>
                <h5 className="font-bold mt-3 text-slate-700 dark:text-slate-200">Sections A-H: Capability Ratings</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    No questionnaire is currently configured. The application will not be able to process capability ratings from imported files.
                </p>
            </>
        );
    }
    
    const groupedQuestions = Object.entries(QUESTION_TEXT_MAPPING).reduce((acc, [code, text]) => {
        const sectionChar = code.charAt(0);
        let sectionName = `Section ${sectionChar}`;
        
        switch(sectionChar) {
            case 'A': sectionName = 'Section A: Strategic Alignment'; break;
            case 'B': sectionName = 'Section B: Operational Effectiveness & Values'; break;
            case 'C': sectionName = 'Section C: Leadership & Development'; break;
            case 'D': sectionName = 'Section D: Performance Management'; break;
            case 'E': sectionName = 'Section E: ICT Capability'; break;
            case 'F': sectionName = 'Section F: Public Finance Management'; break;
            case 'G': sectionName = 'Section G: Communication & Stakeholder Engagement'; break;
            case 'H': sectionName = 'Section H: Training Needs Analysis'; break;
            default: sectionName = 'Other';
        }

        if (!acc[sectionName]) {
            acc[sectionName] = [];
        }
        acc[sectionName].push({ code, text });
        return acc;
    }, {} as Record<string, { code: string, text: string }[]>);

    const sectionOrder = [
        'Section A: Strategic Alignment',
        'Section B: Operational Effectiveness & Values',
        'Section C: Leadership & Development',
        'Section D: Performance Management',
        'Section E: ICT Capability',
        'Section F: Public Finance Management',
        'Section G: Communication & Stakeholder Engagement',
        'Section H: Training Needs Analysis',
    ];

    return (
        <>
            {sectionOrder.map(sectionName => {
                const questions = groupedQuestions[sectionName];
                if (!questions) return null;

                return (
                    <div key={sectionName}>
                        <p className="font-semibold mt-2">{sectionName}</p>
                        {sectionName === 'Section H: Training Needs Analysis' && (
                            <p className="text-xs italic text-slate-500 mb-2">
                                Note: This section uses mixed input types (Yes/No, Text, Multi-select, and 1-10 Ratings for H2, H5, H6). The application parses these different types accordingly.
                            </p>
                        )}
                        <ul className="text-xs list-disc list-inside">
                            {questions.map(({ code, text }) => (
                                <li key={code}>
                                    <strong>{code}:</strong> {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </>
    );
};

export const UserGuideModal: React.FC<ModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help & User Guide</h1>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close user guide">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">
                    <GuideSection title="Your L&D Assistant">
                        <p>This system is an intelligent assistant that automates, manages, and reports on:</p>
                        <ul className="list-none pl-0 my-2 space-y-1">
                            <li>✅ Learning & Development Plans (individual training plans)</li>
                            <li>✅ Eligible Officers Lists</li>
                            <li>✅ Establishment & CNA Checklists</li>
                        </ul>
                        <p>...for ANY Branch, Division, or Department in an organization.</p>
                        <p className="mt-2 font-semibold">This single system works for executive, corporate, technical, or support divisions.</p>
                    </GuideSection>
                    
                    <GuideSection title="What is a Capability Needs Analysis (CNA)?">
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
                    </GuideSection>
                    
                    <GuideSection title="Key Reports & Tools">
                        <p>This dashboard uses advanced analytics to analyze your Capability Needs Analysis (CNA) data and generate several insightful reports. Here's a quick rundown:</p>
                        <ul>
                            <li><strong>L&D Report:</strong> Provides a comprehensive plan based on identified gaps, including intervention plans and ROI projections.</li>
                            <li><strong>5-Year Plan:</strong> Offers a long-term strategic roadmap for capability development.</li>
                            <li><strong>Competency Report:</strong> Maps your workforce's skills against key PNG public sector competency domains.</li>
                            <li><strong>Gap Analysis:</strong> Pinpoints the most urgent skill gaps and recommends PNG-contextual solutions.</li>
                            <li><strong>Talent Segmentation:</strong> Clusters your staff into performance-based groups to inform talent management.</li>
                            <li><strong>Strategic Recommendations:</strong> Gives high-level advice on L&D investment, systems integration, and HR alignment.</li>
                        </ul>
                    </GuideSection>

                    <GuideSection title="Implementing Learning Interventions in PNG">
                        <p>The system-generated reports recommend solutions based on the 70:20:10 model, which is highly effective in the PNG public sector context.</p>
                        
                        <h4 className="font-bold">The 70:20:10 Model in Practice</h4>
                        <ul>
                            <li><strong>70% On-the-Job Learning:</strong> This is the most critical part. It involves learning through doing. Encourage managers to create opportunities for staff to take on 'stretch assignments' or assist in tasks slightly above their current skill level. This is a cost-effective way to build capability, especially in provincial and remote settings.</li>
                            <li><strong>20% Social Learning:</strong> Learning from others is key. Facilitate mentorship programs between senior and junior officers. Create 'Communities of Practice' or informal working groups where staff from different divisions can share knowledge on common challenges.</li>
                            <li><strong>10% Formal Learning:</strong> This includes workshops, courses, and certifications. While important, it should be targeted. Use the report's findings to select relevant courses from institutions like the Pacific Institute of Leadership and Governance (PILAG) or reputable online providers.</li>
                        </ul>
                        
                        <h4 className="font-bold mt-4">Creating Individual Learning Plans (ILPs)</h4>
                        <p>The Officer Development Summary provides a list of suggested learning interventions for each identified gap. This can be the foundation for an official ILP, which should be discussed and agreed upon between the officer and their line manager, and linked to their Staff Performance Appraisal (SPA).</p>
                    </GuideSection>

                    <GuideSection title="Data Interpretation & Business Rules">
                        <p className="mb-4">
                           The application processes two distinct types of ratings from your survey data. The core rule is that <strong>Capability Ratings (1-10)</strong> and <strong>SPA Ratings (1-5)</strong> are handled separately in all analyses.
                        </p>
                        
                        <div className="overflow-x-auto my-4">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-200 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">Rating Type</th>
                                        <th className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">Scale</th>
                                        <th className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">Stored As</th>
                                        <th className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">Purpose</th>
                                        <th className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">Logic Path</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="border border-slate-300 dark:border-slate-600 p-2 font-bold">SPA Rating</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">1–5</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2"><code>PerformanceRating</code></td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">Overall Performance Scoring</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">No gap calculation</td>
                                    </tr>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="border border-slate-300 dark:border-slate-600 p-2 font-bold">Capability Rating</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">1–10</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2"><code>CurrentRating</code></td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">Self-assessed Skills/Knowledge</td>
                                        <td className="border border-slate-300 dark:border-slate-600 p-2">Gap = 10 – Current</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p>Below is a more detailed explanation of how each rating system is classified.</p>

                        <h4 className="font-bold mt-4">SPA Rating (1-5 Scale)</h4>
                        <p>
                            The <strong>Staff Performance Appraisal (SPA) Rating</strong> is used to assess overall employee performance. The application automatically classifies this 1-5 score into a descriptive level:
                        </p>
                        <ul>
                            <li><span className="font-semibold text-green-700 dark:text-green-400">Rating 5:</span> Classified as <span className="font-bold">'Well Above Required'</span>.</li>
                            <li><span className="font-semibold text-teal-700 dark:text-teal-400">Rating 4:</span> Classified as <span className="font-bold">'Above Required'</span>.</li>
                             <li><span className="font-semibold text-amber-700 dark:text-amber-400">Rating 3:</span> Classified as <span className="font-bold">'At Required Level'</span>.</li>
                            <li><span className="font-semibold text-orange-700 dark:text-orange-400">Rating 2:</span> Classified as <span className="font-bold">'Below Required Level'</span>.</li>
                            <li><span className="font-semibold text-red-700 dark:text-red-400">Rating 1:</span> Classified as <span className="font-bold">'Well Below Required Level'</span>.</li>
                        </ul>
                        <p>This performance rating is used for dashboards and reports but is separate from capability gap analysis.</p>


                        <h4 className="font-bold mt-4">Capability Rating (1-10 Scale)</h4>
                        <p>
                           The <strong>Capability Rating</strong> captures an employee’s self-assessed current capability for a specific skill. The application operates on two parallel classification systems for these scores:
                        </p>
                        <h5 className="font-semibold mt-2">1. Rating Interpretation (Proficiency Level)</h5>
                        <p>This describes the absolute level of capability based on the score provided:</p>
                        <ul>
                            <li><span className="font-semibold">Score 1-4:</span> Classified as <span className="font-bold">'Low'</span> capability.</li>
                            <li><span className="font-semibold">Score 5-7:</span> Classified as <span className="font-bold">'Moderate'</span> capability.</li>
                             <li><span className="font-semibold">Score 8-10:</span> Classified as <span className="font-bold">'High'</span> capability.</li>
                        </ul>

                        <h5 className="font-semibold mt-2">2. Gap Analysis (Learning Priority)</h5>
                        <p>This calculates the gap against a fixed target of 10 to determine training needs:</p>
                        <ul>
                            <li><strong>Gap Score:</strong> This is calculated as: <strong>10 (Realistic Score) - Current Score</strong>.</li>
                            <li><strong>Gap Category:</strong> The Gap Score is used to classify the urgency and type of intervention needed. A higher gap score means a higher priority.</li>
                        </ul>
                    </GuideSection>
                    <GuideSection title="Questionnaire Mapping">
                        <p>The application is designed to analyze data from a specific CNA questionnaire. Your imported Excel or PDF file must contain columns with the following headers (case-insensitive) for the system to correctly identify and process capability ratings:</p>
                        <QuestionMappingSection />
                    </GuideSection>
                </main>
            </div>
        </div>
    );
};