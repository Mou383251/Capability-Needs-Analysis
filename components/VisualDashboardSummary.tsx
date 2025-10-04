import React, { useMemo } from 'react';
import { OfficerRecord } from '../types';
import { ESTABLISHMENT_DATA } from '../data/establishment';
import { XIcon, ChartPieIcon, UsersIcon, AcademicCapIcon, CalendarDaysIcon } from './icons';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[]; // This is cnaData
  onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string; description?: string; icon: React.ElementType }> = ({ title, value, description, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-start gap-4">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
    </div>
);

export const VisualDashboardSummary: React.FC<ReportProps> = ({ data, onClose }) => {
    
    const summary = useMemo(() => {
        const cnaData = data;
        if (!cnaData || cnaData.length === 0) return null;

        const totalEligible = cnaData.length;
        
        const totalEstablishmentNonVacant = ESTABLISHMENT_DATA.filter(e => e.status !== 'Vacant').length;
        const cnaSubmittedPercentage = totalEstablishmentNonVacant > 0 ? (cnaData.length / totalEstablishmentNonVacant) * 100 : 0;
        
        const previouslyTrainedCount = cnaData.filter(o => o.trainingHistory && o.trainingHistory.length > 0).length;
        const previouslyTrainedPercentage = totalEligible > 0 ? (previouslyTrainedCount / totalEligible) * 100 : 0;

        const trainingSchedule: Record<number, number> = { 2025: 0, 2026: 0, 2027: 0, 2028: 0, 2029: 0 };
        cnaData.forEach(officer => {
            if (officer.capabilityRatings && officer.capabilityRatings.length > 0) {
                const minScore = Math.min(...officer.capabilityRatings.map(r => r.currentScore));
                if (minScore <= 3) trainingSchedule[2025]++;
                else if (minScore <= 5) trainingSchedule[2026]++;
                else if (minScore <= 7) trainingSchedule[2027]++;
                else if (minScore === 8) trainingSchedule[2028]++;
                else if (minScore === 9) trainingSchedule[2029]++;
            }
        });

        return {
            totalEligible,
            cnaSubmittedPercentage,
            previouslyTrainedPercentage,
            trainingSchedule,
        };
    }, [data]);

    if (!summary) {
        return (
             <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No data available to generate a summary. Please import data first.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">Close</button>
                </div>
            </div>
        );
    }

    const chartData = {
        labels: Object.keys(summary.trainingSchedule),
        datasets: [{
            label: 'Number of Officers Needing Training',
            data: Object.values(summary.trainingSchedule),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: ${context.raw}`;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartPieIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visual Dashboard Summary</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            icon={UsersIcon}
                            title="Total Officers Eligible" 
                            value={summary.totalEligible.toString()}
                            description="Based on submitted CNA data"
                        />
                         <StatCard 
                            icon={ChartPieIcon}
                            title="CNA Submitted" 
                            value={`${summary.cnaSubmittedPercentage.toFixed(1)}%`}
                            description="of total non-vacant positions"
                        />
                         <StatCard 
                            icon={AcademicCapIcon}
                            title="Previously Undergone Training" 
                            value={`${summary.previouslyTrainedPercentage.toFixed(1)}%`}
                            description="of eligible officers"
                        />
                    </div>
                     <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                             <CalendarDaysIcon className="w-5 h-5" />
                             Projected Training Schedule (2025-2029)
                         </h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Based on the urgency of the most critical capability gap identified for each officer.</p>
                         <div className="relative h-72">
                            <ChartComponent type="bar" data={chartData} options={chartOptions} />
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
