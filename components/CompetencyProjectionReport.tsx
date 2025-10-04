import React, { useMemo, useState } from 'react';
import { OfficerRecord, CompetencyProjection, QUESTION_TEXT_MAPPING, LearningInterventions } from '../types';
import { XIcon, ChartBarSquareIcon, ChevronDownIcon } from './icons';
import { ChartComponent } from './charts';
// FIX: Add missing imports for export functionality.
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string; subValue?: string; className?: string }> = ({ title, value, subValue, className = '' }) => (
    <div className={`p-4 rounded-lg text-center ${className}`}>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs font-semibold uppercase text-gray-500">{title}</p>
        {subValue && <p className="text-sm font-medium">{subValue}</p>}
    </div>
);

const AccordionItem: React.FC<{ title: React.ReactNode; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-gray-200 dark:border-blue-800 last:border-b-0">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-blue-900"
            aria-expanded={isOpen}
        >
            <span className="flex-1">{title}</span>
            <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`grid grid-rows-[0fr] transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : ''}`}>
            <div className="overflow-hidden">
                <div className="p-4 pt-0 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-blue-900/50">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-blue-800 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">{children}</div>
    </div>
);

export const CompetencyProjectionReport: React.FC<ReportProps> = ({ data, onClose }) => {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    const analysis: CompetencyProjection | null = useMemo(() => {
        if (!data || data.length === 0) return null;

        const generateInterventions = (questionText: string, averageScore: number): LearningInterventions => {
            const topic = questionText.replace(/Rate out of 10 –|The organisation has a|The organization|I know|I have a clear understanding of/gi, '').trim().toLowerCase();
            
            if (averageScore < 7) { // Low score -> foundational training
                return {
                    formal10: `Enroll the officer(s) with low proficiency in formal training on ${topic} (e.g., workshops, online courses).`,
                    social20: `Establish peer-support groups for officers to share challenges and solutions regarding ${topic}.`,
                    experiential70: `Assign structured, supervised tasks that involve applying principles of ${topic}.`
                };
            } else if (averageScore < 9) { // Fair score -> enhancement
                return {
                    formal10: `Provide access to advanced online courses or specialized seminars on ${topic}.`,
                    social20: `Assign the officer(s) with fair proficiency to a mentoring program with high-performing peers or managers.`,
                    experiential70: `Delegate tasks with increased responsibility related to ${topic} to solidify skills.`
                };
            } else { // High score -> leverage expertise
                return {
                    formal10: `Sponsor top performers for expert certifications or 'train-the-trainer' programs in ${topic}.`,
                    social20: `Designate high-performers as Subject Matter Experts (SMEs) to coach colleagues and lead discussions on ${topic}.`,
                    experiential70: `Leverage the high-performing officer(s) as peer coaches or mentors to reinforce on-the-job learning for all.`
                };
            }
        };


        const ratingsByCode: Record<string, number[]> = {};
        let totalRatings = 0;

        data.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if (!ratingsByCode[rating.questionCode]) {
                    ratingsByCode[rating.questionCode] = [];
                }
                ratingsByCode[rating.questionCode].push(rating.currentScore);
                totalRatings++;
            });
        });

        if (totalRatings === 0) return null;

        let lowCount = 0;
        let fairCount = 0;
        let highCount = 0;

        const perQuestionAnalysis = Object.entries(ratingsByCode).map(([code, scores]) => {
            const questionLow = scores.filter(s => s >= 1 && s <= 6).length;
            const questionFair = scores.filter(s => s >= 7 && s <= 8).length;
            const questionHigh = scores.filter(s => s >= 9 && s <= 10).length;

            lowCount += questionLow;
            fairCount += questionFair;
            highCount += questionHigh;
            
            const totalResponses = scores.length;
            const sum = scores.reduce((a, b) => a + b, 0);
            const averageRating = totalResponses > 0 ? sum / totalResponses : 0;
            
            // FIX: This variable was unused, but logic is fine. The enhanced interventions below are more specific.
            // const baseInterventions = generateInterventions(QUESTION_TEXT_MAPPING[code] || code, averageRating);

            // Enhance interventions with counts
            const learningInterventions: LearningInterventions = {
                formal10: `Enroll the ${questionLow} officer(s) with low proficiency in formal training on this topic.`,
                social20: `Assign the ${questionFair} officer(s) with fair proficiency to a mentoring program.`,
                experiential70: `Leverage the ${questionHigh} high-performing officer(s) as peer coaches or mentors to reinforce on-the-job learning.`
            };


            return {
                questionCode: code,
                questionText: QUESTION_TEXT_MAPPING[code] || 'Unknown Question',
                averageRating,
                lowCount: questionLow,
                fairCount: questionFair,
                highCount: questionHigh,
                totalResponses,
                learningInterventions,
            };
        }).sort((a,b) => a.questionCode.localeCompare(b.questionCode, undefined, { numeric: true }));

        return {
            totalRatings,
            lowCount,
            fairCount,
            highCount,
            perQuestionAnalysis,
        };
    }, [data]);

    const topImprovementAreas = useMemo(() => {
        if (!analysis) return [];
        return [...analysis.perQuestionAnalysis]
            .sort((a, b) => a.averageRating - b.averageRating)
            .slice(0, 3);
    }, [analysis]);
    
    const renderContent = () => {
        if (!analysis) {
             return (
                <div className="text-center p-8">
                    <p className="text-lg text-gray-500">No capability rating data available to generate a projection.</p>
                </div>
            );
        }

        const { totalRatings, lowCount, fairCount, highCount, perQuestionAnalysis } = analysis;
        const lowPercentage = totalRatings > 0 ? (lowCount / totalRatings * 100).toFixed(1) : "0";
        const fairPercentage = totalRatings > 0 ? (fairCount / totalRatings * 100).toFixed(1) : "0";
        const highPercentage = totalRatings > 0 ? (highCount / totalRatings * 100).toFixed(1) : "0";
        
        const distributionChartData = {
            labels: [`Low (1-6) - ${lowPercentage}%`, `Fair (7-8) - ${fairPercentage}%`, `High (9-10) - ${highPercentage}%`],
            datasets: [{
                label: 'Competency Ratings Distribution',
                data: [lowCount, fairCount, highCount],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',   // Red for Low
                    'rgba(59, 130, 246, 0.7)',  // Blue for Fair
                    'rgba(22, 163, 74, 0.7)',   // Green for High
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(22, 163, 74, 1)',
                ],
                borderWidth: 1
            }]
        };

        return (
            <div className="space-y-6">
                <ReportSection title="Overall Competency Distribution">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <StatCard title="Total Ratings" value={totalRatings.toString()} className="bg-slate-100 dark:bg-blue-950" />
                        <StatCard title="Low Proficiency" value={`${lowPercentage}%`} subValue={`${lowCount} ratings`} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" />
                        <StatCard title="Fair Proficiency" value={`${fairPercentage}%`} subValue={`${fairCount} ratings`} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" />
                        <StatCard title="High Proficiency" value={`${highPercentage}%`} subValue={`${highCount} ratings`} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" />
                    </div>
                     <div className="relative h-64 md:h-80"><ChartComponent type="doughnut" data={distributionChartData} /></div>
                </ReportSection>
                
                 <ReportSection title="Top Improvement Areas (Lowest Average Scores)">
                     <div className="space-y-4">
                        {topImprovementAreas.map(item => (
                            <div key={item.questionCode} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500">
                                <h4 className="font-bold">{item.questionCode}: {item.questionText}</h4>
                                <p className="text-sm">Average Score: <strong className="text-yellow-700 dark:text-yellow-300">{item.averageRating.toFixed(2)}</strong></p>
                            </div>
                        ))}
                    </div>
                </ReportSection>

                <ReportSection title="Per-Question Analysis & Recommended Interventions">
                     <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 overflow-hidden">
                        {perQuestionAnalysis.map(item => (
                            <AccordionItem
                                key={item.questionCode}
                                isOpen={openAccordion === item.questionCode}
                                onToggle={() => setOpenAccordion(openAccordion === item.questionCode ? null : item.questionCode)}
                                title={
                                    <div className="flex items-center gap-4 w-full">
                                        <span className="font-mono text-blue-600 dark:text-blue-400">{item.questionCode}</span>
                                        <span className="flex-1 truncate">{item.questionText}</span>
                                        <span className="text-sm font-semibold ml-auto">Avg: {item.averageRating.toFixed(2)}</span>
                                    </div>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold mb-2">Response Distribution</h4>
                                        <div className="space-y-1 text-xs">
                                            <p><strong>Low (1-6):</strong> {item.lowCount} responses</p>
                                            <p><strong>Fair (7-8):</strong> {item.fairCount} responses</p>
                                            <p><strong>High (9-10):</strong> {item.highCount} responses</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-2">Recommended 70:20:10 Interventions</h4>
                                        <div className="space-y-2 text-xs">
                                            <p><strong>10% (Formal):</strong> {item.learningInterventions.formal10}</p>
                                            <p><strong>20% (Social):</strong> {item.learningInterventions.social20}</p>
                                            <p><strong>70% (Experiential):</strong> {item.learningInterventions.experiential70}</p>
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                        ))}
                    </div>
                </ReportSection>
            </div>
        );
    };

    const getReportDataForExport = (): ReportData => {
        if (!analysis) throw new Error("Analysis not available");

        const summaryRows = [
            ['Total Ratings Analyzed', analysis.totalRatings],
            ['Ratings in "Low" Category (1-6)', analysis.lowCount],
            ['Ratings in "Fair" Category (7-8)', analysis.fairCount],
            ['Ratings in "High" Category (9-10)', analysis.highCount],
        ];

        const breakdownHeaders = ['Code', 'Question', 'Avg Rating', 'Low Count', 'Fair Count', 'High Count', 'Responses', '70% Intervention', '20% Intervention', '10% Intervention'];
        const breakdownRows = analysis.perQuestionAnalysis.map(q => [
            q.questionCode,
            q.questionText,
            q.averageRating.toFixed(2),
            q.lowCount,
            q.fairCount,
            q.highCount,
            q.totalResponses,
            q.learningInterventions.experiential70,
            q.learningInterventions.social20,
            q.learningInterventions.formal10,
        ]);

        return {
            title: "Competency Projection Report",
            sections: [
                {
                    title: "Overall Competency Distribution",
                    content: [{
                        type: 'table',
                        headers: ['Metric', 'Value'],
                        rows: summaryRows
                    }]
                },
                {
                    title: "Per-Question Analysis and Recommended Interventions",
                    content: [{
                        type: 'table',
                        headers: breakdownHeaders,
                        rows: breakdownRows,
                    }],
                    orientation: 'landscape'
                }
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
             console.error("Export failed:", e);
             alert("Could not export report.");
        }
    };
    
    // FIX: Added the main return statement for the modal component structure.
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Competency Projection Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-blue-800" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analysis based on current CNA data.</p>
                </footer>
            </div>
        </div>
    );
};