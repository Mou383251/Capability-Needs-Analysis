import React, { useMemo, useState } from 'react';
import { OfficerRecord, CorporatePlanAnalysis } from '../types';
import { XIcon, DocumentChartBarIcon, ChevronDownIcon, ExclamationTriangleIcon } from './icons';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[];
  onClose: () => void;
}

const TARGET_QUESTION_CODE = 'A2';

const StatCard: React.FC<{ title: string; value: string; description?: string; colorClass: string }> = ({ title, value, description, colorClass }) => (
    <div className={`p-4 rounded-lg text-center ${colorClass}`}>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs font-semibold uppercase">{title}</p>
        {description && <p className="text-sm font-medium">{description}</p>}
    </div>
);

export const CorporatePlanAnalysisReport: React.FC<ReportProps> = ({ data, onClose }) => {
    const [isLowListExpanded, setIsLowListExpanded] = useState(false);

    const analysis: CorporatePlanAnalysis | null = useMemo(() => {
        if (!data || data.length === 0) return null;

        const ratings: { name: string; score: number; division: string }[] = [];

        data.forEach(officer => {
            const rating = officer.capabilityRatings.find(r => r.questionCode === TARGET_QUESTION_CODE);
            if (rating) {
                ratings.push({ name: officer.name, score: rating.currentScore, division: officer.division });
            }
        });
        
        if (ratings.length === 0) return null;

        const totalRespondents = ratings.length;
        const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
        const averageScore = totalScore / totalRespondents;

        let classification: 'Low' | 'Average' | 'High';
        if (averageScore <= 4) classification = 'Low';
        else if (averageScore <= 7) classification = 'Average';
        else classification = 'High';

        const topParticipants = [...ratings]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        
        let highCount = 0;
        let averageCount = 0;
        let lowCount = 0;
        const lowUnderstandingOfficers: { name: string; score: number; division: string }[] = [];

        ratings.forEach(r => {
            if (r.score >= 8) highCount++;
            else if (r.score >= 5) averageCount++;
            else {
                lowCount++;
                lowUnderstandingOfficers.push(r);
            }
        });

        lowUnderstandingOfficers.sort((a,b) => a.score - b.score);

        return {
            averageScore,
            classification,
            topParticipants,
            totalRespondents,
            highCount,
            averageCount,
            lowCount,
            lowUnderstandingOfficers
        };
    }, [data]);

    const classificationStyles = {
        Low: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
        Average: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
        High: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    };
    
    const renderContent = () => {
        if (!analysis) {
             return (
                <div className="text-center p-8">
                    <p className="text-lg text-gray-500">No data available for Corporate Plan understanding (Code: {TARGET_QUESTION_CODE}).</p>
                </div>
            );
        }
        
        const { totalRespondents, highCount, averageCount, lowCount, lowUnderstandingOfficers } = analysis;
        const highPercent = totalRespondents > 0 ? ((highCount / totalRespondents) * 100).toFixed(0) : "0";
        const avgPercent = totalRespondents > 0 ? ((averageCount / totalRespondents) * 100).toFixed(0) : "0";
        const lowPercent = totalRespondents > 0 ? ((lowCount / totalRespondents) * 100).toFixed(0) : "0";

        const distributionChartData = {
            labels: [`High Understanding (8-10)`, `Average Understanding (5-7)`, `Low Understanding (1-4)`],
            datasets: [{
                label: 'Number of Officers',
                data: [highCount, averageCount, lowCount],
                backgroundColor: ['rgba(22, 163, 74, 0.7)', 'rgba(234, 179, 8, 0.7)', 'rgba(220, 38, 38, 0.7)'],
                borderColor: ['#16A34A', '#EAB308', '#DC2626'],
                borderWidth: 1,
            }]
        };

        return (
            <div className="space-y-6">
                <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Overall Summary</h2>
                         <div className="text-right">
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{analysis.averageScore.toFixed(2)}</p>
                            <p className={`px-3 py-1 mt-1 text-sm font-semibold rounded-full inline-block ${classificationStyles[analysis.classification]}`}>
                                Overall Classification: {analysis.classification}
                            </p>
                        </div>
                    </div>
                     <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">🏅 Top 5 Participants</h3>
                        <ol className="list-decimal list-inside space-y-2 bg-gray-100 dark:bg-blue-950/40 p-4 rounded-md">
                            {analysis.topParticipants.map((p, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <span>{p.name}</span>
                                    <span className="font-bold text-lg">{p.score}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Distribution of Understanding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="High Understanding" value={highCount.toString()} description={`${highPercent}% of respondents`} colorClass="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" />
                        <StatCard title="Average Understanding" value={averageCount.toString()} description={`${avgPercent}% of respondents`} colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" />
                        <StatCard title="Low Understanding" value={lowCount.toString()} description={`${lowPercent}% of respondents`} colorClass="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" />
                    </div>
                    <div className="relative h-64">
                         <ChartComponent type="bar" data={distributionChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                     {lowUnderstandingOfficers.length > 0 && (
                        <div className="mt-6">
                            <button 
                                onClick={() => setIsLowListExpanded(!isLowListExpanded)}
                                className="w-full flex justify-between items-center p-3 text-left font-semibold text-red-800 dark:text-red-200 bg-red-100/50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40"
                            >
                                <span className="flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5" /> List of Officers with Low Understanding ({lowUnderstandingOfficers.length})</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isLowListExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isLowListExpanded && (
                                <div className="overflow-auto border border-red-200 dark:border-red-800 rounded-b-md max-h-60 mt-0">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-red-100 dark:bg-red-900/30 sticky top-0"><tr><th className="p-2">Name</th><th className="p-2">Division</th><th className="p-2 text-center">Score</th></tr></thead>
                                        <tbody className="bg-white dark:bg-blue-950/50">
                                            {lowUnderstandingOfficers.map((o, i) => (
                                                <tr key={i} className="border-t border-red-200 dark:border-red-800"><td className="p-2">{o.name}</td><td className="p-2">{o.division}</td><td className="p-2 text-center font-bold">{o.score}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Corporate Plan Understanding (A2)</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-blue-800" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
                 <footer className="text-center p-2 border-t border-gray-200 dark:border-blue-800 flex-shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Analysis based on imported data for question code {TARGET_QUESTION_CODE}.</p>
                </footer>
            </div>
        </div>
    );
};